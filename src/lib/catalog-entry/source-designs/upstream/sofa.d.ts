import type { SourceConfiguration } from '../types';
import type { Geometry } from '@/lib/bookcase/types';
export function resetSourceDNA(dna: unknown): void;
export default class Sofa {
  withDNA(dna: unknown): this;
  loadPreset(preset: Record<string, unknown>): void;
  getGeometry(): Geometry;
  getConfiguration(): SourceConfiguration;
  getPreset(): Record<string, unknown>;
  changeConfiguration(patch: Record<string, unknown>): SourceConfiguration;
}
