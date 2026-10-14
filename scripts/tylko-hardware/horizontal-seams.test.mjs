import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { horizontalSeams } from '../../src/lib/three/horizontal-seams.ts';
registerHooks({ resolve(s,c,n) { try { return n(s,c); } catch(e) {
  if(s.startsWith('.')&&!/\.[a-z]+$/i.test(s)) return n(s+'.ts',c); throw e;
} } });
const { calculatePatternPanels } = await import('../../src/lib/three/styles/pattern.ts');
const a={matType:'horizontalBase',w:143,h:1.8,d:32,x:-87.5,y:128.9,z:16};
const b={...a,w:175,x:71.5};
test('318cm top: one seam at actual 143/175cm part boundary, no mutation',()=>{
  const panels=[a,b], before=structuredClone(panels);
  assert.deepEqual(horizontalSeams(panels),[{panelIndex:0,neighbourIndex:1,x:-16,y:128.9,z:16,h:1.8,d:32}]);
  assert.deepEqual(panels,before);
});
test('no invented seams on a continuous board, opening, overlapping board or different level',()=>{
  assert.equal(horizontalSeams([{...a,w:318,x:0}]).length,0);
  for(const change of [{x:72},{x:71},{y:100},{h:2},{d:24},{z:17},{matType:'verticalBase'}])
    assert.equal(horizontalSeams([a,{...b,...change}]).length,0);
});
test('reversed panel order and floating point contact keep one boundary',()=>{
  const result=horizontalSeams([{...b,x:b.x+1e-9},a]);
  assert.equal(result.length,1);assert.equal(result[0].panelIndex,1);assert.equal(result[0].x,-16);
});
test('current Pattern 318/70 and unseen 393/43 expose actual split edges only',()=>{
  for(const [width,density] of [[318,70],[393,43]]){
    const panels=calculatePatternPanels({width,height:130,depth:32,thickness:2,density,rowHeights:[28,32,32,28],numRows:4,hasBackPanel:false,family:'type02'}).panels;
    const seams=horizontalSeams(panels);
    const top=Math.max(...panels.filter(p=>p.matType==='horizontalBase').map(p=>p.y));
    assert.ok(seams.some(s=>s.y===top));
    for(const s of seams){assert.ok(Math.abs(s.x-(panels[s.neighbourIndex].x-panels[s.neighbourIndex].w/2))<1e-5);}
  }
});
