import React from 'react';
import { Ruler, Trash2 } from 'lucide-react';
import { type ManualGuides } from './manualGuides';
import styles from './GuideControls.module.css';

interface Props {
  guides: ManualGuides;
  onChange: (guides: ManualGuides) => void;
  pxPerMm?: number;
  rotated?: boolean;
}

export function GuideControls({ guides, onChange, pxPerMm = 1, rotated = false }: Props) {
  const count = guides.vertical.length + guides.horizontal.length;
  return <details className={styles.root} data-guide-control onKeyDown={e => e.stopPropagation()}>
    <summary><Ruler size={16} />가이드 {count}</summary>
    <section className={styles.menu} aria-label="가이드 관리">
      <p>가이드 끝을 선택한 뒤 Delete로 삭제할 수 있습니다.</p>
      <ul>
        {(['vertical', 'horizontal'] as const).flatMap(axis => guides[axis].map((value, index) => {
          const label = `${(axis === 'vertical') !== rotated ? '세로' : '가로'} 가이드 ${index + 1}`;
          return <li key={`${axis}-${index}`}>
            <span>{label} · {Number((value / pxPerMm).toFixed(1))} mm</span>
            <button type="button" aria-label={`${label} 삭제`} onClick={() => onChange({ ...guides, [axis]: guides[axis].filter((_, i) => i !== index) })}><Trash2 size={15} /></button>
          </li>;
        }))}
        {!count && <li>가이드가 없습니다.</li>}
      </ul>
      <button type="button" className={styles.clear} disabled={!count} onClick={() => onChange({ vertical: [], horizontal: [] })}><Trash2 size={15} />가이드 모두 삭제</button>
    </section>
  </details>;
}
