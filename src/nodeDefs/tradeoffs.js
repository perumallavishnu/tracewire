// Per-component trade-off notes shown in the Trade-offs tab.
// use: when to reach for it; pros / cons: what you gain and pay; alt: what to consider instead.

export const TRADEOFFS = {
  generator: {
    use: 'Stands in for your users. Set its rate to the load you want to test.',
    pros: ['Repeatable synthetic load', 'Jitter models real-world burstiness'],
    cons: ['Live runs cap at a few thousand req/s; use Score or Capacity for production-scale numbers'],
  },
  client: {
    use: 'Marks where a response is returned to the caller.',
    pros: ['Makes the response path explicit'],
    cons: ['Not required; any node without outgoing connections also completes requests'],
  },
  dns: {
    use: 'The first hop for any internet-facing system; also does coarse geo or failover routing.',
    pros: ['Global, managed and extremely available', 'Can steer users to the nearest region'],
    cons: ['TTL caching makes failover slow (seconds to minutes)', 'Too coarse for per-request balancing'],
    alt: 'Anycast or a global load balancer for faster failover.',
  },
  cdn: {
    use: 'Static assets, images, video segments, and cacheable API responses for a global audience.',
    pros: ['Cuts latency to tens of ms worldwide', 'Absorbs most bandwidth and traffic spikes before origin'],
    cons: ['Invalidation is slow and fiddly', 'Little help for personalized or write traffic'],
    alt: 'Origin shield in front of the origin when many edges miss at once.',
  },
  originshield: {
    use: 'Between CDN edges and origin when a cache miss at many edges would stampede the origin.',
    pros: ['Collapses duplicate misses into one origin fetch', 'Raises the effective hit ratio'],
    cons: ['Adds one more hop on a miss', 'Another tier to pay for and configure'],
  },
  loadbalancer: {
    use: 'In front of any tier with more than one instance.',
    pros: ['Enables horizontal scaling and rolling deploys', 'Health checks route around dead instances'],
    cons: ['Sticky sessions undermine even spreading', 'Self-hosted LBs need their own redundancy'],
    alt: 'Client-side balancing via service discovery for internal RPC.',
  },
  reverseproxy: {
    use: 'TLS termination, path- or host-based routing, compression and connection pooling.',
    pros: ['One place for TLS and routing rules', 'Shields backends from slow clients'],
    cons: ['Overlaps with the LB and gateway; easy to stack too many layers', 'Config sprawl'],
  },
  apigateway: {
    use: 'Many services behind one public API, especially with external developers.',
    pros: ['Central auth, quotas, versioning and request shaping', 'Clients see one stable surface'],
    cons: ['Every request pays a few ms', 'Becomes a bottleneck or SPOF if under-provisioned'],
    alt: 'A plain load balancer when you have only one or two services.',
  },
  ratelimiter: {
    use: 'Public endpoints, expensive operations, anything a single client can abuse.',
    pros: ['Protects backends from abuse and retry storms', 'Turns overload into fast 429s'],
    cons: ['A shared counter store adds a dependency', 'Limits that are too tight hurt real users'],
    alt: 'Token bucket for bursts, sliding window for accuracy.',
  },
  service: {
    use: 'Business logic. Keep it stateless so instances are interchangeable.',
    pros: ['Scales by adding replicas', 'Easy to deploy and replace'],
    cons: ['Every synchronous dependency adds latency and a failure mode'],
  },
  auth: {
    use: 'Any system with user accounts or API keys.',
    pros: ['One implementation of a security-critical concern', 'Tokens let other services verify cheaply'],
    cons: ['On every request path; its outage is total', 'Token revocation is hard with long-lived JWTs'],
  },
  websocket: {
    use: 'Chat, live dashboards, multiplayer, location tracking: anything the server must push.',
    pros: ['Sub-100 ms delivery without polling', 'One connection carries many messages'],
    cons: ['Stateful: each connection is pinned to one server', 'Reconnect storms after a deploy or failure'],
    alt: 'Server-sent events for one-way push; long polling as a fallback.',
  },
  worker: {
    use: 'Consumers for queued work: encoding, emails, report generation, fan-out.',
    pros: ['Scaled independently of the API tier', 'Retry failed jobs without the user waiting'],
    cons: ['Jobs must be idempotent because they can run twice', 'Backlog lag needs monitoring'],
  },
  scheduler: {
    use: 'Delayed jobs, recurring batch work, reminders.',
    pros: ['Moves time-based work out of request handlers'],
    cons: ['Needs leader election or locking so jobs fire once', 'Clock skew and missed runs after outages'],
  },
  streamproc: {
    use: 'Continuous aggregation: trending counts, fraud signals, real-time metrics.',
    pros: ['Results update seconds after events happen', 'Windowed state handles high event rates'],
    cons: ['Exactly-once semantics are hard', 'Reprocessing history needs a replayable log'],
    alt: 'Batch jobs over a warehouse when minutes of lag are fine.',
  },
  notifier: {
    use: 'Push, email and SMS delivery through external providers.',
    pros: ['Isolates slow, flaky third-party APIs from user requests'],
    cons: ['Providers rate-limit and fail; needs retries and dedupe', 'Users’ preferences must be checked on every send'],
  },
  database: {
    use: 'Data with relationships, transactions or strict invariants (money, inventory, accounts).',
    pros: ['ACID transactions and joins', 'Mature tooling, constraints, ad-hoc queries'],
    cons: ['Scaling writes beyond one primary needs sharding', 'Connection limits cap concurrency'],
    alt: 'NoSQL when access is by key and scale matters more than joins.',
  },
  nosql: {
    use: 'Huge volumes accessed by a known key: sessions, timelines, messages, IoT data.',
    pros: ['Scales writes by adding partitions', 'Predictable single-digit-ms lookups'],
    cons: ['No joins; you design tables around queries', 'Often eventually consistent by default'],
    alt: 'SQL when you need transactions across entities.',
  },
  cache: {
    use: 'Hot, read-heavy data that tolerates being slightly stale.',
    pros: ['~1 ms reads; can absorb 80-95% of read load', 'Cheaper than scaling the database'],
    cons: ['Invalidation bugs serve stale data', 'A cold or failed cache stampedes the database'],
    alt: 'Read replicas when data must stay fresh.',
  },
  objectstore: {
    use: 'Images, video, backups, logs: any large blob.',
    pros: ['Practically unlimited, very durable, cheap per GB', 'Pairs naturally with a CDN'],
    cons: ['Tens of ms per request; not for small hot records', 'No partial updates or queries'],
  },
  filestore: {
    use: 'Legacy or tooling workloads that need a shared POSIX file system.',
    pros: ['Directory semantics and file locking'],
    cons: ['Harder to scale than object storage', 'Shared mounts become contention points'],
    alt: 'Object storage for new designs.',
  },
  search: {
    use: 'Full-text search, filtering with facets, autocomplete.',
    pros: ['Relevance ranking and fuzzy matching', 'Fast queries the primary database cannot do'],
    cons: ['A second copy of data that lags the source', 'Operationally heavy at large sizes'],
  },
  graphdb: {
    use: 'Social graphs, recommendations, fraud rings: multi-hop relationship queries.',
    pros: ['Traversals that would be many joins are cheap'],
    cons: ['Hard to shard', 'Niche skills and tooling'],
    alt: 'Adjacency lists in a key-value store for one or two hops.',
  },
  timeseries: {
    use: 'Metrics, sensor readings, usage counters: timestamped append-only data.',
    pros: ['High ingest rates and compression', 'Built-in downsampling and retention'],
    cons: ['Poor at updates and non-time queries'],
  },
  warehouse: {
    use: 'Analytics, reporting, BI over months of history.',
    pros: ['Scans billions of rows with SQL', 'Separates analytics load from production'],
    cons: ['Seconds per query; never on the request path', 'Data arrives in batches or streams, not live'],
  },
  vectordb: {
    use: 'Semantic search, recommendations and retrieval for LLM features.',
    pros: ['Nearest-neighbor queries over embeddings in ms'],
    cons: ['Approximate results; recall vs speed trade-off', 'Embeddings must be regenerated when models change'],
  },
  geoindex: {
    use: 'Nearby drivers, stores, friends: any "what is close to this point" query.',
    pros: ['Turns radius search into a few cell lookups'],
    cons: ['Hot cells in dense cities need finer splits', 'Moving objects mean constant writes'],
  },
  queue: {
    use: 'Work the user does not need to wait for, or bursts the backend cannot take at once.',
    pros: ['Absorbs spikes; consumers work at their own pace', 'Producers survive consumer outages'],
    cons: ['Adds lag and eventual consistency', 'Poison messages and redelivery need handling'],
    alt: 'An event log when several consumers need the same messages or replay.',
  },
  broker: {
    use: 'One event, many independent subscribers (fan-out).',
    pros: ['Publishers do not know or wait for subscribers'],
    cons: ['Ordering is usually per topic or partition only', 'Slow subscribers need their own buffering'],
  },
  eventlog: {
    use: 'High-volume event streams that multiple consumers read and may replay.',
    pros: ['Durable, ordered per partition, replayable', 'Very high throughput'],
    cons: ['Partition count limits consumer parallelism', 'Operationally heavier than a simple queue'],
  },
  circuitbreaker: {
    use: 'Around calls to dependencies that can hang or fail: third-party APIs, overloaded services.',
    pros: ['Fails fast instead of piling up threads', 'Gives a struggling dependency room to recover'],
    cons: ['Thresholds need tuning; flapping is possible', 'Callers need a fallback for the open state'],
  },
  monitoring: {
    use: 'Always. Every production system needs metrics, logs and alerts.',
    pros: ['Finds incidents before users do', 'Shows whether trade-offs pay off'],
    cons: ['High-cardinality metrics get expensive', 'Alert fatigue if thresholds are noisy'],
  },
  servicemesh: {
    use: 'Dozens of services that need uniform mTLS, retries and traffic shifting.',
    pros: ['Security and resilience without changing app code'],
    cons: ['Sidecars add latency and resource cost', 'Significant operational complexity'],
    alt: 'A shared client library when you have only a handful of services.',
  },
  discovery: {
    use: 'Dynamic fleets where instance addresses change constantly.',
    pros: ['Callers always find healthy instances'],
    cons: ['Itself must be highly available', 'Stale entries cause failed calls'],
  },
  coordination: {
    use: 'Leader election, cluster membership, small critical config.',
    pros: ['Strong consistency via consensus'],
    cons: ['Low write throughput', 'Needs an odd number of nodes and careful operations'],
  },
  lock: {
    use: 'Exactly one actor may act: booking a seat, assigning a driver, running a job.',
    pros: ['Prevents double-booking and duplicate work'],
    cons: ['Lease expiry and pauses can let two holders overlap; use fencing tokens', 'Contention serializes work'],
    alt: 'Conditional writes in the database when the invariant lives in one row.',
  },
  idgen: {
    use: 'Unique IDs across many writers: short links, message ordering, distributed inserts.',
    pros: ['No central round trip per ID', 'Roughly time-ordered IDs sort well'],
    cons: ['Clock skew can break ordering assumptions'],
  },
  counter: {
    use: 'Very hot counters such as likes, views and inventory.',
    pros: ['Spreads write contention across shards'],
    cons: ['Reads must sum shards', 'Exact real-time values are expensive'],
  },
  config: {
    use: 'Feature flags, kill switches and runtime tuning without deploys.',
    pros: ['Instant rollback of risky features'],
    cons: ['A bad push can break every service at once', 'Services need cached fallbacks'],
  },
};
