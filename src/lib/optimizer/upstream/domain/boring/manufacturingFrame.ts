/**
 * MPR 판재 좌표계 → 3D 판재 로컬 좌표(mm, 판재 중심이 원점).
 *
 * MPR(imos)로 나가는 보링 좌표(PanelBoringData.borings)는 "판재를 기계에
 * 올려놓은 상태"의 2D 좌표다. 3D 뷰어가 이 좌표를 그대로 받아 판재에
 * 구멍을 뚫으면, 화면에 보이는 구멍 = MPR에 찍히는 구멍이 된다.
 *
 * 프레임 정의 (mprPanelConversion.ts / optimizerMachiningGeometry.ts 규약의 역):
 *
 *   측판(좌)   : 가공면(위) = 안쪽면(+X). X축 = 장 상단→하단(-Y). Y축 = 앞→뒤(-Z).
 *                (resolveOptimizerBoringPoint: x = H - 바닥기준높이, y = 앞기준깊이)
 *   측판(우)   : 가공면 = 안쪽면(-X). X축 = 상단→하단(-Y). Y축 = 뒤→앞(+Z).
 *                (resolveFurnitureSideDepthPosition: 우측판은 y = D - 앞기준깊이)
 *   수평판     : 가공면 = 윗면(+Y). X축 = 좌→우(+X). Y축 = 앞→뒤(-Z).
 *                (마구리 유도보링: face left x=0 / right x=W, y = 앞기준깊이)
 *   도어       : 가공면 = 뒷면(-Z, 경첩컵이 파이는 면). Y축 = 상단→하단(-Y).
 *                X축 원점은 경첩 방향이 아니라 **판재 이름**으로 정해진다 — MPR 변환과 같다.
 *                  '좌측 도어'(이름에 좌측): toMprDoorPoint가 x를 거울로 뒤집어 내보내므로
 *                                          원점 = 왼쪽 세로변, X = +X
 *                  그 외('도어', '우측 도어'): 옵티마이저 뒷면 보기 좌표 그대로 →
 *                                          원점 = 오른쪽 세로변, X = -X
 *                단일 도어의 경첩이 왼쪽이면 x = W-22.5 로 나오고, 이 프레임에서 그 값이
 *                왼쪽 세로변 22.5 자리에 떨어진다. isLeftHinge로 프레임을 뒤집으면 안 된다
 *                (그렇게 하면 왼쪽 경첩 단일 도어의 컵이 반대쪽에 찍힌다 — 2026-09-04 수정).
 *   서랍 측판  : 가공면 = 안쪽면. X축 = 하단→상단(+Y). Y축 = 깊이 방향.
 *                (resolveOptimizerBoringPoint 서랍: x = 높이 위치, y = 깊이 위치)
 *
 * 오른손 좌표계 검산: 측판·수평판·서랍측판은 ex × ey = ez 가 성립한다.
 * 도어는 한쪽이 거울상이다 — 좌/우 도어를 같은 원점 규칙으로 내보내는
 * 의도된 규약이므로(테스트 참조) 여기서도 그대로 따른다.
 */
import type { Boring, BoringFace, PanelBoringData } from './types';
import { isRearReinforcementPanelName } from './utils/pairedConnectorPositions';

export type Vec3 = [number, number, number];

export interface BoxMm {
  /** X 크기 (mm) */
  w: number;
  /** Y 크기 (mm) */
  h: number;
  /** Z 크기 (mm) */
  d: number;
}

export interface PanelFrame {
  origin: Vec3;
  ex: Vec3;
  ey: Vec3;
  ez: Vec3;
}

export type ManufacturingPanelKind =
  | 'side-left'
  | 'side-right'
  | 'horizontal'
  | 'rear-reinforcement'
  /** 도어 — 원점 오른쪽 세로변 ('도어', '우측 도어') */
  | 'door'
  /** 도어 — 원점 왼쪽 세로변 (이름에 '좌측': MPR 변환이 x를 거울로 뒤집는다) */
  | 'door-left-origin'
  | 'drawer-end'
  | 'drawer-side-left'
  | 'drawer-side-right'
  | 'none';

