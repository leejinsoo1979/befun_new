/**
 * Tylko 클립(단면 매입 커넥터)과 상대 핀 — 좌표·치수 계약 (R1-VISUAL, claude-graphics, 2026-10-14)
 *
 * 근거
 *  - 외형: connector-clip-004 사용자 지정 사진. 합판 좁은 단면에 양끝이 둥근 길쭉한 검정/주황 부품이 매입.
 *  - 동작: connector-clip-003 공식 PDF "Aligning Horizontal and Vertical Elements".
 *    p2 색상 대응(검정↔검정, 은색↔은색, 구형 주황↔주황, locking/non-locking 2종).
 *    p3–4 핀과 입구 정렬 → 접합면 접근. p5 핀 진입 후 클립 장축 방향으로 슬라이드. p6 최종 위치와 끝선 정렬.
 *  - PDF p2 사진의 클립 내부는 둥근 입구 + 장축 방향 좁은 홈(열쇠구멍형).
 *
 * 미확정(모두 null): 클립 길이/폭/매입 깊이, 입구 지름, 홈 폭, 체결 이동 거리, 핀 머리/목 치수와 돌출량,
 * 립 두께와 언더컷 폭, 판 두께 조건, 배치 간격, 색상별 잠금 역할, 공급사/품번. → 아래 치수는 항상 호출자가 mm로 넣는다(기본값 없음).
 *
 * ── 클립 로컬 좌표 (mm) ──
 *  원점 O  = 핀 입구 중심이 접합면(클립이 박힌 판의 단면 표면)과 만나는 점
 *  +Z      = 접합면 바깥 법선(상대 판 쪽). 클립 몸체는 z ∈ [-depth, 0]에 매입
 *  +X      = 클립 장축 = 체결 슬라이드 방향. 핀은 입구(x=0) → 체결 위치(x=travel)로 이동(클립 기준 상대 운동)
 *  +Y      = X×Z (클립 폭 = 판 두께 방향)
 *
 * ── 핀 로컬 좌표 (mm) ──
 *  원점 P  = 상대 판 넓은 면(접합면)과 핀 축의 교점
 *  +Z      = 핀 축, 판 면 바깥(클립 쪽). 핀 목은 z ∈ [0, neckLength], 머리는 그 위
 *
 * ── 결합 관계 ──
 *  조립 상태에서 P는 클립 접합면 위 (pinX, 0, 0)에 놓이고 핀 +Z = 클립 -Z (두 접합면이 맞닿음).
 *  단계별 pinX: 정렬/접근 = 0 (z로 떨어져 있음) → 진입 = 0 → 체결 = travel.
 *  p5의 "화면 아래 화살표"는 클립 +X의 한 예시일 뿐, 월드 하강으로 고정하지 않는다(리더 접합점 자세로 변환).
 */

/** 치수 출처 상태 — measured만 제조 데이터로 쓸 수 있다 */
export type ClipDimensionStatus = 'measured' | 'illustrative';

/** 공식 PDF p2 색상. 색상별 잠금(locking/non-locking) 역할은 미확인이라 담지 않는다 */
export type ClipColor = 'black' | 'orange' | 'silver';

export interface TylkoClipDimensions {
  /** 장축 전체 길이(둥근 끝 포함) */
  lengthMm: number;
  /** 폭(판 두께 방향) */
  widthMm: number;
  /** 매입 깊이 */
  depthMm: number;
  /** 핀 머리가 들어가는 둥근 입구 지름 */
  entryDiameterMm: number;
  /** 핀 목이 지나가는 좁은 홈 폭 */
  slotWidthMm: number;
  /** 입구 중심 → 체결 위치 중심 (슬라이드 이동 거리) */
  travelMm: number;
  /** 접합면 쪽 립 두께 — 좁은 홈은 이 립에만 있고, 그 아래는 핀 머리가 지나가는 넓은 통로(언더컷) */
  lipThicknessMm: number;
  status: ClipDimensionStatus;
  /** 근거 사례 ID 또는 설명 */
  source: string;
}

