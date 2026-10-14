import type { PanelData, StyleType } from '@/types/shelf';

export type FurnitureBaseType = 'standard' | 'legs';
/** 'panel' = 다리를 선반 패널 재질과 같은 색으로 (Classic 전용). Natural에서는 silver로 표시 */
export type FurnitureLegFinish = 'silver' | 'black' | 'panel';
export const LEG_FINISHES: readonly FurnitureLegFinish[] = ['silver', 'black', 'panel'];

/** Existing body coordinates include both horizontal boards. The raised option adds 100mm. */
export function baseHeight(base: FurnitureBaseType = 'standard'): number {
  return base === 'legs' ? 11 : 1;
}

// The optional legacy color argument is accepted for existing consumers; all finishes now support legs.
export function supportsLongLegs(depth: number, style: StyleType, color?: string): boolean;
export function supportsLongLegs(depth: number, style: StyleType): boolean {
  return depth > 24 && style !== 'pixel';
}

export interface FurnitureLegPlacement {
  position: [number, number, number];
  rotationY: number;
}

/**
 * General column support rule, expressed in cm. Actual bottom vertical axes are
 * used, never uniformly-spaced feet. Product DNA overrides are not represented.
 * See hardware-leg-placement-001.md for observed rules and remaining limits.
 */
export function planFurnitureLegs(panels: PanelData[], depth: number, style: StyleType): FurnitureLegPlacement[] {
  const horizontal = panels.filter(p => p.matType === 'horizontalBase');
  if (!horizontal.length) return [];
  const bottom = Math.min(...horizontal.map(p => p.y - p.h / 2));
  const bases = horizontal.filter(p => Math.abs(p.y - p.h / 2 - bottom) < 0.001);
  const axes = [...new Set(panels.filter(p => p.matType === 'verticalBase' && bases.some(b =>
    Math.abs(p.y - p.h / 2 - b.y - b.h / 2) < 0.001))
    .map(p => Math.round(p.x * 1e6) / 1e6))].sort((a,b) => a-b);
  if (axes.length < 2) return [];
  const left = axes[0], right = axes[axes.length-1];
  const widths = axes.slice(1).map((x,i) => x-axes[i]);
  const n = widths.length;
  const supports = new Set<number>([left,right]);
  if (style === 'grid' && (right-left)/n*2 <= 90) {
    if (n % 2 === 0) {
      for (let i=2;i<n;i+=2) supports.add(axes[i]);
    } else {
      for (let i=Math.floor(n/2);i>0;i-=2) supports.add(axes[i]);
      for (let i=Math.ceil(n/2);i<n;i+=2) supports.add(axes[i]);
    }
  } else {
    let accumulated = 0;
    for (let i=0;i<=Math.min(n-1,Math.round(n/2));i++) {
      accumulated += widths[i];
      if (accumulated >= 90 && i>0 && right-left>=90) { supports.add(axes[i]); accumulated=widths[i]; }
      if (widths[i]>=90) supports.add((axes[i]+axes[i+1])/2);
    }
    accumulated=0;
    for (let i=n-1;i>=Math.max(0,Math.floor(n/2)-1);i--) {
      accumulated+=widths[i];
      if (accumulated>=90 && i<n-1 && right-left>=90) { supports.add(axes[i+1]); accumulated=widths[i]; }
      if (widths[i]>=90) supports.add((axes[i]+axes[i+1])/2);
    }
  }
  const aligned = [...new Set([...supports].map(x => axes.reduce((best,axis) => Math.abs(axis-x)<Math.abs(best-x) ? axis : best, axes[0])))].sort((a,b)=>a-b);
  // The two directional scans can leave a large gap around the centre in an
  // asymmetric layout. Fill that gap using existing bearing axes, never an
  // invented point inside an open compartment. Keep the original supports.
  const bearingAxes: number[] = [];
  for (const target of aligned) {
    let previous = bearingAxes[bearingAxes.length - 1];
    while (previous !== undefined && target - previous > 90 + 1e-6) {
      const candidates = axes.filter(axis => axis > previous + 1e-6 && axis < target - 1e-6);
      if (!candidates.length) break; // A single wide bay has no intermediate vertical to support.
      const withinSpan = candidates.filter(axis => axis - previous <= 90 + 1e-6);
      previous = withinSpan[withinSpan.length - 1] ?? candidates[0];
      bearingAxes.push(previous);
    }
    bearingAxes.push(target);
  }
  return bearingAxes.flatMap((x,i) => [0.9,depth-0.9].map((z,j) => ({
    position:[x,bottom-baseHeight('legs'),z] as [number,number,number],
    // Asset's own +Y135° is included in its node. Only the placement rotation follows here.
    rotationY:(i===0 ? (j===0 ? 90 : 180) : i===bearingAxes.length-1 ? (j===0 ? 0 : -90) : (j===0 ? 45 : -135))*Math.PI/180,
  })));
}
