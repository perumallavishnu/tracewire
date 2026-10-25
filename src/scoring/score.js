import { tagsOf } from '../nodeDefs/nodeTypes';
import { analyzeDesign, isSimNode } from '../simulation/analyze';

// Grades a design out of 100 across five categories of 20 points each.
// Every check returns { label, points, max, tip } so the panel can show what
// earned points and, for anything short of full marks, how to get them.

const DEFAULT_SLA_MS = 200;

// What to say when a problem needs a role the design lacks.
export const ROLE_TIPS = {
  entry: 'Give traffic a front door: a load balancer, API gateway or reverse proxy.',
  lb: 'Put a load balancer in front of your compute so you can run more than one instance.',
  gateway: 'An API gateway centralizes routing, auth checks and quotas for many endpoints.',
  edge: 'Serve static and media bytes from a CDN so they never touch your origin.',
  compute: 'Add a service tier that runs the business logic.',
  cache: 'Add a cache in front of the hot read path.',
  store: 'Persist the data somewhere durable.',
  'primary-store': 'Add a primary database (SQL or NoSQL) as the system of record.',
  relational: 'This problem needs transactions; use a SQL database for the money/inventory path.',
  blob: 'Large files belong in object storage, not in the database.',
  search: 'Add a search index for text or similarity queries.',
  geo: 'Add a geospatial index to answer nearby-location queries.',
  async: 'Decouple slow or bursty work with a queue or event log.',
  worker: 'Add workers or a stream processor to consume the async work.',
  realtime: 'Use WebSocket servers to push updates instead of polling.',
  protection: 'Protect the backend with a rate limiter, gateway quotas or a circuit breaker.',
  security: 'Add an auth service to authenticate and authorize callers.',
  observability: 'Add monitoring so you can see failures and SLO burn.',
  consensus: 'Use a lock or coordination service where only one actor may win.',
  analytics: 'Ship events to a warehouse for reporting, off the request path.',
};

function check(label, points, max, tip) {
  return { label, points: Math.max(0, Math.min(max, Math.round(points))), max, tip: points >= max ? null : tip };
}

function category(name, checks) {
  const score = checks.reduce((s, c) => s + c.points, 0);
  return { name, score, max: checks.reduce((s, c) => s + c.max, 0), checks };
}

export function verdictFor(total) {
  if (total >= 90) return { verdict: 'Production ready', tone: 'signal' };
  if (total >= 75) return { verdict: 'Strong design', tone: 'info' };
  if (total >= 55) return { verdict: 'Solid start', tone: 'info' };
  if (total >= 35) return { verdict: 'Needs work', tone: 'warn' };
  return { verdict: 'Early sketch', tone: 'error' };
}

