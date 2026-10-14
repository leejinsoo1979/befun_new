import { Matrix4, Quaternion, Vector3 } from 'three';
import { buildBefunShelfModel, type BefunDesign } from '@/lib/optimizer/befun/model';
import { toCncPanels } from '@/lib/optimizer/befun/toCncPanels';
import { createAssemblyPlan, samplePart } from '@/components/three/display/assemblyPlan';
import { guideMounts } from '@/components/three/furniture-hardware/ovvo/guideAdapter';
import { calculateShortFeet } from '@/lib/three/reference-feet';
import { createBlumShelfPlans } from '@/lib/three/blum/boring';
import { machinedPanelGeometry, panelToWorldMatrix } from '@/lib/optimizer/befun/panelGeometry';
import { backExample } from './backPanel';
import type { Boring, PanelBoringData } from '@/lib/optimizer/upstream/domain/boring/types';

export type CabinetVector = [number, number, number];
export type CabinetQuaternion = [number, number, number, number];
export type CabinetPhase = 'choose' | 'hardware' | 'ready' | 'placing' | 'spring-press' | 'spring-seat' | 'spring-lock' | 'check' | 'reveal' | 'complete';
export interface CabinetState { step: number; phase: CabinetPhase; progress: number; playing: boolean; automatic: boolean; selectedId: string | null }
export interface CabinetMount { id: string; role: 'face' | 'end'; at: CabinetVector; quaternion: CabinetQuaternion; connectorQuaternion: CabinetQuaternion }
/** Reuses the existing back-panel illustration. These values never enter CNC/order output. */
export const cabinetDowel = { extension: backExample.pinLength, tilt: Math.PI / 15, holeDiameter: 7, holeDepth: 10 } as const;
export const isCabinetRear = (part: { box: { kind: string } }) => part.box.kind === 'back' || part.box.kind === 'support';

// A supported Befun configurator input, not a new furniture generator or catalog SKU.
// One tier avoids the two-sided V-1230 pocket intersection detected in the two-tier example.
export const cabinetDesign: BefunDesign = {
  width: 110, height: 42, depth: 32, thickness: 2, style: 'grid', density: 50,
  rowHeights: [38], numRows: 1, hasBackPanel: false,
  doorsCreatedLayers: [0], drawersCreatedLayers: [], hardwareRowStyles: { 0: 12 },
  color: 'S_Teracotta Orange', colorCategory: 'solid',
};