export interface FrameOptions {
  /** (남겨둠) 도어 경첩 방향 — 프레임은 판재 이름으로 정하므로 쓰지 않는다 */
  isLeftHinge?: boolean;
}

/** drillHoles()가 받는 구멍 — viewer3d/utils/drillHoles.ts와 같은 규약 */
export interface FrameDrillHole {
  x: number;
  y: number;
  z: number;
  diameter: number;
  depth: number;
  axis: 'x' | 'y' | 'z';
  dir: 1 | -1;
  through?: boolean;
}

const isFurnitureSideName = (name: string): boolean => {
  if (!name) return false;
  if (name.includes('서랍') || name.includes('도어') || name.includes('Door')) return false;
  if (name.includes('서라운드') || name.includes('커튼박스')) return false;
  return name.includes('좌측') || name.includes('우측') || name.includes('측판');
};

/**
 * PanelBoringData가 어느 프레임을 쓰는지.
 *
 * mprPanelConversion은 이름이 안 맞으면 panelType을 'side-left'로 두므로
 * panelType만 믿지 않고 이름도 같이 본다.
 */
export function resolveManufacturingPanelKind(panel: PanelBoringData): ManufacturingPanelKind {
  const name = panel.panelName || '';
  if (name.includes('서랍') && /(?:앞판|뒷판)$/.test(name)) return 'drawer-end';
  if (isRearReinforcementPanelName(name)) return 'rear-reinforcement';
  switch (panel.panelType) {
    case 'door':
      return name.includes('좌측') ? 'door-left-origin' : 'door';
    case 'drawer-side-left':
      return 'drawer-side-left';
    case 'drawer-side-right':
      return 'drawer-side-right';
    case 'top':
    case 'bottom':
    case 'shelf':
      return 'horizontal';
    case 'side-left':
    case 'side-right':
      if (!isFurnitureSideName(name)) return 'none';
      return name.includes('우측') ? 'side-right' : 'side-left';
    default:
      return 'none';
  }
}

export function resolveManufacturingFrame(
  kind: ManufacturingPanelKind,
  box: BoxMm,
  opts: FrameOptions = {}
): PanelFrame | null {
  const hw = box.w / 2;
  const hh = box.h / 2;
  const hd = box.d / 2;
  switch (kind) {
    case 'side-left':
      return { origin: [hw, hh, hd], ex: [0, -1, 0], ey: [0, 0, -1], ez: [1, 0, 0] };
    case 'side-right':
      return { origin: [-hw, hh, -hd], ex: [0, -1, 0], ey: [0, 0, 1], ez: [-1, 0, 0] };
    case 'horizontal':
      return { origin: [-hw, hh, hd], ex: [1, 0, 0], ey: [0, 0, -1], ez: [0, 1, 0] };
    case 'drawer-end':
    case 'rear-reinforcement':
      // 세워진 판의 앞면: X는 좌→우, Y는 아래→위, 두께는 Z.
      return { origin: [-hw, -hh, hd], ex: [1, 0, 0], ey: [0, 1, 0], ez: [0, 0, 1] };
    case 'door':
      return { origin: [hw, hh, -hd], ex: [-1, 0, 0], ey: [0, -1, 0], ez: [0, 0, -1] };
    case 'door-left-origin':
      return { origin: [-hw, hh, -hd], ex: [1, 0, 0], ey: [0, -1, 0], ez: [0, 0, -1] };
    case 'drawer-side-left':
      return { origin: [hw, -hh, -hd], ex: [0, 1, 0], ey: [0, 0, 1], ez: [1, 0, 0] };
    case 'drawer-side-right':
      return { origin: [-hw, -hh, hd], ex: [0, 1, 0], ey: [0, 0, -1], ez: [-1, 0, 0] };
    default:
      return null;
  }
}

/** MPR 2D 점 (x, y) → 판재 로컬 mm. 가공면 위의 점이다. */
export function mprPointToLocalMm(frame: PanelFrame, x: number, y: number): Vec3 {
  return [
    frame.origin[0] + x * frame.ex[0] + y * frame.ey[0],
    frame.origin[1] + x * frame.ex[1] + y * frame.ey[1],
    frame.origin[2] + x * frame.ex[2] + y * frame.ey[2],
  ];
}

