import { sourceProductKey } from './identity';
import manifest from './manifest.json';
import matches from './existing-matches.json';

export interface CardImagePair { thumbnail: string; studio: string }
export type DownloadedCardEntry = typeof manifest[number];
/** Includes every category membership; the same product may belong to several categories. */
export const downloadedCardEntries: readonly DownloadedCardEntry[] = manifest;
export const existingCardImages: Readonly<Record<string, CardImagePair>> = matches;
export { sourceProductKey } from './identity';
const byProduct = new Map<string, DownloadedCardEntry[]>();
for (const entry of manifest) {
  const group = byProduct.get(entry.productKey) ?? [];
  group.push(entry);
  byProduct.set(entry.productKey, group);
}
/** Resolve only verified product IDs. Ambiguous photographs require a specific CSV category. */
export function getDownloadedCardImages(sourceProductUrl: string, categoryName?: string): CardImagePair | null {
  const key = sourceProductKey(sourceProductUrl);
  const entries = key ? byProduct.get(key) ?? [] : [];
  const candidates = categoryName ? entries.filter(entry => entry.category === categoryName) : entries;
  const first = candidates[0];
  if (!first || candidates.some(entry => entry.thumbnail !== first.thumbnail || entry.studio !== first.studio)) return null;
  return {thumbnail:first.thumbnail,studio:first.studio};
}
