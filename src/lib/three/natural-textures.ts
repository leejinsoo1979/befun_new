import textures from './imported-natural-textures.json';

export interface ImportedNaturalTexture {
  label: string;
  base: string;
  normal: string;
  roughness: string;
  thumbnail: string;
  surface: string;
}

export const IMPORTED_NATURAL_TEXTURES: Readonly<Record<string, ImportedNaturalTexture>> = textures;

export function importedNaturalTexture(color: string): ImportedNaturalTexture | undefined {
  return Object.hasOwn(IMPORTED_NATURAL_TEXTURES, color) ? IMPORTED_NATURAL_TEXTURES[color] : undefined;
}
