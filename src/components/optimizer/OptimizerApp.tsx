'use client';

import { useCallback, useState } from 'react';
import CNCOptimizerPro from '@/lib/optimizer/upstream/editor/CNCOptimizer/CNCOptimizerPro';
import { setOptimizerSpaceInfo } from '@/lib/optimizer/upstream/store/core/spaceConfigStore';
import { buildBefunShelfModel } from '@/lib/optimizer/befun/model';
import { loadDesignForOptimizer } from '@/lib/optimizer/befun/session';
import { befunColorLook } from '@/lib/optimizer/befun/colors';
import { toCncPanels, DEFAULT_CNC_PANEL_OPTIONS } from '@/lib/optimizer/befun/toCncPanels';
import { useBefunCncStore } from '@/lib/optimizer/befun/store';
import type { ConnectorReport, ConnectorSelection } from '@/lib/optimizer/connectors/apply';
import { loadConnectorSelection, saveConnectorSelection } from '@/lib/optimizer/connectors/settings';
import { ConnectorBar } from './ConnectorBar';
import './optimizer-theme.css';

/** 컨피규레이터에서 넘겨받은 디자인(cm)을 옵티마이저 판재(mm)로 스냅샷한다. 커넥터 가공도 여기서 붙인다. */
function snapshotDesign(connectors: ConnectorSelection): ConnectorReport | null {
  const design = loadDesignForOptimizer();
  const { panels, boxes, connectorReport } = toCncPanels(design, buildBefunShelfModel(design), {
    ...DEFAULT_CNC_PANEL_OPTIONS,
    connectors: connectors.body || connectors.back ? connectors : undefined,
  });
  useBefunCncStore.getState().setSnapshot(design, panels, boxes);
  const { edgeBand } = befunColorLook(design.color);
  setOptimizerSpaceInfo({
    panelThickness: panels[0]?.thickness ?? design.thickness * 10,
    // 엣지밴딩 공정은 이 색이 있을 때만 생긴다(upstream panelBanding). Classic은 합판 단면 노출이라 없음.
    materialConfig: edgeBand ? { interiorEdgeColor: edgeBand, doorEdgeColor: edgeBand } : undefined,
  });
  return connectorReport;
}

/** 진입 시 Befun 디자인을 스냅샷한 뒤 250709in 옵티마이저 화면(CNCOptimizerPro)을 띄운다. */
export default function OptimizerApp() {
  const [selection, setSelection] = useState<ConnectorSelection>(() => loadConnectorSelection());
  const [report, setReport] = useState<ConnectorReport | null>(() => snapshotDesign(loadConnectorSelection()));

  const changeSelection = useCallback((next: ConnectorSelection) => {
    saveConnectorSelection(next);
    setSelection(next);
    setReport(snapshotDesign(next));
  }, []);

  return (
    <div className="befun-optimizer" data-theme="light">
      <ConnectorBar selection={selection} report={report} onChange={changeSelection} />
      <CNCOptimizerPro />
    </div>
  );
}
