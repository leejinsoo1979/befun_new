/**
 * 패널목록(livePanels) → 컷리스트 → 옵티마이저/생산 판재 변환.
 *
 * CNCOptimizerPro가 인라인으로 하던 두 단계 변환을 한 곳에 둔다.
 *  1) toCutlistPanel   : width(직교) / length(재단방향) 결정
 *  2) toOptimizerPanel : 옵티마이저 Panel — width = W방향, height = L방향
 *
 * MPR 좌표(mprPanelConversion)는 이 Panel의 width/height 프레임을 전제로
 * 하므로, 3D에서 MPR 구멍을 그대로 보여주려면 반드시 같은 변환을 거쳐야 한다.
 */
import type { Panel as CutlistPanel, Grain } from '@/lib/optimizer/upstream/types/cutlist';
import type { Panel as LivePanel, Panel as OptimizerPanel, PlacedPanel } from '../types';

const isDrawerSideName = (name: string): boolean =>
  name.includes('서랍') && (name.includes('좌측판') || name.includes('우측판'));

const isDoorLike = (p: LivePanel, name: string): boolean =>
  p.isDoor === true || name.includes('도어') || name.includes('door');

/** 컷리스트 Panel — CNCOptimizerPro의 livePanels → cutlistPanels 매핑과 동일 */
export function toCutlistPanel(p: LivePanel): CutlistPanel {
  const panelName = (p.name || '').toLowerCase();
  const isBackPanel = panelName.includes('백패널');
  const isDrawerSidePanel = isDrawerSideName(panelName);
  const isDoorPanel = isDoorLike(p, panelName);

  let width: number;
  let length: number;
  let swapAxes = false;
  if (isBackPanel) {
    length = p.height;
    width = p.width;
  } else if (isDrawerSidePanel) {
    swapAxes = true;
    // 서랍 측판 패널목록 기준: L=깊이, W=높이, 결방향=가로.
    length = p.width;
    width = p.height;
  } else if (isDoorPanel || p.grain === 'VERTICAL') {
    length = p.height;
    width = p.width;
  } else {
    swapAxes = true;
    length = p.width;
    width = p.height;
  }

  const isStoneTop = p.material === '인조대리석';
  const grain: Grain = isStoneTop || p.grain === 'NONE'
    ? 'NONE'
    : (isDoorPanel || p.grain === 'VERTICAL')
      ? 'V'
      : 'H';

  let material = p.material || 'PB';
  if (isStoneTop) {
    material = '인조대리석';
  } else if (panelName.includes('백패널')) {
    material = 'MDF';
  } else if (panelName.includes('도어') || panelName.includes('door') ||
      panelName.includes('엔드') || panelName.includes('end') ||
      panelName.includes('프레임') || panelName.includes('서라운드')) {
    material = 'PET';
  }

  return {
    id: p.id,
    textureName: p.textureName,
    manufacturingBoring: p.manufacturingBoring,
    cuttingBoardShape: p.cuttingBoardShape,
    label: p.name || `Panel_${p.id}`,
    width,
    length,
    thickness: p.thickness || (isStoneTop ? p.thickness : 18),
    quantity: p.quantity ?? 1,
    material,
    grain,
    canRotate: (isDoorPanel || isDrawerSidePanel) ? false : true,
    boringPositions: p.boringPositions,
    boringDepthPositions: p.boringDepthPositions,
    boringDepthGroups: p.boringDepthGroups,
    sideBoringPositions: p.sideBoringPositions,
    sideBoringDiameter: p.sideBoringDiameter,
    sideBoringDepth: p.sideBoringDepth,
    groovePositions: p.groovePositions,
    backPanelGroove: p.backPanelGroove,
    screwPositions: p.screwPositions,
    screwDepthPositions: p.screwDepthPositions,
    isDoor: p.isDoor,
    isLeftHinge: p.isLeftHinge,
    screwHoleSpacing: p.screwHoleSpacing,
    bracketBoringPositions: p.bracketBoringPositions,
    bracketBoringDepthPositions: p.bracketBoringDepthPositions,
    isBracketSide: p.isBracketSide,
    cornerNotch: p.cornerNotch ? { ...p.cornerNotch, acrossAxis: swapAxes
      ? (p.cornerNotch.acrossAxis === 'y' ? 'x' : 'y')
      : (p.cornerNotch.acrossAxis ?? 'x') } : undefined,
    sideNotches: p.sideNotches,
    // 결 방향은 치수뿐 아니라 반턱을 재는 축도 바꾼다. 정사각형도 치수 비교로 추정하지 않는다.
    rebate: p.rebate ? { ...p.rebate, acrossAxis: swapAxes
      ? (p.rebate.acrossAxis === 'y' ? 'x' : 'y')
      : (p.rebate.acrossAxis ?? 'x') } : undefined,
    meshName: p.meshName,
    furnitureId: p.furnitureId,
    sourceFurnitureIds: p.sourceFurnitureIds,
    // 확정되지 않은 가공 표시는 변환에서 지우거나 뒤집지 않는다. 생산 파일 차단의 근거다.
    manufacturingReady: p.manufacturingReady,
    manufacturingBlockReasons: p.manufacturingBlockReasons,
  } as CutlistPanel;
}

