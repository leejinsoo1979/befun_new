import { Vector3 } from 'three';
import type { MachiningProgram, Point3, ReplayStep } from './program';
import type { replayPose } from './replayPose';
import { flipPoint, flippedWorldPoint, rotatePoint, worldPoint } from './stockTransform';
import { bandingAt, bandingContact, focusedBanding } from './edgeBandingProcess';

export type ReplayView = 'cinematic' | 'machine' | 'stock' | 'top' | 'tool' | 'layout';
export type ReplayPose = ReturnType<typeof replayPose>;
export type CameraFrame = { target: Point3; offset: Point3; label: string };
type Bounds = [Point3, Point3];
/** 24-bit 깊이 버퍼에서 mm 간격을 잃지 않도록 관측 거리에 맞춰 가까운 절단면을 잡는다. */
export const cameraNearPlane = (distance: number) => Math.max(2, Math.min(80, distance * .01));
const point = (v: Vector3): Point3 => [v.x, v.y, v.z];
const center = (b: Bounds): Point3 => b[0].map((v, i) => (v + b[1][i]) / 2) as Point3;

/** 화면 구도 수치다. 가공 좌표·톱폭·공정 순서에는 쓰지 않는다. */
export function frameBounds(bounds: Bounds, direction: Point3, aspect: number, label: string, target = center(bounds)): CameraFrame {
  const back = new Vector3(...direction).normalize();
  const right = new Vector3(0, 0, 1).cross(back).normalize();
  const up = back.clone().cross(right).normalize();
  const tanY = Math.tan(40 * Math.PI / 360), tanX = tanY * Math.max(.25, aspect);
  let distance = 100;
  for (const x of [bounds[0][0], bounds[1][0]]) for (const y of [bounds[0][1], bounds[1][1]]) for (const z of [bounds[0][2], bounds[1][2]]) {
    const v = new Vector3(x, y, z).sub(new Vector3(...target));
    distance = Math.max(distance, v.dot(back) + Math.max(Math.abs(v.dot(right)) * 1.18 / tanX, Math.abs(v.dot(up)) * 1.18 / tanY));
  }
  return { target, offset: point(back.multiplyScalar(distance)), label };
}

function stockBounds(program: MachiningProgram, pose: ReplayPose, index: number): Bounds {
  const size = program.stocks[index].size;
  const corners = [0,size[0]].flatMap(x => [0,size[1]].flatMap(y => [0,size[2]].map(z =>
    flippedWorldPoint([x,y,z],size,pose.flips[index],pose.positions[index],pose.angles[index]))));
  return [[0,1,2].map(a=>Math.min(...corners.map(p=>p[a]))) as Point3,
    [0,1,2].map(a=>Math.max(...corners.map(p=>p[a]))) as Point3];
}

/** 진입·후퇴·클램프는 같은 가공과 한 구도로 묶는다. 짧은 단계마다 줌을 왕복하지 않는다. */
export function replayCameraCut(program: MachiningProgram, index: number): ReplayStep | undefined {
  const current = program.steps[index];
  if (!current || current.kind === 'position' || current.kind === 'turn' || current.kind === 'flip') return;
  if (current.kind === 'saw' || current.kind === 'drill' || current.kind === 'mill') return current;
  const search = (sign: number) => {
    for (let i = index + sign; i >= 0 && i < program.steps.length; i += sign) {
      const step = program.steps[i];
      if (step.stockId !== current.stockId || step.station !== current.station || step.kind === 'position' || step.kind === 'turn' || step.kind === 'flip') break;
      if (step.kind === 'saw' || step.kind === 'drill' || step.kind === 'mill') return i;
    }
  };
  const next = search(1), previous = search(-1);
  const chosen = next === undefined ? previous : previous === undefined ? next : index - previous < next - index ? previous : next;
  return chosen === undefined ? undefined : program.steps[chosen];
}

