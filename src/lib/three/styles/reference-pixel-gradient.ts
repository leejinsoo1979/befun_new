import type { PanelData } from '@/types/shelf';
import type { GridInput, GridResult, ReferenceOpening } from './grid';
import type { ReferenceFront } from '../reference-hardware.ts';
import { effectiveHardwareStyle } from '../hardware-state.ts';
import { splitReferenceHorizontals } from '../reference-horizontal-splits.ts';
import data from './reference-pixel-gradient-data.json' with { type: 'json' };

type Style = 'pixel' | 'gradient';
type Layout = { range: number[]; cells: number[][] };
export type ReferencePixelGradientResult = GridResult & {
  fronts: ReferenceFront[]; openings: ReferenceOpening[]; bodyHeight: number;
  boardThickness: number; internalWidths: number[];
};

function selectLayout(layouts: Layout[], width: number, density: number): Layout {
  const available = layouts.filter(layout => width >= layout.range[0] && width <= layout.range[1]);
  // The reference's pixel width control moves in whole centimetres; the nearest
  // lower layout also keeps non-UI saved fractional widths usable.
  if (!available.length) return layouts.filter(layout => layout.range[0] <= width).at(-1) ?? layouts[0];
  return available[Math.max(0, Math.ceil(density / (100 / available.length)) - 1)];
}

/** Three density waypoints constrained by narrow columns, main bays and wings. */
function pixelWaypoints(count: number, axis: number): number[][] {
  const narrow = 191 / axis;
  const maximum = 567 / axis;
  const wing = 250 / axis;
  const equal = axis / count / axis;
  const special = [[952,1072,2],[1332,1822,2],[2102,2382,5],[2852,3162,6],[3612,3932,7],[4372,4500,8]]
    .find(([lo,hi]) => axis >= lo && axis <= hi);
  const narrowCount = special?.[2] ?? ({1:0,2:0,3:2,5:4,7:5,9:6,11:7,13:8} as Record<number,number>)[count];
  const wide = (axis - 191 * narrowCount) / (count - narrowCount) / axis;
  if (count === 1) return [[equal,equal]];
  if (count === 2) return [[narrow,equal,1-narrow],[1-narrow,equal,narrow]];
  if (count === 3) return special ? [[(1-maximum)/2,(1-maximum)/2],[maximum,maximum],[(1-maximum)/2,(1-maximum)/2]]
    : [[narrow,narrow],[wide,wide],[narrow,narrow]];
  if (count === 5) {
    if (special) {
      const remaining = 1-(2*narrow+maximum+wing);
      const correction = 1-(wing+maximum+3*narrow);
      const main = correction < 0 ? maximum+correction : maximum;
      const outer = remaining > wing ? wing : remaining < narrow ? narrow : remaining;
      const overflow = remaining > wing ? Math.abs(wing-remaining) : 0;
      const small = narrow+overflow/2;
      const middle = (main+narrow+overflow)/2;
      const quarter = (1-maximum)/4;
      return [[wing,quarter,outer],[main,quarter,narrow],[small,maximum,middle],[small,quarter,middle],[outer,quarter,wing]];
    }
    const spare = 1-(wing+4*narrow);
    const outer = spare < 0 ? wing+spare : wing;
    const main = wide-(outer-narrow);
    const half = (wide-(outer-narrow))/2+narrow/2;
    return [[outer,narrow,narrow],[main,narrow,narrow],[narrow,wide,half],[narrow,narrow,half],[narrow,narrow,outer]];
  }
  if (special) {
    const mainCount = (count-5)/2;
    const packed = wing+mainCount*maximum+(maximum-(wing-narrow))+(mainCount+2)*narrow+wing;
    const remainder = 1-packed;
    const outer = remainder < 0 && wing+remainder <= wing ? wing+remainder : wing;
    const overflow = remainder > 0 ? Math.abs(remainder) : 0;
    const half = (maximum-(wing-narrow))/2+narrow/2+overflow/2;
    const middleSmall = (1-(mainCount+1)*maximum)/(mainCount+4);
    const n = narrow, m = maximum, h = half, q = middleSmall, w = wing, o = outer;
    const layouts: Record<number,number[][]> = {
      7:[[w,q,o],[m,q,n],[h,m,n],[n,q,m],[n,m,h],[h,q,h],[o,q,w]],
      9:[[w,q,o],[m,q,n],[h,m,n],[n,q,m],[n,m,h],[m,q,n],[n,m,h],[h,q,m],[o,q,w]],
      11:[[w,q,o],[m,q,n],[h,m,n],[n,q,m],[n,m,h],[m,q,n],[n,m,h],[h,q,m],[m,m,n],[n,q,m],[o,q,w]],
      13:[[w,q,o],[m,q,n],[h,m,n],[n,q,m],[n,m,h],[m,q,n],[n,m,h],[h,q,m],[m,m,n],[m,q,m],[n,m,m],[n,q,n],[o,q,w]],
    };
    return layouts[count];
  }
  const half = (wide-(wing-narrow))/2+narrow/2;
  const n = narrow, m = wide, h = half, w = wing;
  return ({
    7:[[w,n,n],[m,n,n],[h,m,n],[n,n,m],[n,m,h],[h,n,h],[n,n,w]],
    9:[[w,n,n],[m,n,n],[h,m,n],[n,n,m],[n,m,h],[m,n,n],[n,m,h],[h,n,m],[n,n,w]],
    11:[[w,n,n],[m,n,n],[h,m,n],[n,n,m],[n,m,h],[m,n,n],[n,m,h],[h,n,m],[m,m,n],[n,n,m],[n,n,w]],
    13:[[w,n,n],[m,n,n],[h,m,n],[n,n,m],[n,m,h],[m,n,n],[n,m,h],[h,n,m],[m,m,n],[m,n,m],[n,m,m],[n,n,n],[n,n,w]],
  } as Record<number,number[][]>)[count];
}

