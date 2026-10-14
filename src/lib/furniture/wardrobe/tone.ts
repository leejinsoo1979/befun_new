import rulesData from './tone-rules.json';
import { generateToneHingeEnvelopes } from '../wardrobe-hinges';
import { adaptWardrobeRenderGeometry } from './adapter';
import type { WardrobeInput, WardrobeResult } from './types';
import type { WardrobeSourceGeometry, WardrobeSourcePart } from './source-types';

type Cell = { kind: string; height: number | string; inserts: number[]; rods: number[]; external: boolean; extensionInserts: { range: number[]; inserts: number[] }[] };
type Setup = { range: number[]; ratios: number[]; channels: number[]; defaults: number[] };
const rules = rulesData as { setups: Setup[]; layouts: Record<string, { label: string; recipes: Record<string, Cell[]> }> };
const snap = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(n / 10) * 10));
const getSetup = (width: number) => rules.setups.filter(s => width >= s.range[0] && width <= s.range[1]).at(-1) ?? rules.setups.at(-1)!;


function allocateWidths(width: number, ratios: number[]): number[] {
  const total = width - 42, weight = ratios.reduce((a, b) => a + b, 0);
  if (new Set(ratios).size > 1) {
    const large = Math.max(...ratios), largeCount = ratios.filter(r => r === large).length;
    const largeWidth = Math.round(total * large / weight);
    const smallWidth = (total - largeWidth * largeCount) / (ratios.length - largeCount);
    return ratios.map(r => r === large ? largeWidth : smallWidth);
  }
  const exact = ratios.map(r => total * r / weight), widths = exact.map(Math.floor);
  const order = exact.map((n, i) => ({ i, fraction: n - widths[i] })).sort((a, b) => b.fraction - a.fraction || a.i - b.i);
  const remaining = total - widths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remaining; i++) widths[order[i].i]++;
  return widths;
}
export function getToneWidthOptions(input: WardrobeInput) {
  const width = snap(input.widthMm, 400, 6000), setup = getSetup(width), count = setup.ratios.length;
  if (!setup.ratios.includes(2)) return [];
  const patterns = Array.from({ length: count }, (_, i) => Array.from({ length: count }, (_, j) => i === j ? '1' : '2').join(''));
  patterns.splice(1, 0, '1'.repeat(count));
  return patterns.map(id => ({ id, label: id.split('').join(' : '), widthsMm: allocateWidths(width, id.split('').map(Number)) }));
}
function ratiosFor(input: WardrobeInput): number[] {
  const pattern = getToneWidthOptions(input).find(o => o.id === input.toneWidthPattern)?.id;
  return pattern ? pattern.split('').map(Number) : getSetup(input.widthMm).ratios;
}

/** Tone wardrobe axes use a 21mm inset at both sides, not the Edge wardrobe inset. */
export function normalizeToneWardrobe(value: WardrobeInput): WardrobeInput {
  const widthMm = snap(value.widthMm, 400, 6000);
  const heightMm = value.heightMm > 2370 ? snap(value.heightMm, 2380, 3600) : value.heightMm < 2185 ? 2000 : 2370;
  const depthMm = snap(value.depthMm, 400, 800);
  const setup = getSetup(widthMm);
  const normalizedSize = { ...value, widthMm, heightMm, depthMm };
  const ratios = ratiosFor(normalizedSize), widths = allocateWidths(widthMm, ratios);
  const toneWidthPattern = ratios.join('');
  const narrow = ratios.includes(2) ? ratios.indexOf(1) : 0;
  const doorDirection = value.sections[narrow]?.doorDirection ?? value.sections[0]?.doorDirection ?? 'left';
  const sections = setup.ratios.map((_, index) => {
    const previous = value.sections[index];
    let seriesId = rules.layouts[String(previous?.seriesId)] ? Number(previous.seriesId) : setup.defaults[index];
    if (depthMm <= 520 && widths[index] <= 509 && rules.layouts[String(seriesId)].recipes[value.drawerStyle ?? 'internal'].some(c => c.rods.length)) seriesId = 3749;
    return { ...previous, id: previous?.id || String(index + 1), seriesId, doorDirection };
  });
  return { ...value, model: 'tone', widthMm, heightMm, depthMm, sections, toneWidthPattern, drawerStyle: value.drawerStyle ?? 'internal', lighting: !!value.lighting };
}
export function toneWardrobeLayoutOptions(input?: WardrobeInput, sectionId?: string) {
  void input; void sectionId;
  return Object.entries(rules.layouts).map(([key, value]) => ({ id: Number(key), seriesId: Number(key), label: value.label.replaceAll('_', ' ') }));
}
type Part = WardrobeSourcePart;
const box = (x1: number, x2: number, y1: number, y2: number, z1: number, z2: number, subtype = ''): Part => ({ x1, x2, y1, y2, z1, z2, subtype });
const cut = (part: Part, axis: 'x' | 'y', points: number[]): Part[] => {
  const lo = `${axis}1` as 'x1' | 'y1', hi = `${axis}2` as 'x2' | 'y2';
  const edges = [part[lo], ...points.filter(p => p > part[lo] && p < part[hi]).sort((a, b) => a - b), part[hi]];
  return edges.slice(1).map((end, index) => ({ ...part, [lo]: edges[index], [hi]: end }));
};

