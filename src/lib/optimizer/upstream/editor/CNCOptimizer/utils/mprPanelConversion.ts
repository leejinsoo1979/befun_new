import { panelQuantity } from '@/lib/optimizer/upstream/utils/cut/panelDimensions';
import type { Boring, PanelBoringData } from '@/lib/optimizer/upstream/domain/boring/types';
import { isRearReinforcementPanelName } from '@/lib/optimizer/upstream/domain/boring/utils/pairedConnectorPositions';
import {
  isFurnitureSidePanelName,
  resolveDefaultBoringDepthPositions,
  resolveManufacturingBoringPoint,
  resolveManufacturingBracketPoint,
  resolveOptimizerDoorBoringPoints,
} from '@/lib/optimizer/upstream/utils/cnc/optimizerMachiningGeometry';
import type { Panel, PlacedPanel } from '../types';
import { mergeManufacturingBlock } from '@/lib/optimizer/upstream/domain/boring/manufacturingBlock';

export const isMprFixedHorizontalPanel = (panelName?: string): boolean => {
  const name = panelName || '';
  if (!name) return false;
  if (name.includes('서랍') || name.includes('인조대리석') || name.includes('전자렌지') || name.includes('트레이')) return false;
  if (name.includes('걸레받이') || name.includes('몰딩') || name.includes('프레임') || name.includes('찬넬')) return false;

  return (
    name.includes('상판') ||
    name.includes('천판') ||
    name.includes('천지판') ||
    name.includes('하판') ||
    name.includes('바닥') ||
    name.includes('바닥판') ||
    name.includes('지판') ||
    name.includes('고정선반') ||
    name.includes('옷봉 선반') ||
    name.includes('옷봉선반')
  );
};

function isFurnitureSidePanel(panel: PlacedPanel): boolean {
  return isFurnitureSidePanelName(panel.name);
}

function getMprPanelSize(panel: PlacedPanel): { width: number; height: number } {
  if (panel.cuttingBoardShape) return { width: panel.width, height: panel.height };
  if (isFurnitureSidePanel(panel)) {
    return { width: panel.height, height: panel.width };
  }

  if (!panel.isDoor && panel.sideBoringPositions?.length) {
    return { width: panel.height, height: panel.width };
  }

  return { width: panel.width, height: panel.height };
}