/** 옵티마이저 Panel — CNCOptimizerPro의 groupPanels → optimizerPanels 매핑과 동일 */
export function toOptimizerPanel(p: CutlistPanel): OptimizerPanel {
  if ((p.cuttingBoardShape?.cuts.length || p.cuttingBoardShape?.profile) && (p.width !== p.cuttingBoardShape.width || p.length !== p.cuttingBoardShape.height)) {
    throw new Error('가공이 있는 컷팅보드 패널의 크기는 컷팅보드에서 수정한 뒤 다시 보내 주세요.');
  }
  const c = p as CutlistPanel & Record<string, unknown>;
  return {
    id: p.id,
    textureName: p.textureName,
    manufacturingBoring: p.manufacturingBoring,
    manufacturingReady: p.manufacturingReady,
    manufacturingBlockReasons: p.manufacturingBlockReasons,
    cuttingBoardShape: p.cuttingBoardShape ? { ...p.cuttingBoardShape, width: p.width, height: p.length } : undefined,
    name: p.label,
    width: p.width,    // W방향
    height: p.length,  // L방향
    thickness: p.thickness,
    quantity: p.quantity,
    material: p.material || 'PB',
    color: 'MW',
    grain: p.grain === 'H' ? 'HORIZONTAL' :
           p.grain === 'V' ? 'VERTICAL' :
           'NONE',
    canRotate: p.canRotate,
    boringPositions: p.boringPositions,
    boringDepthPositions: p.boringDepthPositions,
    boringDepthGroups: p.boringDepthGroups,
    sideBoringPositions: p.sideBoringPositions,
    sideBoringDiameter: p.sideBoringDiameter,
    sideBoringDepth: p.sideBoringDepth,
    groovePositions: p.groovePositions,
    backPanelGroove: c.backPanelGroove as OptimizerPanel['backPanelGroove'],
    screwPositions: p.screwPositions,
    screwDepthPositions: p.screwDepthPositions,
    isDoor: p.isDoor,
    isLeftHinge: p.isLeftHinge,
    screwHoleSpacing: p.screwHoleSpacing,
    bracketBoringPositions: p.bracketBoringPositions,
    bracketBoringDepthPositions: p.bracketBoringDepthPositions,
    isBracketSide: p.isBracketSide,
    cornerNotch: c.cornerNotch as OptimizerPanel['cornerNotch'],
    sideNotches: c.sideNotches as OptimizerPanel['sideNotches'],
    rebate: c.rebate as OptimizerPanel['rebate'],
    meshName: c.meshName as string | undefined,
    furnitureId: c.furnitureId as string | undefined,
    sourceFurnitureIds: c.sourceFurnitureIds as string[] | undefined,
  } as OptimizerPanel;
}

/**
 * 패널목록 한 장 → 생산(MPR) 좌표 프레임의 PlacedPanel.
 * 네스팅 배치와 무관하므로 x=0, y=0, rotated=false.
 */
export function toManufacturingPlacedPanel(p: LivePanel): PlacedPanel {
  return {
    ...toOptimizerPanel(toCutlistPanel(p)),
    x: 0,
    y: 0,
    rotated: false,
  };
}
