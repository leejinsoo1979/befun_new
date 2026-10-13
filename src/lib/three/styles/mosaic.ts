import { effectiveHardwareStyle, type HardwareRowStyles } from '../hardware-state.ts';
import type { ReferenceFront } from '../reference-hardware.ts';
import type { PanelData } from '@/types/shelf';
import type { GridResult } from './grid';
import { splitMosaicHorizontals } from '../reference-horizontal-splits.ts';
import rules from './mosaic-rules.json' with { type: 'json' };

export interface MosaicInput {
  width: number;
  height: number;
  depth: number;
  thickness: number;
  density: number;
  rowHeights: number[];
  numRows: number;
  hasBackPanel: boolean;
  hardwareRowStyles?: HardwareRowStyles;
  hardwareLayers?: number[];
}

export interface MosaicCell {
  x: number;
  y: number;
  width: number;
  height: number;
  rowIndex: number;
  rowSpan: number;
  columnIndex: number;
  hasBack: boolean;
  frontType?: 'door' | 'drawer';
}
export type MosaicResult = GridResult & { cells: MosaicCell[]; fronts: ReferenceFront[]; bodyHeight: number };

// PORTO templates define the rear panels; there is no random support placement.
// Current family: Type02. Finish-family mapping and hardware variants remain
// separate work; see docs/tylko-reference/styles/mosaic.md.
export function calculateMosaicPanels(input: MosaicInput): MosaicResult {
  const widthMm = Math.round(input.width * 10);
  const density = Math.max(0, Math.min(100, input.density));
  const numRows = Math.max(1, Math.min(rules.rows.length, input.numRows));
  const t = rules.boardThickness / 10;
  const layouts = rules.rows.slice(0, numRows).map(row => {
    const candidates = row.filter(s => widthMm >= s.widthRange[0] && widthMm <= s.widthRange[1]);
    const index = Math.max(0, Math.ceil(density / (100 / candidates.length)) - 1);
    return candidates[index]?.columns ?? row[0].columns;
  });
  const count = layouts[0].length;
  const axisWidth = widthMm - rules.axisOffset;
  const narrowCount = rules.narrowCounts[count - 1];
  const narrowRatio = rules.narrowWidth / axisWidth;
  const wideRatio = (axisWidth-rules.narrowWidth*narrowCount)/(count-narrowCount)/axisWidth;
  const equalRatio = axisWidth/count/axisWidth;
  const motion = density >= 46 && density <= 54 ? 50 : Math.round(density);
  const ratios = rules.startNarrowColumns[count-1].map((narrow,index)=>{
    const start = narrow ? narrowRatio : wideRatio;
    const end = rules.endNarrowColumns[count-1][index] ? narrowRatio : wideRatio;
    return motion < 50 ? start+(motion/50)*(equalRatio-start)
      : motion < 100 ? equalRatio+((motion-50)/50)*(end-equalRatio) : end;
  });
  let cumulative = 0;
  const xs = [-input.width/2+t/2];
  ratios.forEach((ratio,index)=>{
    cumulative += ratio;
    const fraction = index === count-1 ? 1 : cumulative;
    xs.push(-input.width/2+t/2+Math.floor(fraction*axisWidth)/10);
  });
  const ys = [t / 2];
  for (let row = 0; row < numRows; row++) ys.push(ys[row] + (input.rowHeights[row] ?? 28) + 2);
  const hardwareRows = new Set(input.hardwareLayers ?? []);
  const rowStyles = Array.from({length:numRows},(_,row)=>effectiveHardwareStyle(
    input.hardwareRowStyles?.[row] ?? (hardwareRows.has(row) ? 12 : 11),row,input.rowHeights,input.depth));
  const types: Record<number,string[]> = {11:['O','O','O'],12:['O','D','D'],13:['D','D','D'],21:['O','T','T'],22:['D','T','D'],31:['T','T','T']};
  const cells: MosaicCell[] = [];
  const horizontal = Array.from({ length: numRows + 1 }, () => Array<boolean>(count).fill(true));
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < count; col++) {
      const kind = layouts[row][col];
      const left = xs[col] + t / 2;
      const right = xs[col + 1] - t / 2;
      const bottom = ys[row] + t / 2;
      const top = ys[row + 1] - t / 2;
      let fill = types[rowStyles[row]][kind === 1143 ? 0 : kind === 1150 ? 1 : 2];
      if (fill === 'T' && right-left < 26.4) fill = rowStyles[row] === 22 && input.rowHeights[row] > 18 ? 'D' : 'O';
      if (fill === 'D' && input.rowHeights[row] < 28) fill = 'O';
      const frontType = fill === 'D' ? 'door' as const : fill === 'T' ? 'drawer' as const : undefined;
      const hasBack = kind !== 1143 || input.hasBackPanel || !!frontType;
      // expo2 removes the bottom boundary when both neighbouring rows are open.
      const prior = cells.find(c => c.columnIndex === col && c.rowIndex + c.rowSpan === row);
      const below = rowStyles[row-1];
      const doorStyle = (code:number)=>[12,13,22].includes(code);
      const merge = row > 0 && ((rowStyles[row] === 11 && below === 11) ||
        (doorStyle(rowStyles[row]) && input.rowHeights[row-1] !== 18 && doorStyle(below)) ||
        (rowStyles[row] === 11 && input.rowHeights[row-1] === 18 && [12,13].includes(below)));
      if (kind === 1147 && prior && merge) {
        horizontal[row][col] = false;
        const base = prior.y - prior.height / 2;
        prior.height = top - base;
        prior.y = (top + base) / 2;
        prior.rowSpan++;
        prior.hasBack = true;
      } else {
        cells.push({ x: (left + right) / 2, y: (bottom + top) / 2, width: right - left,
          height: top - bottom, rowIndex: row, rowSpan: 1, columnIndex: col, hasBack, frontType });
      }
    }
  }
  let panels: PanelData[] = [];
  const add = (w: number, h: number, d: number, x: number, y: number, matType: PanelData['matType']) => {
    panels.push({ w, h, d, x, y, z: d / 2, matType,
      castShadow: matType !== 'backPanel', receiveShadow: true });
  };
  for (let row = 0; row <= numRows; row++) {
    let col = 0;
    while (col < count) {
      if (!horizontal[row][col]) { col++; continue; }
      const start = col;
      while (col < count && horizontal[row][col]) col++;
      add(xs[col] - xs[start] + t, t, input.depth, (xs[start] + xs[col]) / 2, ys[row], 'horizontalBase');
    }
  }
  const shelfAt = (col: number, row: number) =>
    (col > 0 && horizontal[row][col - 1]) || (col < count && horizontal[row][col]);
  for (let col = 0; col <= count; col++) {
    let row = 0;
    while (row < numRows) {
      const start = row++;
      while (row < numRows && !shelfAt(col, row)) row++;
      const bottom = ys[start] + t / 2;
      const top = ys[row] - t / 2;
      add(t, top - bottom, input.depth, xs[col], (bottom + top) / 2, 'verticalBase');
    }
  }
  for (const cell of cells) {
    if (cell.hasBack) add(cell.width, cell.height, 1.2, cell.x, cell.y, 'backPanel');
  }
  // Manufacturing joints are independent of compartment boundaries.
  panels = splitMosaicHorizontals(panels, input.width).panels;
  const fronts: ReferenceFront[] = cells.filter(c=>c.frontType).flatMap(c=>{
    const base = {x:c.x,y:c.y,width:c.width,height:c.height,rowIndex:c.rowIndex,type:c.frontType!};
    if (c.frontType === 'drawer' && layouts[c.rowIndex][c.columnIndex] === 1150 && input.rowHeights[c.rowIndex] === 38) {
      const half = (c.height-t)/2;
      return [{...base,height:half,y:c.y-(half+t)/2},{...base,height:half,y:c.y+(half+t)/2}];
    }
    return [base];
  });
  // Fill modules in a 400 mm row have a centre shelf (two 182 mm openings).
  for (let i = cells.length - 1; i >= 0; i--) {
    const cell = cells[i];
    if (layouts[cell.rowIndex][cell.columnIndex] !== 1150 || cell.rowSpan !== 1 || input.rowHeights[cell.rowIndex] !== 38) continue;
    add(cell.width, t, input.depth, cell.x, cell.y, 'horizontalBase');
    const halfHeight = (cell.height - t) / 2;
    const offset = (halfHeight + t) / 2;
    cells.splice(i, 1, { ...cell, height: halfHeight, y: cell.y - offset },
      { ...cell, height: halfHeight, y: cell.y + offset });
  }
  return { panels, cells, fronts, panelCount: count + 1, panelSpacing: axisWidth / count / 10,
    bodyHeight: ys[numRows] + t / 2 };
}
