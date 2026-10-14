import { panelAPose, type OvvoModel, type OvvoPhaseP, type OvvoPhaseR } from './ovvoContract';

/**
 * 조립 안내 장면(GuideScene, mm 장면 — 1 unit = 1 mm, 추가 스케일 금지)용 변환.
 *
 * GuideScene 관찰(읽기 전용, sequence.ts / GuideScene.tsx):
 *  - 아래 받침판(계약의 판 B, RH/PH 수용면) 윗면 y=0, 홈 장축 = 장면 +Z, 폭 = 장면 X, 깊이 = 장면 −Y. 홈 중심 z = jointExample.centers[i].
 *  - 위에서 내려오는 세로판(계약의 판 A) 아래 끝 홈은 같은 z에서 아래를 향함.
 *
 * 하드웨어 홈 좌표 S → 장면: X_S→+Z, Y_S→+X, Z_S→+Y (오른손계, det=+1).
 *   행렬(열 = S 축의 장면 방향)  [[0,1,0],[0,0,1],[1,0,0]]   (행 = 장면 x,y,z)
 *   쿼터니언 (x,y,z,w) = (−0.5, −0.5, −0.5, 0.5)  — 축 (1,1,1)/√3 둘레 −120°
 * 접합 좌표 J = 아래 판 B의 S (P: PH, R: RH가 있는 판) — ovvoContract.ts 명명 그대로.
 * 위쪽 판 A의 S_A = J ∘ (S의 X축 π 회전) = 장면 Z축 π 회전. 쿼터니언(S 기준) (1,0,0,0).
 *   주의: 기존 GuideScene는 끝쪽 하우징을 장면 X축 π로 뒤집는다. 대칭 하우징은 겉보기가 같지만
 *   PH 포크 다리(+X_S 끝)의 장축 방향이 반대가 되므로 이 계약의 Z축 π를 사용한다.
 */
export const SLOT_TO_GUIDE_QUATERNION: [number, number, number, number] = [-0.5, -0.5, -0.5, 0.5];
/** 열 우선(three Matrix3.fromArray와 같은 열 순서)이 아닌 행 우선 표기 */
export const SLOT_TO_GUIDE_MATRIX_ROWS: [[number, number, number], [number, number, number], [number, number, number]] = [[0, 1, 0], [0, 0, 1], [1, 0, 0]];
/** S 기준 X축 π (위쪽 판 A 쪽 뒤집기) */
export const FLIP_X_QUATERNION: [number, number, number, number] = [1, 0, 0, 0];

/** S 좌표 점 → 장면 좌표 (홈 중심 z = centerZ, 받침판 윗면 y = faceY) */
export function slotPointToGuide([x, y, z]: [number, number, number], centerZ: number, faceY = 0): [number, number, number] {
  return [y, faceY + z, centerZ + x];
}

/** 장면 좌표 → S 좌표 */
export function guidePointToSlot([gx, gy, gz]: [number, number, number], centerZ: number, faceY = 0): [number, number, number] {
  return [gz - centerZ, gx, gy - faceY];
}

export interface GuideMount {
  /** 장면 위치 (mm) */
  position: [number, number, number];
  /** 장면 쿼터니언 (x,y,z,w), 오른손 회전 */
  quaternion: [number, number, number, number];
}

/** 쿼터니언 곱 a·b (b 먼저 적용) */
export function quatMul(a: [number, number, number, number], b: [number, number, number, number]): [number, number, number, number] {
  const [ax, ay, az, aw] = a; const [bx, by, bz, bw] = b;
  return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz];
}

/**
 * 한 접합점(홈 중심 centerZ)의 장면 장착 변환.
 *  baseHousing: 아래 판 B의 PH(P) 또는 RH(R) — J 원점·축 그대로.
 *  endHousing:  위쪽 판 A의 PH — panelAPose 위치 + X_S π.
 *  connector:   PC/RC — 판 A와 함께 이동, 회전 없음(S 축).
 * 부품 컴포넌트(OvvoPH/OvvoRH/OvvoPC/OvvoRC)를 이 변환의 group 안에 넣으면 된다. 추가 스케일 없음.
 */
export function guideMounts(model: OvvoModel, phase: OvvoPhaseP | OvvoPhaseR, centerZ: number, approachGapMm = 15, faceY = 0) {
  const pose = panelAPose(model, phase, approachGapMm);
  const q = SLOT_TO_GUIDE_QUATERNION;
  const base: GuideMount = { position: slotPointToGuide([0, 0, 0], centerZ, faceY), quaternion: q };
  const end: GuideMount = { position: slotPointToGuide(pose.position, centerZ, faceY), quaternion: quatMul(q, FLIP_X_QUATERNION) };
  const connector: GuideMount = { position: slotPointToGuide(pose.position, centerZ, faceY), quaternion: q };
  return { baseHousing: base, endHousing: end, connector };
}
