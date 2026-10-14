import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateReferenceShelfPrice } from '../../src/lib/commerce/reference-pricing.ts';

// Synthetic arithmetic fixtures, not observed commercial prices or Tylko rates.
const part = (x1, x2, y1, y2) => ({ x1, x2, y1, y2 });
const input = (changes = {}) => ({
  kind: 'shelf', family: 'classic', style: 'grid', category: 'bookcase', materialId: 0,
  widthMm: 1000, heightMm: 1000, depthMm: 320,
  horizontals: [], verticals: [], supports: [], backs: [], doors: [], drawers: [], inserts: [],
  longLegCount: 0, hasPlinth: false, cableManagementCount: 0, ...changes,
});
const rates = (changes = {}) => ({
  base: 100, category_bookcase_factor: 0, minimal_front_area_for_increase: 0,
  maximal_front_area_for_increase: 10, maximal_increase: 0, jetty_margin_base: 0,
  logistic_front_area: 0, logistic_drawers: 0, logistic_base: 0, t01_group_1: 0,
  type_01_additional_increase: 0, type_01_regional_increase_factor: 0, ...changes,
});
const snapshot = (coefficients = rates(), changes = {}) => ({
  version: 'synthetic-test-v1', market: 'TEST', currency: 'EUR', sourceUrl: 'test:synthetic',
  capturedAt: '2026-10-14T00:00:00Z', coefficients, vatFactor: 1, eurFactor: 1,
  regionalMultiplier: 1, promotionPercent: null, ...changes,
});
const quote = (design = input(), profile = snapshot()) => {
  const result = calculateReferenceShelfPrice(design, profile);
  assert.equal(result.status, 'available', JSON.stringify(result));
  return result;
};
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('missing snapshot, required rate, unknown material, and other families cannot silently price', () => {
  assert.equal(calculateReferenceShelfPrice(input(), null).reason, 'missing-snapshot');
  const partial = rates(); delete partial.base;
  const result = calculateReferenceShelfPrice(input(), snapshot(partial));
  assert.equal(result.reason, 'missing-coefficients');
  assert.ok(result.missingCoefficients.includes('base'));
  for (const changes of [{ kind: 'desk' }, { kind: 'wardrobe' }, { category: 'desk' }, { materialId: 999 }]) {
    assert.equal(calculateReferenceShelfPrice(input(changes), snapshot()).reason, 'unsupported-input');
  }
});

test('explicit zero rates are allowed, but no promotion means no advertised discount', () => {
  const result = quote();
  assert.equal(result.regular, 100);
  assert.equal(result.promotional, null);
  assert.equal(result.promotionPercent, null);
  const zero = quote(input(), snapshot(rates(), { promotionPercent: 0 }));
  assert.equal(zero.promotional, 100);
});

test('modern shelf combines elements, traits, margin, logistics and staged increases', () => {
  const result = quote(input({ family: 'modern', depthMm: 400,
    horizontals: [part(0, 1000, 0, 0)], verticals: [part(0, 0, 0, 1000)],
    backs: [part(0, 1000, 0, 1000)],
  }), snapshot(rates({
    horizontal_length: 10, horizontal_unit: 2, vertical_length: 3, vertical_unit: 1,
    backs_perimeter: 5, backs_unit: 2, t02_factor: 0.2, depth_factor: 0.3,
    category_bookcase_factor: 0.1, jetty_margin_base: 0.1,
    logistic_front_area: 4, logistic_base: 5, depth_400: 0.2, t02_group_1: 0.1,
    type_02_additional_increase: 0.1, type_02_regional_increase_factor: 0.2,
  }), { vatFactor: 1.23, eurFactor: 4.3, regionalMultiplier: 1.005, promotionPercent: 38 }));
  const expected = { base: 100, elements: 38, traits: 82.8, margin: 22.08,
    logistics: 9, dimensionIncrease: 50.376, materialIncrease: 30.2256,
    categoryStyleIncrease: 0, mosaicIncrease: 0, regionalIncrease: 106.394112 };
  for (const [key, value] of Object.entries(expected)) near(result.stages[key], value);
  assert.equal(result.regularEur, 125);
  assert.equal(result.regular, 126);
  assert.equal(result.promotional, 78);
});

