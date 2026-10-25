// Reference library shown in the Learn drawer.

export const CONCEPTS = [
  {
    id: 'estimation',
    title: 'Back-of-envelope estimation',
    body: 'Average QPS = daily active users x requests per user / 86,400. Plan for a peak 2-5x the average. Storage = writes per day x record size x days retained x replication factor. Bandwidth = QPS x response size.',
    tryIt: 'Open the Capacity tab with a problem selected; it does this arithmetic from the problem’s numbers.',
  },
  {
    id: 'littles-law',
    title: "Little's law and capacity",
    body: 'Concurrent requests = throughput x latency. A server with 100 worker slots and 50 ms per request tops out near 2,000 req/s. Halve the latency and you double throughput on the same hardware.',
    tryIt: 'Lower a service’s base latency and watch its per-replica capacity rise in the Capacity tab.',
  },
  {
    id: 'queueing',
    title: 'Why latency explodes near 100% utilization',
    body: 'Waiting time grows with utilization / (1 - utilization). At 50% load requests barely wait, at 90% they queue noticeably, and past 100% the backlog grows without bound. Aim to run under about 70% at peak.',
    tryIt: 'Run the example, then drop a node’s capacity with chaos and watch p95 climb before errors start.',
  },
  {
    id: 'caching',
    title: 'Caching strategies',
    body: 'Cache-aside: read the cache, on miss read the database and fill the cache. Write-through: write both together. Write-back: write the cache and flush later (fast, but risks loss). TTLs bound staleness; jittered TTLs avoid synchronized expiry stampedes.',
    tryIt: 'Raise a cache’s hit rate and watch the database’s utilization drop.',
  },
  {
    id: 'replication',
    title: 'Replication',
    body: 'Leader-follower: one writer, many readers; followers can lag. Multi-leader: writes in several regions, conflicts to resolve. Leaderless quorum: write to W of N and read from R of N; W + R > N gives read-your-writes.',
    tryIt: 'Set a database to 2+ replicas and the single-point-of-failure warning disappears from Score.',
  },
  {
    id: 'sharding',
    title: 'Sharding and partitioning',
    body: 'Split data by key across machines. Hash partitioning spreads load evenly but breaks range queries; range partitioning keeps ranges together but can create hot spots. Consistent hashing limits data movement when nodes join or leave.',
  },
  {
    id: 'cap',
    title: 'CAP and PACELC',
    body: 'During a network partition you choose consistency (refuse some requests) or availability (serve possibly stale data). PACELC adds: Else, when healthy, you trade latency against consistency.',
  },
  {
    id: 'backpressure',
    title: 'Backpressure, retries and storms',
    body: 'Retries multiply load exactly when a system is weakest. Use exponential backoff with jitter, a retry budget, and circuit breakers. Queues absorb bursts but need a bound, or they hide an outage until memory runs out.',
    tryIt: 'Kill a database while running: watch retries in the event feed, then add a circuit breaker and compare.',
  },
  {
    id: 'idempotency',
    title: 'Idempotency',
    body: 'If a request can be retried it can arrive twice. Give operations an idempotency key, store the result of the first attempt, and return it for repeats. Essential for payments, notifications and queue consumers.',
  },
  {
    id: 'slo',
    title: 'SLIs, SLOs and error budgets',
    body: 'An SLI is a measurement (p99 latency, success rate); an SLO is the target (99.9% under 200 ms); the error budget is what is left (0.1%). Spend it on releases and experiments; when it is gone, slow down and fix reliability.',
  },
];

export const COMPARISONS = [
  {
    id: 'sql-nosql',
    a: 'SQL database',
    b: 'NoSQL store',
    aWhen: 'Relationships, transactions, ad-hoc queries, strict invariants such as balances and stock.',
    bWhen: 'Massive scale with simple key-based access, flexible schemas, high write rates.',
    note: 'Many systems use both: SQL for the money path, NoSQL for timelines, sessions and events.',
  },
  {
    id: 'push-pull',
    a: 'Fan-out on write (push)',
    b: 'Fan-out on read (pull)',
    aWhen: 'Most users have modest follower counts and reads must be instant.',
    bWhen: 'Some producers have millions of followers, or most produced items are never read.',
    note: 'Feeds usually go hybrid: push for normal accounts, pull for celebrities.',
  },
  {
    id: 'sync-async',
    a: 'Synchronous call',
    b: 'Async via a queue',
    aWhen: 'The caller needs the answer to continue, and the dependency is fast and reliable.',
    bWhen: 'The work is slow, bursty, or can happen after responding; you want failure isolation.',
    note: 'Async trades immediate consistency for resilience; design the UI for "processing" states.',
  },
  {
    id: 'strong-eventual',
    a: 'Strong consistency',
    b: 'Eventual consistency',
    aWhen: 'Double-spending, overselling or conflicting bookings are unacceptable.',
    bWhen: 'Brief staleness is fine (likes, view counts, feeds) and availability matters more.',
    note: 'You can mix them per operation; checkout strong, product views eventual.',
  },
  {
    id: 'mono-micro',
    a: 'Monolith',
    b: 'Microservices',
    aWhen: 'A small team, an evolving domain, a need to move fast with simple operations.',
    bWhen: 'Many teams need to deploy independently, or parts have very different scaling needs.',
    note: 'Start modular inside one deployable; split along boundaries that actually hurt.',
  },
];
