import { catalogThumbnailStart } from '@/lib/catalog-entry/starts';
import { downloadedCardEntries } from '@/lib/catalog-images';
import { downloadedCategoryByKey } from './categories';

/** 클라이언트로 보낼 최소 필드. 가격·치수·SKU는 원본 자료에 없으므로 만들지 않는다. */
export interface DownloadedItem { categoryKey: string; sequence: number; productKey: string; name: string; thumbnail: string; studio: string; source: string; editorHref?: string }

/** 서버 전용: 1.2MB manifest 전체를 클라이언트로 보내지 않고 카테고리 하나만 골라 전달 */
export function downloadedItems(categoryKey: string): DownloadedItem[] {
  const category = downloadedCategoryByKey(categoryKey);
  if (!category) return [];
  const items = downloadedCardEntries.filter(entry => entry.category === category.csv)
    .sort((a, b) => a.sequence - b.sequence)
    .map(entry => ({ categoryKey, sequence: entry.sequence, productKey: entry.productKey, name: entry.name, thumbnail: entry.thumbnail, studio: entry.studio, source: entry.source, editorHref: catalogThumbnailStart(entry.productKey)?.href }));
  // This observed source preset was added after the downloaded catalog snapshot.
  if (['all', 'storage', 'bedside_table'].includes(categoryKey) && !items.some(item => item.productKey === '657092,w')) {
    items.unshift({ categoryKey, sequence: 0, productKey: '657092,w', name: '오프화이트 미니멀 협탁', thumbnail: '/three/bookcase/ui/657092.webp', studio: '', source: 'https://tylko.com/de-de/configure/657092,w', editorHref: catalogThumbnailStart('657092,w')!.href });
  }
  return items;
}

export function downloadedItem(categoryKey: string, sequence: number): DownloadedItem | undefined {
  return downloadedItems(categoryKey).find(item => item.sequence === sequence);
}
