'use client';

import { useLocale } from '@/lib/commerce/useLocale';

import Image from 'next/image';
import { REFERENCE_COLORS, REFERENCE_CLASSIC_COLORS } from '@/lib/three/reference-colors';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { IMPORTED_NATURAL_TEXTURES } from '@/lib/three/natural-textures';
import type { ColorCategory } from '@/types/shelf';

interface ColorOption {
  name: string;
  image: string;
  category: ColorCategory;
  label?: string;
}

const CLASSIC_COLORS: ColorOption[] = [
  { name: 'C_White', image: '/imgs/classic_color/classic-white.svg', category: 'classic' },
  { name: 'C_Green', image: '/imgs/classic_color/classic-white.svg', category: 'classic' },
  { name: 'C_Moss Green', image: '/imgs/classic_color/classic-white.svg', category: 'classic' },
  { name: 'C_Gray', image: '/imgs/classic_color/classic-gray.svg', category: 'classic' },
  { name: 'C_Black', image: '/imgs/classic_color/classic-black.svg', category: 'classic' },
  { name: 'C_Pink', image: '/imgs/classic_color/classic-pink.svg', category: 'classic' },
  { name: 'C_Yellow', image: '/imgs/classic_color/classic-yellow.svg', category: 'classic' },
  { name: 'C_Blue', image: '/imgs/classic_color/classic-white.svg', category: 'classic' },
  { name: 'C_Cashmere', image: '/imgs/classic_color/classic-white.svg', category: 'classic' },
];

const NATURAL_COLORS: ColorOption[] = [
  { name: 'N_Beech', image: '/imgs/natural_color/natural-bright.png', category: 'natural' },
  { name: 'N_Oak', image: '/imgs/natural_color/natural-normal.png', category: 'natural' },
  { name: 'N_Walnut', image: '/imgs/natural_color/natural-dark.png', category: 'natural' },
  ...Object.entries(IMPORTED_NATURAL_TEXTURES).map(([name, texture]) => ({ name, image: texture.thumbnail, label: texture.label, category: 'natural' as const })),
];

// Live Type02 swatches verified in material-source-001; legacy saved keys still render.
const SOLID_COLORS: ColorOption[] = ["S_White", "S_Green", "S_Midnight Blue", "S_Matte Black", "S_Black", "S_Teracotta", "S_Sky Blue", "S_Stone Gray", "S_Gray", "S_Butter Yellow", "S_Cotton", "S_Olive Green", "S_Sage Green", "S_Burgundy", "S_Reisinger Pink", "S_Lilac", "S_Dark Brown"].map(name => ({ name, image: name === 'S_Green' ? '/imgs/solid_color/solid-green.svg' : '', category: 'solid' }));

const MIX_COLORS: ColorOption[] = [
  { name: 'C_Clay Brown', image: '/imgs/classic_color/classic-white.svg', category: 'edgeMix' },
  { name: 'Sand+Midnight Blue', image: '/imgs/edgemix_color/edgemix-blue.svg', category: 'edgeMix' },
  { name: 'Gray+Darkgray', image: '/imgs/edgemix_color/edgemix-gray.svg', category: 'edgeMix' },
  { name: 'Sand+Green', image: '/imgs/edgemix_color/edgemix-green.svg', category: 'edgeMix' },
  { name: 'Sand+Mustard', image: '/imgs/edgemix_color/edgemix-yellow.svg', category: 'edgeMix' },
];

const FINISH_TABS: { label: string; category: ColorCategory }[] = [
  { label: '자작합판', category: 'classic' },
  { label: '우드', category: 'natural' },
  { label: '솔리드', category: 'solid' },
  { label: '믹스', category: 'edgeMix' },
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
  const { t: tr } = useLocale();
  const currentColor = useMaterialStore((s) => s.currentColor);
  const colorCategory = useMaterialStore((s) => s.colorCategory);
  const setColor = useMaterialStore((s) => s.setColor);

  const palette = COLORS_BY_CATEGORY[colorCategory];
  const colors = palette.some(c=>c.name===currentColor || (c.name==='S_Teracotta' && currentColor==='S_Teracotta Orange')) ? palette : [{name:currentColor,image:'',category:colorCategory},...palette];

  const handleTabChange = (category: ColorCategory) => {
    // Switch tab and auto-select default color for that category
    setColor(CATEGORY_DEFAULTS[category], category);
  };

  return (
    <div>
      {/* Material tab toggle */}
      <div className="cfg-row">
        <span className="cfg-label">{tr("Finish")}</span>
        <div className="flex items-center">
          <div className="tylko-pill-group">
            {FINISH_TABS.map((tab) => (
              <button
                key={tab.category}
                onClick={() => handleTabChange(tab.category)}
                className={`tylko-pill-btn ${colorCategory === tab.category ? 'active' : ''}`}
              >
                {tr(tab.label)}
              </button>
            ))}
          </div>
          <button className="tylko-help">?</button>
        </div>
      </div>

      {/* Color grid for selected tab */}
      <div className="flex items-start gap-3 py-[var(--section-py)]">
        <span className="w-[var(--label-w)] shrink-0 pt-1 text-[13px] font-medium text-[#333] sm:text-[14px]">
          {tr("Colour")}
        </span>
        <div className="flex flex-1 flex-wrap gap-[5px]">
          {colors.map((c) => {
            const isActive = currentColor === c.name || (c.name === 'S_Teracotta' && currentColor === 'S_Teracotta Orange');
            const label = tr(c.label ?? c.name);
            return (
              <button
                key={c.name}
                onClick={() => setColor(c.name, c.category)}
                className={`tylko-color-swatch ${isActive ? 'active' : ''}`}
                title={label}
                aria-label={label}
              >
                {REFERENCE_COLORS[c.name] ? (
                  <span aria-hidden="true" className="block h-6 w-6 rounded-full" style={{
                    background: REFERENCE_COLORS[c.name].base === REFERENCE_COLORS[c.name].edge
                      ? REFERENCE_COLORS[c.name].base
                      : `linear-gradient(to bottom, ${REFERENCE_COLORS[c.name].base} 72%, ${REFERENCE_COLORS[c.name].edge} 72%)`,
                  }} />
                ) : REFERENCE_CLASSIC_COLORS[c.name] ? (
                  <span aria-hidden="true" className="block h-6 w-6 rounded-full" style={{
                    background: `linear-gradient(to bottom, ${REFERENCE_CLASSIC_COLORS[c.name]} 72%, transparent 72%), url("${c.image}") center / cover`,
                  }} />
                ) : <Image
                  src={c.image}
                  alt={label}
                  width={24}
                  height={24}
                  className="rounded-full"
                />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
