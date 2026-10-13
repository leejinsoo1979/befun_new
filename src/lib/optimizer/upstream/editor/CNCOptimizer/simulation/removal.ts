import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import type { MachiningProgram, ReplayStep, ReplayTool } from './program';
import { cursorAt, interpolate, isEdgeMillFace, MILL_FACE_DIRECTION, validateProgram } from './program';
import { drilledPanel, type PanelHole } from './drilledPanel';
import { sawnStock } from './sawnStock';
import { routedPanel, type MillSweep } from './routedPanel';
import { edgeMillingFootprints } from './edgeMilling';

const evaluator = new Evaluator();
evaluator.useGroups = false;
const v = (p: [number, number, number]) => new THREE.Vector3(...p);

/** 공구가 실제로 차지한 부피. 표시용 선/그림을 파인 형상으로 취급하지 않는다. */
export function sweptTool(step: ReplayStep, tool: ReplayTool, progress: number): THREE.BufferGeometry | null {
  const t = Math.max(0, Math.min(1, progress));
  if (t <= 0) return null;
  if (step.kind === 'saw' && tool.kind === 'saw') {
    const from = v(step.from), end = v(interpolate(step.from, step.to, t));
    const direction = end.clone().sub(from).normalize();
    const distance = end.distanceTo(from), radius = tool.diameter / 2;
    // 수평 이동 원판의 합집합은 원판 평면에서 캡슐이다. 진행 중에도 둥근 톱날 선단을 보존한다.
    const shape = new THREE.Shape();
    shape.moveTo(0, -radius);
    shape.lineTo(distance, -radius);
    shape.absarc(distance, 0, radius, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(0, radius);
    shape.absarc(0, 0, radius, Math.PI / 2, Math.PI * 1.5, false);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: tool.kerf, bevelEnabled: false, curveSegments: 48 });
    g.translate(0, 0, -tool.kerf / 2);
    const up = new THREE.Vector3(0, 0, 1);
    const normal = direction.clone().cross(up);
    g.applyMatrix4(new THREE.Matrix4().makeBasis(direction, up, normal).setPosition(from));
    return g;
  }
  // [Befun 확장] 마구리 커넥터 슬롯: 공구 축(마구리 안쪽) 방향으로 depth만큼, 이동 경로를 따라 쓴 캡슐 부피.
  if (step.kind === 'mill' && tool.kind === 'drill' && isEdgeMillFace(step.face)) {
    const axis = v(MILL_FACE_DIRECTION[step.face!]);
    const from = v(step.from), end = v(interpolate(step.from, step.to, t));
    const distance = end.distanceTo(from), radius = tool.diameter / 2, pad = 0.001;
    if (distance < 1e-6) return null;
    const along = end.clone().sub(from).normalize();
    const shape = new THREE.Shape();
    shape.moveTo(0, -radius);
    shape.lineTo(distance, -radius);
    shape.absarc(distance, 0, radius, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(0, radius);
    shape.absarc(0, 0, radius, Math.PI / 2, Math.PI * 1.5, false);
    shape.closePath();
    // 바닥(공구 끝 = from/to)에서 마구리 바깥쪽으로 depth + 여유만큼 돌출
    const g = new THREE.ExtrudeGeometry(shape, { depth: step.depth + pad, bevelEnabled: false, curveSegments: 32 });
    const back = axis.clone().negate();
    const across = back.clone().cross(along).normalize(); // 오른손 좌표계(along × across = back)
    g.applyMatrix4(new THREE.Matrix4().makeBasis(along, across, back).setPosition(from));
    return g;
  }
  if (step.kind === 'drill' && tool.kind === 'drill') {
    const depth = step.depth * t;
    const surfacePad = 0.001; // 입구 바깥쪽에만 수치 여유. 구멍 바닥 깊이는 그대로 유지한다.
    // 원뿔 끝은 실제 tipLength를 사용한다. 0은 평저 비트이며 기본값을 발명하지 않는다.
    const tip = Math.min(depth, tool.tipLength);
    const radius = tool.diameter / 2;
    const points = [new THREE.Vector2(0, -surfacePad), new THREE.Vector2(radius, -surfacePad)];
    if (depth > tip) points.push(new THREE.Vector2(radius, depth - tip));
    if (tool.tipLength > 0 && depth < tool.tipLength) points[1].x = radius * depth / tool.tipLength;
    points.push(new THREE.Vector2(0, depth));
    const g = tool.tipLength === 0
      ? new THREE.CylinderGeometry(radius, radius, depth + surfacePad, 64).translate(0, (depth - surfacePad) / 2, 0)
      : new THREE.LatheGeometry(points, 64);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v(step.direction)));
    g.translate(...step.surface);
    return g;
  }
  return null;
}

export function subtract(base: THREE.BufferGeometry, cutter: THREE.BufferGeometry): THREE.BufferGeometry {
  const a = new Brush(base), b = new Brush(cutter);
  a.updateMatrixWorld(true); b.updateMatrixWorld(true);
  const result = evaluator.evaluate(a, b, SUBTRACTION).geometry;
  result.computeBoundingBox(); result.computeBoundingSphere();
  return result;
}

