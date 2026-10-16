import smoothPositions from './source-feet-smooth.json';
import type { PlacedSofaModule, SofaModel } from './design';

/** Original type10/type12 renderer: coordinates are relative to the native module, in metres. */
export function sourceFeet(part: PlacedSofaModule, model: SofaModel): { asset: string; positions: [number, number, number][] } {
  if (model === 'smooth') {
    const entry = smoothPositions[part.module.id as keyof typeof smoothPositions];
    if (!entry) throw new Error(`Missing original sofa foot positions: ${part.module.id}`);
    // The source processor explicitly uses y=0, ignoring the table's y=4 metadata.
    return { asset: 'S01_LEG', positions: entry.legs.map(p => [p.x / 1000, 0, p.z / 1000]) };
  }
  let { width, depth } = part.module;
  // FR source geometry is wide X, short Z; the parent rotates the entire module (feet included).
  if (part.module.key.startsWith('FR_') && width < depth) [width, depth] = [depth, width];
  const x = width / 2000 - .13;
  const z = depth / 2000 - .13;
  return { asset: 'S02_LEG', positions: part.armrest ? [[0, 0, z], [0, 0, -z]] : [[x, 0, z], [-x, 0, z], [x, 0, -z], [-x, 0, -z]] };
}
