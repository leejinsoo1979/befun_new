import type { Panel } from '@/lib/optimizer/upstream/editor/CNCOptimizer/types';
import type { CncPanelBox } from '@/lib/optimizer/befun/toCncPanels';
import { applyConnectors, type ConnectorReport, type ConnectorSelection } from './apply';
import { replaceManufacturingBlocks } from './blocks';
import { validateConnectorMachining } from './validation';

export function validateConnectorPanels(panels: Panel[], report: ConnectorReport | null) {
  for (const panel of panels) {
    const data = panel.manufacturingBoring;
    if (!data) continue;
    const issues = validateConnectorMachining(data);
    replaceManufacturingBlocks(data, 'connector-validation', issues);
    report?.warnings.push(...issues.map(issue => `${panel.name}: ${issue}`));
  }
}

/** Settings changes keep current panel IDs, edits and machining, without reimporting the design. */
export function reapplyConnectorSelection(current: Panel[], boxes: CncPanelBox[], selection: ConnectorSelection) {
  const panels = structuredClone(current);
  const report = applyConnectors(panels, boxes, selection);
  validateConnectorPanels(panels, report);
  return { panels, report };
}
