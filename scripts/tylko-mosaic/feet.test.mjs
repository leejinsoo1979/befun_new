import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateMosaicPanels } from '../../src/lib/three/styles/mosaic.ts';
import { calculateMosaicFeet, calculateShortFeet } from '../../src/lib/three/reference-feet.ts';
const base = { width:232, height:202, depth:32, thickness:2, density:69,
  rowHeights:[38,38,38,38,38], numRows:5, hasBackPanel:false };

test('mosaic-001: internal feet support actual bottom verticals, with inset end feet', () => {
  const {panels} = calculateMosaicPanels(base);
  const positions = calculateMosaicFeet(panels,232,32);
  const expectedX = [25,429,849,1160,1470,1890,2295]; // public generateLegs, mm from left
  assert.deepEqual(positions.filter((_,i)=>i%2===0).map(p=>Math.round((p[0]+116)*10)), expectedX);
  assert.deepEqual([...new Set(positions.map(p=>p[2]))], [2.5,29.5]);
  for(const x of expectedX.slice(1,-1)) assert.ok(panels.some(p=>p.matType==='verticalBase' &&
    Math.abs((p.x+116)*10-x)<1e-7 && Math.abs(p.y-p.h/2-1.8)<1e-7));
});

test('24cm shelves use the reference 20mm front/back inset', () => {
  const {panels}=calculateMosaicPanels({...base,depth:24});
  const feet=calculateMosaicFeet(panels,232,24);
  assert.deepEqual([...new Set(feet.map(p=>p[2]))],[2,22]);
  assert.equal(feet[0][0],-114);
  assert.equal(feet.at(-1)[0],114);
});

test('unequal columns keep interior supports on vertical axes outside Mosaic too', () => {
  // Regression for the user's screenshot: equal spacing drifts into open cells.
  const panels = [
    {matType:'horizontalBase',x:0,y:0.9,z:16,w:170,h:1.8,d:32},
    ...[-84.1,-39,11,47,84.1].map(x=>({
      matType:'verticalBase',x,y:20.9,z:16,w:1.8,h:38.2,d:32,
    })),
  ];
  const front = calculateShortFeet(panels,32).filter(p=>p[2]===2.5);
  assert.deepEqual(front.map(p=>p[0]),[-82.5,-39,11,47,82.5]);
});
