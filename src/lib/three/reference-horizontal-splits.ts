import type { PanelData } from '@/types/shelf';

/** Reference horizontal manufacturing joints, in millimetres from the physical left/bottom edges.
 * Call before adding compartment insert shelves. Those are independent parts and
 * must not become levels in the structural-board graph. Public modules 1502–1507
 * use column paths for Grid/Gradient/Charlie (Pixel), and a visibility-weighted
 * graph for Pattern/Slant/Porto (Mosaic). This only matches the split stage when
 * given the same structural axes; it does not establish style-generation parity. */
export interface HorizontalSplit { x: number; y: number }
export type HorizontalSplitStyle = 'grid' | 'slant' | 'pattern' | 'mosaic' | 'pixel' | 'gradient';
type Board = { x1: number; x2: number; y1: number; y2: number };
type Direction = 'UP' | 'DOWN' | 'BOTH';
type Node = HorizontalSplit & { id: string; direction: Direction; valid: boolean;
  last: boolean; edges: Node[]; level: Level };
type Level = { y: number; start: number; end: number; bottom: boolean;
  edges: number[]; nodes: Node[]; next: Level[] };
type Path = { nodes: Node[]; cost: number };
type Range = Board;
const MAX_LENGTH = 2400;
const HALF = 9;
const order = (a: Board, b: Board) => b.y1 - a.y1 || a.x1 - b.x1;
const inside = (x: number, a: number, b: number) => x > a && x < b;

/** Grid/Gradient/Charlie use continuous column candidates, rather than graph
 * costs. Candidate order and ties are significant in the public split stage. */
function simplePaths(horizontals: Board[], verticals: Board[], pixel: boolean): { paths: Path[]; chosen: Node[][]; center: number } {
  type Segment = { x: number; top: number; bottom: number };
  const columns = new Map<number, Segment[]>();
  verticals.forEach(v => {
    for (const x of [v.x1 - HALF, v.x1 + HALF]) columns.set(x,
      [...(columns.get(x) ?? []), { x, top: v.y2 + HALF, bottom: v.y1 - HALF }]);
  });
  const boards = [...horizontals].sort((a, b) => a.y1 - b.y1);
  const heights = [...new Set(boards.map(b => b.y1))];
  const span = pixel ? boards.find(b => b.y1 === heights[1])! : horizontals[0];
  const start = span.x1, end = span.x2, center = (start + end) / 2;
  const onBoard = (b: Board, s: Segment) => b.y1 === s.top && b.x1 <= s.x && b.x2 >= s.x;
  const atLevel = new Map<Board, Segment[]>();
  boards.forEach((b, index) => {
    if (!index) return;
    const segments = [...columns.values()].flat().filter(s => onBoard(b, s)).sort((a, b) => a.x - b.x);
    if (segments.length) atLevel.set(b, segments);
  });
  const candidates: { segments: Segment[]; permitted: boolean }[] = [];
  for (const [, segments] of [...columns].sort(([a], [b]) => a - b)) {
    let top = Infinity, bottom = Infinity, continuous = true, leftAllowed = true, rightAllowed = true;
    segments.forEach((s, index) => {
      const edge = boards.some(b => (b.x1 + 18 === s.x || b.x2 - 18 === s.x) && (b.y1 === s.top || b.y1 === s.bottom));
      const board = boards.find(b => onBoard(b, s));
      if (board) {
        const peers = atLevel.get(board)!;
        const position = peers.findIndex(p => p.x === s.x && p.top === s.top && p.bottom === s.bottom);
        if (pixel) {
          const axes = new Set(verticals.map(v => Math.trunc(v.x1))).size;
          leftAllowed = position > 2 && position < peers.length - (axes < 10 ? 4 : 5);
          rightAllowed = position > (axes < 10 ? 3 : 4) && position < peers.length - 3;
        } else {
          leftAllowed = position < peers.length - 3 || position === peers.length - 1;
          rightAllowed = position > 2 || position === 0;
        }
      }
      if (!edge) {
        if (!index) top = s.top;
        if (index === segments.length - 1) bottom = s.bottom;
        if (index < segments.length - 1 && s.bottom !== segments[index + 1].top) continuous = false;
      }
    });
    if (bottom === heights[0] && top === heights[heights.length - 1] && continuous)
      candidates.push({ segments, permitted: leftAllowed && rightAllowed });
  }
  const asPath = (segments: Segment[]): Path => {
    const points = segments.map(s => ({ x: s.x, y: s.top }));
    points.push({ x: segments[segments.length - 1].x, y: segments[segments.length - 1].bottom });
    return { cost: 0, nodes: points.map(p => ({ ...p, id: `${p.y}|${p.x}`, direction: 'BOTH', valid: false,
      last: false, edges: [], level: {} as Level })) };
  };
  let paths = candidates.filter(c => c.permitted && c.segments[0].x - start <= MAX_LENGTH && end - c.segments[0].x <= MAX_LENGTH).map(c => asPath(c.segments));
  if (paths.length) {
    const best = paths.reduce((a, b) => Math.abs(b.nodes[0].x - center) < Math.abs(a.nodes[0].x - center) ? b : a);
    return { paths, chosen: [best.nodes], center };
  }
  const third = (end - start) / 3;
  const nearThird = (c: { segments: Segment[] }) => Math.abs(start + third - c.segments[0].x) < 600 || Math.abs(end - third - c.segments[0].x) < 600;
  paths = candidates.filter(c => c.permitted && nearThird(c)).map(c => asPath(c.segments));
  if (!paths.length) paths = candidates.filter(nearThird).map(c => asPath(c.segments));
  const left = paths.filter(p => p.nodes[0].x <= center).sort((a, b) => Math.abs(a.nodes[0].x - start - third) - Math.abs(b.nodes[0].x - start - third));
  const right = paths.filter(p => p.nodes[0].x > center).sort((a, b) => Math.abs(a.nodes[0].x - end + third) - Math.abs(b.nodes[0].x - end + third));
  for (const a of left) for (const b of right) if (a.nodes[0].x - start <= MAX_LENGTH && b.nodes[0].x - a.nodes[0].x <= MAX_LENGTH && end - b.nodes[0].x <= MAX_LENGTH)
    return { paths, chosen: [a.nodes, b.nodes], center };
  if (!left.length || !right.length) throw new Error('No continuous reference horizontal split candidates.');
  return { paths, chosen: [left[0].nodes, right[0].nodes], center };
}

