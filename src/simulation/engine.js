import { nanoid } from 'nanoid';
import { behaviorOf } from '../nodeDefs/nodeTypes';

// A request's simulated backoff before a retry attempt.
const RETRY_BACKOFF_MS = 80;
const MAX_HOPS = 40;
const METRICS_WINDOW_MS = 8000; // rolling window used for percentile / throughput calcs
const HISTORY_POINT_INTERVAL_MS = 250; // resolution of the charted timeseries

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function poissonish(rate, jitterFraction, dtSeconds) {
  const mean = rate * dtSeconds;
  const noise = 1 + rand(-jitterFraction, jitterFraction);
  const expected = mean * noise;
  // fractional remainder handled probabilistically so low rates still emit occasionally
  const whole = Math.floor(expected);
  const frac = expected - whole;
  return whole + (Math.random() < frac ? 1 : 0);
}

export class SimulationEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.time = 0;
    this.running = false;
    this.speed = 1;
    this.nodeState = new Map(); // nodeId -> runtime state
    this.edgeState = new Map(); // edgeId -> runtime state
    this.inTransit = [];        // requests currently travelling an edge
    this.completedLog = [];     // rolling window of finished requests {t, latencyMs, success, reason}
    this.eventLog = [];         // human-readable event feed (chaos, cascades, ...)
    this.history = [];          // timeseries points for charts
    this._lastHistoryPush = 0;
    this.chaos = { monkeyEnabled: false, monkeyIntervalMs: 4000, _nextMonkeyAt: 4000 };
    this.activeEffects = [];    // temporary chaos effects [{type,targetId,expiresAt,...}]
    this._lbRoundRobin = new Map();
    this._rateLimiterWindow = new Map(); // nodeId -> count this 1s window
    this._rateLimiterWindowStart = new Map();
  }

  log(message, level = 'info') {
    this.eventLog.push({ id: nanoid(6), t: this.time, message, level });
    if (this.eventLog.length > 300) this.eventLog.shift();
  }

  ensureNodeState(nodeId) {
    if (!this.nodeState.has(nodeId)) {
      this.nodeState.set(nodeId, {
        inFlight: 0,
        busyUntil: [],  // expiry timestamps (sim seconds) of currently-occupied capacity slots
        queue: [],
        status: 'up', // up | down | degraded
        completed: 0,
        failed: 0,
        cacheHits: 0,
        cacheMisses: 0,
        breakerOpenUntil: 0, // circuit breakers only
      });
    }
    return this.nodeState.get(nodeId);
  }

  // Occupies one capacity slot for latencySec of simulated time.
  _occupy(st, latencySec) {
    st.busyUntil.push(this.time + Math.max(0.001, latencySec));
  }

  // Drops expired occupancy slots and refreshes the plain inFlight counter
  // (kept around because the UI snapshot reads it directly).
  _pruneBusy(st) {
    if (st.busyUntil.length === 0) return;
    st.busyUntil = st.busyUntil.filter((t) => t > this.time);
    st.inFlight = st.busyUntil.length;
  }

  ensureEdgeState(edgeId) {
    if (!this.edgeState.has(edgeId)) {
      this.edgeState.set(edgeId, { partitioned: false });
    }
    return this.edgeState.get(edgeId);
  }

  // ---------- Chaos API ----------

  killNode(nodeId, durationSec = null) {
    const st = this.ensureNodeState(nodeId);
    st.status = 'down';
    this.log(`Node ${nodeId} killed${durationSec ? ` for ${durationSec}s` : ''}`, 'critical');
    if (durationSec) {
      this.activeEffects.push({ type: 'kill', targetId: nodeId, expiresAt: this.time + durationSec });
    }
  }

  reviveNode(nodeId) {
    const st = this.ensureNodeState(nodeId);
    st.status = 'up';
    this.activeEffects = this.activeEffects.filter((e) => !(e.type === 'kill' && e.targetId === nodeId));
    this.log(`Node ${nodeId} revived`, 'info');
  }

  partitionEdge(edgeId, durationSec = null) {
    const st = this.ensureEdgeState(edgeId);
    st.partitioned = true;
    this.log(`Edge ${edgeId} partitioned${durationSec ? ` for ${durationSec}s` : ''}`, 'critical');
    if (durationSec) {
      this.activeEffects.push({ type: 'partition', targetId: edgeId, expiresAt: this.time + durationSec });
    }
  }

  healEdge(edgeId) {
    const st = this.ensureEdgeState(edgeId);
    st.partitioned = false;
    this.activeEffects = this.activeEffects.filter((e) => !(e.type === 'partition' && e.targetId === edgeId));
    this.log(`Edge ${edgeId} healed`, 'info');
  }

  latencySpike(nodeId, multiplier = 5, durationSec = 6) {
    this.activeEffects.push({ type: 'latency', targetId: nodeId, multiplier, expiresAt: this.time + durationSec });
    this.log(`Latency spike x${multiplier} on ${nodeId} for ${durationSec}s`, 'warn');
  }

  capacityDrop(nodeId, fractionRemaining = 0.3, durationSec = 6) {
    this.activeEffects.push({ type: 'capacity', targetId: nodeId, fractionRemaining, expiresAt: this.time + durationSec });
    this.log(`Capacity dropped to ${Math.round(fractionRemaining * 100)}% on ${nodeId} for ${durationSec}s`, 'warn');
  }

  setChaosMonkey(enabled, intervalMs = 4000) {
    this.chaos.monkeyEnabled = enabled;
    this.chaos.monkeyIntervalMs = intervalMs;
    this.chaos._nextMonkeyAt = this.time * 1000 + intervalMs;
    this.log(enabled ? 'Chaos monkey engaged' : 'Chaos monkey stopped', enabled ? 'critical' : 'info');
  }

  _maybeTriggerMonkey(graph) {
    if (!this.chaos.monkeyEnabled) return;
    if (this.time * 1000 < this.chaos._nextMonkeyAt) return;
    this.chaos._nextMonkeyAt = this.time * 1000 + this.chaos.monkeyIntervalMs;
    const candidates = graph.nodes.filter((n) => !['generator', 'client', 'note'].includes(n.data.kind));
    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const roll = Math.random();
    if (roll < 0.35) {
      this.killNode(target.id, rand(2, 5));
    } else if (roll < 0.7) {
      this.latencySpike(target.id, rand(3, 8), rand(3, 6));
    } else {
      this.capacityDrop(target.id, rand(0.15, 0.5), rand(3, 6));
    }
  }

  _expireEffects() {
    const stillActive = [];
    for (const e of this.activeEffects) {
      if (e.expiresAt !== undefined && e.expiresAt <= this.time) {
        if (e.type === 'kill') this.reviveNode(e.targetId);
        if (e.type === 'partition') this.healEdge(e.targetId);
        if (e.type === 'latency') this.log(`Latency spike on ${e.targetId} ended`, 'info');
        if (e.type === 'capacity') this.log(`Capacity restored on ${e.targetId}`, 'info');
      } else {
        stillActive.push(e);
      }
    }
    this.activeEffects = stillActive;
  }

  _effectiveConfig(node) {
    const base = { ...node.data.config };
    let latencyMultiplier = 1;
    let capacityFraction = 1;
    for (const e of this.activeEffects) {
      if (e.targetId !== node.id) continue;
      if (e.type === 'latency') latencyMultiplier *= e.multiplier;
      if (e.type === 'capacity') capacityFraction *= e.fractionRemaining;
    }
    // replicas multiply concurrent capacity and queue partitions' drain rate;
    // a rate limiter's limit is global, so its replicas only add redundancy
    const replicas = base.replicas || 1;
    const behavior = behaviorOf(node.data.kind);
    if (base.capacity !== undefined && behavior !== 'ratelimiter') base.capacity *= replicas;
    if (base.drainRate !== undefined) base.drainRate *= replicas;
    return { ...base, latencyMultiplier, capacityFraction };
  }

  // ---------- Graph helpers ----------

  _outgoing(graph, nodeId) {
    return graph.edges.filter((e) => e.source === nodeId && !this.ensureEdgeState(e.id).partitioned);
  }

  _pickBackend(node, graph) {
    const edges = this._outgoing(graph, node.id);
    const healthy = edges.filter((e) => this.ensureNodeState(e.target).status !== 'down');
    const pool = healthy.length > 0 ? healthy : edges;
    if (pool.length === 0) return null;
    const cfg = node.data.config;
    if (cfg.algorithm === 'random') {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    if (cfg.algorithm === 'least-conn') {
      let minLoad = Infinity;
      for (const e of pool) minLoad = Math.min(minLoad, this.ensureNodeState(e.target).inFlight);
      const tied = pool.filter((e) => this.ensureNodeState(e.target).inFlight === minLoad);
      return tied[Math.floor(Math.random() * tied.length)];
    }
    // round-robin default
    const idx = (this._lbRoundRobin.get(node.id) || 0) % pool.length;
    this._lbRoundRobin.set(node.id, idx + 1);
    return pool[idx];
  }

  // ---------- Core tick ----------

  tick(dtSecondsRaw, graph) {
    const dtSeconds = dtSecondsRaw * this.speed;
    if (dtSeconds <= 0) return;
    this.time += dtSeconds;

    this._expireEffects();
    this._maybeTriggerMonkey(graph);
    for (const st of this.nodeState.values()) this._pruneBusy(st);

    // 1. Spawn new requests from generators
    for (const node of graph.nodes) {
      if (node.data.kind !== 'generator') continue;
      const st = this.ensureNodeState(node.id);
      if (st.status === 'down') continue;
      const cfg = node.data.config;
      const n = poissonish(cfg.rate || 0, cfg.jitter ?? 0.3, dtSeconds);
      const outs = this._outgoing(graph, node.id);
      if (outs.length === 0 || n === 0) continue;
      for (let i = 0; i < n; i++) {
        const edge = outs[Math.floor(Math.random() * outs.length)];
        this._launchOnEdge(edge, {
          id: nanoid(8),
          startTime: this.time,
          retriesLeft: 2,
          hops: 0,
          visited: new Set([node.id]),
        });
      }
    }

    // 2. Advance in-flight edge travellers
    const stillTravelling = [];
    for (const trip of this.inTransit) {
      const edgeSt = this.ensureEdgeState(trip.edgeId);
      if (edgeSt.partitioned) {
        this._fail(trip, graph, 'network partition');
        continue;
      }
      trip.progress += dtSeconds / trip.durationSec;
      if (trip.progress >= 1) {
        this._arrive(trip, graph);
      } else {
        stillTravelling.push(trip);
      }
    }
    this.inTransit = stillTravelling;

    // 3. Drain queue-type nodes (queue / broker) toward their downstream target
    for (const node of graph.nodes) {
      if (behaviorOf(node.data.kind) !== 'queue') continue;
      const st = this.ensureNodeState(node.id);
      if (st.queue.length === 0) continue;
      const cfg = this._effectiveConfig(node);
      const drainCount = poissonish(cfg.drainRate || 0, 0, dtSeconds);
      const outs = this._outgoing(graph, node.id);
      for (let i = 0; i < drainCount && st.queue.length > 0; i++) {
        const req = st.queue.shift();
        if (outs.length === 0) {
          this._succeed(req, graph, node);
        } else {
          const edge = outs[Math.floor(Math.random() * outs.length)];
          this._launchOnEdge(edge, req);
        }
      }
    }

    // 3b. Retry requests parked in generic overflow buffers as capacity frees up
    this._drainGenericQueues(graph);

    // 4. Prune completed log to rolling window & push history point
    const cutoff = this.time * 1000 - METRICS_WINDOW_MS;
    while (this.completedLog.length && this.completedLog[0].tMs < cutoff) this.completedLog.shift();

    if (this.time * 1000 - this._lastHistoryPush >= HISTORY_POINT_INTERVAL_MS) {
      this._lastHistoryPush = this.time * 1000;
      this.history.push(this._computeMetrics());
      if (this.history.length > 240) this.history.shift();
    }
  }

  _launchOnEdge(edge, req) {
    req.hops += 1;
    const netLatency = (edge.data?.latencyMs ?? 5) / 1000;
    this.inTransit.push({
      id: req.id,
      req,
      edgeId: edge.id,
      target: edge.target,
      progress: 0,
      durationSec: Math.max(0.01, netLatency),
      status: 'inflight',
    });
  }

  _arrive(trip, graph) {
    const node = graph.nodes.find((n) => n.id === trip.target);
    if (!node) return; // dangling edge, drop silently
    this._processAtNode(node, trip.req, graph);
  }

  _processAtNode(node, req, graph) {
    if (req.hops > MAX_HOPS) {
      this._fail(req, graph, 'hop limit exceeded (possible cycle)');
      return;
    }
    req.visited.add(node.id);

    const st = this.ensureNodeState(node.id);
    const cfg = this._effectiveConfig(node);
    const kind = behaviorOf(node.data.kind);

    if (st.status === 'down') {
      this._fail(req, graph, `node ${node.data.label} is down`, node);
      return;
    }

    if (kind === 'client') {
      this._succeed(req, graph, node);
      return;
    }

    if (kind === 'loadbalancer') {
      const chosen = this._pickBackend(node, graph);
      if (!chosen) {
        this._fail(req, graph, 'no healthy backends', node);
        return;
      }
      // tiny LB overhead, then forward
      this._completeAndForward(node, req, graph, cfg.baseLatencyMs ?? 1, [chosen]);
      return;
    }

    if (kind === 'ratelimiter') {
      const windowStart = this._rateLimiterWindowStart.get(node.id) || 0;
      if (this.time - windowStart >= 1) {
        this._rateLimiterWindowStart.set(node.id, this.time);
        this._rateLimiterWindow.set(node.id, 0);
      }
      const count = this._rateLimiterWindow.get(node.id) || 0;
      if (count >= (cfg.capacity ?? Infinity)) {
        this._fail(req, graph, 'rate limited', node);
        return;
      }
      this._rateLimiterWindow.set(node.id, count + 1);
      this._completeAndForward(node, req, graph, cfg.baseLatencyMs ?? 1);
      return;
    }

    if (kind === 'circuitbreaker') {
      this._passBreaker(node, req, graph, cfg, st);
      return;
    }

    if (kind === 'queue') {
      if (st.queue.length >= (cfg.queueCapacity ?? Infinity)) {
        this._fail(req, graph, 'queue full', node);
        return;
      }
      st.queue.push(req);
      return; // drained in the tick loop
    }

    if (kind === 'cache') {
      const admitted = this._admit(node, st, cfg);
      if (!admitted) {
        this._fail(req, graph, 'overloaded', node);
        return;
      }
      const isHit = Math.random() < (cfg.cacheHitRate ?? 0.5);
      const latency = isHit
        ? (cfg.baseLatencyMs ?? 2) + rand(0, cfg.jitterMs ?? 1)
        : (cfg.baseLatencyMs ?? 2) + (cfg.missPenaltyMs ?? 10) + rand(0, cfg.jitterMs ?? 1);
      if (isHit) st.cacheHits += 1; else st.cacheMisses += 1;
      const finalLatency = latency * cfg.latencyMultiplier;
      this._occupy(st, finalLatency / 1000);
      // a hit is answered here; only misses travel on to the origin
      if (isHit) this._succeed(req, graph, node, finalLatency);
      else this._completeAndForward(node, req, graph, finalLatency);
      return;
    }

    // generic capacity-bound processing node: service / database / auth / custom types
    if (cfg.cacheHitRate !== undefined && Math.random() < cfg.cacheHitRate) {
      st.cacheHits += 1;
      const latency = ((cfg.baseLatencyMs ?? 2) + rand(0, cfg.jitterMs ?? 1)) * cfg.latencyMultiplier;
      this._succeed(req, graph, node, latency);
      return;
    }
    if (cfg.cacheHitRate !== undefined) st.cacheMisses += 1;

    const admitted = this._admit(node, st, cfg);
    if (!admitted) {
      if (cfg.queueCapacity !== undefined && st.queue.length < cfg.queueCapacity) {
        st.queue.push(req);
        return; // retried as capacity frees up, see _drainGenericQueues()
      }
      this._fail(req, graph, 'overloaded', node);
      return;
    }
    this._runGenericProcessing(node, req, graph, cfg, st);
  }

  // Shared admit -> (fail | succeed+forward) logic used both for freshly-arrived
  // requests and for ones that were sitting in a generic node's overflow queue.
  _runGenericProcessing(node, req, graph, cfg, st) {
    const capacity = Math.max(1, (cfg.capacity ?? 1) * cfg.capacityFraction);
    const load = st.busyUntil.length / capacity;
    const loadPenalty = load > 0.85 ? (load - 0.85) * 2 : 0; // extra failure chance when near saturation
    const failRoll = Math.random();
    const latency = ((cfg.baseLatencyMs ?? 20) + rand(0, cfg.jitterMs ?? 10)) * cfg.latencyMultiplier;
    this._occupy(st, latency / 1000);
    if (failRoll < (cfg.failureRate ?? 0) + loadPenalty) {
      st.failed += 1;
      this._fail(req, graph, load > 0.85 ? 'overload-induced failure' : 'internal error', node);
      return;
    }
    st.completed += 1;
    this._completeAndForward(node, req, graph, latency);
  }

  // Retries requests parked in a generic (non queue/broker) node's overflow buffer
  // once the node has spare capacity again.
  _drainGenericQueues(graph) {
    for (const node of graph.nodes) {
      if (behaviorOf(node.data.kind) === 'queue') continue;
      const st = this.nodeState.get(node.id);
      if (!st || st.queue.length === 0) continue;
      const cfg = this._effectiveConfig(node);
      while (st.queue.length > 0 && this._admit(node, st, cfg)) {
        const req = st.queue.shift();
        this._runGenericProcessing(node, req, graph, cfg, st);
      }
    }
  }

  // Forwards only to downstreams that can take work. When none can, the breaker
  // opens for cooldownSec and rejects instantly without retries, so callers stop
  // piling onto a dead dependency. The first request after cooldown is the probe.
  _passBreaker(node, req, graph, cfg, st) {
    if (this.time < st.breakerOpenUntil) {
      req.retriesLeft = 0;
      this._fail(req, graph, 'circuit open', node);
      return;
    }
    const outs = this._outgoing(graph, node.id);
    const healthy = outs.filter((e) => !this._isUnavailable(graph, e.target));
    if (outs.length > 0 && healthy.length === 0) {
      st.breakerOpenUntil = this.time + (cfg.cooldownSec ?? 3);
      this.log(`Circuit opened at ${node.data.label}`, 'warn');
      req.retriesLeft = 0;
      this._fail(req, graph, 'circuit open', node);
      return;
    }
    this._completeAndForward(node, req, graph, cfg.baseLatencyMs ?? 1, healthy.length ? healthy : null);
  }

  _isUnavailable(graph, nodeId) {
    const target = graph.nodes.find((n) => n.id === nodeId);
    if (!target) return true;
    const st = this.ensureNodeState(nodeId);
    if (st.status === 'down') return true;
    const cfg = this._effectiveConfig(target);
    if (cfg.capacity === undefined || behaviorOf(target.data.kind) === 'ratelimiter') return false;
    const queueFull = cfg.queueCapacity === undefined || st.queue.length >= cfg.queueCapacity;
    return !this._admit(target, st, cfg) && queueFull;
  }

  _admit(node, st, cfg) {
    const capacity = (cfg.capacity ?? Infinity) * (cfg.capacityFraction ?? 1);
    return st.busyUntil.length < capacity;
  }

  _completeAndForward(node, req, graph, latencyMs, forcedEdges = null) {
    // simulate processing latency by delaying the forward using a micro-scheduled edge hop
    const outs = forcedEdges || this._outgoing(graph, node.id);
    if (outs.length === 0) {
      this._succeed(req, graph, node, latencyMs);
      return;
    }
    // Represent "processing time" as a pseudo-edge trip on a zero-length virtual edge id,
    // then fan out to all real outgoing edges (fan-out modeling multi-dependency calls).
    for (const edge of outs) {
      this.inTransit.push({
        id: nanoid(8),
        req,
        edgeId: edge.id,
        target: edge.target,
        progress: 0,
        durationSec: Math.max(0.005, latencyMs / 1000 + (edge.data?.latencyMs ?? 5) / 1000),
        status: 'inflight',
      });
    }
  }

  _succeed(req, graph, node, extraLatencyMs = 0) {
    const latencyMs = this.time * 1000 - req.startTime * 1000 + extraLatencyMs;
    this.completedLog.push({ tMs: this.time * 1000, latencyMs, success: true });
  }

  _fail(req, graph, reason, node = null) {
    if (req.retriesLeft > 0) {
      req.retriesLeft -= 1;
      // backoff then retry from the same origin point (models client/proxy retry)
      const retryTargetEdge = this._retryEntryEdge(graph, req, node);
      if (retryTargetEdge) {
        setTimeoutSim(() => {
          this.inTransit.push({
            id: nanoid(8),
            req,
            edgeId: retryTargetEdge.id,
            target: retryTargetEdge.target,
            progress: 0,
            durationSec: Math.max(0.02, RETRY_BACKOFF_MS / 1000),
            status: 'retry',
          });
        });
        this.log(`Retrying request after "${reason}"${node ? ` at ${node.data.label}` : ''}`, 'warn');
        return;
      }
    }
    const latencyMs = this.time * 1000 - req.startTime * 1000;
    this.completedLog.push({ tMs: this.time * 1000, latencyMs, success: false, reason });
  }

  _retryEntryEdge(graph, req, node) {
    // Retry by re-entering the node that failed (simulating an upstream LB/proxy
    // choosing a — possibly different — path) if it still has a valid incoming edge.
    if (!node) return null;
    const incoming = graph.edges.find((e) => e.target === node.id);
    return incoming || null;
  }

  _computeMetrics() {
    const cutoffMs = this.time * 1000 - METRICS_WINDOW_MS;
    const recent = this.completedLog.filter((r) => r.tMs >= cutoffMs);
    const successes = recent.filter((r) => r.success);
    const failures = recent.filter((r) => !r.success);
    const windowSec = METRICS_WINDOW_MS / 1000;
    const throughput = recent.length / windowSec;
    const errorRate = recent.length ? (failures.length / recent.length) * 100 : 0;
    const latencies = successes.map((r) => r.latencyMs).sort((a, b) => a - b);
    const pct = (p) => {
      if (latencies.length === 0) return 0;
      const idx = Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length));
      return latencies[idx];
    };
    return {
      t: this.time,
      throughput,
      errorRate,
      p50: pct(50),
      p95: pct(95),
      p99: pct(99),
      totalRequests: recent.length,
    };
  }

  getSnapshot(graph) {
    const nodes = {};
    for (const node of graph.nodes) {
      const st = this.ensureNodeState(node.id);
      const cfg = this._effectiveConfig(node);
      const capacity = (cfg.capacity ?? 0) * (cfg.capacityFraction ?? 1);
      nodes[node.id] = {
        status: st.status,
        inFlight: st.inFlight,
        queueDepth: st.queue.length,
        utilization: capacity > 0 ? Math.min(1.5, st.inFlight / capacity) : (st.queue.length > 0 ? Math.min(1.5, st.queue.length / (cfg.queueCapacity || 1)) : 0),
        completed: st.completed,
        failed: st.failed,
        cacheHits: st.cacheHits,
        cacheMisses: st.cacheMisses,
        effects: this.activeEffects.filter((e) => e.targetId === node.id).map((e) => e.type),
      };
    }
    const edges = {};
    for (const edge of graph.edges) {
      const st = this.ensureEdgeState(edge.id);
      edges[edge.id] = {
        partitioned: st.partitioned,
        pulses: this.inTransit
          .filter((t) => t.edgeId === edge.id)
          .map((t) => ({ id: t.id, progress: t.progress, status: t.status })),
      };
    }
    return {
      time: this.time,
      nodes,
      edges,
      metrics: this._computeMetrics(),
      // copy: Recharts 3 deep-freezes chart data, which would freeze the engine's own array
      history: this.history.slice(),
      eventLog: this.eventLog.slice(-40),
      activeEffects: this.activeEffects,
    };
  }
}

// Requests that "complete processing" at a node need their inFlight slot released
// slightly before the forward-hop finishes traveling; we approximate this with a
// zero-delay microtask rather than a real timer so the sim stays deterministic per tick.
function setTimeoutSim(fn) {
  fn();
}
