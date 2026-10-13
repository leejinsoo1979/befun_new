import type { DoorPlacement } from '../hardware';
import type { PanelData } from '@/types/shelf';

/** All manufacturing values are mm; renderer placement input is cm. */
export const BLUM_INSET = {
  hinge: '71B3790', plate: '174H7100E', application: 'inset',
  cupDiameter: 35, cupDepth: 13, fixingDiameter: 8, fixingDepth: 13,
  fixingPitch: 45, fixingOffset: 9.5,
  plateDiameter: 5, plateDepth: 11.5, platePitch: 32, plateSetback: 37,
  insetSetbackAllowance: 1.5, plateSpacing: 0,
  // Project drilling datum, not a universal Blum hinge quantity recommendation.
  endMargin: 50,
  sources: [
    'https://publications.blum.com/2024/catalogue/en/76/',
    'https://publications.blum.com/2024/catalogue/en/77/',
    'https://publications.blum.com/2024/catalogue/en/152/',
    'https://d2.blum.com/services/BEC003/clp0001-td-032_td_dok_bau_$sen_$aof_$v4.pdf',
    'https://shop-ua.blum.com/catalog/clip-montazhni-planky/174h7100edueplv500ni',
  ],
} as const;
export type Point = [number, number, number];
export interface Bore {
  id: string;
  kind: 'cup' | 'cup-fixing' | 'plate-fixing';
  /** Surface centre relative to the board centre, in mm. */
  center: Point;
  /** Unit inward drilling direction, in the board's XYZ frame. */
  direction: Point;
  diameter: number;
  depth: number;
}
export interface HingeMount {
  panelIndex: number;
  /** Body mounting face, cm in shelf coordinates. */
  position: Point;
  inwardSign: 1 | -1;
  holes: Bore[];
}
export interface BlumDoorPlan {
  hinge: typeof BLUM_INSET.hinge;
  plate: typeof BLUM_INSET.plate;
  holes: Bore[];
  /** Cup centres in door-centred mm coordinates, on rear face. */
  cups: Point[];
  mounts: HingeMount[];
  issues: string[];
  drillingDistance: number | null;
  thickness: number;
  side: 'left' | 'right';
}
const rounded = (v: number) => Math.round(v * 1e6) / 1e6;

