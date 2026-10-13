import { ShapeGrid } from '../canvasUx/ShapeGrid';
import { type ShapeDef, pushRecentShape } from '../canvasUx/shapeLibrary';
import { templatePanel } from './templatePanel';
import { CornerRadiusControl } from '../canvasUx/CornerRadiusControl';
import { arcPoints, profileFromPoints, validProfile } from './shapeProfile';
import { cloneCuts, cutBounds, cutsCenter, groupMembers } from './cutSelection';
import { GuideControls } from '../canvasUx/GuideControls';
import { BoardGuides } from './BoardGuides';
import { EMPTY_GUIDES, snapGuideBounds, snapGuidePoint } from '../canvasUx/manualGuides';
import React, { useEffect, useRef, useState } from 'react';
import { Pentagon, Spline, Copy, ClipboardPaste, Group, Ungroup, Circle, Scissors, Square, ArrowRight, RotateCw, Download, FolderOpen, MousePointer2, RectangleHorizontal, Redo2, Scan, Trash2, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import { boardPoint, cuttingListCsv, drawnRect, EMPTY_BOARD, fitsBoard, movedPanel, overlappingPanels, parseBoard, roundMm, rotatedPanel, viewPoint, modelPoint } from './model';
import type { BoardPanel, CuttingBoardDocument, Point } from './model';
import styles from './cuttingBoard.module.css';
import { cutPath, drawnCut, normalizeAngle, panelPath, panelPoint, panelBounds, worldPoint, rotatePoint, resizeFromHandle, snapAngle, turnPanel, validCuts, type PanelCut, type ResizeHandle } from './geometry';

import type { CuttingBoardPlacementMode } from '@/lib/optimizer/upstream/editor/CNCOptimizer/utils/cuttingBoardInput';

interface Props { initialDocument?: CuttingBoardDocument; obstacles?: BoardPanel[]; onApply?: (board: CuttingBoardDocument) => void; renderPanelEntry?: (board: CuttingBoardDocument, onChange: (board: CuttingBoardDocument) => void) => React.ReactNode; initialViewTurns?: number; templatesOpen?: boolean; onTemplatesOpenChange?: (open: boolean) => void; storageKey: string; onClose: () => void; active?: boolean; onSendToOptimizer?: (board: CuttingBoardDocument, mode: CuttingBoardPlacementMode, viewTurns: number) => void }
interface Gesture {
  kind: 'draw' | 'move' | 'resize' | 'rotate' | 'cut' | 'moveCut' | 'marquee';
  cutIds?: string[];
  panelIds?: string[];
  circlePanel?: boolean;
  cutKind?: PanelCut['kind'];
  cutId?: string;
  start: Point;
  panel: BoardPanel;
  handle?: ResizeHandle;
}

function NumberField({ label, value, onCommit, min = 0 }: {
  label: string; value: number; onCommit: (value: number) => void; min?: number;
}) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (!editing) setText(String(value)); }, [value, editing]);
  const commit = () => {
    const next = Number(text);
    if (text.trim() && Number.isFinite(next) && next >= min) onCommit(roundMm(next));
    setEditing(false); setText(String(value));
  };
  return <label className={styles.field}><span>{label}</span>
    <input aria-label={label} type="number" min={min} step="0.1" value={text}
      onFocus={e => { setEditing(true); e.currentTarget.select(); }}
      onChange={e => setText(e.target.value)} onBlur={commit}
      onKeyDown={e => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { e.preventDefault(); setText(String(value)); setEditing(false); }
      }} />
  </label>;
}

