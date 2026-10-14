import test from 'node:test';
import assert from 'node:assert/strict';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({mockServices:false});
const {planFurnitureLegs,baseHeight,supportsLongLegs}=await import('../../src/lib/three/furniture-base.ts');
const {useShelfStore}=await import('../../src/stores/useShelfStore.ts');
const {useMaterialStore}=await import('../../src/stores/useMaterialStore.ts');
const {currentConfiguration,restoreSavedConfiguration}=await import('../../src/components/storefront/configuration.ts');
const {parseSavedDesign}=await import('../../src/components/storefront/savedDesign.ts');
const {encodeDesignToURL,decodeDesignFromURL}=await import('../../src/lib/sharing.ts');
const calcs={};
for(const style of ['grid','pattern','mosaic','slant','gradient']) {
  const mod=await import(`../../src/lib/three/styles/${style}.ts`);
  calcs[style]=mod[`calculate${style[0].toUpperCase()+style.slice(1)}Panels`];
}

test('standard and raised base differ by observed 100mm',()=>{
 assert.equal(baseHeight('legs')-baseHeight('standard'),10);
 assert.equal(supportsLongLegs(24,'grid'),false);
 assert.equal(supportsLongLegs(32,'pixel'),false);
 assert.equal(supportsLongLegs(32,'grid'),true);
});

test('held-out layouts: each front/back pair supports the same bottom vertical axis',()=>{
 let layouts=0;
 for(const [style,calculate] of Object.entries(calcs)) for(const width of [91,163,237,393]) for(const density of [17,69,94]) for(const depth of [32,40]) {
  const {panels}=calculate({width,height:62,depth,thickness:2,density,rowHeights:[28,28],numRows:2,hasBackPanel:false,family:'type02'});
  const legs=planFurnitureLegs(panels,depth,style);
  assert.ok(legs.length>=4,`${style}/${width}/${density}`);
  assert.equal(legs.length%2,0);
  for(let i=0;i<legs.length;i+=2){
   assert.equal(legs[i].position[0],legs[i+1].position[0]);
   assert.ok(panels.some(p=>p.matType==='verticalBase' && Math.abs(p.x-legs[i].position[0])<1e-5 && p.y-p.h/2<3));
   assert.ok(Math.abs(legs[i].position[1]+11)<1e-5);
   assert.deepEqual([legs[i].position[2],legs[i+1].position[2]],[.9,depth-.9]);
  }
  assert.equal(new Set(legs.map(p=>p.position.join(','))).size,legs.length);
  layouts++;
 }
 assert.equal(layouts,120);
});

test('actual store save/parse/restore, old designs, and URL round-trip retain base choice',()=>{
 useShelfStore.setState({style:'grid',width:110,height:62,depth:32,thickness:2,numRows:2,rowHeights:[28,28]});
 useMaterialStore.getState().setColor('S_White','solid');
 useShelfStore.getState().setBaseType('legs');
 const config=currentConfiguration();
 const restored=parseSavedDesign(JSON.stringify({version:1,name:'leg-test',config}));
 assert.equal(restored.config.baseType,'legs');
 useShelfStore.getState().setBaseType('standard');
 restoreSavedConfiguration(restored.config);
 assert.equal(useShelfStore.getState().baseType,'legs');
 assert.equal(decodeDesignFromURL(encodeDesignToURL(config,'http://localhost/configurator')).baseType,'legs');
 const legacy={...config}; delete legacy.baseType;
 assert.equal(parseSavedDesign(JSON.stringify({version:1,name:'legacy',config:legacy})).config.baseType,'standard');
 assert.equal(parseSavedDesign(JSON.stringify({version:1,name:'bad',config:{...config,baseType:'fake'}})),null);
});

test('unsupported style/depth transitions reset raised base',()=>{
 for(const update of [()=>useShelfStore.getState().setStyle('pixel'),()=>useShelfStore.getState().setDepth(24)]) {
  useShelfStore.setState({style:'grid',depth:32});useMaterialStore.getState().setColor('S_White','solid');useShelfStore.getState().setBaseType('legs');
  update();assert.equal(useShelfStore.getState().baseType,'standard');
 }
});

test('Classic/Natural accept legs and preserve independent silver/black finish across material switches',()=>{
 const shelf=useShelfStore.getState();
 useShelfStore.setState({style:'grid',depth:32,width:110,height:62,numRows:2,rowHeights:[28,28]});
 for(const [color,category] of [['N_Walnut','natural'],['C_White','classic']]) {
  useMaterialStore.getState().setColor(color,category);
  shelf.setBaseType('legs');
  assert.equal(useShelfStore.getState().baseType,'legs');
  for(const finish of ['silver','black']) {
   shelf.setLegFinish(finish);
   const config=currentConfiguration();
   const saved=parseSavedDesign(JSON.stringify({version:1,name:'metal-leg',config}));
   shelf.setLegFinish(finish==='black'?'silver':'black');
   restoreSavedConfiguration(saved.config);
   assert.equal(useShelfStore.getState().legFinish,finish);
   assert.equal(useShelfStore.getState().baseType,'legs');
   assert.equal(decodeDesignFromURL(encodeDesignToURL(config,'http://localhost/configurator')).legFinish,finish);
  }
 }
 useMaterialStore.getState().setColor('S_White','solid');
 assert.equal(useShelfStore.getState().baseType,'legs');
 useMaterialStore.getState().setColor('N_Walnut','natural');
 assert.equal(useShelfStore.getState().legFinish,'black');
 shelf.setBaseType('standard');shelf.setBaseType('legs');
 assert.equal(useShelfStore.getState().legFinish,'black');
});

