import type { PanelData } from '@/types/shelf';
import type { ReferenceFront } from '../../three/reference-hardware';
import type { ReferenceOpening } from '../../three/styles/grid';

export const DESK_CHANNEL_OPTIONS = [
  { id: 'opening', label: '오픈 수납', seriesId: 4756, pitches: [300, 200, 200], fills: ['O', 'O', 'O'] },
  { id: 'door', label: '도어', seriesId: 4753, pitches: [700], fills: ['D'] },
  { id: 'drawers', label: '서랍 3단', seriesId: 4752, pitches: [300, 200, 200], fills: ['T', 'T', 'T'] },
  { id: 'mix', label: '도어 · 오픈 · 서랍', seriesId: 4754, pitches: [300, 200, 200], fills: ['D', 'O', 'T'] },
  { id: 'drawer', label: '서랍 2단 · 오픈', seriesId: 4755, pitches: [300, 200, 200], fills: ['T', 'T', 'O'] },
  { id: 'some-drawer', label: '오픈 · 서랍', seriesId: 4772, pitches: [300, 200, 200], fills: ['O', 'O', 'T'] },
  { id: 'door-drawer', label: '도어 · 서랍', seriesId: 4773, pitches: [500, 200], fills: ['D', 'T'] },
  { id: 'some-door', label: '도어 · 오픈', seriesId: 4774, pitches: [500, 200], fills: ['D', 'O'] },
] as const;
export type DeskChannelKind = typeof DESK_CHANNEL_OPTIONS[number]['id'];
export interface DeskChannel {
  kind: DeskChannelKind;
  doorDirection?: 'left' | 'right';
  cableOpenings?: boolean;
}
export interface DeskCableOpening {
  panelIndex: number;
  columnIndex: number;
  storageIndex: number | null;
  surface: 'top' | 'back';
  /** Centimetres, body origin (the renderer applies footOffset exactly once). */
  x: number; y: number; z: number; radius: number;
}
export interface DeskInput {
  widthMm: number;
  depthMm: 400 | 500 | 600;
  storageColumns: number;
  legroomPosition: number;
  hasBackPanel: boolean;
  family: 'type01' | 'type02';
  cableManagement?: 'off' | 'left' | 'right';
  /** Indexed by stable storage order (legroom excluded), left to right. */
  channels?: DeskChannel[];
}
export interface DeskResult {
  panels: PanelData[];
  fronts: ReferenceFront[];
  openings: ReferenceOpening[];
  /** Beam boxes and leg anchors use centimetres, same origin as panels. */
  beams: PanelData[];
  feet: { x: number; y: number; z: number }[];
  bodyHeight: number;
  footOffset: number;
  totalHeight: number;
  boardThickness: number;
  availableStorageColumns: number[];
  legroomIndex: number;
  columns: { index: number; storageIndex: number | null; x: number; width: number }[];
  cableOpenings: DeskCableOpening[];
  cableOpeningAvailability: boolean[];
  unsupported: string[];
}
// Only these source compartments offer cable bores; drawer backs never do.
const CABLE_ROWS: Record<DeskChannelKind, readonly number[]> = {
  opening: [0, 1], door: [0], drawers: [], mix: [0, 1], drawer: [2],
  'some-drawer': [0], 'door-drawer': [0], 'some-door': [0, 1],
};
const SETUP_RANGES = [[836,1836],[1254,2454],[1572,3072],[1860,3690],[2208,4308],[2526,4926],[2844,5544]];
export function availableStorageColumns(widthMm: number): number[] {
  if (!Number.isFinite(widthMm) || widthMm < 900 || widthMm > 2400) return [];
  return SETUP_RANGES.flatMap(([min,max], index) => widthMm >= min && widthMm <= max ? [index + 1] : []);
}

/** Desk mesh2498: 700mm column pitch, 18mm panel, 2:1 legroom ratio.
 * No runtime reference API or bundle execution. */
