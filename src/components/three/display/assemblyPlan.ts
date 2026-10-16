import type { PanelData } from '@/types/shelf';
import type { DoorPlacement, DrawerPlacement } from '@/lib/three/hardware';

export type Vec3 = [number, number, number];
export type AssemblyPhase = 'assembled' | 'disassembling' | 'laidOut' | 'assembling';
export interface AssemblyPartPlan {
  id: string;
  anchor: Vec3;
  floor: Vec3;
  rotation: Vec3;
  footprint: [number, number];
  /** Rendered part dimensions, used only to frame the presentation camera. */
  size?: Vec3;
  stage: number;
  order: number;
  label: string;
  kind?: 'horizontal' | 'upright' | 'back' | 'front';
}
export interface AssemblyPlan {
  parts: AssemblyPartPlan[];
  stages: string[];
  bounds: { width: number; height: number; depth: number; center: Vec3 };
  assemblyDuration: number;
  disassemblyDuration: number;
}
const GAP = 10;
const MOVE_TIME = 1.4;
export const STAGE_TIME = 1.65;
export const LEAD_IN = 0.7;

/** Assign each preinstalled foot to exactly one bottom board, including split boards. */
export function footPanelIndex(panels: PanelData[], position: Vec3): number {
  const bottom = Math.min(...panels.filter(p => p.matType === 'horizontalBase').map(p => p.y));
  let owner = -1, distance = Infinity;
  panels.forEach((p, i) => {
    if (p.matType !== 'horizontalBase' || Math.abs(p.y - bottom) > 1e-7) return;
    const dx = Math.max(0, Math.abs(position[0] - p.x) - p.w / 2);
    const dz = Math.max(0, Math.abs(position[2] - p.z) - p.d / 2);
    const d = dx * dx + dz * dz;
    if (d < distance) { owner = i; distance = d; }
  });
  return owner;
}

export function createAssemblyPlan(panels: PanelData[], doors: DoorPlacement[], drawers: DrawerPlacement[], width: number, height: number, depth: number, thickness: number, mountedFaceSigns: readonly number[] = []): AssemblyPlan {
  const horizontal = (p: PanelData) => p.matType === 'horizontalBase' || p.matType === 'horizontalEdge';
  const levels = [...new Set(panels.filter(horizontal).map(p => Math.round(p.y * 10) / 10))].sort((a, b) => a - b);
  const base: (Omit<AssemblyPartPlan, 'floor' | 'stage' | 'order'> & { rawStage: number; floorHeight: number })[] = [];
  const bottomY = Math.min(...panels.filter(p => p.matType === 'horizontalBase').map(p => p.y));
  const floorLevel = (y: number) => Math.max(0, levels.findLastIndex(level => level <= y + thickness));
  panels.forEach((p, i) => {
    const back = p.matType === 'backPanel' || p.matType === 'supportPanel';
    const flat = horizontal(p);
    const layOnBack = !flat && p.d <= p.w && p.d <= p.h;
    const level = flat ? levels.indexOf(Math.round(p.y * 10) / 10) : floorLevel(p.y - p.h / 2);
    base.push({ id: `panel-${i}`, anchor: [p.x, p.y, p.z], rotation: flat ? [0, 0, 0] : layOnBack ? [Math.PI / 2, 0, 0] : [0, 0, (mountedFaceSigns[i] ?? 1) * Math.PI / 2],
      footprint: flat ? [p.w, p.d] : layOnBack ? [p.w, p.h] : [p.h, p.d], size: [p.w, p.h, p.d], floorHeight: flat ? p.h + (Math.abs(p.y - bottomY) < 1e-7 ? 2 : 0) : layOnBack ? p.d : p.w,
      rawStage: level * 3 + (flat ? 0 : back ? 2 : 1),
      kind: flat ? 'horizontal' : back ? 'back' : 'upright',
      label: flat && Math.abs(p.y - bottomY) < 1e-7 ? '조절발이 체결된 바닥판 놓기' : back ? `${level + 1}단 후면 보강대 체결` : `${level + 1}단 ${flat ? '가로판 놓기' : '세로판 세우기'}` });
  });
  doors.forEach((p, i) => base.push({ id: `door-${i}`, anchor: [p.x + p.pivotOffsetX, p.y, p.z], rotation: [Math.PI / 2, 0, 0], footprint: [p.width + 10, p.height + 4], size: [p.width + 10, p.height + 4, p.reference?.thickness ?? thickness], floorHeight: p.reference?.thickness ?? thickness, kind: 'front', rawStage: levels.length * 3 + 1, label: '도어 설치' }));
  drawers.forEach((p, i) => base.push({ id: `drawer-${i}`, anchor: [p.x, p.y, p.z], rotation: [0, 0, 0], footprint: [p.compartmentWidth + 8, p.drawerDepth + 12], size: [p.compartmentWidth + 8, p.rowHeight, p.drawerDepth + 12], floorHeight: p.rowHeight, kind: 'front', rawStage: levels.length * 3 + 2, label: '서랍 설치' }));
  // Every piece has its own slot: stable left-to-right order, independent of renderer order.
  const sequence = [...base].sort((a,b) => a.rawStage-b.rawStage || a.anchor[0]-b.anchor[0] || a.anchor[2]-b.anchor[2] || a.id.localeCompare(b.id));
  const stages = sequence.map(p => p.label);
  const stageById = new Map(sequence.map((p,i)=>[p.id,i]));
  const totalArea = base.reduce((sum, p) => sum + (p.footprint[0] + GAP) * (p.footprint[1] + GAP), 0);
  const packingWidth = Math.max(width + 30, Math.sqrt(totalArea * 1.8), ...base.map(p => p.footprint[0]));
  let x = 0, z = depth + 45, rowDepth = 0;
  const orders = new Map<number, number>();
  const parts = base.map(p => {
    if (x > 0 && x + p.footprint[0] > packingWidth) { x = 0; z += rowDepth + GAP; rowDepth = 0; }
    const floor: Vec3 = [-packingWidth / 2 + x + p.footprint[0] / 2, p.floorHeight / 2 - 1, z + p.footprint[1] / 2];
    x += p.footprint[0] + GAP;
    rowDepth = Math.max(rowDepth, p.footprint[1]);
    const stage = stageById.get(p.id)!;
    const order = orders.get(stage) ?? 0;
    orders.set(stage, order + 1);
    return { id: p.id, anchor: p.anchor, floor, rotation: p.rotation, footprint: p.footprint, size: p.size, stage, order, label: p.label, kind: p.kind };
  });
  const totalDepth = z + rowDepth + 25;
  return { parts, stages, bounds: { width: packingWidth + 30, height: height + 90, depth: totalDepth, center: [0, (height + 50) / 2, totalDepth / 2] },
    assemblyDuration: LEAD_IN + (stages.length - 1) * STAGE_TIME + MOVE_TIME + 0.4,
    disassemblyDuration: LEAD_IN + (stages.length - 1) * 0.22 + MOVE_TIME + 0.4 };
}

