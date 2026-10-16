/** Category entry points for the source-backed configurators already available. */
export function categoryConfiguratorHref(category: string, productLines = ''): string {
  const lines = productLines.split(',').filter(Boolean);
  const selected = lines.length === 1 ? lines[0] : '';
  const intro = `/configurator-intro${category ? `?category=${encodeURIComponent(category)}` : ''}`;
  if (category === 'dressing_table') return `/legacy-configurator?product=${selected === '6' ? '7389388' : '9272016'}`;
  if (category === 'vinyl_storage') return '/legacy-configurator?product=905398';
  if (selected === '3' || selected === '6') return intro;
  if (selected === '7' && ['bookcase', 'wallstorage'].includes(category)) {
    return '/bookcase-configurator?line=edge&product=540446';
  }
  if (selected === '7') return intro;
  switch (category) {
    case 'bookcase': return '/bookcase-configurator?line=tone&product=1964243';
    case 'wallstorage': return '/bookcase-configurator?line=tone&product=1964423';
    case 'wallunits': return '/bookcase-configurator?line=tone&product=1964607';
    case 'bedside_table': return '/bookcase-configurator?product=657092';
    default: return intro;
  }
}
