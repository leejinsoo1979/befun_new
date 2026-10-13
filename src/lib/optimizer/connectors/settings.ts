import type { ConnectorSelection } from './apply';

const KEY = 'befun-optimizer-connectors';

export function loadConnectorSelection(): ConnectorSelection {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as ConnectorSelection;
  } catch {
    // 손상된 값은 무시
  }
  return {};
}

export function saveConnectorSelection(selection: ConnectorSelection) {
  localStorage.setItem(KEY, JSON.stringify(selection));
}
