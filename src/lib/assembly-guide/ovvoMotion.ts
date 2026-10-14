import type { ConnectorModel } from './sequence';

/** Part names and operations transcribed from the official P/R installation sheets. No part dimensions. */
export const ovvoPartPairing = {
  'V-1230P': { endHousing: 'V-1230PH', faceHousing: 'V-1230PH', connector: 'V-1230PC', releaseSupported: false },
  'V-1230R': { endHousing: 'V-1230PH', faceHousing: 'V-1230RH', connector: 'V-1230RC', releaseSupported: true },
} as const;

export type OvvoAssemblyPhase = 'prepare' | 'align' | 'insert' | 'slide' | 'check';
export type OvvoReleasePhase = 'seated' | 'release-slide' | 'lift';

export interface OvvoMotionInput {
  /** Scene spacing, not a hardware or manufacturing dimension. */
  openGapMm: number;
  alignedGapMm: number;
  /** Must come from the corrected hardware contract. Unknown is never replaced by release distance. */
  assemblySlideMm: number | null;
}

// The 15 mm label belongs to section 4 (Release) of V-1230R's official sheet.
export const ovvoRRelease = {
  distanceMm: 15,
  source: 'https://ovvotech.com/wp-content/uploads/2022/09/V-1230R-Releasable-Miling-Connector-Instructions.pdf',
  sourceSection: '4. Release',
} as const;

function progressOf(value: number) {
  const p = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return p * p * p * (p * (p * 6 - 15) + 10);
}

function validateInput(input: OvvoMotionInput) {
  if (!Number.isFinite(input.openGapMm) || !Number.isFinite(input.alignedGapMm) || input.alignedGapMm <= 0 || input.openGapMm < input.alignedGapMm) throw new RangeError('Invalid scene approach spacing');
  if (input.assemblySlideMm !== null && (!Number.isFinite(input.assemblySlideMm) || input.assemblySlideMm < 0)) throw new RangeError('Invalid assembly displacement');
}

/** Joint-local scalar movement only. The corrected hardware adapter supplies the axes and mounted transforms. */
export function sampleOvvoAssembly(model: ConnectorModel, phase: OvvoAssemblyPhase, progress: number, input: OvvoMotionInput) {
  validateInput(input);
  if (model === 'V-1230P' && phase === 'slide') throw new RangeError('Permanent P assembly has no slide phase');
  const p = progressOf(progress);
  const released = model === 'V-1230R';
  const distance = released ? input.assemblySlideMm : 0;
  const normalGapMm = phase === 'prepare' ? input.openGapMm : phase === 'align' ? input.openGapMm + (input.alignedGapMm - input.openGapMm) * p : phase === 'insert' ? input.alignedGapMm * (1 - p) : 0;
  const slideOffsetMm = distance === null ? null : distance * (phase === 'check' ? 0 : phase === 'slide' ? 1 - p : 1);
  return { normalGapMm, slideOffsetMm, motionReady: distance !== null };
}

/** R release is an explicit slide-then-lift operation, not a reversed P/R assembly timeline. */
export function sampleOvvoRelease(model: ConnectorModel, phase: OvvoReleasePhase, progress: number, liftClearanceMm: number) {
  if (!ovvoPartPairing[model].releaseSupported) throw new RangeError('No release sequence for permanent V-1230P');
  if (!Number.isFinite(liftClearanceMm) || liftClearanceMm <= 0) throw new RangeError('Invalid scene lift clearance');
  const p = progressOf(progress);
  return {
    slideOffsetMm: phase === 'seated' ? 0 : ovvoRRelease.distanceMm * (phase === 'release-slide' ? p : 1),
    normalGapMm: phase === 'lift' ? liftClearanceMm * p : 0,
  };
}