export function partProgress(part: AssemblyPartPlan, plan: AssemblyPlan, phase: AssemblyPhase, time: number, disassemblyInterval = 0.22): number {
  if (phase === 'assembled') return 1;
  if (phase === 'laidOut') return 0;
  const delay = LEAD_IN + (phase === 'assembling' ? part.stage * STAGE_TIME : (plan.stages.length - 1 - part.stage) * disassemblyInterval) + Math.min(part.order * 0.045, 0.18);
  const t = Math.max(0, Math.min(1, (time - delay) / MOVE_TIME));
  return phase === 'assembling' ? t : 1 - t;
}

const ease = (t: number) => t*t*t*(t*(t*6-15)+10);
/** One uninterrupted carry arc; the final centimetres slow into the connector. */
export function samplePart(part: AssemblyPartPlan, progress: number): { position: Vec3; rotationProgress: number } {
  const p = Math.max(0, Math.min(1, progress));
  if (p === 0) return { position: [...part.floor], rotationProgress: 0 };
  if (p === 1) return { position: [...part.anchor], rotationProgress: 1 };
  const rotatingHalfSize = part.rotation[0] !== 0 ? part.footprint[1]/2 : part.rotation[2] !== 0 ? part.footprint[0]/2 : 0;
  const lift = Math.max(26, rotatingHalfSize+14);
  const hover = Math.max(part.anchor[1]+18, part.floor[1]+lift);
  // Lift while beginning the carry, then rotate only once the board clears the floor.
  if (p < .82) {
    const t=ease(p/.82), u=1-t;
    const a=part.floor, b:Vec3=[a[0],a[1]+lift*1.6,a[2]],
      c:Vec3=[part.anchor[0],hover+12,part.anchor[2]], d:Vec3=[part.anchor[0],part.anchor[1]+8,part.anchor[2]];
    return {position:a.map((v,i)=>u*u*u*v+3*u*u*t*b[i]+3*u*t*t*c[i]+t*t*t*d[i]) as Vec3,
      rotationProgress:ease(Math.max(0,Math.min(1,(p-.18)/.54)))};
  }
  const t=ease((p-.82)/.18);
  return {position:[part.anchor[0],part.anchor[1]+8*(1-t),part.anchor[2]],rotationProgress:1};
}
