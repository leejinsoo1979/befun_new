import { validFlutedToolProfile, type FlutedToolProfile } from './toolGeometry';
import { rotatedBounds } from './stockTransform';

/** 명시된 순서를 받는다. 최적화 배치에서 공장 순서를 추정하지 않는다. */
export type Point3 = [number, number, number];
export type BandEdge = 'bottom' | 'right' | 'top' | 'left';
export const bandAngles: Record<BandEdge, number> = { bottom: 0, right: -Math.PI / 2, top: Math.PI, left: Math.PI / 2 };
export interface ReplayEdgeBand { edge: BandEdge; color: string; thickness: number }
export interface ReplayStock {
  id: string;
  name: string;
  size: Point3;
  position: Point3;
  angle?: number;
  color: string;
  edgeBands?: ReplayEdgeBand[];
  /** 부모의 전폭 재단이 끝나야 등장하며, 자신의 재단이 끝나면 자식으로 교체된다. */
  availableAfter?: string;
  retiredAfter?: string;
  sourceOrigin?: Point3;
  sourceSize?: Point3;
  purpose?: 'panel' | 'workpiece' | 'offcut';
  panel?: { id: string; name: string; x: number; y: number; width: number; height: number; rotated: boolean };
  /** 옵티마이저의 배치 치수를 그대로 유지한다. rotated를 보고 다시 뒤집지 않는다. */
  layout?: Array<{ id: string; name: string; x: number; y: number; width: number; height: number; rotated: boolean }>;
}
export type ReplayTool =
  | { id: string; kind: 'saw'; diameter: number; kerf: number; teeth: number; rpm: number; appearance?: { boreDiameter: number; gulletDepth: number } }
  | { id: string; kind: 'drill'; diameter: number; length: number; tipLength: number; rpm: number; purpose?: 'boring' | 'milling'; appearance?: Omit<FlutedToolProfile, 'diameter' | 'length'> };
interface StepBase {
  id: string; label: string; durationMs: number; stockId: string;
  station?: 'saw' | 'router' | 'edgebander';
  handling?: 'manual' | 'fence';
}
/** 같은 컨베이어 구간을 함께 통과하는 판재. 모든 좌표는 공정 생성 시 한 번만 정한다. */
export interface ReplayBandPass { id: string; stockId: string; from: Point3; to: Point3; bandIndex: number }
export type ReplayStep =
  | (StepBase & { kind: 'saw'; toolId: string; from: Point3; to: Point3 })
  | (StepBase & { kind: 'drill'; toolId: string; surface: Point3; direction: Point3; depth: number })
  | (StepBase & { kind: 'mill'; toolId: string; from: Point3; to: Point3; depth: number; featureId: string; operation: 'groove' | 'notch'; face?: MillFace; releaseOffcut?: { min: Point3; max: Point3 } })
  | (StepBase & { kind: 'travel'; toolId: string; from: Point3; to: Point3; direction: Point3 })
  | (StepBase & { kind: 'position'; from: Point3; to: Point3 })
  | (StepBase & ReplayBandPass & { kind: 'band'; concurrent?: ReplayBandPass[] })
  | (StepBase & { kind: 'turn'; center: Point3; fromAngle: number; toAngle: number })
  | (StepBase & { kind: 'flip'; fromAngle: number; toAngle: number })
  | (StepBase & { kind: 'clamp'; from: number; to: number })
  | (StepBase & { kind: 'hold' });