export interface TylkoClipPinDimensions {
  /** 머리 지름 (입구 지름보다 작고 홈 폭보다 커야 걸린다) */
  headDiameterMm: number;
  headHeightMm: number;
  /** 목 지름 (홈 폭보다 작아야 슬라이드) */
  neckDiameterMm: number;
  /** 판 면에서 머리 아랫면까지 돌출 길이 */
  neckLengthMm: number;
  status: ClipDimensionStatus;
  source: string;
}

export type ClipJointPhase = 'aligned' | 'entered' | 'locked';

/** 클립 로컬 좌표에서 핀 원점 P의 위치 (approachGapMm: 정렬 단계에서 접합면 사이 간격) */
export function pinPositionInClip(clip: Pick<TylkoClipDimensions, 'travelMm'>, phase: ClipJointPhase, approachGapMm = 0): [number, number, number] {
  if (phase === 'locked') return [clip.travelMm, 0, 0];
  if (phase === 'entered') return [0, 0, 0];
  return [0, 0, approachGapMm];
}

/** 클립 몸체의 장축 시작/끝 x (입구 중심 기준, 양끝 여유 균등) */
export function clipBodyExtent(d: TylkoClipDimensions): { startX: number; endX: number } {
  const inner = d.entryDiameterMm / 2 + d.travelMm + d.slotWidthMm / 2;
  const margin = (d.lengthMm - inner) / 2;
  return { startX: -d.entryDiameterMm / 2 - margin, endX: d.travelMm + d.slotWidthMm / 2 + margin };
}

/** 치수 상호 조건. 위반 시 이유 목록(빈 배열이면 통과) */
export function validateClipPair(clip: TylkoClipDimensions, pin?: TylkoClipPinDimensions): string[] {
  const errors: string[] = [];
  const pos = (v: number, name: string) => { if (!(v > 0)) errors.push(`${name} must be > 0`); };
  pos(clip.lengthMm, 'lengthMm'); pos(clip.widthMm, 'widthMm'); pos(clip.depthMm, 'depthMm');
  pos(clip.entryDiameterMm, 'entryDiameterMm'); pos(clip.slotWidthMm, 'slotWidthMm'); pos(clip.travelMm, 'travelMm');
  pos(clip.lipThicknessMm, 'lipThicknessMm');
  if (clip.lipThicknessMm >= clip.depthMm) errors.push('lipThicknessMm must be smaller than depthMm');
  if (clip.slotWidthMm >= clip.entryDiameterMm) errors.push('slotWidthMm must be smaller than entryDiameterMm');
  if (clip.entryDiameterMm >= clip.widthMm) errors.push('entryDiameterMm must fit inside widthMm');
  if (clipBodyExtent(clip).startX > -clip.entryDiameterMm / 2) errors.push('lengthMm too short for entry + travel + slot');
  if (pin) {
    pos(pin.headDiameterMm, 'headDiameterMm'); pos(pin.headHeightMm, 'headHeightMm');
    pos(pin.neckDiameterMm, 'neckDiameterMm'); pos(pin.neckLengthMm, 'neckLengthMm');
    if (pin.headDiameterMm >= clip.entryDiameterMm) errors.push('pin head must pass the entry');
    if (pin.headDiameterMm <= clip.slotWidthMm) errors.push('pin head must be retained by the slot');
    if (pin.neckDiameterMm >= clip.slotWidthMm) errors.push('pin neck must slide in the slot');
    if (pin.neckLengthMm + pin.headHeightMm > clip.depthMm) errors.push('pin must fit within clip depth');
    if (pin.neckLengthMm < clip.lipThicknessMm) errors.push('pin neck must clear the lip so the head sits in the undercut');
  }
  return errors;
}

/** 제조(CNC/BOM) 출력 가능 여부 — 클립·핀 모두 measured일 때만 */
export function isManufacturingReady(clip: TylkoClipDimensions, pin: TylkoClipPinDimensions): boolean {
  return clip.status === 'measured' && pin.status === 'measured' && validateClipPair(clip, pin).length === 0;
}
