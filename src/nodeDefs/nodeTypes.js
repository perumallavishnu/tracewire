// Default component definitions for the palette.
// Each entry describes a node "kind" — its category, schematic glyph,
// and the default simulation config it starts with when dropped on canvas.

export const CATEGORIES = ['Traffic', 'Compute', 'Storage', 'Networking', 'Messaging', 'Custom'];

export const NODE_TYPES = {
  generator: {
    label: 'Traffic Generator',
    category: 'Traffic',
    glyph: 'gen',
    description: 'Emits synthetic requests at a configurable rate.',
    defaultConfig: {
      rate: 20,       // requests per second
      jitter: 0.3,    // 0-1 fraction of rate as randomness
      burst: false,
    },
  },
  loadbalancer: {
    label: 'Load Balancer',
    category: 'Networking',
    glyph: 'lb',
    description: 'Distributes inbound requests across downstream instances.',
    defaultConfig: {
      algorithm: 'round-robin', // round-robin | least-conn | random
      capacity: 500,
      baseLatencyMs: 2,
      jitterMs: 1,
      failureRate: 0.001,
      retryLimit: 2,
    },
  },
  service: {
    label: 'Service',
    category: 'Compute',
    glyph: 'svc',
    description: 'Stateless application/service instance.',
    defaultConfig: {
      capacity: 120,
      baseLatencyMs: 40,
      jitterMs: 25,
      failureRate: 0.01,
      queueCapacity: 60,
      retryLimit: 1,
    },
  },
  database: {
    label: 'Database',
    category: 'Storage',
    glyph: 'db',
    description: 'Persistent datastore with limited concurrent connections.',
    defaultConfig: {
      capacity: 80,
      baseLatencyMs: 15,
      jitterMs: 20,
      failureRate: 0.005,
      queueCapacity: 40,
    },
  },
  cache: {
    label: 'Cache',
    category: 'Storage',
    glyph: 'ca',
    description: 'In-memory cache with a configurable hit rate.',
    defaultConfig: {
      capacity: 400,
      baseLatencyMs: 2,
      jitterMs: 1,
      failureRate: 0.001,
      cacheHitRate: 0.75,
      missPenaltyMs: 12,
    },
  },
  queue: {
    label: 'Message Queue',
    category: 'Messaging',
    glyph: 'q',
    description: 'Buffers messages; smooths bursts into downstream consumers.',
    defaultConfig: {
      queueCapacity: 500,
      drainRate: 100, // messages/sec drained toward downstream
      baseLatencyMs: 1,
      failureRate: 0.001,
    },
  },
  cdn: {
    label: 'CDN Edge',
    category: 'Networking',
    glyph: 'cdn',
    description: 'Caches and serves static content close to the client.',
    defaultConfig: {
      capacity: 1000,
      baseLatencyMs: 3,
      jitterMs: 2,
      failureRate: 0.001,
      cacheHitRate: 0.9,
      missPenaltyMs: 30,
    },
  },
  auth: {
    label: 'Auth Service',
    category: 'Compute',
    glyph: 'auth',
    description: 'Validates credentials/tokens before allowing requests through.',
    defaultConfig: {
      capacity: 200,
      baseLatencyMs: 10,
      jitterMs: 6,
      failureRate: 0.004,
      queueCapacity: 50,
    },
  },
  broker: {
    label: 'Message Broker',
    category: 'Messaging',
    glyph: 'brk',
    description: 'Pub/sub broker fanning events out to subscribers.',
    defaultConfig: {
      queueCapacity: 800,
      drainRate: 250,
      baseLatencyMs: 2,
      failureRate: 0.001,
    },
  },
  ratelimiter: {
    label: 'Rate Limiter',
    category: 'Networking',
    glyph: 'rl',
    description: 'Rejects requests once a configured rate threshold is exceeded.',
    defaultConfig: {
      capacity: 300, // req/s allowed through
      baseLatencyMs: 1,
      jitterMs: 0.5,
      failureRate: 0.0,
    },
  },
  client: {
    label: 'Client / Sink',
    category: 'Traffic',
    glyph: 'cli',
    description: 'Terminal node representing the requester receiving the response.',
    defaultConfig: {},
  },
};

export function defaultConfigFor(kind) {
  return NODE_TYPES[kind] ? { ...NODE_TYPES[kind].defaultConfig } : {};
}
