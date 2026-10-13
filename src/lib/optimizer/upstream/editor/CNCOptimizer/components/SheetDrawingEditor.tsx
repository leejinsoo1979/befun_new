import { useEffect, useMemo, useRef } from 'react';
import { CuttingBoardWorkspace } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/CuttingBoardWorkspace';
import type { CuttingBoardDocument } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/model';
import type { OptimizedResult } from '../types';
import type { CutSettings } from '@/lib/optimizer/upstream/types/cutlist';
import { sheetDrawing } from '../utils/sheetDrawing';
import { SheetPanelEntry } from './SheetPanelEntry';
import styles from './SheetDrawingEditor.module.css';

export function SheetDrawingEditor({ result, settings, viewTurns, onClose, onApply }: {
  result: OptimizedResult;
  settings: CutSettings;
  viewTurns: number;
  onClose: () => void;
  onApply: (board: CuttingBoardDocument) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const drawing = useMemo(() => sheetDrawing(result), [result]);
  useEffect(() => { dialog.current?.showModal?.(); }, []);
  return <dialog ref={dialog} className={styles.dialog} aria-label="원장에 패널 그리기" onCancel={event => event.preventDefault()}>
    <CuttingBoardWorkspace storageKey="cnc-sheet-drawing" initialDocument={drawing.board}
      renderPanelEntry={(board, onChange) => <SheetPanelEntry board={board} obstacles={drawing.obstacles} settings={settings} onChange={onChange} />}
      obstacles={drawing.obstacles} initialViewTurns={viewTurns} onApply={onApply} onClose={onClose} />
  </dialog>;
}
