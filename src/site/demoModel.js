import { defaultConfigFor } from '../nodeDefs/nodeTypes';

// The small architecture the landing page demonstrates with: users -> load balancer ->
// app servers -> (cache) -> database. The traffic dial and the rack figure both run it
// through analyze.js, so they always agree with each other and with the simulator.

const SERVICE = { ...defaultConfigFor('service'), baseLatencyMs: 15, jitterMs: 10 };

export function buildDemoGraph({ cache, services, dbs }) {
  const node = (id, kind, label, config) => ({ id, data: { kind, label, config } });
  const nodes = [
    node('gen', 'generator', 'Users', { rate: 1 }),
    node('lb', 'loadbalancer', 'Load balancer', defaultConfigFor('loadbalancer')),
    node('svc', 'service', 'App servers', { ...SERVICE, replicas: services }),
    node('db', 'database', 'Database', { ...defaultConfigFor('database'), replicas: dbs }),
  ];
  const edges = [
    { id: 'a', source: 'gen', target: 'lb', data: { latencyMs: 2 } },
    { id: 'b', source: 'lb', target: 'svc', data: { latencyMs: 2 } },
  ];
  if (cache) {
    nodes.push(node('cache', 'cache', 'Cache', { ...defaultConfigFor('cache'), cacheHitRate: 0.85, replicas: 2 }));
    edges.push({ id: 'c', source: 'svc', target: 'cache', data: { latencyMs: 1 } }, { id: 'd', source: 'cache', target: 'db', data: { latencyMs: 2 } });
  } else {
    edges.push({ id: 'c', source: 'svc', target: 'db', data: { latencyMs: 2 } });
  }
  return { nodes, edges };
}

