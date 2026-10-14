import { Matrix4, Quaternion, Vector3 } from 'three';
import { buildBefunShelfModel, type BefunDesign } from '@/lib/optimizer/befun/model';
import { toCncPanels } from '@/lib/optimizer/befun/toCncPanels';
import { createAssemblyPlan, samplePart } from '@/components/three/display/assemblyPlan';
import { guideMounts } from '@/components/three/furniture-hardware/ovvo/guideAdapter';
import { calculateShortFeet } from '@/lib/three/reference-feet';
import { createBlumShelfPlans } from '@/lib/three/blum/boring';
import { machinedPanelGeometry, panelToWorldMatrix } from '@/lib/optimizer/befun/panelGeometry';

export type CabinetVector = [number, number, number];
export type CabinetQuaternion = [number, number, number, number];
export type CabinetPhase = 'choose' | 'hardware' | 'ready' | 'placing' | 'check' | 'complete';
export interface CabinetState { step: number; phase: CabinetPhase; progress: number; playing: boolean; automatic: boolean; selectedId: string | null }
export interface CabinetMount { id: string; role: 'face' | 'end'; at: CabinetVector; quaternion: CabinetQuaternion; connectorQuaternion: CabinetQuaternion }

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
    const title = base ? '바닥판 놓기' : box.kind === 'door' ? '도어 달기' : box.kind === 'horizontal' ? '상판 체결하기' : box.kind === 'vertical' ? '세로판 세우기' : box.kind === 'back' ? '백패널 맞추기' : '후면 보강대 맞추기';
    return { id: box.panelId, number: step + 1, box, panel: cnc.panels[index], animation: { ...part, anchor: [box.x, box.y, box.z] as CabinetVector },
      hardware, title, label: box.meshName, feet: base,
      connection: hardware.length ? `${hardware.filter(m => m.role === 'end').length} 연결 커넥터 · ${hardware.length} 하우징` : box.kind === 'door' ? '공통 도어 모델의 경첩 위치' : '후면 부품 위치 확인' };
  }).sort((a, b) => a.number - b.number);
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
  const data = part.panel.manufacturingBoring;
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
  for (let transitions = 0; transitions < plan.parts.length * 4 + 1; transitions++) {
    if (next.automatic && next.phase === 'choose') {
      next = { ...selectCabinetPart(next, plan.parts[next.step].id, plan), playing: true };
    }
    if (next.automatic && next.phase === 'ready') next = placeCabinetPart(next);
    if (next.automatic && next.phase === 'check') {
      next = confirmCabinetPart(next, plan.parts.length);
      if (next.phase !== 'complete') next.playing = true;
      continue;
    }
    if (next.phase !== 'hardware' && next.phase !== 'placing') return next;
    const duration = next.phase === 'hardware' ? .85 : 1.55;
    const needed = duration * (1 - next.progress);
    if (remaining < needed) return { ...next, progress: next.progress + remaining / duration };
    remaining -= needed;
    next = { ...next, phase: next.phase === 'hardware' ? 'ready' : 'check', progress: 0, playing: next.automatic };
    if (!next.automatic) return next;
  }
  return next;
}
export function cabinetPartPose(part: CabinetPart, state: CabinetState, preview = false) {
  const installed = preview || state.phase === 'complete' || part.number - 1 < state.step || part.number - 1 === state.step && state.phase === 'check';
  const progress = installed ? 1 : part.number - 1 === state.step && state.phase === 'placing' ? state.progress : 0;
  return samplePart(part.animation, progress);
}
export function cabinetStepState(step: number, count: number): CabinetState {
  return { ...initialCabinetState(), step: Math.max(0, Math.min(count - 1, Math.floor(step))) };
}