function download(contents: string, name: string, mime: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: mime }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CuttingBoardWorkspace({ storageKey, onClose, active = true, onSendToOptimizer, templatesOpen: controlledTemplatesOpen, onTemplatesOpenChange, initialDocument, obstacles = [], onApply, renderPanelEntry, initialViewTurns }: Props) {
  const [localTemplatesOpen, setLocalTemplatesOpen] = useState(false);
  const templatesOpen = controlledTemplatesOpen ?? localTemplatesOpen;
  const showTemplates = (open: boolean) => { setLocalTemplatesOpen(open); onTemplatesOpenChange?.(open); };
  const templateDrag = useRef<{ def: ShapeDef; x: number; y: number; moved: boolean; id: string } | null>(null);
  const suppressTemplateClick = useRef(false);
  const [initial] = useState(() => {
    if (initialDocument) return { doc: initialDocument, error: '' };
    try {
      const saved = localStorage.getItem(storageKey);
      return { doc: saved ? parseBoard(saved) : EMPTY_BOARD, error: '' };
    } catch { return { doc: EMPTY_BOARD, error: '저장된 컷팅보드를 읽지 못했습니다. 보드 파일을 불러오거나 새로 그려 주세요.' }; }
  });
  const [doc, setDoc] = useState<CuttingBoardDocument>(initial.doc);
  const [past, setPast] = useState<CuttingBoardDocument[]>([]);
  const [future, setFuture] = useState<CuttingBoardDocument[]>([]);
  const [preview, setPreview] = useState<BoardPanel | null>(null);
  const [selectedId, setPrimaryPanelId] = useState<string | null>(null);
  const [selectedPanelIds, setSelectedPanelIds] = useState<string[]>([]);
  const setSelectedId = (id: string | null) => { setPrimaryPanelId(id); setSelectedPanelIds(id ? groupMembers(doc.panels, [id]).length ? groupMembers(doc.panels, [id]) : [id] : []); };
  const [tool, setTool] = useState<'draw' | 'select' | 'circlePanel' | 'polygon' | 'arc' | PanelCut['kind']>('draw');
  const [selectedCutIds, setSelectedCutIds] = useState<string[]>([]);
  const selectedCutId = selectedCutIds[0] ?? null;
  const setSelectedCutId = (id: string | null) => setSelectedCutIds(id ? [id] : []);
  const [shapeTarget, setShapeTarget] = useState<'panel' | 'cut'>('panel');
  const [draft, setDraft] = useState<{ points: Point[]; panelId?: string; kind: 'polygon' | 'arc' } | null>(null);
  const [clipboard, setClipboard] = useState<PanelCut[]>([]);
  const [panelClipboard, setPanelClipboard] = useState<BoardPanel[]>([]);
  const [pastePanels, setPastePanels] = useState<BoardPanel[] | null>(null);
  const [panelGhosts, setPanelGhosts] = useState<BoardPanel[]>([]);
  const [pasteCuts, setPasteCuts] = useState<PanelCut[] | null>(null);
  const [marquee, setMarquee] = useState<{ start: Point; end: Point } | null>(null);
  const [pointer, setPointer] = useState<{ raw: Point; threshold: number; bypass: boolean } | null>(null);
  const [viewTurns, setViewTurns] = useState(initialViewTurns ?? (initial.doc.height > initial.doc.width ? 1 : 0));
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [message, setMessage] = useState(initial.error);
  const [saveError, setSaveError] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [placementMode, setPlacementMode] = useState<CuttingBoardPlacementMode>('nest');
  const [dirty, setDirty] = useState(false);
  const gesture = useRef<Gesture | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cutFieldsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedCutId) cutFieldsRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedCutId]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setSize({ width: node.clientWidth, height: node.clientHeight }));
    observer.observe(node);
    setSize({ width: node.clientWidth, height: node.clientHeight });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dirty || onApply) return;
    try { localStorage.setItem(storageKey, JSON.stringify(doc)); setSaveError(''); }
    catch { setSaveError('자동 저장에 실패했습니다. 보드 저장으로 파일을 내려받아 주세요.'); }
  }, [doc, dirty, storageKey, onApply]);

  const commit = (next: CuttingBoardDocument) => {
    if (JSON.stringify(next) === JSON.stringify(doc)) return;
    setPast(items => [...items.slice(-99), doc]); setFuture([]);
    setDoc(next); setDirty(true); setMessage('');
  };
  const cancelGesture = () => { templateDrag.current = null; gesture.current = null; setPreview(null); setPointer(null); setMarquee(null); setPasteCuts(null); setPastePanels(null); setPanelGhosts(prev => prev.length ? [] : prev); setDraft(null); };
  const undo = () => {
    cancelGesture();
    if (!past.length) return;
    setFuture(items => [doc, ...items]); setDoc(past[past.length - 1]);
    setPast(items => items.slice(0, -1)); setDirty(true); setMessage('');
  };
  const redo = () => {
    cancelGesture();
    if (!future.length) return;
    setPast(items => [...items, doc]); setDoc(future[0]);
    setFuture(items => items.slice(1)); setDirty(true); setMessage('');
  };
  const rotateSelected = () => {
    const panel = doc.panels.find(p => p.id === selectedId);
    if (!panel) return;
    const next = rotatedPanel(panel, doc);
    if (!next) { setMessage('회전한 패널이 원장 규격보다 큽니다. 보드 사이즈를 확인해 주세요.'); return; }
    cancelGesture();
    commit({ ...doc, panels: doc.panels.map(p => p.id === next.id ? next : p) });
  };
  const removeSelected = () => {
    if (!selectedId) return;
    if (selectedCutId) {
      commit({ ...doc, panels: doc.panels.map(p => p.id === selectedId ? { ...p, cuts: p.cuts?.filter(c => !selectedCutIds.includes(c.id)) } : p) });
      setSelectedCutId(null); return;
    }
    commit({ ...doc, panels: doc.panels.filter(p => !selectedPanelIds.includes(p.id)) }); setSelectedId(null);
  };

  const selectCuts = (panel: BoardPanel, id: string, additive = false) => {
    const members = groupMembers(panel.cuts || [], [id]);
    const previous = selectedId === panel.id ? selectedCutIds : [];
    const ids = additive ? previous.includes(id) ? previous.filter(i => !members.includes(i)) : [...new Set([...previous, ...members])] : members;
    setSelectedId(panel.id); setSelectedCutIds(ids); return ids;
  };
  const groupSelection = (ungroup = false) => {
    const panel = doc.panels.find(p => p.id === selectedId);
    if (!panel) return;
    if (!selectedCutIds.length) {
      if (!ungroup && selectedPanelIds.length < 2) return;
      const groupId = ungroup ? undefined : crypto.randomUUID();
      commit({ ...doc, panels: doc.panels.map(p => selectedPanelIds.includes(p.id) ? { ...p, groupId } : p) }); return;
    }
    if (!ungroup && selectedCutIds.length < 2) return;
    const groupId = ungroup ? undefined : crypto.randomUUID();
    commit({ ...doc, panels: doc.panels.map(p => p.id === panel.id ? { ...p, cuts: p.cuts?.map(c => selectedCutIds.includes(c.id) ? { ...c, groupId } : c) } : p) });
  };
  const copySelection = () => {
    const cuts = doc.panels.find(p => p.id === selectedId)?.cuts?.filter(c => selectedCutIds.includes(c.id));
    if (cuts?.length) { setPanelClipboard([]); setClipboard(cuts.map(c => ({ ...c }))); setMessage(`${cuts.length}개 가공을 복사했습니다.`); }
    else {
      const panels = doc.panels.filter(p => selectedPanelIds.includes(p.id));
      if (panels.length) { setClipboard([]); setPanelClipboard(panels.map(p => ({ ...p }))); setMessage(`${panels.length}개 패널을 복사했습니다.`); }
    }
  };
  const beginPaste = () => {
    if (panelClipboard.length) {
      cancelGesture();
      const groups = new Map<string, string>();
      setPastePanels(panelClipboard.map(p => {
        if (p.groupId && !groups.has(p.groupId)) groups.set(p.groupId, crypto.randomUUID());
        return { ...p, id: crypto.randomUUID(), name: `${p.name} 복사`, cuts: p.cuts ? cloneCuts(p.cuts) : undefined, groupId: p.groupId ? groups.get(p.groupId) : undefined };
      }));
      setTool('select'); setMessage('원장 위 붙여넣을 위치를 클릭하세요. Esc로 취소합니다.'); return;
    }
    if (!clipboard.length) return;
    cancelGesture(); setPasteCuts(cloneCuts(clipboard)); setTool('select');
    setMessage('붙여넣을 패널 위에서 위치를 정하고 클릭하세요. Esc로 취소합니다.');
  };

  useEffect(() => {
    const modifier = (e: KeyboardEvent) => { if (e.key === 'Control' || e.key === 'Meta') setPointer(p => p ? { ...p, bypass: e.ctrlKey || e.metaKey } : null); };
    window.addEventListener('keydown', modifier); window.addEventListener('keyup', modifier);
    return () => { window.removeEventListener('keydown', modifier); window.removeEventListener('keyup', modifier); };
  }, []);
  useEffect(() => {
    if (!active) { cancelGesture(); return; }
    const keydown = (e: KeyboardEvent) => {
      if (exportOpen) { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); setExportOpen(false); } return; }
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"], [data-guide-control]')) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (key === 'enter' && draft?.kind === 'polygon') { e.preventDefault(); e.stopImmediatePropagation(); finishShape(draft); }
      else if (mod && ['c', 'v', 'g', 'a'].includes(key)) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (key === 'c') copySelection();
        if (key === 'v') beginPaste();
        if (key === 'g') groupSelection(e.shiftKey);
        if (key === 'a') { setSelectedCutIds(doc.panels.find(p => p.id === selectedId)?.cuts?.map(c => c.id) || []); setTool('select'); }
      }
      else if (mod && key === 'z') { e.preventDefault(); e.stopImmediatePropagation(); if (e.shiftKey) redo(); else undo(); }
      else if (mod && key === 'y') { e.preventDefault(); e.stopImmediatePropagation(); redo(); }
      else if (!mod && key === 'r') { e.preventDefault(); e.stopImmediatePropagation(); rotateSelected(); }
      else if (!mod && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && selectedId && selectedCutId) {
        e.preventDefault(); e.stopImmediatePropagation();
        const panel = doc.panels.find(p => p.id === selectedId);
        if (!panel) return;
        const step = e.shiftKey ? 10 : 1;
        const delta = rotatePoint({ x: e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0,
          y: e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0 }, -((panel.rotation || 0) + viewTurns * 90));
        const next = { ...panel, cuts: panel.cuts?.map(c => selectedCutIds.includes(c.id) ? { ...c,
          x: roundMm(c.x + delta.x), y: roundMm(c.y + delta.y) } : c) };
        if (fitsBoard(next, doc)) commit({ ...doc, panels: doc.panels.map(p => p.id === next.id ? next : p) });
      }
      else if (key === 'delete' || key === 'backspace') { e.preventDefault(); e.stopImmediatePropagation(); removeSelected(); }
      else if (key === 'escape') { e.stopImmediatePropagation(); cancelGesture(); setSelectedId(null); setSelectedCutId(null); setTool('select'); }
    };
    window.addEventListener('keydown', keydown, true);
    return () => window.removeEventListener('keydown', keydown, true);
  });

  const panels = panelGhosts.length ? [...doc.panels, ...panelGhosts] : preview
    ? doc.panels.some(p => p.id === preview.id) ? doc.panels.map(p => {
      if (p.id === preview.id) return preview;
      const g = gesture.current;
      return g?.kind === 'move' && g.panelIds?.includes(p.id) ? { ...p, x: p.x + preview.x - g.panel.x, y: p.y + preview.y - g.panel.y } : p;
    }) : [...doc.panels, preview] : doc.panels;
  const selected = panels.find(p => p.id === selectedId);
  const selectedPanels = doc.panels.filter(p => selectedPanelIds.includes(p.id));
  const selectedCuts = selected?.cuts?.filter(c => selectedCutIds.includes(c.id)) || [];
  const selectedCut = selectedCuts.length === 1 ? selectedCuts[0] : undefined;
  const overlaps = overlappingPanels([...obstacles, ...panels]);
  const viewWidth = viewTurns % 2 ? doc.height : doc.width;
  const viewHeight = viewTurns % 2 ? doc.width : doc.height;
  const fit = Math.max(0.01, Math.min((size.width - 112) / viewWidth, (size.height - 112) / viewHeight));
  const scale = fit * zoom;
  const margin = 48 / scale;
  const fontSize = 12 / scale;
  const stroke = 1 / scale;

  const point = (e: React.PointerEvent<SVGSVGElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    // CSS zoom과 브라우저 배율도 포함된 실제 화면 크기를 기준으로 mm를 환산한다.
    return modelPoint({ x: (e.clientX - rect.left) * (viewWidth + margin * 2) / rect.width - margin,
      y: (e.clientY - rect.top) * (viewHeight + margin * 2) / rect.height - margin }, doc, viewTurns);
  };
  const templateAt = (def: ShapeDef, id: string, center: Point): BoardPanel => {
    const p = templatePanel(def, Math.min(300, doc.width * 0.6, doc.height * 0.6), id);
    return { ...p, x: center.x - p.width / 2, y: center.y - p.height / 2, rotation: normalizeAngle(-viewTurns * 90) };
  };
  const placeTemplate = (panel: BoardPanel) => {
    if (doc.panels.length >= 2000) { setMessage('보드 한 장에는 패널을 최대 2000개까지 그릴 수 있습니다.'); return; }
    if (!fitsBoard(panel, doc)) { setMessage('도형이 원장 밖에 있습니다. 원장 안에 놓아 주세요.'); return; }
    commit({ ...doc, panels: [...doc.panels, panel] });
    setPrimaryPanelId(panel.id); setSelectedPanelIds([panel.id]); setSelectedCutId(null); setTool('select');
  };
  const addTemplate = (def: ShapeDef) => {
    if (suppressTemplateClick.current) { suppressTemplateClick.current = false; return; }
    cancelGesture();
    placeTemplate(templateAt(def, crypto.randomUUID(), { x: doc.width / 2, y: doc.height / 2 }));
  };
  useEffect(() => {
    if (!active) return;
    const fromMouse = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const p = point({ currentTarget: svg, clientX: e.clientX, clientY: e.clientY } as React.PointerEvent<SVGSVGElement>);
      if (p.x < 0 || p.y < 0 || p.x > doc.width || p.y > doc.height) return null;
      return e.ctrlKey || e.metaKey ? p : snapGuidePoint(p, doc.guides ?? EMPTY_GUIDES, 8 * (viewWidth + margin * 2) / svg.getBoundingClientRect().width);
    };
    const move = (e: MouseEvent) => {
      const drag = templateDrag.current;
      if (!drag || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 4 && !drag.moved) return;
      drag.moved = true; suppressTemplateClick.current = true;
      const p = fromMouse(e);
      setPanelGhosts(p ? [templateAt(drag.def, drag.id, p)] : []);
      setPointer(p ? { raw: p, threshold: 0.001, bypass: e.ctrlKey || e.metaKey } : null);
    };
    const up = (e: MouseEvent) => {
      const drag = templateDrag.current;
      if (!drag) return;
      const p = fromMouse(e);
      if (drag.moved && p) { placeTemplate(templateAt(drag.def, drag.id, p)); pushRecentShape(drag.def.id); }
      templateDrag.current = null; setPanelGhosts([]); setPointer(null);
      setTimeout(() => { suppressTemplateClick.current = false; }, 0);
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  });
  const pointerSnap = pointer && !pointer.bypass ? snapGuidePoint(pointer.raw, doc.guides ?? EMPTY_GUIDES, pointer.threshold) : pointer?.raw;
  const snappedX = !!pointerSnap && !pointer?.bypass && !!doc.guides?.vertical.includes(pointerSnap.x);
  const snappedY = !!pointerSnap && !pointer?.bypass && !!doc.guides?.horizontal.includes(pointerSnap.y);
  const snapCursor = active && !exportOpen && pointerSnap && (snappedX || snappedY) ? viewPoint(pointerSnap, doc, viewTurns) : null;
  const snapPoint = (e: React.PointerEvent<SVGSVGElement>) => e.ctrlKey || e.metaKey ? point(e) : snapGuidePoint(point(e), doc.guides ?? EMPTY_GUIDES, 8 * (viewWidth + margin * 2) / e.currentTarget.getBoundingClientRect().width);
  const trackPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    const drawing = pastePanels || pasteCuts || gesture.current?.kind === 'cut' || gesture.current?.kind === 'draw' || (!gesture.current && tool !== 'select' && !target.closest('[data-cut-id], [data-corner], [data-rotate]'));
    const raw = point(e);
    if (!drawing || target.closest('[data-board-guides]') || raw.x < 0 || raw.y < 0 || raw.x > doc.width || raw.y > doc.height) { setPointer(null); return; }
    setPointer({ raw, threshold: 8 * (viewWidth + margin * 2) / e.currentTarget.getBoundingClientRect().width, bypass: e.ctrlKey || e.metaKey });
  };
  const pasteAt = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pasteCuts) return null;
    const id = (e.target as Element).closest('[data-panel-id]')?.getAttribute('data-panel-id');
    const panel = doc.panels.find(p => p.id === id) || doc.panels.find(p => p.id === selectedId);
    if (!panel) return null;
    const p = panelPoint(snapPoint(e), panel), center = cutsCenter(pasteCuts);
    return { ...panel, cuts: [...(panel.cuts || []), ...pasteCuts.map(c => ({ ...c, x: roundMm(c.x + p.x - center.x), y: roundMm(c.y + p.y - center.y) }))] };
  };
  const pastedPanelsAt = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pastePanels) return [];
    const bounds = pastePanels.map(panelBounds), p = snapPoint(e);
    const cx = (Math.min(...bounds.map(b => b.x)) + Math.max(...bounds.map(b => b.x + b.width))) / 2;
    const cy = (Math.min(...bounds.map(b => b.y)) + Math.max(...bounds.map(b => b.y + b.height))) / 2;
    return pastePanels.map(panel => ({ ...panel, x: panel.x + p.x - cx, y: panel.y + p.y - cy }));
  };
  const selectPanel = (panel: BoardPanel, additive = false) => {
    const members = groupMembers(doc.panels, [panel.id]);
    const ids = additive ? selectedPanelIds.includes(panel.id) ? selectedPanelIds.filter(id => !members.includes(id)) : [...new Set([...selectedPanelIds, ...members])] : members;
    setPrimaryPanelId(ids.includes(panel.id) ? panel.id : ids[0] || null); setSelectedPanelIds(ids); setSelectedCutId(null); setTool('select');
  };
  const pointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 || gesture.current) return;
    if (pastePanels) {
      const next = pastedPanelsAt(e);
      if (next.length && doc.panels.length + next.length <= 2000 && next.every(p => fitsBoard(p, doc))) {
        commit({ ...doc, panels: [...doc.panels, ...next] });
        setPrimaryPanelId(next[0].id); setSelectedPanelIds(next.map(p => p.id)); setSelectedCutId(null); cancelGesture();
      } else setMessage(doc.panels.length + next.length > 2000 ? '보드 한 장에는 패널을 최대 2000개까지 그릴 수 있습니다.' : '패널이 원장 밖에 있습니다. 다른 위치를 클릭하세요.');
      e.preventDefault(); return;
    }
    if (pasteCuts) {
      const next = pasteAt(e);
      if (next && fitsBoard(next, doc)) {
        commit({ ...doc, panels: doc.panels.map(p => p.id === next.id ? next : p) });
        setSelectedId(next.id); setSelectedCutIds(pasteCuts.map(c => c.id)); cancelGesture();
      } else setMessage('가공이 겹치거나 패널 밖에 있습니다. 다른 위치를 클릭하세요.');
      e.preventDefault(); return;
    }
    const start = point(e);
    const snappedStart = snapPoint(e);
    if (tool === 'polygon' || tool === 'arc') {
      const clickedId = (e.target as Element).closest('[data-panel-id]')?.getAttribute('data-panel-id') || selectedId;
      if (shapeTarget === 'cut' && !draft && !clickedId) { setMessage('가공할 패널을 먼저 선택하세요.'); return; }
      const current = draft || { points: [], kind: tool, ...(shapeTarget === 'cut' ? { panelId: clickedId! } : {}) };
      if (tool === 'polygon' && current.points.length >= 3 && Math.hypot(start.x - current.points[0].x, start.y - current.points[0].y) <= 8 / scale) { finishShape(current); e.preventDefault(); return; }
      if (current.points.length >= 128) return;
      const last = current.points[current.points.length - 1];
      if (last && Math.hypot(last.x - snappedStart.x, last.y - snappedStart.y) < 0.1) return;
      const next = { ...current, points: [...current.points, snappedStart] };
      if (tool === 'arc' && next.points.length === 3) finishShape(next); else setDraft(next);
      e.preventDefault(); return;
    }
    const target = e.target as SVGElement;
    const id = target.closest('[data-panel-id]')?.getAttribute('data-panel-id');
    const panel = tool === 'circlePanel' ? undefined : doc.panels.find(p => p.id === id) || (tool === 'notch' ? doc.panels.find(p => p.id === selectedId) : undefined);
    const corner = target.closest('[data-corner]')?.getAttribute('data-corner') as ResizeHandle | null;
    if (panel) {
      if (e.shiftKey && tool === 'select' && !panel.cuts?.length) { selectPanel(panel, true); e.preventDefault(); return; }
      const movingPanelIds = selectedPanelIds.includes(panel.id) ? selectedPanelIds : groupMembers(doc.panels, [panel.id]);
      setPrimaryPanelId(panel.id); setSelectedPanelIds(movingPanelIds);
      const cutId = target.closest('[data-cut-id]')?.getAttribute('data-cut-id');
      if (target.closest('[data-rotate]')) {
        setSelectedCutId(null); gesture.current = { kind: 'rotate', start, panel };
      } else if (corner) {
        setSelectedCutId(null);
        gesture.current = { kind: 'resize', start, panel, handle: corner };
      } else if (cutId) {
        const ids = e.shiftKey || !selectedCutIds.includes(cutId) || selectedId !== panel.id ? selectCuts(panel, cutId, e.shiftKey) : selectedCutIds;
        if (e.shiftKey) { e.preventDefault(); return; }
        gesture.current = { kind: 'moveCut', start: panelPoint(start, panel), panel, cutId, cutIds: ids };
      } else if (e.shiftKey && tool === 'select') {
        gesture.current = { kind: 'marquee', start, panel }; setMarquee({ start, end: start });
      } else if (tool === 'circle' || tool === 'rectangle' || tool === 'notch') {
        if ((panel.cuts?.length || 0) >= 500) { setMessage('패널 한 장의 가공은 최대 500개입니다.'); return; }
        const cutId = crypto.randomUUID();
        setSelectedCutId(cutId);
        gesture.current = { kind: 'cut', start: panelPoint(snappedStart, panel), panel, cutKind: tool, cutId };
      } else {
        setSelectedCutId(null); gesture.current = { kind: 'move', start, panel, panelIds: movingPanelIds };
      }
    } else if ((tool === 'draw' || tool === 'circlePanel') && start.x >= 0 && start.y >= 0 && start.x <= doc.width && start.y <= doc.height) {
      if (doc.panels.length >= 2000) { setMessage('보드 한 장에는 패널을 최대 2000개까지 그릴 수 있습니다.'); return; }
      const p: BoardPanel = { id: crypto.randomUUID(), name: `패널 ${doc.panels.length + 1}`, ...boardPoint(snappedStart, doc), width: 0, height: 0 };
      gesture.current = { kind: 'draw', start: snappedStart, panel: p, circlePanel: tool === 'circlePanel' }; setSelectedId(p.id); setSelectedCutId(null); setPreview(p);
    } else { setSelectedId(null); return; }
    e.preventDefault(); e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId);
  };
  const gesturePanel = (e: React.PointerEvent<SVGSVGElement>): BoardPanel | null => {
    const g = gesture.current;
    if (!g) return null;
    const raw = point(e);
    const guides = e.ctrlKey || e.metaKey ? EMPTY_GUIDES : doc.guides ?? EMPTY_GUIDES;
    const end = snapPoint(e);
    if (g.kind === 'marquee') { setMarquee({ start: g.start, end: raw }); return null; }
    if (g.kind === 'move') {
      const next = movedPanel(g.panel, { x: raw.x - g.start.x, y: raw.y - g.start.y }, doc);
      const snapped = movedPanel(next, snapGuideBounds(panelBounds(next), guides, 8 / scale), doc);
      const bounds = doc.panels.filter(p => g.panelIds?.includes(p.id)).map(panelBounds);
      if (bounds.length < 2) return snapped;
      const dx = Math.max(-Math.min(...bounds.map(b => b.x)), Math.min(doc.width - Math.max(...bounds.map(b => b.x + b.width)), snapped.x - g.panel.x));
      const dy = Math.max(-Math.min(...bounds.map(b => b.y)), Math.min(doc.height - Math.max(...bounds.map(b => b.y + b.height)), snapped.y - g.panel.y));
      return { ...g.panel, x: g.panel.x + dx, y: g.panel.y + dy };
    }
    if (g.kind === 'rotate') {
      const center = { x: g.panel.x + g.panel.width / 2, y: g.panel.y + g.panel.height / 2 };
      const angle = (Math.atan2(end.y - center.y, end.x - center.x) - Math.atan2(g.start.y - center.y, g.start.x - center.x)) * 180 / Math.PI;
      return { ...g.panel, rotation: snapAngle((g.panel.rotation || 0) + angle) };
    }
    if (g.kind === 'cut') {
      const cut = drawnCut(g.cutKind!, g.cutId!, g.start, panelPoint(end, g.panel), g.panel);
      return { ...g.panel, cuts: [...(g.panel.cuts || []), cut] };
    }
    if (g.kind === 'moveCut') {
      let local = panelPoint(raw, g.panel);
      const cut = g.panel.cuts?.find(c => c.id === g.cutId);
      if (cut) {
        const center = { x: cut.x + (cut.kind === 'circle' ? 0 : cut.width / 2) + local.x - g.start.x, y: cut.y + (cut.kind === 'circle' ? 0 : cut.height / 2) + local.y - g.start.y };
        const snapped = panelPoint(snapGuidePoint(worldPoint(center, g.panel), guides, 8 / scale), g.panel);
        local = { x: local.x + snapped.x - center.x, y: local.y + snapped.y - center.y };
      }
      return { ...g.panel, cuts: g.panel.cuts?.map(c => (g.cutIds || [g.cutId]).includes(c.id)
        ? { ...c, x: roundMm(c.x + local.x - g.start.x), y: roundMm(c.y + local.y - g.start.y) } : c) };
    }
    if (g.kind === 'resize') return resizeFromHandle(g.panel, g.handle!, g.start, end, e.shiftKey);
    if (g.circlePanel) {
      const radius = roundMm(Math.hypot(end.x - g.start.x, end.y - g.start.y));
      return { ...g.panel, x: g.start.x - radius, y: g.start.y - radius, width: radius * 2, height: radius * 2, profile: { kind: 'circle' } };
    }
    return { ...g.panel, ...drawnRect(g.start, end, doc) };
  };

  const pointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (gesture.current?.kind === 'marquee') {
      const g = gesture.current, end = point(e);
      const a = viewPoint(g.start, doc, viewTurns), b = viewPoint(end, doc, viewTurns);
      const inside = (p: Point) => p.x >= Math.min(a.x, b.x) && p.x <= Math.max(a.x, b.x) && p.y >= Math.min(a.y, b.y) && p.y <= Math.max(a.y, b.y);
      const ids = (g.panel.cuts || []).filter(c => { const r = cutBounds(c); return [{ x: r.x, y: r.y }, { x: r.x + r.width, y: r.y }, { x: r.x, y: r.y + r.height }, { x: r.x + r.width, y: r.y + r.height }].every(p => inside(viewPoint(worldPoint(p, g.panel), doc, viewTurns))); }).map(c => c.id);
      setSelectedCutIds(groupMembers(g.panel.cuts || [], [...selectedCutIds, ...ids])); cancelGesture();
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }
    let next = gesturePanel(e);
    if (!next) return;
    if (gesture.current?.kind === 'rotate') {
      // 드래그 중에는 중심을 고정하고, 놓을 때만 원장 안쪽으로 보정한다.
      next = turnPanel(next, next.rotation || 0, doc);
      if (!next) {
        setMessage('회전한 패널이 원장 규격보다 커서 적용할 수 없습니다.');
        cancelGesture();
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        return;
      }
    }
    if (fitsBoard(next, doc)) {
      const committed = next;
      commit({ ...doc, panels: gesture.current?.kind === 'draw' ? [...doc.panels, committed] : doc.panels.map(p => {
        if (p.id === committed.id) return committed;
        const g = gesture.current;
        return g?.kind === 'move' && g.panelIds?.includes(p.id) ? { ...p, x: p.x + committed.x - g.panel.x, y: p.y + committed.y - g.panel.y } : p;
      }) });
      if (gesture.current?.kind === 'draw') setTool('select');
    } else { setMessage('적용할 수 없습니다. 구멍은 패널 내부에, 따내기는 가장자리에 그려 주세요. 가공끼리 겹치거나 패널을 분리할 수 없습니다.'); }
    cancelGesture();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const finishShape = (shape: NonNullable<typeof draft>) => {
    const points = shape.kind === 'arc' ? arcPoints(shape.points[0], shape.points[1], shape.points[2]) : shape.points;
    if (points.length < 3) { setMessage('면을 만들려면 일직선이 아닌 점을 지정하세요.'); return; }
    const panel = doc.panels.find(p => p.id === shape.panelId);
    const bounds = profileFromPoints(panel ? points.map(p => panelPoint(p, panel)) : points, shape.kind);
    if (!validProfile(bounds.profile) || bounds.width < 1 || bounds.height < 1) { setMessage('자기 교차 없이 닫힌 도형을 그려 주세요.'); return; }
    if (panel) {
      const touches = bounds.x <= 0.05 || bounds.y <= 0.05 || bounds.x + bounds.width >= panel.width - 0.05 || bounds.y + bounds.height >= panel.height - 0.05;
      const cut: PanelCut = { ...bounds, id: crypto.randomUUID(), kind: touches ? 'notch' : 'rectangle' };
      const next = { ...panel, cuts: [...(panel.cuts || []), cut] };
      if (!fitsBoard(next, doc)) { setMessage('패널 경계와 기존 가공을 확인하세요. 도형은 겹치지 않아야 합니다.'); return; }
      commit({ ...doc, panels: doc.panels.map(p => p.id === next.id ? next : p) }); setSelectedId(next.id); setSelectedCutId(cut.id);
    } else {
      if (doc.panels.length >= 2000) { setMessage('보드 한 장에는 패널을 최대 2000개까지 그릴 수 있습니다.'); return; }
      const next: BoardPanel = { ...bounds, id: crypto.randomUUID(), name: `패널 ${doc.panels.length + 1}` };
      if (!fitsBoard(next, doc)) { setMessage('도형을 원장 안에 그려 주세요.'); return; }
      commit({ ...doc, panels: [...doc.panels, next] }); setSelectedId(next.id); setSelectedCutId(null);
    }
    cancelGesture(); setTool('select');
  };
  const updateBoard = (patch: Partial<CuttingBoardDocument>) => {
    const next = { ...doc, ...patch };
    if (next.guides) next.guides = { vertical: next.guides.vertical.filter(x => x <= next.width), horizontal: next.guides.horizontal.filter(y => y <= next.height) };
    if (next.panels.some(p => !fitsBoard(p, next))) { setMessage('패널이 보드 밖으로 나갑니다. 패널 크기나 위치를 먼저 조정해 주세요.'); return; }
    commit(next);
  };
  const updatePanel = (patch: Partial<BoardPanel>) => {
    if (!selected) return;
    const next = { ...selected, ...patch };
    if (!validCuts(next)) { setMessage('가공 위치와 크기를 확인해 주세요. 구멍은 패널 내부에, 따내기는 가장자리에 있어야 합니다.'); return; }
    if (!fitsBoard(next, doc)) { setMessage('패널은 보드 안에 있어야 합니다. 위치와 크기를 확인해 주세요.'); return; }
    commit({ ...doc, panels: doc.panels.map(p => p.id === next.id ? next : p) });
  };

  const updateCut = (patch: Partial<PanelCut>) => {
    if (!selected || !selectedCut) return;
    updatePanel({ cuts: selected.cuts?.map(c => c.id === selectedCut.id ? { ...c, ...patch } as PanelCut : c) });
  };
  const chooseTool = (next: typeof tool) => { cancelGesture(); setTool(next); setSelectedCutId(null); setMessage(''); };

  return <section className={styles.workspace} style={active ? undefined : { display: 'none' }} aria-label="컷팅보드 편집기">
    {exportOpen && <div className={styles.exportBackdrop} onPointerDown={e => e.stopPropagation()}>
      <div className={styles.exportDialog} role="dialog" aria-modal="true" aria-label="옵티마이저 배치 방식" onKeyDown={e => {
        if (e.key !== 'Tab') return;
        const items = Array.from(e.currentTarget.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button'));
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }}>
        <h3>패널을 어떻게 배치할까요?</h3>
        <label><input type="radio" name="placement-mode" checked={placementMode === 'preserve'} onChange={() => setPlacementMode('preserve')} />그린 위치 유지</label>
        <p>원장 위 위치와 회전 각도를 그대로 가져갑니다.</p>
        <label><input autoFocus type="radio" name="placement-mode" checked={placementMode === 'nest'} onChange={() => setPlacementMode('nest')} />자동 네스팅</label>
        <p>패널 치수와 가공 형상을 유지하고 위치를 최적화합니다.</p>
        <div><button onClick={() => setExportOpen(false)}>취소</button><button className={styles.primary} onClick={() => {
          try { onSendToOptimizer?.(doc, placementMode, viewTurns); setExportOpen(false); }
          catch (error) { setMessage(error instanceof Error ? error.message : '옵티마이저로 보내지 못했습니다.'); setExportOpen(false); }
        }}>내보내기</button></div>
      </div>
    </div>}
    <div className={styles.toolbar}>
      <strong>{onApply ? '원장에 패널 그리기' : '컷팅보드'}</strong>
      {onApply ? <span>{doc.width} × {doc.height} mm · {doc.material} {doc.thickness}T</span> : <div className={styles.boardSize}>
        <span>보드 사이즈</span>
        <NumberField label="보드 가로" value={doc.width} min={1} onCommit={width => updateBoard({ width })} />
        <span>×</span>
        <NumberField label="보드 세로" value={doc.height} min={1} onCommit={height => updateBoard({ height })} />
        <span>mm</span>
      </div>}
      <div className={styles.actions}>
        <button title="실행취소" aria-label="컷팅보드 실행취소" disabled={!past.length} onClick={undo}><Undo2 size={17} /></button>
        <button title="다시 실행" aria-label="컷팅보드 다시 실행" disabled={!future.length} onClick={redo}><Redo2 size={17} /></button>
        {!onApply && <button onClick={() => fileRef.current?.click()}><FolderOpen size={16} />불러오기</button>}
        {!onApply && <button onClick={() => download(JSON.stringify(doc, null, 2), '컷팅보드.json', 'application/json')}><Download size={16} />보드 저장</button>}
        {!onApply && <button className={styles.primary} disabled={!doc.panels.length} onClick={() => download(cuttingListCsv(doc), '컷팅리스트.csv', 'text/csv;charset=utf-8')}><Download size={16} />컷팅리스트</button>}
        {onSendToOptimizer && <button className={styles.primary} disabled={!doc.panels.length} onClick={() => { cancelGesture(); setExportOpen(true); }}>옵티마이저로 보내기<ArrowRight size={16} /></button>}
        {onApply && <button className={styles.primary} onClick={() => { cancelGesture(); try { onApply(doc); } catch (error) { setMessage(error instanceof Error ? error.message : '패널을 적용하지 못했습니다.'); } }}>원장에 적용<ArrowRight size={16} /></button>}
        <button onClick={onClose}>{onApply ? '취소' : '나가기'}</button>
      </div>
      <input ref={fileRef} type="file" accept=".json,application/json" hidden aria-label="컷팅보드 파일" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = '';
        if (!file) return;
        try {
          const loaded = parseBoard(await file.text());
          cancelGesture(); commit(loaded); setSelectedId(null); setZoom(1);
        } catch { setMessage('파일을 읽지 못했습니다. 컷팅보드에서 저장한 JSON 파일을 선택해 주세요.'); }
      }} />
    </div>
    <div className={styles.body}>
      <aside className={styles.inspector}>
        {renderPanelEntry?.(doc, next => {
          cancelGesture(); commit(next); setSelectedId(null); setSelectedCutId(null); setTool('select');
        })}
        {templatesOpen ? <div className={`${styles.section} ${styles.templatePanel}`}>
          <h3>요소 · 도형<button onClick={() => showTemplates(false)}>패널 편집</button></h3>
          <p className={styles.help}>클릭하면 원장 중앙에 추가합니다. 끌어서 원하는 위치에 놓을 수도 있습니다.</p>
          <ShapeGrid closedOnly rowLimit={3} onAdd={addTemplate} onDragStart={(def, e) => {
            if (e.button !== 0) return;
            cancelGesture(); suppressTemplateClick.current = false;
            templateDrag.current = { def, x: e.clientX, y: e.clientY, moved: false, id: crypto.randomUUID() };
          }} />
        </div> : <>
        <div className={styles.section}><button onClick={() => showTemplates(true)}><Pentagon size={16} />도형 템플릿</button></div>
        <div className={styles.section}>
          <h3>보드 규격 <small>mm</small></h3>
          <p className={styles.boardSummary}>{doc.width} × {doc.height}</p>
          {onApply ? <p className={styles.help}>{doc.material} · {doc.thickness}T<br />기존 패널은 회색으로 표시됩니다. 빈 공간에 패널을 그려 주세요.</p> : <><label className={styles.field}><span>재질</span><select aria-label="보드 재질" value={doc.material || 'PB'} onChange={e => updateBoard({ material: e.target.value })}>
            {['PB', 'MDF', 'PET', '인조대리석'].map(material => <option key={material}>{material}</option>)}
          </select></label>
          <NumberField label="두께" value={doc.thickness} min={1} onCommit={thickness => updateBoard({ thickness })} /></>}
        </div>
        <div className={styles.section}>
          <h3>패널 그리기</h3>
          <div className={styles.toolButtons}>
            <button aria-pressed={tool === 'draw'} onClick={() => chooseTool('draw')}><RectangleHorizontal size={17} />패널 그리기</button>
            <button aria-pressed={tool === 'select'} onClick={() => chooseTool('select')}><MousePointer2 size={17} />선택</button>
          </div>
          <div className={styles.toolButtons}>
            <button aria-pressed={tool === 'circlePanel'} onClick={() => chooseTool('circlePanel')}><Circle size={16} />원형 패널</button>
            <button aria-pressed={tool === 'polygon'} onClick={() => chooseTool('polygon')}><Pentagon size={16} />다각형</button>
            <button aria-pressed={tool === 'arc'} onClick={() => chooseTool('arc')}><Spline size={16} />아크</button>
          </div>
          {(tool === 'polygon' || tool === 'arc') && <div className={styles.toolButtons}>
            <button aria-pressed={shapeTarget === 'panel'} onClick={() => { cancelGesture(); setShapeTarget('panel'); }}>패널 외곽</button>
            <button aria-pressed={shapeTarget === 'cut'} onClick={() => { cancelGesture(); setShapeTarget('cut'); }}>구멍·따내기</button>
          </div>}
          <div className={styles.toolButtons}>
            <button aria-pressed={tool === 'circle'} onClick={() => chooseTool('circle')}><Circle size={16} />원형 구멍</button>
            <button aria-pressed={tool === 'rectangle'} onClick={() => chooseTool('rectangle')}><Square size={16} />사각 구멍</button>
            <button aria-pressed={tool === 'notch'} onClick={() => chooseTool('notch')}><Scissors size={16} />따내기</button>
          </div>
          <p className={styles.help}>{tool === 'polygon' ? '꼭짓점을 차례로 클릭하세요. 시작점 클릭 또는 Enter로 닫습니다.' : tool === 'arc' ? '시작점 → 끝점 → 부풀림 점을 클릭하세요. 아크와 양 끝을 잇는 직선으로 면을 만듭니다.' : tool === 'circlePanel' ? '중심을 누르고 드래그해 원형 패널의 반지름을 정하세요.' : tool === 'circle' ? '가이드 교차점에 커서를 붙인 뒤 누르고 드래그하세요. 교차점이 원의 중심으로 고정됩니다.'
            : tool === 'rectangle' ? '패널 안에서 드래그해 사각 구멍을 그리세요.'
            : tool === 'notch' ? '패널을 선택한 뒤 모서리 안팎을 가로질러 사각형을 그리세요.'
            : '패널을 클릭해 선택하세요. 아래 회전 손잡이를 끌면 90° 스냅, 모서리는 비율 유지(Shift로 해제), 변은 가로·세로 크기를 조절합니다.'}</p>
        </div>
        {selected && !selectedCuts.length && <div className={styles.section}>
          <h3>패널 {selectedPanels.length}개 선택</h3>
          <p className={styles.help}>Shift+클릭으로 패널을 다중 선택합니다. 그룹과 복사·붙여넣기는 ⌘/Ctrl+G·C·V도 지원합니다.</p>
          <div className={styles.toolButtons}>
            <button disabled={selectedPanels.length < 2} onClick={() => groupSelection()}><Group size={15} />패널 그룹</button>
            <button disabled={!selectedPanels.some(p => p.groupId)} onClick={() => groupSelection(true)}><Ungroup size={15} />패널 그룹 해제</button>
            <button onClick={copySelection}><Copy size={15} />패널 복사</button>
            <button disabled={!clipboard.length && !panelClipboard.length} onClick={beginPaste}><ClipboardPaste size={15} />패널 붙여넣기</button>
          </div>
          {selectedPanels.length > 1 && <button onClick={removeSelected}><Trash2 size={15} />선택 패널 삭제</button>}
        </div>}
        {selected && !selectedCuts.length && selectedPanels.length <= 1 && <div className={styles.section}>
          <h3>선택한 패널 <small>mm</small></h3>
          <label className={styles.field}><span>이름</span><input aria-label="패널 이름" value={selected.name} onChange={e => updatePanel({ name: e.target.value })} /></label>
          <div className={styles.fieldGrid}>
            <NumberField label="패널 가로" value={selected.width} min={1} onCommit={width => updatePanel({ width })} />
            <NumberField label="패널 세로" value={selected.height} min={1} onCommit={height => updatePanel({ height })} />
            <NumberField label="X 위치" value={roundMm(selected.x)} min={-doc.width} onCommit={x => updatePanel({ x })} />
            <NumberField label="Y 위치" value={roundMm(selected.y)} min={-doc.height} onCommit={y => updatePanel({ y })} />
          </div>
          {(!selected.profile || selected.profile.kind === 'rounded') && <div className={styles.rounding}><h3>모서리 둥글게</h3><CornerRadiusControl value={selected.profile?.kind === 'rounded' ? selected.profile.radius : 0} max={Math.min(selected.width, selected.height) / 2} unit="mm" onChange={radius => updatePanel({ profile: { kind: 'rounded', radius } })} /></div>}
          <NumberField label="패널 각도" value={selected.rotation || 0} min={-360} onCommit={angle => {
            const next = turnPanel(selected, angle, doc);
            if (next) updatePanel(next); else setMessage('회전한 패널이 원장보다 큽니다.');
          }} />
          <p className={styles.help}>위치: 회전 전 패널 기준점 · 각도: 시계 방향</p>
          <button onClick={rotateSelected} title="선택 패널 90도 회전 (R)"><RotateCw size={15} />패널 90° 회전</button>
          <button className={styles.deleteButton} onClick={() => { commit({ ...doc, panels: doc.panels.filter(p => !selectedPanelIds.includes(p.id)) }); setSelectedId(null); setSelectedCutId(null); }}><Trash2 size={15} />패널 삭제</button>
        </div>}
        {selected && <div className={styles.section}>
          <h3>구멍 · 따내기 <small>{selected.cuts?.length || 0}개</small></h3>
          <p className={styles.help}>{selectedCut?.kind === 'circle' ? 'X·Y는 패널 왼쪽 위에서 구멍 중심까지의 거리입니다. 입력 후 Enter로 적용하세요.' : '관통 절삭 · 위치는 패널 자체의 왼쪽 위 기준'}</p>
          <p className={styles.help}>Shift+클릭 또는 Shift+드래그로 다중 선택합니다. ⌘/Ctrl+C 복사 · V 붙여넣기 · G 그룹 · Shift+G 해제</p>
          <div className={styles.toolButtons}>
            <button disabled={selectedCuts.length < 2} onClick={() => groupSelection()}><Group size={15} />그룹</button>
            <button disabled={!selectedCuts.some(c => c.groupId)} onClick={() => groupSelection(true)}><Ungroup size={15} />그룹 해제</button>
            <button disabled={!selectedCuts.length} onClick={copySelection}><Copy size={15} />복사</button>
            <button disabled={!clipboard.length} onClick={beginPaste}><ClipboardPaste size={15} />붙여넣기</button>
          </div>
          {selectedCuts.length > 1 && <div><p>{selectedCuts.length}개 가공 선택</p><button onClick={removeSelected}><Trash2 size={15} />선택 가공 삭제</button></div>}
          {selectedCut && <div ref={cutFieldsRef}>
            <div className={styles.fieldGrid}>
              <NumberField label="가공 X" value={selectedCut.x} onCommit={x => updateCut({ x })} />
              <NumberField label="가공 Y" value={selectedCut.y} onCommit={y => updateCut({ y })} />
              {selectedCut.kind === 'circle'
                ? <NumberField label="구멍 지름" value={selectedCut.diameter} min={1} onCommit={diameter => updateCut({ diameter })} />
                : <><NumberField label="가공 가로" value={selectedCut.width} min={1} onCommit={width => updateCut({ width })} />
                  <NumberField label="가공 세로" value={selectedCut.height} min={1} onCommit={height => updateCut({ height })} /></>}
            </div>
            {selectedCut.kind !== 'circle' && (!selectedCut.profile || selectedCut.profile.kind === 'rounded') && <div className={styles.rounding}><h3>모서리 둥글게</h3><CornerRadiusControl value={selectedCut.profile?.kind === 'rounded' ? selectedCut.profile.radius : 0} max={Math.min(selectedCut.width, selectedCut.height) / 2} unit="mm" onChange={radius => updateCut({ profile: { kind: 'rounded', radius } })} /></div>}
            <button onClick={removeSelected}><Trash2 size={15} />선택 가공 삭제</button>
          </div>}
          <div className={styles.panelList}>
          {(selected.cuts || []).map((c, i) => <button key={c.id} className={styles.panelItem} aria-pressed={selectedCutIds.includes(c.id)}
            onClick={e => { cancelGesture(); setTool('select'); selectCuts(selected, c.id, e.shiftKey); }}>
            {i + 1}. {c.kind === 'circle' ? `원형 구멍 Ø${c.diameter}` : `${c.kind === 'notch' ? '따내기' : '사각 구멍'} ${c.width} × ${c.height}`} mm
          </button>)}
          </div>
        </div>}
        <div className={styles.section}>
          <h3>컷팅리스트 <small>{panels.length}개</small></h3>
          {!panels.length && <p className={styles.help}>그린 패널의 치수가 여기에 표시됩니다.</p>}
          <div className={styles.panelList}>{panels.map(p => <button key={p.id} className={styles.panelItem} aria-pressed={selectedPanelIds.includes(p.id)} onClick={e => selectPanel(p, e.shiftKey)}>
            <span title={p.name}>{p.name || '이름 없는 패널'}</span><b>{p.width} × {p.height} <small>mm</small></b>
          </button>)}</div>
        </div>
        </>}
      </aside>
      <div className={styles.drawingArea}>
        <div className={styles.canvasTools}>
          <span>단위 mm · {doc.width} × {doc.height} × {doc.thickness}T</span>
          <div>
            <GuideControls guides={doc.guides ?? { vertical: [], horizontal: [] }} rotated={viewTurns % 2 === 1} onChange={guides => commit({ ...doc, guides })} />
            <button aria-label="보드 축소" onClick={() => setZoom(z => Math.max(0.5, z / 1.25))}><ZoomOut size={16} /></button>
            <span>{Math.round(zoom * 100)}%</span>
            <button aria-label="보드 확대" onClick={() => setZoom(z => Math.min(8, z * 1.25))}><ZoomIn size={16} /></button>
            <button onClick={() => { cancelGesture(); setViewTurns(q => (q + 1) % 4); }} title="실치수를 유지하고 보기 방향만 회전"><RotateCw size={16} />원장 회전 {viewTurns * 90}°</button>
            <button onClick={() => setZoom(1)}><Scan size={16} />전체 보기</button>
          </div>
        </div>
        <div ref={viewportRef} className={styles.viewport}>
          <div className={styles.canvasPosition}>
            <svg ref={svgRef} className={styles.boardCanvas} role="img" aria-label="패널을 그리는 보드"
              width={(viewWidth + margin * 2) * scale} height={(viewHeight + margin * 2) * scale}
              viewBox={`${-margin} ${-margin} ${viewWidth + margin * 2} ${viewHeight + margin * 2}`}
              style={{ cursor: snapCursor ? 'none' : tool !== 'select' ? 'crosshair' : 'default' }}
              onDoubleClick={() => { if (draft?.kind === 'polygon') finishShape(draft); }} onPointerDown={pointerDown} onPointerMove={e => { trackPointer(e); if (pastePanels) { setPanelGhosts(pastedPanelsAt(e)); return; } const p = pasteCuts ? pasteAt(e) : gesturePanel(e); if (p) setPreview(p); }} onPointerLeave={() => setPointer(null)}
              onPointerUp={pointerUp} onPointerCancel={cancelGesture} onLostPointerCapture={cancelGesture}>
              <rect data-board-surface x={0} y={0} width={viewWidth} height={viewHeight} fill="#fffdf6" stroke="#a99c7c" strokeWidth={stroke} />
              <g fill="currentColor" fontSize={fontSize} textAnchor="middle" pointerEvents="none">
                <text x={viewWidth / 2} y={-30 / scale}>{viewWidth} mm</text>
                <text transform={`translate(${-32 / scale}, ${viewHeight / 2}) rotate(-90)`}>{viewHeight} mm</text>
              </g>
              {obstacles.map(p => {
                const center = viewPoint({ x: p.x + p.width / 2, y: p.y + p.height / 2 }, doc, viewTurns);
                return <g key={p.id} data-existing-panel={p.id} pointerEvents="none" transform={`translate(${center.x},${center.y}) rotate(${(p.rotation || 0) + viewTurns * 90}) translate(${-p.width / 2},${-p.height / 2})`}>
                  <path d={panelPath(p)} fill="#d3d7dd" fillRule="evenodd" stroke="#939ba8" strokeWidth={stroke} />
                  <text x={p.width / 2} y={p.height / 2} transform={`rotate(${-((p.rotation || 0) + viewTurns * 90)},${p.width / 2},${p.height / 2})`} textAnchor="middle" fontSize={fontSize} fill="#505967">{p.name}</text>
                </g>;
              })}
              {panels.map(p => {
                const center = viewPoint({ x: p.x + p.width / 2, y: p.y + p.height / 2 }, doc, viewTurns);
                const angle = normalizeAngle((p.rotation || 0) + viewTurns * 90);
                const valid = validCuts(p);
                const shape = valid ? p : { ...p, cuts: doc.panels.find(original => original.id === p.id)?.cuts };
                return <g key={p.id} data-panel-id={p.id} data-rotation={p.rotation || 0}
                  transform={`translate(${center.x},${center.y}) rotate(${angle}) translate(${-p.width / 2},${-p.height / 2})`}>
                  <path data-panel-shape d={panelPath(shape)} fillRule="evenodd"
                    fill={overlaps.has(p.id) ? '#fce3cd' : selectedPanelIds.includes(p.id) ? '#ddd9ff' : '#e7ebf0'}
                    stroke={selectedPanelIds.includes(p.id) ? '#6554df' : '#6b778a'} strokeWidth={stroke * (p.id === selectedId ? 2 : 1)}
                    style={{ cursor: snapCursor ? 'none' : tool === 'select' || tool === 'draw' ? 'move' : 'crosshair' }} />
                  {(p.cuts || []).map((c, i) => <g key={c.id} data-cut-id={c.id}>
                    <path d={cutPath(c)} fill="transparent" stroke={selectedCutIds.includes(c.id) || pasteCuts?.some(copy => copy.id === c.id) ? valid ? '#6554df' : '#c43b3b' : 'transparent'} strokeWidth={stroke * 2}
                      style={{ cursor: snapCursor ? 'none' : 'move' }} />
                    {p.id === selectedId && <text pointerEvents="none" x={c.x} y={c.y - 6 / scale} fontSize={fontSize} fill={valid ? '#6554df' : '#c43b3b'}
                      paintOrder="stroke" stroke="white" strokeWidth={3 / scale}>
                      {i + 1}. {c.kind === 'circle' ? `Ø${c.diameter}` : `${c.width} × ${c.height}`}
                    </text>}
                  </g>)}
                  <g transform={`rotate(${-viewTurns * 90},${p.width / 2},${p.height / 2})`} pointerEvents="none" textAnchor="middle" fontSize={fontSize} fill="#25314a" paintOrder="stroke" stroke="#ffffff" strokeWidth={3 / scale} strokeLinejoin="round">
                    <text x={p.width / 2} y={p.height / 2 - 7 / scale}>{p.name}</text>
                    <text data-panel-size={p.id} x={p.width / 2} y={p.height / 2 + 11 / scale}>{p.width} × {p.height} mm</text>
                  </g>
                  {p.id === selectedId && selectedCut?.kind === 'circle' &&
                    <CircleDimensions panel={p} cut={selectedCut} scale={scale} angle={angle} />}
                  {p.id === selectedId && !selectedCuts.length && selectedPanels.length <= 1 && (tool === 'select' || tool === 'draw') && <PanelControls panel={p} scale={scale} viewTurns={viewTurns} rotating={gesture.current?.kind === 'rotate'} />}

                </g>;
              })}
              {draft && (() => {
                let pts = [...draft.points, ...(pointerSnap ? [pointerSnap] : [])];
                if (draft.kind === 'arc' && draft.points.length === 2 && pointerSnap) pts = arcPoints(draft.points[0], draft.points[1], pointerSnap);
                const mapped = pts.map(p => viewPoint(p, doc, viewTurns));
                return <g data-shape-draft pointerEvents="none"><polyline points={mapped.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#6554df" strokeWidth={stroke * 2} />{draft.points.map((p, i) => { const v = viewPoint(p, doc, viewTurns); return <circle key={i} cx={v.x} cy={v.y} r={4 / scale} fill="white" stroke="#6554df" strokeWidth={stroke} />; })}</g>;
              })()}
              {marquee && (() => { const a = viewPoint(marquee.start, doc, viewTurns), b = viewPoint(marquee.end, doc, viewTurns); return <rect data-cut-marquee x={Math.min(a.x, b.x)} y={Math.min(a.y, b.y)} width={Math.abs(a.x - b.x)} height={Math.abs(a.y - b.y)} fill="#6554df22" stroke="#6554df" strokeWidth={stroke} strokeDasharray={`${4 / scale}`} pointerEvents="none" />; })()}
              <BoardGuides interactive={tool === 'select' && !pasteCuts && !pastePanels && !draft} board={doc} scale={scale} turns={viewTurns} onChange={guides => commit({ ...doc, guides })} />
              {gesture.current && ((gesture.current.kind === 'cut' && gesture.current.cutKind === 'circle') || gesture.current.circlePanel) && (() => {
                const center = viewPoint(gesture.current.circlePanel ? gesture.current.start : worldPoint(gesture.current.start, gesture.current.panel), doc, viewTurns);
                return <g data-circle-origin transform={`translate(${center.x},${center.y})`} pointerEvents="none" stroke="#008fbb" strokeWidth={stroke}>
                  <path d={`M${-6 / scale},0H${6 / scale}M0,${-6 / scale}V${6 / scale}`} />
                </g>;
              })()}
              {snapCursor && <g data-snap-cursor data-model-x={pointerSnap!.x} data-model-y={pointerSnap!.y} data-snap-kind={snappedX && snappedY ? 'intersection' : 'guide'} transform={`translate(${snapCursor.x},${snapCursor.y})`} pointerEvents="none" stroke="#008fbb" strokeWidth={1.5 / scale} fill="none">
                <rect x={-4 / scale} y={-4 / scale} width={8 / scale} height={8 / scale} fill="white" />
                <path d={`M${-11 / scale},0H${11 / scale}M0,${-11 / scale}V${11 / scale}`} />
                <text x={14 / scale} y={-12 / scale} fontSize={fontSize} fill="#008fbb" stroke="white" strokeWidth={3 / scale} paintOrder="stroke">{snappedX && snappedY ? '교차점' : '가이드'}</text>
              </g>}
            </svg>
          </div>
        </div>
        <div className={styles.status} role="status">
          <span>{message || saveError || (overlaps.size ? `패널 ${overlaps.size}개가 겹쳐 있습니다. 위치를 조정해 주세요.` : selected ? `${selected.name} · ${selected.width} × ${selected.height} mm · ${selected.rotation || 0}°` : '드래그하는 동안 패널 치수가 실시간으로 표시됩니다.')}</span>
          <small>{onApply ? '원장에 적용하면 반영됩니다' : saveError ? '파일 저장 필요' : '이 브라우저에 자동 저장'}</small>
        </div>
      </div>
    </div>
  </section>;
}

