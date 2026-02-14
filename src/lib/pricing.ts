import type { ColorCategory } from '@/types/shelf';

// 색상 카테고리별 추가 요금률 (%) — v1 app.js 이식
const COLOR_CHARGE_RATES: Record<ColorCategory, number> = {
  classic: 0,
  natural: 20,
  solid: 5,
  edgeMix: 10,
};

const PRICE_PER_CM3 = 5; // ₩5/cm³
const DRAWER_SURCHARGE = 15000; // 서랍 1개당 추가
const DOOR_SURCHARGE = 8000; // 도어 1개당 추가

interface PriceInput {
  width: number;
  height: number;
  depth: number;
  colorCategory: ColorCategory;
  doorCount: number;
  drawerCount: number;
  discountRate?: number; // 할인율 (%)
}

export interface PriceResult {
  basePrice: number;       // 기본 가격 (부피 기반)
  colorSurcharge: number;  // 색상 추가금
  hardwareSurcharge: number; // 하드웨어 추가금
  originalPrice: number;   // 할인 전 합계
  discountAmount: number;  // 할인금액
  finalPrice: number;      // 최종 가격
}

export function calculatePrice(input: PriceInput): PriceResult {
  const {
    width,
    height,
    depth,
    colorCategory,
    doorCount,
    drawerCount,
    discountRate = 20,
  } = input;

  // 부피 기반 기본 가격
  const volume = width * height * depth;
  const basePrice = volume * PRICE_PER_CM3;

  // 색상 추가금
  const colorRate = COLOR_CHARGE_RATES[colorCategory];
  const colorSurcharge = Math.round(basePrice * (colorRate / 100));

  // 하드웨어 추가금
  const hardwareSurcharge =
    doorCount * DOOR_SURCHARGE + drawerCount * DRAWER_SURCHARGE;

  // 합계
  const originalPrice = basePrice + colorSurcharge + hardwareSurcharge;

  // 할인
  const discountAmount = Math.round(originalPrice * (discountRate / 100));
  const finalPrice = originalPrice - discountAmount;

  return {
    basePrice,
    colorSurcharge,
    hardwareSurcharge,
    originalPrice,
    discountAmount,
    finalPrice,
  };
}

/**
 * 가격 포맷 (원화)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}
