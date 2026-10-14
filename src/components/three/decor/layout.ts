import type { PanelData } from '@/types/shelf';
import type { DoorPlacement, DrawerPlacement } from '@/lib/three/hardware';

export type DecorKind = 'books' | 'stack' | 'vase' | 'plant' | 'boxes' | 'bird' | 'speaker' | 'lamp';
export interface DecorPlacement {
  id: string;
  kind: DecorKind;
  position: [number, number, number];
  size: [number, number, number];
  variant: number;
  count: number;
  bookSide?: 'left' | 'right';
}
export interface DecorSlot { left:number; right:number; bottom:number; height:number; back:number; front:number; row:number; index:number }
const overlap=(a:number,b:number,c:number,d:number)=>a<d-.01 && b>c+.01;
const horizontal=(p:PanelData)=>p.matType==='horizontalBase';

/** Derive supported free spaces from real boards, including staggered/split shelves. Units: cm. */
export function decorSlots(panels:PanelData[],doors:DoorPlacement[],drawers:DrawerPlacement[]):DecorSlot[] {
  const floors=panels.filter(horizontal);
  const levels=[...new Set(floors.map(p=>Math.round((p.y+p.h/2)*100)/100))].sort((a,b)=>a-b);
  const slots:DecorSlot[]=[];
  for(const [row,bottom] of levels.entries()) {
    if(row===levels.length-1) continue;
    const boards=floors.filter(p=>Math.abs(p.y+p.h/2-bottom)<.02).sort((a,b)=>a.x-b.x);
    const runs:{left:number;right:number;back:number;front:number}[]=[];
    for(const p of boards) {
      const left=p.x-p.w/2,right=p.x+p.w/2,back=p.z-p.d/2,front=p.z+p.d/2;
      const previous=runs.at(-1);
      if(previous && left<=previous.right+.15 && Math.abs(back-previous.back)<.05 && Math.abs(front-previous.front)<.05) previous.right=Math.max(previous.right,right);
      else runs.push({left,right,back,front});
    }
    let index=0;
    for(const run of runs) {
      const ceiling=Math.min(bottom+32,...floors.filter(p=>p.y-p.h/2>bottom+.05 && overlap(run.left,run.right,p.x-p.w/2,p.x+p.w/2)).map(p=>p.y-p.h/2));
      const upright=panels.filter(p=>p.matType==='verticalBase' && p.y+p.h/2>bottom+.1 && p.y-p.h/2<ceiling-.05);
      const cuts=[run.left,run.right,...upright.flatMap(p=>[p.x-p.w/2,p.x+p.w/2]).filter(x=>x>run.left && x<run.right)].sort((a,b)=>a-b);
      for(let i=0;i<cuts.length-1;i++) {
        const left=cuts[i]+.35,right=cuts[i+1]-.35;
        if(right-left<10) continue;
        let height=38,back=run.back+2;
        const front=run.front-2;
        for(const p of panels) {
          if(!overlap(left,right,p.x-p.w/2,p.x+p.w/2)) continue;
          const low=p.y-p.h/2,high=p.y+p.h/2;
          if(high<=bottom+.05) continue;
          if(p.matType==='backPanel'||p.matType==='supportPanel') {
            if(low<bottom+32 && high>bottom) back=Math.max(back,p.z+p.d/2+1.5);
          } else height=Math.min(height,Math.max(0,low-bottom-1.5));
        }
        const blocked=doors.some(p=>overlap(left,right,p.x+p.pivotOffsetX-p.width/2,p.x+p.pivotOffsetX+p.width/2) && overlap(bottom,bottom+height,p.y-p.height/2,p.y+p.height/2)) ||
          drawers.some(p=>overlap(left,right,p.x-p.compartmentWidth/2,p.x+p.compartmentWidth/2) && overlap(bottom,bottom+height,p.y-p.rowHeight/2,p.y+p.rowHeight/2));
        if(!blocked && height>=10 && front-back>=12) slots.push({left,right,bottom,height,back,front,row,index:index++});
      }
    }
  }
  return slots;
}