const axisOf = (v: Vec3): { axis: 'x' | 'y' | 'z'; sign: 1 | -1 } => {
  if (v[0] !== 0) return { axis: 'x', sign: v[0] > 0 ? 1 : -1 };
  if (v[1] !== 0) return { axis: 'y', sign: v[1] > 0 ? 1 : -1 };
  return { axis: 'z', sign: v[2] > 0 ? 1 : -1 };
};

const axisIndex = (axis: 'x' | 'y' | 'z'): 0 | 1 | 2 => (axis === 'x' ? 0 : axis === 'y' ? 1 : 2);

/** 보링이 파고드는 방향 벡터 (프레임 기준) */
const drillDirection = (frame: PanelFrame, face: BoringFace): Vec3 => {
  const neg = (v: Vec3): Vec3 => [-v[0], -v[1], -v[2]];
  switch (face) {
    case 'top':
      return neg(frame.ez);
    case 'bottom':
      return frame.ez;
    case 'left':
      return frame.ex;
    case 'right':
      return neg(frame.ex);
    case 'front':
      return frame.ey;
    case 'back':
      return neg(frame.ey);
    default:
      return neg(frame.ez);
  }
}

/**
 * MPR 보링 하나 → drillHoles() 구멍.
 *
 * 수직 보링(top/bottom)은 가공면에서 두께 방향으로,
 * 수평 보링(left/right/front/back)은 해당 마구리에서 판 안쪽으로,
 * 명시된 z 높이에 뚫는다(생략 시 두께 중심).
 */
export function mprBoringToDrillHole(
  frame: PanelFrame,
  boring: Boring,
  thickness: number
): FrameDrillHole {
  const p = mprPointToLocalMm(frame, boring.x, boring.y);
  const dirVec = drillDirection(frame, boring.face);
  const { axis, sign } = axisOf(dirVec);
  // dir: +1 이면 축의 음수쪽 면에서 들어간다 (drillHoles 규약)
  const dir: 1 | -1 = sign > 0 ? 1 : -1;
  const ai = axisIndex(axis);

  const isVertical = boring.face === 'top' || boring.face === 'bottom';
  if (!isVertical) {
    // z는 하면 기준. 로컬 판 중심으로 옮긴 뒤 가공면 법선 방향을 적용한다.
    const ez = axisOf(frame.ez);
    p[axisIndex(ez.axis)] = ((boring.z ?? thickness / 2) - thickness / 2) * ez.sign;
  }

  // 관통 판정은 수직 보링(가공면→두께 방향)에만 의미가 있다.
  // 마구리 보링(Ø5x30)은 깊이가 두께보다 커도 관통이 아니다.
  const through = isVertical && boring.depth >= thickness - 0.05;
  if (through) {
    // 관통은 판재 중심선을 준다 (drillHoles 규약)
    p[ai] = 0;
  }

  return {
    x: p[0],
    y: p[1],
    z: p[2],
    diameter: boring.diameter,
    depth: through ? thickness : boring.depth,
    axis,
    dir,
    ...(through ? { through: true } : {}),
  };
}

/**
 * PanelBoringData(MPR로 나가는 그 데이터) → 이 판재에 뚫을 구멍 목록.
 *
 * @param panel  convertPlacedPanelToMprBoringData 결과
 * @param box    3D 판재 크기 (mm). 프레임 원점은 이 크기로 잡는다.
 */
export function mprBoringsToDrillHoles(
  panel: PanelBoringData,
  box: BoxMm,
  opts: FrameOptions = {}
): FrameDrillHole[] {
  const kind = resolveManufacturingPanelKind(panel);
  const frame = resolveManufacturingFrame(kind, box, opts);
  if (!frame) return [];
  const thickness = panel.thickness || Math.min(box.w, box.h, box.d);
  const out: FrameDrillHole[] = [];
  for (const b of panel.borings) {
    if (!(b.diameter > 0) || !(b.depth > 0)) continue;
    if (b.type === 'drawer-rail-slot') continue; // 장공은 원기둥이 아니다
    out.push(mprBoringToDrillHole(frame, b, thickness));
  }
  return out;
}
