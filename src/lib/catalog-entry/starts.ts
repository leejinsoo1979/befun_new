import legacy from './legacy-designs/entries.json';
import starts from './starts.json';
import sources from './source-designs/entries.json';

/** Only exact source-product identities with observed initial configurations. */
export function catalogThumbnailStart(productKey: string) {
  if (Object.hasOwn(legacy, productKey)) return legacy[productKey as keyof typeof legacy];
  if (Object.hasOwn(starts, productKey) && starts[productKey as keyof typeof starts].kind === 'furniture') return starts[productKey as keyof typeof starts];
  if (Object.hasOwn(sources, productKey)) return sources[productKey as keyof typeof sources];
  return Object.hasOwn(starts, productKey) ? starts[productKey as keyof typeof starts] : null;
}
