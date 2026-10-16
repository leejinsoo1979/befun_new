import metadata from './products.json';
import { DOWNLOADED_CATEGORIES } from '@/lib/catalog-expansion/categories';
import { downloadedItems, type DownloadedItem } from '@/lib/catalog-expansion/server';
import type { ShoppingDetails, ShoppingItem, ShoppingVariant } from './types';
import bedsideStart from '@/lib/bookcase/data/bedside-start.json';

const details: Record<string, ShoppingDetails> = {
  ...metadata,
  '657092,w': {
    line: 'Original Modern', style: '', eur: Number(bedsideStart.sourceDiscountEuro), regularEur: Number(bedsideStart.sourceEuro),
    width: bedsideStart.preset.width, height: bedsideStart.preset.height, depth: bedsideStart.preset.depth,
    badges: [], variants: [], source: 'https://tylko.com/de-de/configure/657092,w',
  },
};
const all = new Map<string, DownloadedItem>();
for (const category of DOWNLOADED_CATEGORIES) for (const item of downloadedItems(category.key)) {
  if (!all.has(item.productKey)) all.set(item.productKey, item);
}
const enrich = (item: DownloadedItem): ShoppingVariant => ({ ...item, details: details[item.productKey] });
export function shoppingItems(items: DownloadedItem[]): ShoppingItem[] {
  return items.map(item => ({ ...enrich(item), variants: (details[item.productKey]?.variants ?? [])
    .filter(key => key !== item.productKey && all.has(key)).map(key => enrich(all.get(key)!)) }));
}
export function shoppingWishlistItems(): ShoppingItem[] { return [...all.values()].map(item => ({ ...enrich(item), variants: [] })); }
export function shoppingRecommendations(): ShoppingItem[] { return shoppingItems([...all.values()].filter(item => item.editorHref).slice(0, 8)); }

/** Existing chaise menu has no separate CSV bucket: select only explicitly named chaise products. */
export function chaiseItems() {
  return [...all.values()].filter(item => /Longchair|Chaise longue/i.test(item.name) && /,(s|sotty)$/.test(item.productKey));
}

/** Source identities used by the collection-specific design chooser. */
export function collectionProductKeys(productLine: string) {
  const names: Record<string, string> = { classic: 'Original Classic', modern: 'Original Modern', edge: 'Edge', tone: 'Tone' };
  const name = names[productLine];
  return name ? Object.entries(details).filter(([, item]) => item.line === name).map(([key]) => key) : undefined;
}
