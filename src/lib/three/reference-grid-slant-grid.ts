import type { PanelData } from '@/types/shelf';
import type { GridInput, GridResult, ReferenceOpening } from './styles/grid';
import type { ReferenceFront } from './reference-hardware';
import { effectiveHardwareStyle } from './hardware-state.ts';
import { splitReferenceHorizontals } from './reference-horizontal-splits.ts';
import data from './reference-grid-slant-grid-rules.json' with { type: 'json' };

/** Type02 container 3 / mesh 2169. Integer remainders belong to the leftmost
 * columns, so equal division is not cumulative floating-point interpolation. */
export function calculateReferenceGrid(input: GridInput): GridResult {
  const width = Math.round(input.width * 10);
  const depth = input.depth * 10;
  const rows = Math.max(1, Math.min(10, Math.trunc(input.numRows)));
  const candidates = data.setups.filter(s => width >= s.range[0] && width <= s.range[1]);
  const density = Math.max(0, Math.min(100, input.density));
  const selected = candidates[Math.max(0, Math.ceil(density * candidates.length / 100) - 1)];
  if (!selected) throw new Error(`No reference Grid configuration at ${width} mm`);
  const span = width - 18;
  const originalCount = selected.columns.length;
  const base = Math.floor(span / originalCount), remainder = span % originalCount;
  // Public Type02 mesh preprocessing bisects every axis interval >568 mm.
  // Both halves inherit the column group. Only an outer one-sided support stays.
  const columns = selected.columns.flatMap((column, index) => {
    const size = base + (index < remainder ? 1 : 0);
    if (size <= 568) return [{ ...column, size }];
    const first = Math.round(size / 2);
    return [
      { ...column, size: first, support: column.support === 3 ? 0 : column.support },
      { ...column, size: size - first, support: column.support === 2 ? 0 : column.support },
    ];
  });
  const count = columns.length;
  const axes = [-width / 2 + 9];
  for (let col = 0; col < count; col++) axes.push(axes[col] + columns[col].size);
  const levels = [0];
  for (let row = 0; row < rows; row++) levels.push(levels[row] + Math.round(((input.rowHeights[row] ?? 28) + 2) * 10));
  const panels: PanelData[] = [];
  const fronts: ReferenceFront[] = [];
  const openings: ReferenceOpening[] = [];
  const add = (x1: number, x2: number, y1: number, y2: number, z1: number, z2: number, matType: PanelData['matType']) => {
    panels.push({x:(x1+x2)/20,y:(y1+y2)/20,z:(z1+z2)/20,w:(x2-x1)/10,h:(y2-y1)/10,d:(z2-z1)/10,
      matType,castShadow:matType!=='backPanel',receiveShadow:true});
  };
  levels.forEach(y => add(-width/2,width/2,y,y+18,0,depth,'horizontalBase'));
  const fills: Record<number,string[]> = {11:['O','O'],12:['O','D'],13:['D','D'],21:['O','T'],22:['T','D'],31:['T','T']};
  for (let row = 0; row < rows; row++) {
    const bottom=levels[row]+18, top=levels[row+1];
    const requested=input.hardwareRowStyles?.[row] ?? (input.hardwareLayers?.includes(row)?12:11);
    const style=effectiveHardwareStyle(requested,row,input.rowHeights,input.depth);
    axes.forEach(x=>add(x-9,x+9,bottom,top,0,depth,'verticalBase'));
    for(let col=0;col<count;col++) {
      const left=axes[col]+9,right=axes[col+1]-9;
      const config=columns[col];
      const fill=fills[style][config.group==='a'?0:1];
      const cell={x:(left+right)/20,y:(bottom+top)/20,width:(right-left)/10,height:(top-bottom)/10,rowIndex:row,rowSpan:1,openLeft:false,openRight:false};
      openings.push(cell);
      if(fill==='D'||fill==='T') fronts.push({...cell,type:fill==='D'?'door':'drawer',hingeSide:'right',family:input.family??'type02'});
      if(input.hasBackPanel||fill!=='O') add(left,right,bottom,top,0,12,'backPanel');
      else {
        if(config.support===2||config.support===4) add(left,left+125,bottom,top,0,12,'supportPanel');
        if(config.support===3||config.support===4) add(right-125,right,bottom,top,0,12,'supportPanel');
      }
    }
  }
  return {panels:splitReferenceHorizontals(panels,input.width,'grid').panels,panelCount:count+1,panelSpacing:span/count/10,
    fronts,openings,bodyHeight:(levels[rows]+18)/10,boardThickness:1.8};
}
