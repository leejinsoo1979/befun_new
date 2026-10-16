export const BIRCH_EDGE_MIX_COLOR = 'C_Clay Brown';

export function hasEdgeBanding(color: string): boolean {
  return !color.startsWith('C_') || color === BIRCH_EDGE_MIX_COLOR;
}
