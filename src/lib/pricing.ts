import type { ColorCategory } from '@/types/shelf';

// v1 app.js 기준 가격 로직 이식
const PRICE_PER_UNIT3 = 8; // ₩8 per unit³ (3D 좌표 = cm)
const ADD_CHARGE_RATE = 20; // 커스텀 색상 추가금률 (%)
const DISCOUNT_RATE = 20; // 할인율 (%)

/**
 * v1 기준: classic/natural은 기본, solid/edgeMix는 커스텀(+20%)
 */
function isCustomColor(category: ColorCategory): boolean {
  return category === 'solid' || category === 'edgeMix';
}

interface PriceInput {
  totalPanelVolume: number; // 패널 부피 합산 (w×h×d per panel)
  colorCategory: ColorCategory;
}

export interface PriceResult {
  originalPrice: number; // 할인 전 (1000원 단위 반올림 후)
  discountRate: number; // 할인율 (%)
  finalPrice: number; // 최종 가격
}

export function calculatePrice(input: PriceInput): PriceResult {
  const { totalPanelVolume, colorCategory } = input;

  // 기본 가격 = 패널 부피 합산 × 8
  let originalPrice = totalPanelVolume * PRICE_PER_UNIT3;

  // 커스텀 색상이면 +20%
  if (isCustomColor(colorCategory)) {
    originalPrice = originalPrice + originalPrice * (ADD_CHARGE_RATE / 100);
  }

  // 1000원 단위 반올림
  originalPrice = Math.round(originalPrice / 1000) * 1000;

  // 할인 계산
  let finalPrice = originalPrice - originalPrice * (DISCOUNT_RATE / 100);
  // 10원 단위 반올림
  finalPrice = Math.round(finalPrice / 10) * 10;

  return {
    originalPrice,
    discountRate: DISCOUNT_RATE,
    finalPrice,
  };
}

/**
 * 가격 포맷 (원화)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}
