'use client';

import { useMemo } from 'react';
import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { calculatePrice, formatPrice } from '@/lib/pricing';
import { calculateGridPanels } from '@/lib/three/styles/grid';
import { calculateSlantPanels } from '@/lib/three/styles/slant';
import { calculatePixelPanels } from '@/lib/three/styles/pixel';
import { calculateGradientPanels } from '@/lib/three/styles/gradient';
import { calculatePatternPanels } from '@/lib/three/styles/pattern';
import { calculateMosaicPanels } from '@/lib/three/styles/mosaic';
import type { ColorCategory } from '@/types/shelf';

interface PriceDisplayProps {
  /** 모바일 하단 구매 바용 한 줄 요약 표시 */
  compact?: boolean;
}

export function PriceDisplay({ compact = false }: PriceDisplayProps = {}) {
  const width = useShelfStore((s) => s.width);
  const height = useShelfStore((s) => s.height);
  const depth = useShelfStore((s) => s.depth);
  const thickness = useShelfStore((s) => s.thickness);
  const style = useShelfStore((s) => s.style);
  const density = useShelfStore((s) => s.density);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const numRows = useShelfStore((s) => s.numRows);
  const hasBackPanel = useShelfStore((s) => s.hasBackPanel);
  const colorCategory = useMaterialStore((s) => s.colorCategory);
  const doorsCreatedLayers = useHardwareStore((s) => s.doorsCreatedLayers);
  const drawersCreatedLayers = useHardwareStore((s) => s.drawersCreatedLayers);
  const hardwareRowStyles = useHardwareStore((s) => s.rowStyles);

  const hardwareLayers = useMemo(() => {
    const layers = new Set<number>();
    doorsCreatedLayers.forEach((l) => layers.add(l));
    drawersCreatedLayers.forEach((l) => layers.add(l));
    return Array.from(layers);
  }, [doorsCreatedLayers, drawersCreatedLayers]);

  const priceResult = useMemo(() => {
    // v1 방식: 실제 패널 부피 합산
    const input = { width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel, hardwareLayers, hardwareRowStyles,
      family: colorCategory === 'classic' || colorCategory === 'natural' ? 'type01' as const : 'type02' as const };
    let panels;
    switch (style) {
      case 'grid':
        panels = calculateGridPanels(input).panels;
        break;
      case 'slant':
        panels = calculateSlantPanels(input).panels;
        break;
      case 'pixel':
        panels = calculatePixelPanels(input).panels;
        break;
      case 'gradient':
        panels = calculateGradientPanels(input).panels;
        break;
      case 'pattern':
        panels = calculatePatternPanels(input).panels;
        break;
      case 'mosaic':
        panels = calculateMosaicPanels(input).panels;
        break;
      default:
        panels = calculateGridPanels(input).panels;
    }

    const totalPanelVolume = panels.reduce((sum, p) => sum + p.w * p.h * p.d, 0);

    return calculatePrice({
      totalPanelVolume,
      colorCategory: colorCategory as ColorCategory,
    });
  }, [width, height, depth, thickness, style, density, rowHeights, numRows, hasBackPanel, hardwareLayers, hardwareRowStyles, colorCategory]);

  const saveAmount = priceResult.originalPrice - priceResult.finalPrice;

  if (compact) {
    return (
      <div className="leading-tight">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-[#aaa] line-through">{formatPrice(priceResult.originalPrice)}</span>
          <span className="font-semibold text-[var(--green)]">{priceResult.discountRate}%</span>
        </div>
        <p className="text-[19px] font-bold tabular-nums text-[#111]">{formatPrice(priceResult.finalPrice)}</p>
      </div>
    );
  }

  return (
    <div className="py-0.5">
      {/* Line 1: original price + save badge */}
      <div className="flex items-center gap-1.5 text-[12px]">
        <span className="text-[#aaa] line-through">
          {formatPrice(priceResult.originalPrice)}
        </span>
        <span className="text-[#ccc]">|</span>
        <span className="font-medium text-[var(--green)]">
          {formatPrice(saveAmount)} 할인
        </span>
      </div>
      {/* Line 2: final price + lowest price notice */}
      <div className="mt-0.5 flex items-end gap-2">
        <p className="text-[22px] font-bold leading-tight text-[var(--green)]">
          {formatPrice(priceResult.finalPrice)}
        </p>
        <p className="pb-[2px] text-[11px] text-[#bbb]">
          최근 30일 최저가
        </p>
      </div>
    </div>
  );
}
