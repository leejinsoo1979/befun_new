/** Panel-to-panel connection; leg mounting hardware is a separate concern. */
export type PanelConnectorSystem = 'ovvo' | 'tylko-clip';

export const PANEL_CONNECTOR_SYSTEMS = [
  { id: 'ovvo', label: 'OVVO 방식' },
  { id: 'tylko-clip', label: 'Tylko 클립 방식' },
] as const satisfies readonly { id: PanelConnectorSystem; label: string }[];

export const CLIP_SPEC_PENDING = 'Tylko 클립의 홈·나사·배치 규격이 미확정되어 제조 가공을 생성하지 않았습니다.';
