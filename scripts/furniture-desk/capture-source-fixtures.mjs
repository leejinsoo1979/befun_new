// Generates independent held-out fixtures from the locally captured public reference.
import {calculateDeskGeometry,availableStorageColumns,DESK_CHANNEL_OPTIONS} from '../../src/lib/furniture/desk/index.ts';
import {decodeStyle,DNA} from './source-oracle.mjs';
import fs from 'node:fs';
const round=x=>Math.round(x*1e5)/1e5;
const sorted=a=>a.map(x=>x.map(v=>typeof v==='number'?round(v):v)).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
const sig=p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.matType];
const panel=(p,type)=>[(p.x1+p.x2)/20,(p.y1+p.y2)/20,(p.z1+p.z2)/20,(p.x2-p.x1)/10,(p.y2-p.y1)/10,(p.z2-p.z1)/10,type];
function expected(f){return sorted([...f.horizontals.map(p=>panel({...p,y1:p.y1-9,y2:p.y2+9},'horizontalBase')),...f.verticals.map(p=>panel({...p,x1:p.x1-9,x2:p.x2+9},'verticalBase')),...f.backs.map(p=>panel(p,'backPanel')),...f.supports.map(p=>panel(p,'supportPanel')),...f.inserts.map(p=>panel(p,'horizontalBase'))]);}
let failures=0,total=0,fixtures=[];
for(const widthMm of [917,1043,1327,1639,1784,1785,1937,2261,2387])for(const storageColumns of availableStorageColumns(widthMm))for(let legroomPosition=0;legroomPosition<=storageColumns;legroomPosition++)for(const opt of DESK_CHANNEL_OPTIONS){
 const choices=availableStorageColumns(widthMm),i=choices.indexOf(storageColumns);const channels=Array.from({length:storageColumns},(_,j)=>({kind:DESK_CHANNEL_OPTIONS[(DESK_CHANNEL_OPTIONS.indexOf(opt)+j)%8].id,doorDirection:j%2?'left':'right'}));
 const input={widthMm,depthMm:[400,500,600][total%3],storageColumns,legroomPosition,hasBackPanel:total%2===0,family:DNA.superior_object_line===0?'type01':'type02',channels};
 const sourceChannels=Object.fromEntries(channels.map((c,j)=>[j+2,{series_id:DESK_CHANNEL_OPTIONS.find(o=>o.id===c.kind).seriesId,door_flip:c.doorDirection}]));
 const f=decodeStyle({width:widthMm,depth:input.depthMm,density:Math.min(100,Math.ceil(100*(i+.5)/choices.length)),distortion:legroomPosition===0?0:legroomPosition===storageColumns?100:100*(legroomPosition+.2)/(storageColumns+1),backPanels:input.hasBackPanel,channels:sourceChannels}).format;
 const result=calculateDeskGeometry(input); const a=expected(f),b=sorted(result.panels.map(sig));
 total++;
 if(JSON.stringify(a)!==JSON.stringify(b)) {failures++; if(failures<10)console.log('FAIL',input, 'missing',a.filter(x=>!b.some(y=>JSON.stringify(x)===JSON.stringify(y))).slice(0,10),'extra',b.filter(x=>!a.some(y=>JSON.stringify(x)===JSON.stringify(y))).slice(0,10));}
 fixtures.push({input,panels:a,fronts:sorted([...f.doors.map(p=>[(p.x1+p.x2)/20,(p.y1+p.y2)/20,(p.x2-p.x1)/10,(p.y2-p.y1)/10,'door',p.flip?'left':'right']),...f.drawers.map(p=>[(p.x1+p.x2)/20,(p.y1+p.y2)/20,(p.x2-p.x1)/10,(p.y2-p.y1)/10,'drawer',p.flip?'left':'right'])]),feet:sorted(f.legs.map(p=>[p.x1/10,0,p.z1/10])),beams:sorted(f.desk_beams.map(p=>panel(p,'horizontalBase')))});
}
console.log({total,failures});fs.writeFileSync(process.env.DESK_FIXTURE_OUTPUT ?? '/tmp/desk-heldout.json',JSON.stringify(fixtures));