export function createCabinetPlan(design: BefunDesign = cabinetDesign) {
  const input = structuredClone(design);
  const model = buildBefunShelfModel(input);
  const cnc = toCncPanels(input, model, { bodyMaterial: 'MDF', connectors: { system: 'ovvo', body: 'V-1230P' } });
  const assembly = createAssemblyPlan(model.panels, model.doors, model.drawers, input.width, input.height, input.depth, input.thickness);
  const byId = new Map(cnc.boxes.map(box => [box.panelId, box]));
  const mounts = new Map<string, CabinetMount[]>();
  for (const joint of cnc.connectorReport?.joints ?? []) {
    const end = byId.get(joint.endPanelId)!, face = byId.get(joint.facePanelId)!;
    const k = face.frame.n, thin = end.frame.n;
    const along = ([0, 1, 2] as const).find(axis => axis !== k && axis !== thin)!;
    const e = [end.x, end.y, end.z], f = [face.x, face.y, face.z], fs = [face.w, face.h, face.d], es = [end.w, end.h, end.d];
    const sign = e[k] > f[k] ? 1 : -1;
    const outward = new Vector3().setComponent(k, sign), lengthAxis = new Vector3().setComponent(along, 1);
    const across = outward.clone().cross(lengthAxis);
    const frame = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(across, outward, lengthAxis));
    const source = guideMounts('P', 'pressed', 0);
    const q = (value: CabinetQuaternion) => frame.clone().multiply(new Quaternion(...value)).toArray() as CabinetQuaternion;
    const start = Math.max(e[along] - es[along] / 2, f[along] - fs[along] / 2) * 10;
    joint.positionsMm.forEach((position, index) => {
      const anchor: CabinetVector = e.map(value => value * 10) as CabinetVector;
      anchor[k] = (f[k] + sign * fs[k] / 2) * 10;
      anchor[along] = start + position;
      for (const [box, role] of [[end, 'end'], [face, 'face']] as const) {
        const values = mounts.get(box.panelId) ?? [];
        values.push({ id: `${joint.id}-${index}-${role}`, role,
          at: anchor.map((value, axis) => value - [box.x, box.y, box.z][axis] * 10) as CabinetVector,
          quaternion: q(role === 'end' ? source.endHousing.quaternion : source.baseHousing.quaternion),
          connectorQuaternion: q(source.connector.quaternion) });
        mounts.set(box.panelId, values);
      }
    });
  }
  const parts = assembly.parts.map(part => {
    const index = part.id.startsWith('panel-') ? Number(part.id.slice(6)) : model.panels.length + Number(part.id.slice(5));
    const box = cnc.boxes[index];
    const step = part.stage;
    const hardware = mounts.get(box.panelId) ?? [];
    const base = box.kind === 'horizontal' && step === 0;
    const title = base ? '바닥판 놓기' : box.kind === 'door' ? '도어 달기' : box.kind === 'horizontal' ? '상판 체결하기' : box.kind === 'vertical' ? '세로판 세우기' : box.kind === 'back' ? '백패널 체결하기' : '후면 보강 패널 체결하기';
    const rear = box.kind === 'back' || box.kind === 'support';
    return { id: box.panelId, number: step + 1, box, panel: cnc.panels[index], animation: { ...part, anchor: [box.x, box.y, box.z] as CabinetVector },
      hardware, title, label: box.meshName, feet: base,
      pinCenters: rear ? backExample.pinCenters.map(x => x / backExample.width * box.w * 10) : [],
      displayBorings: [] as Boring[],
      connection: rear ? '아래 고정 다보 2개 · 위 스프링 다보 2개' : hardware.length ? `${hardware.filter(m => m.role === 'end').length} 연결 커넥터 · ${hardware.length} 하우징` : '공통 도어 모델의 경첩 위치' };
  }).sort((a, b) => {
    // Spring dowels need both receiving boards present before the rear panel enters.
    const order = (p: typeof a) => p.feet ? 0 : p.box.kind === 'vertical' ? 1 : p.box.kind === 'horizontal' ? 2 : isCabinetRear(p) ? 3 : 4;
    return order(a) - order(b) || a.number - b.number;
  });
  parts.forEach((part, index) => { part.number = index + 1; part.animation.stage = index; });
  for (const rear of parts.filter(isCabinetRear)) {
    for (const x of rear.pinCenters) {
      rear.displayBorings.push({ id: `display-${rear.id}-${x}-upper`, type: 'custom', face: 'back', x: x + rear.box.w * 5, y: rear.box.h * 10, diameter: 5.4, depth: 14 });
      rear.displayBorings.push({ id: `display-${rear.id}-${x}-lower`, type: 'custom', face: 'front', x: x + rear.box.w * 5, y: 0, diameter: 3, depth: 8 });
      for (const upper of [false, true]) {
        const atY = rear.box.y + (upper ? 1 : -1) * rear.box.h / 2;
        const receiver = parts.find(p => p.box.kind === 'horizontal' && Math.abs(p.box.y + (upper ? -1 : 1) * p.box.h / 2 - atY) < .01);
        if (!receiver) continue;
        receiver.displayBorings.push({ id: `display-${rear.id}-${x}-${upper}`, type: 'custom', face: upper ? 'bottom' : 'top',
          x: (rear.box.x - receiver.box.x + receiver.box.w / 2) * 10 + x,
          y: (rear.box.z - receiver.box.z + receiver.box.d / 2) * 10,
          diameter: cabinetDowel.holeDiameter, depth: cabinetDowel.holeDepth });
      }
    }
  }
  return { design: input, model, cnc, assembly, parts, feet: calculateShortFeet(model.panels, input.depth),
    hinges: createBlumShelfPlans(model.doors, model.panels, input.thickness),
    issues: cnc.connectorReport?.warnings ?? [],
    manufacturingApproved: false as const,
    provenance: 'Befun configurator → shared shelf model → shared connector planner' };
}
export type CabinetPlan = ReturnType<typeof createCabinetPlan>;
export type CabinetPart = CabinetPlan['parts'][number];

