import { guideMounts } from '@/components/three/furniture-hardware/ovvo/guideAdapter';
import type { ConnectorModel } from './sequence';

export const ovvoGuideModel = (model: ConnectorModel) => model === 'V-1230P' ? 'P' : 'R';

/** Provider anchors in this mm scene. The moving panel supplies the sampled translation once. */
export function settledOvvoMounts(model: ConnectorModel, centerZ: number) {
  return guideMounts(ovvoGuideModel(model), model === 'V-1230P' ? 'pressed' : 'locked', centerZ);
}

/**
 * The provider's example displacement is inferred from the official release pose.
 * It is not a measured assembly distance and must not enter CNC/BOM data.
 */
export function ovvoAssemblyTravel(model: ConnectorModel) {
  if (model === 'V-1230P') return { distanceMm: 0, status: 'observed' as const, basis: 'P: push into place; no slide' };
  const entry = guideMounts('R', 'inserted', 0).connector.position;
  const seated = guideMounts('R', 'locked', 0).connector.position;
  return { distanceMm: entry[2] - seated[2], status: 'inferred' as const, basis: 'HW example pose; 15 mm is labelled in official section 4. Release' };
}
