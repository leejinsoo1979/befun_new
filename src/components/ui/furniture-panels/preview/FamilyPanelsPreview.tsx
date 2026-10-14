'use client';

/**
 * PREVIEW 하네스 — 제품군별 패널 profile을 나란히 렌더한다. intent는 값만 그대로 반영(echo)하며,
 * 범위 보정·조건부 노출·구조 변화는 하지 않는다(리더 상태 전이 소유).
 */
import { useState } from 'react';
import { FurniturePanel } from '../FurniturePanel';
import type { FurnitureEditIntent } from '../types';
import { FAMILY_PRESETS, type Values } from './familyFixtures';

function echo(values: Values, intent: FurnitureEditIntent): Values {
  return intent.type === 'set' ? { ...values, [intent.controlId]: intent.value } : values;
}

export function FamilyPanelsPreview({ onLog }: { onLog?: (line: string) => void }) {
  const [values, setValues] = useState<Record<string, Values>>(() => Object.fromEntries(FAMILY_PRESETS.map((p) => [p.id, p.initial])));
  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {FAMILY_PRESETS.map((p) => (
        <section key={p.id} aria-label={p.title} data-testid={`family-${p.id}`} style={{ width: 'min(400px, 100%)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{p.title}</h3>
          <FurniturePanel view={p.view(values[p.id])}
            onIntent={(i) => { onLog?.(`${p.id} ${JSON.stringify(i)}`); setValues((v) => ({ ...v, [p.id]: echo(v[p.id], i) })); }} />
        </section>
      ))}
    </div>
  );
}
