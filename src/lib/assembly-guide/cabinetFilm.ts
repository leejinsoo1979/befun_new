import { Box3, Euler, Quaternion, Vector3 } from 'three';
import { advanceCabinet, cabinetPartPose, cabinetPhaseDuration, initialCabinetState, isCabinetRear, type CabinetPart, type CabinetPhase, type CabinetPlan, type CabinetState, type CabinetVector } from './cabinet';

const smooth = (value: number) => { const p = Math.max(0, Math.min(1, value)); return p * p * (3 - 2 * p); };
const phases = (part: CabinetPart): CabinetPhase[] => ['choose', ...(part.hardware.length ? ['hardware' as const] : []), 'placing', ...(isCabinetRear(part) ? ['spring-press', 'spring-seat', 'spring-lock'] as const : []), 'check'];
export function cabinetFilmDuration(plan: CabinetPlan) {
  return plan.parts.reduce((sum, part, step) => sum + phases(part).reduce((at, phase) => at + cabinetPhaseDuration({ ...initialCabinetState(), automatic: true, step, phase }, plan), 0), 0) + 3.5;
}
export function cabinetFilmElapsed(plan: CabinetPlan, state: CabinetState) {
  if (state.phase === 'complete') return cabinetFilmDuration(plan);
  let elapsed = 0;
  for (let step = 0; step < plan.parts.length; step++) {
    for (const phase of phases(plan.parts[step])) {
      const duration = cabinetPhaseDuration({ ...state, automatic: true, step, phase }, plan);
      if (step === state.step && phase === 'placing' && state.phase === 'ready') return elapsed;
      if (step === state.step && phase === state.phase) return elapsed + state.progress * duration;
      elapsed += duration;
    }
  }
  return elapsed + state.progress * 3.5;
}
export function seekCabinetFilm(plan: CabinetPlan, seconds: number) {
  return { ...advanceCabinet({ ...initialCabinetState(), automatic: true, playing: true }, Math.max(0, Math.min(cabinetFilmDuration(plan), seconds)), plan), playing: false };
}
export function cabinetActionCaption(state: CabinetState, part: CabinetPart) {
  if (state.phase === 'spring-press') return '상단 스프링 다보 두 개를 눌러 넣습니다.';
  if (state.phase === 'spring-seat') return '아래 다보를 받침점으로 유지하며 패널 상단을 안으로 세웁니다.';
  if (state.phase === 'spring-lock') return '구멍에 맞춘 스프링 다보가 복귀하며 잠깁니다.';
  if (state.phase === 'placing' && isCabinetRear(part)) return '패널을 기울여 아래 고정 다보 두 개를 먼저 끼웁니다.';
  return { choose: state.automatic ? '이번 부품과 조립 방향을 확인합니다.' : '번호가 표시된 부품을 선택하세요.', hardware: '홈에 하우징을 넣고 연결 커넥터를 끼웁니다.', ready: '표시된 위치를 눌러 부품을 조립하세요.', placing: '부품을 옮겨 두 결합 위치를 맞춥니다.', check: '끝선과 잠금 상태를 확인합니다.', reveal: '캐비넷을 완성했습니다. 전체 모습과 내부를 확인하세요.', complete: '캐비넷을 완성했습니다. 돌려 보거나 도어를 열어 보세요.' }[state.phase];
}

