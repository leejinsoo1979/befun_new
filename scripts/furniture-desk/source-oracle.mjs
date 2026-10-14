// Offline reference fixture capture only. Never imported by application runtime.
import fs from 'node:fs';import vm from 'node:vm';
const c=vm.createContext({console});vm.runInContext(fs.readFileSync(process.env.TYLKO_PUBLIC_BUNDLE ?? '/tmp/tylko-public-bundle.js','utf8').replace('r(r.s=2300)','globalThis.req=r'),c);const req=c.req;const DNA=JSON.parse(fs.readFileSync(process.env.TYLKO_DESK_DNA ?? '/tmp/tylko-category-desk-type02-dna.json')).json;const {DnaAdapter}=req(1436);
export function decodeStyle({family=2498,shelfType=DNA.superior_object_line,backPanels=false,width=1470,density=52,depth=400,rowHeights=[400,400,400,400],rowStyles=[11,11,11,11],distortion=0,channels={},lines={}}={}) {
const instructions={geom_id:family,geom_type:'mesh',width,depth,height:700,row_amount:rowHeights.length,row_heights:rowHeights,row_styles:rowStyles,backpanels_rows:backPanels?rowHeights.map((_,i)=>i):[],motion:0,density,distortion,shelf_type:shelfType,plinth:false,backPanels,stack:{top:{1:{active:false,height:500}},bottom:{1:{active:false,height:500}}},additional_parameters:{collection_type:'Desk'},configurator_custom_params:{channels,lines},material:'1',physical_product_version:1};
const context={instructions,dnaAdapter:new DnaAdapter(DNA)};
const raw=req(1158).getRawGeometry(DNA,instructions,context);const clean=req(1155).getCleanGeometry(raw);const format=req(1154).convertToGalleryFormat(clean);
return {instructions,raw,clean,format};
}

export {req,DNA};
