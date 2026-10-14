import type { WardrobeSourcePart } from './wardrobe/source-types';

/** Visual source envelopes in mm. Not drilling/manufacturing specifications. */
export interface WardrobeHingeDoor extends WardrobeSourcePart {
  direction: 1 | 2;
  /** Required Tone clearance offsets from the pre-render source stage. */
  offset?: { top: number; bottom: number };
}
export interface WardrobeHingeEnvelope extends WardrobeSourcePart { direction: 1 | 2 }
export interface WardrobeHingeSource {
  doors: WardrobeHingeDoor[];
  /** Standard shelves BEFORE later trim/removal/thickness adjustments. */
  standardShelves: WardrobeSourcePart[];
  drawers: WardrobeSourcePart[];
}
export interface WardrobeHingePlacement {
  asset: 'hingeWing' | 'hingeAnchor';
  sourceIndex: number;
  /** Closed-pose world coordinates in cm, before any overall furniture translation. */
  position: [number, number, number];
  rotationZ: number;
  /** Only wings rotate with the selected door. Anchors remain attached to walls. */
  doorIndex: number | null;
  wallIndex: number | null;
}

const HEIGHT = 41;
const sameChannel = (a: WardrobeSourcePart, b: WardrobeSourcePart) => a.m_config_id === b.m_config_id;
const containedY = (a: WardrobeSourcePart, b: WardrobeSourcePart) => a.y1 >= b.y1 && a.y2 <= b.y2;
const centerY = (part: WardrobeSourcePart) => (part.y1 + part.y2) / 2;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
function envelope(door: WardrobeHingeDoor, y: number, edge: boolean): WardrobeHingeEnvelope {
  const inset = edge ? 0 : 9;
  const x1 = door.direction === 2 ? door.x2 - inset - 39 : door.x1 + inset;
  return { x1, x2: x1 + 39, y1: y - HEIGHT / 2, y2: y + HEIGHT / 2,
    z1: door.z1 - 64, z2: door.z1, direction: door.direction, m_config_id: door.m_config_id };
}

/** Current Edge / Type13: area + a >=700 mm height increment, merged obstacle
 * intervals, endpoint nudging, and near-duplicate hinge removal. Input shelves
 * must include the component base (the historical property name is retained).
 */
export function generateEdgeHingeEnvelopes(input: WardrobeHingeSource): WardrobeHingeEnvelope[] {
  return input.doors.flatMap(door => {
    const height = door.y2 - door.y1, width = door.x2 - door.x1;
    const count = clamp(Math.ceil(height / 1000 * width / 1000 * 2.25 + 1 + Number(height >= 700)), 2, 6);
    const drawers = input.drawers.filter(p => sameChannel(p, door));
    const overlaps = (p: WardrobeSourcePart) => sameChannel(p, door) && p.y1 < door.y2 && p.y2 > door.y1;
    const blocked = [
      { from: door.y1, to: door.y1 + 50 }, { from: door.y2 - 50, to: door.y2 },
      ...input.standardShelves.filter(overlaps).map(p => ({ from: p.y1 - 21, to: p.y2 + 31 })),
      ...drawers.filter(overlaps).map(p => ({ from: p.y1 - 24, to: p.y2 + 24 })),
    ].sort((a, b) => a.from - b.from);
    const ranges: typeof blocked = [];
    for (const range of blocked) {
      const previous = ranges.at(-1);
      if (previous && previous.to >= range.from) previous.to = Math.max(previous.to, range.to);
      else ranges.push({ ...range });
    }
    const collision = (y: number) => ranges.find(r => y >= r.from && y <= r.to);
    const below = (range: (typeof ranges)[number]) => {
      const previous = ranges.filter(r => r.to < range.from).at(-1);
      return previous && range.from - previous.to <= 41 ? (range.from + previous.to) / 2 : range.from - 21;
    };
    const above = (range: (typeof ranges)[number]) => {
      const next = ranges.find(r => r.from > range.to);
      return next && next.from - range.to <= 41 ? (range.to + next.from) / 2 : range.to + 21;
    };
    const bottomDrawer = drawers.find(p => p.y1 > door.y1 && p.y1 < door.y1 + 100);
    const offset = bottomDrawer ? bottomDrawer.y2 - bottomDrawer.y1 || 50 : 50;
    const step = (height - 50 - offset) / (count - 1);
    let bottom = door.y1 + offset, top = door.y2 - 50;
    const bottomCollision = collision(bottom), topCollision = collision(top);
    if (bottomCollision) bottom = above(bottomCollision);
    if (topCollision) top = below(topCollision);
    const positions = [bottom];
    for (let i = 1; i < count - 1; i++) {
      let y = door.y1 + offset + i * step;
      const range = collision(y);
      if (range) y = Math.abs(y - range.from) < Math.abs(y - range.to) ? below(range) : above(range);
      positions.push(y);
    }
    positions.push(top);
    const accepted: number[] = [];
    for (const y of positions) if (count === 2 || !accepted.some(p => p >= y - 21 && p <= y + 21)) accepted.push(y);
    return accepted.map(y => ({ ...envelope(door, y, true), y1: y - 21, y2: y + 21 }));
  });
}