/** [Befun 확장] top/bottom = 상·하면 루터, left/right/front/back = 마구리 앵글헤드(커넥터 슬롯). */
export type MillFace = 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back';
/** 마구리 가공면의 공구 진행 방향(판재 로컬, 판재 안쪽) */
export const MILL_FACE_DIRECTION: Record<MillFace, Point3> = { top: [0, 0, -1], bottom: [0, 0, 1], left: [1, 0, 0], right: [-1, 0, 0], front: [0, 1, 0], back: [0, -1, 0] };
export const isEdgeMillFace = (face?: MillFace) => !!face && face !== 'top' && face !== 'bottom';
export interface MachiningProgram {
  units: 'mm';
  /** 확인한 파일/기종을 기록한다. HOMAG라는 제조사명만으로 실측 판정을 하지 않는다. */
  source: { label: string; machineModel: string; verifiedSequence: boolean };
  stocks: ReplayStock[];
  tools: ReplayTool[];
  setup?: { kind: 'panel-saw-router'; cuttingLength: number; tableDepth: number; routerOrigin: Point3;
    bander?: { origin: Point3; length: number; feedMmPerMinute: number };
    /** 공정 표시용 대기대. 원장 배치 좌표와 독립하며 제조 치수에 쓰지 않는다. */
    stagingTables?: Array<{ position: Point3; size: [number, number] }> };
  machiningAudit?: { holeCount: number; grooveCount?: number; notchCount?: number; omitted: string[] };
  /** 목록 재생 종료와 패널 사방 재단 완료를 구분한다. 원본 목록의 누락을 숨기지 않는다. */
  layoutAudit?: { uncutEdges: string[]; panelPieces?: string[]; cutCount?: number; addedCuts?: number };
  /** 이 배열의 순서가 유일한 재생 순서다. 정렬·공구별 묶음·경로 재생성 금지. */
  steps: ReplayStep[];
}
export interface ReplayCursor { index: number; progress: number; elapsedMs: number; totalMs: number; done: boolean }
const finitePoint = (p: Point3) => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite);
const positive = (v: number) => Number.isFinite(v) && v > 0;
const length = (p: Point3) => Math.hypot(...p);
export const interpolate = (a: Point3, b: Point3, t: number): Point3 => a.map((v, i) => v + (b[i] - v) * t) as Point3;

export const stepBandPasses = (step: ReplayStep): ReplayBandPass[] => step.kind === 'band' ? [step, ...(step.concurrent ?? [])] : [];
/** 재생 순서를 만들지 않는다. 동일 단계에 기록된 판재별 경로를 펼쳐 읽기만 한다. */
export const bandPasses = (program: MachiningProgram) => program.steps.flatMap((step, stepIndex) =>
  stepBandPasses(step).map(pass => ({ ...pass, stepIndex, durationMs: step.durationMs })));

