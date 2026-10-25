import { NODE_TYPES, behaviorOf, tagsOf } from '../nodeDefs/nodeTypes';

// Steady-state, closed-form view of a design at a given load. The live engine
// answers "what happens over time"; this answers "what does it look like at
// N req/s" instantly, which is what scoring and capacity planning need.
//
// Flow rules mirror engine.js so numbers line up with what Run shows:
//   generator / load balancer / queue  -> split evenly across outgoing edges
//   cache                              -> hits end here, misses fan out
//   everything else                    -> fan out the full served flow to every edge

const TARGET_UTILIZATION = 0.7; // headroom used when recommending replica counts
const MAX_LATENCY_FACTOR = 12;

export function isSimNode(node) {
  return node.data?.kind !== 'note';
}

function avgServiceMs(cfg, behavior) {
  const base = (cfg.baseLatencyMs ?? 0) + (cfg.jitterMs ?? 0) / 2;
  if (behavior === 'cache') return base + (cfg.missPenaltyMs ?? 0) * (1 - (cfg.cacheHitRate ?? 0));
  return base;
}

// Requests/second one replica can complete: concurrent slots / service time (Little's law).
export function perReplicaQps(kind, cfg) {
  const behavior = behaviorOf(kind);
  if (behavior === 'ratelimiter') return cfg.capacity ?? Infinity;
  if (behavior === 'queue') return cfg.drainRate ?? Infinity;
  if (cfg.capacity === undefined || behavior === 'loadbalancer') return Infinity;
  const serviceSec = Math.max(0.0005, avgServiceMs(cfg, behavior) / 1000);
  return cfg.capacity / serviceSec;
}

// Queueing delay multiplier for a c-server station at utilization rho
// (Sakasegawa's M/M/c approximation). Saturated stations get a flat penalty.
function queueingFactor(rho, servers) {
  if (rho <= 0) return 1;
  if (rho >= 1) return MAX_LATENCY_FACTOR;
  const c = Math.max(1, Math.min(servers, 500));
  const wait = Math.pow(rho, Math.sqrt(2 * (c + 1)) - 1) / (c * (1 - rho));
  return Math.min(MAX_LATENCY_FACTOR, 1 + wait);
}

function topoOrder(ids, outEdges, indegree) {
  const deg = new Map(indegree);
  const order = [];
  const ready = ids.filter((id) => (deg.get(id) ?? 0) === 0);
  while (ready.length) {
    const id = ready.shift();
    order.push(id);
    for (const e of outEdges.get(id) || []) {
      const d = deg.get(e.target) - 1;
      deg.set(e.target, d);
      if (d === 0) ready.push(e.target);
    }
  }
  const leftovers = ids.filter((id) => !order.includes(id));
  return { order: [...order, ...leftovers], hasCycle: leftovers.length > 0 };
}

