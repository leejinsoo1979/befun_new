import { splitReferenceHorizontals } from './reference-horizontal-splits.ts';
import { effectiveHardwareStyle } from './hardware-state.ts';
import type { ReferenceFront } from './reference-hardware.ts';
import type { PanelData } from '@/types/shelf';
import type { GridInput, GridResult } from './styles/grid';
import ruleData from './reference-grid-slant-slant-rules.json' with { type: 'json' };

/** Type02 Slant rules from public container 0 / grasshopper 10.
 * Coordinates are evaluated in millimetres, then converted to Befun centimetres.
 * The reference uses 18 mm boards and 200/300/400 mm row pitches. UI labels
 * 18/28/38 are rounded clear dimensions, not the exact physical openings.
 */
interface Rule {
  id: number;
  widthRange: number[];
  densityRanges: number[];
  edgeMargins: number[];
  positionKnots: number[][];
  motionKnots: number[][] | null;
  rowDomain: number;
  rowLayouts: number[];
  rows: number[];
  locked: boolean;
  horizontalMode: number;
  verticalMode: number;
  supportMode: number;
  verticalCondition: number[] | null;
  supportCondition: number[] | null;
  supportLayouts: number[];
  requires: number | null;
  excludes: number | null;
  legMode: number;
  frontCode: string | null;
  leftFrontRows: number[] | null;
  rightFrontRows: number[] | null;
  alternateFrontRows: number[] | null;
  splitRows: number[] | null;
}
interface Node {
  x: number;
  row: number; // boundary index; first clear row is 1
  locked: boolean;
  horizontal: number;
  vertical: number;
  support: number;
  leftFront: number;
  rightFront: number;
  splitX: number;
  forceSplit: boolean;
}
export interface SlantOpening {
  rowIndex: number; // bottom-up
  rowSpan: number;
  x: number;
  y: number;
  width: number;
  height: number;
  openLeft: boolean;
  openRight: boolean;
}
export interface SlantResult extends GridResult {
  openings: SlantOpening[];
  fronts: ReferenceFront[];
  boardThickness: number;
  bodyHeight: number;
  effectiveDensity: number;
}

const rules = ruleData.rules as Rule[];
const HALF_BOARD_MM = ruleData.halfThickness;
const BOARD_MM = 2 * HALF_BOARD_MM;


// Two-stage integer interpolation preserves the reference's quantization,
// including negative offsets and ties. A missing knot interval disables a rule.
export function interpolateSlantKnots(value: number, knots: number[][]): number | null {
  const exact = knots.find(k => k[0] === value);
  if (exact) return exact[1];
  const upper = knots.findIndex(k => k[0] >= value);
  if (upper <= 0) return null;
  const [x0, y0] = knots[upper - 1];
  const [x1, y1] = knots[upper];
  const fraction = Math.floor(((value - x0) * 1e8) / (x1 - x0) + 0.5);
  return y0 + Math.floor(((y1 - y0) * fraction) / 1e8 + 0.5);
}

function withinRanges(value: number, ranges: number[]): boolean {
  return ranges.length === 0 || ranges.some((start, i) =>
    i % 2 === 0 && value >= start && value <= ranges[i + 1]);
}

function enabledOnRow(condition: number[] | null, x: number, width: number, row: number): boolean {
  if (!condition) return true;
  const useDefaultRows = condition[2] === -1;
  const inside = condition[0] === -1 || (x > -width / 2 + condition[0] && x < width / 2 - condition[1]);
  return inside && (useDefaultRows || condition.slice(2).includes(row));
}

