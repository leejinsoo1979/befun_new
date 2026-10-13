import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { StockSheet } from '@/lib/optimizer/upstream/types/cutlist';
import type { OptimizedResult } from '../types';
import { sameSheet } from '../utils/addSheet';
import styles from './AddSheetDialog.module.css';

export function AddSheetDialog({ stock, current, onAdd, onClose, busy = false }: {
  busy?: boolean;
  stock: StockSheet[];
  current?: OptimizedResult;
  onAdd: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(() => Math.max(0, stock.findIndex(item => current && !current.isOversized && sameSheet(current.stockPanel, item))));
  const [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal?.(); }, []);
  const selected = stock[index];
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="add-sheet-title" onCancel={onClose}>
    <form onSubmit={event => {
      event.preventDefault();
      if (busy) return;
      try { onAdd(index); } catch (err) { setError(err instanceof Error ? err.message : '시트를 추가하지 못했습니다.'); }
    }}>
      <header><h2 id="add-sheet-title">시트 추가</h2><button type="button" aria-label="시트 추가 닫기" onClick={onClose}><X size={18} /></button></header>
      <p>{busy ? '계산이 끝나면 시트를 추가할 수 있습니다.' : '새 원장을 추가해 빈 공간에 패널을 그릴 수 있습니다.'}</p>
      <label>원장 선택<select autoFocus value={index} onChange={event => { setIndex(Number(event.target.value)); setError(''); }}>
        {stock.map((item, i) => <option key={i} value={i}>{item.material || 'PB'} · {item.thickness ?? 18}T · {Math.min(item.width, item.length)} × {Math.max(item.width, item.length)} mm</option>)}
      </select></label>
      {selected && <div className={styles.summary}><span>{selected.material || 'PB'} · {selected.thickness ?? 18}T</span><strong>{Math.min(selected.width, selected.length)} × {Math.max(selected.width, selected.length)} mm</strong><span>빈 시트 1장</span></div>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <footer><button type="button" onClick={onClose}>취소</button><button className={styles.primary} disabled={!selected || busy}><Plus size={16} />추가</button></footer>
    </form>
  </dialog>;
}