export function scoreDesign(graph, problem = null) {
  const nodes = graph.nodes.filter(isSimNode);
  if (nodes.length === 0) {
    return { total: 0, categories: [], analysis: null, verdict: 'Empty canvas', tone: 'error' };
  }
  const req = problem?.requirements;
  const entryQps = req ? req.readQps + req.writeQps : undefined;
  const sla = req?.p99Ms ?? DEFAULT_SLA_MS;
  const a = analyzeDesign(graph, { entryQps });

  const kinds = nodes.map((n) => n.data.kind);
  const tagCount = (tag) => nodes.filter((n) => tagsOf(n.data.kind).includes(tag)).length;
  const has = (tag) => tagCount(tag) > 0;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edgesFrom = (id) => graph.edges.filter((e) => e.source === id);
  const replicasOf = (n) => n.data.config?.replicas ?? 1;
  const metrics = Object.values(a.nodes);

  // a cache that sits upstream of a primary store, i.e. actually shields it
  const cacheShieldsStore = nodes.some((n) => {
    if (!tagsOf(n.data.kind).includes('cache') && !tagsOf(n.data.kind).includes('edge')) return false;
    const seen = new Set();
    const stack = edgesFrom(n.id).map((e) => e.target);
    while (stack.length) {
      const id = stack.pop();
      if (seen.has(id)) continue;
      seen.add(id);
      if (tagsOf(byId.get(id)?.data.kind).includes('primary-store')) return true;
      stack.push(...edgesFrom(id).map((e) => e.target));
    }
    return false;
  });

  const hasStore = has('primary-store');

  // ---------- Requirements ----------
  const errPct = a.errorRate * 100;
  const missing = (problem?.mustHave || []).filter((t) => !has(t));
  const requirements = category('Requirements', [
    check(
      `Serves ${Math.round(a.offeredQps).toLocaleString()} req/s with ${errPct.toFixed(1)}% errors`,
      errPct <= 1 ? 8 : errPct <= 5 ? 5 : errPct <= 15 ? 2 : 0, 8,
      a.bottlenecks.length
        ? `Saturated: ${a.bottlenecks.map((id) => a.nodes[id].label).join(', ')}. Add replicas (see Capacity) or offload reads.`
        : 'Requests are failing; lower failure rates or add redundancy.'
    ),
    check(
      `Estimated p99 ${Math.round(a.p99Ms)} ms vs ${sla} ms target`,
      a.p99Ms <= sla ? 6 : a.p99Ms <= sla * 2 ? 3 : 0, 6,
      'Shorten the critical path: cache hot reads, drop synchronous hops, or move slow work to a queue.'
    ),
    problem
      ? check(
          missing.length ? `Missing roles: ${missing.join(', ')}` : 'Covers every role the problem calls for',
          6 * (1 - missing.length / Math.max(1, problem.mustHave.length)), 6,
          missing.map((t) => ROLE_TIPS[t] || t).join(' ')
        )
      : check(
          'Traffic has a path from a source to a destination',
          a.offeredQps > 0 && a.successQps > 0 ? 6 : 0, 6,
          'Connect a Traffic Generator through your components so requests can complete.'
        ),
  ]);

  // ---------- Scalability ----------
  const spreads = nodes.some((n) => tagsOf(n.data.kind).includes('lb') && edgesFrom(n.id).length >= 2)
    || nodes.some((n) => tagsOf(n.data.kind).includes('compute') && replicasOf(n) > 1);
  const worstUtil = Math.max(0, ...metrics.map((m) => m.utilization));
  const storesScale = kinds.includes('nosql') || nodes.some((n) => tagsOf(n.data.kind).includes('store') && replicasOf(n) > 1);
  const scalability = category('Scalability', [
    check('Compute scales horizontally (load balancer fan-out or replicas)', spreads ? 5 : 0, 5,
      'Run several service instances behind a load balancer so capacity grows by adding machines.'),
    check(`Hottest component at ${Math.round(worstUtil * 100)}% utilization`, worstUtil <= 0.8 ? 5 : worstUtil <= 1 ? 2 : 0, 5,
      'Keep every component under ~80% at peak so a traffic spike does not tip it over.'),
    check(hasStore ? 'Reads are offloaded before the database' : 'Reads offloaded (no database here)',
      !hasStore || cacheShieldsStore ? 4 : 0, 4,
      'Put a cache (or CDN) in front of the primary store so most reads never reach it.'),
    check('Slow work is decoupled through a queue', has('async') ? 3 : 0, 3,
      'Push non-urgent work (emails, fan-out, encoding) onto a queue and process it with workers.'),
    check('Storage layer can scale out', storesScale ? 3 : 0, 3,
      'Use a partitioned NoSQL store, or add read replicas to the database.'),
  ]);

  // ---------- Availability ----------
  const candidates = nodes.filter((n) => !['generator', 'client'].includes(n.data.kind)).length;
  const spofNames = a.spofs.map((id) => a.nodes[id]?.label).filter(Boolean);
  const storeRedundant = nodes.some((n) => tagsOf(n.data.kind).includes('store') && replicasOf(n) > 1);
  const availability = category('Availability', [
    check(
      spofNames.length ? `Single points of failure: ${spofNames.join(', ')}` : 'No single points of failure',
      8 * (1 - a.spofs.length / Math.max(1, candidates)) - (a.spofs.length ? 2 : 0), 8,
      'Give each of these a second replica, or a parallel instance behind the load balancer.'
    ),
    check('Data is replicated', storeRedundant ? 4 : 0, 4,
      'Set replicas to 2+ on your database so a node loss does not lose data or availability.'),
    check('Overload protection in place', has('protection') ? 3 : 0, 3,
      'Add a rate limiter, gateway quotas or a circuit breaker so spikes are shed instead of cascading.'),
    check('Monitoring and alerting', has('observability') ? 3 : 0, 3,
      'Add monitoring; without it outages are found by users.'),
    check('Degrades gracefully', kinds.includes('circuitbreaker') || has('async') ? 2 : 0, 2,
      'A circuit breaker or a queue lets the system keep working while a dependency is down.'),
  ]);

  // ---------- Latency ----------
  const needsEdge = problem ? problem.needsEdge : false;
  const warehouseOnHotPath = nodes.some((n) => n.data.kind === 'warehouse'
    && graph.edges.some((e) => e.target === n.id && !tagsOf(byId.get(e.source)?.data.kind).includes('async')
      && !tagsOf(byId.get(e.source)?.data.kind).includes('worker')));
  const latency = category('Latency', [
    check(`p99 ${Math.round(a.p99Ms)} ms against a ${sla} ms budget`,
      a.p99Ms <= sla * 0.5 ? 8 : a.p99Ms <= sla ? 6 : a.p99Ms <= sla * 2 ? 3 : 0, 8,
      'Every synchronous hop adds latency; trim the critical path or cache its result.'),
    check('Hot reads are served from memory', has('cache') ? 4 : 0, 4,
      'A cache answers in ~1-2 ms where a database takes 5-20 ms.'),
    check(needsEdge ? 'Content served from the edge' : 'Edge delivery (not required here)',
      !needsEdge || has('edge') ? 3 : 0, 3,
      'Put a CDN in front of static and media content so users fetch it from a nearby edge.'),
    check(`Critical path is ${a.maxHops} hops deep`, a.maxHops <= 6 ? 3 : a.maxHops <= 8 ? 1 : 0, 3,
      'Long synchronous chains multiply tail latency; collapse or parallelize hops.'),
    check('No analytics store on the request path', warehouseOnHotPath ? 0 : 2, 2,
      'Feed the warehouse from a queue or stream processor; it is far too slow to call inline.'),
  ]);

  // ---------- Cost ----------
  // up to 3 replicas is reasonable redundancy whatever the load
  const sized = metrics.filter((m) => m.neededReplicas !== null);
  const overProvisioned = sized.filter((m) => m.replicas > Math.max(3, m.neededReplicas * 2));
  const totalReplicas = sized.reduce((s, m) => s + m.replicas, 0);
  const neededReplicas = sized.reduce((s, m) => s + Math.max(m.neededReplicas, Math.min(m.replicas, 3)), 0);
  const frontDoors = new Set(kinds.filter((k) => ['apigateway', 'reverseproxy', 'servicemesh'].includes(k))).size;
  const cost = category('Cost', [
    check(a.disconnected.length ? `${a.disconnected.length} idle component(s)` : 'Every component is wired in',
      a.disconnected.length ? 0 : 5, 5,
      'Remove components that nothing connects to; idle infrastructure is pure spend.'),
    check(overProvisioned.length ? `Over-provisioned: ${overProvisioned.map((m) => m.label).join(', ')}` : 'Replica counts match load',
      overProvisioned.length ? 1 : 5, 5,
      'Use the Capacity tab to right-size replicas to ~70% peak utilization.'),
    check(hasStore ? 'Cache cuts database spend' : 'Database spend (no database here)',
      !hasStore || cacheShieldsStore ? 3 : 0, 3,
      'Memory is cheaper than scaling a database for reads; cache the hot keys.'),
    check(`${totalReplicas} replicas provisioned for ~${neededReplicas} needed`,
      totalReplicas <= neededReplicas * 1.5 ? 4 : totalReplicas <= neededReplicas * 2.5 ? 2 : 0, 4,
      'You are paying for far more instances than peak load needs.'),
    check('No overlapping proxy layers', frontDoors <= 2 ? 3 : 0, 3,
      'A gateway, reverse proxy and mesh all do routing; pick the ones you actually need.'),
  ]);

  const categories = [requirements, scalability, availability, latency, cost];
  const total = categories.reduce((s, c) => s + c.score, 0);
  return { total, categories, analysis: a, ...verdictFor(total) };
}
