import { NODE_TYPES, defaultConfigFor } from '../nodeDefs/nodeTypes';

// Expands a problem's compact sample design into canvas nodes and edges.
export function sampleToDiagram(problem) {
  const nodes = problem.sample.nodes.map((s, i) => {
    const config = { ...defaultConfigFor(s.k), ...(s.cfg || {}) };
    if (s.r !== undefined) config.replicas = s.r;
    return {
      id: `${problem.id}-${s.k}-${i}`,
      type: 'schematic',
      position: { x: s.x, y: s.y },
      data: { kind: s.k, label: s.label || NODE_TYPES[s.k].label, config },
    };
  });
  const edges = problem.sample.edges.map(([a, b]) => ({
    id: `e-${nodes[a].id}-${nodes[b].id}`,
    source: nodes[a].id,
    target: nodes[b].id,
    data: { latencyMs: 2 },
  }));
  return { nodes, edges };
}
