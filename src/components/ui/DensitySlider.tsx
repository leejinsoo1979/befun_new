'use client';

import { useShelfStore } from '@/stores/useShelfStore';

export function DensitySlider() {
  const density = useShelfStore((s) => s.density);
  const setDensity = useShelfStore((s) => s.setDensity);

  return (
    <div className="mb-5">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Density</label>
        <span className="text-sm font-semibold tabular-nums">{density}%</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDensity(Math.max(0, density - 1))}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          −
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={density}
          onChange={(e) => setDensity(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gray-900"
        />
        <button
          onClick={() => setDensity(Math.min(100, density + 1))}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          +
        </button>
      </div>
    </div>
  );
}
