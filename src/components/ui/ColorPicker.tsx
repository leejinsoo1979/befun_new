'use client';

import Image from 'next/image';
import { useMaterialStore } from '@/stores/useMaterialStore';
import type { ColorCategory } from '@/types/shelf';

interface ColorOption {
  name: string;
  image: string;
  category: ColorCategory;
}

const CLASSIC_COLORS: ColorOption[] = [
  { name: 'C_Black', image: '/imgs/classic_color/classic-black.svg', category: 'classic' },
  { name: 'C_White', image: '/imgs/classic_color/classic-white.svg', category: 'classic' },
  { name: 'C_Pink', image: '/imgs/classic_color/classic-pink.svg', category: 'classic' },
  { name: 'C_Gray', image: '/imgs/classic_color/classic-gray.svg', category: 'classic' },
  { name: 'C_Yellow', image: '/imgs/classic_color/classic-yellow.svg', category: 'classic' },
];

const NATURAL_COLORS: ColorOption[] = [
  { name: 'N_Beech', image: '/imgs/natural_color/natural-bright.png', category: 'natural' },
  { name: 'N_Oak', image: '/imgs/natural_color/natural-normal.png', category: 'natural' },
  { name: 'N_Walnut', image: '/imgs/natural_color/natural-dark.png', category: 'natural' },
];

const SOLID_COLORS: ColorOption[] = [
  { name: 'S_Black', image: '/imgs/solid_color/solid-black.svg', category: 'solid' },
  { name: 'S_Midnight Blue', image: '/imgs/solid_color/solid-blue.svg', category: 'solid' },
  { name: 'S_Burgundy', image: '/imgs/solid_color/solid-burgundy.svg', category: 'solid' },
  { name: 'S_Teracotta', image: '/imgs/solid_color/solid-cider.svg', category: 'solid' },
  { name: 'S_Teracotta Orange', image: '/imgs/solid_color/solid-deepred.svg', category: 'solid' },
  { name: 'S_Gray', image: '/imgs/solid_color/solid-gray.svg', category: 'solid' },
  { name: 'S_Green', image: '/imgs/solid_color/solid-green.svg', category: 'solid' },
  { name: 'S_Ivory', image: '/imgs/solid_color/solid-ivory.svg', category: 'solid' },
  { name: 'S_Sand Beige', image: '/imgs/solid_color/solid-kakhi.svg', category: 'solid' },
  { name: 'S_Olive Green', image: '/imgs/solid_color/solid-olive.svg', category: 'solid' },
  { name: 'S_Sky Blue', image: '/imgs/solid_color/solid-skyblue.svg', category: 'solid' },
  { name: 'S_Pink', image: '/imgs/solid_color/solid-pink.svg', category: 'solid' },
  { name: 'S_Red', image: '/imgs/solid_color/solid-red.svg', category: 'solid' },
  { name: 'S_Yellow', image: '/imgs/solid_color/solid-yellow.svg', category: 'solid' },
];

const MIX_COLORS: ColorOption[] = [
  { name: 'Sand+Midnight Blue', image: '/imgs/edgemix_color/edgemix-blue.svg', category: 'edgeMix' },
  { name: 'Gray+Darkgray', image: '/imgs/edgemix_color/edgemix-gray.svg', category: 'edgeMix' },
  { name: 'Sand+Green', image: '/imgs/edgemix_color/edgemix-green.svg', category: 'edgeMix' },
  { name: 'Sand+Mustard', image: '/imgs/edgemix_color/edgemix-yellow.svg', category: 'edgeMix' },
];

const FINISH_TABS: { label: string; category: ColorCategory }[] = [
  { label: 'Classic', category: 'classic' },
  { label: 'Natural', category: 'natural' },
  { label: 'Solid', category: 'solid' },
  { label: 'Mix', category: 'edgeMix' },
];

const COLORS_BY_CATEGORY: Record<ColorCategory, ColorOption[]> = {
  classic: CLASSIC_COLORS,
  natural: NATURAL_COLORS,
  solid: SOLID_COLORS,
  edgeMix: MIX_COLORS,
};

// Default color per category
const CATEGORY_DEFAULTS: Record<ColorCategory, string> = {
  classic: 'C_Black',
  natural: 'N_Oak',
  solid: 'S_Midnight Blue',
  edgeMix: 'Sand+Midnight Blue',
};

export function ColorPicker() {
  const currentColor = useMaterialStore((s) => s.currentColor);
  const colorCategory = useMaterialStore((s) => s.colorCategory);
  const setColor = useMaterialStore((s) => s.setColor);

  const colors = COLORS_BY_CATEGORY[colorCategory];

  const handleTabChange = (category: ColorCategory) => {
    // Switch tab and auto-select default color for that category
    setColor(CATEGORY_DEFAULTS[category], category);
  };

  return (
    <div>
      {/* Material tab toggle */}
      <div className="cfg-row">
        <span className="cfg-label">Finish</span>
        <div className="flex items-center">
          <div className="tylko-pill-group">
            {FINISH_TABS.map((tab) => (
              <button
                key={tab.category}
                onClick={() => handleTabChange(tab.category)}
                className={`tylko-pill-btn ${colorCategory === tab.category ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="tylko-help">?</button>
        </div>
      </div>

      {/* Color grid for selected tab */}
      <div className="flex items-start gap-3 py-[var(--section-py)]">
        <span className="w-[var(--label-w)] shrink-0 pt-1 text-[13px] font-medium text-[#333] sm:text-[14px]">
          Colour
        </span>
        <div className="flex flex-1 flex-wrap gap-[5px]">
          {colors.map((c) => {
            const isActive = currentColor === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setColor(c.name, c.category)}
                className={`tylko-color-swatch ${isActive ? 'active' : ''}`}
                title={c.name}
              >
                <Image
                  src={c.image}
                  alt={c.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
