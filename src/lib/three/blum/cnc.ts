import type { Panel } from '@/lib/optimizer/upstream/editor/CNCOptimizer/types';
import type { CncPanelBox } from '@/lib/optimizer/befun/toCncPanels';
import type { BefunShelfModel } from '@/lib/optimizer/befun/model';
import type { Boring, PanelBoringData } from '@/lib/optimizer/upstream/domain/boring/types';
import { createBlumShelfPlans, type Bore } from './boring';

/** Append the same drilling coordinates that cut the scene, preserving connector ops. */
export function applyBlumBorings(panels: Panel[], boxes: CncPanelBox[], model: BefunShelfModel, thickness: number) {
  const plans = createBlumShelfPlans(model.doors,model.panels,thickness);
  const doorBoxes=boxes.filter(b=>b.kind==='door');
  function add(box: CncPanelBox | undefined, holes: Bore[], issues: string[], id: string) {
    if(!box) return;
    const panel=panels.find(p=>p.id===box.panelId);
    if(!panel) return;
    const errors=[...issues];
    if(Math.abs((panel.thickness??0)-[box.w,box.h,box.d][box.frame.n]*10)>.01) errors.push('판재 두께 변경 후 경첩 보링을 재계산해야 합니다.');
    const data: PanelBoringData = panel.manufacturingBoring ?? {
      panelId:panel.id,furnitureId:'befun',furnitureName:'Befun',panelType:box.kind==='door'?'door':'partition',panelName:panel.name,
      width:panel.width,height:panel.height,thickness:panel.thickness??0,material:panel.material,
      grain:panel.grain==='HORIZONTAL'?'H':'V',borings:[],
    };
    const round=(n:number)=>Math.round(n*10000)/10000;
    const borings:Boring[]=holes.map(h=>({
      id:`blum-${id}-${h.id}`,type:h.kind==='cup'?'hinge-cup':'custom',
      face:h.direction[box.frame.n]>0?'bottom':'top',
      x:round(h.center[box.frame.u]+[box.w,box.h,box.d][box.frame.u]*5),y:round(h.center[box.frame.v]+[box.w,box.h,box.d][box.frame.v]*5),
      diameter:h.diameter,depth:h.depth,
      note:h.kind==='plate-fixing'?'Blum 174H7100E EXPANDO':'Blum 71B3790 INSERTA',
    }));
    for(const b of borings) for(const old of data.borings) {
      if(Math.hypot(b.x-old.x,b.y-old.y)<(b.diameter+old.diameter)/2 && (b.face===old.face || b.depth+old.depth>data.thickness))
        errors.push('경첩 보링과 기존 가공이 겹칩니다.');
    }
    data.borings.push(...borings);
    if(errors.length) {data.manufacturingReady=false;data.manufacturingBlockReasons=[...new Set([...(data.manufacturingBlockReasons??[]),...errors])];}
    panel.manufacturingBoring=data;
  }
  plans.forEach((p,i)=>{
    add(doorBoxes[i],p.holes,p.issues,`door-${i}`);
    p.mounts.forEach((m,j)=>{
      const src=model.panels[m.panelIndex];
      const box=boxes.find(b=>b.kind==='vertical'&&Math.abs(b.x-src.x)<1e-7&&Math.abs(b.y-src.y)<1e-7&&Math.abs(b.z-src.z)<1e-7&&Math.abs(b.h-src.h)<1e-7);
      add(box,m.holes,p.issues,`door-${i}-mount-${j}`);
    });
  });
}