function evaluateNodes(width: number, density: number, numRows: number, layout: number | number[]): Node[] {
  const layoutAt = (row: number) => typeof layout === 'number' ? layout : row === 0 ? 1 : layout[row-1];
  const active = new Set<number>();
  const nodes: Node[] = [];
  for (const rule of rules) {
    if (width < rule.widthRange[0] || width > rule.widthRange[1] || !withinRanges(density, rule.densityRanges)) continue;
    if (rule.requires !== null && !active.has(rule.requires)) continue;
    if (rule.excludes !== null && active.has(rule.excludes)) continue;
    const selectedRows = rule.rows.filter(row => row <= numRows &&
      (rule.rowDomain === 0 || (rule.rowDomain === 1 ? row < numRows : row === numRows)) &&
      (rule.rowLayouts.includes(0) || rule.rowLayouts.includes(layoutAt(row))));
    if (selectedRows.length === 0) continue;
    const base = interpolateSlantKnots(Math.trunc(width), rule.positionKnots);
    const offset = rule.motionKnots ? interpolateSlantKnots(density, rule.motionKnots) : 0;
    if (base === null || offset === null) continue;
    const x = base - width / 2 + offset;
    if (x < Math.trunc(-width / 2 + rule.edgeMargins[0]) || x > Math.trunc(width / 2 - rule.edgeMargins[1])) continue;
    active.add(rule.id);
    for (const row of selectedRows) {
      const rowLayout = layoutAt(row);
      const vertical = enabledOnRow(rule.verticalCondition, x, width, row) ? rule.verticalMode : 0;
      const support = enabledOnRow(rule.supportCondition, x, width, row) &&
        (rule.supportLayouts.includes(0) || rule.supportLayouts.includes(rowLayout)) ? rule.supportMode : 0;
      // Keep zero-geometry rules in `active`: later rules can depend on them.
      const code = rule.frontCode ?? '';
      const leftFront = rowLayout > 1 && code[rowLayout - 1] === '1' && (rule.leftFrontRows ?? selectedRows).includes(row) ? 1 : 0;
      const alternate = rowLayout > 1 && code[rowLayout + 5] === '1' && (rule.alternateFrontRows ?? selectedRows).includes(row);
      const rightFront = alternate ? 3 : rowLayout > 1 && code[rowLayout + 2] === '1' && (rule.rightFrontRows ?? selectedRows).includes(row) ? (code[10] === '1' ? 2 : 1) : 0;
      const splitMode = rowLayout > 1 && (!rule.splitRows || rule.splitRows.includes(row)) ? Number(code[rowLayout + 9] ?? 0) : 0;
      const splitX = [0, x - ruleData.supportWidth - HALF_BOARD_MM, x + ruleData.supportWidth + HALF_BOARD_MM, x, x + 10][splitMode];
      if (rule.horizontalMode || vertical || support || leftFront || rightFront || splitMode || rule.legMode) {
        nodes.push({ x, row, locked: rule.locked, horizontal: rule.horizontalMode, vertical, support,
          leftFront, rightFront, splitX, forceSplit: code[14] === '1' });
      }
    }
  }
  // Ordered snapping propagates locked alignments to neighbouring rows.
  let row = 1;
  let passes = 0;
  while (row !== numRows) {
    if (++passes > 10000) throw new Error('Slant snapping did not converge');
    let nextRow = row + 1;
    for (const node of nodes.filter(n => n.row === row)) {
      for (const next of nodes.filter(n => n.row === row + 1 && Math.abs(n.x - node.x) < ruleData.snapDistance)) {
        const distance = Math.abs(node.x - next.x);
        if (distance === 0 || distance >= ruleData.snapDistance) continue;
        if (next.locked) {
          if (!node.locked) {
            node.x = next.x;
            node.locked = true;
            nextRow = row > 0 ? row - 1 : row + 1;
          }
        } else {
          next.x = node.x;
          next.locked = true;
        }
      }
    }
    row = nextRow;
  }
  return nodes;
}

function panel(w: number, h: number, d: number, x: number, y: number, z: number, matType: PanelData['matType']): PanelData {
  return { w: w / 10, h: h / 10, d: d / 10, x: x / 10, y: y / 10, z: z / 10,
    matType, castShadow: matType !== 'backPanel', receiveShadow: true };
}

