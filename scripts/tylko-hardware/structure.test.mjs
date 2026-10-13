import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {calculatePatternPanels} from '../../src/lib/three/styles/pattern.ts';
import {calculateMosaicPanels} from '../../src/lib/three/styles/mosaic.ts';
import {changeHardwareMode,effectiveHardwareStyle} from '../../src/lib/three/hardware-state.ts';
const generators={pattern:calculatePatternPanels,mosaic:calculateMosaicPanels};
const signature=f=>[f.type,f.x1,f.x2,f.y1,f.y2].map(v=>typeof v==='number'?Math.round(v*1e6)/1e6:v).join(',');
const actual=f=>signature({type:f.type,x1:(f.x-f.width/2)*10,x2:(f.x+f.width/2)*10,y1:(f.y-f.height/2)*10,y2:(f.y+f.height/2)*10});
function calculate(style,input) {
  const heights=input.rowHeights??input.row_heights,styles=input.rowStyles??input.row_styles;
  return generators[style]({width:input.width/10,height:163,depth:input.depth/10,thickness:2,density:input.density,
    rowHeights:heights.map(h=>h/10-2),numRows:heights.length,hasBackPanel:false,
    hardwareRowStyles:Object.fromEntries(styles.map((s,i)=>[i,s])),hardwareLayers:styles.flatMap((s,i)=>s!==11?[i]:[])}).fronts.map(actual).sort();
}
for(const style of ['pattern','mosaic']) {
  const fixtures=JSON.parse(fs.readFileSync(new URL(`./${style}-fixtures.json`,import.meta.url)));
  test(`${style}: six modes on one row and on every row match public decoder bounds`,()=>{
    for(const f of fixtures) {
      const geometry=f.geometry??f,dy=style==='pattern'?9:0;
      const expected=['doors','drawers'].flatMap(k=>geometry[k].map(p=>signature({type:k==='doors'?'door':'drawer',x1:p.x1,x2:p.x2,y1:p.y1+dy,y2:p.y2+dy}))).sort();
      assert.deepEqual(calculate(style,f.input),expected,f.caseId);
    }
  });
}
const heldout=JSON.parse(fs.readFileSync(new URL('./heldout-fixtures.json',import.meta.url)));
test('180 held-out combinations: reference front counts and exact bounds',()=>{
  for(const f of heldout) assert.deepEqual(calculate(f.style,f.input),f.expectedFronts.map(signature).sort(),f.caseId);
});
test('mode transitions preserve mixed Some and make Max exclusive',()=>{
  assert.equal(changeHardwareMode(13,'drawers','some'),22);
  assert.equal(changeHardwareMode(22,'drawers','max'),31);
  assert.equal(changeHardwareMode(31,'doors','some'),22);
  assert.equal(changeHardwareMode(22,'doors','none'),21);
});
test('depth, row height and upper position automatically remove unavailable fronts',()=>{
  assert.equal(effectiveHardwareStyle(31,0,[38],24),11);
  assert.equal(effectiveHardwareStyle(22,0,[18],32),21);
  assert.equal(effectiveHardwareStyle(31,3,[38,38,38,38],32),11);
  assert.equal(effectiveHardwareStyle(22,3,[38,38,38,38],32),12);
});
