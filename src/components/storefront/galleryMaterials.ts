import classicMaterials from './galleryClassicMaterials.json';
import modernMaterials from './galleryModernMaterials.json';
import sideboardPhotos from './gallerySideboardPhotos.json';

// Original Tylko editorial photos saved locally; the photographed geometry is fixed.
// Sources and file validation: docs/tylko-reference/cases/gallery-materials-004-local.json
export interface GalleryMaterial {
  id: string;
  label: string;
  swatch: string;
  images: readonly string[];
}
export const galleryMaterials: readonly GalleryMaterial[] = classicMaterials;

export const defaultGalleryMaterial = galleryMaterials[2];

/** Exact Befun keys mapped to observed Tylko gallery materials. No guessed colour aliases. */
export const classicGalleryColourIds: Record<string, string> = {
  'C_White': '01p-white', 'C_Moss Green': '01p-moss-green', 'C_Gray': '01p-grey',
  'C_Black': '01p-black', 'C_Pink': '01p-dusty-pink', 'C_Yellow': '01p-yellow',
  'C_Blue': '01p-blue', 'C_Cashmere': '01p-cashmere-beige-plywood',
  'C_Clay Brown': '01p-clay-brown-plywood', 'N_Oak': '01v-oak', 'N_Walnut': '01v-walnut',
};
export const modernGalleryMaterials: readonly GalleryMaterial[] = modernMaterials;
export function matchingGalleryMaterial(colour: string): GalleryMaterial | undefined {
  const key = colour === 'S_Teracotta Orange' ? 'S_Teracotta' : colour;
  return galleryMaterials.find(item => item.id === classicGalleryColourIds[key])
    ?? modernMaterials.find(item => item.colour === key);
}

export function supportsMaterialPhotos(images: readonly string[]): boolean {
  return /\/(wallstorage\/original-|sideboard\/cplus\/original-)/.test(images[0] ?? '');
}

/** Use bundled, observed photo sets; preserve other product families pending capture. */
export function productMaterialPhotos(images: readonly string[], material: GalleryMaterial): readonly string[] {
  if (images[0]?.includes('/sideboard/')) {
    const photos: Readonly<Record<string, readonly string[]>> = sideboardPhotos;
    return photos[material.id] ?? material.images;
  }
  return supportsMaterialPhotos(images) ? material.images : images;
}
