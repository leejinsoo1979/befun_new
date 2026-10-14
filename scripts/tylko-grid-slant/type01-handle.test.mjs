import test from 'node:test';
import assert from 'node:assert/strict';
import { createType01Handle } from '../../src/lib/three/type01-handle.ts';
import { calculateReferenceDoorPlacement } from '../../src/lib/three/reference-hardware.ts';

for (const hingeSide of ['left','right']) for (const height of [28.2,38.2,78.2]) {
  test(`Type01 ${hingeSide} handle preserves front envelope ${height}`, () => {
    const p=calculateReferenceDoorPlacement({x:0,y:0,width:35.5,height,rowIndex:0,type:'door',family:'type01',hingeSide,parity:'double'},32);
    const g=createType01Handle(p.reference.handleKind,p.reference.handleSize.h);
    g.computeBoundingBox();
    const panelLeft=p.x+p.pivotOffsetX-p.width/2,panelRight=p.x+p.pivotOffsetX+p.width/2;
    const handleLeft=p.x+p.reference.handle.x+g.boundingBox.min.x,handleRight=p.x+p.reference.handle.x+g.boundingBox.max.x;
    // The replacement must overlap the board edge, not leave the previous
    // 5–15mm missing strip caused by centring/scaling the original profile.
    assert.ok(handleRight>=panelLeft && handleLeft<=panelRight);
    const expectedLeft=-35.5/2+(hingeSide==='right'?.15:.3);
    const expectedRight=35.5/2-(hingeSide==='left'?.15:.3);
    assert.ok(Math.abs(Math.min(panelLeft,handleLeft)-expectedLeft)<.09);
    assert.ok(Math.abs(Math.max(panelRight,handleRight)-expectedRight)<.09);
    assert.ok(Math.abs(g.boundingBox.max.y-g.boundingBox.min.y-(height-.6))<.00001);
    g.dispose();
  });
}