function pathsFor(horizontals: Board[], verticals: Board[], unrestricted: boolean, visibilityWeight: number): { paths: Path[]; center: number } {
  const levels = new Map<number, Level[]>();
  horizontals.forEach((h, i) => {
    const level: Level = { y: h.y1, start: h.x1, end: h.x2,
      bottom: i === horizontals.length - 1, edges: [], nodes: [], next: [] };
    levels.set(h.y1, [...(levels.get(h.y1) ?? []), level]);
  });
  const attach = (x: number, y: number, direction: Direction) => {
    const level = levels.get(y)?.find(l => x >= l.start && x <= l.end);
    if (!level) throw new Error('Horizontal split graph requires structural boundary planes.');
    if (direction === 'UP') level.edges.push(x);
    for (const candidate of [x - HALF, x + HALF]) {
      const id = `${y}|${candidate}`;
      const existing = level.nodes.find(n => n.id === id);
      if (existing) existing.direction = 'BOTH';
      else level.nodes.push({ x: candidate, y, id, direction, last: false, edges: [], level,
        valid: unrestricted || (candidate - level.start <= MAX_LENGTH && level.end - candidate <= MAX_LENGTH) });
    }
  };
  verticals.forEach(v => { const x = (v.x1 + v.x2) / 2;
    attach(x, v.y2 + HALF, 'UP'); attach(x, v.y1 - HALF, 'DOWN'); });
  const heights = [...levels.keys()].sort((a, b) => b - a);
  const roots = levels.get(heights[0])!;
  const last = levels.get(heights[heights.length - 1])!;
  heights.forEach((y, i) => {
    if (i === heights.length - 1) levels.get(y)!.forEach(l => l.nodes.forEach(n => { n.last = true; }));
    else {
      const next = levels.get(heights[i + 1])!;
      levels.get(y)!.forEach(l => { l.next = next.length === 1 ? next : next.filter(n => n.end >= l.start && n.start <= l.end); });
    }
  });
  const validNodes = (level: Level) => {
    level.edges.sort((a, b) => a - b);
    return level.nodes.filter(n => n.valid && (level.bottom || inside(n.x, level.edges[1], level.edges[level.edges.length - 2])));
  };
  for (const group of levels.values()) for (const level of group) {
    level.edges.sort((a, b) => a - b);
    const nodes = validNodes(level);
    for (let i = 1; i < level.edges.length - 2; i++) {
      const left = level.edges[i], right = level.edges[i + 1];
      const direct = level.next.filter(l => l.start < left && l.end > right);
      // A two-row opening has no board at the intermediate level.
      const next = direct.length === 1 ? direct[0] : level.next.flatMap(l => l.next).find(l => l.start < left && l.end > right);
      if (!next) continue;
      const destinations = next.nodes.filter(n => n.valid && inside(n.x, left, right));
      nodes.filter(n => inside(n.x, left, right)).forEach(n => { n.edges.push(...destinations); });
    }
  }
  const ends = last.flatMap(validNodes);
  const visibility = (n: Node) => {
    if (n.direction === 'BOTH') return -100;
    return ((n.direction === 'UP' && n.y < 1600) || (n.direction === 'DOWN' && n.y > 1600)) ? (n.y - 1600) ** 2 * visibilityWeight : 0;
  };
  const heuristic = (n: Node) => {
    const end = ends.reduce((a, b) => Math.abs(b.x - n.x) < Math.abs(a.x - n.x) ? b : a);
    return Math.hypot(end.x - n.x, end.y - n.y) + visibility(n);
  };
  const search = (root: Node): Path | null => {
    const visited = new Set<string>(), queue = [root];
    const previous = new Map<string, Node>();
    const distances = new Map([[root.id, 0]]), scores = new Map([[root.id, heuristic(root)]]);
    while (queue.length) {
      let index = 0;
      queue.forEach((n, i) => { if (scores.get(n.id)! < scores.get(queue[index].id)!) index = i; });
      const current = queue[index];
      if (current.last) {
        const nodes = [current]; let cost = scores.get(current.id)!; let n = current;
        while (previous.has(n.id)) { n = previous.get(n.id)!; nodes.push(n); cost += scores.get(n.id)!; }
        return { nodes, cost };
      }
      queue.splice(index, 1); visited.add(current.id);
      for (const next of current.edges) {
        if (visited.has(next.id)) continue;
        const distance = distances.get(current.id)! + Math.abs(next.x - current.x);
        if (queue.some(n => n.id === next.id)) distances.set(next.id, Math.min(distances.get(next.id)!, distance));
        else { distances.set(next.id, distance); queue.push(next); }
        // The reference updates the predecessor even when the old distance wins.
        previous.set(next.id, current); scores.set(next.id, distances.get(next.id)! + heuristic(next));
      }
    }
    return null;
  };
  return { center: (roots[0].start + roots[0].end) / 2,
    paths: ends.length ? roots.flatMap(validNodes).map(search).filter((p): p is Path => !!p) : [] };
}