/** 재생 시각에서만 샷을 고른다. 탐색·되감기·배속이 절삭 프로그램을 바꾸지 않는다. */
export function replayCameraFrame(program: MachiningProgram, pose: ReplayPose, view: ReplayView, aspect: number): CameraFrame {
  const size = program.stocks[0].size, setup = program.setup;
  const bandFocus = pose.step?.kind === 'band' ? focusedBanding(bandingAt(program, pose.cursor.elapsedMs)) : undefined;
  const index = Math.max(0, program.stocks.findIndex(s => s.id === (bandFocus?.stock.id ?? pose.step?.stockId)));
  const bounds = stockBounds(program, pose, index);
  const machine: Bounds = setup?.bander && pose.station === 'edgebander'
    ? [[setup.bander.origin[0]-700,setup.bander.origin[1]-1050,-700],[setup.bander.origin[0]+setup.bander.length+700,setup.bander.origin[1]+1800,900]]
    : setup && pose.station === 'saw'
    ? [[-260, -setup.tableDepth - 280, -430], [setup.cuttingLength + 520, setup.tableDepth + 100, 430]]
    : [[(setup?.routerOrigin[0] ?? 0) - 320, -220, -430], [(setup?.routerOrigin[0] ?? 0) + size[0] + 320, size[1] + 200, 850]];
  if (view === 'layout') return frameBounds([[0, 0, 0], size], [0, -.0001, 1], aspect, '원본 배치 대조');
  if (view === 'machine') return frameBounds(machine, [1, -1.35, 1.15], aspect, '기계 전체');
  if (view === 'top') return frameBounds(bounds, [0, -.0001, 1], aspect, '평면');
  if (view === 'stock') return frameBounds(bounds, [.8, -1.2, 1.1], aspect, '판재');
  if (pose.step?.kind === 'band' && setup?.bander) {
    const state = bandFocus;
    if (!state) return frameBounds(machine, [.8,-1.3,1.15], aspect, '연속 투입');
    const stage = bandingContact(state);
    const contact = worldPoint(stage.local, pose.positions[index], pose.angles[index]);
    return frameBounds([[contact[0]-380,contact[1]-330,-60],[contact[0]+380,contact[1]+180,300]],
      [.65,-1,.75],aspect,stage.label,contact);
  }
  if (view === 'tool') return { target: pose.position ?? center(bounds), offset: pose.station === 'saw' ? [160, -620, 370] : [240, -320, 250], label: '공구' };

  // 시작은 장비와 원장의 관계를 보여 주고, 재생 종료는 완성 판재를 한 번에 담는다.
  if (!pose.cursor.done && pose.cursor.elapsedMs < 1800) return frameBounds(machine, [.8, -1.3, 1.15], aspect, '전체 장면');
  if (pose.cursor.done) {
    const completed = program.stocks.flatMap((s, i) => pose.visible[i] && s.purpose !== 'offcut' ? [stockBounds(program, pose, i)] : []);
    const all: Bounds = completed.length ? [
      [0, 1, 2].map(a => Math.min(...completed.map(b => b[0][a]))) as Point3,
      [0, 1, 2].map(a => Math.max(...completed.map(b => b[1][a]))) as Point3,
    ] : bounds;
    return frameBounds(all, [.65, -1.2, 1.4], aspect, '가공 완료');
  }
  if (pose.station === 'edgebander' && (pose.step?.kind === 'position' || pose.step?.kind === 'turn')) {
    const stock = program.stocks[index], at = center(bounds);
    // 회전 각도에 따라 바운딩 박스가 커졌다 줄어도 촬영 거리는 일정하다.
    const radius = Math.hypot(stock.size[0], stock.size[1]) / 2 + 100;
    return frameBounds([[at[0]-radius,at[1]-radius,at[2]-80],[at[0]+radius,at[1]+radius,at[2]+240]],
      [.7,-1.2,1.1], aspect, pose.step.kind === 'turn' ? '다음 엣지 면 전환' : '엣지 판재 이송', at);
  }
  const cut = replayCameraCut(program, pose.cursor.index);
  if (cut?.kind === 'saw') {
    const at = program.stocks.findIndex(s => s.id === cut.stockId);
    const progress = pose.step?.kind === 'saw' ? pose.cursor.progress : pose.step?.kind === 'travel' && pose.position ? undefined : program.steps.indexOf(cut) < pose.cursor.index ? 1 : 0;
    const contact = progress === undefined ? [...pose.position!] as Point3
      : worldPoint(cut.from.map((v, a) => v + (cut.to[a] - v) * progress) as Point3, pose.positions[at], pose.angles[at]);
    contact[2] = pose.positions[at][2] + program.stocks[at].size[2];
    // 일정한 전방에서 톱을 따라간다. 공구 아래로 내려가거나 패널 안을 통과하지 않는다.
    const direction: Point3 = [.35 + .12 * Math.sin(pose.cursor.elapsedMs / 14000), -1, .7];
    const detail: Bounds = [[contact[0] - 280, contact[1] - 180, contact[2] - 110], [contact[0] + 280, contact[1] + 180, contact[2] + 210]];
    return frameBounds(detail, direction, aspect, '재단 추적', contact);
  }
  if (cut?.kind === 'mill') {
    const at = program.stocks.findIndex(s => s.id === cut.stockId);
    const t = pose.step === cut ? pose.cursor.progress : program.steps.indexOf(cut) < pose.cursor.index ? 1 : 0;
    const contact = flippedWorldPoint(cut.from.map((v,i)=>v+(cut.to[i]-v)*t) as Point3,program.stocks[at].size,pose.flips[at],pose.positions[at],pose.angles[at]);
    contact[2] = pose.positions[at][2] + program.stocks[at].size[2];
    return frameBounds([[contact[0]-150,contact[1]-150,contact[2]-30],[contact[0]+150,contact[1]+150,contact[2]+150]],
      [.7,-1,1.1],aspect,cut.operation==='groove'?'홈 가공 추적':'목찬넬 따내기 추적',contact);
  }
  if (cut?.kind === 'drill') {
    const at = program.stocks.findIndex(s => s.id === cut.stockId);
    const contact = flippedWorldPoint(cut.surface, program.stocks[at].size, pose.flips[at], pose.positions[at], pose.angles[at]);
    const inward = rotatePoint(flipPoint(cut.direction,program.stocks[at].size,pose.flips[at],true), pose.angles[at]);
    const side = Math.abs(inward[2]) < .5;
    // 측면 보링은 구멍의 바깥쪽에서 본다. 정면 보링도 공구 축과 일치시켜 가리지 않는다.
    const outward = new Vector3(-inward[0], -inward[1], 0).normalize();
    const direction: Point3 = side ? [outward.x * .6 - outward.y * 1.4, outward.y * .6 + outward.x * 1.4, .85] : [.7, -1, .95];
    const detail: Bounds = [[contact[0] - 115, contact[1] - 115, contact[2] - 25], [contact[0] + 115, contact[1] + 115, contact[2] + 140]];
    return frameBounds(detail, direction, aspect, side ? '측면 보링' : '보링 근접', contact);
  }
  const padded: Bounds = [[bounds[0][0] - 100, bounds[0][1] - 100, bounds[0][2] - 80], [bounds[1][0] + 100, bounds[1][1] + 100, bounds[1][2] + 240]];
  return frameBounds(padded, [.7, -1.2, 1.1], aspect, pose.step?.kind === 'flip' ? '하면 재고정 · 수동 반전' : pose.step?.kind === 'turn' ? '방향 전환' : '판재 이동');
}

