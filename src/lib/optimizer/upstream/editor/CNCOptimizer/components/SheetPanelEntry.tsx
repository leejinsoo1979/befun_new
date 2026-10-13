import { useRef, useState } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import type { CutSettings } from '@/lib/optimizer/upstream/types/cutlist';
import type { BoardPanel, CuttingBoardDocument } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/model';
import { addSheetPanels, arrangeSheetPanels } from '../utils/sheetPanelPacking';
import styles from './SheetPanelEntry.module.css';

export function SheetPanelEntry({ board, obstacles, settings, onChange }: {
  board: CuttingBoardDocument;
  obstacles: BoardPanel[];
  settings: CutSettings;
  onChange: (board: CuttingBoardDocument) => void;
}) {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const widthInput = useRef<HTMLInputElement>(null);
  const perform = (add: boolean) => {
    setError(''); setNotice('');
    try {
      const next = add ? addSheetPanels(board, obstacles, settings, { width: Number(width), height: Number(height), quantity: Number(quantity), name })
        : arrangeSheetPanels(board, obstacles, settings);
      onChange(next);
      setNotice(add ? `${quantity}개 추가 · 총 ${next.panels.length}개 패널` : '패널 배치를 정리했습니다.');
      if (add) { widthInput.current?.focus(); widthInput.current?.select(); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : '패널을 배치하지 못했습니다.'); }
  };
  return <form className={styles.entry} aria-label="치수로 패널 추가" noValidate onSubmit={event => { event.preventDefault(); perform(true); }}>
    <h3>치수로 패널 추가 <small>mm</small></h3>
    <div className={styles.dimensions}>
      <label>가로<input ref={widthInput} aria-label="추가 패널 가로" type="number" min="1" step="0.1" placeholder="가로" value={width} onChange={e => setWidth(e.target.value)} /></label>
      <label>세로<input aria-label="추가 패널 세로" type="number" min="1" step="0.1" placeholder="세로" value={height} onChange={e => setHeight(e.target.value)} /></label>
    </div>
    <div className={styles.details}>
      <label><span>이름 <small>선택</small></span><input aria-label="추가 패널 이름" placeholder="자동 이름" value={name} onChange={e => setName(e.target.value)} /></label>
      <label>수량<input aria-label="추가 패널 수량" type="number" min="1" max="2000" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
    </div>
    <button className={styles.add} type="submit"><Plus size={16} />패널 추가</button>
    <p>추가할 때마다 현재 시트 안에 자동 배치합니다. 치수와 회전 방향은 유지됩니다.</p>
    <button className={styles.repack} type="button" disabled={!board.panels.length} onClick={() => perform(false)}><LayoutGrid size={15} />다시 최적 배치</button>
    <p>톱날 간격 {settings.kerf}mm 적용 · 기존 가구 패널과 그룹은 제자리에 유지</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {!error && notice && <p className={styles.notice} role="status">{notice}</p>}
  </form>;
}
