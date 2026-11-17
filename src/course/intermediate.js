// Intermediate zone: data across many machines, asynchronous work and failure handling.

export const INTERMEDIATE = [
  {
    id: 'data-at-scale',
    title: 'Data at scale',
    summary: 'Copy and split data across machines without losing it.',
    intro:
      'When one database can no longer keep up, you either copy it (replication) to serve more reads and survive failures, or split it (partitioning) to serve more writes and hold more data. Most large systems do both.',
    next: ['consistency', 'storage-specialized'],
    subsections: [
      {
        id: 'replication',
        title: 'Replication',
        theory: [
          'Leader-follower replication sends every write to one leader, which streams changes to followers that serve reads. If the leader dies, a follower is promoted. Followers lag behind by milliseconds to seconds, so a user may not see their own write if they read from one.',
          'Synchronous replication waits for followers and loses nothing on failover; asynchronous replication is faster but can drop the last few writes. Multi-leader and leaderless designs accept writes in several places and must resolve conflicts.',
        ],
        concepts: ['Leader-follower', 'Sync vs async replication', 'Replication lag', 'Failover and split brain', 'Multi-leader and leaderless'],
      },
      {
        id: 'partitioning',
        title: 'Partitioning and sharding',
        theory: [
          'Sharding splits a table across machines by a key. Range partitioning keeps neighbouring keys together, good for range scans but prone to hot spots. Hash partitioning spreads load evenly but scatters ranges.',
          'The shard key is the decision you cannot easily undo. Pick one that spreads both data and traffic, and that most queries include, or every query becomes a scatter-gather across all shards.',
        ],
        concepts: ['Range vs hash partitioning', 'Choosing a shard key', 'Hot keys and hot partitions', 'Scatter-gather queries', 'Rebalancing'],
      },
      {
        id: 'consistent-hashing',
        title: 'Consistent hashing',
        theory: [
          'With plain hashing (key mod N), adding one server remaps almost every key. Consistent hashing places servers and keys on a ring so a new server takes only its neighbours’ share, about 1/N of the keys.',
          'Virtual nodes give each machine many points on the ring to even out load. Caches, Dynamo-style databases and load balancers all use this.',
        ],
        concepts: ['Hash rings', 'Virtual nodes', 'Minimal remapping', 'Rendezvous hashing'],
      },
    ],
  },
  {
    id: 'consistency',
    title: 'Consistency and CAP',
    summary: 'Decide what users may see when copies of data disagree.',
    intro:
      'Once data lives in more than one place, copies can disagree. Consistency models are the vocabulary for what a reader is allowed to see, and CAP explains why you must choose what to give up when the network breaks.',
    next: ['distributed-coordination'],
    subsections: [
      {
        id: 'cap',
        title: 'CAP and PACELC',
        theory: [
          'During a network partition a system can stay consistent (refuse some requests) or stay available (answer with possibly stale data); it cannot do both. Partitions are rare but certain at scale, so this is a real design choice, not theory.',
          'PACELC adds the everyday case: else, when the network is fine, you still trade latency against consistency, because waiting for replicas to agree takes time.',
        ],
        concepts: ['Partitions', 'CP vs AP systems', 'PACELC', 'Choosing per operation'],
      },
      {
        id: 'models',
        title: 'Consistency models',
        theory: [
          'Strong (linearizable) consistency behaves like one copy: every read sees the latest write. Eventual consistency only promises copies converge if writes stop. In between sit read-your-writes, monotonic reads and causal consistency, each fixing one class of user-visible surprise.',
          'Often a weaker model is fine if you add the one guarantee users notice, such as showing a user their own new post immediately while others see it a second later.',
        ],
        concepts: ['Linearizability', 'Eventual consistency', 'Read-your-writes', 'Causal consistency'],
      },
      {
        id: 'quorum',
        title: 'Quorums',
        theory: [
          'In a leaderless store with N replicas, a write waits for W acknowledgements and a read asks R replicas. If W + R > N, every read overlaps at least one replica with the latest write. N=3, W=2, R=2 is a common balance.',
          'Lower W makes writes faster and reads riskier; sloppy quorums and hinted handoff keep writes available when replicas are down, at the cost of weaker guarantees.',
        ],
        concepts: ['N, W and R', 'Read repair', 'Sloppy quorums', 'Hinted handoff'],
      },
    ],
  },
  {
    id: 'async',
    title: 'Asynchronous messaging',
    summary: 'Decouple slow or bursty work with queues and event streams.',
    intro:
      'Not every task needs to finish before the user gets an answer. Queues let you accept work now and do it later, absorb traffic spikes, and keep one slow dependency from dragging down everything that calls it.',
    next: ['reliability', 'streams'],
    subsections: [
      {
        id: 'queues',
        title: 'Message queues',
        theory: [
          'A queue sits between a producer and consumers. The producer drops a message and returns immediately; consumers pull messages at their own pace. If consumers fall behind, the queue grows instead of requests failing.',
          'Queues need limits and monitoring: an unbounded queue hides an outage until memory runs out. Watch queue depth and the age of the oldest message, not just throughput.',
        ],
        concepts: ['Producers and consumers', 'Acknowledgements and redelivery', 'Dead-letter queues', 'Backlog monitoring'],
      },
      {
        id: 'pubsub',
        title: 'Pub/sub and event logs',
        theory: [
          'Publish/subscribe delivers each event to every interested subscriber, so a new consumer can be added without touching the producer. An event log such as Kafka keeps events durably in order per partition, and consumers can replay from any point.',
          'Replay is what makes logs powerful: rebuild a search index, backfill a new feature or recover from a bug by reading history again.',
        ],
        concepts: ['Topics and subscriptions', 'Partitions and ordering', 'Consumer groups', 'Retention and replay'],
      },
      {
        id: 'delivery',
        title: 'Delivery guarantees',
        theory: [
          'At-most-once may lose messages, at-least-once may duplicate them, exactly-once is expensive and usually means at-least-once plus deduplication. In practice you design consumers to be idempotent so duplicates are harmless.',
          'Ordering is usually guaranteed only within a partition, so put events that must stay ordered (one user’s actions, one order’s states) under the same key.',
        ],
        concepts: ['At-most-once', 'At-least-once', 'Exactly-once in practice', 'Idempotent consumers', 'Ordering keys'],
      },
    ],
  },
  {
    id: 'reliability',
    title: 'Reliability patterns',
    summary: 'Keep one failure from becoming a total outage.',
    intro:
      'In a system of many parts something is always failing. Reliability is the craft of containing failure: noticing it fast, not making it worse with retries, and shedding load before it cascades.',
    next: ['observability'],
    subsections: [
      {
        id: 'timeouts-retries',
        title: 'Timeouts, retries and backoff',
        theory: [
          'Every network call needs a timeout; without one a slow dependency ties up threads until the caller dies too. Retries hide brief failures but multiply load exactly when a system is struggling: three layers retrying three times each is 27 attempts.',
          'Retry only idempotent operations, back off exponentially with jitter, and cap retries with a budget. In Tracewire, kill a database under load and watch the retry storm in the event feed.',
        ],
        concepts: ['Timeouts and deadlines', 'Exponential backoff with jitter', 'Retry budgets', 'Retry amplification'],
      },
      {
        id: 'circuit-breakers',
        title: 'Circuit breakers and bulkheads',
        theory: [
          'A circuit breaker counts failures to a dependency and, past a threshold, fails calls instantly for a cooldown instead of waiting on timeouts. After the cooldown one probe request tests whether the dependency recovered.',
          'Bulkheads isolate resources: separate thread pools or instances per dependency so a slow payment provider cannot exhaust the threads that serve search.',
        ],
        concepts: ['Closed, open and half-open states', 'Fallbacks', 'Bulkhead isolation', 'Graceful degradation'],
      },
      {
        id: 'rate-limiting',
        title: 'Rate limiting and load shedding',
        theory: [
          'Rate limiting caps how much one client may ask for: token bucket allows bursts, sliding window counts precisely. Limits shared across many servers need a fast shared counter, usually in Redis.',
          'Load shedding drops low-priority work when the whole system is near capacity, so the important requests still succeed. A fast 429 is far better than a slow timeout for everyone.',
        ],
        concepts: ['Token bucket', 'Sliding window', 'Distributed counters', 'Priority-based shedding', 'Backpressure'],
      },
    ],
  },
  {
    id: 'api-advanced',
    title: 'Advanced APIs and real time',
    summary: 'Pick the right protocol for internal calls and live updates.',
    intro:
      'REST is a good default for public APIs, but internal service calls, mobile clients with slow links and live features each have better tools. This section covers when to use them.',
    next: ['security'],
    subsections: [
      {
        id: 'rpc-graphql',
        title: 'gRPC and GraphQL',
        theory: [
          'gRPC uses Protocol Buffers over HTTP/2 for fast, typed calls between services, with streaming in both directions. GraphQL lets clients ask for exactly the fields they need in one round trip, which suits mobile apps and varied front ends.',
          'Each moves complexity somewhere: gRPC needs code generation and is awkward in browsers; GraphQL needs query cost limits so one request cannot ask for the whole database.',
        ],
        concepts: ['gRPC and Protocol Buffers', 'GraphQL schemas and resolvers', 'N+1 queries', 'Query cost limits'],
      },
      {
        id: 'realtime',
        title: 'Polling, SSE and WebSockets',
        theory: [
          'Polling asks repeatedly and wastes most requests. Long polling holds a request open until there is news. Server-sent events stream one-way updates over HTTP. WebSockets keep a two-way connection open for chat, games and live collaboration.',
          'Long-lived connections are state: each user is pinned to one server, so you need a routing layer to find which server holds a user’s connection and a plan for reconnect storms after deploys.',
        ],
        concepts: ['Short and long polling', 'Server-sent events', 'WebSockets', 'Connection routing', 'Presence'],
      },
      {
        id: 'versioning',
        title: 'Versioning and gateways',
        theory: [
          'APIs change; clients upgrade slowly. Version in the URL (/v2/) or a header, add fields instead of breaking them, and keep old versions alive until traffic on them drops.',
          'An API gateway gives many services one front door: routing, authentication, quotas and request shaping in one place, at the cost of a few milliseconds and one more component to keep available.',
        ],
        concepts: ['URL vs header versioning', 'Backward compatibility', 'Deprecation', 'API gateways', 'Backend for frontend'],
      },
    ],
  },
  {
    id: 'storage-specialized',
    title: 'Specialized storage',
    summary: 'Use the store built for the query: blobs, search, time series.',
    intro:
      'A primary database answers most questions, but not all of them well. Large files, full-text search, metrics and geospatial queries each have stores built for them, fed from the system of record.',
    next: ['streams'],
    subsections: [
      {
        id: 'object-storage',
        title: 'Object storage',
        theory: [
          'Object storage (S3 and its peers) keeps files of any size with eleven nines of durability at a few cents per GB per month. Clients upload directly with pre-signed URLs so the bytes never pass through your servers.',
          'It is slow per request (tens of milliseconds) and cannot update part of a file, so put a CDN in front for reads and keep metadata in a database.',
        ],
        concepts: ['Buckets and keys', 'Pre-signed uploads', 'Multipart upload', 'Storage classes and lifecycle'],
      },
      {
        id: 'search-index',
        title: 'Search indexes',
        theory: [
          'An inverted index maps each word to the documents that contain it, making full-text search fast. Search engines add ranking, typo tolerance and facets that a relational database cannot do efficiently.',
          'The index is a copy that lags the source. Feed it from a change stream, rebuild it from scratch when the mapping changes, and never treat it as the system of record.',
        ],
        concepts: ['Inverted indexes', 'Relevance ranking', 'Change data capture into search', 'Reindexing'],
      },
      {
        id: 'timeseries-geo',
        title: 'Time-series and geospatial data',
        theory: [
          'Time-series databases are built for append-heavy timestamped data: high ingest, compression, downsampling and retention policies. Metrics, sensor readings and usage counters belong here.',
          'Geospatial indexes divide the map into cells (geohash, quadtrees, S2) so "drivers within 2 km" becomes a lookup of a few nearby cells instead of a scan.',
        ],
        concepts: ['Downsampling and retention', 'Geohash', 'Quadtrees and S2 cells', 'Proximity queries'],
      },
    ],
  },
  {
    id: 'lld',
    title: 'Low-level design',
    summary: 'Design the classes and interactions inside one service.',
    intro:
      'High-level design draws the boxes; low-level design fills one box with clean, testable code. Interviews test it with problems like a parking lot or an elevator, and real teams live with its results every day.',
    next: ['transactions-distributed'],
    subsections: [
      {
        id: 'oop-solid',
        title: 'Object modelling and SOLID',
        theory: [
          'Start from nouns and verbs in the requirements: nouns become classes, verbs become methods, and relationships become composition or inheritance. Prefer composition; deep inheritance trees are hard to change.',
          'SOLID is a checklist for code that survives change: single responsibility, open for extension, substitutable subtypes, small interfaces and dependence on abstractions instead of concrete classes.',
        ],
        concepts: ['Classes and responsibilities', 'Composition over inheritance', 'SOLID principles', 'Interfaces and dependency injection'],
      },
      {
        id: 'patterns',
        title: 'Design patterns',
        theory: [
          'Patterns are named solutions to recurring problems: Strategy swaps an algorithm (pricing rules), Observer notifies subscribers (an order changed), Factory hides construction, State models objects whose behaviour changes with their state (an elevator moving, idle or under maintenance).',
          'Use a pattern when the problem it solves is present, not to decorate code. Naming it in a design discussion saves minutes of explanation.',
        ],
        concepts: ['Strategy', 'Observer', 'Factory and Builder', 'State', 'Singleton and its pitfalls'],
      },
      {
        id: 'uml-concurrency',
        title: 'Modelling and concurrency',
        theory: [
          'Class diagrams show structure; sequence diagrams show who calls whom in what order. Both are worth sketching before code for any non-trivial flow.',
          'Inside one service, concurrency bugs hide in shared state: two threads booking the last seat. Locks, atomic operations and immutable data keep it correct; database constraints are the last line of defence.',
        ],
        concepts: ['Class diagrams', 'Sequence diagrams', 'Locks and atomic operations', 'Thread-safe design'],
      },
    ],
  },
];