test('dimension surcharges take the maximum, not the sum', () => {
  const result = quote(input({ widthMm: 3100, heightMm: 2500, depthMm: 400 }), snapshot(rates({
    depth_factor: 0, width_300: 0.1, height_250: 0.3, depth_400: 0.2,
  })));
  near(result.stages.dimensionIncrease, 775 * 0.3);
  assert.equal(result.regular, 1007);
});

test('long horizontal count adjustment applies per board before two-decimal rounding', () => {
  const result = quote(input({ horizontals: [part(0, 2355, 0, 0), part(0, 2200, 0, 0)] }), snapshot(rates({
    horizontal_length: 10, horizontal_unit: 20,
  })));
  near(result.stages.elements, 4.555 * 10 + 2.55 * 20);
});

test('a covering back suppresses support charges and has its own perimeter price', () => {
  const supports = [part(0, 20, 0, 1000), part(1500, 1520, 0, 1000)];
  const backs = [part(0, 1000, 0, 1000)];
  const result = quote(input({ supports, backs }), snapshot(rates({
    support_length: 10, support_unit: 3, backs_perimeter: 2, backs_unit: 5,
  })));
  assert.equal(result.stages.elements, 13 + 13);
});

test('doors, drawer perimeters, inserts, cable holes and legs all enter elements', () => {
  const result = quote(input({
    doors: [part(0, 500, 0, 382), part(0, 500, 0, 500)],
    drawers: [part(0, 500, 0, 200)], inserts: [{ ...part(0, 100, 0, 1000), orientation: 'vertical' }],
    longLegCount: 4, hasPlinth: true, cableManagementCount: 2,
  }), snapshot(rates({ doors_perimeter: 10, doors_unit: 1, drawers_perimeter: 5, drawers_unit: 2,
    insert_length: 3, insert_unit: 1, cable_management_unit: 2, raptor_factor: 2,
    long_leg_unit: 4, plinth_length: 5,
  })));
  near(result.stages.elements, 18.64 + 42 + 9 + 8 + 8 + 32 + 10);
});

test('Mosaic, category-style and regional increases compound in the captured order', () => {
  const result = quote(input({ style: 'mosaic' }), snapshot(rates({
    jetty_bookcase_additional_increase: 0.1, jetty_mosaic_additional_increase: 0.2,
    type_01_additional_increase: 0.1, type_01_regional_increase_factor: 0.2,
  })));
  near(result.stages.categoryStyleIncrease, 10);
  near(result.stages.mosaicIncrease, 22);
  near(result.stages.regionalIncrease, 42.24);
  assert.equal(result.regular, 174);
});

test('Modern material 2 resolves to group 5; veneer uses its own trait and regional keys', () => {
  const modern = quote(input({ family: 'modern', materialId: 2 }), snapshot(rates({
    t02_factor: 0, t02_group_5: 0.5, type_02_additional_increase: 0, type_02_regional_increase_factor: 0,
  })));
  assert.equal(modern.regular, 150);
  const veneer = quote(input({ family: 'veneer' }), snapshot(rates({
    t01v_factor: 0.2, type_01v_additional_increase: 0.1, type_01v_regional_increase_factor: 0,
  })));
  assert.equal(veneer.regular, 132);
});

test('EUR truncation precedes regional rounding; metadata and missing FX are explicit', () => {
  const result = quote(input(), snapshot(rates({ base: 100.99 }), {
    market: 'KR', currency: 'KRW', regionalMultiplier: 10.005, promotionPercent: 50,
  }));
  assert.equal(result.regularEur, 100);
  assert.equal(result.regular, 1001);
  assert.equal(result.promotional, 501);
  assert.equal(result.market, 'KR');
  assert.equal(result.currency, 'KRW');
  assert.equal(calculateReferenceShelfPrice(input(), snapshot(rates(), { regionalMultiplier: undefined })).reason, 'invalid-snapshot');
});

test('non-finite data, invalid promotion and degenerate margin range return unavailable', () => {
  assert.equal(calculateReferenceShelfPrice(input({ widthMm: NaN }), snapshot()).reason, 'unsupported-input');
  assert.equal(calculateReferenceShelfPrice(input(), snapshot(rates(), { promotionPercent: 101 })).reason, 'invalid-snapshot');
  assert.equal(calculateReferenceShelfPrice(input(), snapshot(rates({ maximal_front_area_for_increase: 0 }))).reason, 'invalid-result');
  assert.equal(calculateReferenceShelfPrice(input(), snapshot(rates({ base: Infinity }))).reason, 'missing-coefficients');
});
