import type { Boring, PanelBoringData } from '@/lib/optimizer/upstream/domain/boring/types';
import { resolveManufacturingPanelKind } from '@/lib/optimizer/upstream/domain/boring/manufacturingFrame';
import type { Panel } from '../types';

const unique = (values: number[]) => [...new Set(values)].sort((a, b) => a - b);

/**
 * 저장된 제조 좌표를 CNC 표시 배열로 역변환한다. 가공 규칙을 다시 계산하지 않는다.
 * MPR 자체는 manufacturingBoring을 사용하며, 이 필드는 기존 CNC 화면/도면의 입력이다.
 */
export function manufacturingBoringToDisplayFields(data: PanelBoringData): Partial<Panel> {
  const kind = resolveManufacturingPanelKind(data);
  const faceHoles = data.borings.filter(h => h.face === 'top');
  if (kind === 'door' || kind === 'door-left-origin') {
    const cups = faceHoles.filter(h => h.type === 'hinge-cup');
    const screws = faceHoles.filter(h => h.type === 'hinge-screw');
    // toMprDoorPoint가 이름에 '좌측'인 도어만 X를 거울로 내보낸다.
    const x = (h: Boring) => kind === 'door-left-origin' ? data.width - h.x : h.x;
    return {
      isDoor: true,
      boringPositions: unique(cups.map(h => data.height - h.y)),
      boringDepthPositions: unique(cups.map(x)),
      screwPositions: unique(screws.map(h => data.height - h.y)),
      screwDepthPositions: unique(screws.map(x)),
      boringDepthGroups: [],
      sideBoringPositions: [],
      isBracketSide: false,
      bracketBoringPositions: [],
      bracketBoringDepthPositions: [],
    };
  }
  if (kind === 'side-left' || kind === 'side-right' || kind === 'drawer-side-left' || kind === 'drawer-side-right') {
    const drawer = kind.startsWith('drawer-side');
    const shelfHoles = faceHoles.filter(h => drawer ? h.type === 'drawer-panel-connector' : h.type === 'shelf-pin');
    const yOf = (h: Boring) => drawer ? h.x : data.width - h.x;
    const depthOf = (h: Boring) => kind === 'side-right' ? data.height - h.y : h.y;
    const rows = unique(shelfHoles.map(yOf)).map(y => {
      const holes = shelfHoles.filter(h => yOf(h) === y);
      return { y, depthPositions: unique(holes.map(depthOf)), boringType: holes.some(h => h.note === 'fixed-panel-through') ? 'fixed-panel' as const : 'movable-shelf' as const };
    });
    const brackets = faceHoles.filter(h => h.type === 'hinge-screw');
    return {
      isDoor: false,
      boringPositions: rows.map(r => r.y),
      boringDepthPositions: unique(shelfHoles.map(depthOf)),
      boringDepthGroups: rows,
      isBracketSide: brackets.length > 0,
      bracketBoringPositions: unique(brackets.map(h => data.width - h.x)),
      // 브래킷 입력은 앞끝 이격이다. 우측의 뒤→앞 제조 축을 입력 축으로 되돌린다.
      bracketBoringDepthPositions: unique(brackets.map(depthOf)),
      screwPositions: [],
      screwDepthPositions: [],
    };
  }
  if (kind === 'horizontal' || kind === 'rear-reinforcement') {
    const side = data.borings.filter(h => h.type === 'shelf-pin' && (h.face === 'left' || h.face === 'right'));
    return {
      sideBoringPositions: unique(side.map(h => h.y)),
      sideBoringDiameter: side[0]?.diameter,
      sideBoringDepth: side[0]?.depth,
    };
  }
  return {};
}
