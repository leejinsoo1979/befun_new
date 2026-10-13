import { isFurnitureSidePanelName } from '@/lib/optimizer/upstream/utils/cnc/optimizerMachiningGeometry';

/** 섹션별 백패널 유무를 측판과 함께 판단한다. 다른 단의 백패널로 홈이 생기지 않게 한다. */
export function panelHasBackGroove(panelName: string, panels: Array<{ name?: string }>, glassCabinet = false): boolean {
  if (glassCabinet || /서랍|도어|서라운드|커튼박스/.test(panelName)) return false;
  if (!isFurnitureSidePanelName(panelName)) return false;
  const sectionPrefix = panelName.match(/^.*?\((?:\d+단|상|하)\)/)?.[0];
  const backPanels = panels.filter(panel => panel.name?.includes('백패널'));
  if (!sectionPrefix) return backPanels.length > 0;
  const sectionBackPanels = backPanels.filter(panel => /\((?:\d+단|상|하)\)/.test(panel.name!));
  // 백패널이 통판인 가구는 측판 분할과 무관하게 홈을 유지한다.
  return sectionBackPanels.length === 0 ? backPanels.length > 0 : sectionBackPanels.some(panel => panel.name!.startsWith(sectionPrefix));
}
