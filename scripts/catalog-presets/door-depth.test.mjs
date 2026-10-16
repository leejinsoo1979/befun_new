import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({ mockServices: false });
registerHooks({ load(url, context, next) {
  if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true };
  return next(url, context);
} });
const { calculateShelfGeometry } = await import('../../src/lib/three/shelf-geometry.ts');
const { calculateDoorPlacements, calculateDrawerPlacements } = await import('../../src/lib/three/hardware.ts');

// Reported product after switching to Classic yellow and changing depth.
// Check the door against physical panel faces, not another placement formula.
for (const depth of [24, 32, 40]) {
  test(`Classic Gradient: every door fits its actual bay at ${depth}cm depth`, () => {
    for (const width of [60, 109, 171, 300, 450]) {
      for (const density of [0, 43, 50, 100]) {
        const input = { catalogPreset: '9283007', width, height: 211, depth, thickness: 2,
          density, rowHeights: [38, 38, 38, 18, 38, 28], numRows: 6,
          hasBackPanel: false, family: 'type01', hardwareLayers: [0, 1], hardwareRowStyles: {0:13,1:13} };
        const result = calculateShelfGeometry('gradient', input);
        for (const row of [0, 1]) {
          const args = ['gradient', row, width, depth, 2, input.rowHeights, 6,
            result.panelCount, result.panelSpacing, density, result.fronts];
          const doors = calculateDoorPlacements(...args);
          const walls = result.panels.filter(p => p.matType === 'verticalBase'
            && p.y - p.h / 2 < doors[0].y && p.y + p.h / 2 > doors[0].y).sort((a,b) => a.x-b.x);
          assert.equal(doors.length, walls.length - 1);
          doors.forEach((door, index) => {
            const left = door.x + door.pivotOffsetX - door.width / 2;
            const right = left + door.width;
            const innerLeft = walls[index].x + walls[index].w / 2;
            const innerRight = walls[index+1].x - walls[index+1].w / 2;
            const context = `${width}cm density ${density} row ${row} door ${index}`;
            assert.ok(Math.abs(left - innerLeft - .3) < 1e-6, `left reveal: ${context}`);
            assert.ok(Math.abs(innerRight - right - .3) < 1e-6, `right reveal: ${context} = ${innerRight-right}cm`);
            assert.ok(Math.abs(door.z + input.thickness / 2 - depth) < 1e-6, `front plane: ${context}`);
          });
          // Drawers share the boundary helper: their opening width must match too.
          calculateDrawerPlacements(...args).forEach((drawer,index) => {
            assert.ok(Math.abs(drawer.compartmentWidth - (walls[index+1].x-walls[index].x)) < 1e-6);
          });
        }
      }
    }
  });
}