function axisPositions(style: Style, count: number, width: number, density: number): number[] {
  const axis = width-18;
  let waypoints: number[][];
  let step: number;
  let motion = Math.round(density);
  if (style === 'gradient') {
    const special = [[682,972],[1342,1772],[2392,2782]].some(([lo,hi])=>axis>=lo&&axis<=hi);
    waypoints = (data.gradientRatios as Record<string,number[][]>)[`${count}${special?'b':''}`];
    step = 10;
  } else {
    waypoints = pixelWaypoints(count,axis);
    step = Math.floor(100/(waypoints[0].length-1));
    if (density>=46&&density<=54) motion=50;
  }
  const segment = Math.floor(motion/step);
  const fraction = (motion%step)/step;
  let sum = 0;
  return [0,...waypoints.map((values,index)=>{
    sum += segment < values.length-1 ? values[segment]+fraction*(values[segment+1]-values[segment]) : values[segment];
    return index===count-1 ? axis : Math.floor(sum*axis);
  })];
}

export function referenceAxisWidths(style: Style, width: number, density: number): number[] {
  const mm = Math.round(width*10);
  const layout = selectLayout(style==='pixel'?data.pixel[0]:data.gradient,mm,density);
  const xs = axisPositions(style,layout.cells.length,mm,density);
  return xs.slice(1).flatMap((x,i)=>{
    const size=x-xs[i];
    return style==='gradient'&&size>568 ? [Math.round(size/2),size-Math.round(size/2)] : [size];
  });
}