test('old designs default to silver and unknown leg finishes cannot enter saved state',()=>{
 const config=currentConfiguration();delete config.legFinish;
 const legacy=parseSavedDesign(JSON.stringify({version:1,name:'old',config}));
 assert.equal(legacy.config.legFinish,'silver');
 restoreSavedConfiguration(legacy.config);
 assert.equal(useShelfStore.getState().legFinish,'silver');
 assert.equal(parseSavedDesign(JSON.stringify({version:1,name:'bad',config:{...config,legFinish:'chrome'}})),null);
 useShelfStore.getState().setLegFinish('invalid');
 assert.equal(useShelfStore.getState().legFinish,'silver');
});

test('silver and black use owned untextured materials, not cabinet wood maps',async()=>{
 const {createMetalLegMaterial}=await import('../../src/lib/three/leg-material.ts');
 const silver=createMetalLegMaterial('silver'),black=createMetalLegMaterial('black');
 assert.equal(silver.map,null);assert.equal(black.map,null);
 assert.notEqual(silver.color.getHex(),black.color.getHex());
 assert.ok(silver.metalness>0.8);assert.ok(silver.roughness>0);
 const second=createMetalLegMaterial('silver');assert.notEqual(silver,second);
 silver.dispose();black.dispose();second.dispose();
});

test('Classic/Natural layouts recalculate support count and positions with width',()=>{
 // Both Classic and Natural use type01; solid/mix type02 is checked for regressions.
 for(const family of ['type01','type02']) for(const [style,calculate] of Object.entries(calcs)) {
  for(const width of [60,110,160,240,318,393,450]) for(const density of [1,50,100]) for(const depth of [32,40]) {
   const {panels}=calculate({width,height:62,depth,thickness:2,density,rowHeights:[28,28],numRows:2,hasBackPanel:false,family});
   const horizontal=panels.filter(p=>p.matType==='horizontalBase');
   const bottom=Math.min(...horizontal.map(p=>p.y-p.h/2));
   const bases=horizontal.filter(p=>Math.abs(p.y-p.h/2-bottom)<.001);
   const axes=[...new Set(panels.filter(p=>p.matType==='verticalBase' && bases.some(b=>Math.abs(p.y-p.h/2-b.y-b.h/2)<.001)).map(p=>p.x))].sort((a,b)=>a-b);
   const legs=planFurnitureLegs(panels,depth,style);const xs=legs.filter((_,i)=>i%2===0).map(p=>p.position[0]);
   const label=`${family}/${style}/${width}/${density}/${depth}`;
   assert.ok(xs.length>=2,label);
   assert.ok(Math.abs(xs[0]-axes[0])<1e-5,label);
   assert.ok(Math.abs(xs.at(-1)-axes.at(-1))<1e-5,label);
   for(let i=0;i<xs.length;i++) {
    assert.ok(axes.some(x=>Math.abs(x-xs[i])<1e-5),label);
    assert.equal(legs[i*2].position[0],legs[i*2+1].position[0],label);
    if(i>0 && xs[i]-xs[i-1]>90+1e-5) {
     // Only a genuinely wide bay may exceed the rule; do not skip an available bearing vertical.
     assert.ok(!axes.some(x=>x>xs[i-1]+1e-5 && x<xs[i]-1e-5),label);
    }
   }
  }
 }
 const grid=width=>planFurnitureLegs(calcs.grid({width,height:62,depth:32,thickness:2,density:50,rowHeights:[28,28],numRows:2,hasBackPanel:false,family:'type01'}).panels,32,'grid');
 assert.equal(grid(60).length,4);
 assert.equal(grid(110).length,6);
 assert.equal(grid(240).length,12);
});

test('wide Gradient centre does not omit an existing vertical bearing axis',()=>{
 const {panels}=calcs.gradient({width:450,height:62,depth:32,thickness:2,density:50,rowHeights:[28,28],numRows:2,hasBackPanel:false,family:'type01'});
 const xs=planFurnitureLegs(panels,32,'gradient').filter((_,i)=>i%2===0).map(p=>p.position[0]);
 assert.ok(xs.slice(1).every((x,i)=>x-xs[i]<=90+1e-5));
});
