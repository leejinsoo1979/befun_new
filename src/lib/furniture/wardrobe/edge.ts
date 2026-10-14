import { applyEdgeFlatTop } from './edge-flat-top';
import catalogData from './edge-catalog.json';
import { adaptWardrobeRenderGeometry } from './adapter';
import type { WardrobeInput, WardrobeResult, WardrobeSectionInput } from './types';
import type { WardrobeSourceGeometry, WardrobeSourcePart } from './source-types';

type CellRule = { kind: string; heightMm: number | string; railOffsetsMm?: number[]; external?: boolean; drawerHeightsMm?: number[] };
type Layout = { heights: Record<string, CellRule[]>; fallback: { when_too_narrow?: string; when_too_shallow?: string } };
const catalog = catalogData as { ranges: { count: number; min: number; max: number }[]; layouts: Record<string, Layout> };
export const EDGE_STANDARD_HEIGHTS_MM = [1380, 1680, 1980, 2280];
export const EDGE_DEPTHS_MM = [270, 360, 450, 600];
const facadePrefixes = { open: 'Open', 'middle-open': 'Split', 'bottom-open': 'Half', closed: 'Full' };
const nearest = (value: number, values: number[]) => values.reduce((a, b) => Math.abs(value - b) < Math.abs(value - a) ? b : a);
const snap = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(value / 10) * 10));
export function getEdgeColumnCounts(widthMm: number): number[] {
  return [...new Set(catalog.ranges.filter(range => widthMm >= range.min && widthMm <= range.max).map(range => range.count))];
}
export function normalizeEdgeWardrobe(input: WardrobeInput): WardrobeInput {
  const widthMm = snap(input.widthMm, 400, 6000);
  const height = (value: number) => value >= 2290 ? snap(value, 2290, 3000) : nearest(value, EDGE_STANDARD_HEIGHTS_MM);
  const heightMm = height(input.heightMm), depthMm = nearest(input.depthMm, EDGE_DEPTHS_MM);
  const count = nearest(input.sections.length || 1, getEdgeColumnCounts(widthMm));
  const sections = Array.from({ length: count }, (_, index) => {
    const original = input.sections[index];
    let seriesId = String(original?.seriesId || 'Full_Rail_Rail_XL');
    if (!catalog.layouts[seriesId]) seriesId = 'Full_Rail_Rail_XL';
    if (original?.facade) seriesId = facadePrefixes[original.facade] + seriesId.slice(seriesId.indexOf('_'));
    return {
      ...original, id: original?.id || String(index + 1), seriesId,
      localHeightMm: original?.localHeightMm == null ? null : height(original.localHeightMm),
      localDepthMm: original?.localDepthMm == null ? null : nearest(original.localDepthMm, EDGE_DEPTHS_MM),
    };
  });
  return { ...input, model: 'edge', widthMm, heightMm, depthMm, sections };
}
export function edgeWardrobeLayoutOptions(input?: WardrobeInput, sectionId?: string) {
  const section = input?.sections.find(section => section.id === sectionId) ?? input?.sections[0];
  const height = section?.localHeightMm ?? input?.heightMm ?? 1980;
  const depth = section?.localDepthMm ?? input?.depthMm ?? 600;
  const width = input ? (input.widthMm - 18) / input.sections.length : 581;
  const prefix = section?.facade ? facadePrefixes[section.facade] : String(section?.seriesId ?? 'Full_').split('_')[0];
  const signatures = new Set<string>();
  return Object.keys(catalog.layouts).filter(id => id.startsWith(prefix + '_')).flatMap(id => {
    const resolved = getRules(id, height, width, depth);
    if (resolved.seriesId !== id) return [];
    const signature = JSON.stringify(resolved.rules);
    if (signatures.has(signature)) return [];
    signatures.add(signature);
    return [{ id, seriesId: id, label: id.slice(id.indexOf('_') + 1).replaceAll('_', ' '),
      disabled: depth < 400 && resolved.rules.some(rule => rule.railOffsetsMm?.length),
      facades: Object.keys(facadePrefixes) }];
  });
}
function getRules(seriesId: string, height: number, width: number, depth: number): { seriesId: string; rules: CellRule[] } {
  let layout = catalog.layouts[seriesId];
  const select = () => layout.heights[String(Math.max(...Object.keys(layout.heights).map(Number).filter(h => h <= height)))];
  if (depth <= 560 && width <= 510 && select().some(cell => cell.railOffsetsMm?.length) && layout.fallback.when_too_narrow) {
    seriesId = layout.fallback.when_too_narrow; layout = catalog.layouts[seriesId];
  }
  if (depth < 360 && select().some(cell => cell.kind === 'drawer') && layout.fallback.when_too_shallow) {
    seriesId = layout.fallback.when_too_shallow; layout = catalog.layouts[seriesId];
  }
  return { seriesId, rules: select() };
}
type Part = WardrobeSourcePart & { height?: number; base?: number; external?: boolean };
type Column = {
  section: WardrobeSectionInput; x1: number; x2: number; height: number; depth: number; built: number;
  seriesId: string; slabs: Part[]; doors: Part[]; drawers: Part[]; bars: Part[]; backs: Part[];
};
const box = (x1: number, x2: number, y1: number, y2: number, z1: number, z2: number, subtype = ''): Part => ({ x1, x2, y1, y2, z1, z2, subtype });
const insideY = (part: Part, front: Part) => part.y1 >= front.y1 && part.y2 <= front.y2;