function validationRanges(horizontals: Board[], verticals: Board[], backs: Board[], supports: Board[]): Range[] {
  const obstacles: Range[] = [];
  for (const [boards, low, high] of [[verticals, 0, 9], [backs, 45, 80], [supports, 24, 101]] as const) {
    for (const b of boards) {
      const axis = b.x1 === b.x2 ? HALF : 0;
      if (b.x1 + high >= b.x2 - high) obstacles.push({ ...b, x1: b.x1 + low - axis, x2: b.x2 - low + axis });
      else obstacles.push({ ...b, x1: b.x1 + low - axis, x2: b.x1 + high + axis },
        { ...b, x1: b.x2 - high - axis, x2: b.x2 - low + axis });
    }
  }
  return horizontals.flatMap(h => {
    const touching = obstacles.filter(b => b.y2 + HALF === h.y1 || b.y1 - HALF === h.y2).sort((a, b) => a.x1 - b.x1);
    const seen = new Set<number>(), merged: Range[] = [];
    touching.forEach((b, index) => {
      const cluster = touching.filter((c, i) => {
        if (c.x1 >= b.x1 && c.x1 < b.x2 && !seen.has(i)) { seen.add(i); return true; }
        return false;
      });
      const range = { x1: Math.round(Math.min(b.x1, ...cluster.map(c => c.x1))),
        x2: Math.round(Math.max(b.x2, ...cluster.map(c => c.x2))), y1: h.y1 - HALF, y2: h.y2 + HALF };
      const overlap = merged.find(c => range.x1 >= c.x1 && range.x1 < c.x2);
      if (overlap) overlap.x2 = Math.round(Math.max(overlap.x2, range.x2)); else merged.push(range);
      seen.add(index);
    });
    return merged;
  });
}

