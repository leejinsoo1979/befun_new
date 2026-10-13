import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import type { BefunDesign } from './model';

const KEY = 'befun-optimizer-design';

/** 현재 컨피규레이터 스토어 값으로 옵티마이저 입력 디자인을 만든다. */
export function readCurrentDesign(): BefunDesign {
  const shelf = useShelfStore.getState();
  const material = useMaterialStore.getState();
  const hardware = useHardwareStore.getState();
  return {
    width: shelf.width,
    height: shelf.height,
    depth: shelf.depth,
    thickness: shelf.thickness,
    style: shelf.style,
    density: shelf.density,
    rowHeights: shelf.rowHeights,
    numRows: shelf.numRows,
    hasBackPanel: shelf.hasBackPanel,
    doorsCreatedLayers: hardware.doorsCreatedLayers,
    drawersCreatedLayers: hardware.drawersCreatedLayers,
    hardwareRowStyles: hardware.rowStyles,
    color: material.currentColor,
    colorCategory: material.colorCategory,
  };
}

/** 컨피규레이터에서 옵티마이저로 넘어가기 직전에 호출. 새로고침해도 같은 디자인을 쓰도록 탭 세션에 보관한다. */
export function saveDesignForOptimizer() {
  sessionStorage.setItem(KEY, JSON.stringify(readCurrentDesign()));
}

/** 컨피규레이터에서 넘겨받은 디자인. 없으면 현재 스토어 값(기본 디자인)을 쓴다. */
export function loadDesignForOptimizer(): BefunDesign {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as BefunDesign;
  } catch {
    // 손상된 값은 무시하고 현재 스토어 값을 쓴다
  }
  return readCurrentDesign();
}