function deriveOpenings(panels: PanelData[], width: number, boundaries: number[]): SlantOpening[] {
  const rows: SlantOpening[][] = [];
  const t = BOARD_MM / 10;
  const verticals = panels.filter(p => p.matType === 'verticalBase');
  const horizontals = panels.filter(p => p.matType === 'horizontalBase');
  for (let row = 0; row < boundaries.length - 1; row++) {
    const bottom = (boundaries[row] + BOARD_MM) / 10;
    const top = boundaries[row + 1] / 10;
    const center = (bottom + top) / 2;
    const edges = [...new Set(verticals.filter(p => p.y - p.h / 2 < center && p.y + p.h / 2 > center).map(p => p.x))].sort((a, b) => a - b);
    // No side axes means the decoder has no opening (including decimal-width
    // gaps in its discrete rule coverage); do not invent a shelf-wide cell.
    if (edges.length === 0) { rows.push([]); continue; }
    const leftOpen = edges.length === 0 || Math.abs(edges[0] - (-width / 20 + t / 2)) > 0.001;
    const rightOpen = edges.length === 0 || Math.abs(edges[edges.length - 1] - (width / 20 - t / 2)) > 0.001;
    if (leftOpen) edges.unshift(-width / 20 - t / 2);
    if (rightOpen) edges.push(width / 20 + t / 2);
    rows.push(edges.slice(0, -1).map((left, i) => ({ rowIndex: row, rowSpan: 1,
      x: (left + edges[i + 1]) / 2, y: center, width: edges[i + 1] - left - t, height: top - bottom,
      openLeft: i === 0 && leftOpen, openRight: i === edges.length - 2 && rightOpen,
    })).filter(c => c.width > 0));
  }
  const openings: SlantOpening[] = [];
  for (const row of rows) {
    for (const cell of row) {
      const prior = openings.find(p => p.rowIndex + p.rowSpan === cell.rowIndex &&
        Math.abs(p.x - cell.x) < 0.001 && Math.abs(p.width - cell.width) < 0.001 &&
        p.openLeft === cell.openLeft && p.openRight === cell.openRight);
      const boundaryY = (boundaries[cell.rowIndex] + HALF_BOARD_MM) / 10;
      const shelfPresent = horizontals.some(p => Math.abs(p.y - boundaryY) < 0.001 &&
        p.x - p.w / 2 < cell.x && p.x + p.w / 2 > cell.x);
      if (prior && !shelfPresent) {
        const bottom = prior.y - prior.height / 2;
        const top = cell.y + cell.height / 2;
        prior.height = top - bottom;
        prior.y = (bottom + top) / 2;
        prior.rowSpan++;
      } else {
        openings.push({ ...cell });
      }
    }
  }
  return openings;
}

