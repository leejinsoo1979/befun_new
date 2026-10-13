interface MachiningPanel {
  name?: string;
  width: number;
  height: number;
  rotated?: boolean;
}

export interface MachiningPoint {
  x: number;
  y: number;
}

export interface DoorMachiningPoints {
  cupPoints: MachiningPoint[];
  screwPoints: MachiningPoint[];
}

export const roundOptimizerCoord = (value: number): number => Math.round(value * 10) / 10;

export function resolveDefaultBoringDepthPositions(
  panel: Pick<MachiningPanel, 'width' | 'height'> & { thickness?: number },
  isDrawerSidePanel: boolean
): number[] {
  if (isDrawerSidePanel) {
    const sideThickness = panel.thickness || 15;
    // 컷리스트 변환 후 서랍 측판은 width=높이, height=깊이다.
    // 원장 위 rotated 여부는 원본 판재 치수를 바꾸지 않는다.
    return [sideThickness / 2, panel.height - sideThickness / 2];
  }

  return [30, panel.width / 2, Math.max(30, panel.width - 30)];
}

export const isDrawerSidePanelName = (name?: string): boolean => {
  const panelName = name || '';
  return panelName.includes('서랍') &&
    (panelName.includes('좌측판') ||
      panelName.includes('우측판') ||
      panelName.includes('좌측') ||
      panelName.includes('우측') ||
      panelName.includes('측판'));
};

export const isFurnitureSidePanelName = (name?: string): boolean => {
  const panelName = name || '';
  if (!panelName) return false;
  if (panelName.includes('서랍') || panelName.includes('도어') || panelName.includes('Door')) return false;
  if (/서라운드|커튼박스|프레임/.test(panelName)) return false;
  return panelName.includes('좌측판') ||
    panelName.includes('우측판') ||
    panelName.includes('좌측') ||
    panelName.includes('우측') ||
    panelName.includes('측판');
};

export const isFurnitureRightSidePanel = (panel: MachiningPanel): boolean => {
  const name = panel.name || '';
  return !name.includes('서랍') && (name.includes('우측판') || name.includes('우측'));
};

export const isFurnitureLeftSidePanel = (panel: MachiningPanel): boolean => {
  const name = panel.name || '';
  return !name.includes('서랍') && (name.includes('좌측판') || name.includes('좌측'));
};

export const resolveFurnitureSideDepthPosition = (panel: MachiningPanel, depthPosMm: number): number => {
  return isFurnitureRightSidePanel(panel)
    ? panel.width - depthPosMm
    : depthPosMm;
};

export function resolveOptimizerBoringPoint(
  panel: MachiningPanel,
  args: {
    boringPosMm: number;
    depthPosMm: number;
    isDrawerSidePanel: boolean;
    isDrawerFrontPanel: boolean;
  }
): MachiningPoint {
  const { boringPosMm, depthPosMm, isDrawerSidePanel, isDrawerFrontPanel } = args;

  if (isDrawerSidePanel || isDrawerFrontPanel) {
    if (panel.rotated) {
      return {
        x: roundOptimizerCoord(depthPosMm),
        y: roundOptimizerCoord(boringPosMm),
      };
    }

    return {
      x: roundOptimizerCoord(boringPosMm),
      y: roundOptimizerCoord(depthPosMm),
    };
  }

  if (isFurnitureSidePanelName(panel.name)) {
    const flippedBoringY = panel.height - boringPosMm;
    const resolvedDepthPosMm = resolveFurnitureSideDepthPosition(panel, depthPosMm);

    if (panel.rotated) {
      const scaleX = panel.height / panel.width;
      const scaleY = panel.width / panel.height;
      return {
        x: roundOptimizerCoord(resolvedDepthPosMm * scaleX),
        y: roundOptimizerCoord(flippedBoringY * scaleY),
      };
    }

    return {
      x: roundOptimizerCoord(resolvedDepthPosMm),
      y: roundOptimizerCoord(flippedBoringY),
    };
  }

  return {
    x: roundOptimizerCoord(depthPosMm),
    y: roundOptimizerCoord(boringPosMm),
  };
}

/**
 * MPR/생산 파일에 기록되는 정면 보링 좌표를 반환한다.
 *
 * 네스팅 회전은 원장 위 배치만 바꾸므로 생산 좌표에는 반영하지 않는다.
 * 가구 측판은 MPR 헤더가 높이×깊이 축을 사용하므로 옵티마이저 좌표의
 * X/Y를 전치한다.
 */
export function resolveManufacturingBoringPoint(
  panel: MachiningPanel,
  args: {
    boringPosMm: number;
    depthPosMm: number;
    isDrawerSidePanel: boolean;
    isDrawerFrontPanel: boolean;
  }
): MachiningPoint {
  const machiningPanel = panel.rotated
    ? { ...panel, rotated: false }
    : panel;
  const point = resolveOptimizerBoringPoint(machiningPanel, args);

  if (isFurnitureSidePanelName(panel.name)) {
    return {
      x: point.y,
      y: point.x,
    };
  }

  return point;
}

