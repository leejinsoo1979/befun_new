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
  { name: 'S_Pink', image: '/imgs/solid_color/solid-pink.svg', category: 'solid' },
  { name: 'S_Red', image: '/imgs/solid_color/solid-red.svg', category: 'solid' },
  { name: 'S_Sky Blue', image: '/imgs/solid_color/solid-skyblue.svg', category: 'solid' },
  { name: 'S_Yellow', image: '/imgs/solid_color/solid-yellow.svg', category: 'solid' },
];

const EDGEMIX_COLORS: ColorOption[] = [
  { name: 'Sand+Midnight Blue', image: '/imgs/edgemix_color/edgemix-blue.svg', category: 'edgeMix' },
  { name: 'Gray+Darkgray', image: '/imgs/edgemix_color/edgemix-gray.svg', category: 'edgeMix' },
  { name: 'Sand+Green', image: '/imgs/edgemix_color/edgemix-green.svg', category: 'edgeMix' },
  { name: 'Sand+Mustard', image: '/imgs/edgemix_color/edgemix-yellow.svg', category: 'edgeMix' },
];

function ColorGroup({
  label,
  colors,
  currentColor,
  onSelect,
}: {
  label: string;
  colors: ColorOption[];
  currentColor: string;
  onSelect: (name: string, category: ColorCategory) => void;
}) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c.name}
            onClick={() => onSelect(c.name, c.category)}
            className={`relative h-8 w-8 overflow-hidden rounded-full border-2 transition-all ${
              currentColor === c.name
                ? 'border-gray-900 ring-2 ring-gray-300'
                : 'border-gray-200 hover:border-gray-400'
            }`}
            title={c.name}
          >
            <Image
              src={c.image}
              alt={c.name}
              fill
              className="object-cover"
              sizes="32px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ColorPicker() {
  const currentColor = useMaterialStore((s) => s.currentColor);
  const setColor = useMaterialStore((s) => s.setColor);

  const handleSelect = (name: string, category: ColorCategory) => {
    setColor(name, category);
  };

  return (
    <div className="mb-5">
      <ColorGroup label="Classic" colors={CLASSIC_COLORS} currentColor={currentColor} onSelect={handleSelect} />
      <ColorGroup label="Natural" colors={NATURAL_COLORS} currentColor={currentColor} onSelect={handleSelect} />
      <ColorGroup label="Solid" colors={SOLID_COLORS} currentColor={currentColor} onSelect={handleSelect} />
      <ColorGroup label="Mix" colors={EDGEMIX_COLORS} currentColor={currentColor} onSelect={handleSelect} />
    </div>
  );
}
