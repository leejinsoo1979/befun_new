'use client';

import { useShelfStore } from '@/stores/useShelfStore';

// v1 깊이 버튼: 24cm(23.5), 30cm(29.5), 40cm(39.5)
const DEPTH_OPTIONS = [
  { label: '24cm', value: 23.5 },
  { label: '30cm', value: 29.5 },
  { label: '40cm', value: 39.5 },
];

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</label>
        <span className="text-sm font-semibold tabular-nums">
          {Math.round(value)}{unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gray-900"
        />
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function DimensionPanel() {
  const width = useShelfStore((s) => s.width);
  const setWidth = useShelfStore((s) => s.setWidth);
  const depth = useShelfStore((s) => s.depth);
  const setDepth = useShelfStore((s) => s.setDepth);
  const numRows = useShelfStore((s) => s.numRows);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const thickness = useShelfStore((s) => s.thickness);

  // v1: height 슬라이더는 행 수(1~10)를 조절 → 높이는 자동 계산
  const handleRowCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(10, Math.round(newCount)));
    // 행 높이 배열 확장/축소
    const newRowHeights = [...rowHeights];
    while (newRowHeights.length < count) {
      newRowHeights.push(32); // 기본 32cm
    }
    // 총 높이 계산: (행높이 합 + 패널두께*(행수+1))
    let totalHeight = thickness; // 바닥 패널
    for (let i = 0; i < count; i++) {
      totalHeight += (newRowHeights[i] ?? 32) + thickness;
    }

    useShelfStore.setState({
      rowHeights: newRowHeights,
      numRows: count,
      height: totalHeight,
    });
  };

  // 현재 총 높이 계산 (표시용)
  const totalHeight = thickness + rowHeights.slice(0, numRows).reduce((sum, h) => sum + h + thickness, 0);

  return (
    <div className="mb-5">
      {/* 너비 */}
      <Slider
        label="Width"
        value={width}
        min={30}
        max={450}
        step={1}
        unit="cm"
        onChange={setWidth}
      />

      {/* 높이 (행 수 기반) */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Height</label>
          <span className="text-sm font-semibold tabular-nums">
            {numRows}단 ({Math.round(totalHeight)}cm)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRowCountChange(numRows - 1)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            −
          </button>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={numRows}
            onChange={(e) => handleRowCountChange(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gray-900"
          />
          <button
            onClick={() => handleRowCountChange(numRows + 1)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {/* 깊이 */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wider">Depth</label>
        <div className="flex gap-2">
          {DEPTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDepth(opt.value)}
              className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                Math.abs(depth - opt.value) < 0.5
                  ? 'border-gray-900 bg-gray-50 font-semibold'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
