export type ConnectorModel = 'V-1230R' | 'V-1230P';
export type GuideTopic = 'connector' | 'back-panel' | 'tylko-clip' | 'legs';
export type Point3 = [number, number, number];

import { sampleOvvoAssembly, type OvvoAssemblyPhase } from './ovvoMotion';
import { ovvoAssemblyTravel } from './ovvoMounts';

export interface GuideStep {
  title: string;
  instruction: string;
  check: string;
  duration: number;
  view: 'overview' | 'face' | 'end' | 'connector' | 'joint' | 'back-bottom' | 'back-top' | 'clip-colour' | 'clip-entry' | 'clip-slide' | 'clip-flush' | 'leg-mount';
}

/** The same connector planner used by CNC, applied to a clearly marked example pair. */
export function exampleConnectorPlan(model: ConnectorModel) {
  const panels: Panel[] = [
    { id: 'example-a', name: 'A 받침판', width: 100, height: 300, thickness: 18, material: 'PB', color: 'C_White', quantity: 1, grain: 'HORIZONTAL' },
    { id: 'example-b', name: 'B 세로판', width: 300, height: 120, thickness: 18, material: 'PB', color: 'C_White', quantity: 1, grain: 'VERTICAL' },
  ];
  const boxes: CncPanelBox[] = [
    { panelId: 'example-a', meshName: 'A 받침판', kind: 'horizontal', w: 10, h: 1.8, d: 30, x: 0, y: -.9, z: 0, frame: { u: 0, v: 2, n: 1 } },
    { panelId: 'example-b', meshName: 'B 세로판', kind: 'vertical', w: 1.8, h: 12, d: 30, x: 0, y: 6, z: 0, frame: { u: 2, v: 1, n: 0 } },
  ];
  return { panels, report: applyConnectors(panels, boxes, { body: model }) };
}

const slot = findConnector('V-1230R')!.ops.find(op => op.on === 'face')!;
const exampleJoint = exampleConnectorPlan('V-1230R').report.joints[0];
// Demonstration coordinates are mm. They are not an order's production BOM.
export const jointExample = {
  thickness: 18, width: 100, height: 120, depth: 300,
  slotWidth: slot.diameter, slotLength: slot.diameter + (slot.travel ?? 0), slotDepth: slot.depth,
  centers: exampleJoint.positionsMm.map(value => value - exampleJoint.lengthMm / 2),
} as const;

export const guideSources = {
  'V-1230R': 'https://ovvotech.com/wp-content/uploads/2022/09/V-1230R-Releasable-Miling-Connector-Instructions.pdf',
  'V-1230P': 'https://ovvotech.com/wp-content/uploads/2022/09/V-1230P-Combined.pdf',
} as const;

function buildSteps(model: ConnectorModel): GuideStep[] {
  const released = model === 'V-1230R';
  return [
    { title: '부품과 앞뒤 방향 확인', instruction: 'A는 받침판, B는 세로판입니다. 두 판재의 가공된 홈이 서로 마주 보는 방향을 확인하세요.', check: 'A의 윗면과 B의 아래 끝에 홈이 보입니다.', duration: 2, view: 'overview' },
    { title: 'A의 홈에 하우징 넣기', instruction: `${released ? 'V-1230RH' : 'V-1230PH'} 하우징을 A의 가공된 홈에 맞춰 넣습니다. 두 위치의 방향을 함께 보세요.`, check: '두 하우징이 가공된 홈에 들어가 있습니다.', duration: 2.8, view: 'face' },
    { title: 'B의 끝에 하우징 넣기', instruction: 'B의 아래 끝에 있는 두 홈에 V-1230PH 하우징을 넣습니다. 홈 안으로 들어가는 면을 확대해서 확인하세요.', check: 'B의 아래 끝에 두 하우징이 들어가 있습니다.', duration: 2.8, view: 'end' },
    { title: '연결 커넥터 끼우기', instruction: `${released ? 'V-1230RC' : 'V-1230PC'} 커넥터를 B의 하우징에 끼웁니다. 아래로 나온 연결부가 A의 하우징을 향하도록 맞추세요.`, check: '두 커넥터가 B에 끼워지고 연결부가 A를 향합니다.', duration: 3.2, view: 'connector' },
    { title: '두 결합 위치 맞추기', instruction: 'B를 세우고 두 커넥터를 A의 하우징 위에 맞춥니다. 가까이 보면서 두 위치를 함께 맞추세요.', check: '두 커넥터와 A의 하우징 위치가 나란히 맞습니다.', duration: 2.8, view: 'joint' },
    { title: released ? '연결부를 하우징에 넣기' : '패널을 눌러 결합하기', instruction: released ? '맞춘 위치를 유지하면서 B를 내려 연결부를 A의 하우징에 넣습니다. 다음 단계에서 밀어 잠급니다.' : '두 위치를 맞춘 상태에서 B를 A 쪽으로 눌러 결합합니다. 내부 보기로 연결부가 들어가는 동작을 확인하세요.', check: released ? '연결부가 들어갔습니다. 아직 다음 밀기 동작이 남아 있습니다.' : 'B의 아래 끝과 A의 윗면이 맞닿습니다.', duration: 3.2, view: 'joint' },
    ...(released ? [{ title: '패널을 밀어 잠그기', instruction: '화살표 방향으로 B를 밀어 결합합니다. 내부 보기에서 커넥터가 하우징 안으로 이동하는 모습을 확인하세요.', check: 'B가 결합 위치로 이동했고 두 판재가 맞닿습니다.', duration: 3.2, view: 'joint' } as GuideStep] : []),
    { title: '결합된 모습 확인', instruction: '전체 보기와 내부 보기를 전환해 두 결합부를 확인하세요. 이 예시는 하나의 판재 접합부를 설명합니다.', check: '두 결합부의 위치와 판재가 맞닿는 모습을 확인했습니다.', duration: 2, view: 'overview' },
  ];
}

