import fs from 'node:fs';
import path from 'node:path';
import products from './products.json';
import legacy from '../legacy-designs/products.json';
import { downloadedCardEntries } from '@/lib/catalog-images';
import sofas from '@/lib/sofa-catalog/catalog.json';
import type { SourceDefinition, SourceProduct } from './types';

const catalogue = { ...products, ...legacy } as unknown as Record<string, SourceProduct>;
export function sourceProduct(productKey: string): SourceDefinition | null {
  if (!Object.hasOwn(catalogue, productKey)) return null;
  const product = catalogue[productKey];
  const entry = downloadedCardEntries.find(item => item.productKey === productKey);
  const sofaVariant = productKey.endsWith(',s') ? sofas.flatMap(item => item.variants).find(item => item.id === product.id) : undefined;
  const dna = JSON.parse(fs.readFileSync(path.join(process.cwd(), product.shelfType <= 1 ? 'src/lib/catalog-entry/legacy-designs/dna' : 'src/lib/catalog-entry/source-designs/dna', `${product.dnaKey}.json`), 'utf8'));
  return { ...product, dna, image: entry?.thumbnail ?? sofaVariant?.thumbnail ?? (product.id === 657092 ? '/three/bookcase/ui/657092.webp' : ''), title: entry?.name ?? sofaVariant?.name ?? `${product.line} ${product.color}` };
}
