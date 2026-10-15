import type { SourceConfiguration } from '../types';
import type { Geometry, Thumbnail } from '@/lib/bookcase/types';
export default class Wardrobe {
  withDNA(dna: unknown): this;
  loadPreset(preset: Record<string, unknown>): void;
  getGeometry(): Geometry;
  getConfiguration(): SourceConfiguration;
  getPreset(): Record<string, unknown>;
  changeConfiguration(patch: Record<string, unknown>): SourceConfiguration;
  getThumbnails(id: number): Thumbnail[];
}