export function validateProgram(program: MachiningProgram): string[] {
  const errors: string[] = [];
  if (program.stocks.length === 0) errors.push('재생할 원장이 없습니다.');
  if (program.units !== 'mm') errors.push('가공 좌표 단위는 mm여야 합니다.');
  if (!program.source.label.trim() || !program.source.machineModel.trim()) errors.push('가공 원본과 장비 식별이 필요합니다.');
  const unique = (ids: string[]) => ids.every(Boolean) && new Set(ids).size === ids.length;
  if (!unique(program.stocks.map(s => s.id)) || !unique(program.tools.map(t => t.id)) || !unique(program.steps.map(s => s.id))) errors.push('판재·공구·단계 ID가 비어 있거나 중복됩니다.');
  if (!unique([...program.steps.map(s => s.id), ...program.steps.flatMap(s => s.kind === 'band' ? s.concurrent?.map(p => p.id) ?? [] : [])])) errors.push('동시 엣지 경로 ID가 다른 단계와 중복됩니다.');
  for (const stock of program.stocks) {
    if (!finitePoint(stock.size) || !stock.size.every(positive) || !finitePoint(stock.position)) errors.push(`${stock.name}: 판재 치수가 유효하지 않습니다.`);
    const born = program.steps.findIndex(s => s.id === stock.availableAfter);
    const retired = program.steps.findIndex(s => s.id === stock.retiredAfter);
    if ((stock.availableAfter && (born < 0 || program.steps[born].kind !== 'saw'))
      || (stock.retiredAfter && (retired < 0 || program.steps[retired].kind !== 'saw' || retired <= born))) errors.push(`${stock.name}: 분리 조각의 재단 순서가 유효하지 않습니다.`);
    if (stock.sourceOrigin && !finitePoint(stock.sourceOrigin)) errors.push(`${stock.name}: 원장 기준 위치가 유효하지 않습니다.`);
  }
  for (const tool of program.tools) {
    if (!positive(tool.diameter) || !positive(tool.rpm)) errors.push(`${tool.id}: 공구 지름·회전수가 필요합니다.`);
    if (tool.kind === 'saw' && (!positive(tool.kerf) || !Number.isInteger(tool.teeth) || tool.teeth < 3)) errors.push(`${tool.id}: 톱날 폭·날 수가 유효하지 않습니다.`);
    if (tool.kind === 'drill' && (!positive(tool.length) || !Number.isFinite(tool.tipLength) || tool.tipLength < 0 || tool.tipLength >= tool.length)) errors.push(`${tool.id}: 비트 길이·끝 형상이 유효하지 않습니다.`);
    if (tool.kind === 'drill' && tool.appearance && (!validFlutedToolProfile({ ...tool.appearance, diameter: tool.diameter, length: tool.length }) || tool.tipLength !== 0)) errors.push(`${tool.id}: 나선날 외형 규격이 유효하지 않습니다.`);
    if (tool.kind === 'saw' && tool.appearance && (!positive(tool.appearance.boreDiameter) || !positive(tool.appearance.gulletDepth)
      || tool.appearance.boreDiameter >= tool.diameter - tool.appearance.gulletDepth * 2)) errors.push(`${tool.id}: 톱날 외형 규격이 유효하지 않습니다.`);
  }
  for (const step of program.steps) {
    if (!positive(step.durationMs)) errors.push(`${step.id}: 실제 단계 시간이 필요합니다.`);
    if (!program.stocks.some(s => s.id === step.stockId)) errors.push(`${step.id}: 판재를 찾을 수 없습니다.`);
    const tool = 'toolId' in step ? program.tools.find(t => t.id === step.toolId) : undefined;
    if ('toolId' in step && !tool) errors.push(`${step.id}: 공구를 찾을 수 없습니다.`);
    if ('from' in step && step.kind !== 'clamp' && (!finitePoint(step.from) || !finitePoint(step.to))) errors.push(`${step.id}: 이동 좌표가 유효하지 않습니다.`);
    if (step.kind === 'clamp' && ![step.from, step.to].every(v => Number.isFinite(v) && v >= 0 && v <= 1)) errors.push(`${step.id}: 고정 상태가 유효하지 않습니다.`);
    if (step.kind === 'band') {
      const passes = stepBandPasses(step), first = program.stocks.find(s => s.id === step.stockId);
      const finish = first?.edgeBands?.[step.bandIndex], distance = step.to[0] - step.from[0];
      if (!unique(passes.map(p => p.id)) || !unique(passes.map(p => p.stockId))) errors.push(`${step.id}: 연속 투입 판재가 중복됩니다.`);
      for (const pass of passes) {
        const stock = program.stocks.find(s => s.id === pass.stockId), band = stock?.edgeBands?.[pass.bandIndex];
        if (step.station !== 'edgebander' || !program.setup?.bander || !band || !positive(band.thickness)
          || !finitePoint(pass.from) || !finitePoint(pass.to) || distance <= 0
          || Math.abs(pass.to[0] - pass.from[0] - distance) > 1e-6 || pass.from[1] !== pass.to[1] || pass.from[2] !== pass.to[2]
          || band.color !== finish?.color || band.thickness !== finish?.thickness || stock?.size[2] !== first?.size[2]) errors.push(`${pass.id}: 엣지 면·테이프·연속 이송이 유효하지 않습니다.`);
      }
      const boxes = passes.flatMap(pass => {
        const stock = program.stocks.find(s => s.id === pass.stockId), band = stock?.edgeBands?.[pass.bandIndex];
        if (!stock || !band || !finitePoint(pass.from)) return [];
        const b = rotatedBounds(stock.size, bandAngles[band.edge]);
        if (Math.abs(pass.from[1] + b.minY - (program.setup?.bander?.origin[1] ?? 0)) > 1e-6) errors.push(`${pass.id}: 엣지 면이 기준 가이드와 맞지 않습니다.`);
        return [{ min: pass.from[0] + b.minX, max: pass.from[0] + b.maxX }];
      });
      for (let i = 0; i < boxes.length; i++) for (const other of boxes.slice(i + 1)) {
        if (Math.min(boxes[i].max, other.max) - Math.max(boxes[i].min, other.min) > -1e-6) errors.push(`${step.id}: 연속 투입 판재 사이의 간격이 없습니다.`);
      }
    }
    if (step.kind === 'turn' && (!finitePoint(step.center) || ![step.fromAngle, step.toAngle].every(Number.isFinite))) errors.push(`${step.id}: 판재 회전이 유효하지 않습니다.`);
    if (step.kind === 'flip' && (!Number.isFinite(step.fromAngle) || !Number.isFinite(step.toAngle) || step.station !== 'router')) errors.push(`${step.id}: 하면 재고정 회전이 유효하지 않습니다.`);
    if (step.kind === 'saw' && (tool?.kind !== 'saw' || step.from[2] !== step.to[2] || Math.hypot(step.from[0] - step.to[0], step.from[1] - step.to[1]) === 0)) errors.push(`${step.id}: 현재 재생기는 수평 직선 톱 가공을 지원합니다.`);
    if (step.kind === 'drill') {
      if (tool?.kind !== 'drill' || !positive(step.depth) || (tool?.kind === 'drill' && step.depth > tool.length)) errors.push(`${step.id}: 비트 종류·가공 깊이가 유효하지 않습니다.`);
      if (!finitePoint(step.surface) || !finitePoint(step.direction) || Math.abs(length(step.direction) - 1) > 1e-6) errors.push(`${step.id}: 보링 시작면과 단위 축 방향이 필요합니다.`);
    }
    if (step.kind === 'mill' && (tool?.kind !== 'drill' || tool.purpose !== 'milling' || !positive(step.depth)
      || step.depth > tool.length || step.from[2] !== step.to[2] || Math.hypot(step.to[0] - step.from[0], step.to[1] - step.from[1]) < 1e-6)) errors.push(`${step.id}: 루터 직선 가공의 공구·깊이·경로가 유효하지 않습니다.`);
    if (step.kind === 'travel' && (!finitePoint(step.direction) || Math.abs(length(step.direction) - 1) > 1e-6)) errors.push(`${step.id}: 공구 이동 축이 유효하지 않습니다.`);
  }
  return errors;
}

