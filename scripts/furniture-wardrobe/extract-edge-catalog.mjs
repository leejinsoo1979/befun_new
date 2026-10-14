/** Offline analysis: only numeric structural rules are retained, never presets, owners or prices. */
import fs from 'node:fs';
const path=process.argv[2];
if(!path)throw new Error('Pass the local public Edge DNA JSON path');
const dna=JSON.parse(fs.readFileSync(path,'utf8')).json;
const serialization=dna.serialization;
const layouts={};
for(const [id,series]of Object.entries(serialization.component_series)){
 const heights={};
 for(const [height,component]of Object.entries(series.setups)){
  heights[height]=serialization.component[component].configs.map(({parameters:p})=>({
   kind:p.type==='D'?'door':p.type==='T'?'drawer':'open',
   heightMm:p.e_size_y,
   ...(p.rod__pos_y?{railOffsetsMm:String(p.rod__pos_y).split(',').map(v=>-Number(v))}:{}),
   ...(p.type==='T'?{external:!!p.drawer_exterior,drawerHeightsMm:String(p.drawer_height||150).split(',').map(Number)}:{}),
  }));
 }
 layouts[id]={heights,fallback:series.parameters.fallback_series||{}};
}
const ranges=Object.values(serialization.mesh['2590'].setups).map(s=>({count:s.configs.length,min:s.parameters.dim_x[0],max:s.parameters.dim_x[1]}));
const output={provenance:{kind:'public-structural-rule-data',collection:'Cabinet',mesh:2590,serializedAt:dna.serialized_at,units:'mm'},ranges,layouts};
fs.writeFileSync('src/lib/furniture/wardrobe/edge-catalog.json',JSON.stringify(output));
console.log(`${Object.keys(layouts).length} series, ${ranges.length} width intervals`);
