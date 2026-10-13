import type { Panel } from '../../../../types/cutlist';
import type { OptimizedResult } from '../../types';

export interface PanelSheetGroup {
  sheetIndex: number | null;
  result?: OptimizedResult;
  indices: number[];
}

/** 배치 결과의 복제 ID를 원본 패널에 연결하고 시트 안에서는 기존 정렬을 유지합니다. */
export function groupPanelsBySheet(
  panels: Panel[],
  sortedIndices: number[],
  results: OptimizedResult[],
  retainedSheets: ReadonlyMap<string, number | null> = new Map(),
): PanelSheetGroup[] {
  if (results.length === 0 && retainedSheets.size === 0) return [{ sheetIndex: null, indices: sortedIndices }];
  const exactIds = new Map(panels.map((panel, index) => [panel.id, index]));
  const longestIds = [...exactIds.keys()].sort((a, b) => b.length - a.length);
  const placed = new Set<number>();
  const groups: PanelSheetGroup[] = results.map((result, sheetIndex) => {
    const indices = new Set<number>();
    for (const panel of result.panels) {
      const sourceId = exactIds.has(panel.id)
        ? panel.id
        : longestIds.find(id => panel.id.startsWith(`${id}-`));
      const index = sourceId === undefined ? undefined : exactIds.get(sourceId);
      if (index !== undefined) {
        indices.add(index);
        placed.add(index);
      }
    }
    return { sheetIndex, result, indices: sortedIndices.filter(index => indices.has(index)) };
  });
  // 체크 해제한 행은 직전 시트 목록에 남겨 다시 선택할 수 있게 합니다.
  // 이 그룹은 목록 표시용이며 실제 원장 배치 결과에는 패널을 추가하지 않습니다.
  for (const index of sortedIndices) {
    const id = panels[index].id;
    if (placed.has(index) || !retainedSheets.has(id)) continue;
    const sheetIndex = retainedSheets.get(id)!;
    if (sheetIndex === null) continue;
    let group = groups.find(item => item.sheetIndex === sheetIndex);
    if (!group) {
      group = { sheetIndex, indices: [] };
      groups.push(group);
    }
    group.indices.push(index);
    placed.add(index);
  }
  const order = new Map(sortedIndices.map((index, position) => [index, position]));
  groups.sort((a, b) => a.sheetIndex! - b.sheetIndex!);
  groups.forEach(group => group.indices.sort((a, b) => order.get(a)! - order.get(b)!));
  const unplaced = sortedIndices.filter(index => !placed.has(index));
  return [...groups, ...(unplaced.length ? [{ sheetIndex: null, indices: unplaced }] : [])];
}
