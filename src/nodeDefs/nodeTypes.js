// Default component definitions for the palette.
// Each entry describes a node "kind" — its category, schematic glyph,
// and the default simulation config it starts with when dropped on canvas.
//
// behavior: which engine code path the kind runs through (defaults to the kind
//   itself, which falls back to generic capacity-bound processing).
// tags:     architectural roles used by scoring and problem requirements.
// managed:  provider-run, highly available service (skipped by SPOF analysis).

export const CATEGORIES = ['Traffic', 'Networking', 'Compute', 'Storage', 'Messaging', 'Infrastructure', 'Custom'];

// Shorthand for the many capacity-bound components that only differ in numbers.
function bound(capacity, baseLatencyMs, jitterMs, failureRate, queueCapacity) {
  const cfg = { capacity, replicas: 1, baseLatencyMs, jitterMs, failureRate };
  if (queueCapacity !== undefined) cfg.queueCapacity = queueCapacity;
  return cfg;
}

export const NODE_TYPES = {
  // ---------- Traffic ----------
  generator: {
    label: 'Traffic Generator',
    category: 'Traffic',
    glyph: 'gen',
    description: 'Emits synthetic requests at a configurable rate.',
    tags: ['source'],
    defaultConfig: {
      rate: 20,       // requests per second
      jitter: 0.3,    // 0-1 fraction of rate as randomness
      burst: false,
    },
  },
  client: {
    label: 'Client / Sink',
    category: 'Traffic',
    glyph: 'cli',
    description: 'Terminal node representing the requester receiving the response.',
    tags: ['sink'],
    defaultConfig: {},
  },

  // ---------- Networking ----------
  dns: {
    label: 'DNS',
    category: 'Networking',
    glyph: 'dns',
    managed: true, // provider-run and highly available; never flagged as a SPOF
    description: 'Resolves names to addresses; can steer users by geography or health.',
    tags: ['entry'],
    defaultConfig: bound(2000, 2, 2, 0.0005),
  },
  cdn: {
    label: 'CDN Edge',
    category: 'Networking',
    glyph: 'cdn',
    behavior: 'cache',
    managed: true, // provider-run and highly available; never flagged as a SPOF
    description: 'Caches and serves static content close to the client.',
    tags: ['entry', 'edge'],
    defaultConfig: {
      capacity: 1000,
      replicas: 1,
      baseLatencyMs: 3,
      jitterMs: 2,
      failureRate: 0.001,
      cacheHitRate: 0.9,
      missPenaltyMs: 30,
    },
  },
  originshield: {
    label: 'Origin Shield',
    category: 'Networking',
    glyph: 'osh',
    behavior: 'cache',
    description: 'Mid-tier cache between CDN edges and origin; collapses duplicate misses.',
    tags: ['edge'],
    defaultConfig: {
      capacity: 600,
      replicas: 1,
      baseLatencyMs: 5,
      jitterMs: 3,
      failureRate: 0.001,
      cacheHitRate: 0.6,
      missPenaltyMs: 20,
    },
  },
  loadbalancer: {
    label: 'Load Balancer',
    category: 'Networking',
    glyph: 'lb',
    managed: true, // provider-run and highly available; never flagged as a SPOF
    description: 'Distributes inbound requests across downstream instances.',
    tags: ['entry', 'lb'],
    defaultConfig: {
      algorithm: 'round-robin', // round-robin | least-conn | random
      capacity: 500,
      baseLatencyMs: 2,
      jitterMs: 1,
      failureRate: 0.001,
      retryLimit: 2,
    },
  },
  reverseproxy: {
    label: 'Reverse Proxy',
    category: 'Networking',
    glyph: 'rp',
    behavior: 'loadbalancer',
    description: 'Terminates TLS, routes by path/host and spreads load (nginx, Envoy).',
    tags: ['entry', 'lb'],
    defaultConfig: {
      algorithm: 'least-conn',
      baseLatencyMs: 1,
      jitterMs: 1,
      failureRate: 0.001,
      retryLimit: 1,
    },
  },
  apigateway: {
    label: 'API Gateway',
    category: 'Networking',
    glyph: 'gw',
    description: 'Single front door for APIs: routing, auth checks, quotas, transforms.',
    tags: ['entry', 'gateway', 'protection'],
    defaultConfig: bound(400, 6, 3, 0.002, 100),
  },
  ratelimiter: {
    label: 'Rate Limiter',
    category: 'Networking',
    glyph: 'rl',
    description: 'Rejects requests once a configured rate threshold is exceeded.',
    tags: ['protection'],
    defaultConfig: {
      capacity: 300, // req/s allowed through, enforced globally across replicas
      replicas: 1,
      baseLatencyMs: 1,
      jitterMs: 0.5,
      failureRate: 0.0,
    },
  },

  // ---------- Compute ----------
  service: {
    label: 'Service',
    category: 'Compute',
    glyph: 'svc',
    description: 'Stateless application/service instance.',
    tags: ['compute'],
    defaultConfig: {
      capacity: 120,
      replicas: 1,
      baseLatencyMs: 40,
      jitterMs: 25,
      failureRate: 0.01,
      queueCapacity: 60,
      retryLimit: 1,
    },
  },
  auth: {
    label: 'Auth Service',
    category: 'Compute',
    glyph: 'auth',
    description: 'Validates credentials/tokens before allowing requests through.',
    tags: ['compute', 'security'],
    defaultConfig: bound(200, 10, 6, 0.004, 50),
  },
  websocket: {
    label: 'WebSocket Server',
    category: 'Compute',
    glyph: 'ws',
    description: 'Holds long-lived connections and pushes messages to clients in real time.',
    tags: ['compute', 'realtime'],
    defaultConfig: bound(800, 4, 3, 0.003, 200),
  },
  worker: {
    label: 'Worker Pool',
    category: 'Compute',
    glyph: 'wrk',
    description: 'Background consumers that pull jobs off a queue (encoding, emails, ETL).',
    tags: ['compute', 'worker'],
    defaultConfig: bound(60, 120, 80, 0.01, 200),
  },
  scheduler: {
    label: 'Task Scheduler',
    category: 'Compute',
    glyph: 'cron',
    description: 'Fires delayed and recurring jobs; hands work to queues or workers.',
    tags: ['compute', 'worker'],
    defaultConfig: bound(100, 30, 20, 0.002, 100),
  },
  streamproc: {
    label: 'Stream Processor',
    category: 'Compute',
    glyph: 'strm',
    description: 'Continuous computation over event streams (windowed counts, joins, enrichment).',
    tags: ['compute', 'worker'],
    defaultConfig: bound(400, 8, 6, 0.003, 400),
  },
  notifier: {
    label: 'Notification Service',
    category: 'Compute',
    glyph: 'ntf',
    description: 'Fans out push, email and SMS through third-party providers.',
    tags: ['compute', 'worker'],
    defaultConfig: bound(150, 90, 60, 0.02, 300),
  },

  // ---------- Storage ----------
  database: {
    label: 'SQL Database',
    category: 'Storage',
    glyph: 'sql',
    description: 'Relational store with transactions and joins; limited concurrent connections.',
    tags: ['store', 'primary-store', 'relational'],
    defaultConfig: bound(80, 15, 20, 0.005, 40),
  },
  nosql: {
    label: 'NoSQL Database',
    category: 'Storage',
    glyph: 'kv',
    description: 'Partitioned key-value / wide-column store that scales writes horizontally.',
    tags: ['store', 'primary-store'],
    defaultConfig: bound(200, 5, 6, 0.003, 80),
  },
  cache: {
    label: 'Cache',
    category: 'Storage',
    glyph: 'ca',
    description: 'In-memory cache with a configurable hit rate.',
    tags: ['cache'],
    defaultConfig: {
      capacity: 400,
      replicas: 1,
      baseLatencyMs: 2,
      jitterMs: 1,
      failureRate: 0.001,
      cacheHitRate: 0.75,
      missPenaltyMs: 12,
    },
  },
  objectstore: {
    label: 'Object Storage',
    category: 'Storage',
    glyph: 'obj',
    managed: true, // provider-run and highly available; never flagged as a SPOF
    description: 'Durable blob storage for media, backups and large files (S3-style).',
    tags: ['store', 'blob'],
    defaultConfig: bound(1500, 60, 40, 0.001),
  },
  filestore: {
    label: 'File Store',
    category: 'Storage',
    glyph: 'fs',
    description: 'Shared POSIX-like file system for workloads that need directories and locks.',
    tags: ['store', 'blob'],
    defaultConfig: bound(200, 12, 10, 0.002, 50),
  },
  search: {
    label: 'Search Index',
    category: 'Storage',
    glyph: 'idx',
    description: 'Inverted index for full-text and faceted queries (Elasticsearch-style).',
    tags: ['store', 'search'],
    defaultConfig: bound(150, 15, 15, 0.004, 60),
  },
  graphdb: {
    label: 'Graph Database',
    category: 'Storage',
    glyph: 'gdb',
    description: 'Stores relationships as first-class edges; fast multi-hop traversals.',
    tags: ['store'],
    defaultConfig: bound(100, 12, 12, 0.004, 40),
  },
  timeseries: {
    label: 'Time-Series DB',
    category: 'Storage',
    glyph: 'tsdb',
    description: 'Append-heavy store optimized for timestamped metrics and range scans.',
    tags: ['store'],
    defaultConfig: bound(300, 4, 3, 0.002, 200),
  },
  warehouse: {
    label: 'Data Warehouse',
    category: 'Storage',
    glyph: 'dwh',
    description: 'Columnar analytics store; huge scans, slow per-query, never on the hot path.',
    tags: ['store', 'analytics'],
    defaultConfig: bound(20, 400, 300, 0.002, 50),
  },
  vectordb: {
    label: 'Vector Database',
    category: 'Storage',
    glyph: 'vec',
    description: 'Approximate nearest-neighbor search over embeddings.',
    tags: ['store', 'search'],
    defaultConfig: bound(120, 10, 8, 0.003, 40),
  },
  geoindex: {
    label: 'Geospatial Index',
    category: 'Storage',
    glyph: 'geo',
    description: 'Answers "what is near this point" using geohash/quadtree cells.',
    tags: ['store', 'geo'],
    defaultConfig: bound(300, 4, 3, 0.002, 80),
  },

  // ---------- Messaging ----------
  queue: {
    label: 'Message Queue',
    category: 'Messaging',
    glyph: 'q',
    description: 'Buffers messages; smooths bursts into downstream consumers.',
    tags: ['async'],
    defaultConfig: {
      queueCapacity: 500,
      drainRate: 100, // messages/sec drained toward downstream, per partition
      replicas: 1,    // partitions
      baseLatencyMs: 1,
      failureRate: 0.001,
    },
  },
  broker: {
    label: 'Pub/Sub Broker',
    category: 'Messaging',
    glyph: 'brk',
    behavior: 'queue',
    description: 'Pub/sub broker fanning events out to subscribers.',
    tags: ['async'],
    defaultConfig: {
      queueCapacity: 800,
      drainRate: 250,
      replicas: 1,
      baseLatencyMs: 2,
      failureRate: 0.001,
    },
  },
  eventlog: {
    label: 'Event Log',
    category: 'Messaging',
    glyph: 'log',
    behavior: 'queue',
    description: 'Partitioned, replayable append-only log (Kafka-style) with high drain rate.',
    tags: ['async'],
    defaultConfig: {
      queueCapacity: 5000,
      drainRate: 1000,
      replicas: 1,
      baseLatencyMs: 3,
      failureRate: 0.0005,
    },
  },

  // ---------- Infrastructure ----------
  circuitbreaker: {
    label: 'Circuit Breaker',
    category: 'Infrastructure',
    glyph: 'cb',
    description: 'Fails fast when every downstream is down or saturated, then probes for recovery.',
    tags: ['protection'],
    defaultConfig: {
      replicas: 1,
      baseLatencyMs: 1,
      cooldownSec: 3,
    },
  },
  monitoring: {
    label: 'Monitoring',
    category: 'Infrastructure',
    glyph: 'mon',
    description: 'Collects metrics, logs and traces; alerts on SLO burn.',
    tags: ['observability'],
    defaultConfig: bound(2000, 2, 2, 0.0005),
  },
  servicemesh: {
    label: 'Service Mesh',
    category: 'Infrastructure',
    glyph: 'mesh',
    description: 'Sidecar layer adding mTLS, retries and traffic shifting between services.',
    tags: ['infra'],
    defaultConfig: bound(1500, 1, 1, 0.0005),
  },
  discovery: {
    label: 'Service Discovery',
    category: 'Infrastructure',
    glyph: 'sd',
    description: 'Registry of healthy instances so callers can find each other.',
    tags: ['infra'],
    defaultConfig: bound(1000, 1, 1, 0.0005),
  },
  coordination: {
    label: 'Coordination Service',
    category: 'Infrastructure',
    glyph: 'zk',
    description: 'Consensus-backed store for leader election and cluster membership.',
    tags: ['infra', 'consensus'],
    defaultConfig: bound(100, 6, 4, 0.001, 50),
  },
  lock: {
    label: 'Distributed Lock',
    category: 'Infrastructure',
    glyph: 'lock',
    description: 'Mutual exclusion across machines (leases with fencing tokens).',
    tags: ['infra', 'consensus'],
    defaultConfig: bound(120, 4, 3, 0.002, 60),
  },
  idgen: {
    label: 'ID Generator',
    category: 'Infrastructure',
    glyph: 'id',
    description: 'Hands out unique, roughly time-ordered IDs without a central bottleneck.',
    tags: ['infra'],
    defaultConfig: bound(2000, 1, 1, 0.0002),
  },
  counter: {
    label: 'Sharded Counter',
    category: 'Infrastructure',
    glyph: 'cnt',
    description: 'Spreads hot increments (likes, views) across shards and sums on read.',
    tags: ['infra'],
    defaultConfig: bound(1000, 2, 1, 0.001),
  },
  config: {
    label: 'Config Service',
    category: 'Infrastructure',
    glyph: 'cfg',
    description: 'Central feature flags and runtime configuration pushed to services.',
    tags: ['infra'],
    defaultConfig: bound(800, 2, 1, 0.0005),
  },
};

export function defaultConfigFor(kind) {
  return NODE_TYPES[kind] ? { ...NODE_TYPES[kind].defaultConfig } : {};
}

// Engine code path for a kind. Custom kinds fall through to generic processing.
export function behaviorOf(kind) {
  return NODE_TYPES[kind]?.behavior || kind;
}

export function tagsOf(kind) {
  return NODE_TYPES[kind]?.tags || [];
}
