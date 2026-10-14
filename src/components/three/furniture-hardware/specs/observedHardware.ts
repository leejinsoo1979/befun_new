/**
 * Tylko 렌더러 하드웨어 GLB의 관찰 치수 (R1-VISUAL, claude-graphics, 2026-10-13)
 *
 * 출처: tylko.com 공개 번들이 참조하는 `media.tylko.com/cloudinary/image/upload/v1/renderer/geometry/<name>.glb`
 * 측정 방법: glTF JSON의 POSITION accessor min/max (+ 노드 transform 적용 여부 표기),
 *           회전체 다리는 정점의 높이별 최대 반지름으로 외곽 프로파일만 추출.
 * 메시·정점 데이터는 저장하지 않는다. 형상은 아래 수치로 Befun이 직접 생성한다.
 *
 * 단위: mm. 좌표는 원본 GLB 로컬축 그대로 (y = 위). status는 contracts.md §5 기준.
 */

export type ObservedStatus = 'observed' | 'unverified';

export interface ObservedBounds {
  min: [number, number, number];
  max: [number, number, number];
}

export interface ObservedHardwarePart {
  /** Tylko 번들 내 id (예: shortLeg) — 연구용 메타데이터, Befun 영구 ID 아님 */
  sourceId: string;
  file: string;
  kind: 'leg' | 'handle' | 'hinge' | 'rail' | 'light' | 'other';
  bounds: ObservedBounds;
  /** 노드 scale/rotation을 bounds에 적용했는지 */
  nodeTransformApplied: boolean;
  /** 본(skin)으로 길이가 바뀌는 부품이면 true — bounds는 기본 포즈 */
  skinned: boolean;
  status: ObservedStatus;
  note?: string;
}

const b = (min: [number, number, number], max: [number, number, number]): ObservedBounds => ({ min, max });