function freeVerticalRanges(door: WardrobeHingeDoor, obstacles: WardrobeSourcePart[]) {
  const contained = obstacles.filter(p => containedY(p, door));
  const levels = contained.filter((p, i) => contained.findIndex(other => other.y1 === p.y1) === i).sort((a, b) => a.y1 - b.y1);
  if (!levels.length) return [{ y1: door.y1, y2: door.y2 }];
  const ranges: { y1: number; y2: number }[] = [];
  for (let i = 1; i < levels.length; i++) ranges.push({ y1: Math.trunc(levels[i - 1].y2), y2: Math.trunc(levels[i].y1) });
  if (Math.abs(levels[0].y1 - door.y1) > HEIGHT) ranges.push({ y1: door.y1, y2: levels[0].y1 });
  ranges.push({ y1: levels.at(-1)!.y2, y2: door.y2 });
  return ranges.filter(r => Math.abs(r.y2 - r.y1) > HEIGHT);
}
function adjustToneHeight(y: number, ranges: { y1: number; y2: number }[]): number {
  if (ranges.length === 1) return y;
  if (!ranges.length) throw new RangeError('No source hinge clearance interval remains');
  let nearest = ranges[0], distance = Infinity;
  for (const range of ranges) for (const boundary of [range.y1, range.y2]) {
    const next = Math.abs(y - boundary);
    if (next < distance) { distance = next; nearest = range; }
  }
  if (y > nearest.y1 + 100 && y < nearest.y2 - 30) return y;
  if (Math.abs(nearest.y2 - nearest.y1) < 60) return (nearest.y1 + nearest.y2) / 2;
  if (y < nearest.y1 + 100) return nearest.y1 + 100;
  if (y > nearest.y2 - 30) return nearest.y2 - 30;
  return y;
}

/** Tone / Type03: source envelope height determines 2/3/4 hinges.
 * Missing pre-render offsets are rejected rather than guessed from final fronts.
 */
