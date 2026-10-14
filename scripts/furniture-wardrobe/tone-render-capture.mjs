/** Offline source verification only. The application never imports this bundle. */
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
const bundle = fs.readFileSync(process.env.TONE_SOURCE_BUNDLE ?? '/tmp/tylko-wardrobes-bundle.js','utf8');
if(!bundle.includes('r(r.s=1872)'))throw new Error('Unrecognized source bootstrap');
const context=vm.createContext({console});
vm.runInContext(bundle.replace('r(r.s=1872)','globalThis.requireModule=r'),context);
const convert=context.requireModule(1017).toToneDrawerSegment;
const material={name:'verification',colors:{}};
const cases=JSON.parse(fs.readFileSync('scripts/furniture-wardrobe/tone-drawer-fixtures.json','utf8'));
const fixtures=cases.map(fixture=>({drawers:fixture.drawers,faces:fixture.faces,expected:fixture.drawers.map(drawer=>{
  const segment=convert(drawer,fixture.drawers,[],material,material,'1',630);
  return {panels:segment.geometries.map(part=>({
    x:(segment.position.x+part.position.x)*100,y:(segment.position.y+part.position.y)*100,z:(segment.position.z+part.position.z)*100,
    w:part.size.x*100,h:part.size.y*100,d:part.size.z*100,
  })),travelCm:(segment.segmentTag.motion.open-segment.segmentTag.motion.close)*100};
})}));
fs.writeFileSync('scripts/furniture-wardrobe/tone-render-fixtures.json',JSON.stringify(fixtures)+'\n');
fs.writeFileSync('scripts/furniture-wardrobe/tone-render-provenance.json',JSON.stringify({
  source:'Public wardrobe renderer, module1017.toToneDrawerSegment; offline verification only',
  sha256:createHash('sha256').update(bundle).digest('hex'),caseCount:fixtures.length,
  drawerCount:fixtures.reduce((n,c)=>n+c.expected.length,0),
  units:'centimetres',sourceScalar:.001,physicalManufacturingClaim:false,
  observation:'Final presentation panel transforms and fully open stagger; intermediate getRender bounds are insufficient.',
},null,2)+'\n');
console.log(`Captured ${fixtures.length} final-render cases`);