/** Z-up 구면 보간. 좌우 시점이 바뀔 때 직선으로 판재·작업대를 가로지르지 않는다. */
export function blendCameraFrame(from: CameraFrame, to: CameraFrame, deltaSeconds: number): CameraFrame {
  const alpha = 1 - Math.exp(-4 * Math.min(.05, Math.max(0, deltaSeconds)));
  const mix = (a: number, b: number) => a + (b - a) * alpha;
  const a = new Vector3(...from.offset), b = new Vector3(...to.offset);
  const yaw = Math.atan2(a.y, a.x), endYaw = Math.atan2(b.y, b.x);
  const turn = Math.atan2(Math.sin(endYaw - yaw), Math.cos(endYaw - yaw));
  const heading = yaw + turn * alpha, elevation = mix(Math.atan2(a.z, Math.hypot(a.x, a.y)), Math.atan2(b.z, Math.hypot(b.x, b.y)));
  const distance = mix(a.length(), b.length()), horizontal = distance * Math.cos(elevation);
  return { target: from.target.map((v, i) => mix(v, to.target[i])) as Point3,
    offset: [horizontal * Math.cos(heading), horizontal * Math.sin(heading), distance * Math.sin(elevation)], label: to.label };
}

/** 이동 샷의 평행 이동은 판재와 동기화하고 줌/회전만 보간한다. 고배속의 추적 지연을 막는다. */
export function followCameraTranslation(current: CameraFrame, previousTarget: Point3, nextTarget: Point3): CameraFrame {
  return { ...current, target: current.target.map((v, i) => v + nextTarget[i] - previousTarget[i]) as Point3 };
}
