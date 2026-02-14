'use client';

import { useShelfStore } from '@/stores/useShelfStore';

export function BackPanelToggle() {
  const hasBackPanel = useShelfStore((s) => s.hasBackPanel);
  const setHasBackPanel = useShelfStore((s) => s.setHasBackPanel);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Back Panel</label>
        <button
          onClick={() => setHasBackPanel(!hasBackPanel)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            hasBackPanel ? 'bg-gray-900' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              hasBackPanel ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
