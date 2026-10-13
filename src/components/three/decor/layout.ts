import type { PanelData } from '@/types/shelf';
import type { DoorPlacement, DrawerPlacement } from '@/lib/three/hardware';

export type DecorKind = 'books' | 'stack' | 'vase' | 'plant' | 'boxes';
export interface DecorPlacement {
  id: string;
  kind: DecorKind;
  position: [number, number, number];
  size: [number, number, number];
  variant: number;
  count: number;
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
        const left=cuts[i]+1.5,right=cuts[i+1]-1.5;
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
    const candidates:DecorKind[][]=[['books','vase','stack'],['vase','books','stack'],['books','stack'],['stack','books'],['boxes','stack','books'],['books','vase'],['plant','vase','books'],['books','stack'],['vase','stack']];
    for(const kind of candidates[(seed+Math.floor(seed/7))%candidates.length]) {
      const count=kind==='books'?Math.min(7,Math.floor((width-3)/2.8)):kind==='stack'?3:1;
      const small=slot.height<25;
      const size:[number,number,number]=kind==='books'?[count*2.8+1,small?16:24,small?12:17]:
        kind==='stack'?[22,7.2,15]:kind==='boxes'?[26,13,18]:kind==='plant'?[17,26,17]:[12,small?16:25,12];
      if(count<3 && kind==='books' || size[0]>width || size[1]>slot.height || size[2]>depth) continue;
      const side=(seed%3)/2;
      const x=slot.left+size[0]/2+(width-size[0])*(.15+.7*side);
      const z=slot.front-size[2]/2-Math.min(3,(depth-size[2])*.35);
      result.push({id:`decor-${slot.row}-${slot.index}`,kind,position:[x,slot.bottom,z],size,variant:seed%8,count});
      break;
    }
  }
  // Spread the budget over all levels rather than decorating only the bottom rows.
  if(result.length<=14) return result;
  return Array.from({length:14},(_,i)=>result[Math.floor(i*result.length/14)]);
}