interface FrontInterval { left:number; right:number; row:number; fill:number; flag:number; split:number|null }
const FRONT_STYLES: Record<number,number> = {11:441,12:412,13:413,21:422,22:214,31:423};
function frontIntervals(nodes:Node[], styles:number[], numRows:number): FrontInterval[] {
  const result:FrontInterval[]=[];
  for(let row=1;row<=numRows;row++) {
    const edges=new Map<number,{x:number;left:number;right:number}>();
    const rowNodes=nodes.filter(n=>n.row===row);
    for(const n of rowNodes.filter(n=>n.vertical||n.leftFront||n.rightFront)) {
      const old=edges.get(n.x);
      edges.set(n.x,{x:n.x,left:Math.max(old?.left??0,n.leftFront),right:Math.max(old?.right??0,n.rightFront)});
    }
    const sorted=[...edges.values()].sort((a,b)=>a.x-b.x);
    for(let i=0;i+1<sorted.length;i++) {
      const a=sorted[i],b=sorted[i+1],width=b.x-a.x-BOARD_MM;
      if(!a.right||!b.left||width<=260||width>=1000)continue;
      const style=FRONT_STYLES[styles[row-1]];
      const fill=a.right===3?Math.floor(style/100):Math.floor(style/10)%10;
      const candidate=rowNodes.filter(n=>n.splitX!==0&&n.splitX>a.x+209&&n.splitX<b.x-209).sort((a,b)=>a.splitX-b.splitX)[0];
      const split=width>=519||(width>400&&candidate?.forceSplit)
        ? candidate?.splitX ?? a.x+9+Math.floor(width/2+0.5) : null;
      result.push({left:a.x+9,right:b.x-9,row:row-1,fill,flag:a.right,split});
    }
  }
  return result;
}
function slantFronts(nodes:Node[],requestedNodes:Node[],styles:number[],boundaries:number[]):ReferenceFront[] {
  const requested=frontIntervals(requestedNodes,styles,styles.length);
  const available=frontIntervals(nodes,styles.map(()=>13),styles.length).filter(f=>f.fill===1);
  const fronts:ReferenceFront[]=[];
  for(const interval of available) {
    const divided=interval.right-interval.left>=551;
    const pieces=interval.split===null
      ? [{left:interval.left,right:interval.right,hingeSide:[1,3].includes(interval.flag)?'right' as const:'left' as const,parity:'single' as const}]
      : [{left:interval.left,right:interval.split-(divided?9:0),hingeSide:divided?'right' as const:'left' as const,parity:divided?'single' as const:'double' as const},
         {left:interval.split+(divided?9:0),right:interval.right,hingeSide:'right' as const,parity:divided?'single' as const:'double' as const}];
    for(const piece of pieces) {
      const request=requested.find(r=>r.row===interval.row && [1,2].includes(r.fill) &&
        ((piece.left-2<=r.left&&piece.right+2>=r.right)||(r.left-2<=piece.left&&r.right+2>=piece.right)));
      if(!request)continue;
      const bottom=boundaries[interval.row]+18,top=boundaries[interval.row+1];
      fronts.push({x:(piece.left+piece.right)/20,y:(bottom+top)/20,width:(piece.right-piece.left)/10,
        height:(top-bottom)/10,rowIndex:interval.row,type:request.fill===1?'door':'drawer',hingeSide:piece.hingeSide,parity:piece.parity});
    }
  }
  const joined:ReferenceFront[]=[];
  for(const front of fronts) {
    const prior=joined.at(-1);
    if(front.type==='drawer'&&prior?.type==='drawer'&&prior.rowIndex===front.rowIndex&&
      Math.abs(prior.x+prior.width/2-front.x+front.width/2)<1e-8) {
      const left=prior.x-prior.width/2,right=front.x+front.width/2;
      prior.x=(left+right)/2;prior.width=right-left;prior.hingeSide='right';prior.parity='single';
    } else joined.push(front.type==='drawer'?{...front,hingeSide:'right',parity:'single'}:front);
  }
  return joined;
}

const SLANT_MOTION = {
  none: [[100,51]], single: [[50,0],[100,51]], singleOffset: [[50,34],[100,67]],
  double: [[33,26],[66,51],[100,76]], doubleOffset: [[33,41],[66,61],[100,81]],
  triple: [[25,21],[50,41],[75,61],[100,81]],
};
const SLANT_WIDTH_MOTION: [number,keyof typeof SLANT_MOTION][] = [[300,'none'],[1020,'singleOffset'],[1060,'single'],[1360,'none'],[1440,'singleOffset'],[1710,'double'],[1980,'triple'],[2000,'doubleOffset'],[2410,'double'],[2610,'none'],[2820,'double'],[3180,'none'],[3400,'double'],[3970,'triple'],[4320,'doubleOffset']];
function slantMotion(width: number,density: number) {
  const kind=SLANT_WIDTH_MOTION.findLast(([minimum])=>width>=minimum)![1];
  return SLANT_MOTION[kind].find(([upper])=>density<=upper)![1];
}

