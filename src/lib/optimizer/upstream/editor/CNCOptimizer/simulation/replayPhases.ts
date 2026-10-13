import type { MachiningProgram, ReplayStep } from './program';

export type ReplayPhase = { station: 'saw' | 'edgebander' | 'router'; label: string; first: number; end: number; startMs: number; endMs: number };
const labels = { saw: '재단', edgebander: '엣지밴딩', router: '보링·홈 가공' };
const stationOf = (step: ReplayStep, program: MachiningProgram) => {
  if (step.station) return step.station;
  if (step.kind === 'drill' || step.kind === 'mill') return 'router';
  if ('toolId' in step) return program.tools.find(t => t.id === step.toolId)?.kind === 'drill' ? 'router' : 'saw';
};

/** 입력 순서를 보존한 연속 공정 구간. 분류를 위해 절단/가공 단계를 새로 만들지 않는다. */
export function replayPhases(program: MachiningProgram) {
  const phases: ReplayPhase[] = [], offsets: number[] = [];
  let time = 0;
  program.steps.forEach((step, index) => {
    offsets.push(time);
    const previous = phases.at(-1), station = stationOf(step, program) ?? previous?.station ?? 'saw';
    time += step.durationMs;
    if (previous?.station === station) { previous.end = index + 1; previous.endMs = time; }
    else phases.push({ station, label: labels[station], first: index, end: index + 1, startMs: offsets[index], endMs: time });
  });
  return { phases, offsets };
}
