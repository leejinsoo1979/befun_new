import { BIRCH_EDGE_MIX_COLOR } from '@/lib/three/finish';
import { create } from 'zustand';
import type { ColorCategory } from '@/types/shelf';

interface MaterialState {
  currentColor: string;
  colorCategory: ColorCategory;

  // Actions
  setColor: (color: string, category: ColorCategory) => void;
}

export const useMaterialStore = create<MaterialState>((set) => ({
  currentColor: 'S_Midnight Blue',
  colorCategory: 'solid',

  setColor: (color, category) =>
    set({ currentColor: color, colorCategory: color === BIRCH_EDGE_MIX_COLOR ? 'edgeMix' : category }),
}));
