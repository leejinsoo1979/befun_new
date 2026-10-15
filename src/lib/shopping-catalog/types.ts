import type { DownloadedItem } from '@/lib/catalog-expansion/server';

export interface ShoppingDetails {
  line: string;
  style: string;
  eur: number;
  regularEur: number;
  width: number | null;
  height: number | null;
  depth: number | null;
  badges: string[];
  variants: string[];
  source: string;
}
export interface ShoppingVariant extends DownloadedItem { details?: ShoppingDetails }
export interface ShoppingItem extends ShoppingVariant { variants: ShoppingVariant[] }
