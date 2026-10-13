import { Material } from 'three';
import { panelEdgeFaces, panelEdgeRole } from '@/lib/optimizer/upstream/editor/shared/viewer3d/utils/panelFinish';
import type { MaterialConfig } from '@/lib/optimizer/upstream/store/core/spaceConfigStore';
import type { PlacedPanel } from '../types';
import type { BandEdge, Point3, ReplayEdgeBand } from './program';

/** 재단 후 원장 축에 맞춘 단면. 가구의 공용 접합면 제외 규칙을 그대로 사용한다. */
export function panelBanding(panel: PlacedPanel, thickness: number, tapeThickness: number, config: MaterialConfig) {
  const name = panel.meshName || panel.name;
  const material = new Material();
  const role = panelEdgeRole(material, panel.isDoor ? '도어' : name);
  material.dispose();
  const color = role === 'door' ? config.doorEdgeColor : config.interiorEdgeColor;
  const omitted: string[] = [];
  if (!color) return { bands: [] as ReplayEdgeBand[], omitted };
  // 곡선·따내기 끝을 직선 밴더가 그대로 덮는 것으로 위장하지 않는다.
  if (panel.cuttingBoardShape?.profile || panel.cuttingBoardShape?.cuts.length || panel.cornerNotch || panel.rebate) {
    omitted.push(`${panel.name}: 이형 외곽 엣지 별도 처리`);
    return { bands: [] as ReplayEdgeBand[], omitted };
  }
  if (/인조대리석|금속|레일|손잡이|경첩|브라켓|브래킷|조절발/.test(`${panel.material} ${name}`)) return { bands: [] as ReplayEdgeBand[], omitted };
  const drawer = /서랍/.test(name) && !/마이다/.test(name);
  const side = /측판|좌측|우측|칸막이/.test(name) && !/도어|door|마이다/i.test(name);
  const horizontal = !drawer && /선반|상판|천판|천지판|하판|지판|바닥/.test(name);
  // 원래 3D 축(x 폭/y 높이/z 깊이) → 옵티마이저의 W/L 축.
  // 서랍 측판은 W=높이/L=깊이, 수평판은 W=깊이/L=폭이다.
  const axes: [number, number] = side ? drawer ? [1, 2] : [2, 1]
    : horizontal ? [2, 0]
    : !panel.isDoor && panel.grain === 'HORIZONTAL' ? [1, 0] : [0, 1];
  const size: Point3 = [thickness, thickness, thickness];
  size[axes[0]] = panel.width; size[axes[1]] = panel.height;
  const faces = panelEdgeFaces(size, name);
  const bands: ReplayEdgeBand[] = [];
  for (const face of faces) {
    const axis = Math.floor(face / 2), positive = face % 2 === 0;
    let local = axes.indexOf(axis);
    if (local < 0) continue;
    // 일반 원장 회전은 도면·보링과 같은 축 교환 계약이다.
    if (panel.rotated) local = 1 - local;
    const edge: BandEdge = local === 0 ? positive ? 'right' : 'left' : positive ? 'top' : 'bottom';
    // 측면 보링과 목찬넬 따내기는 부착 후 테이프/심재를 함께 절삭한다.
    bands.push({ edge, color, thickness: tapeThickness });
  }
  return { bands, omitted };
}