/** Owned centered mm mesh. Flatten CSG normals so broad skins cannot inherit a pocket wall normal. */
export function createCabinetPanelGeometry(part: CabinetPart) {
  const source = part.panel.manufacturingBoring;
  const size = [part.box.w, part.box.h, part.box.d];
  const display: PanelBoringData = { panelId: part.id, furnitureId: 'cabinet-display', furnitureName: '시연', panelName: part.label,
    panelType: 'back-panel', width: size[part.box.frame.u] * 10, height: size[part.box.frame.v] * 10, thickness: size[part.box.frame.n] * 10,
    material: 'display-only', grain: 'N', borings: [], manufacturingReady: false, manufacturingBlockReasons: ['설명용 다보 위치·치수, 제조 출력 제외'] };
  const data = source || part.displayBorings.length ? { ...(source ?? display), borings: [...(source?.borings ?? []), ...part.displayBorings] } : undefined;
  if (!data || (!data.borings.length && !data.connectorSlots?.length)) return undefined;
  let result = machinedPanelGeometry(data);
  if (result.index) { const flat = result.toNonIndexed(); result.dispose(); result = flat; }
  const box = part.box;
  result.applyMatrix4(new Matrix4().makeScale(10, 10, 10).multiply(panelToWorldMatrix(box)));
  result.translate(-box.x * 10, -box.y * 10, -box.z * 10);
  result.computeVertexNormals();
  return result;
}