/** A column is a stack of source-defined openings. Width division is integer mm,
 * with the remainder allocated left to right. Panels are shared at column axes.
 */
function createColumn(input: WardrobeInput, section: WardrobeSectionInput, x1: number, width: number): Column {
  const height = section.localHeightMm ?? input.heightMm, depth = section.localDepthMm ?? input.depthMm;
  const { seriesId, rules } = getRules(String(section.seriesId), height, width, depth);
  const x2 = x1 + width;
  const slabs: Part[] = [box(x1 + 9, x2 - 9, 0, 18, 12, depth, 'b')];
  const doors: Part[] = [], drawers: Part[] = [], bars: Part[] = [];
  const fixedHeight = rules.reduce((sum, cell) => sum + (typeof cell.heightMm === 'number' ? cell.heightMm : 0), 0);
  let y = 9;
  for (const cell of rules) {
    const h = cell.heightMm === 'flex' ? height - 80 - fixedHeight : Number(cell.heightMm);
    const top = y + h;
    slabs.push(box(x1 + 9, x2 - 9, top - 9, top + 9, 12, depth, 's'));
    if (cell.kind === 'door') {
      let bottom = y;
      for (let i = drawers.length - 1; i >= 0 && !drawers[i].external && drawers[i].y2 === bottom; i--) bottom = drawers[i].y1;
      const previous = doors.at(-1);
      if (previous?.y2 === bottom) previous.y2 = top;
      else doors.push(box(x1, x2, bottom, top, 0, depth));
    }
    if (cell.kind === 'drawer' && depth > 240) {
      for (const drawerHeight of cell.drawerHeightsMm ?? [150]) {
        drawers.push({ ...box(x1, x2, y, top, 0, depth, cell.external ? 'e' : 'd'), height: drawerHeight, base: y, external: cell.external });
      }
    }
    for (const offset of cell.railOffsetsMm ?? []) bars.push(box(x1, x2, top - offset - 20, top - offset + 20, depth / 2 - 10, depth / 2 + 10));
    y = top;
  }
  return { section, x1, x2, height, depth, built: y - 9, seriesId, slabs, doors, drawers, bars, backs: [] };
}
function fitColumn(column: Column) {
  const { x1, x2, depth, slabs, drawers, bars } = column;
  if (depth < 360) drawers.length = 0;
  for (let index = 0; index < drawers.length; index++) {
    const drawer = drawers[index], previous = drawers[index - 1];
    let bottom = (drawer.base ?? drawer.y1) + 19;
    if (previous?.base === drawer.base) bottom = previous.y2 + 50;
    const externalWithoutDoor = drawer.external && !column.doors.some(door => drawer.base === door.y2);
    drawer.y1 = bottom - (externalWithoutDoor && previous?.base !== drawer.base ? 28 : 0);
    drawer.y2 = bottom + (drawer.height ?? 150);
    drawer.x1 += 9; drawer.x2 -= 9; drawer.direction = 1;
    drawer.z2 = depth - (drawer.external ? 17 : 42);
    drawer.z1 = drawer.z2 - Math.max(270, Math.floor((depth - 90) / 50) * 50) - (drawer.external ? 18 : 12);
  }
  column.doors = column.doors.flatMap(door => {
    const below = drawers.find(drawer => Math.abs(drawer.y2 - door.y1) < 100);
    door.y1 = below ? (below.external ? door.y1 + 13 : -9) : door.y1 - 9;
    door.y2 += 9; door.x1 += 9; door.x2 -= 9;
    door.z1 = depth - 35; door.z2 = depth - 17; door.subtype = 'i'; door.handle_type = 'line';
    if (door.x2 - door.x1 > 610) {
      const middle = Math.ceil((door.x1 + door.x2) / 2);
      return [{ ...door, x2: middle, direction: 1, handle: 1 }, { ...door, x1: middle, direction: 2, handle: 0 }];
    }
    return [{ ...door, direction: column.section.doorDirection === 'left' ? 1 : 2, handle: 0 }];
  });
  const drawerAbove = (slab: Part) => drawers.find(drawer => drawer.y1 >= slab.y1 && drawer.y2 <= slab.y2 + (drawer.y2 - drawer.y1) + 50);
  for (let index = 0; index < slabs.length; index++) {
    const slab = slabs[index], top = index === slabs.length - 1;
    const above = drawerAbove(slab), below = drawers.find(drawer => drawer.y2 <= slab.y1 && drawer.y2 >= slab.y1 - (drawer.y2 - drawer.y1) / 2);
    slab.subtype = index === 0 ? 'b' : top ? (slab.y2 > 1300 ? 't' : 'l') : above ? 'd' : 's';
    slab.z2 -= index === 0 || column.doors.some(door => insideY(slab, door)) || above?.external || below?.external ? 38 : 19;
    slab.z1 = index !== 0 && above && slab.y1 < 691 ? slab.z2 - 123 : 18;
    const rail = [...bars].sort((a, b) => a.y1 - b.y1).find(bar => bar.y1 > slab.y2);
    if (index !== 0 && rail && column.doors.some(door => door.y1 - 22 === slab.y1) && !slabs.some(s => s.y1 > slab.y1 && s.y2 < rail.y1)) {
      slab.y1 += 22; slab.y2 += 22;
    }
  }
  if (depth < 560) {
    const barDepth = depth < 360 ? 174 : depth < 450 ? 264 : 354;
    const extra: Part[] = [];
    for (const bar of bars) {
      const ceiling = slabs.find(slab => bar.y2 <= slab.y1);
      if (!ceiling) continue;
      bar.y1 = ceiling.y1 - 85; bar.y2 = ceiling.y1; bar.subtype = 'z';
      bar.z2 = ceiling.z2 - (column.doors.some(door => insideY(bar, door)) ? 20 : 30); bar.z1 = bar.z2 - barDepth;
      if (x2 - x1 >= 918) {
        bar.x1 = x1 + 9 + 257; bar.x2 = bar.x1 + 12;
        extra.push({ ...bar, x1: x2 - 9 - 257 - 12, x2: x2 - 9 - 257 });
      } else { bar.x1 = (x1 + x2) / 2 - 6; bar.x2 = bar.x1 + 12; }
    }
    bars.push(...extra);
    const keys = new Set<string>(); column.bars = bars.filter(bar => { const key = [bar.x1, bar.x2, bar.y1, bar.y2].join(); if (keys.has(key)) return false; keys.add(key); return true; });
  } else { for (const bar of bars) { bar.x1 += 9; bar.x2 -= 9; } }
  buildBacks(column);
  for (const slab of slabs.slice(1)) {
    const below = column.bars.find(bar => Math.abs(slab.y1 - bar.y2) <= 30);
    if (slab.subtype === 'l' || slab.subtype === 't' || below) slab.z1 = 0;
    if (slab.subtype === 's' && below) slab.subtype = 't';
  }
  const top = slabs.at(-1)!;
  if (['l', 't'].includes(top.subtype!)) column.backs.at(-1)!.y2 = top.y1;
  column.doors = column.doors.flatMap(door => door.y2 - door.y1 > 2371 ? [{ ...door, y2: 1918 }, { ...door, y1: 1922 }] : [door]);
  for (const part of [...slabs, ...column.doors, ...drawers, ...column.bars]) { part.y1 += 30; part.y2 += 30; }
  for (const back of column.backs) { if (back.y1 !== 0) back.y1 += 30; back.y2 += 30; }
}
function buildBacks(column: Column) {
  const { slabs, x1, x2 } = column;
  const top = slabs.at(-1)!;
  const upperSlabs = slabs.slice(1).filter(s => s.y2 - 9 >= 1909);
  const lock = slabs.find(s => s.subtype === 'l');
  let y2: number;
  if (lock) y2 = lock.y1 - 9;
  else if (top.y2 - 9 >= 2209) y2 = upperSlabs[0].y2 - 9 - (column.bars.some(bar => bar.y2 - 9 === upperSlabs[0].y1 - 9) ? 18 : 0);
  else if (top.y2 - 9 > 1909) y2 = 1909;
  else y2 = top.y2 - 8;
  const target = Math.floor((y2 - 21) / 2);
  let split = target;
  let distance = Infinity;
  const min = (column.built + 89 > 800 ? 300 : 200) - 21;
  for (const slab of slabs.slice(1)) {
    const y = slab.y1 - 9;
    if (y <= y2 - 200 && y >= y2 - 1218 && y <= 1309 && y >= min && Math.abs(y - target) < distance) { split = y; distance = Math.abs(y - target); }
  }
  for (let index = column.drawers.length - 1; index >= 0; index--) {
    const y = column.drawers[index].y1 - 9 - 28;
    if (y > split) { split = y; break; }
  }
  split = Math.min(split, y2 - 200, 1309);
  const backs = [box(x1 + 9, x2 - 9, 0, split + 9, 6, 18, 'b'), box(x1 + 9, x2 - 9, split + 9, y2 + 9, 6, 18, 'm')];
  if (top.subtype === 't' && top.y2 - 9 > 1909) {
    if (top.y2 - 9 > 2209) {
      for (let i = 0; i < upperSlabs.length - 1; i++) backs.push(box(x1 + 9, x2 - 9, upperSlabs[i].y2, upperSlabs[i + 1].y2, 6, 18, 't'));
    } else backs.push(box(x1 + 9, x2 - 9, 1918, top.y1, 6, 18, 't'));
  }
  column.backs = backs;
}
export function generateEdgeSourceGeometry(inputValue: WardrobeInput): WardrobeSourceGeometry {
  const input = normalizeEdgeWardrobe(inputValue);
  const total = input.widthMm - 18, count = input.sections.length;
  const widths = input.sections.map((_, index) => Math.floor(total / count) + (index < total % count ? 1 : 0));
  let cursor = -total / 2;
  const columns = input.sections.map((section, index) => { const column = createColumn(input, section, cursor, widths[index]); cursor += widths[index]; return column; });
  const walls: Part[] = [];
  for (let index = 0; index <= columns.length; index++) {
    const left = columns[index - 1], right = columns[index];
    const x = right?.x1 ?? left.x2;
    const wallTop = Math.max(left ? left.built + 18 : 0, right ? right.built + 18 : 0);
    const wallDepth = Math.max(left?.depth ?? 0, right?.depth ?? 0);
    const wall = box(x - 9, x + 9, 0, wallTop + 48, 0, wallDepth);
    if (wallTop > 2318) walls.push({ ...wall, y2: 1948 }, { ...wall, y1: 1948 }); else walls.push(wall);
  }
  columns.forEach(fitColumn);
  for (const part of [...walls, ...columns.flatMap(c => [...c.slabs, ...c.backs, ...c.doors, ...c.drawers, ...c.bars])]) {
    for (const key of ['x1', 'x2', 'y1', 'y2', 'z1', 'z2'] as const) part[key] = Math.round(part[key]);
  }
  const source: WardrobeSourceGeometry = {
    model: 'edge', width: input.widthMm, height: Math.max(...input.sections.map(s => s.localHeightMm ?? input.heightMm)), depth: Math.max(...input.sections.map(s => s.localDepthMm ?? input.depthMm)),
    components: columns.map(c => box(c.x1, c.x2, 0, c.built, 0, c.depth)),
    slabs: [...columns.map(c => c.slabs[0]), ...columns.flatMap(c => c.slabs.slice(1))],
    walls, backs: columns.flatMap(c => c.backs), doors: columns.flatMap(c => c.doors), drawers: columns.flatMap(c => c.drawers), bars: columns.flatMap(c => c.bars), frame: [],
  };
  if (input.topEdge === false) applyEdgeFlatTop(source);
  return source;
}
export function generateEdgeWardrobe(input: WardrobeInput): WardrobeResult {
  const normalized = normalizeEdgeWardrobe(input);
  const source = generateEdgeSourceGeometry(normalized), result = adaptWardrobeRenderGeometry(source, normalized.sections.map(section => section.id));
  result.sourceGeometryMm = source;
  return result;
}
