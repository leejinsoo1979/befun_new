'use client';

import { useShelfStore } from '@/stores/useShelfStore';

const BACK_PANEL_OPTIONS = [
  { label: 'OFF', value: false },
  { label: 'ON', value: true },
];

export function BackPanelToggle() {
  const hasBackPanel = useShelfStore((s) => s.hasBackPanel);
  const setHasBackPanel = useShelfStore((s) => s.setHasBackPanel);

  return (
    <div className="cfg-row">
      <span className="cfg-label">Back panels</span>
      <div className="flex items-center">
        <div className="tylko-pill-group">
          {BACK_PANEL_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setHasBackPanel(opt.value)}
              className={`tylko-pill-btn ${hasBackPanel === opt.value ? 'active' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button className="tylko-help">?</button>
      </div>
    </div>
  );
}