export const OBSERVED_HARDWARE: Record<string, ObservedHardwarePart> = {
  // ── 다리 ──
  short_leg: { sourceId: 'shortLeg', file: 'short_leg.glb', kind: 'leg', bounds: b([-8, 0, -8], [8, 22.5, 8]), nodeTransformApplied: true, skinned: false, status: 'observed',
    note: 'Original 기본 조절발. 하부 Ø16×8 패드 + 위로 Ø6.5까지 좁아지는 스템' },
  plane_leg: { sourceId: 'planeLeg', file: 'plane_leg.glb', kind: 'leg', bounds: b([-7.5, 0, -7.5], [7.5, 30, 7.5]), nodeTransformApplied: true, skinned: false, status: 'observed' },
  lift_leg: { sourceId: 'liftLeg', file: 'lift_leg.glb', kind: 'leg', bounds: b([-25, 0, -25], [25, 28, 25]), nodeTransformApplied: true, skinned: false, status: 'observed' },
  long_leg: { sourceId: 'longLeg', file: 'long_leg.glb', kind: 'leg', bounds: b([-39.22, 0, -8.26], [8.26, 111.48, 39.22]), nodeTransformApplied: true, skinned: false, status: 'observed',
    note: '변환 체인(2026-10-14 재측정, VISUAL-REVIEW-001): 루트 노드 1개(부모 없음), rotation 쿼터니언 (0,0.92388,0,0.38268)=+Y축 135°, scale 0.0010322(균일), translation 0. 위 bounds는 전 정점에 노드 TRS를 적용한 값(mm). 변환 전 메시 bounds는 x ±32.527, y 0..108, z -50.426..8 (메시 단위). 앞서 기록한 "45°/108mm"는 오기. [R3-HW 정정 2026-10-14] 이전 "모서리 방향으로 벌어지는 사선 다리" 해석은 오류 — 넓은 bbox는 장착판이다. 정점 검사: 메시 y 0..98은 반경 8 곧은 원통 몸통(단면 중심 축 위, Ø16.52mm), y 98..108은 몸통이 한 모서리에 붙고 (−x,+z) 쪽으로 펼쳐진 둥근 모서리 사각 장착판(접힌 테두리 포함, 윗판 3.61mm). 노드 1·메시 1·연결 성분 1 = 몸통+장착판 rigid. 나사·핀·키홀 형상 없음. bounds·135°·scale 값은 그대로. 표시 계약: legs/longLegContract.ts. 가구 배치는 리더 FurnitureLegs.tsx(furniture-base.ts) 담당' },
  thick_leg: { sourceId: 'thickLeg', file: 'thick_leg.glb', kind: 'leg', bounds: b([-30, 0, -30], [30, 100, 30]), nodeTransformApplied: true, skinned: false, status: 'observed',
    note: '메시 -0.3..0.3 / 0..1, 노드 scale 0.1 적용' },
  pillar_leg: { sourceId: 'pillarLeg', file: 'pillar_leg.glb', kind: 'leg', bounds: b([-30, 0, -30], [30, 200, 30]), nodeTransformApplied: true, skinned: true, status: 'observed',
    note: '본 1개(t 0,0.2,0)로 높이 가변. 200mm는 기본 포즈' },

  // ── 손잡이 ──
  slim_handle: { sourceId: 'slimHandle', file: 'slim_handle.glb', kind: 'handle', bounds: b([-65, -19, -11], [65, 2, 28]), nodeTransformApplied: true, skinned: false, status: 'observed' },
  grip_handle: { sourceId: 'gripHandle', file: 'grip_handle.glb', kind: 'handle', bounds: b([-6, -125, 0], [6, 125, 20]), nodeTransformApplied: true, skinned: false, status: 'observed' },
  horizontal_handle_50: { sourceId: 'horizontalHandle50', file: 'horizontal_handle_50.glb', kind: 'handle', bounds: b([-50, -20, -9.7], [50, 30, 9.3]), nodeTransformApplied: false, skinned: true, status: 'observed',
    note: '본 2개(x ±49)로 길이 가변' },
  vertical_handle_30: { sourceId: 'fullHandleLeft', file: 'vertical_handle_30.glb', kind: 'handle', bounds: b([-20, -50, -9.7], [10, 50, 9.3]), nodeTransformApplied: false, skinned: true, status: 'observed',
    note: 'skeleton_glb. 본 2개(y ±49)로 높이 가변. Type01 전체 높이 손잡이(왼쪽) 추정 — id 대응은 번들 문자열 기준' },
  vertical_handle_50: { sourceId: 'fullHandleRight', file: 'vertical_handle_50.glb', kind: 'handle', bounds: b([-30, -50, -9.7], [20, 50, 9.3]), nodeTransformApplied: false, skinned: true, status: 'observed' },
  short_handle_left: { sourceId: 'shortHandleLeft', file: 'short_handle_left.glb', kind: 'handle', bounds: b([-24.9, -111.5, -20], [1.5, 113.5, 22]), nodeTransformApplied: true, skinned: false, status: 'observed' },
  short_handle_right: { sourceId: 'shortHandleRight', file: 'short_handle_right.glb', kind: 'handle', bounds: b([-1.5, -111.5, -20], [24.9, 113.5, 22]), nodeTransformApplied: true, skinned: false, status: 'observed' },
  handle_ring: { sourceId: 'handleRing', file: 'handle_ring.glb', kind: 'handle', bounds: b([-22.3, -22.3, -4.5], [22.3, 22.3, 1.9]), nodeTransformApplied: true, skinned: false, status: 'observed' },
  handle_hole: { sourceId: 'handleHole', file: 'handle_hole.glb', kind: 'handle', bounds: b([-22, -22, 0], [22, 22, 0]), nodeTransformApplied: true, skinned: false, status: 'observed', note: '두께 0 평면(구멍 표시용)' },
  anode: { sourceId: 'anodeHandle', file: 'anode.glb', kind: 'handle', bounds: b([-60.1, 0, -7.2], [60.1, 1, 7.2]), nodeTransformApplied: true, skinned: false, status: 'observed' },

  // ── 힌지 ──
  hinge_wing: { sourceId: 'hingeWing', file: 'hinge_wing.glb', kind: 'hinge', bounds: b([-20.1, -28.5, -3.2], [16.8, 28.5, 12.8]), nodeTransformApplied: true, skinned: false, status: 'observed' },
  hinge_anchor: { sourceId: 'hingeAnchor', file: 'hinge_anchor.glb', kind: 'hinge', bounds: b([-14.9, -8.4, -67], [21.4, 8.4, 7.1]), nodeTransformApplied: true, skinned: false, status: 'observed' },

  // ── 옷장 레일 ──
  cross_wardrobe_bar: { sourceId: 'crossWardrobeBar', file: 'cross_wardrobe_bar.glb', kind: 'rail', bounds: b([-8, -84.8, -170], [8, 0.2, 170]), nodeTransformApplied: false, skinned: true, status: 'observed',
    note: '본 2개(z ±162, y -90)로 길이 가변. 340mm는 기본 포즈' },
  front_wardrobe_bar: { sourceId: 'frontWardrobeBar', file: 'front_wardrobe_bar.glb', kind: 'rail', bounds: b([-5, -20, -10], [5, 20, 10]), nodeTransformApplied: true, skinned: false, status: 'observed' },
};