/** 요소 메뉴의 selectionStyle과 같은 12px 원·20px 변 손잡이·하단 회전 버튼. */
function PanelControls({ panel, scale, viewTurns, rotating }: { panel: BoardPanel; scale: number; viewTurns: number; rotating: boolean }) {
  const p = { ...panel, width: viewTurns % 2 ? panel.height : panel.width, height: viewTurns % 2 ? panel.width : panel.height };
  const angle = panel.rotation || 0;
  const mappedHandle = (handle: ResizeHandle): ResizeHandle => {
    const cycle: ResizeHandle[] = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
    return cycle[(cycle.indexOf(handle) - viewTurns * 2 + 8) % 8];
  };
  const color = 'var(--theme-primary, #6366f1)';
  const cursor = (handle: ResizeHandle) => {
    const base = { e: 0, se: 45, s: 90, sw: 135, w: 180, nw: 225, n: 270, ne: 315 }[handle];
    return ['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize'][Math.round((base + angle) / 45) % 4];
  };
  return <g data-panel-controls transform={`translate(${panel.width / 2},${panel.height / 2}) rotate(${-viewTurns * 90}) translate(${-p.width / 2},${-p.height / 2})`}>
    <rect width={p.width} height={p.height} fill="none" stroke={color} strokeWidth={1.5 / scale} pointerEvents="none" />
    {(['n', 's', 'w', 'e'] as const).map(handle => {
      const horizontal = handle === 'n' || handle === 's';
      const x = horizontal ? p.width / 2 : handle === 'e' ? p.width : 0;
      const y = horizontal ? handle === 's' ? p.height : 0 : p.height / 2;
      const width = horizontal ? Math.max(12 / scale, p.width - 24 / scale) : 10 / scale;
      const height = horizontal ? 10 / scale : Math.max(12 / scale, p.height - 24 / scale);
      return <g key={handle} data-corner={mappedHandle(handle)} role="button" aria-label={`패널 ${handle} 변 크기 조절`} style={{ cursor: cursor(handle) }}>
        <rect x={x - width / 2} y={y - height / 2} width={width} height={height} fill="transparent" />
        <rect x={x - (horizontal ? 10 : 3) / scale} y={y - (horizontal ? 3 : 10) / scale}
          width={(horizontal ? 20 : 6) / scale} height={(horizontal ? 6 : 20) / scale} rx={3 / scale}
          fill={color} stroke="white" strokeWidth={1 / scale} pointerEvents="none" />
      </g>;
    })}
    {(['nw', 'ne', 'sw', 'se'] as const).map(handle => <g key={handle} data-corner={mappedHandle(handle)} role="button" aria-label={`패널 ${handle} 모서리 크기 조절`}
      transform={`translate(${handle.includes('e') ? p.width : 0},${handle.includes('s') ? p.height : 0})`} style={{ cursor: cursor(handle) }}>
      <circle r={12 / scale} fill="transparent" />
      <circle r={6 / scale} fill="white" stroke="#b9bec7" strokeWidth={1 / scale} pointerEvents="none" />
    </g>)}
    <g data-rotate role="button" aria-label="패널 자유 회전 핸들" transform={`translate(${p.width / 2},${p.height + 34 / scale}) scale(${1 / scale})`}
      style={{ cursor: rotating ? 'grabbing' : 'grab' }}>
      <title>드래그하여 회전 · 90° 스냅</title>
      <circle r={16} fill="transparent" />
      <circle r={11} fill="white" stroke="#b9bec7" strokeWidth={1} pointerEvents="none" />
      <RotateCw x={-7} y={-7} width={14} height={14} color="#3b3f46" strokeWidth={1.6} pointerEvents="none" />
    </g>
    <text data-angle-label x={p.width / 2} y={p.height + 60 / scale} textAnchor="middle" fontSize={12 / scale} fill={color}
      paintOrder="stroke" stroke="white" strokeWidth={3 / scale} pointerEvents="none">
      {p.rotation || 0}°{(p.rotation || 0) % 90 === 0 ? ' · 스냅' : ''}
    </text>
  </g>;
}

