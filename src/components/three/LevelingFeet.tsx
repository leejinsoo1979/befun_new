'use client';

import { footPanelIndex } from './display/assemblyPlan';
import type { PanelData } from '@/types/shelf';
import { calculateCabinetFeet, calculateShortFeet } from '@/lib/three/reference-feet';
import { matchingCatalogPreset } from '@/lib/three/catalog-presets';
import { useMemo } from 'react';
import { useShelfStore } from '@/stores/useShelfStore';

import { LevelingFoot } from './LevelingFoot';

/** Feet follow the rendered bottom structure, including non-uniform styles. */
export function LevelingFeet({ panels, panelIndex }: { panels: PanelData[]; panelIndex?: number }) {
  const depth = useShelfStore((s) => s.depth);
  const style = useShelfStore((s) => s.style);
  const isCabinet = useShelfStore(s => matchingCatalogPreset(s)?.sourceType === 'watty');
  const footPositions = useMemo(() => isCabinet ? calculateCabinetFeet(panels)
    : calculateShortFeet(panels, depth, style === 'mosaic' || style === 'pixel'),
    [panels, depth, style, isCabinet]);
  const bottoms = panels.filter(p => p.matType === 'horizontalBase');
  const footHeight = isCabinet && bottoms.length ? Math.min(...bottoms.map(p => p.y - p.h / 2)) + 1 : 1;
  return <group>{footPositions.filter(position => panelIndex === undefined || footPanelIndex(panels, position) === panelIndex).map((position, index) => <LevelingFoot key={index} position={position} height={footHeight} />)}</group>;
}
