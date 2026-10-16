import modules from './modules.json';
import uffModules from './uff-modules.json';
import { quoteSofa } from '../commerce/reference-sofa-pricing';

export type SofaModel = 'smooth' | 'uff';
export const SOFA_MODULES = modules;
export const sofaModules = (model: SofaModel) => model === 'uff' ? uffModules : modules;
export interface SofaModule { key: string; id: string; type: string[]; width: number; depth: number; height: number }
export interface SofaDesign {
  version: 1;
  model: SofaModel;
  seats: { key: string }[];
  material: number;
  armrests: 'none' | 'left' | 'right' | 'both';
  direction: 'left' | 'right';
  footrest: string | null;
  replaceableCovers?: boolean;
}
export const DEFAULT_SOFA: SofaDesign = {
  version: 1, model: 'smooth', seats: [{ key: 'ST_D1000_W875' }, { key: 'ST_D1000_W875' }],
  material: 8, armrests: 'none', direction: 'right', footrest: null,
};
/** Observed DE preset 316001: 3145mm (displayed as 315cm), €2841, fixed Glory covers. */
export const DEFAULT_UFF: SofaDesign = {
  version: 1, model: 'uff', seats: [{ key: 'ST_D1000_W900' }, { key: 'ST_D1000_W900' }, { key: 'CA_D1500_W1150' }],
  material: 0, armrests: 'both', direction: 'right', footrest: null, replaceableCovers: false,
};
export const sofaModule = (key: string, model: SofaModel = 'smooth') => sofaModules(model).find(module => module.key === key);
export const isChaise = (key: string) => /^(CL|CA)_/.test(key);
export function parseSofaDesign(value: unknown): SofaDesign | null {
  if (!value || typeof value !== 'object') return null;
  const d = value as SofaDesign;
  if (d.version !== 1 || !['smooth','uff'].includes(d.model) || !Array.isArray(d.seats) || d.seats.length < 1 || d.seats.length > 5
    || !Number.isInteger(d.material) || d.material < 0 || d.material > (d.model === 'uff' ? 14 : 27)
    || !['none', 'left', 'right', 'both'].includes(d.armrests) || !['left', 'right'].includes(d.direction)
    || (d.replaceableCovers !== undefined && typeof d.replaceableCovers !== 'boolean')
    || !(d.footrest === null || (typeof d.footrest === 'string' && d.footrest.startsWith('FR_') && sofaModule(d.footrest,d.model)))) return null;
  if (!d.seats.every(s => s && typeof s.key === 'string' && /^(ST|CL|CA)_/.test(s.key) && sofaModule(s.key,d.model))) return null;
  if (d.seats.filter(s => isChaise(s.key)).length > 1
    || d.seats.some((s, i) => isChaise(s.key) && i !== d.seats.length - 1)) return null;
  const depths = new Set(d.seats.filter(s => s.key.startsWith('ST_')).map(s => sofaModule(s.key,d.model)!.depth));
  if (depths.size > 1) return null;
  // Integrated arm replaces the outside separate arm, it is never charged twice.
  if (d.seats.some(s => s.key.startsWith('CA_')) && !['right','both'].includes(d.armrests)) return null;
  return { version: 1, model: d.model, seats: d.seats.map(s => ({ key: s.key })), material: d.material,
    armrests: d.armrests, direction: d.direction, footrest: d.footrest,
    ...(d.model === 'uff' ? {replaceableCovers: d.replaceableCovers ?? false} : {}) };
}
export interface PlacedSofaModule { module: SofaModule; x: number; z: number; index: number; armrest?: boolean }
/** DNA binding loss: seats 20mm; S01 arms 10mm; S02 arms 15mm plus 50mm overlap. */
export function sofaGeometry(design: SofaDesign) {
  const uff = design.model === 'uff';
  const seats = design.seats.map(s => sofaModule(s.key,design.model)!);
  const left = design.armrests === 'left' || design.armrests === 'both';
  const right = (design.armrests === 'right' || design.armrests === 'both') && !design.seats.some(s=>s.key.startsWith('CA_'));
  const seatDepth = seats.find(s=>s.type.includes('seater'))?.depth ?? 1000;
  const arm = sofaModule(uff ? `AR_D${seatDepth-50}_W300` : 'AR_D875_W250',design.model)!;
  const armAdvance = uff ? 235 : 240;
  const seatWidth = seats.reduce((sum, m) => sum + m.width, 0) - 20 * (seats.length - 1);
  const width = seatWidth + (Number(left) + Number(right)) * armAdvance;
  const depth = Math.max(...seats.map(m => m.depth));
  let cursor = -width / 2 + (left ? armAdvance : 0);
  const placed: PlacedSofaModule[] = seats.map((module, index) => {
    const item = { module, index, x: cursor + module.width / 2, z: module.depth / 2 };
    cursor += module.width - 20;
    return item;
  });
  if (left) placed.push({ module: arm, index: -1, x: -width / 2 + arm.width / 2, z: arm.depth / 2, armrest: true });
  if (right) placed.push({ module: arm, index: -2, x: width / 2 - arm.width / 2, z: arm.depth / 2, armrest: true });
  if (design.footrest) { const foot = sofaModule(design.footrest,design.model)!; placed.push({ module: foot, index: -3, x: 0, z: depth + 375 + foot.depth / 2 }); }
  if (design.direction === 'left') placed.forEach(p => { p.x = -p.x; });
  const totalDepth = design.footrest ? depth + 375 + sofaModule(design.footrest,design.model)!.depth : depth;
  return { width, depth, totalDepth, height: uff ? 730 : 835, placed };
}
export function sofaQuote(design: SofaDesign) {
  if (!parseSofaDesign(design)) return { status: 'unavailable' as const, reason: 'invalid-design' };
  return quoteSofa(sofaGeometry(design).placed.map(p => ({ id: p.module.id, material: design.material })),design.replaceableCovers);
}

/** Render the assembled layout, including the DNA's arm overlap and binding losses. */
export function uffRenderGeometry(design: SofaDesign) {
  return sofaGeometry(design);
}
