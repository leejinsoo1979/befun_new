import type { LayoutReplaySnapshot } from './LayoutReplayDialog';
import { programFromLayout, type LayoutSawOptions } from './layoutProgram';
import { validateProgram } from './program';

/** 화면 재생과 영상 저장이 같은 재단 목록·트리 검증을 통과하도록 한다. */
export function layoutReplayProgram(snapshot: LayoutReplaySnapshot, sheetIndex: number, options: LayoutSawOptions) {
  if (snapshot.mode === 'OPTIMAL_CNC') throw new Error('네스팅 윤곽 가공은 컷쏘 재단과 다릅니다. 루터 경로 연결 전이므로 톱 재단으로 바꾸어 재생하지 않습니다.');
  const plan = snapshot.plans[sheetIndex];
  if (!plan) throw new Error(snapshot.planErrors?.[sheetIndex] ?? '옵티마이저 재단 트리가 없습니다. 재계산해 주십시오.');
  const listed = snapshot.cuts.filter(c => c.sheetNumber === sheetIndex + 1);
  if (listed.length !== plan.operations.length || listed.some((c, i) => c.id !== plan.operations[i].id || c.pos !== plan.operations[i].pos || c.axis !== plan.operations[i].axis || c.kerf !== plan.kerf || c.spanStart !== plan.operations[i].spanStart || c.spanEnd !== plan.operations[i].spanEnd)) throw new Error('재단 목록과 트리가 일치하지 않습니다. 재계산해 주십시오.');
  return programFromLayout(snapshot.results[sheetIndex], plan, options);
}

export function videoProgramsFromLayout(snapshot: LayoutReplaySnapshot, options: LayoutSawOptions) {
  if (!snapshot.results.length) throw new Error('저장할 원장이 없습니다.');
  // 선택 이후 설계 상태가 바뀌어도 영상 입력은 고정한다.
  const copy = structuredClone(snapshot), settings = structuredClone(options);
  return copy.results.map((_, i) => {
    try {
      const program = layoutReplayProgram(copy, i, settings);
      const errors = validateProgram(program);
      if (errors.length || !program.steps.length) throw new Error(errors.join(' · ') || '재생할 공정이 없습니다.');
      return program;
    } catch (error) { throw new Error(`원장 ${i + 1}: ${error instanceof Error ? error.message : String(error)}`); }
  });
}
