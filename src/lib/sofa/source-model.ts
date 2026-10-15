import registry from './source-assets.json';
import materialSettings from './source-material-settings.json';
import type { PlacedSofaModule, SofaDesign, SofaModel } from './design';

type Asset = { local: string; filePath: string };
export const sofaSourceAssets: Record<string, Asset> = registry;
const smoothColors = ['rewool_brown','rewool_oliveGreen','rewool_lightGrey','rewool_butterYellow','rewool_shadowPink','rewool_green','rewool_babyBlue','darven_ecru','darven_rock','darven_darkBrown','darven_steel','darven_tobacco','darven_pink','darven_camouflage','darven_klein','leather_cognac','leather_anthracite','leather_oatBeige','leather_willowGreen','plain_beige','plain_lightGray','plain_anthracite','plain_terracota','plain_greenSpruce','boucle_pearl',null,'boucle_mossGreen','boucle_darkBrown'];
const uffColors = ['glory_natural','glory_linen','glory_steel','glory_liver','glory_graphite','glory_pale','glory_brass','glory_thyme','glory_hazel','colormax_butterYellow','colormax_beige','colormax_saltPepper','colormax_mint','colormax_grey','colormax_blackPink'];

/** IDs and handedness come from the public renderer registry, not filename order. */
export function sourceModule(part: PlacedSofaModule, design: SofaDesign) {
  const { module } = part;
  const foot = module.key.startsWith('FR_');
  let ids: string[];
  let rotation = 0;
  if (design.model === 'uff') {
    const right = part.armrest ? (part.index === -2) !== (design.direction === 'left') : design.direction === 'right';
    ids = [module.id + (part.armrest || module.key.startsWith('CA_') ? (right ? '_R' : '_L') : '')];
    // Uff footrest source axes are wide X / short Z; the catalog contains both orientations.
    if (foot && module.width < module.depth) rotation = Math.PI / 2;
  } else {
    ids = (part.armrest || foot) ? [`${module.id}_SEAT`] : ['SEAT','BACKREST','HEADREST'].map(role => `${module.id}_${role}`);
    if (foot && module.width < module.depth) rotation = Math.PI / 2;
  }
  const gi = design.model === 'uff' ? `${ids[0]}_512` : foot || part.armrest ? 'FOOT_AO_GI' : 'SEAT_AO_GI';
  for (const id of [...ids, gi]) if (!sofaSourceAssets[id]) throw new Error(`Missing sofa source asset: ${id}`);
  return { ids, gi, rotation };
}

export function sourceFabric(model: SofaModel, material: number) {
  const color = (model === 'uff' ? uffColors : smoothColors)[material];
  if (!color) return null; // Smooth material 25 has no source definition; never alias it to another fabric.
  const family = color.split('_')[0];
  const normal = family === 'colormax' ? 'aydin_normal' : family === 'boucle' ? (material === 24 ? 'boucle_ascot_normal' : 'boucle_impressme_normal') : `${family}_normal`;
  const sheenMap = model === 'uff' ? (family === 'glory' ? 'glory_roughness' : 'aydin_roughness') : null;
  const profile = family === 'boucle' ? (material === 24 ? 'boucle_ascot' : 'boucle_impressme') : family;
  const settings = materialSettings.profiles[profile as keyof typeof materialSettings.profiles];
  const repeat: [number, number] = [settings.repeat.x, settings.repeat.y];
  const sheenColor = materialSettings.sheenColors[color as keyof typeof materialSettings.sheenColors];
  return { color, normal, sheenMap, repeat, family, settings, sheenColor, rotation: ['rewool', 'plain', 'boucle'].includes(family) ? Math.PI / 2 : 0 };
}