export function generateToneHingeEnvelopes(input: WardrobeHingeSource): WardrobeHingeEnvelope[] {
  return input.doors.flatMap(door => {
    if (!door.offset) throw new Error('Tone hinges require original top/bottom door clearance offsets');
    const height = door.y2 - door.y1;
    const count = height <= 1300 ? 2 : height <= 2300 ? 3 : 4;
    const topOffset = (count === 2 ? 115 : 163) + door.offset.top;
    const bottomOffset = (count === 2 ? 115 : 190) + door.offset.bottom;
    const middleOffset = height / 2 + door.offset.bottom;
    const upperOffset = count === 4 ? 400 + door.offset.top : middleOffset;
    const obstacles = [
      ...input.drawers.filter(d => sameChannel(d, door) && d.subtype !== 'f' && d.subtype !== 'e'),
      ...input.standardShelves.filter(s => sameChannel(s, door)),
    ];
    const ranges = freeVerticalRanges(door, obstacles);
    const top = adjustToneHeight(door.y2 - topOffset, ranges);
    const bottom = adjustToneHeight(door.y1 + bottomOffset, ranges);
    const middle = adjustToneHeight(door.y1 + middleOffset, ranges);
    const upper = adjustToneHeight(door.y2 - upperOffset, ranges);
    return (count === 2 ? [top, bottom] : count === 3 ? [top, middle, bottom] : [top, upper, middle, bottom]).map(y => envelope(door, y, false));
  });
}

function edgeDoorHinges(door: WardrobeHingeDoor, hinges: WardrobeHingeEnvelope[], walls: WardrobeSourcePart[]) {
  const sameDirection = (h: WardrobeHingeEnvelope) => h.direction === door.direction;
  const primary = hinges.filter(h => sameDirection(h) && containedY(h, door) && h.x2 > door.x1 && h.x1 < door.x2);
  if (primary.length) return primary;
  const fallback = () => hinges.filter(h => h.x1 >= door.x1 && h.x1 <= door.x2 && sameDirection(h));
  const middleX = (door.x1 + door.x2) / 2;
  const tall = walls.filter(w => w.y1 <= door.y1 && w.y2 >= door.y2);
  const right = door.direction === 2;
  const wall = right ? tall.filter(w => w.x1 >= middleX).sort((a, b) => a.x1 - b.x1)[0] : tall.filter(w => w.x2 <= middleX).sort((a, b) => b.x2 - a.x2)[0];
  if (!wall) return fallback();
  const adjacent = hinges.filter(h => (right ? h.x2 === wall.x1 : h.x1 === wall.x2) && containedY(h, door) && sameDirection(h));
  return adjacent.length ? adjacent : fallback();
}

/** Closed-pose asset transforms from the renderer; does not change source geometry. */
export function resolveWardrobeHingePlacements(
  model: 'edge' | 'tone', doors: WardrobeHingeDoor[], walls: WardrobeSourcePart[], hinges: WardrobeHingeEnvelope[],
): WardrobeHingePlacement[] {
  const placements: WardrobeHingePlacement[] = [];
  doors.forEach((door, doorIndex) => {
    const matches = model === 'tone' ? hinges.filter(h => h.x1 >= door.x1 && h.x2 <= door.x2 && containedY(h, door)) : edgeDoorHinges(door, hinges, walls);
    for (const hinge of matches) placements.push({ asset: 'hingeWing', sourceIndex: hinges.indexOf(hinge), doorIndex, wallIndex: null,
      position: [(door.direction === 2 ? door.x2 - 20 : door.x1 + 20) / 10, centerY(hinge) / 10, ((door.z1 + door.z2) / 2 - (model === 'tone' ? 8 : 9)) / 10],
      rotationZ: door.direction === 2 ? 0 : Math.PI });
  });
  walls.forEach((wall, wallIndex) => {
    hinges.forEach((hinge, sourceIndex) => {
      if (!containedY(hinge, wall)) return;
      const onRight = hinge.x1 === wall.x2;
      const onLeft = hinge.x2 === wall.x1;
      if (!onRight && !onLeft) return;
      placements.push({ asset: 'hingeAnchor', sourceIndex, doorIndex: null, wallIndex,
        position: [(onLeft ? wall.x1 - 20 : wall.x2 + 20) / 10, centerY(hinge) / 10, (wall.z1 + (hinge.z1 + hinge.z2) / 2 + 20) / 10],
        rotationZ: onLeft ? 0 : Math.PI });
    });
  });
  return placements;
}
