'use client';

import Image from 'next/image';
import { useShelfStore } from '@/stores/useShelfStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import type { StyleType } from '@/types/shelf';

const STYLES: { value: StyleType; label: string; iconDefault: string; iconActive: string }[] = [
  { value: 'pattern', label: 'Pattern', iconDefault: '/imgs/icon/icon_pattern_black.svg', iconActive: '/imgs/icon/icon_pattern.svg' },
  { value: 'grid', label: 'Grid', iconDefault: '/imgs/icon/icon_grid_black.svg', iconActive: '/imgs/icon/icon_grid.svg' },
  { value: 'slant', label: 'Slant', iconDefault: '/imgs/icon/icon_slant_black.svg', iconActive: '/imgs/icon/icon_slant.svg' },
  { value: 'mosaic', label: 'Mosaic', iconDefault: '/imgs/icon/icon_mosaic_black.svg', iconActive: '/imgs/icon/icon_mosaic.svg' },
  { value: 'pixel', label: 'Pixel', iconDefault: '/imgs/icon/icon_pixel_black.svg', iconActive: '/imgs/icon/icon_pixel.svg' },
  { value: 'gradient', label: 'Gradient', iconDefault: '/imgs/icon/icon_gradient_black.svg', iconActive: '/imgs/icon/icon_gradient.svg' },
];

export function StyleSelector() {
  const style = useShelfStore((s) => s.style);
  const setStyle = useShelfStore((s) => s.setStyle);
  const resetHardware = useHardwareStore((s) => s.reset);

  const handleStyleChange = (newStyle: StyleType) => {
    setStyle(newStyle);
    resetHardware();
  };

  return (
    <div className="cfg-row">
      <span className="cfg-label">Style</span>
      <div className="flex flex-1 gap-1.5 overflow-x-auto">
        {STYLES.map((s) => {
          const isActive = style === s.value;
          return (
            <button
              key={s.value}
              onClick={() => handleStyleChange(s.value)}
              className={`flex flex-col items-center justify-center rounded-[10px] border-[1.5px] px-2.5 py-2 min-w-[56px] cursor-pointer transition-all ${
                isActive
                  ? 'border-[var(--green)] bg-white'
                  : 'border-[#e0e0e0] bg-[#f8f8f8] hover:border-[var(--green)]'
              }`}
            >
              <Image
                src={isActive ? s.iconActive : s.iconDefault}
                alt={s.label}
                width={20}
                height={20}
              />
              <span className={`mt-1 text-[11px] font-medium ${
                isActive ? 'text-[var(--green)]' : 'text-[#666]'
              }`}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
