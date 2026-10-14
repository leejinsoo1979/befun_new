/**
 * OVVO V-1230 P(영구)/R(해제형) — 좌표 계약 + 치수 출처 (R2-HW, claude-graphics, 2026-10-14)
 *
 * 근거: docs/tylko-reference/sources/ovvo-audit-001-{v1230p-instructions,v1230r-instructions,v1230r-spec}.pdf
 *  - Milling: 장공 30 × 9.4, 깊이 12.5 ± 0.5, 커터 이동(중심 간) 20.5–20.7 → 커터 지름 = 9.4 (도면 표기)
 *  - P: PH(하우징) 2개 + PC(양방향 커넥터). "Push into place" → 누름 체결
 *  - R: PH + RC(L자 비대칭) + RH. "(i) Insert (ii) Slide", 해제 "(i) Slide (ii) Lift", 해제 이동 15 (도면 표기)
 *  - 사양서: 판 두께 15mm 이상
 * 미확정: 홈 내부 언더컷 단면(Depth 그림은 윤곽만, 치수 없음), 부품 단면·두께·바브 치수, RC 혀 길이·위치,
 *        RH 창/립 구간 길이, 체결 시 압입 간섭량. → 아래 PART 치수는 설명용(illustrative). CNC/BOM 출력 금지.
 *
 * ── 홈(슬롯) 로컬 좌표 S (각 판마다 1개, mm) ──
 *  원점   = 홈 중심(장축 중앙)과 판 표면(접합면)의 교점
 *  +Z     = 판 바깥 법선(상대 판 쪽). 홈은 z ∈ [-depth, 0]
 *  +X     = 홈 장축(커터 이동 방향). 커터 중심은 x = ±travel/2
 *  +Y     = Z×X (홈 폭 방향)
 *  장착 포켓 기준 = 이 원점. 하우징(PH/RH)은 S에서 단위 변환으로 착좌(윗면 z=0 일치, 장축 중앙 정렬).
 *
 * ── 접합 좌표 J ──
 *  J = 아래쪽 판 B의 S (P: PH가 있는 판 / R: RH가 있는 판).
 *  위쪽 판 A의 S_A = J 기준 회전 X축 π(z→-z, y→-y) + 평행이동 (dx, 0, dz).
 *  P: 체결 dx = 0, dz = 0. 삽입축 = -Z_J(A를 B 쪽으로 누름).
 *  R: 삽입 dx = +RELEASE_TRAVEL(15), dz → 0 (Insert), 이후 -X_J로 15 슬라이드해 dx = 0 (Locked).
 *     해제는 +X_J로 15 슬라이드 → +Z_J로 들어 올림(도면 4. Release). 조립 역재생과 같은 축이지만 해제 순서는 도면 그대로.
 *  커넥터(PC/RC)는 A와 함께 움직인다: J에서 위치 = (dx, 0, dz), 회전 없음(위쪽 절반 = A 쪽 +Z).
 */

export const OVVO_V1230_OBSERVED = {
  slotLengthMm: 30, // 도면 Travel 그림의 바깥 길이
  slotWidthMm: 9.4, // 도면 표기 = 커터 지름
  slotDepthMm: 12.5, // 권장 설정 12.5 ± 0.5
  slotDepthToleranceMm: 0.5,
  cutterTravelMinMm: 20.5,
  cutterTravelMaxMm: 20.7,
  releaseTravelMm: 15, // R 설치도 4. Release 표기
  minPanelThicknessMm: 15, // R 사양서
  spacingP: { aMm: [35, 80], bMm: [150, 350] },
  spacingR: { aMm: [35, 80], bMm: [100, 250] },
  undercutProfile: null as null, // 미확정 — Depth 그림에 치수 없음
  source: 'ovvo-audit-001 PDF(P/R 설치도, R 사양서)',
} as const;

/** 홈 캡슐 외곽 (평면): 커터 중심 ±travel/2, 반경 width/2. 중간값 20.6 사용 */
export const SLOT_CAPSULE = {
  centerHalfSpanMm: (OVVO_V1230_OBSERVED.cutterTravelMinMm + OVVO_V1230_OBSERVED.cutterTravelMaxMm) / 4, // 10.3
  radiusMm: OVVO_V1230_OBSERVED.slotWidthMm / 2, // 4.7
  depthMm: OVVO_V1230_OBSERVED.slotDepthMm,
};

/** 점이 홈 외곽(캡슐 × 깊이) 안에 있는지 — 언더컷 내부 윤곽은 미확정이라 외곽만 검사 */
export function insideSlotEnvelope([x, y, z]: [number, number, number], eps = 1e-3): boolean {
  if (z > eps || z < -SLOT_CAPSULE.depthMm - eps) return false;
  const cx = Math.max(-SLOT_CAPSULE.centerHalfSpanMm, Math.min(SLOT_CAPSULE.centerHalfSpanMm, x));
  return Math.hypot(x - cx, y) <= SLOT_CAPSULE.radiusMm + eps;
}

export type OvvoModel = 'P' | 'R';
export type OvvoPhaseP = 'separated' | 'pressed';
export type OvvoPhaseR = 'aligned' | 'inserted' | 'locked';

export interface PanelAPose {
  /** J 기준 판 A 홈 원점 위치 (mm) */
  position: [number, number, number];
  /** J 기준 판 A 회전 (X축 π 고정) */
  rotation: [number, number, number];
}

/** 단계별 판 A(위쪽 판)의 홈 좌표 S_A — 커넥터도 같은 위치로 이동(회전은 커넥터에 적용하지 않음) */
export function panelAPose(model: OvvoModel, phase: OvvoPhaseP | OvvoPhaseR, approachGapMm = 15): PanelAPose {
  const rot: [number, number, number] = [Math.PI, 0, 0];
  if (model === 'P') return { position: [0, 0, phase === 'separated' ? approachGapMm : 0], rotation: rot };
  const t = OVVO_V1230_OBSERVED.releaseTravelMm;
  if (phase === 'aligned') return { position: [t, 0, approachGapMm], rotation: rot };
  if (phase === 'inserted') return { position: [t, 0, 0], rotation: rot };
  return { position: [0, 0, 0], rotation: rot };
}

/** 판 A의 홈 좌표 → J 좌표 (회전 X축 π 후 평행이동) */
export function panelAToJoint(p: [number, number, number], pose: PanelAPose): [number, number, number] {
  return [p[0] + pose.position[0], -p[1] + pose.position[1], -p[2] + pose.position[2]];
}

/** J 좌표 → 판 A의 홈 좌표 */
export function jointToPanelA(p: [number, number, number], pose: PanelAPose): [number, number, number] {
  return [p[0] - pose.position[0], -(p[1] - pose.position[1]), -(p[2] - pose.position[2])];
}
