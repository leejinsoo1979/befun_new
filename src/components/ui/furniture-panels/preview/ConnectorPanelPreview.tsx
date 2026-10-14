'use client';

/**
 * PREVIEW 하네스 — 접합 방식 패널. intent 값만 그대로 반영(echo)하며 방식 전환 시 다른 값을 지우지 않는다.
 * 실제 상태 전이(저장·가공 제거/보존)는 리더 소유.
 */
import { useState } from 'react';
import { FurniturePanel } from '../FurniturePanel';
import type { Values } from './familyFixtures';
import { CONNECTOR_PRESET } from './connectorFixtures';

export function ConnectorPanelPreview({ onValues }: { onValues?: (values: Values) => void }) {
  const [values, setValues] = useState<Values>(CONNECTOR_PRESET.initial);
  return (
    <section aria-label={CONNECTOR_PRESET.title} data-testid="connector-panel" style={{ width: 'min(400px, 100%)' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{CONNECTOR_PRESET.title}</h3>
      <FurniturePanel view={CONNECTOR_PRESET.view(values)}
        onIntent={(i) => {
          if (i.type !== 'set') return;
          const next = { ...values, [i.controlId]: i.value };
          setValues(next);
          onValues?.(next);
        }} />
    </section>
  );
}
