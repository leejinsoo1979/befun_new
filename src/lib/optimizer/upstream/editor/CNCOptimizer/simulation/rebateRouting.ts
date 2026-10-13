import type { PlacedPanel } from '../types';
import type { Point3 } from './program';
import type { RoutingFeature, RoutingOptions } from './routingPaths';

/** 변환기가 전달한 좌우 축으로 절삭한다. 축 없는 옛 데이터는 기존 W=깊이/L=폭을 유지한다. */
export function rebateRouting(panel: PlacedPanel, thickness: number, options: RoutingOptions): RoutingFeature[] {
  const rebate = panel.rebate;
  if (!rebate || rebate.position !== 'bottom-both-sides') return [];
  const acrossX = rebate.acrossAxis === 'x';
  const width = acrossX ? panel.width : panel.height;
  const length = acrossX ? panel.height : panel.width;
  if (![width, length, thickness, rebate.width, rebate.height, options.diameter].every(v => Number.isFinite(v) && v > 0)
    || rebate.width * 2 >= width || rebate.height >= thickness) throw new Error(`${panel.name}: 반턱 폭·제거 높이가 판재 범위를 벗어납니다.`);
  const diameter = Math.min(options.diameter, rebate.width);
  const count = Math.max(2, Math.ceil(rebate.width / diameter) + 1);
  const point = (along: number, across: number): Point3 => acrossX !== panel.rotated ? [across, along, 0] : [along, across, 0];
  return [false, true].map(right => ({
    id: `base-rebate-${right ? 'right' : 'left'}`, label: `${right ? '우측' : '좌측'} 밑판 하면 반턱`,
    operation: 'groove', face: 'bottom', diameter, depth: rebate.height,
    paths: Array.from({ length: count }, (_, i) => {
      const inset = (rebate.width - diameter / 2) * i / (count - 1);
      const across = right ? width - inset : inset;
      return [point(-diameter, across), point(length + diameter, across)];
    }),
  }));
}
