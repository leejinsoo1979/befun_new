import type { WardrobeSourceGeometry, WardrobeSourcePart } from './source-types';

/** Replace the raised side-edge finish with flush tops. Joints stay on column
 * boundaries; no top is stretched across a manufacturing-length boundary.
 */
export function applyEdgeFlatTop(source: WardrobeSourceGeometry): void {
  const highest = (parts: WardrobeSourcePart[]) => {
    const byX = new Map<number, WardrobeSourcePart>();
    for (const part of parts) if (!byX.has(part.x1) || byX.get(part.x1)!.y2 < part.y2) byX.set(part.x1, part);
    return [...byX.values()].sort((a, b) => parts.indexOf(a) - parts.indexOf(b));
  };
  const tops = highest(source.slabs.filter(slab => slab.subtype !== 'b'));
  const walls = highest(source.walls), backs = highest(source.backs);
  for (const wall of walls) wall.y2 -= 14;
  for (const top of tops) {
    top.y1 += 22; top.y2 += 22; top.z2 += 38;
    for (const wall of walls) if (top.x1 === wall.x2 || top.x2 === wall.x1 && top.z2 > wall.z2) {
      top.z2 = Math.min(top.z2, wall.z2); top.z1 = wall.z1;
    }
  }
  for (const back of backs) {
    const previousHeight = back.y2 - 9;
    if (previousHeight <= 1360) { back.y1 = 0; back.subtype = 'b'; }
    back.y2 += previousHeight === 1939 ? 4 : 22;
  }
  for (const bar of highest(source.bars)) {
    const ceiling = tops.find(top => bar.x1 >= top.x1 && bar.x2 <= top.x2);
    if (ceiling && ceiling.y1 - bar.y2 <= 100) { bar.y1 += 22; bar.y2 += 22; }
  }
  for (let index = 0; index < tops.length; index++) {
    const top = tops[index], previous = tops[index - 1], next = tops[index + 1];
    if (index === 0) top.x1 -= 18;
    if (index === tops.length - 1) top.x2 += 18;
    if (index !== tops.length - 1 && next && next.y1 <= top.y1 && next.z2 <= top.z2) top.x2 += 18;
    if (index !== 0 && previous && previous.x2 === top.x1 - 18 && previous.y1 <= top.y1 && previous.z2 <= top.z2) top.x1 -= 18;
    top.subtype = 'o';
  }
  const groups: WardrobeSourcePart[][] = [];
  for (const top of tops) {
    const group = groups.at(-1), previous = group?.at(-1);
    if (previous && previous.y1 === top.y1 && previous.z2 === top.z2 && previous.x2 === top.x1) group!.push(top);
    else groups.push([top]);
  }
  const removed = new Set<WardrobeSourcePart>();
  for (const group of groups) {
    const spans = partition(group);
    let cursor = 0;
    for (let index = 0; index < spans.length; index++) {
      const count = spans[index];
      const start = group[cursor].x1, end = group[cursor + count - 1].x2;
      group[index].x1 = start; group[index].x2 = end; cursor += count;
    }
    for (const part of group.slice(spans.length)) removed.add(part);
  }
  source.slabs = source.slabs.filter(slab => !removed.has(slab));
  source.backs = source.backs.filter((back, index, all) => !all.some((other, next) => next > index && other.x1 === back.x1 && other.x2 === back.x2 && other.y1 === back.y1));
}
function partition(group: WardrobeSourcePart[]): number[] {
  const count = group.length, start = group[0].x1;
  const cumulative = group.map(part => part.x2 - start);
  let pieces = Math.ceil((cumulative[count - 1] + 18) / 2382);
  const valid = (spans: number[]) => {
    let cursor = 0;
    return spans.every(n => { const end = cursor + n - 1, width = cumulative[end] - (cursor ? cumulative[cursor - 1] : -36); cursor += n; return width <= 2400; });
  };
  const sequential = (pieces: number) => { let remaining = count; return Array.from({ length: pieces }, (_, i) => { const size = Math.ceil(remaining / (pieces - i)); remaining -= size; return size; }); };
  while (pieces < count) {
    if (pieces === 1) return [count];
    if (pieces === 2) {
      const splits = Array.from({ length: count - 1 }, (_, i) => i + 1).sort((a, b) => Math.abs(a - count / 2) - Math.abs(b - count / 2));
      for (const split of splits) if (valid([split, count - split])) return [split, count - split];
    } else {
      const base = Math.floor(count / pieces), remainder = count % pieces;
      const symmetric = Array.from({ length: pieces }, (_, i) => base + (pieces % 2 ? (i === Math.floor(pieces / 2) ? remainder : 0) : +(i < remainder)));
      if (valid(symmetric)) return symmetric;
      const fallback = sequential(pieces); if (valid(fallback)) return fallback;
    }
    pieces++;
  }
  return Array(count).fill(1) as number[];
}