/**
 * 회전체 다리의 외곽 프로파일 [반지름mm, 높이mm] — 바닥(y=0)부터 위로.
 * GLB 정점의 높이별 최대 반지름(0.1mm 구간)에서 추출. 내부 나사산·모따기 등 세부는 생략될 수 있다.
 */
export const OBSERVED_LEG_PROFILES: Record<'short_leg' | 'plane_leg', [number, number][]> = {
  short_leg: [[8, 0], [8, 8], [3.24, 22.5]],
  plane_leg: [[7.5, 0], [7.5, 30]],
};
// lift_leg: 높이별 최대 반지름이 y=5와 y=23에서 25mm, 사이 6~22mm 구간 21.99mm로 나와
// 테두리 링인지 경사면인지 판별 불가 → 형상 미확정(unverified). 단면 측정 후 추가.

/**
 * Type01 전체 높이 손잡이(vertical_handle_30) 단면 윤곽 [x, z] mm — 끝면(y=-50) 삼각형 경계에서 추출.
 * x: 문 폭 방향(+x 쪽에 반원 손가락 홈, x≈0 = 채널 바닥/문 모서리 면), z: 문 두께 방향.
 * -z 쪽 긴 날개(x -19.2..0)와 +z 쪽 짧은 립(x -2.9..0) 사이 폭 16.7mm 채널에 문 모서리가 들어간다.
 * 홈 원호는 음/양 절반 정점이 대칭으로 관찰되어 z=±1.1 점을 대칭으로 보간(1점 추정).
 * 어느 z면이 가구 정면인지·문짝 두께와의 관계는 미확인(리더 배치 규칙에서 확정).
 */
export const OBSERVED_FULL_HANDLE_30_SECTION: [number, number][] = [
  [-18.0, -8.2], [-18.5, -8.3], [-18.9, -8.5], [-19.2, -8.7], [-19.2, -9.2], [-18.9, -9.5], [-18.5, -9.7],
  [9.6, -9.7], [9.7, -9.5], [9.9, -9.2], [9.9, -8.7], [9.7, -8.5], [9.6, -8.3], [9.2, -8.3],
  [8.4, -8.1], [7.6, -7.9], [6.8, -7.6], [5.9, -7.1], [5.0, -6.5], [4.2, -5.8], [3.5, -5.0], [2.9, -4.1],
  [2.4, -3.2], [2.0, -2.1], [1.8, -1.1], [1.8, 1.1], [2.0, 2.1], [2.4, 3.2], [2.9, 4.1], [3.5, 5.0],
  [4.2, 5.8], [5.0, 6.5], [5.9, 7.1], [6.8, 7.6], [7.6, 7.9], [8.4, 8.2], [9.2, 8.3],
  [9.6, 8.3], [9.7, 8.5], [9.9, 8.8], [9.7, 9.0], [9.6, 9.2], [-2.2, 9.2], [-2.6, 9.2], [-2.7, 9.0],
  [-2.9, 8.8], [-2.7, 8.5], [-2.6, 8.3], [-2.2, 8.3], [0.0, 8.4], [0.1, 8.3],
  [0.1, -8.3], [0.0, -8.4],
];