function roundMprCoord(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function toMprDoorPoint(panel: PlacedPanel, point: { x: number; y: number }): { x: number; y: number } {
  const panelName = panel.name || '';
  if (panelName.includes('좌측')) {
    return {
      x: roundMprCoord(panel.width - point.x),
      y: point.y,
    };
  }
  return point;
}

export function convertPlacedPanelToMprBoringData(panel: PlacedPanel): PanelBoringData {
  if (panel.cuttingBoardShape?.cuts.length || panel.cuttingBoardShape?.profile) {
    throw new Error('컷팅보드 곡선 외곽·구멍·따내기의 MPR 변환은 아직 지원하지 않습니다. 가공 형상이 포함된 DXF 또는 컷팅보드 파일을 사용해 주세요.');
  }
  // 반입 판재의 현재 가공을 원본 모듈 규칙으로 덮어쓰지 않는다.
  // 다만 차단 표시는 양쪽(판재·제조좌표)을 합쳐 남긴다. 한쪽만 보면 우회 경로가 생긴다.
  const unsupportedReasons: string[] = [];
  if (panel.cornerNotch) unsupportedReasons.push('상판 코너 따내기의 MPR 가공 경로는 아직 지원하지 않습니다.');
  if (panel.rebate) unsupportedReasons.push('반턱 따내기의 하면 적재·MPR 가공 경로는 아직 지원하지 않습니다.');
  const unsupported = unsupportedReasons.length
    ? { manufacturingReady: false as const, manufacturingBlockReasons: unsupportedReasons }
    : undefined;
  if (panel.manufacturingBoring) {
    const stored = JSON.parse(JSON.stringify(panel.manufacturingBoring)) as PanelBoringData;
    stored.panelId = panel.id;
    return mergeManufacturingBlock(stored, panel, unsupported);
  }
  const borings: Boring[] = [];
  let boringIdx = 0;

  const panelThickness = panel.thickness || ((panel.material === 'PET') ? 18 : 18);
  const mprSize = getMprPanelSize(panel);
  const isDrawerFrontPanel = panel.name?.includes('서랍') && panel.name?.includes('앞판');
  // MPR 가공 좌표는 네스팅(시트 배치) 회전과 무관하게 항상 원본 패널 프레임 기준이어야 한다.
  // resolveOptimizer* 함수의 rotated 스케일링은 시트 프리뷰 전용이므로 여기서는 비활성화한다.
  const machiningPanel: PlacedPanel = panel.rotated ? { ...panel, rotated: false } : panel;

  // 1) 측판 보링
  // - 고정선반/천지판 결합: Ø6 관통
  // - 이동선반 다보: Ø5 depth=12
  if (!panel.isDoor && !isDrawerFrontPanel && panel.boringPositions && panel.boringPositions.length > 0) {
    const yPositions = panel.boringPositions;
    const xPositions = panel.boringDepthPositions || [];
    const isDrawerPanel = panel.name?.includes('서랍');
    const isDrawerSidePanel = isDrawerPanel &&
      (panel.name?.includes('좌측판') || panel.name?.includes('우측판'));
    let defaultXPositions: number[];
    if (xPositions.length > 0) {
      defaultXPositions = xPositions;
    } else {
      defaultXPositions = resolveDefaultBoringDepthPositions(panel, isDrawerSidePanel);
    }

    yPositions.forEach((yPos) => {
      const group = panel.boringDepthGroups?.find(item => Math.abs(item.y - yPos) < 0.01);
      const xPositionsForY = (group?.depthPositions?.length ?? 0) > 0 ? group!.depthPositions : defaultXPositions;
      const isFixedPanelBoring = group?.boringType === 'fixed-panel'
        || (!group?.boringType && !isDrawerPanel && xPositionsForY.length >= 3);

      xPositionsForY.forEach((xPos: number) => {
        const point = resolveManufacturingBoringPoint(machiningPanel, {
          boringPosMm: yPos,
          depthPosMm: xPos,
          isDrawerSidePanel,
          isDrawerFrontPanel: false,
        });
        borings.push({
          id: isDrawerSidePanel ? `drawer-side-${boringIdx++}` : `shelf-${boringIdx++}`,
          type: isDrawerSidePanel ? 'drawer-panel-connector' : 'shelf-pin',
          face: 'top',
          x: point.x,
          y: point.y,
          diameter: isDrawerSidePanel ? 3 : (isFixedPanelBoring ? 6 : 5),
          depth: isDrawerSidePanel ? panelThickness : (isFixedPanelBoring ? panelThickness : 12),
          note: isDrawerSidePanel
            ? 'drawer-panel-connector'
            : (isFixedPanelBoring ? 'fixed-panel-through' : 'movable-shelf-pin'),
        });
      });
    });
  }

  // 2) 도어 힌지컵 보링 (Ø35mm, depth=13)
  // 3) 도어 나사홀 (Ø3mm, depth=3)
  if (panel.isDoor) {
    const doorPoints = resolveOptimizerDoorBoringPoints(machiningPanel);

    doorPoints.cupPoints.forEach((point) => {
      const mprPoint = toMprDoorPoint(panel, point);
      borings.push({
        id: `hinge-cup-${boringIdx++}`,
        type: 'hinge-cup',
        face: 'top',
        x: mprPoint.x,
        y: mprPoint.y,
        diameter: 35,
        depth: 13,
      });
    });

    doorPoints.screwPoints.forEach((point) => {
      const mprPoint = toMprDoorPoint(panel, point);
      borings.push({
        id: `hinge-screw-${boringIdx++}`,
        type: 'hinge-screw',
        face: 'top',
        x: mprPoint.x,
        y: mprPoint.y,
        diameter: 3,
        depth: 3,
        note: 'door-fixing-screw',
      });
    });
  }

  // 4) 도어 피스고정/브라켓 타공 (전면 20mm, 32mm 피치): Ø3mm, depth=3
  if (panel.isBracketSide && panel.bracketBoringPositions && panel.bracketBoringPositions.length > 0) {
    const bracketXPositions = panel.bracketBoringDepthPositions || [20, 52];
    panel.bracketBoringPositions.forEach((yPos) => {
      bracketXPositions.forEach((xPos) => {
        const point = resolveManufacturingBracketPoint(machiningPanel, xPos, yPos);
        borings.push({
          id: `bracket-${boringIdx++}`,
          type: 'hinge-screw',
          face: 'top',
          x: point.x,
          y: point.y,
          diameter: 3,
          depth: 3,
          note: 'door-fixing-screw',
        });
      });
    });
  }

  // 5) 천지판/고정선반 측면 피스 유도보링: Ø5mm, depth=30
  const sideBoreDepthPositions = panel.sideBoringPositions?.length
    ? panel.sideBoringPositions
    : [];
  if (!panel.isDoor && sideBoreDepthPositions.length > 0) {
    const sideBoreDiameter = panel.sideBoringDiameter || 5;
    const sideBoreDepth = panel.sideBoringDepth || 30;
    sideBoreDepthPositions.forEach((depthPos) => {
      ([
        { face: 'left' as const, x: 0 },
        { face: 'right' as const, x: mprSize.width },
      ]).forEach(({ face, x }) => {
        borings.push({
          id: `fixed-side-${boringIdx++}`,
          type: 'shelf-pin',
          face,
          x,
          y: depthPos,
          diameter: sideBoreDiameter,
          depth: sideBoreDepth,
          note: 'fixed-panel-side-bore',
        });
      });
    });
  }

  let panelType: PanelBoringData['panelType'] = 'side-left';
  if (panel.isDoor) panelType = 'door';
  else if (panel.name?.includes('서랍') && panel.name?.includes('좌측판')) panelType = 'drawer-side-left';
  else if (panel.name?.includes('서랍') && panel.name?.includes('우측판')) panelType = 'drawer-side-right';
  else if (panel.name?.includes('우측')) panelType = 'side-right';
  else if (panel.name?.includes('상판')) panelType = 'top';
  else if (panel.name?.includes('하판') || panel.name?.includes('바닥') || panel.name?.includes('지판')) panelType = 'bottom';
  else if (panel.name?.includes('선반')) panelType = 'shelf';
  else if (panel.name?.includes('서랍')) panelType = 'drawer-front';
  else if (panel.name?.includes('뒷판') || panel.name?.includes('백패널')) panelType = 'back-panel';
  else if (isRearReinforcementPanelName(panel.name)) panelType = 'back-panel';

  return mergeManufacturingBlock({
    panelId: panel.id,
    furnitureId: panel.furnitureId || '',
    furnitureName: (panel as PlacedPanel & { furnitureName?: string }).furnitureName || '',
    panelType,
    panelName: panel.name,
    width: mprSize.width,
    height: mprSize.height,
    thickness: panelThickness,
    material: panel.material || 'PB',
    grain: panel.grain === 'HORIZONTAL' ? 'H' : panel.grain === 'VERTICAL' ? 'V' : 'N',
    borings,
    sideNotches: panel.sideNotches,
    groovePositions: panel.groovePositions,
    backPanelGroove: panel.backPanelGroove,
    manufacturingReady: panel.manufacturingReady,
    manufacturingBlockReasons: panel.manufacturingBlockReasons,
  }, unsupported);
}

/**
 * 디자인에서 산출된 실제 패널을 보링 내보내기 형식으로 변환한다.
 * quantity가 2 이상인 패널도 공장에서 각각 식별할 수 있도록 개별 패널로 펼친다.
 */
export function convertPanelsToManufacturingBoringData(
  panels: Panel[]
): PanelBoringData[] {
  return panels.flatMap(panel => {
    const quantity = panelQuantity(panel.quantity);

    return Array.from({ length: quantity }, (_, index) => {
      const instanceId = quantity > 1 ? `${panel.id}-${index + 1}` : panel.id;
      return convertPlacedPanelToMprBoringData({
        ...panel,
        id: instanceId,
        quantity: 1,
        x: 0,
        y: 0,
        rotated: false,
      });
    });
  });
}