export function createBlumDoorPlan(door: DoorPlacement, panels: PanelData[], fallbackThickness: number): BlumDoorPlan {
  const side = door.reference?.hingeSide ?? 'right';
  const direction = side === 'left' ? 1 : -1;
  const thickness = (door.reference?.thickness ?? fallbackThickness) * 10;
  const width = door.width * 10, height = door.height * 10;
  const cx = door.x + door.pivotOffsetX;
  const cy = door.y + (door.reference?.frontOffsetY ?? 0);
  const edge = cx - direction * door.width / 2;
  const result: BlumDoorPlan = { hinge: BLUM_INSET.hinge, plate: BLUM_INSET.plate, holes: [], cups: [], mounts: [], issues: [], drillingDistance: null, thickness, side };
  if (thickness < 16 || thickness > 24 || height < 157 || width < 70) {
    result.issues.push('선택한 경첩의 검증 범위는 두께16–24mm, 도어 폭70mm 이상·높이157mm 이상입니다.');
    return result;
  }
  // Only install against an actual side panel, never an imaginary compartment wall.
  const candidates = panels.map((p, index) => ({ p, index,
    faceX: p.x + direction * p.w / 2,
    gap: rounded(direction * (edge - (p.x + direction * p.w / 2)) * 10),
  })).filter(({p, gap}) => (p.matType === 'verticalBase' || p.matType === 'verticalEdge') &&
    gap >= 0 && gap <= 4 && Math.abs(cy - p.y) < p.h / 2 &&
    Math.abs(door.z + thickness / 20 - (p.z + p.d / 2)) < .2)
    .sort((a,b) => a.gap - b.gap);
  const wall = candidates[0];
  if (!wall) { result.issues.push('인셋 경첩을 설치할 실제 측판과 0–4mm 문틈을 확인할 수 없습니다.'); return result; }
  // Blum inset / MD=0 table: TB 3..7 => overlay -4..0 (gap 4..0).
  const tb = rounded(7 - wall.gap);
  // Conservative bound over the official R1 edge table (TB 3–7), plus 0.2mm.
  // This prevents zero-gap inset fronts from being treated as a buildable fit.
  const minimumGaps = [[16,.5],[18,.8],[19,1],[20,1.2],[21,1.5],[22,1.8],[23,2.2],[24,2.7]];
  const minimumGap = minimumGaps.find(([t]) => t >= thickness)![1] + .2;
  if(wall.gap < minimumGap) {result.issues.push('도어 두께에 필요한 경첩측 여유 간격이 부족합니다.');return result;}
  result.drillingDistance = tb;
  const cupX = -direction * (width / 2 - tb - BLUM_INSET.cupDiameter / 2);
  const frontZ = door.z + thickness / 20;
  const mountingZ = frontZ - (BLUM_INSET.plateSetback + thickness + BLUM_INSET.insetSetbackAllowance) / 10;
  const ys = [height / 2 - BLUM_INSET.endMargin, -height / 2 + BLUM_INSET.endMargin];
  if (height > 600 || width > 600) result.issues.push('600mm를 넘는 도어는 무게에 따른 경첩 수·간격 검토가 필요합니다.');
  ys.forEach((y, i) => {
    const center: Point = [cupX, y, -thickness / 2];
    result.cups.push(center);
    result.holes.push({ id:`hinge-${i}-cup`, kind:'cup', center, direction:[0,0,1], diameter:35, depth:13 });
    for (const sign of [-1, 1]) result.holes.push({ id:`hinge-${i}-fix-${sign}`, kind:'cup-fixing',
      center:[cupX + direction * BLUM_INSET.fixingOffset, y + sign * BLUM_INSET.fixingPitch / 2, -thickness / 2], direction:[0,0,1], diameter:8, depth:13 });
    const worldY = cy + y / 10;
    const p = wall.p;
    const holes: Bore[] = [-1,1].map(sign => ({ id:`hinge-${i}-plate-${sign}`, kind:'plate-fixing',
      center:[direction * p.w * 5, (worldY - p.y) * 10 + sign * 16, (mountingZ - p.z) * 10],
      direction:[-direction,0,0], diameter:5, depth:11.5 }));
    result.mounts.push({ panelIndex:wall.index, position:[wall.faceX,worldY,mountingZ], inwardSign:direction as 1|-1, holes });
    if (p.w * 10 < 13.5 || holes.some(h => Math.abs(h.center[1]) + 2.5 >= p.h * 5 || Math.abs(h.center[2]) + 2.5 >= p.d * 5))
      result.issues.push('측판 보링의 가장자리 또는 잔여 두께가 부족합니다.');
  });
  if (result.issues.some(s => s.startsWith('측판'))) { result.holes = []; result.cups = []; result.mounts = []; }
  return result;
}

export function createBlumShelfPlans(doors: DoorPlacement[], panels: PanelData[], thickness: number): BlumDoorPlan[] {
  const plans = doors.map(d => createBlumDoorPlan(d, panels, thickness));
  // Opposite-face holes in a shared thin divider must not silently merge.
  for (let i=0; i<plans.length; i++) for (let j=i+1; j<plans.length; j++) {
    for (const a of plans[i].mounts) for (const b of plans[j].mounts) {
      if (a.panelIndex !== b.panelIndex) continue;
      const collision = a.holes.some(ha => b.holes.some(hb => Math.hypot(ha.center[1]-hb.center[1],ha.center[2]-hb.center[2]) < (ha.diameter+hb.diameter)/2 &&
        (a.inwardSign === b.inwardSign || ha.depth+hb.depth >= panels[a.panelIndex].w*10)));
      if (collision) for (const plan of [plans[i],plans[j]]) plan.issues.push('공유 측판의 경첩 고정홀이 겹칩니다. 경첩 높이 또는 플레이트 조합 조정이 필요합니다.');
    }
  }
  return plans;
}
