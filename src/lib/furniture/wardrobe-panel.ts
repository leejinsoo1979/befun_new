import type { FurnitureControl, FurnitureEditIntent, FurniturePanelView, ControlTarget, LayoutGlyph } from '@/types/furniture';
import type { FurnitureDesign } from './design';
import { generateWardrobe, getWardrobeLayoutOptions, getWardrobeDimensionOptions, normalizeWardrobeInput } from './wardrobe';
import { getToneWidthOptions } from './wardrobe/tone';
import { WARDROBE_COLORS, EDGE_PAINT_COLORS, TONE_OUTER_COLORS, toneInnerColors } from './wardrobe-colors';
import { REFERENCE_CLASSIC_COLORS } from '../three/reference-colors';

type Design=Extract<FurnitureDesign,{kind:'wardrobe'}>;
const globalTarget:ControlTarget={scope:'global'};
const base=(id:string,label:string,target:ControlTarget=globalTarget)=>({id,label,target,visible:true,enabled:true});
const edgeHeights=[1380,1680,1980,2280,...Array.from({length:72},(_,i)=>2290+i*10)];
const facadeFromSeries=(series:string|number)=>({Open:'open',Split:'middle-open',Half:'bottom-open',Full:'closed'}[String(series).split('_')[0]]??'closed');
const swatches=(keys:string[])=>keys.map(id=>({id,label:WARDROBE_COLORS[id]?.label??(id==='C_White'?'화이트 자작나무':'그레이 자작나무'),color:WARDROBE_COLORS[id]?.base??REFERENCE_CLASSIC_COLORS[id]}));
const heightControl=(value:number,id='height',target:ControlTarget=globalTarget):FurnitureControl=>({...base(id,id==='height'?'높이':'구획 높이',target),kind:'slider',value:Math.max(0,edgeHeights.indexOf(value)),min:0,max:edgeHeights.length-1,step:1,unit:'',displayValue:`${value/10}cm`,markers:[0,1,2,3],notice:`천장 높이 ${value/10+10}cm 이상이 필요합니다.`});
function glyph(design:Design,sectionId:string,seriesId:string|number):LayoutGlyph|undefined {
  const config={...design.config,sections:design.config.sections.map(s=>s.id===sectionId?{...s,seriesId}:s)};
  const geometry=generateWardrobe(config),source=geometry.sourceGeometryMm;
  const section=geometry.sections.find(s=>s.id===sectionId);
  if(!source||!section)return undefined;
  const x=section.x*10,height=(config.sections.find(s=>s.id===sectionId)?.localHeightMm??config.heightMm);
  const inside=(p:{x1:number;x2:number})=>p.x1<=x&&p.x2>=x;
  return {rails:source.bars.filter(inside).map(p=>(p.y1+p.y2)/2/height),shelves:source.slabs.filter(inside).map(p=>(p.y1+p.y2)/2/height),drawers:source.drawers.filter(inside).map(p=>({from:p.y1/height,to:p.y2/height,count:1}))};
}
export function wardrobePanelView(design:Design,selectedId:string|null):FurniturePanelView {
  const c=design.config,edge=c.model==='edge';
  const section=c.sections.find(s=>s.id===selectedId)??c.sections[0];
  const target:ControlTarget={scope:'section',sectionId:section.id};
  const dims=getWardrobeDimensionOptions(c.model,c.widthMm);
  const counts=dims.columnCounts??[c.sections.length];
  const appearance:FurnitureControl[]=[{...base('width','너비'),kind:'slider',value:c.widthMm/10,min:40,max:600,step:1,unit:'cm'}];
  if(edge)appearance.push(heightControl(c.heightMm),{...base('depth','깊이'),kind:'choice',variant:'pill',value:String(c.depthMm),options:[270,360,450,600].map(n=>({id:String(n),label:`${n/10}cm`}))},{...base('sections','구획'),kind:'stepper',value:c.sections.length,canDecrement:counts.some(n=>n<c.sections.length),canIncrement:counts.some(n=>n>c.sections.length)},{...base('topEdge','상부 테두리'),kind:'choice',variant:'pill',value:c.topEdge===false?'off':'on',options:[{id:'on',label:'있음'},{id:'off',label:'없음'}]},{...base('finish','마감'),kind:'choice',variant:'pill',value:design.color.startsWith('C_')?'plywood':'paint',options:[{id:'paint',label:'컬러'},{id:'plywood',label:'자작나무'}]},{...base('color','색상'),kind:'swatch',value:design.color,options:swatches(design.color.startsWith('C_')?['C_White','C_Gray']:EDGE_PAINT_COLORS)});
  else appearance.push({...base('height','높이'),kind:'heightMode',mode:c.heightMm>2370?'extended':'presets',presets:[{id:'2000',label:'200cm'},{id:'2370',label:'237cm'}],selectedPresetId:String(c.heightMm),extendLabel:'높이 +',standardLabel:'기본 높이',range:c.heightMm>2370?{value:c.heightMm/10,min:238,max:360,step:1,unit:'cm'}:null},{...base('depth','깊이'),kind:'slider',value:c.depthMm/10,min:40,max:80,step:1,unit:'cm'},{...base('lighting','조명'),kind:'choice',variant:'pill',value:c.lighting?'on':'off',options:[{id:'off',label:'없음'},{id:'on',label:'내부'}],notice:c.lighting?'전원 연결을 위해 뒤쪽에 4cm 여유가 필요합니다.':undefined},{...base('color','외부 색상'),kind:'swatch',value:design.color,options:swatches(TONE_OUTER_COLORS)},{...base('innerColor','내부 색상'),kind:'swatch',value:design.innerColor,options:swatches(toneInnerColors(design.color))});
  const layouts=getWardrobeLayoutOptions(c.model,c,section.id);
  const interior:FurnitureControl[]=[{...base('layout','내부 배치',target),kind:'layout',value:String(section.seriesId),options:layouts.map((l,i)=>({id:String(l.seriesId),label:`수납 구성 ${i+1}`,glyph:glyph(design,section.id,l.seriesId)}))}];
  if(edge){
    const facade=section.facade??facadeFromSeries(section.seriesId);
    interior.push({...base('facade','전면',target),kind:'choice',variant:'tile',value:facade,options:[{id:'open',label:'모두 열림',icon:'facade-open'},{id:'middle-open',label:'중간 열림',icon:'facade-middle-open'},{id:'bottom-open',label:'하단 열림',icon:'facade-bottom-open'},{id:'closed',label:'모두 닫힘',icon:'facade-closed'}]},{...base('doorDirection','문 방향',target),visible:facade!=='open',kind:'choice',variant:'tile',value:section.doorDirection??'left',options:[{id:'left',label:'왼쪽',icon:'door-left'},{id:'right',label:'오른쪽',icon:'door-right'}]},heightControl(section.localHeightMm??c.heightMm,'sectionHeight',target),{...base('sectionDepth','구획 깊이',target),kind:'choice',variant:'pill',value:String(section.localDepthMm??c.depthMm),options:[270,360,450,600].map(n=>({id:String(n),label:`${n/10}cm`}))});
  }else interior.push({...base('drawerStyle','서랍',target),kind:'choice',variant:'tile',value:c.drawerStyle??'internal',options:[{id:'internal',label:'내부',icon:'drawer-internal'},{id:'external',label:'외부',icon:'drawer-external'}]});
  const geometry=generateWardrobe(c),actualSection=geometry.sections.find(s=>s.id===section.id);
  if(!edge){
    const widths=getToneWidthOptions(c);
    if(widths.length)interior.splice(1,0,{...base('widthPattern','구획 너비',target),kind:'choice',variant:'pill',value:c.toneWidthPattern??normalizeWardrobeInput(c).toneWidthPattern??null,options:widths.map(o=>({id:o.id,label:o.widthsMm.map(w=>`${Math.round((w-18)/10)}`).join(' · ')+' cm'}))});
    const singleFront=actualSection&&geometry.fronts.find(f=>f.sectionId===section.id&&f.type==='door'&&f.w>actualSection.width*.75);
    const fixedPair=normalizeWardrobeInput(c).toneWidthPattern==='11'&&c.sections.length===2;
    if(singleFront)interior.push({...base('doorDirection','문 방향',target),kind:'choice',variant:'tile',value:singleFront.hingeSide??'left',enabled:!fixedPair,disabledReason:fixedPair?'두 단문 구획은 바깥쪽 경첩 방향으로 고정됩니다.':undefined,options:[{id:'left',label:'왼쪽',icon:'door-left'},{id:'right',label:'오른쪽',icon:'door-right'}]});
  }
  return {panelProfileId:`wardrobe-${c.model}`,layout:'tabs',sections:c.sections.map((s,i)=>({id:s.id,label:`구획 ${i+1}`})),selectedSectionId:section.id,tabs:[{id:'appearance',label:'외형',controls:appearance},{id:'interior',label:'내부 구성',usesSections:true,sectionSummary:actualSection?{title:'구획 내경 너비',value:`${Math.round((actualSection.width-1.8)*10)/10}cm`,caption:`전체 너비 ${c.widthMm/10}cm`}:undefined,controls:interior}]};
}
export function applyWardrobeIntent(design:Design,intent:FurnitureEditIntent):Design {
  if(intent.type==='applyPreset'||intent.type==='action')return design;
  const selected=intent.target.scope==='section'?intent.target.sectionId:null;
  if(selected&&!design.config.sections.some(s=>s.id===selected))return design;
  const control=wardrobePanelView(design,selected).tabs.flatMap(t=>t.controls).find(c=>c.id===intent.controlId&&c.target.scope===intent.target.scope);
  if(!control?.enabled||!control.visible)return design;
  const next=structuredClone(design),c=next.config,edge=c.model==='edge';
  if(intent.type==='heightMode'){
    if(edge||intent.controlId!=='height')return design;
    c.heightMm=intent.to==='extended'?2380:2370;
  }else{
    const v=intent.value;
    if(typeof v==='number'&&!Number.isFinite(v))return design;
    if((control.kind==='choice'||control.kind==='swatch'||control.kind==='layout')&&!control.options.some(o=>o.id===String(v)))return design;
    if(control.kind==='slider'&&(typeof v!=='number'||v<control.min||v>control.max||(control.step===1&&!Number.isInteger(v))))return design;
    if(control.kind==='heightMode'&&(control.mode==='presets'?!control.presets.some(p=>p.id===String(v)):typeof v!=='number'||!control.range||v<control.range.min||v>control.range.max||!Number.isInteger(v)))return design;
    const s=c.sections.find(s=>s.id===selected);
    switch(intent.controlId){
      case 'width':c.widthMm=Number(v)*10;break;
      case 'height':c.heightMm=edge?edgeHeights[Number(v)]:control.kind==='heightMode'&&control.mode==='extended'?Number(v)*10:Number(v);break;
      case 'depth':c.depthMm=edge?Number(v):Number(v)*10;break;
      case 'sections':{
        const counts=getWardrobeDimensionOptions(c.model,c.widthMm).columnCounts??[];
        if(!counts.includes(Number(v)))return design;
        c.sections=Array.from({length:Number(v)},(_,i)=>c.sections[i]??{id:`section-${i+1}`,seriesId:'Full_Rail_Rail_XL'});break;
      }
      case 'topEdge':c.topEdge=v==='on';break;
      case 'lighting':c.lighting=v==='on';break;
      case 'finish':next.color=v==='plywood'?'C_White':'W_White';break;
      case 'color':next.color=String(v);if(!edge&&!toneInnerColors(next.color).includes(next.innerColor))next.innerColor=next.color;break;
      case 'innerColor':next.innerColor=String(v);break;
      case 'layout':if(s)s.seriesId=edge?String(v):Number(v);break;
      case 'facade':if(s)s.facade=v as typeof s.facade;break;
      case 'doorDirection':
        if(s){
          if(edge)s.doorDirection=v as typeof s.doorDirection;
          else c.sections=c.sections.map(section=>({...section,doorDirection:v as 'left'|'right'}));
        }
        break;
      case 'sectionHeight':if(s)s.localHeightMm=edgeHeights[Number(v)];break;
      case 'sectionDepth':if(s)s.localDepthMm=Number(v);break;
      case 'widthPattern':c.toneWidthPattern=String(v);break;
      case 'drawerStyle':c.drawerStyle=v as typeof c.drawerStyle;break;
      default:return design;
    }
  }
  next.config=normalizeWardrobeInput(c);
  return next;
}
