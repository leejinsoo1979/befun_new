import type { Geometry, Schema, Snapshot, Thumbnail } from '@/lib/bookcase/types';

export interface SourceProduct {
  key: string;
  id: number;
  shelfType: number;
  category: string;
  line: 'edge' | 'tone' | 'uff' | 'smooth' | 'classic' | 'modern';
  dnaKey: string;
  preset: Record<string, unknown>;
  width: number;
  height: number;
  depth: number;
  eur: number;
  color: string;
  coversOnly: boolean;
  preview: string;
  detached?: boolean;
  geometry?: Record<string, unknown>;
}
export interface SourceDefinition extends SourceProduct {
  dna: unknown;
  image: string;
  title: string;
}
export interface SourceState {
  version: 1;
  key: string;
  preset: Record<string, unknown>;
}
export interface SourceOption { value: unknown; label: string; disabled?: boolean }
export interface SourceParameter {
  name?: string;
  label: string;
  visible: boolean;
  enabled: boolean;
  type: string;
  options?: SourceOption[];
  ranges?: { min: number; max: number; step: number }[];
}
export interface SourceConfiguration {
  values: Record<string, unknown> & { channels?: Record<string, Record<string, unknown>> };
  parameters: Record<string, SourceParameter> & { channels?: Record<string, Record<string, SourceParameter>> };
}
export interface SourceSnapshot {
  preset: Record<string, unknown>;
  geometry: Geometry;
  schema: Schema;
  configuration: SourceConfiguration;
  thumbnails: Thumbnail[];
}
export type FurnitureSnapshot = Snapshot;
