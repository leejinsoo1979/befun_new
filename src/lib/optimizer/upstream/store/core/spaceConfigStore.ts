// [Befun shim] 250709in의 spaceConfigStore(공간·가구 전체 상태) 대신, 옵티마이저가 읽는
// spaceInfo.materialConfig / spaceInfo.panelThickness만 제공한다. Befun 값은 setOptimizerSpaceInfo로 주입한다.
import { create } from 'zustand';

export interface MaterialConfig {
  interiorColor?: string;
  doorColor?: string;
  frameColor?: string;
  countertopColor?: string;
  interiorTexture?: string;
  doorTexture?: string;
  frameTexture?: string;
  countertopTexture?: string;
  interiorEdgeColor?: string;
  doorEdgeColor?: string;
  doorEdgeBandingWidthMm?: number;
  doorSpecialEdgeEnabled?: boolean;
}

export interface SpaceInfo {
  panelThickness?: number;
  materialConfig?: MaterialConfig;
}

interface SpaceConfigShimState {
  spaceInfo: SpaceInfo;
}

export const useSpaceConfigStore = create<SpaceConfigShimState>(() => ({
  spaceInfo: { panelThickness: 18, materialConfig: undefined },
}));

export function setOptimizerSpaceInfo(spaceInfo: SpaceInfo) {
  useSpaceConfigStore.setState({ spaceInfo });
}
