/**
 * 요소 › 도형 판(Canva 구성) — 검색, 최근 사용, 섹션별 가로 한 줄 + "모두 보기"로 펼치기.
 * 클릭하면 가운데에 추가, 끌어서 원하는 자리에 놓는다.
 */
import React, { useMemo, useState } from 'react';
import { Search, ChevronRight, ArrowLeft } from 'lucide-react';
import styles from './panels.module.css';
import {
  SHAPE_LIBRARY, SHAPE_GROUPS, findShape, loadRecentShapes, pushRecentShape,
  type ShapeDef, type ShapeGroup,
} from './shapeLibrary';

interface Props {
  closedOnly?: boolean;
  rowLimit?: number;
  onAdd: (def: ShapeDef) => void;
  onDragStart: (def: ShapeDef, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ROW_LIMIT = 5;

function ShapeThumb({ def }: { def: ShapeDef }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      {def.stroke ? (
        <path d={def.d} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={def.dash?.join(' ')} />
      ) : (
        <path d={def.d} fill="currentColor" fillRule={def.fillRule} />
      )}
    </svg>
  );
}

export const ShapeGrid: React.FC<Props> = ({ onAdd, onDragStart, closedOnly = false, rowLimit = ROW_LIMIT }) => {
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState<string[]>(() => loadRecentShapes());
  const [expanded, setExpanded] = useState<ShapeGroup | '최근에 사용함' | null>(null);

  const query = q.trim().toLowerCase();
  const matches = useMemo(
    () => SHAPE_LIBRARY.filter(s => (!closedOnly || !s.stroke) && (!query || s.label.toLowerCase().includes(query) || s.id.includes(query) || s.group.includes(query))),
    [query, closedOnly],
  );

  const add = (def: ShapeDef) => {
    setRecent(pushRecentShape(def.id));
    onAdd(def);
  };

  const card = (def: ShapeDef) => (
    <button
      key={def.id}
      type="button"
      className={`${styles.shapeTile} ${def.stroke ? styles.shapeTileLine : ''}`}
      title={def.label}
      aria-label={def.label}
      onClick={() => add(def)}
      onMouseDown={e => onDragStart(def, e)}
      draggable={false}
    >
      <ShapeThumb def={def} />
    </button>
  );

  const sections: { title: ShapeGroup | '최근에 사용함'; items: ShapeDef[] }[] = [];
  const recentItems = recent.map(findShape).filter((d): d is ShapeDef => !!d && (!closedOnly || !d.stroke));
  if (!query && recentItems.length) sections.push({ title: '최근에 사용함', items: recentItems });
  for (const g of SHAPE_GROUPS) {
    const items = matches.filter(s => s.group === g);
    if (items.length) sections.push({ title: g, items });
  }

  // 펼친 섹션: 그 묶음만 격자로
  if (expanded) {
    const sec = sections.find(s => s.title === expanded);
    return (
      <div className={styles.shapePanel}>
        <button type="button" className={styles.shapeBack} onClick={() => setExpanded(null)}>
          <ArrowLeft size={16} /> <span>{expanded}</span>
        </button>
        <div className={styles.shapeGridAll}>{(sec?.items ?? []).map(card)}</div>
      </div>
    );
  }

  return (
    <div className={styles.shapePanel}>
      <label className={styles.shapeSearch}>
        <Search size={15} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="도형 검색"
          aria-label="도형 검색"
          onKeyDown={e => e.stopPropagation()}
        />
      </label>

      {sections.map(sec => (
        <section key={sec.title} className={styles.shapeSection}>
          <div className={styles.shapeSectionHead}>
            <span className={styles.shapeSectionTitle}>{sec.title}</span>
            {sec.items.length > rowLimit && (
              <button type="button" className={styles.shapeSeeAll} onClick={() => setExpanded(sec.title)}>모두 보기</button>
            )}
          </div>
          <div className={styles.shapeRow} style={rowLimit < ROW_LIMIT ? { flexWrap: 'wrap' } : undefined}>
            {sec.items.slice(0, query ? undefined : rowLimit).map(card)}
            {!query && sec.items.length > rowLimit && (
              <button type="button" className={styles.shapeMore} title="모두 보기" aria-label={`${sec.title} 모두 보기`} onClick={() => setExpanded(sec.title)}>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </section>
      ))}
      {sections.length === 0 && <div className={styles.empty}>맞는 도형이 없습니다.</div>}
    </div>
  );
};

export default ShapeGrid;
