/**
 * 다운로드 상품(R6 manifest)의 CSV 카테고리 ↔ 비펀 카탈로그 경로.
 * slug는 /furniture-c/<slug>, query는 같은 페이지의 필터(옷장 종류·벽걸이). 전체 상품은 slug ''.
 */
export interface DownloadedCategory { csv: string; slug: string; query?: Record<string, string>; key: string }

export const DOWNLOADED_CATEGORIES: readonly DownloadedCategory[] = [
  { csv: '전체 상품', slug: '', key: 'all' },
  { csv: '수납 가구 전체', slug: 'storage', key: 'storage' },
  { csv: '사이드보드', slug: 'sideboard', key: 'sideboard' },
  { csv: '벽걸이 수납장', slug: 'sideboard', query: { features: 'hanging' }, key: 'hanging' },
  { csv: '책장', slug: 'bookcase', key: 'bookcase' },
  { csv: '선반 시스템', slug: 'wallstorage', key: 'wallstorage' },
  { csv: '벽면 수납장', slug: 'wallunits', key: 'wallunits' },
  { csv: '책상', slug: 'desk', key: 'desk' },
  { csv: 'TV 수납장', slug: 'tv-stand', key: 'tv-stand' },
  { csv: '서랍장', slug: 'chest-of-drawers', key: 'chest-of-drawers' },
  { csv: '화장대', slug: 'dressing_table', key: 'dressing_table' },
  { csv: '신발장', slug: 'shoerack', key: 'shoerack' },
  { csv: '협탁', slug: 'bedside_table', key: 'bedside_table' },
  { csv: '레코드 수납장', slug: 'vinyl_storage', key: 'vinyl_storage' },
  { csv: '옷장 전체', slug: 'wardrobe', key: 'wardrobe' },
  { csv: '닫힌 옷장', slug: 'wardrobe', query: { types: 'fullyClosed' }, key: 'wardrobe-closed' },
  { csv: '반개방 옷장', slug: 'wardrobe', query: { types: 'partiallyOpen' }, key: 'wardrobe-partial' },
  { csv: '오픈 옷장', slug: 'wardrobe', query: { types: 'fullyOpen' }, key: 'wardrobe-open' },
  { csv: '서랍형 옷장', slug: 'wardrobe', query: { features: 'internalDrawers' }, key: 'wardrobe-drawers' },
  { csv: '소파 전체', slug: 'sofas', key: 'sofas' },
  { csv: '2인 소파', slug: 'two_seater', key: 'two_seater' },
  { csv: '3인 소파', slug: 'three_seater', key: 'three_seater' },
  { csv: '대형 소파', slug: 'four_plus_seater', key: 'four_plus_seater' },
  { csv: '코너 소파', slug: 'corner_sofas', key: 'corner_sofas' },
  { csv: '모듈형 대형 소파', slug: 'modular_sofas', key: 'modular_sofas' },
  { csv: '암체어', slug: 'armchairs', key: 'armchairs' },
  { csv: '오토만과 모듈', slug: 'ottomans_and_modules', key: 'ottomans_and_modules' },
  { csv: '커버와 쿠션', slug: 'covers', key: 'covers' },
  { csv: '생활 소품 전체', slug: 'accessories', key: 'accessories' },
  { csv: '담요', slug: 'blankets', key: 'blankets' },
  { csv: '북엔드', slug: 'bookends', key: 'bookends' },
];

/** 현재 목록 페이지(slug + 쿼리)에 해당하는 CSV 카테고리. 필터 쿼리가 맞는 하위 분류를 우선 */
export function downloadedCategoryFor(slug: string, query: Record<string, string>): DownloadedCategory | undefined {
  const candidates = DOWNLOADED_CATEGORIES.filter(category => category.slug === slug);
  const specific = candidates.find(category => category.query && Object.entries(category.query).every(([key, value]) => query[key] === value));
  return specific ?? candidates.find(category => !category.query);
}

export const downloadedCategoryByKey = (key: string) => DOWNLOADED_CATEGORIES.find(category => category.key === key);