/** 구멍 중심 기준 네 방향 이격. 패널 로컬 mm로 계산하고 글자는 화면에서 바로 읽는다. */
function CircleDimensions({ panel, cut, scale, angle }: {
  panel: BoardPanel; cut: Extract<PanelCut, { kind: 'circle' }>; scale: number; angle: number;
}) {
  const gap = 10 / scale;
  const dimensions = [
    { key: 'left', x: 0, y: cut.y, value: cut.x, tx: cut.x / 2, ty: cut.y - gap },
    { key: 'right', x: panel.width, y: cut.y, value: panel.width - cut.x, tx: (panel.width + cut.x) / 2, ty: cut.y - gap },
    { key: 'top', x: cut.x, y: 0, value: cut.y, tx: cut.x + gap, ty: cut.y / 2 },
    { key: 'bottom', x: cut.x, y: panel.height, value: panel.height - cut.y, tx: cut.x + gap, ty: (panel.height + cut.y) / 2 },
  ];
  return <g data-circle-dimensions pointerEvents="none" stroke="var(--theme-primary, #6366f1)" strokeWidth={1 / scale}>
    {dimensions.map(d => <g key={d.key}>
      <line x1={cut.x} y1={cut.y} x2={d.x} y2={d.y} strokeDasharray={`${4 / scale} ${3 / scale}`} />
      <line x1={d.x - (d.x === cut.x ? 4 / scale : 0)} y1={d.y - (d.y === cut.y ? 4 / scale : 0)}
        x2={d.x + (d.x === cut.x ? 4 / scale : 0)} y2={d.y + (d.y === cut.y ? 4 / scale : 0)} />
      <text data-center-gap={d.key} transform={`translate(${d.tx},${d.ty}) rotate(${-angle})`}
        textAnchor="middle" dominantBaseline="middle" fontSize={12 / scale} fill="var(--theme-primary, #6366f1)"
        paintOrder="stroke" stroke="white" strokeWidth={4 / scale}>{roundMm(d.value)} mm</text>
    </g>)}
    <path d={`M${cut.x - 5 / scale},${cut.y}h${10 / scale}M${cut.x},${cut.y - 5 / scale}v${10 / scale}`} />
  </g>;
}
