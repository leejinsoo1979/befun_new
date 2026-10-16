/**
 * Independent implementation of the documented Jetty shelf pricing stages.
 * See docs/tylko-reference/pricing-source-audit.md. No commercial rates ship here.
 * Geometry must describe economic parts in mm, not render meshes or cm panels.
 */
export type ReferenceShelfFamily = 'classic' | 'modern' | 'veneer';
export type ReferenceShelfStyle = 'grid' | 'slant' | 'gradient' | 'pattern' | 'pixel' | 'mosaic';
export type ReferenceShelfCategory = 'bookcase' | 'tvstand' | 'sideboard' | 'bedside_table'
  | 'chest' | 'shoerack' | 'vinyl_storage' | 'vinylstorage' | 'wallstorage';

export interface ReferencePricePart {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface ReferenceShelfPriceInput {
  kind: 'shelf';
  family: ReferenceShelfFamily;
  style: ReferenceShelfStyle;
  category: ReferenceShelfCategory;
  materialId: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  horizontals: ReferencePricePart[];
  verticals: ReferencePricePart[];
  supports: ReferencePricePart[];
  backs: ReferencePricePart[];
  doors: ReferencePricePart[];
  drawers: ReferencePricePart[];
  inserts: (ReferencePricePart & { orientation: 'vertical' | 'horizontal' })[];
  longLegCount: number;
  hasPlinth: boolean;
  cableManagementCount: number;
}

export interface ReferencePriceSnapshot {
  version: string;
  market: string;
  currency: string;
  sourceUrl: string;
  capturedAt: string;
  coefficients: Readonly<Record<string, number>>;
  /** Explicit engine factors; never inferred from a market or currency code. */
  vatFactor: number;
  eurFactor: number;
  regionalMultiplier: number;
  /** null means no verified promotion; it is not a zero-percent claim. */
  promotionPercent: number | null;
}

export interface ReferencePriceStages {
  base: number;
  elements: number;
  traits: number;
  margin: number;
  logistics: number;
  dimensionIncrease: number;
  materialIncrease: number;
  categoryStyleIncrease: number;
  mosaicIncrease: number;
  regionalIncrease: number;
}

export type ReferencePriceResult = {
  status: 'unavailable';
  reason: 'missing-snapshot' | 'invalid-snapshot' | 'unsupported-input' | 'missing-coefficients' | 'invalid-result';
  missingCoefficients?: string[];
} | {
  status: 'available';
  market: string;
  currency: string;
  snapshotVersion: string;
  regularEur: number;
  regular: number;
  promotional: number | null;
  promotionPercent: number | null;
  stages: ReferencePriceStages;
};

const styles = new Set(['grid', 'slant', 'gradient', 'pattern', 'pixel', 'mosaic']);
const categories = new Set(['bookcase', 'tvstand', 'sideboard', 'bedside_table', 'chest',
  'shoerack', 'vinyl_storage', 'vinylstorage', 'wallstorage']);
const partKeys = ['horizontals', 'verticals', 'supports', 'backs', 'doors', 'drawers', 'inserts'] as const;

function validInput(input: ReferenceShelfPriceInput): boolean {
  if (!input || input.kind !== 'shelf' || !['classic', 'modern', 'veneer'].includes(input.family)
    || !styles.has(input.style) || !categories.has(input.category)
    || !Number.isInteger(input.materialId) || input.materialId < 0
    || ![input.widthMm, input.heightMm, input.depthMm].every(value => Number.isFinite(value) && value > 0)
    || ![input.longLegCount, input.cableManagementCount].every(value => Number.isSafeInteger(value) && value >= 0)
    || typeof input.hasPlinth !== 'boolean') return false;
  return partKeys.every(key => Array.isArray(input[key]) && input[key].every(part => part
    && [part.x1, part.x2, part.y1, part.y2].every(Number.isFinite)))
    && input.inserts.every(part => part.orientation === 'vertical' || part.orientation === 'horizontal');
}

function materialKey(family: ReferenceShelfFamily, id: number): string | null {
  if (family === 'veneer') return null;
  let group: number | undefined;
  if (family === 'classic') {
    if ([0, 1, 3].includes(id)) group = 1;
    else if ([7, 9, 11, 13].includes(id)) group = 3;
    else if (id >= 4 && id <= 13) group = 2;
  } else {
    if ([0, 9, 10, 17].includes(id)) group = 1;
    else if ([3, 11, 12, 18].includes(id)) group = 2;
    else if ([2, 8].includes(id)) group = 5;
    else if ([1, 7, 14, 16, 19, 20, 21, 22].includes(id)) group = 3;
    else if ([6, 15].includes(id)) group = 4;
  }
  return group === undefined ? null : `${family === 'classic' ? 't01' : 't02'}_group_${group}`;
}

const length = (part: ReferencePricePart, axis: 'x' | 'y') =>
  Math.abs(part[`${axis}2`] - part[`${axis}1`]) / 1000;
const perimeter = (part: ReferencePricePart) => 2 * (length(part, 'x') + length(part, 'y'));
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/** Missing inputs/rates yield unavailable; this function never guesses a price. */
export function calculateReferenceShelfPrice(
  input: ReferenceShelfPriceInput,
  snapshot: ReferencePriceSnapshot | null | undefined,
): ReferencePriceResult {
  if (!validInput(input)) return { status: 'unavailable', reason: 'unsupported-input' };
  if (!snapshot) return { status: 'unavailable', reason: 'missing-snapshot' };
  if (![snapshot.version, snapshot.market, snapshot.currency, snapshot.sourceUrl, snapshot.capturedAt]
    .every(value => typeof value === 'string' && value.trim().length > 0)
    || !snapshot.coefficients || typeof snapshot.coefficients !== 'object'
    || ![snapshot.vatFactor, snapshot.eurFactor, snapshot.regionalMultiplier]
      .every(value => Number.isFinite(value) && value > 0)
    || !(snapshot.promotionPercent === null || (Number.isFinite(snapshot.promotionPercent)
      && snapshot.promotionPercent >= 0 && snapshot.promotionPercent <= 100))) {
    return { status: 'unavailable', reason: 'invalid-snapshot' };
  }
  const missing = new Set<string>();
  const rate = (key: string) => {
    const value = Object.hasOwn(snapshot.coefficients, key) ? snapshot.coefficients[key] : undefined;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      missing.add(key);
      return Number.NaN;
    }
    return value;
  };
  const sumLinear = (parts: ReferencePricePart[], axis: 'x' | 'y', prefix: string) => {
    if (parts.length === 0) return 0;
    const perLength = rate(`${prefix}_length`);
    const perUnit = rate(`${prefix}_unit`);
    return parts.reduce((sum, part) => sum + length(part, axis) * perLength + perUnit, 0);
  };
  const sumPerimeters = (parts: ReferencePricePart[], prefix: string) => {
    if (parts.length === 0) return 0;
    const perPerimeter = rate(`${prefix}_perimeter`);
    const perUnit = rate(`${prefix}_unit`);
    return parts.reduce((sum, part) => sum + perimeter(part) * perPerimeter + perUnit, 0);
  };
  const frontArea = input.widthMm * input.heightMm / 1_000_000;
  const base = frontArea * rate('base');
  let horizontalPrice = 0;
  if (input.horizontals.length) {
    const meters = input.horizontals.map(part => length(part, 'x'));
    const units = meters.reduce((total, meters) => total + 1 + (meters >= 2.3 ? (meters - 2.3) / 0.1 : 0), 0);
    horizontalPrice = meters.reduce((a, b) => a + b, 0) * rate('horizontal_length')
      + Math.round((units + Number.EPSILON) * 100) / 100 * rate('horizontal_unit');
  }
  const uncoveredSupports = input.supports.filter(support => !input.backs.some(back => {
    const sy = [Math.min(support.y1, support.y2), Math.max(support.y1, support.y2)];
    const sx = [Math.min(support.x1, support.x2), Math.max(support.x1, support.x2)];
    const by = [Math.min(back.y1, back.y2), Math.max(back.y1, back.y2)];
    return by[0] >= sy[0] && by[1] <= sy[1]
      && [Math.min(back.x1, back.x2), Math.max(back.x1, back.x2)]
        .some(x => x >= sx[0] && x <= sx[1]);
  }));
  let doors = 0;
  if (input.doors.length) {
    const perPerimeter = rate('doors_perimeter');
    const perUnit = rate('doors_unit');
    doors = input.doors.reduce((sum, part) => {
      const height = length(part, 'y');
      const factor = height > 0.382 ? rate('raptor_factor') : 1;
      // Preserve both captured thresholds; the 382m threshold is normally inactive.
      return sum + (perimeter(part) * perPerimeter + perUnit) * factor
        * (height > 382 ? rate('raptor_factor') : 1);
    }, 0);
  }
  const sideboardFactor = input.category === 'sideboard'
    && (input.longLegCount > 0 || input.hasPlinth) ? rate('sideboard_legs_plinth_factor') : 0;
  const legsFactor = input.family === 'modern' && input.category === 'tvstand'
    && input.longLegCount > 0 ? rate('t02_long_leg_factor') : sideboardFactor;
  const legs = input.longLegCount ? input.longLegCount * rate('long_leg_unit') * rate('raptor_factor') * (1 + legsFactor) : 0;
  const plinth = input.hasPlinth ? input.widthMm / 1000 * rate('plinth_length') * rate('raptor_factor') * (1 + sideboardFactor) : 0;
  let inserts = 0;
  if (input.inserts.length) {
    const perLength = rate('insert_length');
    const perUnit = rate('insert_unit');
    inserts = input.inserts.reduce((sum, part) => sum
      + length(part, part.orientation === 'vertical' ? 'y' : 'x') * perLength + perUnit, 0) * rate('raptor_factor');
  }
  const cable = input.cableManagementCount
    ? input.cableManagementCount * rate('cable_management_unit') * rate('raptor_factor') : 0;
  const elements = horizontalPrice + sumLinear(input.verticals, 'y', 'vertical')
    + sumLinear(uncoveredSupports, 'y', 'support') + sumPerimeters(input.backs, 'backs')
    + doors + sumPerimeters(input.drawers, 'drawers') + legs + plinth + inserts + cable;
  const subtotal = base + elements;
  const familyTrait = input.family === 'modern' ? rate('t02_factor') : input.family === 'veneer' ? rate('t01v_factor') : 0;
  const depthTrait = input.depthMm > 500 ? rate('depth_factor_600') : input.depthMm > 400
    ? rate('depth_factor_500') : input.depthMm > 320 ? rate('depth_factor') : 0;
  const traits = subtotal * (familyTrait + depthTrait + rate(`category_${input.category}_factor`));
  const traitSubtotal = subtotal + traits;
  const minArea = rate('minimal_front_area_for_increase');
  const maxArea = rate('maximal_front_area_for_increase');
  const margin = traitSubtotal * rate('jetty_margin_base')
    + clamp01((maxArea - frontArea) / (maxArea - minArea)) * rate('maximal_increase');
  const logistics = frontArea * rate('logistic_front_area')
    + input.drawers.length * rate('logistic_drawers') + rate('logistic_base');
  let running = traitSubtotal + margin + logistics;
  let dimensionIncrease = 0;
  if (input.family !== 'veneer') {
    const width = input.widthMm > 2950 ? running * clamp01((input.widthMm - 2950) / 150) * rate('width_300') : 0;
    const height = input.heightMm >= 2500 ? running * rate('height_250') : 0;
    const depth = [400, 500, 600].includes(input.depthMm) ? running * rate(`depth_${input.depthMm}`) : 0;
    dimensionIncrease = Math.max(width, height, depth);
  }
  running += dimensionIncrease;
  const colorKey = materialKey(input.family, input.materialId);
  // Unknown material IDs are not priced using an assumed zero surcharge.
  if (input.family !== 'veneer' && colorKey === null && input.materialId > (input.family === 'classic' ? 13 : 22)) {
    return { status: 'unavailable', reason: 'unsupported-input' };
  }
  const materialIncrease = colorKey ? running * rate(colorKey) : 0;
  running += materialIncrease;
  const specialStyle = ['pattern', 'pixel', 'mosaic'].includes(input.style);
  const categoryStyleIncrease = specialStyle && ['bookcase', 'tvstand'].includes(input.category)
    ? running * rate(`jetty_${input.category === 'tvstand' ? 'tvstand' : 'bookcase'}_additional_increase`) : 0;
  running += categoryStyleIncrease;
  const mosaicIncrease = input.style === 'mosaic' ? running * rate('jetty_mosaic_additional_increase') : 0;
  running += mosaicIncrease;
  const prefix = input.family === 'classic' ? 'type_01' : input.family === 'modern' ? 'type_02' : 'type_01v';
  const additional = running * rate(`${prefix}_additional_increase`);
  const regionalIncrease = additional + (running + additional) * rate(`${prefix}_regional_increase_factor`);
  running += regionalIncrease;
  if (missing.size) return { status: 'unavailable', reason: 'missing-coefficients', missingCoefficients: [...missing].sort() };
  if (maxArea <= minArea || !Number.isFinite(running) || running < 0) {
    return { status: 'unavailable', reason: 'invalid-result' };
  }
  const regularEur = Math.trunc(running * snapshot.vatFactor / snapshot.eurFactor);
  const regular = Math.round(Number((regularEur * snapshot.regionalMultiplier).toFixed(8)));
  if (!Number.isSafeInteger(regularEur) || !Number.isSafeInteger(regular)) return { status: 'unavailable', reason: 'invalid-result' };
  return {
    status: 'available', market: snapshot.market, currency: snapshot.currency,
    snapshotVersion: snapshot.version, regularEur, regular,
    promotional: snapshot.promotionPercent === null ? null : Math.round(regular - regular * (snapshot.promotionPercent / 100)),
    promotionPercent: snapshot.promotionPercent,
    stages: { base, elements, traits, margin, logistics, dimensionIncrease, materialIncrease,
      categoryStyleIncrease, mosaicIncrease, regionalIncrease },
  };
}