// entryQps: total offered load. When given it replaces the generators' own rates
// (split in proportion to them); otherwise the generators' configured rates are used.
export function analyzeDesign(graph, { entryQps } = {}) {
  const nodes = graph.nodes.filter(isSimNode);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges = graph.edges.filter((e) => byId.has(e.source) && byId.has(e.target));
  const outEdges = new Map(nodes.map((n) => [n.id, []]));
  const inEdges = new Map(nodes.map((n) => [n.id, []]));
  for (const e of edges) {
    outEdges.get(e.source).push(e);
    inEdges.get(e.target).push(e);
  }
  const indegree = new Map(nodes.map((n) => [n.id, inEdges.get(n.id).length]));

  // ----- sources and offered load -----
  let sources = nodes.filter((n) => n.data.kind === 'generator');
  if (sources.length === 0) {
    sources = nodes.filter((n) => indegree.get(n.id) === 0 && outEdges.get(n.id).length > 0);
  }
  const offered = new Map();
  const configuredTotal = sources.reduce((sum, n) => sum + (n.data.config?.rate ?? 0), 0);
  for (const s of sources) {
    const share = configuredTotal > 0 ? (s.data.config?.rate ?? 0) / configuredTotal : 1 / sources.length;
    offered.set(s.id, entryQps !== undefined ? entryQps * share : (s.data.config?.rate ?? 0));
  }
  const offeredTotal = [...offered.values()].reduce((a, b) => a + b, 0);

  // ----- propagate flow -----
  const inflow = new Map(nodes.map((n) => [n.id, offered.get(n.id) ?? 0]));
  const { order, hasCycle } = topoOrder(nodes.map((n) => n.id), outEdges, indegree);
  const result = {};
  let successQps = 0;
  let failedQps = 0;

  for (const id of order) {
    const node = byId.get(id);
    const kind = node.data.kind;
    const behavior = behaviorOf(kind);
    const cfg = node.data.config || {};
    const replicas = cfg.replicas ?? 1;
    const inQps = inflow.get(id);
    const outs = outEdges.get(id);

    const perReplica = kind === 'generator' || kind === 'client' ? Infinity : perReplicaQps(kind, cfg);
    const capacityQps = behavior === 'ratelimiter' ? perReplica : perReplica * replicas;
    const utilization = capacityQps === Infinity ? 0 : inQps / Math.max(capacityQps, 1e-9);
    const accepted = Math.min(inQps, capacityQps);
    const served = kind === 'generator' ? accepted : accepted * (1 - (cfg.failureRate ?? 0));
    failedQps += inQps - served;

    let forward = served;
    if (behavior === 'cache') {
      const hits = served * (cfg.cacheHitRate ?? 0);
      successQps += outs.length ? hits : served;
      forward = served - hits;
    } else if (outs.length === 0) {
      successQps += served;
    }

    const splits = kind === 'generator' || behavior === 'loadbalancer' || behavior === 'queue';
    for (const e of outs) {
      const q = splits ? forward / outs.length : forward;
      inflow.set(e.target, inflow.get(e.target) + q);
    }

    const servers = (cfg.capacity ?? 1) * replicas;
    const factor = behavior === 'queue' || capacityQps === Infinity ? 1 : queueingFactor(utilization, servers);
    const meanMs = kind === 'generator' || kind === 'client' ? 0 : avgServiceMs(cfg, behavior) * factor;
    const p99Base = (cfg.baseLatencyMs ?? 0) + (cfg.jitterMs ?? 0)
      + (behavior === 'cache' && (cfg.cacheHitRate ?? 0) < 0.99 ? cfg.missPenaltyMs ?? 0 : 0);
    const p99Ms = kind === 'generator' || kind === 'client' ? 0 : p99Base * factor;

    const scalable = cfg.replicas !== undefined && behavior !== 'ratelimiter';
    const neededReplicas = scalable && perReplica !== Infinity
      ? Math.max(1, Math.ceil(inQps / (perReplica * TARGET_UTILIZATION)))
      : null;

    result[id] = {
      id,
      kind,
      label: node.data.label,
      inQps,
      servedQps: served,
      droppedQps: inQps - accepted,
      perReplicaQps: perReplica,
      capacityQps,
      replicas,
      utilization,
      latencyMs: meanMs,
      p99Ms,
      saturated: utilization > 1,
      bottleneck: utilization > 0.8,
      neededReplicas,
    };
  }

  // ----- critical path latency (longest synchronous path from any source) -----
  // Work behind a queue happens after the caller already got an answer, so a node
  // whose every input comes off a queue (or other async-only node) is excluded.
  const meanTo = new Map();
  const p99To = new Map();
  const hopsTo = new Map();
  const asyncOnly = new Set();
  const isAsyncEdge = (e) => behaviorOf(byId.get(e.source).data.kind) === 'queue' || asyncOnly.has(e.source);
  for (const id of order) {
    const preds = inEdges.get(id);
    if (preds.length > 0 && preds.every(isAsyncEdge)) {
      asyncOnly.add(id);
      continue;
    }
    let bestMean = 0;
    let bestP99 = 0;
    let bestHops = 0;
    for (const e of preds) {
      if (!meanTo.has(e.source) || isAsyncEdge(e)) continue;
      const edgeMs = e.data?.latencyMs ?? 5;
      bestMean = Math.max(bestMean, meanTo.get(e.source) + edgeMs);
      bestP99 = Math.max(bestP99, p99To.get(e.source) + edgeMs);
      bestHops = Math.max(bestHops, hopsTo.get(e.source) + 1);
    }
    meanTo.set(id, bestMean + result[id].latencyMs);
    p99To.set(id, bestP99 + result[id].p99Ms);
    hopsTo.set(id, bestHops);
  }

  const total = successQps + failedQps;
  const disconnected = nodes
    .filter((n) => inEdges.get(n.id).length === 0 && outEdges.get(n.id).length === 0)
    .map((n) => n.id);

  return {
    nodes: result,
    offeredQps: offeredTotal,
    successQps,
    failedQps,
    errorRate: total > 0 ? failedQps / total : 0,
    avgLatencyMs: Math.max(0, ...meanTo.values()),
    p99Ms: Math.max(0, ...p99To.values()),
    maxHops: Math.max(0, ...hopsTo.values()),
    bottlenecks: Object.values(result).filter((r) => r.bottleneck).map((r) => r.id),
    spofs: findSinglePointsOfFailure(nodes, outEdges, sources),
    disconnected,
    hasCycle,
  };
}

// A node is a single point of failure when it has no replicas and losing it cuts
// traffic off from at least one sink (requests fan out to every dependency, so
// any lost branch fails). A terminal store with one replica is its own SPOF.
// Managed services (DNS, CDN, cloud LBs, object storage) are assumed to be HA,
// and monitoring is a side channel, not a destination.
export function findSinglePointsOfFailure(nodes, outEdges, sources) {
  const sourceIds = new Set(sources.map((s) => s.id));
  const observes = (id) => tagsOf(nodes.find((n) => n.id === id)?.data.kind).includes('observability');
  const sinks = new Set(
    nodes.filter((n) => outEdges.get(n.id).length === 0 && !sourceIds.has(n.id) && !observes(n.id)).map((n) => n.id)
  );
  if (sourceIds.size === 0 || sinks.size === 0) return [];

  const reachableSinks = (removed) => {
    const found = new Set();
    const seen = new Set(sourceIds);
    const stack = [...sourceIds];
    while (stack.length) {
      const id = stack.pop();
      if (sinks.has(id)) found.add(id);
      for (const e of outEdges.get(id) || []) {
        if (e.target === removed || seen.has(e.target)) continue;
        seen.add(e.target);
        stack.push(e.target);
      }
    }
    return found;
  };
  const baseline = reachableSinks(null);

  return nodes
    .filter((n) => {
      const kind = n.data.kind;
      if (kind === 'generator' || kind === 'client' || sourceIds.has(n.id) || observes(n.id)) return false;
      if (NODE_TYPES[kind]?.managed) return false;
      if ((n.data.config?.replicas ?? 1) > 1) return false;
      if (baseline.has(n.id)) return true;
      const after = reachableSinks(n.id);
      return [...baseline].some((s) => !after.has(s));
    })
    .map((n) => n.id);
}
