import type { BoringDepthGroup } from '../types';

interface ConnectionPanel {
  name?: string;
  fixedPanelFrontInsetMm?: number;
  sideBoringPositions?: number[];
  rearConnection?: { bottomMm: number; frontInsetMm: number };
}

/** 밴드의 마구리 좌표를 측판 앞 기준 좌표로 옮긴다. */
export function topBandConnectionDepths(panels: ConnectionPanel[]): number[] | undefined {
  const bands = panels.filter(panel => /상판 (?:앞|뒷)밴드$/.test(panel.name ?? '') && panel.fixedPanelFrontInsetMm !== undefined);
  return bands.length ? bands.flatMap(panel => (panel.sideBoringPositions ?? []).map(pos => panel.fixedPanelFrontInsetMm! + pos)) : undefined;
}

/** 세워진 후면 보강대는 깊이 한 열에 높이 방향 두 공으로 연결한다. */
export function rearConnectionGroups(panels: ConnectionPanel[]): BoringDepthGroup[] {
  return panels.flatMap(panel => panel.rearConnection ? (panel.sideBoringPositions ?? []).map(pos => ({
    y: panel.rearConnection!.bottomMm + pos,
    depthPositions: [panel.rearConnection!.frontInsetMm], boringType: 'fixed-panel' as const,
  })) : []);
}

export function mergeConnectionGroups(groups: BoringDepthGroup[], extra: BoringDepthGroup[]): BoringDepthGroup[] {
  const result = new Map<number, BoringDepthGroup>();
  for (const group of [...groups, ...extra]) {
    const key = Math.round(group.y * 1000) / 1000;
    const existing = result.get(key);
    result.set(key, { ...group, depthPositions: [...new Set([...(existing?.depthPositions ?? []), ...group.depthPositions])].sort((a, b) => a - b) });
  }
  return [...result.values()].sort((a, b) => a.y - b.y);
}