/** 심재와 이미 붙인 테이프가 같은 공구·같은 시각의 절삭을 받는다. */
export function machiningAt(program: MachiningProgram, stockId: string, elapsedMs: number) {
  const cursor = cursorAt(program, elapsedMs);
  const sweeps: MillSweep[] = [], holes: PanelHole[] = [], other: Array<{ step: ReplayStep; tool: ReplayTool; progress: number }> = [];
  program.steps.forEach((step, index) => {
    if (step.stockId !== stockId || index > cursor.index || !('toolId' in step)) return;
    const tool = program.tools.find(t => t.id === step.toolId)!;
    const progress = index === cursor.index ? cursor.progress : 1;
    if (step.kind === 'mill' && !isEdgeMillFace(step.face)) sweeps.push({ step, diameter: tool.diameter, progress });
    else if (step.kind === 'mill') other.push({ step, tool, progress });
    if (step.kind === 'drill' && tool.kind === 'drill') {
      if (step.direction[2] === -1 && tool.tipLength === 0) holes.push({ surface: step.surface, direction: step.direction, diameter: tool.diameter, depth: step.depth * progress });
      else other.push({ step, tool, progress });
    }
  });
  return { sweeps, holes, other };
}

/** 완료 형상은 단계별 소유 캐시, 진행 형상은 호출자가 소유한다. 되감기는 원본에서 정확히 복구한다. */
export class RemovalReplay {
  private cache = new Map<string, Map<number, THREE.BufferGeometry>>();
  private routedCache = new Map<string, { key: string; geometry: THREE.BufferGeometry }>();
  disposed = false;
  constructor(readonly program: MachiningProgram) {
    const errors = validateProgram(program);
    if (errors.length) throw new Error(errors.join('\n'));
    for (const stock of program.stocks) {
      const geometry = new THREE.BoxGeometry(...stock.size);
      geometry.translate(stock.size[0] / 2, stock.size[1] / 2, stock.size[2] / 2);
      this.cache.set(stock.id, new Map([[0, geometry]]));
    }
  }
  geometry(stockId: string, elapsedMs: number): THREE.BufferGeometry {
    const cursor = cursorAt(this.program, elapsedMs);
    const stock = this.program.stocks.find(s => s.id === stockId)!;
    const ownSteps = this.program.steps.filter(s => s.stockId === stockId);
    if ((stock.edgeBands?.length || ownSteps.some(s=>s.kind==='mill')) && !ownSteps.some(s=>s.kind==='saw')) {
      const { sweeps, holes, other } = machiningAt(this.program, stockId, elapsedMs);
      const edgeCuts=edgeMillingFootprints(this.program,stockId,elapsedMs);
      const key = JSON.stringify([sweeps.map(s=>[s.step.id,s.progress]),holes,other.map(s=>[s.step.id,s.progress]),edgeCuts]);
      const cached = this.routedCache.get(stockId);
      if(cached?.key === key) return cached.geometry.clone();
      let base=routedPanel(stock.size,sweeps,holes,edgeCuts);
      for(const {step,tool,progress} of other) {
        const cutter=sweptTool(step,tool,progress);
        if(cutter) {const next=subtract(base,cutter);base.dispose();cutter.dispose();base=next;}
      }
      cached?.geometry.dispose();
      this.routedCache.set(stockId,{key,geometry:base});
      return base.clone();
    }
    // Cut Tree의 각 직사각 조각은 한 번 가르고 자식 조각으로 교체한다.
    // 이 경로만 단면 차감으로 처리하고 혼합/대각/다중 절삭은 기존 CSG를 유지한다.
    const cuts = ownSteps.filter(s => s.kind === 'saw' || s.kind === 'drill');
    if (cuts.length === 1 && cuts[0].kind === 'saw') {
      const step = cuts[0], index = this.program.steps.indexOf(step), tool = this.program.tools.find(t => t.id === step.toolId)!;
      if (tool.kind === 'saw') {
        const geometry = sawnStock(stock.size, step, tool, index < cursor.index ? 1 : index === cursor.index ? cursor.progress : 0);
        if (geometry) return geometry;
      }
    }
    if (ownSteps.some(s => s.kind === 'drill') && !ownSteps.some(s => s.kind === 'saw')) {
      const holes: PanelHole[] = [];
      let supported = true;
      this.program.steps.forEach((step, index) => {
        if (step.stockId !== stockId || step.kind !== 'drill' || index > cursor.index) return;
        const tool = this.program.tools.find(t => t.id === step.toolId)!;
        if (tool.kind !== 'drill' || tool.tipLength !== 0) { supported = false; return; }
        holes.push({ surface: step.surface, direction: step.direction, diameter: tool.diameter, depth: step.depth * (index === cursor.index ? cursor.progress : 1) });
      });
      if (supported) {
        const geometry = drilledPanel(stock.size, holes);
        if (geometry) return geometry;
      }
    }
    const cache = this.cache.get(stockId);
    if (!cache) throw new Error(`판재 없음: ${stockId}`);
    let index = Math.max(...[...cache.keys()].filter(i => i <= cursor.index));
    let base = cache.get(index)!;
    for (; index < cursor.index; index++) {
      const step = this.program.steps[index];
      if (step.stockId !== stockId || (step.kind !== 'saw' && step.kind !== 'drill')) continue;
      const tool = this.program.tools.find(t => t.id === step.toolId)!;
      const cutter = sweptTool(step, tool, 1);
      if (cutter) { base = subtract(base, cutter); cutter.dispose(); cache.set(index + 1, base); }
    }
    const current = this.program.steps[cursor.index];
    if (current?.stockId === stockId && (current.kind === 'saw' || current.kind === 'drill')) {
      const cutter = sweptTool(current, this.program.tools.find(t => t.id === current.toolId)!, cursor.progress);
      if (cutter) { const result = subtract(base, cutter); cutter.dispose(); return result; }
    }
    return base.clone();
  }
  dispose() { this.disposed = true; for (const values of this.cache.values()) for (const geometry of values.values()) geometry.dispose(); this.cache.clear(); for(const c of this.routedCache.values()) c.geometry.dispose(); this.routedCache.clear(); }
}
