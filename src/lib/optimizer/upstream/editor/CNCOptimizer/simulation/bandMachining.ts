import type { BufferGeometry } from 'three';
import { bandTapeRange, type BandingState } from './edgeBandingProcess';
import type { MachiningProgram } from './program';
import { machiningAt, subtract, sweptTool } from './removal';
import { routedPanel, routedSections } from './routedPanel';

/** 테이프도 원래 판재 좌표 안의 재료다. CNC 가공 뒤에 구멍/따내기를 덮지 않는다. */
export function bandRegion(state: BandingState, states: BandingState[], applied = state.trimmed): [number, number, number, number] | undefined {
  const { start, end } = bandTapeRange(state, states), stop = Math.min(end, applied);
  if (stop <= start) return;
  const [w, h] = state.stock.size, d = state.band.thickness;
  switch (state.band.edge) {
    case 'bottom': return [w-stop, 0, w-start, d];
    case 'top': return [start, h-d, stop, h];
    case 'left': return [0, start, d, stop];
    case 'right': return [w-d, h-stop, w, h-start];
  }
}

export class BandMachining {
  private cache = new Map<string, { key: string; geometry: BufferGeometry }>();
  constructor(readonly program: MachiningProgram) {}
  geometry(state: BandingState, states: BandingState[], time: number) {
    const region = bandRegion(state, states);
    if (!region) return;
    const { sweeps, holes, other } = machiningAt(this.program, state.stock.id, time);
    const key = JSON.stringify([region, sweeps.map(s => [s.step.id,s.progress]), holes, other.map(s => [s.step.id,s.progress])]);
    const previous = this.cache.get(state.id);
    if (previous?.key === key) return previous.geometry;
    let geometry = routedPanel(state.stock.size, sweeps, holes, [], region);
    for (const { step, tool, progress } of other) {
      const cutter = sweptTool(step, tool, progress);
      if (cutter && geometry.getAttribute('position').count) {
        cutter.computeBoundingBox(); geometry.computeBoundingBox();
        if (geometry.boundingBox!.intersectsBox(cutter.boundingBox!)) {
          const next = subtract(geometry, cutter);
          geometry.dispose(); geometry = next;
        }
      }
      cutter?.dispose();
    }
    previous?.geometry.dispose();
    this.cache.set(state.id, { key, geometry });
    return geometry;
  }
  dispose() { this.cache.forEach(v => v.geometry.dispose()); this.cache.clear(); }
}

/** 우측 배치도에도 따내기로 제거된 테이프가 남지 않도록 같은 절삭 단면을 사용한다. */
export function bandOutline(program: MachiningProgram, state: BandingState, states: BandingState[], time: number) {
  const region = bandRegion(state, states, state.pressed);
  if (!region) return '';
  const { sweeps, holes } = machiningAt(program, state.stock.id, time);
  const { layers } = routedSections(state.stock.size, sweeps, holes, [], region);
  const o = state.stock.sourceOrigin ?? [0,0,0];
  // 위에서 보는 단면. 측면 홀은 별도 가공 오버레이가 같은 위치에 표시한다.
  return (layers.at(-1)?.shape ?? []).flatMap(p => p.map(r => r.map(([x,y],i) => `${i ? 'L' : 'M'}${x+o[0]} ${y+o[1]}`).join(' ')+'Z')).join(' ');
}
