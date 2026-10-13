'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { calculateGridPanels } from '@/lib/three/styles/grid';
import { calculateSlantPanels } from '@/lib/three/styles/slant';
import { calculatePixelPanels } from '@/lib/three/styles/pixel';
import { calculateGradientPanels } from '@/lib/three/styles/gradient';
import { calculatePatternPanels } from '@/lib/three/styles/pattern';
import { calculateMosaicPanels } from '@/lib/three/styles/mosaic';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useShelfStore } from '@/stores/useShelfStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useUIStore } from '@/stores/useUIStore';
import { hardwareModes, type HardwareMode } from '@/lib/three/hardware-state';
import type { RowHeight } from '@/types/shelf';

const ROW_HEIGHTS: RowHeight[] = [18, 28, 38];

// Reference: 300mm row pitch for doors; drawers from 320mm depth below 1578mm.
const MIN_DOOR_HEIGHT = 28;
const MIN_DRAWER_DEPTH = 32;

export function RowControls() {
  const category = useMaterialStore(s => s.colorCategory);
  const family = category === 'classic' || category === 'natural' ? 'type01' as const : 'type02' as const;
  const hasBackPanel = useShelfStore(s => s.hasBackPanel);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const depth = useShelfStore((s) => s.depth);
  const setRowHeight = useShelfStore((s) => s.setRowHeight);
  const doorsCreatedLayers = useHardwareStore((s) => s.doorsCreatedLayers);
  const drawersCreatedLayers = useHardwareStore((s) => s.drawersCreatedLayers);
  const rowStyles = useHardwareStore((s) => s.rowStyles);
  const setMode = useHardwareStore((s) => s.setMode);
  const selectedRow = useUIStore((s) => s.selectedRow);
  const width = useShelfStore((s) => s.width);
  const height = useShelfStore((s) => s.height);
  const style = useShelfStore((s) => s.style);
  const density = useShelfStore((s) => s.density);
  const numRows = useShelfStore((s) => s.numRows);
  const thickness = useShelfStore((s) => s.thickness);
  const compartmentCount = useMemo(() => {
    if (selectedRow === null) return Infinity;
    const input = { width,height,depth,thickness,density,rowHeights,numRows,hasBackPanel,hardwareRowStyles:rowStyles,family };
    const generators = { grid: calculateGridPanels, slant: calculateSlantPanels, pixel: calculatePixelPanels,
      gradient: calculateGradientPanels, pattern: calculatePatternPanels, mosaic: calculateMosaicPanels };
    const cells = style === 'mosaic' ? calculateMosaicPanels(input).cells : generators[style](input).openings;
    if (!cells) return Infinity;
    const spans = cells.filter(c => c.rowIndex <= selectedRow && c.rowIndex+c.rowSpan > selectedRow);
    return new Set(spans.map(c => `${c.x}:${c.width}`)).size;
  }, [selectedRow,style,width,height,depth,thickness,density,rowHeights,numRows,rowStyles,family,hasBackPanel]);

  // V1에서는 floating box가 3D 뷰어 위에 나타남
  // V2에서는 선택된 행이 있을 때만 해당 행 컨트롤을 표시
  if (selectedRow === null) return null;

  const i = selectedRow;
  const rh = rowHeights[i] ?? 32;
  const fallback = drawersCreatedLayers.includes(i) ? (doorsCreatedLayers.includes(i) ? 22 : 21) : doorsCreatedLayers.includes(i) ? 12 : 11;
  const modes = hardwareModes(rowStyles[i] ?? fallback);
  const canAddDoor = rh >= MIN_DOOR_HEIGHT;
  const rowTop = rowHeights.slice(0,i+1).reduce((sum,h)=>sum+h+2,0);
  const canAddDrawer = depth >= MIN_DRAWER_DEPTH && rowTop <= 157.8;

  return (
    <div className="w-[233px] rounded-xl bg-white p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      {/* 미니어처 이미지 — 모바일에서는 선반을 덜 가리도록 숨김 */}
      <div className="mb-4 hidden h-[120px] items-center justify-center rounded-lg lg:flex">
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

      {(['doors','drawers'] as const).map(kind => {
        const enabled = kind === 'doors' ? canAddDoor : canAddDrawer;
        return <div key={kind}>
          <p className="mb-2 mt-3 text-xs font-medium uppercase tracking-wider text-[#666]">{kind}</p>
          <div className="mb-1 flex gap-2">
            {(['none','some','max'] as HardwareMode[]).map(mode => {
              const disabled = mode !== 'none' && (!enabled || (mode === 'some' && compartmentCount <= 1));
              return <button key={mode} disabled={disabled}
                onClick={() => setMode(i,kind,mode)}
                className={`inline-flex h-8 w-[60px] shrink-0 items-center justify-center rounded-2xl text-xs font-medium transition-all ${
                  modes[kind] === mode ? 'border-[1.5px] border-[#2fc614] bg-white font-bold text-[#339922]'
                    : disabled ? 'cursor-not-allowed border-[1.5px] border-transparent bg-[#f5f5f5] text-[#ccc]'
                      : 'border-[1.5px] border-transparent bg-[#f5f5f5] text-[#333] hover:bg-[#e8e8e8]'
                }`}>{mode[0].toUpperCase()+mode.slice(1)}</button>;
            })}
          </div>
          {!enabled && <p className="text-[11px] italic text-[#888]">{
            kind === 'doors' ? '칸 높이 28cm부터 도어 장착 가능'
              : depth < MIN_DRAWER_DEPTH ? '깊이 32cm부터 서랍 장착 가능'
                : '서랍은 행 상단 높이 157.8cm 이하에서 장착 가능'
          }</p>}
        </div>;
      })}
    </div>
  );
}