/** Catalog objects retain their physical dimensions; composition changes instead of stretching. */
export function arrangeDecor(slots:DecorSlot[]):DecorPlacement[] {
  const result:DecorPlacement[]=[];
  for(const slot of slots) {
    const seed=slot.row*11+slot.index*5;
    if((slot.row*3+slot.index*2)%7>=5) continue; // Breathing room, never fill every opening.
    const width=slot.right-slot.left,depth=slot.front-slot.back;
    const candidates:DecorKind[][]=[['books','vase','stack'],['speaker','vase','books','stack'],['books','stack'],['lamp','stack','books'],['boxes','stack','books'],['speaker','books','vase'],['plant','vase','books'],['books','stack'],['vase','stack']];
    for(const kind of candidates[(seed+Math.floor(seed/7))%candidates.length]) {
      if((kind==='speaker'||kind==='lamp')&&result.some(p=>p.kind===kind))continue;
      const count=kind==='books'?Math.min(7,Math.floor((width-3)/2.8)):kind==='stack'?3:1;
      const small=slot.height<25;
      const size:[number,number,number]=kind==='books'?[count*2.8+1,small?16:24,small?12:17]:
        kind==='speaker'?[12,slot.height>=35?34:24,15]:kind==='lamp'?[18,25,18]:kind==='stack'?[22,7.2,15]:kind==='boxes'?[26,13,18]:kind==='plant'?[17,26,17]:[12,small?16:25,12];
      if(count<3 && kind==='books' || size[0]>width || size[1]>slot.height || size[2]>depth) continue;
      const side=(seed%3)/2;
      const bookSide=seed%2===0?'left':'right';
      const x=kind==='books' ? (bookSide==='left'?slot.left+size[0]/2:slot.right-size[0]/2) : slot.left+size[0]/2+(width-size[0])*(.15+.7*side);
      const z=slot.front-size[2]/2-Math.min(3,(depth-size[2])*.35);
      result.push({id:`decor-${slot.row}-${slot.index}`,kind,position:[x,slot.bottom,z],size,variant:seed%8,count,...(kind==='books'?{bookSide}:{})});
      break;
    }
  }
  // One sculptural focal point; never shrink the real object to force it into a short cell.
  const hasElectronic=(s:DecorSlot)=>result.some(p=>p.id===`decor-${s.row}-${s.index}`&&(p.kind==='lamp'||p.kind==='speaker'));
  const birdSlot=slots.filter(s=>s.right-s.left>=30 && s.height>=29 && s.front-s.back>=15)
    .sort((a,b)=>Number(hasElectronic(a))-Number(hasElectronic(b))||Math.abs(a.row-1)-Math.abs(b.row-1)||b.right-b.left-(a.right-a.left))[0];
  if(birdSlot){
    const pedestal=birdSlot.height>=34;
    const size:[number,number,number]=[27.8,pedestal?32.4:27.6,pedestal?15:8.5];
    const id=`decor-${birdSlot.row}-${birdSlot.index}`;
    const p:DecorPlacement={id,kind:'bird',size,count:1,variant:pedestal?1:0,
      position:[(birdSlot.left+birdSlot.right)/2,birdSlot.bottom,birdSlot.front-size[2]/2-Math.min(1,(birdSlot.front-birdSlot.back-size[2])/2)]};
    const index=result.findIndex(p=>p.id===id);if(index>=0)result[index]=p;else result.push(p);
  }
  // Spread the budget over all levels rather than decorating only the bottom rows.
  if(result.length<=14) return result;
  const selected=Array.from({length:14},(_,i)=>result[Math.floor(i*result.length/14)]);
  const focalKinds=['bird','speaker','lamp'];
  for(const kind of focalKinds){
    const focal=result.find(p=>p.kind===kind);
    if(focal&&!selected.includes(focal)){const index=selected.findIndex(p=>!focalKinds.includes(p.kind));if(index>=0)selected[index]=focal;}
  }
  return selected;
}

/** Low, wide cabinets get two restrained groups; the middle stays free for a TV. */
export function arrangeTopDecor(panels:PanelData[]):DecorPlacement[] {
  const floors=panels.filter(horizontal);
  if(!floors.length) return [];
  const top=Math.max(...floors.map(p=>p.y+p.h/2));
  const bottom=Math.min(...panels.map(p=>p.y-p.h/2));
  const boards=floors.filter(p=>Math.abs(p.y+p.h/2-top)<.02).sort((a,b)=>a.x-b.x);
  const left=Math.min(...boards.map(p=>p.x-p.w/2)),right=Math.max(...boards.map(p=>p.x+p.w/2));
  const width=right-left,height=top-bottom;
  if(height>100 || width<100 || width<height*1.35) return [];
  // Merge only coplanar touching boards. Gaps and staggered depths remain unsupported.
  const runs:{left:number;right:number;back:number;front:number}[]=[];
  for(const p of boards){
    const run={left:p.x-p.w/2,right:p.x+p.w/2,back:p.z-p.d/2,front:p.z+p.d/2};
    const last=runs.at(-1);
    if(last && run.left<=last.right+.01 && Math.abs(last.back-run.back)<.01 && Math.abs(last.front-run.front)<.01) last.right=Math.max(last.right,run.right);
    else runs.push(run);
  }
  const result:DecorPlacement[]=[];
  const place=(id:string,kind:DecorKind,x:number,size:[number,number,number],variant:number,count=1)=>{
    const run=runs.find(r=>x-size[0]/2>=r.left+3 && x+size[0]/2<=r.right-3 && r.front-r.back>=size[2]+6);
    if(!run) return;
    const z=run.back+3+size[2]/2;
    if(panels.some(p=>p.y+p.h/2>top+.05 && overlap(x-size[0]/2,x+size[0]/2,p.x-p.w/2,p.x+p.w/2) && overlap(z-size[2]/2,z+size[2]/2,p.z-p.d/2,p.z+p.d/2))) return;
    result.push({id,kind,position:[x,top,z],size,variant,count});
  };
  place('top-lamp','lamp',left+16,[18,25,18],0);
  // Bird model includes its own two-book pedestal; never float a second object above it.
  place('top-bird','bird',right-21,[27.8,32.4,15],1);
  if(width>=180) place('top-books','stack',left+43,[22,7.2,15],3,3);
  return result;
}

export function arrangeShelfDecor(panels:PanelData[],doors:DoorPlacement[],drawers:DrawerPlacement[]):DecorPlacement[] {
  const top=arrangeTopDecor(panels);
  const interior=arrangeDecor(decorSlots(panels,doors,drawers))
    .filter(p=>!top.some(t=>(t.kind==='bird'||t.kind==='lamp')&&t.kind===p.kind));
  return [...interior.slice(0,14-top.length),...top];
}