/** Generate the mm material envelopes. Door clearance is applied by the shared
 * wardrobe front resolver; source doors here intentionally remain axis boxes.
 */
export function generateToneSourceGeometry(value: WardrobeInput): WardrobeSourceGeometry {
  const input = normalizeToneWardrobe(value), ratios = ratiosFor(input);
  const depth = input.depthMm, bodyDepth = depth - 15;
  const extension = input.heightMm === 2000 ? 0 : input.heightMm - 2001;
  const built = 1929 + extension, wallTop = built + 47;
  const total = input.widthMm - 42, widths = allocateWidths(input.widthMm, ratios);
  const axes = [-total / 2]; widths.forEach(w => axes.push(axes.at(-1)! + w));
  const drawer_fronts: Part[] = [];
  const hingeShelves: Part[] = [];
  const slabs: Part[] = [], walls: Part[] = [], backs: Part[] = [], doors: Part[] = [], drawers: Part[] = [], bars: Part[] = [], lighting: Part[] = [], components: Part[] = [];
  for (let index = 0; index < widths.length; index++) {
    const x1 = axes[index], x2 = axes[index + 1], width = widths[index];
    const section = input.sections[index];
    const initialRecipe = rules.layouts[String(section.seriesId)].recipes[input.drawerStyle ?? 'internal'];
    const seriesId = depth <= 520 && width <= 509 && initialRecipe.some(c => c.rods.length) ? 3749 : section.seriesId;
    const recipe = rules.layouts[String(seriesId)].recipes[input.drawerStyle ?? 'internal'];
    const metadata = { m_config_id: section.id };
    const make = (y1: number, y2: number, subtype = 's', z1 = 18, z2 = bodyDepth) => ({ ...box(x1 + 9, x2 - 9, y1, y2, z1, z2, subtype), ...metadata });
    const base = make(29, 47, 'b');
    const standards: Part[] = [], inserts: Part[] = [];
    const rawDrawers: { bottom: number; top: number; external: boolean }[] = [];
    const rawBars: { center: number }[] = [];
    let y = 0;
    for (const cell of recipe) {
      const height = cell.height === 'extension' ? extension : Number(cell.height);
      if (height <= 0) continue;
      const top = y + height;
      standards.push(make(top + 29, top + 47, top === built ? 't' : 's'));
      const points = cell.height === 'extension' ? cell.extensionInserts.find(r => height >= r.range[0] && height <= r.range[1])?.inserts ?? [] : cell.inserts;
      for (const point of points) { const offset = point < 0 ? height + point : point; if (offset > 0 && offset < height) inserts.push(make(y + offset + 29, y + offset + 47)); }
      if (cell.kind === 'drawers') rawDrawers.push({ bottom: y, top, external: cell.external });
      for (const offset of cell.rods) rawBars.push({ center: (offset < 0 ? top + offset : y + offset) + 38 });
      y = top;
    }
    // Hinges use original standard shelves, including shelves later removed at
    // drawer stacks. Recipe inserts are also source standard shelves; the base
    // alone is excluded from the Type03 hinge obstacles.
    hingeShelves.push(...[...standards, ...inserts].map(shelf => ({ ...shelf })));
    const colDrawers: Part[] = [];
    for (const cell of rawDrawers) {
      if (cell.external) {
        // DNA external stack: a 338mm front below a 224mm front, 4mm seam.
        const z2 = depth - 12, z1 = z2 - Math.min(602, Math.floor(depth / 50) * 50 - 48);
        for (const [bottom, top] of [[41, 379], [383, 607]]) drawer_fronts.push({ ...box(x1 + (index === 0 ? -5 : 2), x2 + (index === widths.length - 1 ? 5 : -2), cell.bottom + bottom, cell.bottom + top, depth - 12, depth, 'f'), ...metadata });
        for (const [bottom, top] of [[79, 355], [421, 583]]) {
          const extremes = [...(index === 0 ? ['left'] : []), ...(index === widths.length - 1 ? ['right'] : []), ...(bottom === 79 ? ['bottom'] : [])];
          colDrawers.push({ ...make(cell.bottom + bottom, cell.bottom + top, 'e', z1, z2), extremes });
        }
      } else {
        const height = cell.top - cell.bottom;
        const count = height <= 260 ? 1 : height <= 400 ? 2 : height <= 660 ? 3 : height <= 800 ? 4 : 6;
        const start = cell.bottom + 57, last = cell.top - 151;
        for (let j = 0; j < count; j++) {
          const bottom = count === 1 ? start : start + (last - start) * j / (count - 1);
          const firstInternal = !colDrawers.some(d => d.subtype === 'i' || d.subtype === 'b');
          const subtype = (input.lighting ? firstInternal : bottom - 9 < 150) ? 'b' : 'i';
          colDrawers.push({ ...make(bottom, bottom + 150, subtype, Math.max(18, bodyDepth - 715 + 18)), extremes: [] });
        }
      }
    }
    // A shelf at the start of an unlit drawer stack is omitted or reduced to a
    // shallow tie panel when exterior drawers sit below it.
    for (const s of standards) {
      const above = rawDrawers.some(d => Math.abs(s.y2 - (d.bottom + 29)) < 100);
      if (above && !input.lighting) {
        if (rawDrawers.some(d => d.external)) { s.subtype = 'd'; s.z1 = bodyDepth - 123; }
        else continue;
      }
      slabs.push(s);
    }
    if (colDrawers.some(d => d.y1 <= 150) && !input.lighting) base.z1 = bodyDepth - 131;
    slabs.push(base, ...inserts); drawers.push(...colDrawers);
    const colBars: Part[] = [];
    for (const bar of rawBars) {
      if (depth > 520) colBars.push(make(bar.center - 20, bar.center + 20, '', bodyDepth / 2 - 10, bodyDepth / 2 + 10));
      else {
        const ceiling = standards.find(s => s.y1 > bar.center + 20)!;
        const thickness = ceiling.y2 === wallTop ? 18 : 25;
        const top = ceiling.y2 - thickness;
        const length = input.lighting ? depth <= 440 ? 300 : depth <= 500 ? 340 : 413 : depth <= 470 ? 340 : 413;
        const centerZ = (depth + 31 - (input.lighting ? 75 : 28)) / 2;
        const positions = width >= 900 ? [x1 + 9 + 257, x2 - 9 - 257 - 12] : [(x1 + x2) / 2 - 6];
        for (const x of positions) colBars.push({ ...box(x, x + 12, top - 85, top, centerZ - length / 2, centerZ + length / 2, 'z'), ...metadata });
        if (ceiling.y2 !== wallTop) { ceiling.y1 = ceiling.y2 - 25; ceiling.subtype = 'f'; }
      }
    }
    const uniqueBars = new Set<string>();
    bars.push(...colBars.filter(bar => { const key = JSON.stringify(bar); if (uniqueBars.has(key)) return false; uniqueBars.add(key); return true; }));
    const splitDoor = built + 8 >= 2640;
    if (splitDoor && input.heightMm > 2370) {
      const partition = standards.find(s => s.y2 === 1976);
      if (partition) { partition.y1 = partition.y2 - 25; partition.subtype = 'p'; }
    }
    if (input.lighting) for (const s of [...standards, ...inserts]) {
      if (s.y1 - 29 < 2000 && !colDrawers.some(d => Math.abs(s.y1 - d.y2) < 100)) lighting.push({ ...s, y2: s.y1, subtype: 'l' });
    }
    const external = rawDrawers.find(d => d.external);
    const bottomDoor = external ? external.top + 36 : 35;
    const pair = width > 610;
    const half = Math.ceil(width / 2), splitX = index === 0 ? x2 - half : x1 + half;
    const xRanges = pair ? [[x1, splitX], [splitX, x2]] : [[x1, x2]];
    const twoSingles = widths.length === 2 && widths.every(w => w <= 610);
    const narrowIndex = ratios.includes(2) ? ratios.indexOf(1) : -1;
    const selectedDirection = narrowIndex >= 0 && input.sections[narrowIndex]?.doorDirection === 'right' ? 2 : 1;
    const defaultDirection = narrowIndex > index ? selectedDirection : 2;
    for (let d = 0; d < xRanges.length; d++) {
      const [left, right] = xRanges[d];
      const main = pair ? defaultDirection : twoSingles ? index === 0 ? 1 : 2 : section.doorDirection === 'right' ? 2 : 1;
      const direction = pair ? d === 0 ? 1 : 2 : main;
      const rows = splitDoor ? [[1959, built + 38, 't'], [bottomDoor, 1959, 'e']] as const : [[bottomDoor, built + 38, 'e']] as const;
      for (const [bottom, top, subtype] of rows) {
        const extremes = [...(index === 0 && d === 0 ? ['left'] : []), ...(index === widths.length - 1 && d === xRanges.length - 1 ? ['right'] : []), ...(bottom === 35 ? ['bottom'] : []), ...(top === built + 38 ? ['top'] : [])];
        doors.push({ ...box(left, right, bottom, top, depth - 12, depth, subtype), ...metadata, direction, handle: bottom - 29 < 981 && top - 29 > 1600 && direction === main ? 1 : 0, extremes });
      }
    }
    backs.push(make(0, Math.min(1976, wallTop), 'b', 6, 18));
    if (wallTop > 1976) backs.push(make(1976, wallTop, 'm', 6, 18));
    components.push({ ...box(x1, x2, 9, built + 9, 0, bodyDepth), ...metadata });
  }
  // The source promotes every shelf on a shared horizontal level when a
  // transverse rail at that level needs the 25mm support board.
  for (const slab of slabs) {
    if (slab.subtype === 's' && slab.y2 < wallTop && bars.some(b => b.subtype === 'z' && b.y2 === slab.y2 - 25)) {
      const previousBottom = slab.y1; slab.y1 = slab.y2 - 25; slab.subtype = 'f';
      for (const light of lighting) if (light.x1 === slab.x1 && light.y1 === previousBottom) light.y1 = light.y2 = slab.y1;
    }
  }
  for (const x of axes) walls.push(...cut(box(x - 9, x + 9, 0, wallTop, 0, bodyDepth), 'y', wallTop >= 2684 ? [1976] : []));
  const top = box(-input.widthMm / 2 + 12, input.widthMm / 2 - 12, wallTop, wallTop + 12, 0, depth, 't');
  const topCuts: number[] = [];
  if (top.x2 - top.x1 >= 2700) {
    const candidates = axes.slice(1, -1);
    const valid = candidates.filter(x => x - top.x1 < 2700 && top.x2 - x < 2700);
    if (valid.length) topCuts.push(valid.reduce((a, b) => Math.abs(b) <= Math.abs(a) ? b : a));
    else topCuts.push(Math.max(...candidates.filter(x => x - top.x1 < 2700)), Math.min(...candidates.filter(x => top.x2 - x < 2700)));
  }
  const frame = cut(top, 'x', topCuts);
  for (const x of [-input.widthMm / 2, input.widthMm / 2 - 12]) frame.push(...cut(box(x, x + 12, 0, wallTop + 13, 0, depth, 's'), 'y', wallTop + 13 > 2700 ? [1959] : []));
  const masking_bars = cut(box(top.x1, top.x2, 0, 35, depth - 14, depth), 'x', topCuts);
  for (const part of masking_bars) delete part.subtype;
  const hinges = generateToneHingeEnvelopes({
    doors: doors.map(door => ({ ...door, direction: door.direction as 1 | 2,
      offset: { top: door.extremes?.includes('top') ? -5 : 2, bottom: door.extremes?.includes('bottom') ? 6 : 2 } })),
    standardShelves: hingeShelves,
    drawers,
  });
  return { model: 'tone', hinges, width: input.widthMm, height: input.heightMm, depth, slabs, walls, backs, frame, masking_bars, doors, drawers, drawer_fronts, bars, components, lighting };
}
export function generateToneWardrobe(value: WardrobeInput): WardrobeResult {
  const normalized = normalizeToneWardrobe(value), source = generateToneSourceGeometry(normalized);
  const result = adaptWardrobeRenderGeometry(source, normalized.sections.map(s => s.id));
  result.sourceGeometryMm = source;
  if (normalized.sections.some(s => s.widthMm != null)) result.unsupported.push('tone-independent-section-width');
  if (normalized.sections.some(s => s.localHeightMm != null || s.localDepthMm != null)) result.unsupported.push('tone-local-height-depth');
  if (normalized.sections.some(s => s.facade && s.facade !== 'closed')) result.unsupported.push('tone-open-facade');
  return result;
}
