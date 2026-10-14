// Offline source result capture. No reference code runs in the application.
import fs from 'node:fs';
import { availableStorageColumns, DESK_CHANNEL_OPTIONS, calculateDeskGeometry } from '../../src/lib/furniture/desk/index.ts';
import { decodeStyle, DNA } from './source-oracle.mjs';
const fixtures=[];
const round=x=>Math.round(x*1e5)/1e5;
const sort=a=>a.sort((x,y)=>JSON.stringify(x).localeCompare(JSON.stringify(y)));
let failures=0;
for(const widthMm of [907,1471,1784,1785,2393])for(const storageColumns of availableStorageColumns(widthMm))for(const legroomPosition of [...new Set([0,1,storageColumns])])for(const hasBackPanel of [false,true])for(const kind of DESK_CHANNEL_OPTIONS){
  const choices=availableStorageColumns(widthMm),countIndex=choices.indexOf(storageColumns);
  const cableManagement=['off','left','right'][fixtures.length%3];
  const input={widthMm,storageColumns,legroomPosition,hasBackPanel,cableManagement,
    depthMm:[400,500,600][fixtures.length%3],family:DNA.superior_object_line===0?'type01':'type02',
    channels:Array.from({length:storageColumns},()=>({kind:kind.id,cableOpenings:true}))};
  const channels={1:{cables:cableManagement!=='off',door_flip:cableManagement==='off'?null:cableManagement}};
  input.channels.forEach((c,i)=>channels[i+2]={series_id:kind.seriesId,cables:c.cableOpenings});
  const params={width:widthMm,depth:input.depthMm,density:Math.min(100,Math.ceil(100*(countIndex+.5)/choices.length)),distortion:legroomPosition===0?0:legroomPosition===storageColumns?100:100*(legroomPosition+.2)/(storageColumns+1),backPanels:hasBackPanel,channels};
  const f=decodeStyle(params).format;
  const cableOpenings=sort(f.cable_management.map(c=>{const column=f.components.findIndex(x=>x.m_config_id===c.m_config_id);const storageIndex=column===legroomPosition?null:column-(column>legroomPosition?1:0);return[column,storageIndex,c.subtype==='h'?'top':'back',...([c.x1,c.y1,c.z1,c.radius].map(x=>round(x/10)))];}));
  const availability=f.components.filter((_,i)=>i!==legroomPosition).map(c=>c.cables_available);
  const actual=calculateDeskGeometry(input);
  const actualCables=sort(actual.cableOpenings.map(c=>[c.columnIndex,c.storageIndex,c.surface,c.x,c.y,c.z,c.radius]));
  if(JSON.stringify(cableOpenings)!==JSON.stringify(actualCables)||JSON.stringify(availability)!==JSON.stringify(actual.cableOpeningAvailability)){failures++;if(failures<5)console.log('Mismatch',input,cableOpenings,actualCables,availability,actual.cableOpeningAvailability);}
  // A line-offset request is deliberately ignored by the Desk SHIFT mesh.
  const shifted=decodeStyle({...params,lines:{'1_2':113,'2_3':-91}}).format;
  const widths=f.components.map(c=>[c.x1,c.x2]);
  const ignoresLocalEdge=JSON.stringify(widths)===JSON.stringify(shifted.components.map(c=>[c.x1,c.x2]));
  if(!ignoresLocalEdge)throw new Error('Desk local-edge support changed');
  fixtures.push({input,cableOpenings,availability,ignoresLocalEdge});
}
console.log({family:DNA.superior_object_line,total:fixtures.length,failures});
if(failures)process.exitCode=1;
else fs.writeFileSync(process.env.DESK_FIXTURE_OUTPUT??'/tmp/desk-cables.json',JSON.stringify(fixtures));
