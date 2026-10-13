import { appendEdgeBanding } from './edgeBandingProcess';
import type { MachiningProgram } from './program';
import type { OptimizedResult } from '../types';

export function batchFixture() {
  const result: OptimizedResult = {
    stockPanel: { id: 'sheet', width: 1220, height: 2440, thickness: 18, material: 'PB', color: '', price: 0, stock: 1 },
    panels: [600, 520, 400].map((width, i) => ({ id: `p${i}`, name: '도어', isDoor: true,
      width, height: 780, x: 5, y: 5 + i * 785, thickness: 18, material: 'PB', color: '#eee', quantity: 1, rotated: false })),
    efficiency: 0, usedArea: 0, wasteArea: 0,
  };
  const input: MachiningProgram = {
    units: 'mm', source: { label: 'TEST ONLY', machineModel: '참조 밴더', verifiedSequence: false }, tools: [], steps: [],
    setup: { kind: 'panel-saw-router', cuttingLength: 2440, tableDepth: 3000, routerOrigin: [3100, 0, 0] },
    stocks: result.panels.map((p, i) => ({ id: p.id, name: p.name, size: [p.width, p.height, 18],
      position: [4000, i * 900, 0], sourceOrigin: [p.x, p.y, 0], color: '#eee', purpose: 'panel', panel: p })),
  };
  return { input, result, program: appendEdgeBanding(input, result, { thickness: 1, material: { doorEdgeColor: '#cc5544' } }) };
}
