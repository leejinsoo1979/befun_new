import { collectManufacturingBlock } from '@/lib/optimizer/upstream/domain/boring/manufacturingBlock';
import { rebateRouting } from './rebateRouting';
import type { PlacedPanel } from '../types';
import { convertPlacedPanelToMprBoringData } from '../utils/mprPanelConversion';
import { isFurnitureSidePanelName } from '@/lib/optimizer/upstream/utils/cnc/optimizerMachiningGeometry';
import { MILL_FACE_DIRECTION, type MillFace, type Point3 } from './program';

const faceOfDirection = (d: Point3): MillFace => (Object.entries(MILL_FACE_DIRECTION) as Array<[MillFace, Point3]>)
  .find(([, v]) => v.every((c, i) => Math.abs(c - d[i]) < 1e-6))?.[0] ?? 'left';
import { referenceRouting, routingPaths, type RoutingOptions } from './routingPaths';

/** MPR 원본을 읽는 경계. 드릴 규칙·직경·깊이를 시뮬레이터에서 따로 만들지 않는다. */
export function panelMachining(panel: PlacedPanel, thickness: number, routing: RoutingOptions = referenceRouting) {
  const data = convertPlacedPanelToMprBoringData({ ...panel, thickness: panel.thickness ?? thickness });
  const swap = panel.manufacturingBoring
    ? Math.abs(data.width - panel.width) > 1e-6 && Math.abs(data.width - panel.height) < 1e-6
    : !panel.cuttingBoardShape && (isFurnitureSidePanelName(panel.name) || (!panel.isDoor && !!panel.sideBoringPositions?.length));
  if (Math.abs(data.width - (swap ? panel.height : panel.width)) > 1e-6
    || Math.abs(data.height - (swap ? panel.width : panel.height)) > 1e-6
    || Math.abs(data.thickness - thickness) > 1e-6) throw new Error(`${panel.name}: 가공 원본과 재단 판재 치수가 다릅니다.`);
  const map = (p: Point3, direction = false): Point3 => {
    let [x, y] = p;
    const z = p[2];
    // 일반 원장 도면은 축 교환으로 배치한다(sheetDrawing / panelPreviewShape).
    // 여기서 90도 회전까지 더하면 측판 앞/뒤 홈·노치가 도면 반대편으로 간다.
    if (swap) [x, y] = [y, x];
    if (panel.rotated) [x, y] = panel.cuttingBoardShape ? [direction ? -y : panel.height - y, x] : [y, x];
    return [x, y, z];
  };
  const hold = collectManufacturingBlock([panel]);
  const omitted: string[] = hold.blocked ? [`${panel.name}: 제조 보류 — ${hold.reasons.join(' · ')}`] : [];
  const holes = data.borings.flatMap(b => {
    if (b.type === 'drawer-rail-slot' || b.slotWidth || b.slotHeight) { omitted.push(`${panel.name}: ${b.id} 장공`); return []; }
    // [Befun 확장] 하면 보링은 반전 재고정 뒤 가공한다(panelSawProcess). 종전에는 생략했다.
    const direction: Point3 = b.face === 'left' ? [1, 0, 0] : b.face === 'right' ? [-1, 0, 0]
      : b.face === 'front' ? [0, 1, 0] : b.face === 'back' ? [0, -1, 0] : b.face === 'bottom' ? [0, 0, 1] : [0, 0, -1];
    const surface: Point3 = [b.x, b.y, b.face === 'top' ? thickness : b.face === 'bottom' ? 0 : (b.z ?? thickness / 2)];
    if (![...surface, b.diameter, b.depth].every(Number.isFinite) || b.diameter <= 0 || b.depth <= 0
      || surface[2] < 0 || surface[2] > thickness
      || b.x < 0 || b.x > data.width || b.y < 0 || b.y > data.height) throw new Error(`${panel.name}: ${b.id} 보링 좌표가 유효하지 않습니다.`);
    return [{ id: b.id, diameter: b.diameter, depth: b.depth, surface: map(surface), direction: map(direction, true), face: b.face }];
  });
  const routes = routingPaths(data, map, routing);
  routes.push(...rebateRouting(panel, thickness, routing));
  // [Befun 확장] 커넥터 키홀 슬롯: 상·하면은 루터 경로(한 번에 전체 깊이), 마구리는 앵글헤드 경로.
  const edgeSlots: Array<{ id: string; label: string; diameter: number; depth: number; from: Point3; to: Point3; direction: Point3; face: MillFace }> = [];
  for (const s of data.connectorSlots ?? []) {
    const label = `커넥터 ${s.connector} ${s.label ?? '슬롯'}`;
    if (s.face === 'top' || s.face === 'bottom') {
      const z = s.face === 'top' ? thickness : 0;
      routes.push({ id: s.id, label, operation: 'groove', face: s.face, diameter: s.width, depth: s.depth,
        paths: [[map([s.x1, s.y1, z]), map([s.x2, s.y2, z])]], singlePass: true, plunge: true });
      continue;
    }
    const z = s.z ?? thickness / 2;
    const direction = map(MILL_FACE_DIRECTION[s.face], true);
    edgeSlots.push({ id: s.id, label, diameter: s.width, depth: s.depth, from: map([s.x1, s.y1, z]), to: map([s.x2, s.y2, z]), direction, face: faceOfDirection(direction) });
  }
  if (panel.cornerNotch || (panel.rebate && panel.rebate.position !== 'bottom-both-sides')) omitted.push(`${panel.name}: 별도 모서리·턱 가공`);
  return { data, holes, routes, edgeSlots, omitted };
}
