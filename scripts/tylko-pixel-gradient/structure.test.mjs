import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { calculateReferencePixelGradient } from '../../src/lib/three/styles/reference-pixel-gradient.ts';
const round=n=>Math.round(n*1e6)/1e6;
const signature=(type,values)=>[type,...values.map(round)].join(',');
const bounds=p=>[(p.x-p.width/2)*10,(p.x+p.width/2)*10,(p.y-p.height/2)*10,(p.y+p.height/2)*10];
for(const name of ['boundary','heldout']) {
  const cases=JSON.parse(fs.readFileSync(new URL(`./${name}-fixtures.json`,import.meta.url)));
  for(const style of ['pixel','gradient'])test(`${style}: ${name} cases match source boards, openings and fronts`,()=>{
    for(const item of cases.filter(c=>c.style===style)) {
      const result=calculateReferencePixelGradient(item.input,style);
      const panels=result.panels.map(p=>signature({horizontalBase:'horizontals',verticalBase:'verticals',backPanel:'backs'}[p.matType],
        [(p.x-p.w/2)*10,(p.x+p.w/2)*10,(p.y-p.h/2)*10,(p.y+p.h/2)*10,(p.z-p.d/2)*10,(p.z+p.d/2)*10])).sort();
      const context=JSON.stringify(item.input);
      assert.deepEqual(result.fronts.map(p=>signature(p.type,bounds(p))).sort(),item.expectedFronts,`${context}: fronts`);
      assert.deepEqual(result.openings.map(p=>signature('opening',bounds(p))).sort(),item.expectedOpenings,`${context}: openings`);
      assert.deepEqual(panels,item.expectedPanels,`${context}: panels`);
    }
  });
}
test('Gradient reference UI 263.3 cm / density 0 uses the observed seven clear widths',()=>{
  const geometry=calculateReferencePixelGradient({width:263.3,height:163,depth:32,thickness:2,density:0,rowHeights:[38,38,38,38],numRows:4,hasBackPanel:false},'gradient');
  assert.deepEqual(geometry.openings.filter(o=>o.rowIndex===0).map(o=>Math.floor(o.width)),[31,39,47,26,26,38,38]);
});
