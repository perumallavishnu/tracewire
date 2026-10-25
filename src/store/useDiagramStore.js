import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { NODE_TYPES, defaultConfigFor } from '../nodeDefs/nodeTypes';

const STORAGE_KEY = 'tracewire:diagram:v1';

function seedDiagram() {
  return {
    nodes: [
      { id: 'gen1', type: 'schematic', position: { x: 40, y: 220 }, data: { kind: 'generator', label: 'Traffic Generator', config: defaultConfigFor('generator') } },
      { id: 'lb1', type: 'schematic', position: { x: 320, y: 220 }, data: { kind: 'loadbalancer', label: 'Load Balancer', config: defaultConfigFor('loadbalancer') } },
      { id: 'svc1', type: 'schematic', position: { x: 600, y: 100 }, data: { kind: 'service', label: 'API Service A', config: defaultConfigFor('service') } },
      { id: 'svc2', type: 'schematic', position: { x: 600, y: 340 }, data: { kind: 'service', label: 'API Service B', config: defaultConfigFor('service') } },
      { id: 'cache1', type: 'schematic', position: { x: 880, y: 100 }, data: { kind: 'cache', label: 'Cache', config: defaultConfigFor('cache') } },
      { id: 'db1', type: 'schematic', position: { x: 1140, y: 220 }, data: { kind: 'database', label: 'Primary DB', config: defaultConfigFor('database') } },
      { id: 'client1', type: 'schematic', position: { x: 880, y: 340 }, data: { kind: 'client', label: 'Client', config: defaultConfigFor('client') } },
    ],
    edges: [
      { id: 'e-gen-lb', source: 'gen1', target: 'lb1', data: { latencyMs: 3 } },
      { id: 'e-lb-svc1', source: 'lb1', target: 'svc1', data: { latencyMs: 4 } },
      { id: 'e-lb-svc2', source: 'lb1', target: 'svc2', data: { latencyMs: 4 } },
      { id: 'e-svc1-cache', source: 'svc1', target: 'cache1', data: { latencyMs: 2 } },
      { id: 'e-svc2-cache', source: 'svc2', target: 'cache1', data: { latencyMs: 2 } },
      { id: 'e-cache-db', source: 'cache1', target: 'db1', data: { latencyMs: 3 } },
      { id: 'e-svc2-client', source: 'svc2', target: 'client1', data: { latencyMs: 2 } },
      { id: 'e-cache-client', source: 'cache1', target: 'client1', data: { latencyMs: 1 } },
    ],
  };
}

export const useDiagramStore = create((set, get) => ({
  nodes: [],
  edges: [],
  customTypes: {}, // user-created node type templates, keyed by id
  selectedNodeId: null,
  selectedEdgeId: null,

  init() {
    const saved = loadFromStorage();
    if (saved) {
      set({ nodes: saved.nodes, edges: saved.edges, customTypes: saved.customTypes || {} });
    } else {
      const seed = seedDiagram();
      set({ nodes: seed.nodes, edges: seed.edges });
    }
  },

  onNodesChange(changes) {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  onEdgesChange(changes) {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect(connection) {
    const id = `e-${connection.source}-${connection.target}-${nanoid(4)}`;
    set({ edges: addEdge({ ...connection, id, data: { latencyMs: 5 } }, get().edges) });
  },

  addNode(kind, position) {
    if (kind === 'note') {
      const id = `note-${nanoid(5)}`;
      const node = { id, type: 'note', position, data: { kind: 'note', label: 'Note', text: '' } };
      set({ nodes: [...get().nodes, node] });
      return id;
    }
    const def = NODE_TYPES[kind] || get().customTypes[kind];
    const label = def ? def.label : kind;
    const id = `${kind}-${nanoid(5)}`;
    const node = {
      id,
      type: 'schematic',
      position,
      data: { kind, label, config: def ? { ...def.defaultConfig } : {} },
    };
    set({ nodes: [...get().nodes, node] });
    return id;
  },

  updateNodeConfig(nodeId, patch) {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, config: { ...n.data.config, ...patch } } } : n
      ),
    });
  },

  setNoteText(nodeId, text) {
    set({
      nodes: get().nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, text } } : n)),
    });
  },

  // patches: { [nodeId]: configPatch } applied in one update (used by right-sizing)
  updateManyConfigs(patches) {
    set({
      nodes: get().nodes.map((n) =>
        patches[n.id] ? { ...n, data: { ...n.data, config: { ...n.data.config, ...patches[n.id] } } } : n
      ),
    });
  },

  renameNode(nodeId, label) {
    set({
      nodes: get().nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label } } : n)),
    });
  },

  deleteNode(nodeId) {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: null,
    });
  },

  deleteEdge(edgeId) {
    set({ edges: get().edges.filter((e) => e.id !== edgeId), selectedEdgeId: null });
  },

  updateEdgeConfig(edgeId, patch) {
    set({
      edges: get().edges.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, ...patch } } : e)),
    });
  },

  setSelectedNode(nodeId) {
    set({ selectedNodeId: nodeId, selectedEdgeId: null });
  },
  setSelectedEdge(edgeId) {
    set({ selectedEdgeId: edgeId, selectedNodeId: null });
  },

  registerCustomType(id, definition) {
    set({ customTypes: { ...get().customTypes, [id]: definition } });
  },

  loadDiagram(diagram) {
    set({
      nodes: diagram.nodes || [],
      edges: diagram.edges || [],
      customTypes: diagram.customTypes || {},
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  resetToSeed() {
    const seed = seedDiagram();
    set({ nodes: seed.nodes, edges: seed.edges, customTypes: {} });
  },

  clearCanvas() {
    set({ nodes: [], edges: [] });
  },

  persist() {
    const { nodes, edges, customTypes } = get();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges, customTypes }));
    } catch (e) {
      // storage unavailable — silently ignore, diagram just won't survive a refresh
    }
  },
}));

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