export function calculateReferenceSlant(input: GridInput): SlantResult {
  const width = Math.round(input.width * 10);
  const depth = Math.round(input.depth * 10);
  const numRows = Math.max(1, Math.min(10, Math.trunc(input.numRows)));
  const requestedMotion = Math.trunc(Math.max(0, Math.min(100, input.density)));
  const backRows = new Set(input.hardwareLayers ?? []);
  if (input.hasBackPanel) for (let row = 0; row < numRows; row++) backRows.add(row);
  // Slant Type02 discretizes the density slider by width before evaluating rules.
  const motion = slantMotion(width, requestedMotion);
  const hardwareStyles = Array.from({length:numRows},(_,row)=>effectiveHardwareStyle(
    input.hardwareRowStyles?.[row] ?? ((input.hardwareLayers??[]).includes(row)?12:11),row,input.rowHeights,input.depth));
  const openNodes = evaluateNodes(width, motion, numRows, hardwareStyles.map(code=>FRONT_STYLES[code]%10));
  const nodes = evaluateNodes(width, motion, numRows, 3);
  const boundaries = [0];
  for (let row = 0; row < numRows; row++) {
    boundaries.push(boundaries[row] + Math.round(((input.rowHeights[row] ?? 38) + 2) * 10));
  }
  const panels: PanelData[] = [];
  for (let row = 0; row <= numRows; row++) {
    const ends = nodes.filter(n => n.row === row).flatMap(n => {
      switch (n.horizontal) {
        case 1: return [n.x];
        case 2: return [n.x, n.x - BOARD_MM];
        case 3: return [n.x, n.x + BOARD_MM];
        case 4: return [n.x - HALF_BOARD_MM, n.x + HALF_BOARD_MM];
        default: return [];
      }
    }).sort((a, b) => a - b);
    for (let i = 0; i + 1 < ends.length; i += 2) {
      panels.push(panel(ends[i + 1] - ends[i] + BOARD_MM, BOARD_MM, depth,
        (ends[i] + ends[i + 1]) / 2, boundaries[row] + HALF_BOARD_MM, depth / 2, 'horizontalBase'));
    }
  }
  for (const node of nodes) {
    if (node.row === 0) continue;
    const bottom = boundaries[node.row - 1] + BOARD_MM;
    if (node.vertical) {
      const top = boundaries[Math.min(numRows, node.row + (node.vertical === 2 ? 1 : 0))];
      panels.push(panel(BOARD_MM, top - bottom, depth, node.x, (bottom + top) / 2, depth / 2, 'verticalBase'));
    }
  }
  // Type02 uses its front-compatible structure even when fronts are absent.
  for (let row = 1; row <= numRows; row++) {
    const rowNodes = nodes.filter(n => n.row === row);
    const edges = new Map<number, { x: number; left: number; right: number }>();
    for (const n of rowNodes.filter(n => n.vertical || n.leftFront || n.rightFront)) {
      const prior = edges.get(n.x);
      edges.set(n.x, { x: n.x, left: Math.max(prior?.left ?? 0, n.leftFront), right: Math.max(prior?.right ?? 0, n.rightFront) });
    }
    const sorted = [...edges.values()].sort((a, b) => a.x - b.x);
    const splits = rowNodes.filter(n => n.splitX !== 0).sort((a, b) => a.splitX - b.splitX);
    for (let i = 0; i + 1 < sorted.length; i++) {
      const left = sorted[i];
      const right = sorted[i + 1];
      const clearWidth = right.x - left.x - BOARD_MM;
      if (!left.right || !right.left || clearWidth <= 260 || clearWidth >= 1000) continue;
      const candidate = splits.find(n => n.splitX > left.x + 200 + HALF_BOARD_MM && n.splitX < right.x - 200 - HALF_BOARD_MM);
      if (clearWidth < 551 || (clearWidth < 501 + BOARD_MM && !(clearWidth > 400 && candidate?.forceSplit))) continue;
      const splitX = candidate?.splitX ?? left.x + HALF_BOARD_MM + Math.floor(clearWidth / 2 + 0.5);
      const bottom = boundaries[row - 1] + BOARD_MM;
      const top = boundaries[row];
      panels.push(panel(BOARD_MM, top - bottom, depth, splitX, (bottom + top) / 2, depth / 2, 'verticalBase'));
    }
  }
  for (const node of openNodes) {
    if (node.row === 0) continue;
    const bottom = boundaries[node.row - 1] + BOARD_MM;
    if (node.vertical) {
      const top = boundaries[Math.min(numRows, node.row + (node.vertical === 2 ? 1 : 0))];
      const y = (bottom + top) / 20;
      const h = (top - bottom) / 10;
      if (!panels.some(p => p.matType === 'verticalBase' && Math.abs(p.x - node.x / 10) < 4 && p.y === y && p.h === h)) {
        panels.push(panel(BOARD_MM, top - bottom, depth, node.x, (bottom + top) / 2, depth / 2, 'verticalBase'));
      }
    }
    if (node.support) {
      const direction = [1, 3].includes(node.support) ? -1 : 1;
      const top = boundaries[Math.min(numRows, node.row + (node.support >= 3 ? 1 : 0))];
      panels.push(panel(ruleData.supportWidth, top - bottom, 12,
        node.x + direction * (HALF_BOARD_MM + ruleData.supportWidth / 2), (bottom + top) / 2, 6, 'supportPanel'));
    }
  }
  const openings = deriveOpenings(panels, width, boundaries);
  const selectedFronts = slantFronts(nodes,openNodes,hardwareStyles,boundaries);
  // The clean/gallery pipeline drops doors without an actual opening. Its
  // selected back geometry survives, so keep that separate from front cleanup.
  const fronts = selectedFronts.filter(f => f.type === 'drawer' || openings.some(c => c.rowIndex === f.rowIndex &&
    f.x - f.width / 2 >= c.x - c.width / 2 - 0.001 && f.x + f.width / 2 <= c.x + c.width / 2 + 0.001));
  for (const front of selectedFronts.filter(f => !openings.some(c => c.rowIndex === f.rowIndex))) {
    panels.push({ w: front.width, h: front.height, d: 1.2, x: front.x, y: front.y, z: 0.6,
      matType: 'backPanel', castShadow: false, receiveShadow: true });
  }
  for (const cell of openings) {
    const selectedBack = input.hasBackPanel || (!input.hardwareRowStyles && backRows.has(cell.rowIndex)) || fronts.filter(f=>f.rowIndex === cell.rowIndex && Math.abs(f.y-cell.y)<0.001 && f.x>=cell.x-cell.width/2 && f.x<=cell.x+cell.width/2).reduce((sum,f)=>sum+f.width,0)>=cell.width-0.2;
    if (cell.openLeft || cell.openRight || cell.width <= 12.9 || !selectedBack) continue;
    panels.push({ w: cell.width, h: cell.height, d: 1.2, x: cell.x, y: cell.y, z: 0.6,
      matType: 'backPanel', castShadow: false, receiveShadow: true });
  }
  const backs = panels.filter(p => p.matType === 'backPanel');
  const filtered = panels.filter(p => p.matType !== 'supportPanel' || !backs.some(b =>
    Math.abs(p.y - b.y) < 0.001 && b.x - b.w / 2 < p.x + p.w / 2 && b.x + b.w / 2 > p.x - p.w / 2));
  const panelCount = Math.max(2, ...boundaries.slice(1).map((_, row) =>
    1 + openings.filter(c => c.rowIndex <= row && c.rowIndex + c.rowSpan > row).length));
  return { panels: splitReferenceHorizontals(filtered, input.width, 'slant').panels, panelCount, panelSpacing: input.width / Math.max(1, panelCount - 1),
    openings, fronts, boardThickness: BOARD_MM / 10, bodyHeight: (boundaries[numRows] + BOARD_MM) / 10,
    effectiveDensity: motion };
}