export function resolveOptimizerBracketPoint(
  panel: MachiningPanel,
  xPosMm: number,
  yPosMm: number
): MachiningPoint {
  const flippedY = panel.height - yPosMm;
  const resolvedDepthPosMm = resolveFurnitureSideDepthPosition(panel, xPosMm);

  if (panel.rotated) {
    const scaleX = panel.height / panel.width;
    const scaleY = panel.width / panel.height;
    return {
      x: roundOptimizerCoord(resolvedDepthPosMm * scaleX),
      y: roundOptimizerCoord(flippedY * scaleY),
    };
  }

  return {
    x: roundOptimizerCoord(resolvedDepthPosMm),
    y: roundOptimizerCoord(flippedY),
  };
}

export function resolveManufacturingBracketPoint(
  panel: MachiningPanel,
  xPosMm: number,
  yPosMm: number
): MachiningPoint {
  const machiningPanel = panel.rotated
    ? { ...panel, rotated: false }
    : panel;
  const point = resolveOptimizerBracketPoint(machiningPanel, xPosMm, yPosMm);

  if (isFurnitureSidePanelName(panel.name)) {
    return {
      x: point.y,
      y: point.x,
    };
  }

  return point;
}

export function resolveOptimizerDoorBoringPoints(
  panel: MachiningPanel & {
    boringPositions?: number[];
    boringDepthPositions?: number[];
    screwPositions?: number[];
    screwDepthPositions?: number[];
    screwHoleSpacing?: number;
    isLeftHinge?: boolean;
  }
): DoorMachiningPoints {
  const originalWidth = panel.width;
  const originalHeight = panel.height;
  const placedWidth = panel.rotated ? originalHeight : originalWidth;
  const placedHeight = panel.rotated ? originalWidth : originalHeight;
  const screwRowDistance = 9.5;
  const screwYOffset = (panel.screwHoleSpacing || 45) / 2;

  const cupYPositions = panel.boringPositions?.length
    ? panel.boringPositions
    : (() => {
      const screwPositions = [...(panel.screwPositions || [])].sort((a, b) => a - b);
      const centers: number[] = [];

      for (let i = 0; i + 1 < screwPositions.length; i += 2) {
        centers.push(roundOptimizerCoord((screwPositions[i] + screwPositions[i + 1]) / 2));
      }

      return Array.from(new Set(centers));
    })();

  const cupXPositions = panel.boringDepthPositions?.length
    ? panel.boringDepthPositions
    : (() => {
      const screwX = panel.screwDepthPositions?.[0];

      if (typeof screwX === 'number') {
        const restoredCupX = screwX < originalWidth / 2
          ? screwX - screwRowDistance
          : screwX + screwRowDistance;
        const fallbackCupX = screwX < originalWidth / 2
          ? screwX + screwRowDistance
          : screwX - screwRowDistance;
        const cupX = restoredCupX >= 0 && restoredCupX <= originalWidth
          ? restoredCupX
          : fallbackCupX;

        return [roundOptimizerCoord(Math.max(0, Math.min(originalWidth, cupX)))];
      }

      return [panel.isLeftHinge ? originalWidth - 22.5 : 22.5];
    })();

  let screwYPositions = panel.screwPositions || [];
  let screwXPositions = panel.screwDepthPositions || [];

  if (screwYPositions.length === 0 && cupYPositions.length > 0) {
    screwYPositions = cupYPositions.flatMap(cupY => [cupY - screwYOffset, cupY + screwYOffset]);
  }

  if (screwXPositions.length === 0 && cupXPositions.length > 0) {
    const cupX = cupXPositions[0];
    const isLeftHinge = cupX < originalWidth / 2;
    screwXPositions = [isLeftHinge ? cupX + screwRowDistance : cupX - screwRowDistance];
  }

  const toPoint = (posMmX: number, posMmY: number): MachiningPoint => {
    const yFromSheetTopMm = originalHeight - posMmY;

    if (panel.rotated) {
      const scaleX = placedWidth / originalWidth;
      const scaleY = placedHeight / originalHeight;
      return {
        x: roundOptimizerCoord(posMmX * scaleX),
        y: roundOptimizerCoord(yFromSheetTopMm * scaleY),
      };
    }

    return {
      x: roundOptimizerCoord(posMmX),
      y: roundOptimizerCoord(yFromSheetTopMm),
    };
  };

  return {
    cupPoints: cupXPositions.flatMap(cupX => cupYPositions.map(cupY => toPoint(cupX, cupY))),
    screwPoints: screwXPositions.flatMap(screwX => screwYPositions.map(screwY => toPoint(screwX, screwY))),
  };
}
