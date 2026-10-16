import smoothSwatches from './smooth-swatches.json';
export function smoothSwatch(material: number) {
  return smoothSwatches[String(material) as keyof typeof smoothSwatches] ?? null;
}
const sourceColors = (start: number, count: number) => Array.from({ length: count }, (_, i) => smoothSwatch(start + i)!.color);
// Source material IDs are persistent; swatch order never changes their identity.
export const SOFA_FABRICS = [
  { id: 'cord', name: ['코듀로이', 'Corduroy', 'コーデュロイ'], start: 7, colors: sourceColors(7, 8) },
  { id: 'plain', name: ['셰닐', 'Chenille', 'シェニール'], start: 19, colors: sourceColors(19, 5) },
  { id: 'boucle', name: ['부클레 클래식', 'Bouclé Classic', 'ブークレ クラシック'], start: 24, colors: sourceColors(24, 1) },
  { id: 'boucle-melange', name: ['부클레 멜란지', 'Bouclé Melange', 'ブークレ メランジ'], start: 26, colors: sourceColors(26, 2) },
  { id: 'wool', name: ['울', 'Wool', 'ウール'], start: 0, colors: sourceColors(0, 7) },
  { id: 'leather', name: ['가죽', 'Leather', 'レザー'], start: 15, colors: sourceColors(15, 4) },
] as const;
export const UFF_FABRICS = [
  { id: 'glory', name: ['부클레 파인', 'Bouclé Fine', 'ブークレ ファイン'], start: 0, colors: ['#c6c5bc','#c4b9a5','#a6a7a1','#a79784','#5d5e58','#a17472','#b59b50','#788171','#6e5546'] },
  { id: 'colormax', name: ['부클레 텍스처', 'Bouclé Textured', 'ブークレ テクスチャー'], start: 9, colors: ['#ddd6c7','#b5a998','#9a9d96','#7c7770','#8a6c5b','#676b5a'] },
] as const;
export const sofaFabrics = (model: 'smooth' | 'uff') => model === 'uff' ? UFF_FABRICS : SOFA_FABRICS;
export function fabricMaterialIds(fabric: { start: number; colors: readonly string[] }, model: 'smooth' | 'uff') {
  // Tylko displays green before beige; saved material IDs 17/18 must not be swapped.
  return model === 'smooth' && fabric.start === 15 ? [15, 16, 18, 17]
    : Array.from({ length: fabric.colors.length }, (_, index) => fabric.start + index);
}
export function sofaFabric(material: number, model: 'smooth' | 'uff' = 'smooth') {
  if (model === 'smooth' && material === 25) return SOFA_FABRICS[2]; // Legacy unavailable material remains an explicit preview.
  return sofaFabrics(model).find(f => material >= f.start && material < f.start + f.colors.length)!;
}
export function sofaColor(material: number, model: 'smooth' | 'uff' = 'smooth'): string {
  const fabric = sofaFabric(material,model);
  return fabric.colors[material - fabric.start] ?? '#b6a68d';
}
