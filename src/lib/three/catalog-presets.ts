import data from './catalog-presets.json' with { type: 'json' };
import type { GridInput, GridResult, ReferenceOpening } from './styles/grid';
import type { PanelData, StyleType, ColorCategory } from '@/types/shelf';
import type { ReferenceFront } from './reference-hardware';

export type CatalogPresetId = keyof typeof data;
export function isCatalogPreset(value: unknown): value is CatalogPresetId {
  return typeof value === 'string' && Object.hasOwn(data, value);
}
export function catalogPreset(id: string) {
  if (!isCatalogPreset(id)) return null;
  const p = data[id];
  return { ...p, style: p.style as StyleType, colorCategory: p.colorCategory as ColorCategory,
    baseType: p.baseType as 'standard' | 'legs' };
}

/** Captured layouts are fixtures for their original dimensions, not resizable templates. */
export function matchingCatalogPreset(input: GridInput & { style?: StyleType }) {
  const p = input.catalogPreset ? catalogPreset(input.catalogPreset) : null;
  if (!p) return null;
  const bodyHeight = p.height - (p.baseType === 'legs' ? 11 : 1);
  const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;
  return (!input.style || input.style === p.style) && same(input.width, p.width) && same(input.height, bodyHeight) && same(input.depth, p.depth)
    && same(input.density, p.density) && input.numRows === p.rows.length
    && p.rows.every((height, index) => same(input.rowHeights[index], height)) ? p : null;
}

/** Public product geometry, in mm, captured 2026-10-14. No remote runtime calls.
 * Changed dimensions/rows use the normal style generator, including stale saved presets.
 * Scaling centres while retaining board thickness breaks the mating panel faces.
 */
export function calculateCatalogPreset(input: GridInput & { style?: StyleType }): GridResult | null {
  const p = matchingCatalogPreset(input);
  if (!p) return null;
  const transform = (bounds: number[]) => {
    const [x1,x2,y1,y2,z1,z2] = bounds;
    const w = (x2-x1)/10, h = (y2-y1)/10, d = (z2-z1)/10;
    return { x:(x1+x2)/20, y:(y1+y2)/20-p.originY/10, z:(z1+z2)/20, w, h, d };
  };
  const panels: PanelData[] = p.panels.filter(part => input.hasBackPanel || !p.hasBackPanel || part.material!=='backPanel').map(part=>({
    ...transform(part.bounds), matType:part.material as PanelData['matType'], castShadow:true,receiveShadow:true,
  }));
  // Visible bays are derived from actual panel faces, including offset shelves.
  const horizontal=panels.filter(b=>b.matType==='horizontalBase');
  const vertical=panels.filter(b=>b.matType==='verticalBase');
  const ys=[...new Set(horizontal.flatMap(b=>[b.y-b.h/2,b.y+b.h/2]))].sort((a,b)=>a-b);
  const openings: ReferenceOpening[]=[];
  const rowAt=(y:number)=>{
    let top=2;
    for(let i=0;i<input.numRows;i++){top+=(input.rowHeights[i]??28)+2;if(y<top)return i;}
    return input.numRows-1;
  };
  for(let n=0;n<ys.length-1;n++){
    const bottom=ys[n],top=ys[n+1],middle=(bottom+top)/2;
    if(top-bottom<8)continue;
    const walls=vertical.filter(b=>b.y-b.h/2<middle&&b.y+b.h/2>middle).sort((a,b)=>a.x-b.x);
    for(let c=0;c<walls.length-1;c++){
      const left=walls[c].x+walls[c].w/2,right=walls[c+1].x-walls[c+1].w/2,x=(left+right)/2;
      if(right-left<5)continue;
      const floor=horizontal.some(b=>Math.abs(b.y+b.h/2-bottom)<.01&&x>b.x-b.w/2&&x<b.x+b.w/2);
      const prior=openings.find(o=>Math.abs(o.x-x)<.01&&Math.abs(o.width-(right-left))<.01&&Math.abs(o.y+o.height/2-bottom)<2.1);
      if(!floor&&prior){const low=prior.y-prior.height/2;prior.y=(low+top)/2;prior.height=top-low;prior.rowSpan++;}
      else if(floor)openings.push({x,y:middle,width:right-left,height:top-bottom,rowIndex:rowAt(middle),rowSpan:1,openLeft:false,openRight:false});
    }
  }
  const fronts:ReferenceFront[]=p.fronts.map(f=>{
    const b=transform(f.bounds);
    return {x:b.x,y:b.y,width:b.w,height:b.h,rowIndex:rowAt(b.y),type:f.type as 'door'|'drawer',
      family:input.family,hingeSide:f.hingeSide as 'left'|'right',parity:f.parity as 'single'|'double',handleAtBottom:f.handleAtBottom,
      ...(p.sourceType==='watty'?{catalogFront:{z:b.z,depth:b.d,handle:f.handle}}:{}),
    };
  }).filter(f=>{
    const code=input.hardwareRowStyles?.[f.rowIndex];
    return code===undefined || (f.type==='door'?code%10>1:Math.floor(code/10)>1);
  });
  return {panels,fronts,openings,bodyHeight:input.height,boardThickness:1.8,panelCount:vertical.length,
    panelSpacing:input.width/Math.max(1,vertical.length-1)};
}
