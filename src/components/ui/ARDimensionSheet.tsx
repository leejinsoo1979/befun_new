'use client';

import { useState } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import { useShelfStore } from '@/stores/useShelfStore';
import { RulerSlider } from './RulerSlider';

const DEPTHS = [24, 32, 40];
const MAX_ROWS = 10;
const FOOT_HEIGHT = 1; // cm — DimensionPanel 표시 높이와 같은 기준(조절발 포함)

/** DimensionPanel과 같은 행 수 변경 규칙 (새 행 32cm, 하드웨어 정리) */
function setRowCount(count: number) {
  const { rowHeights, thickness } = useShelfStore.getState();
  const next = [...rowHeights];
  while (next.length < count) next.push(32);
  let height = thickness;
  for (let i = 0; i < count; i++) height += (next[i] ?? 32) + thickness;
  useShelfStore.setState({ rowHeights: next, numRows: count, height });
  useShelfStore.getState().reconcileHardware();
}

interface ARDimensionSheetProps {
  onClose: () => void;
}

/**
 * AR 크기 조절 시트 — 너비·높이·깊이 자 슬라이더 + 취소/적용
 * 드래그하는 동안 AR 속 선반에 바로 반영되고, 취소하면 시트를 열 때의 크기로 되돌린다.
 */
export function ARDimensionSheet({ onClose }: ARDimensionSheetProps) {
  const width = useShelfStore((s) => s.width);
  const depth = useShelfStore((s) => s.depth);
  const numRows = useShelfStore((s) => s.numRows);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const thickness = useShelfStore((s) => s.thickness);
  const setWidth = useShelfStore((s) => s.setWidth);
  const setDepth = useShelfStore((s) => s.setDepth);

  // 열 때의 상태 (취소 시 복원)
  const [snapshot] = useState(() => {
    const s = useShelfStore.getState();
    return { width: s.width, depth: s.depth, numRows: s.numRows, rowHeights: [...s.rowHeights], height: s.height };
  });

  const totalHeight = (rows: number) =>
    thickness + rowHeights.slice(0, rows).reduce((sum, h) => sum + h + thickness, 0) + FOOT_HEIGHT;
  const depthIndex = Math.max(0, DEPTHS.findIndex((d) => Math.abs(d - depth) < 0.5));

  const cancel = () => {
    useShelfStore.setState({ width: snapshot.width, numRows: snapshot.numRows, rowHeights: snapshot.rowHeights, height: snapshot.height });
    useShelfStore.getState().setDepth(snapshot.depth);
    useShelfStore.getState().reconcileHardware();
    onClose();
  };

  return (
    <div className="rounded-t-2xl bg-white/95 shadow-[0_-6px_24px_rgba(0,0,0,0.15)] backdrop-blur">
      <div className="px-5 pt-3 pb-1">
        <RulerSlider label="너비" value={width} min={30} max={450} step={1} tickEvery={10}
          display={`${Math.round(width)} cm`} onChange={setWidth} />
        <RulerSlider label="높이" value={numRows} min={1} max={MAX_ROWS} step={1} tickEvery={1}
          display={`${Math.round(totalHeight(numRows))} cm`} onChange={(v) => setRowCount(Math.round(v))} />
        <RulerSlider label="깊이" value={depthIndex} min={0} max={DEPTHS.length - 1} step={1} tickEvery={1}
          display={`${DEPTHS[depthIndex]} cm`} onChange={(i) => setDepth(DEPTHS[Math.round(i)])} />
      </div>
      <div className="grid grid-cols-2 border-t border-[#ececec] pb-[env(safe-area-inset-bottom)]">
        <button type="button" onClick={cancel}
          className="flex h-12 items-center justify-center gap-1.5 border-r border-[#ececec] text-[15px] text-[#555]">
          <FiX size={16} /> 취소
        </button>
        <button type="button" onClick={onClose}
          className="flex h-12 items-center justify-center gap-1.5 text-[15px] font-semibold text-[var(--green)]">
          <FiCheck size={17} /> 적용
        </button>
      </div>
    </div>
  );
}
