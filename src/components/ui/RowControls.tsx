'use client';

import Image from 'next/image';
import { useShelfStore } from '@/stores/useShelfStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useUIStore } from '@/stores/useUIStore';
import type { RowHeight } from '@/types/shelf';

const ROW_HEIGHTS: RowHeight[] = [18, 32, 38];

// v1 비즈니스 규칙: 도어는 32cm 이상, 서랍은 깊이 40cm 이상 + 높이 150cm 이하
const MIN_DOOR_HEIGHT = 32;
const MIN_DRAWER_DEPTH = 39.5;

export function RowControls() {
  const numRows = useShelfStore((s) => s.numRows);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const depth = useShelfStore((s) => s.depth);
  const height = useShelfStore((s) => s.height);
  const setRowHeight = useShelfStore((s) => s.setRowHeight);
  const doorsCreatedLayers = useHardwareStore((s) => s.doorsCreatedLayers);
  const drawersCreatedLayers = useHardwareStore((s) => s.drawersCreatedLayers);
  const toggleDoor = useHardwareStore((s) => s.toggleDoor);
  const toggleDrawer = useHardwareStore((s) => s.toggleDrawer);
  const selectedRow = useUIStore((s) => s.selectedRow);

  // V1에서는 floating box가 3D 뷰어 위에 나타남
  // V2에서는 선택된 행이 있을 때만 해당 행 컨트롤을 표시
  if (selectedRow === null) return null;

  const i = selectedRow;
  const rh = rowHeights[i] ?? 32;
  const hasDoor = doorsCreatedLayers.includes(i);
  const hasDrawer = drawersCreatedLayers.includes(i);
  const canAddDoor = rh >= MIN_DOOR_HEIGHT;
  const canAddDrawer = depth >= MIN_DRAWER_DEPTH && height <= 150;

  return (
    <div className="w-[233px] rounded-xl bg-white p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      {/* 미니어처 이미지 */}
      <div className="mb-4 flex h-[120px] items-center justify-center rounded-lg">
        <Image
          src="/imgs/popup/book.png"
          alt="Row Preview"
          width={180}
          height={100}
          className="object-contain"
        />
      </div>

      {/* Row height */}
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#666]">
        Row height
      </p>
      <div className="mb-3 flex gap-2">
        {ROW_HEIGHTS.map((h) => (
          <button
            key={h}
            onClick={() => setRowHeight(i, h)}
            className={`inline-flex h-8 w-[60px] shrink-0 items-center justify-center rounded-2xl text-xs font-medium transition-all ${
              rh === h
                ? 'border-[1.5px] border-[#2fc614] bg-white font-bold text-[#339922]'
                : 'border-[1.5px] border-transparent bg-[#f5f5f5] text-[#333] hover:bg-[#e8e8e8]'
            }`}
          >
            {h}cm
          </button>
        ))}
      </div>

      {/* Doors */}
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#666]">
        Doors
      </p>
      <div className="mb-1 flex gap-2">
        <button
          onClick={() => hasDoor && toggleDoor(i)}
          className={`inline-flex h-8 w-[60px] shrink-0 items-center justify-center rounded-2xl text-xs font-medium transition-all ${
            !hasDoor
              ? 'border-[1.5px] border-[#2fc614] bg-white font-bold text-[#339922]'
              : 'border-[1.5px] border-transparent bg-[#f5f5f5] text-[#333] hover:bg-[#e8e8e8]'
          }`}
        >
          None
        </button>
        <button
          onClick={() => canAddDoor && !hasDoor && toggleDoor(i)}
          disabled={!canAddDoor}
          className={`inline-flex h-8 w-[60px] shrink-0 items-center justify-center rounded-2xl text-xs font-medium transition-all ${
            hasDoor
              ? 'border-[1.5px] border-[#2fc614] bg-white font-bold text-[#339922]'
              : canAddDoor
                ? 'border-[1.5px] border-transparent bg-[#f5f5f5] text-[#333] hover:bg-[#e8e8e8]'
                : 'cursor-not-allowed border-[1.5px] border-transparent bg-[#f5f5f5] text-[#ccc]'
          }`}
        >
          Some
        </button>
      </div>
      {!canAddDoor && (
        <p className="mb-3 text-[11px] italic text-[#888]">
          칸 높이 32cm 부터 도어 장착 가능
        </p>
      )}

      {/* Drawers */}
      <p className="mb-2 mt-3 text-xs font-medium uppercase tracking-wider text-[#666]">
        Drawers
      </p>
      <div className="mb-1 flex gap-2">
        <button
          onClick={() => canAddDrawer && !hasDrawer && toggleDrawer(i)}
          disabled={!canAddDrawer}
          className={`inline-flex h-8 w-[60px] shrink-0 items-center justify-center rounded-2xl text-xs font-medium transition-all ${
            hasDrawer
              ? 'border-[1.5px] border-[#2fc614] bg-white font-bold text-[#339922]'
              : canAddDrawer
                ? 'border-[1.5px] border-transparent bg-[#f5f5f5] text-[#333] hover:bg-[#e8e8e8]'
                : 'cursor-not-allowed border-[1.5px] border-transparent bg-[#f5f5f5] text-[#ccc]'
          }`}
        >
          ON
        </button>
        <button
          onClick={() => hasDrawer && toggleDrawer(i)}
          className={`inline-flex h-8 w-[60px] shrink-0 items-center justify-center rounded-2xl text-xs font-medium transition-all ${
            !hasDrawer
              ? 'border-[1.5px] border-[#2fc614] bg-white font-bold text-[#339922]'
              : 'border-[1.5px] border-transparent bg-[#f5f5f5] text-[#333] hover:bg-[#e8e8e8]'
          }`}
        >
          OFF
        </button>
      </div>
      {!canAddDrawer && height > 150 && (
        <p className="text-[11px] italic text-[#888]">
          높이 150cm 이하로 서랍 장착 가능
        </p>
      )}
      {!canAddDrawer && depth < MIN_DRAWER_DEPTH && (
        <p className="text-[11px] italic text-[#888]">
          깊이 40cm 부터 서랍 장착 가능
        </p>
      )}
    </div>
  );
}