function adjustNode(node: Node, ranges: Range[], verticals: Board[], horizontals: Board[], single: boolean): boolean {
  const onLevel = (r: Board) => inside(node.y, r.y1, r.y2);
  if (!ranges.some(r => onLevel(r) && inside(node.x, r.x1, r.x2))) return true;
  const nearby = verticals.filter(v => v.y2 + HALF === node.y || v.y1 - HALF === node.y)
    .map(v => ({ ...v, distance: Math.min(Math.abs(node.x - v.x1), Math.abs(node.x - v.x2)) }))
    .sort((a, b) => a.distance - b.distance);
  const left = nearby.filter(v => v.x2 <= node.x), right = nearby.filter(v => v.x1 >= node.x);
  if (!left.length || !right.length) return false;
  const closeLeft = left[0].distance < HALF, closeRight = right[0].distance < HALF;
  const lo = left[closeLeft ? 1 : 0]?.x2, hi = right[closeRight ? 1 : 0]?.x1;
  if (lo === undefined || hi === undefined) return false;
  const endpoints = [...new Set(ranges.filter(onLevel).flatMap(r => [r.x1, r.x2]))].filter(x => inside(x, lo, hi));
  const edge = [lo + HALF, hi - HALF].find(x => endpoints.includes(x));
  const lowerLeft = left.filter(v => v.y2 + HALF === node.y)[closeLeft ? 1 : 0];
  const lowerRight = right.filter(v => v.y2 + HALF === node.y)[closeRight ? 1 : 0];
  const upperLeft = left.filter(v => v.y1 - HALF === node.y)[closeLeft ? 1 : 0];
  const upperRight = right.filter(v => v.y1 - HALF === node.y)[closeRight ? 1 : 0];
  const l = node.y > 1600 ? upperLeft : lowerLeft, r = node.y > 1600 ? upperRight : lowerRight;
  const middle = l && r ? (l.x2 + r.x1) / 2 : null;
  const horizontal = horizontals.find(h => h.y1 === node.y && h.x1 <= node.x && h.x2 >= node.x)!;
  const withinLength = (x: number) => !single || Math.max(Math.abs(x - horizontal.x1), Math.abs(horizontal.x2 - x)) <= MAX_LENGTH;
  if (edge && withinLength(edge) && !closeLeft && !closeRight) { node.x = edge; return true; }
  if (middle !== null && inside(middle, lo, hi) && !ranges.some(r => onLevel(r) && inside(middle, r.x1, r.x2)) && withinLength(middle)) {
    node.x = middle; return true;
  }
  const choices = endpoints.filter(withinLength).sort((a, b) => Math.abs(node.x - a) - Math.abs(node.x - b));
  node.x = choices[0] || node.x;
  return choices.length > 0 && !closeLeft && !closeRight;
}

function avoidsCrossing(path: Node[], verticals: Board[]): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const crossing = verticals.find(v => (v.y1 - HALF === a.y || v.y2 + HALF === b.y) && inside((v.x1 + v.x2) / 2, Math.min(a.x, b.x), Math.max(a.x, b.x)));
    if (!crossing) continue;
    const center = (crossing.x1 + crossing.x2) / 2;
    if (i === 0 && a.valid) a.x = center > a.x ? center + HALF : center - HALF;
    else if (i === path.length - 2 && b.valid) b.x = center > b.x ? center + HALF : center - HALF;
    else return false;
  }
  return true;
}