export function calculateReferencePixelGradient(input: GridInput, style: Style): ReferencePixelGradientResult {
  const width = Math.round(input.width*10);
  const density = Math.max(0,Math.min(100,input.density));
  const rows = Math.max(1,input.numRows);
  const first = selectLayout(style==='pixel'?data.pixel[0]:data.gradient,width,density);
  const axes = axisPositions(style,first.cells.length,width,density);
  const segments = first.cells.flatMap((_,index)=>{
    const start=axes[index], end=axes[index+1];
    const middle=start+Math.round((end-start)/2);
    return style==='gradient'&&end-start>568 ? [{start,end:middle,index,part:0,parts:2},{start:middle,end,index,part:1,parts:2}]
      : [{start,end,index,part:0,parts:1}];
  });
  const ys=[9];
  for(let row=0;row<rows;row++) ys.push(ys[row]+Math.round(((input.rowHeights[row]??28)+2)*10));
  const count=segments.length;
  const horizontal=Array.from({length:rows+1},()=>Array<boolean>(count).fill(false));
  const vertical=Array.from({length:rows},()=>Array<boolean>(count+1).fill(false));
  const openings: ReferenceOpening[]=[];
  const fronts: ReferenceFront[]=[];
  const panels: PanelData[]=[];
  const add=(x1:number,x2:number,y1:number,y2:number,d:number,matType:PanelData['matType'])=>{
    panels.push({x:(x1+x2)/20,y:(y1+y2)/20,z:d/20,w:(x2-x1)/10,h:(y2-y1)/10,d:d/10,matType,
      castShadow:matType!=='backPanel',receiveShadow:true});
  };
  const hardware=new Set(input.hardwareLayers??[]);
  for(let row=0;row<rows;row++) {
    // Pixel's boundary rows use their own omissions, while middle rows alternate.
    const phase=rows===1?0:row===0?1:(row+1)%2===0?0:row===rows-1?3:2;
    const layout=style==='pixel'?selectLayout(data.pixel[phase],width,density):first;
    const mode=effectiveHardwareStyle(input.hardwareRowStyles?.[row]??(hardware.has(row)?12:11),row,input.rowHeights,input.depth);
    const channels:Record<number,string[]>=style==='pixel'?
      {11:['O','O','O','O'],12:['O','D','D','O'],13:['D','D','D','D'],21:['O','T','T','O'],22:['D','T','D','T'],31:['T','T','T','T']}:
      {11:['O','O'],12:['O','D'],13:['D','D'],21:['O','T'],22:['T','D'],31:['T','T']};
    segments.forEach((segment,col)=>{
      const [left,right,bottom,top,back,channel]=layout.cells[segment.index];
      horizontal[row][col] ||= !!bottom;
      horizontal[row+1][col] ||= !!top;
      vertical[row][col] ||= !!left;
      vertical[row][col+1] ||= !!right;
      let kind=channel<0?'O':channels[mode][channel];
      if(style==='pixel'&&kind==='T'&&segment.end-segment.start<282) kind=mode===22&&(input.rowHeights[row]??28)>18?'D':'O';
      const x1=segment.start-width/2+9+(left?9:0),x2=segment.end-width/2+9-(right?9:0);
      const y1=ys[row]+(bottom?9:0),y2=ys[row+1]-(top?9:0);
      const opening={rowIndex:row,rowSpan:1,x:(x1+x2)/20,y:(y1+y2)/20,width:(x2-x1)/10,height:(y2-y1)/10,openLeft:!left,openRight:!right};
      openings.push(opening);
      if(kind==='D'||kind==='T') fronts.push({...opening,type:kind==='D'?'door':'drawer',family:input.family??'type02'});
      const fullBack=back===1||kind==='D'||kind==='T'||(input.hasBackPanel&&left&&right&&bottom&&top);
      if(fullBack) add(x1,x2,y1,y2,12,'backPanel');
      else {
        if((back===2||back===4)&&segment.part===0) add(x1,x1+125,y1,y2,12,'backPanel');
        if((back===3||back===4)&&segment.part===segment.parts-1) add(x2-125,x2,y1,y2,12,'backPanel');
      }
    });
  }
  for(let row=0;row<=rows;row++) {
    for(let col=0;col<count;) {
      if(!horizontal[row][col]){col++;continue;}
      const start=col++;
      while(col<count&&horizontal[row][col])col++;
      add(segments[start].start-width/2,segments[col-1].end-width/2+18,ys[row]-9,ys[row]+9,input.depth*10,'horizontalBase');
    }
  }
  for(let row=0;row<rows;row++)for(let col=0;col<=count;col++) {
    if(!vertical[row][col])continue;
    const x=(col===count?segments[count-1].end:segments[col].start)-width/2+9;
    const below=horizontal[row][col-1]||horizontal[row][col];
    const above=horizontal[row+1][col-1]||horizontal[row+1][col];
    add(x-9,x+9,ys[row]+(below?9:0),ys[row+1]-(above?9:0),input.depth*10,'verticalBase');
  }
  return {panels:splitReferenceHorizontals(panels,input.width,style).panels,fronts,openings,bodyHeight:(ys[rows]+9)/10,
    boardThickness:1.8,panelCount:count+1,panelSpacing:(width-18)/count/10,internalWidths:segments.map(s=>(s.end-s.start-18)/10)};
}
