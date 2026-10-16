/** New-design choices, not a claim that an unobserved photo configuration is restored. */
export function catalogNewDesigns(item: { productKey: string; categoryKey: string }): [string, string][] {
  // Mixed collections (all, search, favourites) must retain the product's own family.
  if (/^\d+,s$/.test(item.productKey) || ['sofas', 'two_seater', 'three_seater', 'four_plus_seater', 'chaise_longues', 'corner_sofas', 'modular_sofas', 'armchairs', 'ottomans_and_modules', 'covers'].includes(item.categoryKey)) {
    return [['Uff', '/sofa-configurator?model=uff'], ['Smooth', '/sofa-configurator?model=smooth']];
  }
  if (item.categoryKey.startsWith('wardrobe')) return [['Edge', '/furniture-design/wardrobe-edge'], ['Tone', '/furniture-design/wardrobe-tone']];
  if (item.categoryKey === 'dressing_table') return [['Classic', '/legacy-configurator?product=9272016'], ['Modern', '/legacy-configurator?product=7389388']];
  if (item.categoryKey === 'vinyl_storage') return [['Classic', '/legacy-configurator?product=905398']];
  if (item.categoryKey === 'desk') return [['Classic', '/furniture-design/desk-classic'], ['Modern', '/furniture-design/desk-modern']];
  if (item.categoryKey === 'bookcase') return [['Tone', '/bookcase-configurator?line=tone&product=1964243'], ['Befun', '/configurator']];
  if (item.categoryKey === 'wallstorage') return [['Edge', '/bookcase-configurator?line=edge&product=540446'], ['Tone', '/bookcase-configurator?line=tone&product=1964423']];
  if (item.categoryKey === 'wallunits') return [['Tone', '/bookcase-configurator?line=tone&product=1964607']];
  if (item.categoryKey === 'bedside_table') return [['Befun', '/bookcase-configurator?product=657092']];
  return [['Befun', '/configurator']];
}
