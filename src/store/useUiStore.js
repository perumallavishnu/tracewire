import { create } from 'zustand';
import { PHASES } from '../interview/phases';
import { problemById } from '../problems/problems';
import { scoreDesign } from '../scoring/score';
import { useDiagramStore } from './useDiagramStore';

const PROBLEM_KEY = 'tracewire:problem:v1';

function loadProblemId() {
  try {
    return localStorage.getItem(PROBLEM_KEY);
  } catch (e) {
    return null;
  }
}

export const useUiStore = create((set, get) => ({
  leftTab: 'components', // components | problems
  rightTab: 'inspect',   // inspect | tradeoffs | capacity | score
  activeProblemId: loadProblemId(),
  score: null,
  learnOpen: false,
  interview: { active: false, phase: 0, elapsedSec: 0, phaseStartSec: 0, paused: false },

  setLeftTab(leftTab) { set({ leftTab }); },
  setRightTab(rightTab) { set({ rightTab }); },
  setLearnOpen(learnOpen) { set({ learnOpen }); },

  setActiveProblem(id) {
    set({ activeProblemId: id, score: null });
    try {
      if (id) localStorage.setItem(PROBLEM_KEY, id);
      else localStorage.removeItem(PROBLEM_KEY);
    } catch (e) {
      // storage unavailable — the choice just won't survive a refresh
    }
  },

  activeProblem() {
    return problemById(get().activeProblemId);
  },

  runScore() {
    const { nodes, edges } = useDiagramStore.getState();
    set({ score: scoreDesign({ nodes, edges }, get().activeProblem()), rightTab: 'score' });
  },

  // ---------- interview ----------
  startInterview() {
    set({ interview: { active: true, phase: 0, elapsedSec: 0, phaseStartSec: 0, paused: false } });
  },
  endInterview() {
    set({ interview: { ...get().interview, active: false } });
  },
  toggleInterviewPause() {
    set({ interview: { ...get().interview, paused: !get().interview.paused } });
  },
  setPhase(phase) {
    const iv = get().interview;
    if (phase < 0 || phase >= PHASES.length) return;
    set({ interview: { ...iv, phase, phaseStartSec: iv.elapsedSec } });
  },
  tickInterview(dtSec) {
    const iv = get().interview;
    if (!iv.active || iv.paused) return;
    set({ interview: { ...iv, elapsedSec: iv.elapsedSec + dtSec } });
  },
}));
