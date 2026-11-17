// Advanced zone: agreement between machines, correctness across services, and running at global scale.

export const ADVANCED = [
  {
    id: 'distributed-coordination',
    title: 'Distributed coordination',
    summary: 'Get many machines to agree on one answer.',
    intro:
      'Leader election, locks and configuration all need machines to agree even when some of them crash or the network splits. Consensus algorithms make that possible, and their limits explain many real outages.',
    next: ['transactions-distributed'],
    subsections: [
      {
        id: 'consensus',
        title: 'Consensus: Raft and Paxos',
        theory: [
          'Consensus lets a group of nodes agree on a sequence of values as long as a majority is alive. Raft elects a leader that appends entries to a replicated log; an entry is committed once a majority has stored it. Five nodes survive two failures.',
          'Consensus is slow by design (every commit needs a majority round trip), so systems keep it for small, critical data: who the leader is, cluster membership, configuration.',
        ],
        concepts: ['Majority quorums', 'Raft leader election', 'Replicated logs', 'Paxos', 'Etcd, ZooKeeper and Consul'],
      },
      {
        id: 'locks-leases',
        title: 'Distributed locks and leases',
        theory: [
          'A distributed lock lets one worker act at a time: run a cron job once, assign a driver to one rider. Locks are leases with an expiry so a crashed holder does not block forever.',
          'A paused process can wake up after its lease expired and still think it holds the lock. Fencing tokens, an increasing number checked by the storage layer, stop the stale holder from writing.',
        ],
        concepts: ['Leases and expiry', 'Fencing tokens', 'Leader election with locks', 'Lock-free alternatives'],
      },
      {
        id: 'time',
        title: 'Clocks and ordering',
        theory: [
          'Machine clocks drift and jump, so timestamps from different machines cannot reliably order events. Lamport clocks give a consistent order from counters; vector clocks also detect when two events were concurrent.',
          'Some databases use tightly synchronized clocks with known error bounds to offer global ordering, waiting out the uncertainty before committing.',
        ],
        concepts: ['Clock skew and NTP', 'Lamport clocks', 'Vector clocks', 'Hybrid logical clocks', 'TrueTime-style bounds'],
      },
    ],
  },
  {
    id: 'transactions-distributed',
    title: 'Distributed transactions',
    summary: 'Keep data correct when one action spans several services.',
    intro:
      'Booking a trip touches flights, hotels and payments, each with its own database. Without one transaction across them, you need patterns that keep the whole thing consistent even when steps fail halfway.',
    next: ['global-scale'],
    subsections: [
      {
        id: 'two-phase',
        title: 'Two-phase commit',
        theory: [
          'Two-phase commit asks every participant to prepare, then tells all of them to commit only if all said yes. It gives atomicity across databases but blocks if the coordinator dies after prepare, and every participant holds locks for the whole round.',
          'It works inside one database cluster or a tightly controlled set of systems; across independent services it is usually too fragile and slow.',
        ],
        concepts: ['Prepare and commit phases', 'Coordinator failure', 'Blocking and lock holding', 'XA transactions'],
      },
      {
        id: 'sagas',
        title: 'Sagas',
        theory: [
          'A saga splits a business transaction into local steps, each with a compensating action that undoes it: reserve seat, then charge card; if the charge fails, release the seat. Orchestrated sagas have a coordinator; choreographed sagas react to each other’s events.',
          'Sagas give up isolation: other users can see the middle states. Design those states explicitly (pending, confirmed, cancelled) and make every step and compensation idempotent.',
        ],
        concepts: ['Compensating actions', 'Orchestration vs choreography', 'Semantic locks', 'Pending states'],
      },
      {
        id: 'outbox',
        title: 'Outbox and exactly-once effects',
        theory: [
          'Writing to your database and publishing an event are two systems; one can succeed while the other fails. The transactional outbox writes the event into a table in the same transaction, and a relay publishes it afterwards.',
          'Combined with idempotency keys and idempotent consumers, this gives the effect of exactly-once processing: duplicates may arrive but change nothing.',
        ],
        concepts: ['Transactional outbox', 'Change data capture', 'Idempotency keys', 'Deduplication tables'],
      },
    ],
  },
  {
    id: 'streams',
    title: 'Streams and data platforms',
    summary: 'Process events continuously and feed analytics without slowing the product.',
    intro:
      'Clicks, payments and sensor readings arrive as endless streams. Stream processing turns them into live counts, alerts and features in seconds, while batch pipelines and warehouses answer the slower, deeper questions.',
    next: ['observability'],
    subsections: [
      {
        id: 'stream-processing',
        title: 'Stream processing',
        theory: [
          'A stream processor reads an event log and keeps running state: counts per minute, fraud scores per card, trending hashtags. Windows (tumbling, sliding, session) decide which events are counted together.',
          'Events arrive late and out of order. Event time, watermarks and allowed lateness decide when a window is final; checkpointed state makes the job recoverable.',
        ],
        concepts: ['Tumbling, sliding and session windows', 'Event time vs processing time', 'Watermarks', 'Stateful operators and checkpoints'],
      },
      {
        id: 'batch-lambda',
        title: 'Batch, lambda and kappa',
        theory: [
          'Batch jobs process a full day of data for accuracy; streams give fast, approximate answers. Lambda architecture runs both and merges the results. Kappa architecture uses only the stream and replays the log when logic changes.',
          'Either way, the raw event log is the source of truth from which every derived view can be rebuilt.',
        ],
        concepts: ['Batch processing', 'Lambda architecture', 'Kappa architecture', 'Reprocessing from the log'],
      },
      {
        id: 'warehouse',
        title: 'Warehouses and lakes',
        theory: [
          'Columnar warehouses scan billions of rows quickly for analytics, but take seconds per query and must never sit on the request path. Data lakes keep raw files cheaply in object storage for later processing.',
          'Production data flows into them through change data capture and event streams, keeping analytics load completely off the operational databases.',
        ],
        concepts: ['Columnar storage', 'ETL and ELT', 'Data lakes', 'Star schemas'],
      },
    ],
  },
  {
    id: 'observability',
    title: 'Observability and SRE',
    summary: 'See what the system is doing and keep promises about it.',
    intro:
      'You cannot fix what you cannot see. Observability gives you metrics, logs and traces; SRE practice turns them into explicit reliability targets, capacity plans and drills so outages are rare, short and understood.',
    next: ['global-scale'],
    subsections: [
      {
        id: 'three-pillars',
        title: 'Metrics, logs and traces',
        theory: [
          'Metrics are cheap numbers over time (request rate, error rate, latency percentiles, saturation). Logs record individual events with context. Distributed traces follow one request across every service it touches, showing where the time went.',
          'Track percentiles, not averages: a 50 ms average can hide a p99 of two seconds that one in a hundred users sees on every page.',
        ],
        concepts: ['RED and USE methods', 'Latency percentiles', 'Structured logging', 'Distributed tracing', 'Cardinality costs'],
      },
      {
        id: 'slo',
        title: 'SLIs, SLOs and error budgets',
        theory: [
          'An SLI measures what users feel (successful requests under 300 ms). An SLO sets the target (99.9% over 30 days). The error budget is the allowance left: 43 minutes a month at 99.9%.',
          'Spend the budget on releases and experiments; when it runs out, slow down and fix reliability. Alert on budget burn rate rather than on every spike.',
        ],
        concepts: ['Service level indicators', 'Service level objectives', 'Error budgets', 'Burn-rate alerting'],
      },
      {
        id: 'capacity-chaos',
        title: 'Capacity planning and chaos',
        theory: [
          'Capacity planning forecasts peak load and keeps every component below about 70% at that peak, leaving headroom for spikes and failover. Load tests check the forecast against reality.',
          'Chaos engineering breaks things on purpose (kill instances, add latency, cut links) in controlled experiments to prove the system degrades the way you think it does. Tracewire’s chaos monkey is a small version of this.',
        ],
        concepts: ['Headroom and utilization', 'Load testing', 'Chaos experiments', 'Game days and runbooks'],
      },
    ],
  },
  {
    id: 'global-scale',
    title: 'Global scale',
    summary: 'Serve every continent and survive losing a whole region.',
    intro:
      'At global scale the speed of light becomes a design constraint and a whole data centre is just another component that can fail. This section covers running in many regions and recovering from disasters.',
    next: [],
    subsections: [
      {
        id: 'multi-region',
        title: 'Multi-region architecture',
        theory: [
          'Active-passive keeps a standby region ready for failover; active-active serves traffic from every region at once. Active-active cuts latency for everyone but forces you to handle writes to the same data in two places.',
          'Common answers: route each user to a home region for their writes, use conflict-free data types for data that can merge, and keep strongly consistent data in one region.',
        ],
        concepts: ['Active-passive', 'Active-active', 'Home regions', 'CRDTs', 'Global load balancing'],
      },
      {
        id: 'disaster-recovery',
        title: 'Disaster recovery',
        theory: [
          'RPO is how much data you can afford to lose; RTO is how long you can be down. Backups to another region give an RPO of hours; continuous replication gives seconds. Both are worthless until you have tested restoring from them.',
          'Practise failover regularly. The first real region outage is a bad time to discover that the runbook is stale.',
        ],
        concepts: ['RPO and RTO', 'Backups and snapshots', 'Cross-region replication', 'Failover drills'],
      },
      {
        id: 'edge',
        title: 'Edge computing and data residency',
        theory: [
          'Edge functions run small pieces of logic in CDN locations: authentication checks, A/B routing, personalization of cached pages, all within milliseconds of the user.',
          'Laws such as GDPR can require some data to stay in a country or region. Partition by jurisdiction and make residency part of the data model, not an afterthought.',
        ],
        concepts: ['Edge functions', 'Data residency', 'Regional partitioning', 'Latency budgets per region'],
      },
    ],
  },
  {
    id: 'security',
    title: 'Security by design',
    summary: 'Authenticate, authorize and protect data at every layer.',
    intro:
      'Security is a property of the whole design, not a feature added at the end. Every request needs a verified identity, every action a permission check, and every byte of sensitive data protection in transit and at rest.',
    next: ['global-scale'],
    subsections: [
      {
        id: 'authn-authz',
        title: 'Authentication and authorization',
        theory: [
          'Authentication proves who someone is; authorization decides what they may do. OAuth 2.0 and OpenID Connect let users sign in with an identity provider; short-lived access tokens with refresh tokens limit the damage of a leak.',
          'Check permissions on the server for every request. Role-based access works for most apps; attribute- or relationship-based access handles sharing and teams.',
        ],
        concepts: ['Sessions vs tokens', 'OAuth 2.0 and OpenID Connect', 'JWT pitfalls', 'RBAC and ABAC'],
      },
      {
        id: 'data-protection',
        title: 'Protecting data',
        theory: [
          'Encrypt in transit with TLS everywhere, including between internal services. Encrypt at rest, and keep keys in a key management service rather than in config files.',
          'Store passwords with a slow hash such as bcrypt or Argon2, never encrypted or plain. Collect less personal data and you have less to protect.',
        ],
        concepts: ['TLS and mTLS', 'Encryption at rest', 'Key management', 'Password hashing', 'Secrets management'],
      },
      {
        id: 'abuse',
        title: 'Abuse and attack resilience',
        theory: [
          'Public systems face floods of traffic, credential stuffing and scraping. CDNs and rate limiters absorb volumetric attacks; per-account limits and anomaly detection catch the subtle ones.',
          'Validate all input, use parameterized queries, and assume any internal service can be compromised: zero-trust networks authenticate every call.',
        ],
        concepts: ['DDoS mitigation', 'Credential stuffing defence', 'Input validation and injection', 'Zero-trust networking'],
      },
    ],
  },
];
