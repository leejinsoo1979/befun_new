/**
 * 원본 장다리(Tylko long_leg 렌더 메시) 공용 표시 계약 — R3-HW (claude-graphics, 2026-10-14)
 *
 * 자산: public/models/furniture/long-leg.glb (리더 제공, 읽기 전용·덮어쓰기 금지). 공개 렌더 메시이며 제조 도면이 아니다.
 * 아래 수치는 이 GLB의 POSITION 정점과 노드 TRS를 직접 읽은 값(legs/longLeg.test.mjs가 매번 재검사).
 *
 * ── GLB 구성 (조사 결과) ──
 *  scene → 노드 1개 'long_leg' (부모·자식 없음) → 메시 1개 'leg_s_plus' → 프리미티브 1개, 머티리얼 없음, 스킨/애니메이션 없음.
 *  정점 위치를 용접하면 연결 성분 1개 → 다리 몸통과 장착판은 **분리 불가능한 하나의 rigid 메시**.
 *  나사 3개·중앙 은색 잠금핀·키홀 구멍 형상은 **GLB에 없음**(장착판 윗면은 막힌 면).
 *
 * ── 형상 해석 (정정) ──
 *  메시 y 0..98: 반경 8(메시 단위) 원통, 모든 높이 단면 중심 (0,0) → **곧은 원통 몸통(straight cylindrical shaft)**.
 *  메시 y 98..108: 둥근 모서리 사각 장착판(평면 대각 x ±32.5, z −50.4..8 — 몸통은 판의 한 모서리), 윗판 두께 3.5, 접힌 테두리 98..104.5.
 *  기존 "사선 다리" 해석은 장착판 때문에 넓어진 전체 bbox를 몸통으로 오인한 것.
 *
 * ── 좌표 (노드 TRS 적용 후 = GLB scene 좌표, 단위 m; 아래 *Mm 값은 같은 좌표의 mm 표기) ──
 *  원점      = 몸통 축과 접지면의 교점 (접지점, y = 0)
 *  +Y        = 위. 장착면 = 장착판 윗면 y = 111.48 mm, 법선 +Y (가구 밑판 아랫면에 닿는 면)
 *  기본 회전 = 노드 +Y축 135°(쿼터니언 0, 0.92388, 0, 0.38268) — 원본 그대로, 바꾸지 않음
 *              장착판 뻗는 방향(노드 적용 후) = (−√½, 0, +√½)
 *  스케일    = 노드 균일 0.0010322 (메시 단위 → m). 추가 비균일 스케일 금지.
 *  장면 단위 변환 = 부모 group에 **한 번만**: cm 장면 ×100, mm 장면 ×1000.
 */

export const LONG_LEG_ASSET = {
  url: '/models/furniture/long-leg.glb',
  sha256: 'ce1bd336615cba1887185b44cdd99eb9ceeda2fcb470c98c983624dc17b51b2a',
  bytes: 17392,
  generator: 'Khronos glTF Blender I/O v1.8.19',
  nodeName: 'long_leg',
  meshName: 'leg_s_plus',
  nodeRotation: [0, 0.9238796234130859, 0, 0.38268348574638367] as const,
  nodeScale: 0.0010322006419301033,
  /** 노드 TRS 적용 후 scene 단위 */
  sceneUnit: 'm' as const,
  source: 'https://media.tylko.com/cloudinary/image/upload/v1/renderer/geometry/long_leg.glb (공개 렌더 자산)',
} as const;

const S = LONG_LEG_ASSET.nodeScale * 1000; // 메시 단위 → mm

/** GLB에서 직접 읽은 치수 (mm, 노드 TRS 적용 후). 렌더 메시 기준 — 실물 공차·제조값 아님 */
export const LONG_LEG_GEOMETRY_MM = {
  totalHeight: 108 * S, // 111.48
  shaftRadius: 8 * S, // 8.258 (Ø16.5)
  shaftTop: 98 * S, // 101.16 — 몸통 원통 상단(장착판 접힌 테두리 시작)
  plateUnderside: 104.5 * S, // 107.86 — 윗판 아랫면
  plateThickness: 3.5 * S, // 3.61 — 윗판
  mountFaceY: 108 * S, // 111.48 — 장착면
  /** 장착판 평면 범위 (메시 로컬, 회전 전): x ±32.53, z −50.43..8 */
  plateMeshExtent: { x: [-32.527 * S, 32.527 * S], z: [-50.426 * S, 8 * S] },
  /** 몸통 축 윗면의 얕은 원형 오목(메시 y 106, 반경 5.8). 용도 미확인 — 핀/나사로 해석하지 않음 */
  topRecessRadius: 5.8 * S,
} as const;

export type LegHardwareRole = 'moving' | 'fixed';

export interface LegHardwarePart {
  id: string;
  role: LegHardwareRole;
  /** 원본 GLB에 형상이 있는가 */
  inAsset: boolean;
  /** 확인 근거 */
  basis: string;
}

/**
 * 사진(hardware-leg-mount-002-user-1..4)·영상으로 확실한 분류.
 * moving = 분리 시 함께 빠지는 것, fixed = 판재에 남는 것.
 */
export const LONG_LEG_PARTS: readonly LegHardwarePart[] = [
  { id: 'leg_shaft', role: 'moving', inAsset: true, basis: '사진·영상: 원통 다리가 장착판과 함께 분리 / GLB 몸통 원통' },
  { id: 'mounting_plate', role: 'moving', inAsset: true, basis: '사진·영상: 접힌 테두리 장착판 / GLB 상부 둥근 모서리 사각판 (몸통과 같은 메시)' },
  { id: 'screw_1', role: 'fixed', inAsset: false, basis: '사진: 키홀을 통과한 나사 머리 3개가 분리 후 판재에 남음' },
  { id: 'screw_2', role: 'fixed', inAsset: false, basis: '같음' },
  { id: 'screw_3', role: 'fixed', inAsset: false, basis: '같음' },
  { id: 'central_pin', role: 'fixed', inAsset: false, basis: '사진·영상: 중앙 은색 잠금핀, 누른 뒤 슬라이드 → 판재에 남음' },
] as const;

/** 원본 자산·사례에 없는 치수. 픽셀 추정으로 채우지 않는다. CNC/BOM 출력 금지 */
export const LONG_LEG_UNKNOWN = {
  screwCentresMm: null,
  screwHeadDiameterMm: null,
  pinCentreMm: null,
  pinProtrusionMm: null,
  keyholeProfileMm: null,
  slideTravelMm: null,
  plateHoleLayoutMm: null,
  manufacturingReady: false,
} as const;

/** 메시 노드가 분리되지 않으므로 이동 부품은 전체 rigid group 하나로 다룬다 */
export const LONG_LEG_RIGID_GROUP = {
  separableNodes: false,
  movingGroup: ['leg_shaft', 'mounting_plate'] as const,
  /** fixed 부품을 그려야 하면 별도 illustrative props로 격리 (이 자산에 없음) */
  fixedInAsset: false,
} as const;

export type LegSceneUnit = 'm' | 'cm' | 'mm';

/** GLB(m) → 장면 단위 균일 스케일. 부모 group 한 곳에만 적용 */
export function longLegSceneScale(unit: LegSceneUnit): number {
  return unit === 'm' ? 1 : unit === 'cm' ? 100 : 1000;
}

/** 장면 단위로 본 전체 높이 (접지 0 → 장착면) */
export function longLegHeight(unit: LegSceneUnit): number {
  return (LONG_LEG_GEOMETRY_MM.totalHeight / 1000) * longLegSceneScale(unit);
}
