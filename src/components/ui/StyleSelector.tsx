'use client';

import Image from 'next/image';
import { useShelfStore } from '@/stores/useShelfStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import type { StyleType } from '@/types/shelf';

const STYLES: { value: StyleType; label: string; icon: string }[] = [
  { value: 'grid', label: 'Grid', icon: '/imgs/icon/icon_grid_black.svg' },
  { value: 'slant', label: 'Slant', icon: '/imgs/icon/icon_slant_black.svg' },
  { value: 'pixel', label: 'Pixel', icon: '/imgs/icon/icon_pixel_black.svg' },
  { value: 'gradient', label: 'Gradient', icon: '/imgs/icon/icon_gradient_black.svg' },
  { value: 'mosaic', label: 'Mosaic', icon: '/imgs/icon/icon_mosaic_black.svg' },
];

export function StyleSelector() {
  const style = useShelfStore((s) => s.style);
  const setStyle = useShelfStore((s) => s.setStyle);
  const resetHardware = useHardwareStore((s) => s.reset);

  const handleStyleChange = (newStyle: StyleType) => {
    setStyle(newStyle);
    resetHardware(); // 스타일 변경 시 도어/서랍 초기화
  };

  return (
    <div className="mb-5">
      <label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wider">Style</label>
      <div className="grid grid-cols-5 gap-2">
        {STYLES.map((s) => (
          <button
            key={s.value}
            onClick={() => handleStyleChange(s.value)}
            className={`flex flex-col items-center rounded-lg border p-2 text-xs transition-colors ${
              style === s.value
                ? 'border-gray-900 bg-gray-50 font-semibold'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <Image src={s.icon} alt={s.label} width={24} height={24} className="mb-1" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
