import { downloadedCardEntries } from '@/lib/catalog-images';
import { downloadedCategoryByKey } from './categories';

/** 클라이언트로 보낼 최소 필드. 가격·치수·SKU는 원본 자료에 없으므로 만들지 않는다. */
export interface DownloadedItem { categoryKey: string; sequence: number; productKey: string; name: string; thumbnail: string; studio: string }

/** 서버 전용: 1.2MB manifest 전체를 클라이언트로 보내지 않고 카테고리 하나만 골라 전달 */
export function downloadedItems(categoryKey: string): DownloadedItem[] {
  const category = downloadedCategoryByKey(categoryKey);
  if (!category) return [];
  return downloadedCardEntries.filter(entry => entry.category === category.csv)
    .sort((a, b) => a.sequence - b.sequence)
    .map(entry => ({ categoryKey, sequence: entry.sequence, productKey: entry.productKey, name: entry.name, thumbnail: entry.thumbnail, studio: entry.studio }));
}

export function downloadedItem(categoryKey: string, sequence: number): DownloadedItem | undefined {
  return downloadedItems(categoryKey).find(item => item.sequence === sequence);
}
