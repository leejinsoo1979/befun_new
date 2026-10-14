import type { ConnectorSelection } from './apply';

import { CONNECTOR_SETTINGS_EVENT, CONNECTOR_SETTINGS_KEY as KEY, savedConnectorSystem } from '@/lib/assembly-guide/tylko-manual/selection';

export function loadConnectorSelection(): ConnectorSelection {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && savedConnectorSystem(saved)) {
      const value = JSON.parse(saved) as Record<string, unknown>;
      const toolNumbers: Record<string, number> = {};
      if (value.toolNumbers && typeof value.toolNumbers === 'object' && !Array.isArray(value.toolNumbers)) {
        for (const [model, number] of Object.entries(value.toolNumbers)) {
          if (typeof number === 'number' && Number.isInteger(number) && number > 0) toolNumbers[model] = number;
        }
      }
      return {
        system: savedConnectorSystem(saved) ?? undefined,
        body: typeof value.body === 'string' ? value.body : undefined,
        back: typeof value.back === 'string' ? value.back : undefined,
        toolNumbers,
      };
    }
  } catch {
    // 손상된 값은 무시
  }
  return {};
}

export function saveConnectorSelection(selection: ConnectorSelection) {
  localStorage.setItem(KEY, JSON.stringify(selection));
  window.dispatchEvent(new Event(CONNECTOR_SETTINGS_EVENT));
}
