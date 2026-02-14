'use client';

import { useMemo } from 'react';
import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { calculatePrice, formatPrice } from '@/lib/pricing';
import type { ColorCategory } from '@/types/shelf';

export function PriceDisplay() {
  const width = useShelfStore((s) => s.width);
  const height = useShelfStore((s) => s.height);
  const depth = useShelfStore((s) => s.depth);
  const colorCategory = useMaterialStore((s) => s.colorCategory);
  const doorsCreatedLayers = useHardwareStore((s) => s.doorsCreatedLayers);
  const drawersCreatedLayers = useHardwareStore((s) => s.drawersCreatedLayers);

  const priceResult = useMemo(() => {
    return calculatePrice({
      width,
      height,
      depth,
      colorCategory: colorCategory as ColorCategory,
      doorCount: doorsCreatedLayers.length,
      drawerCount: drawersCreatedLayers.length,
      discountRate: 20,
    });
  }, [width, height, depth, colorCategory, doorsCreatedLayers.length, drawersCreatedLayers.length]);

  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-gray-500 line-through">
          {formatPrice(priceResult.originalPrice)}
        </span>
        <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">
          20%
        </span>
      </div>
      <div className="text-xl font-bold">
        {formatPrice(priceResult.finalPrice)}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Made in KR · Ships in 5-6 weeks
      </p>
    </div>
  );
}