export function initialCabinetState(): CabinetState {
  return { step: 0, phase: 'choose', progress: 0, playing: false, automatic: false, selectedId: null };
}
export function selectCabinetPart(state: CabinetState, partId: string, plan: CabinetPlan): CabinetState {
  if (state.phase !== 'choose' || plan.parts[state.step]?.id !== partId) return state;
  const needsHardware = plan.parts[state.step].hardware.length > 0;
  return { ...state, selectedId: partId, phase: needsHardware ? 'hardware' : 'ready', progress: 0, playing: false };
}
export function placeCabinetPart(state: CabinetState): CabinetState {
  return state.phase === 'ready' ? { ...state, phase: 'placing', progress: 0, playing: true } : state;
}
export function confirmCabinetPart(state: CabinetState, count: number): CabinetState {
  if (state.phase !== 'check') return state;
  return state.step === count - 1 ? { ...state, phase: 'complete', progress: 1, playing: false } :
    { ...initialCabinetState(), step: state.step + 1, automatic: state.automatic };
}
export function advanceCabinet(state: CabinetState, seconds: number, plan: CabinetPlan): CabinetState {
  if (!state.playing) return state;
  let next = { ...state }, remaining = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  // Absolute stage time preserves pause/seek and long-frame behavior.
  for (let transitions = 0; transitions < plan.parts.length * 9 + 2; transitions++) {
    if (next.automatic && next.phase === 'ready') next = placeCabinetPart(next);
    const duration = cabinetPhaseDuration(next, plan);
    if (!duration) return next;
    const needed = duration * (1 - next.progress);
    if (remaining + 1e-9 < needed) return { ...next, progress: next.progress + remaining / duration };
    remaining = Math.max(0, remaining - needed);
    if (next.phase === 'choose') next = { ...selectCabinetPart(next, plan.parts[next.step].id, plan), playing: true };
    else if (next.phase === 'check') {
      if (next.step === plan.parts.length - 1) next = { ...next, phase: 'reveal', progress: 0 };
      else next = { ...confirmCabinetPart(next, plan.parts.length), playing: true };
    } else if (next.phase === 'reveal') return { ...next, phase: 'complete', progress: 1, playing: false };
    else {
      const phase: CabinetPhase = next.phase === 'hardware' ? 'ready' : next.phase === 'placing' ? isCabinetRear(plan.parts[next.step]) ? 'spring-press' : 'check' : next.phase === 'spring-press' ? 'spring-seat' : next.phase === 'spring-seat' ? 'spring-lock' : 'check';
      next = { ...next, phase, progress: 0, playing: next.automatic || phase.startsWith('spring-') };
    }
    if (!next.playing) return next;
  }
  return next;
}
export function cabinetPartPose(part: CabinetPart, state: CabinetState, preview = false) {
  const installed = preview || state.phase === 'complete' || state.phase === 'reveal' || part.number - 1 < state.step || part.number - 1 === state.step && state.phase === 'check';
  if (!installed && isCabinetRear(part) && part.number - 1 === state.step && ['placing', 'spring-press', 'spring-seat', 'spring-lock'].includes(state.phase)) {
    const p = state.progress, tilt = cabinetDowel.tilt * (state.phase === 'spring-lock' ? 0 : state.phase === 'spring-seat' ? 1 - smooth(p) : 1);
    const h = part.box.h / 2;
    const gap = state.phase === 'placing' ? cabinetDowel.extension / 10 * (1 - smooth((p - .7) / .3)) : 0;
    const position: CabinetVector = [part.box.x, part.box.y + h * (Math.cos(tilt) - 1) + gap * Math.cos(tilt), part.box.z + h * Math.sin(tilt) + gap * Math.sin(tilt)];
    if (state.phase === 'placing' && p < .7) {
      const pose = samplePart({ ...part.animation, anchor: position }, p / .7);
      return { ...pose, tilt: tilt * pose.rotationProgress };
    }
    return { position, rotationProgress: 1, tilt };
  }
  const progress = installed ? 1 : part.number - 1 === state.step && state.phase === 'placing' ? state.progress : 0;
  return { ...samplePart(part.animation, progress), tilt: 0 };
}
const smooth = (p: number) => { const t = Math.max(0, Math.min(1, p)); return t * t * (3 - 2 * t); };
export function cabinetPinExtension(part: CabinetPart, state: CabinetState, preview = false) {
  if (preview || part.number - 1 !== state.step) return cabinetDowel.extension;
  return state.phase === 'spring-press' ? cabinetDowel.extension * (1 - smooth(state.progress)) : state.phase === 'spring-seat' ? 0 : state.phase === 'spring-lock' ? cabinetDowel.extension * smooth(state.progress) : cabinetDowel.extension;
}
export function cabinetPhaseDuration(state: CabinetState, plan: CabinetPlan) {
  if (state.phase === 'choose') return state.automatic ? state.step === 0 ? 1.25 : .7 : 0;
  if (state.phase === 'hardware') return state.automatic ? 1.65 : .85;
  if (state.phase === 'placing') return state.automatic ? 2.7 : 1.55;
  if (state.phase === 'spring-press') return .8;
  if (state.phase === 'spring-seat') return 1.25;
  if (state.phase === 'spring-lock') return .9;
  if (state.phase === 'check') return state.automatic ? .85 : 0;
  if (state.phase === 'reveal') return 3.5;
  void plan;
  return 0;
}
export function cabinetStepState(step: number, count: number): CabinetState {
  return { ...initialCabinetState(), step: Math.max(0, Math.min(count - 1, Math.floor(step))) };
}