export function splitReferenceHorizontals(panels: PanelData[], width: number, style: HorizontalSplitStyle): { panels: PanelData[]; paths: HorizontalSplit[][] } {
  // Gallery coordinates can contain half millimetres for odd-mm widths.
  // Remove floating-point conversion noise without rounding physical axes.
  const referenceBoards = panels.filter(p => p.matType === 'horizontalBase').every(p => Math.abs(p.h - 1.8) < 1e-6);
  const mm = (value: number) => referenceBoards ? Math.round(value * 1e7) / 1e6 : Math.round(value * 10);
  const geometry = (p: PanelData): Board => ({ x1: mm(p.x - p.w / 2),
    x2: mm(p.x + p.w / 2), y1: Math.round((p.y - p.h / 2) * 10),
    y2: Math.round((p.y + p.h / 2) * 10) });
  const horizontals = panels.filter(p => p.matType === 'horizontalBase').map(p => ({ ...geometry(p), y1: Math.round(p.y * 10), y2: Math.round(p.y * 10) })).sort(order);
  if (!horizontals.some(h => h.x2 - h.x1 > MAX_LENGTH)) return { panels, paths: [] };
  // The public split stage receives center planes with 18 mm clearances. Older
  // Befun generators still use 20 mm boards: preserve their physical geometry,
  // and map only the graph's contact endpoints to the adjoining center planes.
  const contact = (edge: number, upper: boolean) => {
    const adjacent = panels.filter(p => p.matType === 'horizontalBase' &&
      Math.abs((p.y + (upper ? -p.h : p.h) / 2) * 10 - edge) < 1.01);
    return adjacent.length ? Math.round(adjacent[0].y * 10) + (upper ? -HALF : HALF) : edge;
  };
  const verticals = panels.filter(p => p.matType === 'verticalBase').map(p => {
    const b = geometry(p);
    return { ...b, x1: mm(p.x), x2: mm(p.x),
      y1: contact(b.y1, false), y2: contact(b.y2, true) };
  }).sort(order);
  const rearGeometry = (p: PanelData) => { const b = geometry(p);
    return { ...b, y1: contact(b.y1, false), y2: contact(b.y2, true) };
  };
  const backs = panels.filter(p => p.matType === 'backPanel').map(rearGeometry);
  const supports = panels.filter(p => p.matType === 'supportPanel').map(rearGeometry);
  const simple = ['grid', 'gradient', 'pixel'].includes(style);
  const weight = style === 'slant' || style === 'mosaic' ? .01 : .001;
  let graph: { paths: Path[]; center: number; chosen?: Node[][] } = simple ? simplePaths(horizontals, verticals, style === 'pixel') : pathsFor(horizontals, verticals, false, weight);
  let chosen: Node[][];
  if (graph.chosen) chosen = graph.chosen;
  else if (graph.paths.length) { graph.paths.sort((a, b) => a.cost - b.cost); chosen = [graph.paths[0].nodes]; }
  else {
    graph = pathsFor(horizontals, verticals, true, weight);
    const left = graph.paths.filter(p => style === 'mosaic' ? Math.max(...p.nodes.map(n => n.x)) + 800 <= graph.center && Math.min(...p.nodes.map(n => n.x)) + 1600 >= graph.center : Math.max(...p.nodes.map(n => n.x)) < graph.center).sort((a, b) => a.cost - b.cost)[0];
    const right = graph.paths.filter(p => style === 'mosaic' ? Math.min(...p.nodes.map(n => n.x)) - 300 >= graph.center && Math.max(...p.nodes.map(n => n.x)) - 1400 <= graph.center : Math.max(...p.nodes.map(n => n.x)) >= graph.center).sort((a, b) => a.cost - b.cost)[0];
    if (!left || !right) throw new Error(`No valid ${style} horizontal split route.`);
    chosen = [left.nodes, right.nodes];
  }
  const ranges = validationRanges(horizontals, verticals, backs, supports);
  if (chosen.length === 1) {
    for (const path of graph.paths) {
      const valid = path.nodes.map(n => adjustNode(n, ranges, verticals, horizontals, true)).every(Boolean);
      const crossing = avoidsCrossing(path.nodes, verticals);
      if (valid && crossing) { chosen = [path.nodes.slice()]; break; }
    }
  } else chosen.forEach(path => { path.forEach(n => adjustNode(n, ranges, verticals, horizontals, false)); avoidsCrossing(path, verticals); });
  let result = panels.slice();
  for (const path of chosen) for (const node of path) {
    const index = result.findIndex(p => p.matType === 'horizontalBase' && Math.round(p.y * 10) === node.y && inside(node.x, geometry(p).x1, geometry(p).x2));
    if (index < 0) continue;
    const p = result[index], left = p.x - p.w / 2, right = p.x + p.w / 2, split = node.x / 10;
    result = [...result.slice(0, index), { ...p, x: (left + split) / 2, w: split - left },
      { ...p, x: (split + right) / 2, w: right - split }, ...result.slice(index + 1)];
  }
  return { panels: result, paths: chosen.map(path => path.map(n => ({ x: n.x + width * 5, y: n.y }))) };
}

/** Compatibility entry point; Mosaic insert shelves must be added afterwards. */
export function splitMosaicHorizontals(panels: PanelData[], width: number) {
  return splitReferenceHorizontals(panels, width, 'mosaic');
}
