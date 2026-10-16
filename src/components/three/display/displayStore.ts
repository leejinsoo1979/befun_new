import { create } from 'zustand';
import type { AssemblyPhase, AssemblyPlan } from './assemblyPlan';

export type ViewDirection = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'standard';
export type Appearance = 'realistic' | 'transparent' | 'wireframe';
export type Projection = 'perspective' | 'orthographic';
interface DisplayState {
  showDecor: boolean;
  toggleDecor: () => void;
  cinematic: boolean;
  setCinematic: (enabled:boolean) => void;
  view: ViewDirection;
  projection: Projection;
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
  boringSummary: { doors: number; holes: number; issues: string[] };
  showBores: boolean;
  toggleBores: () => void;
  exploded: boolean;
  phase: AssemblyPhase;
  paused: boolean;
  speed: number;
  progress: number;
  stageLabel: string;
  playbackId: number;
  autoAssemble: boolean;
  stageBounds: AssemblyPlan['bounds'] | null;
  togglePause: () => void;
  setSpeed: (speed: number) => void;
  replay: () => void;
  resetAssembly: () => void;
  revision: number;
  freeOrbit: boolean;
  selectView: (view: ViewDirection) => void;
  setProjection: (projection: Projection) => void;
  toggleExploded: () => void;
}

function playbackCamera() {
  const cinematic = typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { cinematic, freeOrbit: false, ...(cinematic ? { projection: 'perspective' as const } : {}) };
}

// Presentation only: never serialize this into a saved design or order.
export const useDisplayStore = create<DisplayState>((set) => ({
  showDecor: true, toggleDecor: () => set(s => ({showDecor: !s.showDecor})),
  cinematic: true, setCinematic: (cinematic) => set({cinematic,...(cinematic?{projection:'perspective' as const, freeOrbit:false}:{})}),
  boringSummary: { doors:0, holes:0, issues:[] },
  showBores: false, toggleBores: () => set(s => ({ showBores: !s.showBores })),
  phase: 'assembled', paused: false, speed: 1, progress: 0, stageLabel: '', playbackId: 0, autoAssemble: false, stageBounds: null,
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setSpeed: (speed) => set({ speed }),
  resetAssembly: () => set((s) => ({ exploded: false, phase: 'assembled', paused: false, progress: 0, stageLabel: '', autoAssemble: false, playbackId: s.playbackId + 1 })),
  replay: () => set((s) => ({ exploded: true, phase: 'disassembling', paused: false, progress: 0, autoAssemble: true, playbackId: s.playbackId + 1, view: 'standard', ...playbackCamera() })),
  appearance: 'realistic', setAppearance: (appearance) => set({ appearance }),
  view: 'front', projection: 'perspective', exploded: false, revision: 0, freeOrbit: false,
  selectView: (view) => set((s) => ({ view, revision: s.revision + 1, freeOrbit: false, ...(s.phase==='assembling'||s.phase==='disassembling'?{cinematic:false}:{}) })),
  setProjection: (projection) => set({ projection, cinematic: false }),
  toggleExploded: () => set((s) => s.phase === 'assembling' || s.phase === 'disassembling' ? {} : ({ exploded: true, phase: s.phase === 'laidOut' ? 'assembling' : 'disassembling', paused: false, progress: 0, autoAssemble: false, playbackId: s.playbackId + 1, view: 'standard', ...playbackCamera() })),
}));
