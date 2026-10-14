import { REFERENCE_COLORS, REFERENCE_CLASSIC_COLORS } from '@/lib/three/reference-colors';
import type { ColorCategory } from '@/types/shelf';
import { EDGE_MIX_COLORS, SOLID_COLORS, getColorCategory } from '@/lib/three/materials';

/**
 * 시뮬레이션용 Befun 색상 모습.
 * Classic/Natural은 텍스처라 `public/imgs/textures/{name}/horizontalBase·verticalEdge_diff.jpg`의 평균색(sharp stats)을 쓴다.
 * Classic은 모든 색의 단면이 합판색(#BFAE99)으로 같아 합판 단면 노출로 보고 엣지 테이프를 붙이지 않는다(edgeBand null).
 */
const TEXTURE_LOOKS: Record<string, { surface: string; edgeBand: string | null }> = {
  C_Black: { surface: '#040404', edgeBand: null },
  C_White: { surface: '#FFFFFF', edgeBand: null },
  C_Pink: { surface: '#B85F75', edgeBand: null },
  C_Gray: { surface: '#CACACA', edgeBand: null },
  C_Yellow: { surface: '#E8B945', edgeBand: null },
  N_Beech: { surface: '#E9D2AE', edgeBand: '#E8D1AC' },
  N_Oak: { surface: '#B49B7A', edgeBand: '#B49A79' },
  N_Walnut: { surface: '#433012', edgeBand: '#422F11' },
};

export interface BefunColorLook {
  /** 옵티마이저 판재 textureName — upstream 재질 견본(materialData)의 name과 같다 */
  swatchName: string;
  category: ColorCategory;
  surface: string;
  /** 엣지 테이프 색. null이면 엣지밴딩 없음 */
  edgeBand: string | null;
}

export function befunColorLook(colorName: string): BefunColorLook {
  const category = getColorCategory(colorName);
  const swatchName = `Befun ${colorName}`;
  const reference = REFERENCE_COLORS[colorName];
  if (reference) return { swatchName, category, surface: reference.base, edgeBand: reference.edge };
  const classic = REFERENCE_CLASSIC_COLORS[colorName];
  if (classic) return { swatchName, category, surface: classic, edgeBand: null };
  const texture = TEXTURE_LOOKS[colorName];
  if (texture) return { swatchName, category, ...texture };
  const mix = EDGE_MIX_COLORS[colorName];
  if (mix) return { swatchName, category, surface: mix.base, edgeBand: mix.edge };
  const solid = SOLID_COLORS[colorName] ?? { base: '#283A57', edge: '#283A57' };
  return { swatchName, category, surface: solid.base, edgeBand: solid.edge };
}

/** upstream materialSwatches에 덧붙일 Befun 견본(대표 색만, 그림 없음) */
export function befunMaterialSwatches() {
  const names = [...new Set([...Object.keys(TEXTURE_LOOKS), ...Object.keys(SOLID_COLORS), ...Object.keys(EDGE_MIX_COLORS), ...Object.keys(REFERENCE_COLORS), ...Object.keys(REFERENCE_CLASSIC_COLORS)])];
  return names.map((name) => {
    const look = befunColorLook(name);
    return { id: `befun-${name}`, name: look.swatchName, type: '색상', category: 'befun', color: look.surface, texture: 'color', image: '' };
  });
}
