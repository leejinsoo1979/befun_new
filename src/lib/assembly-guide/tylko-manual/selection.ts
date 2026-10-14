import type { PanelConnectorSystem } from '@/types/connectors';

export const CONNECTOR_SETTINGS_KEY = 'befun-optimizer-connectors';
export const CONNECTOR_SETTINGS_EVENT = 'befun:connector-selection';

/** Legacy optimizer selections are OVVO; an absent setting retains the Tylko manual landing page. */
export function savedConnectorSystem(raw: string | null): PanelConnectorSystem | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const system = (value as { system?: unknown }).system;
    if (system === 'ovvo' || system === 'tylko-clip') return system;
    return system === undefined ? 'ovvo' : null;
  } catch {
    return null;
  }
}

export function resolveGuideSystem(explicit?: string, topic?: string, saved?: PanelConnectorSystem | null): PanelConnectorSystem {
  if (explicit === 'ovvo' || explicit === 'tylko-clip') return explicit;
  if (topic === 'connector') return 'ovvo';
  if (topic === 'tylko-clip' || topic === 'legs' || topic === 'back-panel') return 'tylko-clip';
  return saved ?? 'tylko-clip';
}
