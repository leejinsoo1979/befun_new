import Bedside from './upstream/g9uRfoWh2.js';
import {renderBedside} from './upstream/bedside-renderer.js';
import bedsideDna from './data/bedside-6-dna.json';
import hangingDna from './data/bedside-7-dna.json';
import legsDna from './data/bedside-8-dna.json';
import bedsideStart from './data/bedside-start.json';
import Furniture from './upstream/3UiAd3-B2.js';
import {renderSchema} from './upstream/renderer.js';
import toneDna from './data/tone-dna.json';
import toneWallDna from './data/tone-wall-dna.json';
import edgeDna from './data/edge-dna.json';
import toneStart from './data/tone-start.json';
import toneWallStart from './data/tone-wall-start.json';
import toneLowStart from './data/tone-1964607-start.json';
import edgeStart from './data/edge-start.json';
import type {BedsideStyle, Design, Preset, Snapshot, StartKey} from './types';

export const starts = {tone:toneStart, 'tone-wall':toneWallStart, 'tone-1964607':toneLowStart, edge:edgeStart, bedside:bedsideStart};
const dna = {tone:toneDna, 'tone-wall':toneWallDna, 'tone-1964607':toneWallDna, edge:edgeDna, bedside:bedsideDna};
const bedsideStyles = {6:bedsideDna, 7:hangingDna, 8:legsDna};
// TYPE25 exports cabinet width excluding two 30 mm side uprights, while its
// loader expects outside width. Adapt only at the input boundary to avoid
// shrinking by 60 mm on each edit or shared-link restore.
function loadPreset(design:Design):Preset {
 const preset=structuredClone(design.preset);
 if(design.start==='bedside' && design.bedsideStyle===8)preset.width=Number(preset.width)+60;
 return preset;
}
export function initialDesign(start:StartKey):Design { return {version:1,start,preset:structuredClone(starts[start].preset)}; }
/** The source engine has shared internal contexts. Reset DNA and preset for every
 * synchronous transaction so simultaneous previews cannot leak into one another. */
export function calculate(design:Design, patch?:Record<string,unknown>, column=0):Snapshot {
 const engine = new (design.start==='bedside'?Bedside:Furniture)().withDNA(design.start==='bedside'?bedsideStyles[design.bedsideStyle??6]:dna[design.start]);
 engine.loadPreset(loadPreset(design));
 if(patch) engine.changeConfiguration(structuredClone(patch));
 const geometry=engine.getGeometry();
 const configuration=engine.getConfiguration();
 const preset=engine.getPreset();
 const schema=design.start==='bedside'?renderBedside(geometry):renderSchema(geometry, design.start==='edge'?'edge':'tone');
 const index=Math.min(Math.max(0,column),configuration.values.columnCount-1);
 const thumbnails=engine instanceof Bedside?engine.getThumbnails(geometry.components[index].m_config_id):engine.getThumbnailsByIndex(index);
 return structuredClone({geometry,configuration,preset,schema,thumbnails:thumbnails??[]});
}
/** Switch through the source migration, which adjusts body height and preserves
 * compatible channels. Loading the old preset directly into new DNA skips it. */
export function switchBedsideStyle(design:Design, style:BedsideStyle):Design {
 if(design.start!=='bedside' || !Object.hasOwn(bedsideStyles,style))throw new Error('지원하지 않는 스타일입니다.');
 const engine=new Bedside().withDNA(bedsideStyles[design.bedsideStyle??6]);
 engine.loadPreset(loadPreset(design));
 const option=engine.getConfiguration().parameters.shelfType.options.find((o:{value:number;disabled:boolean})=>o.value===style);
 if(!option || option.disabled)throw new Error('현재 크기·구성에서는 선택할 수 없습니다.');
 const width=engine.getConfiguration().values.width;
 engine.switchShelfType(bedsideStyles[style],engine.getPreset());
 if(engine.getConfiguration().values.width!==width)engine.changeConfiguration({width});
 return {...design,bedsideStyle:style,preset:structuredClone(engine.getPreset())};
}
export function readDesign(raw:string):Design {
 if(raw.length>50000)throw new Error('디자인 링크가 너무 깁니다.');
 const data=JSON.parse(raw);
 if(data.version!==1 || !Object.hasOwn(starts,data.start) || !data.preset || typeof data.preset!=='object')throw new Error('지원하지 않는 디자인입니다.');
 if(data.bedsideStyle!==undefined && (data.start!=='bedside' || ![6,7,8].includes(data.bedsideStyle)))throw new Error('지원하지 않는 스타일입니다.');
 const preset=data.preset as Preset;
 const style=data.bedsideStyle===undefined?{}:{bedsideStyle:data.bedsideStyle as BedsideStyle};
 const result=calculate({version:1,start:data.start,preset,...style});
 if(!Number.isFinite(result.geometry.width) || result.geometry.width>6000 || result.geometry.width<400)throw new Error('잘못된 가구 크기입니다.');
 return {version:1,start:data.start,preset:result.preset,...style};
}
/** Only observed quotes for the identical source preset; never reuse one quote
 * for a different configuration or substitute the legacy volume-based formula. */
export function observedEuro(design:Design):number|null {
 if(design.start==='bedside' && (design.bedsideStyle??6)!==6)return null;
 const current=calculate(design).preset;
 const initial=calculate(initialDesign(design.start)).preset;
 return JSON.stringify(current)===JSON.stringify(initial)?Number(starts[design.start].sourceDiscountEuro):null;
}