const sequences = { 'V-1230R': buildSteps('V-1230R'), 'V-1230P': buildSteps('V-1230P') };
export function guideSteps(model: ConnectorModel): readonly GuideStep[] {
  return sequences[model];
}

const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** Absolute sampling makes pause, replay and backward seeking identical. */
export function jointPose(model: ConnectorModel, step: number, progress: number) {
  const count = guideSteps(model).length;
  const index = Math.max(0, Math.min(count - 1, Math.floor(Number.isFinite(step) ? step : 0)));
  const phase = (at: number) => index > at ? 1 : index === at ? smooth(progress) : 0;
  const released = model === 'V-1230R';
  const assemblyPhase: OvvoAssemblyPhase = index < 4 ? 'prepare' : index === 4 ? 'align' : index === 5 ? 'insert' : released && index === 6 ? 'slide' : 'check';
  const travel = ovvoAssemblyTravel(model);
  const movement = sampleOvvoAssembly(model, assemblyPhase, progress, { openGapMm: 80, alignedGapMm: 20, assemblySlideMm: travel.distanceMm });
  return {
    baseHousingOffset: 24 * (1 - phase(1)),
    endHousingOffset: -24 + 24 * phase(2),
    connectorOffset: -38 + 38 * phase(3),
    panelGap: movement.normalGapMm,
    panelSlide: movement.slideOffsetMm ?? 0,
    assemblyTravelStatus: travel.status,
    baseHousingsVisible: index >= 1,
    endHousingsVisible: index >= 2,
    connectorsVisible: index >= 3,
    complete: index === count - 1,
  };
}

/** Frame the complete part or a single connector without changing object scale. */
export function guideShot(model: ConnectorModel, step: number, progress: number, aspect: number, overview: boolean, rear: boolean): { target: Point3; position: Point3; up: Point3 } {
  const pose = jointPose(model, step, progress);
  const view = guideSteps(model)[step]?.view ?? 'overview';
  const wide = overview;
  const end = view === 'end' || view === 'connector';
  const target: Point3 = wide ? [0, 65, 0] : [0, end ? pose.panelGap + 3 : view === 'face' ? 3 : pose.panelGap * .22, jointExample.centers[0] + (end ? pose.panelSlide : 0)];
  const direction: Point3 = wide ? [1, .65, 1.25] : end ? [1, -.4, .85] : [1, .65, .9];
  if (rear) direction[2] *= -1;
  const radius = wide ? 210 : 31;
  const fit = radius / Math.sin(Math.atan(Math.tan(Math.PI / 9) * Math.min(1, Math.max(.2, aspect))));
  const length = Math.hypot(...direction);
  return { target, position: target.map((v, i) => v + direction[i] / length * fit) as Point3, up: [0, 1, 0] };
}
import { applyConnectors } from '@/lib/optimizer/connectors/apply';
import { findConnector } from '@/lib/optimizer/connectors/ovvo';
import type { CncPanelBox } from '@/lib/optimizer/befun/toCncPanels';
import type { Panel } from '@/lib/optimizer/upstream/editor/CNCOptimizer/types';