export function calculateDeskGeometry(input: DeskInput): DeskResult {
  const width = Math.round(input.widthMm), depth = input.depthMm;
  const choices = availableStorageColumns(width);
  if (!choices.includes(input.storageColumns)) throw new RangeError('Desk storage count is unavailable at this width');
  if (![400,500,600].includes(depth)) throw new RangeError('Desk depth must be 400, 500 or 600 mm');
  const count = input.storageColumns + 1, legroom = Math.max(0,Math.min(count - 1,Math.trunc(input.legroomPosition)));
  const unit = (width - 18)/(count + 1);
  let remainder = width - 18 - Math.floor(unit * 2) - Math.floor(unit) * (count - 1), cursor = -width/2 + 9, storageIndex = 0;
  const columns = Array.from({length:count},(_,index) => {
    const size = Math.floor(unit * (index === legroom ? 2 : 1)) + (remainder-- > 0 ? 1 : 0);
    const left = cursor; cursor += size;
    const storage = index === legroom ? null : storageIndex++;
    const option = DESK_CHANNEL_OPTIONS.find(o => o.id === input.channels?.[storage ?? -1]?.kind) ?? DESK_CHANNEL_OPTIONS[3];
    const levels: number[] = [0];
    if (storage !== null) for (const pitch of option.pitches) levels.push(levels.at(-1)! + pitch);
    return {index,storage,left,right:cursor,option,levels};
  });
  const panels:PanelData[]=[],fronts:ReferenceFront[]=[],openings:ReferenceOpening[]=[],beams:PanelData[]=[];
  const cableOpenings:DeskCableOpening[]=[],cableOpeningAvailability=Array<boolean>(input.storageColumns).fill(false);
  const box=(x1:number,x2:number,y1:number,y2:number,z1:number,z2:number,matType:PanelData['matType']):PanelData=>({x:(x1+x2)/20,y:(y1+y2)/20,z:(z1+z2)/20,w:(x2-x1)/10,h:(y2-y1)/10,d:(z2-z1)/10,matType,castShadow:matType!=='backPanel',receiveShadow:true});
  // Merge adjacent same-level shelf surfaces before emitting physical pieces.
  for (const level of [0,300,500,700]) {
    let start:number|null=null,end=0;
    for (const c of columns) {
      const present=level===700||(c.storage!==null&&c.levels.includes(level));
      if(present){if(start===null)start=c.left-9;end=c.right+9;}
      else if(start!==null){panels.push(box(start,end,level,level+18,0,depth,'horizontalBase'));start=null;}
    }
    if(start!==null)panels.push(box(start,end,level,level+18,0,depth,'horizontalBase'));
  }
  // A shared wall is interrupted by a horizontal on either adjacent side.
  for(let axis=0;axis<=count;axis++) {
    const neighbours=[columns[axis-1],columns[axis]].filter(Boolean);
    const x=axis===count?columns[count-1].right:columns[axis].left;
    const levels=[...new Set(neighbours.flatMap(c=>c.storage===null?[]:c.levels))].filter(v=>v<700).sort((a,b)=>a-b);
    let bottom=0;
    for(const level of [...levels,700]){if(level>bottom)panels.push(box(x-9,x+9,bottom,level,0,depth,'verticalBase'));bottom=level+18;}
  }
  for(const c of columns){
    const left=c.left+9,right=c.right-9;
    if(c.storage===null){
      if(input.cableManagement==='left'||input.cableManagement==='right'){
        const x=(input.cableManagement==='left'?c.left+89:c.right-89)/10;
        cableOpenings.push({panelIndex:-1,columnIndex:c.index,storageIndex:null,surface:'top',x,y:70.9,z:6.1,radius:3},
          {panelIndex:-1,columnIndex:c.index,storageIndex:null,surface:'back',x,y:65.9,z:0.9,radius:3});
      }
      panels.push(box(left,right,318,700,0,12,'backPanel'));
      beams.push(box(left,right,670,700,depth-44,depth-24,'horizontalBase'));
      openings.push({x:(left+right)/20,y:35.45,width:(right-left)/10,height:69.1,rowIndex:c.index,rowSpan:1,openLeft:false,openRight:false});
      continue;
    }
    const direction=input.channels?.[c.storage]?.doorDirection??(c.index<legroom?'left':'right');
    for(let row=0;row<c.option.pitches.length;row++){
      const bottom=c.levels[row]+18,top=c.levels[row+1],fill=c.option.fills[row];
      if(CABLE_ROWS[c.option.id].includes(row)&&(input.hasBackPanel||fill==='D')){
        cableOpeningAvailability[c.storage]=true;
        if(input.channels?.[c.storage]?.cableOpenings){
          const splitBack=right-left>570&&top-bottom>570;
          const x=(c.left+Math.round((c.right-c.left)/(splitBack?4:2)))/10;
          for(const offset of c.option.id==='door'?[50,350]:[50])
            cableOpenings.push({panelIndex:-1,columnIndex:c.index,storageIndex:c.storage,surface:'back',x,y:(bottom+offset)/10,z:0.9,radius:3});
        }
      }
      const front={x:(left+right)/20,y:(bottom+top)/20,width:(right-left)/10,height:(top-bottom)/10,rowIndex:c.index,family:input.family,hingeSide:direction};
      openings.push({...front,rowSpan:1,openLeft:false,openRight:false});
      if(fill==='D'&&right-left>570){
        const middle=left+Math.round((right-left)/2);
        fronts.push({...front,x:(left+middle)/20,width:(middle-left)/10,type:'door',hingeSide:'left',parity:'double'}, {...front,x:(middle+right)/20,width:(right-middle)/10,type:'door',hingeSide:'right',parity:'double'});
      }else if(fill!=='O')fronts.push({...front,type:fill==='D'?'door':'drawer',parity:'single'});
      if(input.hasBackPanel||fill!=='O'){
        if(right-left>570&&top-bottom>570){const middle=(left+right)/2;panels.push(box(left,middle,bottom,top,0,12,'backPanel'),box(middle,right,bottom,top,0,12,'backPanel'));}
        else panels.push(box(left,right,bottom,top,0,12,'backPanel'));
      }
      else {
        // The first/last storage keeps its source support. A lone storage on
        // either side of the legroom receives the matching outer support.
        let side=c.storage===0?'left':c.storage===input.storageColumns-1?'right':null;
        if(legroom===1&&c.index===0)side='left';
        if(legroom===count-2&&c.index===count-1)side='right';
        // A single storage is source right-supported.
        if(input.storageColumns===1)side=c.index<legroom?'left':'right';
        if(side)panels.push(box(side==='left'?left:right-125,side==='left'?left+125:right,bottom,top,0,12,'supportPanel'));
      }
      if(fill==='D'&&top-bottom>400)for(const insertY of [300,500])if(insertY>bottom&&insertY<top)panels.push(box(left,right,insertY,insertY+18,18,depth-30,'horizontalBase'));
    }
  }
  const feet:DeskResult['feet']=[];
  for(let axis=0;axis<=count;axis++){
    const before=columns[axis-1],after=columns[axis];let x=after?.left??before.right;
    if(!before&&after.storage!==null)x+=16;
    else if(!after&&before.storage!==null)x-=16;
    else if(before&&after&&before.storage===null&&after.storage!==null)x+=16;
    else if(before&&after&&after.storage===null&&before.storage!==null)x-=16;
    for(const z of [25,depth-25])feet.push({x:x/10,y:0,z:z/10});
  }
  for(const hole of cableOpenings){
    hole.panelIndex=panels.findIndex(p=>p.matType===(hole.surface==='top'?'horizontalBase':'backPanel')&&
      hole.x>=p.x-p.w/2&&hole.x<=p.x+p.w/2&&hole.y>=p.y-p.h/2&&hole.y<=p.y+p.h/2&&
      (hole.surface!=='top'||(hole.z>=p.z-p.d/2&&hole.z<=p.z+p.d/2)));
    if(hole.panelIndex<0)throw new Error('Desk cable opening has no physical host panel');
  }
  return {panels,fronts,openings,beams,feet,bodyHeight:71.8,footOffset:1.2,totalHeight:73,boardThickness:1.8,availableStorageColumns:choices,legroomIndex:legroom,
    columns:columns.map(c=>({index:c.index,storageIndex:c.storage,x:(c.left+c.right)/20,width:(c.right-c.left)/10})),
    cableOpenings,cableOpeningAvailability,unsupported:[]};
}
