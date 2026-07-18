import { create } from 'zustand';
import { SimulationEngine } from '../simulation/engine';

const engine = new SimulationEngine();

export const useSimStore = create((set, get) => ({
  engine,
  running: false,
  speed: 1,
  snapshot: { time: 0, nodes: {}, edges: {}, metrics: {}, history: [], eventLog: [], activeEffects: [] },

  play() {
    engine.running = true;
    set({ running: true });
  },
  pause() {
    engine.running = false;
    set({ running: false });
  },
  toggle() {
    get().running ? get().pause() : get().play();
  },
  setSpeed(speed) {
    engine.speed = speed;
    set({ speed });
  },
  resetSim() {
    engine.reset();
    engine.speed = get().speed;
    set({ running: false, snapshot: engine.getSnapshot({ nodes: [], edges: [] }) });
  },

  // Called every animation frame by the driving hook with the current graph.
  step(dt, graph) {
    if (engine.running) {
      engine.tick(dt, graph);
    }
    set({ snapshot: engine.getSnapshot(graph) });
  },

  // Chaos actions delegate straight to the engine, then force a snapshot refresh.
  killNode(id, dur) { engine.killNode(id, dur); },
  reviveNode(id) { engine.reviveNode(id); },
  partitionEdge(id, dur) { engine.partitionEdge(id, dur); },
  healEdge(id) { engine.healEdge(id); },
  latencySpike(id, mult, dur) { engine.latencySpike(id, mult, dur); },
  capacityDrop(id, frac, dur) { engine.capacityDrop(id, frac, dur); },
  setChaosMonkey(enabled, interval) { engine.setChaosMonkey(enabled, interval); },
}));
