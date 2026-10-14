import type { FurnitureBaseType, FurnitureLegFinish } from '@/lib/three/furniture-base';
import type { currentConfiguration } from './configuration';
import { supportsLongLegs } from '../../lib/three/furniture-base.ts';
import { resolveHardwareRows } from '../../lib/three/hardware-state.ts';

export interface SavedDesign {
  version: 1;
  name: string;
  config: Omit<ReturnType<typeof currentConfiguration>, 'baseType' | 'legFinish'> & { baseType?: FurnitureBaseType; legFinish?: FurnitureLegFinish };
}

export function parseSavedDesign(serialized: string): SavedDesign | null {
  if (!serialized || serialized.length > 4096) return null;
  try {
    const data = JSON.parse(serialized);
    if (!data || data.version !== 1 || typeof data.name !== 'string' || data.name.length > 120) return null;
    const config = data.config;
    if (!config || !['grid', 'slant', 'pixel', 'gradient', 'pattern', 'mosaic'].includes(config.style)) return null;
    if (!Number.isFinite(config.width) || config.width < 30 || config.width > 450) return null;
    if (![24, 32, 40].includes(config.depth) || !Number.isFinite(config.density) || config.density < 0 || config.density > 100) return null;
    if (!['classic', 'natural', 'solid', 'edgeMix'].includes(config.colorCategory) || typeof config.color !== 'string' || !/^[A-Za-z0-9 _+.-]{1,80}$/.test(config.color)) return null;
    if (config.baseType !== undefined && !['standard','legs'].includes(config.baseType)) return null;
    if (config.legFinish !== undefined && !['silver', 'black'].includes(config.legFinish)) return null;
    if (typeof config.hasBackPanel !== 'boolean') return null;
    if (!Array.isArray(config.rowHeights) || config.rowHeights.length < 1 || config.rowHeights.length > 10 || !config.rowHeights.every((height: unknown) => typeof height === 'number' && [18, 28, 32, 38].includes(height))) return null;
    if (config.numRows !== config.rowHeights.length) return null;
    const validLayers = (layers: unknown): layers is number[] => Array.isArray(layers) && layers.length <= config.numRows && layers.every(row => Number.isInteger(row) && row >= 0 && row < config.numRows) && new Set(layers).size === layers.length;
    if (!validLayers(config.doorsCreatedLayers) || !validLayers(config.drawersCreatedLayers)) return null;
    const hardwareRowStyles: Record<number, number> = {};
    if (config.hardwareRowStyles !== undefined) {
      if (!config.hardwareRowStyles || typeof config.hardwareRowStyles !== 'object' || Array.isArray(config.hardwareRowStyles)) return null;
      for (const [row, code] of Object.entries(config.hardwareRowStyles)) {
        if (!/^\d+$/.test(row) || Number(row) >= config.numRows || ![11, 12, 13, 21, 22, 31].includes(code as number)) return null;
        if ((Number(code) % 10 > 1) !== config.doorsCreatedLayers.includes(Number(row))) return null;
        if ((Math.floor(Number(code) / 10) > 1) !== config.drawersCreatedLayers.includes(Number(row))) return null;
        hardwareRowStyles[Number(row)] = code as number;
      }
    }
    return {
      version: 1, name: data.name,
      config: {
        baseType: config.baseType === 'legs' && supportsLongLegs(config.depth, config.style) ? 'legs' : 'standard',
        legFinish: config.legFinish ?? 'silver',
        style: config.style, width: config.width, depth: config.depth, density: config.density,
        height: 2 + config.rowHeights.reduce((total: number, height: number) => total + height + 2, 0),
        color: config.color, colorCategory: config.colorCategory, hasBackPanel: config.hasBackPanel,
        rowHeights: [...config.rowHeights], numRows: config.numRows,
        doorsCreatedLayers: [...config.doorsCreatedLayers], drawersCreatedLayers: [...config.drawersCreatedLayers],
        hardwareRowStyles: resolveHardwareRows(config.doorsCreatedLayers, config.drawersCreatedLayers, hardwareRowStyles),
      },
    };
  } catch { return null; }
}

export const localDesignKey = 'befun-local-designs-v1';
export const localDesignEvent = 'befun-local-designs-change';
export function saveLocalDesign(design: SavedDesign) {
  const validated = parseSavedDesign(JSON.stringify(design));
  if (!validated) throw new Error('이 디자인의 구성을 저장할 수 없습니다.');
  const serialized = JSON.stringify(validated);
  let previous: string[] = [];
  try {
    const data = JSON.parse(localStorage.getItem(localDesignKey) ?? '[]');
    if (Array.isArray(data)) previous = data.flatMap(value => {
      const parsed = typeof value === 'string' ? parseSavedDesign(value) : null;
      return parsed ? [JSON.stringify(parsed)] : [];
    });
  } catch { /* 이전 데이터가 손상되었으면 새 디자인으로 시작한다. */ }
  localStorage.setItem(localDesignKey, JSON.stringify([serialized, ...previous.filter(value => value !== serialized)].slice(0, 20)));
  window.dispatchEvent(new Event(localDesignEvent));
  return `${window.location.origin}/design-preview?${new URLSearchParams({ design: serialized })}`;
}
