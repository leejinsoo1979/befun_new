import test from 'node:test';
import assert from 'node:assert/strict';
const { auditPocketFootprint } = await import('./pocketAudit.ts');
const pocket = { widthMm: 9.4, lengthMm: 30, depthMm: 12.5 };

test('independently reproduces OVVO-AUDIT-003 endcap corner outside the official slot footprint', () => {
  const result = auditPocketFootprint([{ acrossMm: 4.3, alongMm: 14.2, inwardMm: 5.8 }], pocket);
  assert.equal(result.footprintFits, false);
  assert.equal(result.outsidePointCount, 1);
  assert.ok(Math.abs(result.maximumRadialExcessMm - 1.105170109479996) < 1e-9);
});

test('outer footprint fit cannot certify the unknown undercut profile or manufacturing', () => {
  const result = auditPocketFootprint([{ acrossMm: 0, alongMm: 15, inwardMm: 5 }, { acrossMm: 4.7, alongMm: 0, inwardMm: 10 }], pocket);
  assert.equal(result.footprintFits, true);
  assert.equal(result.undercutFit, 'unknown');
  assert.equal(result.manufacturingApproved, false);
  assert.equal(auditPocketFootprint([], pocket).footprintFits, false);
});

test('exposed lips are excluded; nonfinite transforms and invalid pockets fail explicitly', () => {
  const result = auditPocketFootprint([{ acrossMm: 20, alongMm: 20, inwardMm: -3 }, { acrossMm: 20, alongMm: 20, inwardMm: 0 }, { acrossMm: 0, alongMm: 0, inwardMm: 5 }], pocket);
  assert.equal(result.inspectedPointCount, 1);
  assert.equal(result.footprintFits, true);
  assert.throws(() => auditPocketFootprint([{ acrossMm: NaN, alongMm: 0, inwardMm: 0 }], pocket), /Invalid transformed/);
  assert.throws(() => auditPocketFootprint([], { ...pocket, lengthMm: 3 }), /Invalid pocket/);
});