export function cursorAt(program: MachiningProgram, elapsedMs: number): ReplayCursor {
  const totalMs = program.steps.reduce((sum, s) => sum + s.durationMs, 0);
  const time = Math.max(0, Math.min(totalMs, Number.isFinite(elapsedMs) ? elapsedMs : 0));
  let offset = 0;
  for (let index = 0; index < program.steps.length; index++) {
    const duration = program.steps[index].durationMs;
    if (time < offset + duration) return { index, progress: (time - offset) / duration, elapsedMs: time, totalMs, done: false };
    offset += duration;
  }
  return { index: program.steps.length, progress: 1, elapsedMs: time, totalMs, done: true };
}

/** 일시정지·속도 변경·탐색이 동일 시계를 사용한다. 완료 콜백으로 중단을 위장하지 않는다. */
export class ReplayClock {
  elapsedMs = 0;
  playing = false;
  speed = 1;
  private previous: number | null = null;
  private listeners = new Set<() => void>();
  constructor(readonly totalMs: number) {}
  /** 3D와 원장 표식이 같은 시각을 소비한다. 숫자 UI의 저빈도 갱신을 기다리지 않는다. */
  subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private publish() { this.listeners.forEach(listener => listener()); }
  play() { if (this.elapsedMs >= this.totalMs) this.elapsedMs = 0; this.playing = this.totalMs > 0; this.previous = null; this.publish(); }
  pause() { this.playing = false; this.previous = null; }
  seek(ms: number) { this.elapsedMs = Math.max(0, Math.min(this.totalMs, Number.isFinite(ms) ? ms : 0)); this.previous = null; if (this.elapsedMs === this.totalMs) this.pause(); this.publish(); }
  setSpeed(value: number) { if (!positive(value)) throw new Error('재생 속도는 양수여야 합니다.'); this.speed = value; }
  tick(now: number) {
    if (!this.playing || !Number.isFinite(now)) return this.elapsedMs;
    if (this.previous !== null) this.elapsedMs = Math.min(this.totalMs, this.elapsedMs + Math.max(0, now - this.previous) * this.speed);
    this.previous = now;
    if (this.elapsedMs >= this.totalMs) this.pause();
    this.publish();
    return this.elapsedMs;
  }
}