export interface CabinetShot { target: CabinetVector; position: CabinetVector; fov: number }
function rotation(part: CabinetPart, state: CabinetState) {
  const pose = cabinetPartPose(part, state);
  return new Quaternion().setFromEuler(new Euler(...part.animation.rotation)).slerp(new Quaternion(), pose.rotationProgress).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pose.tilt));
}
function world(part: CabinetPart, state: CabinetState, local: readonly number[] = [0, 0, 0]) {
  const pose = cabinetPartPose(part, state);
  return new Vector3(...local).applyQuaternion(rotation(part, state)).add(new Vector3(...pose.position).multiplyScalar(10)).add(new Vector3(0, 10, 0));
}
function shot(target: Vector3, radius: number, direction: Vector3, aspect: number, fov = 38): CabinetShot {
  const halfAngle = Math.atan(Math.tan(fov * Math.PI / 360) * Math.min(1, Math.max(.25, aspect)));
  const distance = radius / Math.sin(halfAngle);
  return { target: target.toArray() as CabinetVector, position: direction.normalize().multiplyScalar(distance).add(target).toArray() as CabinetVector, fov };
}
function mix(a: CabinetShot, b: CabinetShot, progress: number): CabinetShot {
  const p = smooth(progress);
  const point = (x: CabinetVector, y: CabinetVector) => x.map((at, axis) => at + (y[axis] - at) * p) as CabinetVector;
  return { target: point(a.target, b.target), position: point(a.position, b.position), fov: a.fov + (b.fov - a.fov) * p };
}
function bodyShot(plan: CabinetPlan, count: number, aspect: number, angle = .45, open: boolean | number = false) {
  const bounds = new Box3();
  for (const part of plan.parts.slice(0, count)) {
    const b = part.box;
    bounds.expandByPoint(new Vector3((b.x - b.w / 2) * 10, (b.y - b.h / 2) * 10 + 10, (b.z - b.d / 2) * 10));
    bounds.expandByPoint(new Vector3((b.x + b.w / 2) * 10, (b.y + b.h / 2) * 10 + 10, (b.z + b.d / 2) * 10));
  }
  const target = bounds.getCenter(new Vector3());
  if (open) target.setZ(target.z + 100 * Number(open));
  return shot(target, Math.max(250, bounds.getSize(new Vector3()).length() * .5) * (1 + .22 * Number(open)) + 45, new Vector3(Math.sin(angle), .42, Math.cos(angle)), aspect, 42);
}
function laidOutShot(plan: CabinetPlan, aspect: number) {
  const bounds = new Box3();
  for (const p of plan.parts) {
    const at = p.animation.floor, footprint = p.animation.footprint;
    bounds.expandByPoint(new Vector3((at[0] - footprint[0] / 2) * 10, 0, (at[2] - footprint[1] / 2) * 10));
    bounds.expandByPoint(new Vector3((at[0] + footprint[0] / 2) * 10, 100, (at[2] + footprint[1] / 2) * 10));
  }
  return shot(bounds.getCenter(new Vector3()), bounds.getSize(new Vector3()).length() * .5 + 30, new Vector3(.65, 1.4, 1.15), aspect, 42);
}
function partShot(part: CabinetPart, state: CabinetState, aspect: number) {
  return shot(world(part, state), Math.hypot(part.box.w, part.box.h, part.box.d) * 5 + 25, new Vector3(.55 + .2 * Math.sin(state.progress * Math.PI), .65, 1.25), aspect, 40);
}
function detailShot(part: CabinetPart, state: CabinetState, aspect: number, upper = false) {
  if (isCabinetRear(part)) return shot(world(part, state, [part.pinCenters[0], (upper ? 1 : -1) * part.box.h * 5 + (upper ? 2 : -2.5), 0]), 38,
    new Vector3(.7, upper ? -.25 : .6, -1.2), aspect, 34);
  const mount = part.hardware[0];
  if (!mount) return partShot(part, state, aspect);
  const direction = new Vector3(0, 0, 1).applyQuaternion(new Quaternion(...mount.quaternion)).applyQuaternion(rotation(part, state)).multiplyScalar(1.1).add(new Vector3(.5, .65, 1));
  direction.setY(Math.max(.25, direction.y));
  return shot(world(part, state, mount.at), 52, direction, aspect, 36);
}

/** Absolute choreography: pause, seek and long frames produce exactly the same camera. No random shake/roll. */
export function cabinetFilmShot(plan: CabinetPlan, state: CabinetState, aspect: number, reducedMotion = false): CabinetShot {
  const part = plan.parts[state.step], p = state.progress;
  if (reducedMotion) return bodyShot(plan, Math.max(1, state.step + 1), aspect);
  if (state.phase === 'complete') return bodyShot(plan, plan.parts.length, aspect, .8, true);
  if (state.phase === 'reveal') return bodyShot(plan, plan.parts.length, aspect, .45 + .35 * smooth(p) - .5 * Math.sin(p * Math.PI), smooth(p / .55));
  if (state.phase === 'choose') {
    const start = state.step === 0 ? laidOutShot(plan, aspect) : bodyShot(plan, state.step, aspect);
    const next = isCabinetRear(part) ? detailShot(part, state, aspect) : partShot(part, state, aspect);
    return mix(start, next, p);
  }
  if (state.phase === 'hardware') return mix(partShot(part, state, aspect), detailShot(part, state, aspect), Math.min(1, p / .4));
  if (state.phase === 'placing') {
    const detail = detailShot(part, state, aspect), following = partShot(part, state, aspect);
    return p < .22 ? mix(detail, following, p / .22) : p < .65 ? following : mix(following, detail, (p - .65) / .17);
  }
  if (state.phase === 'spring-press') return mix(detailShot(part, state, aspect), detailShot(part, state, aspect, true), p / .65);
  if (state.phase === 'spring-seat' || state.phase === 'spring-lock') return detailShot(part, state, aspect, true);
  if (state.phase === 'check') return mix(detailShot(part, state, aspect, isCabinetRear(part)), bodyShot(plan, state.step + 1, aspect), p);
  return partShot(part, state, aspect);
}
