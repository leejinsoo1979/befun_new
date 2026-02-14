'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useShelfStore } from '@/stores/useShelfStore';

const PILL_WIDTH = 72;

export function DensitySlider() {
  const density = useShelfStore((s) => s.density);
  const setDensity = useShelfStore((s) => s.setDensity);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const percentage = density / 100;
  const atEdge = density <= 0 || density >= 100;

  const pillLeft = useMemo(() => {
    return `calc(${percentage * 100}% - ${percentage * PILL_WIDTH}px + ${PILL_WIDTH / 2}px)`;
  }, [percentage]);

  const showPill = !isDragging || atEdge;

  const stopDrag = useCallback(() => setIsDragging(false), []);
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', stopDrag);
      window.addEventListener('touchend', stopDrag);
      return () => {
        window.removeEventListener('mouseup', stopDrag);
        window.removeEventListener('touchend', stopDrag);
      };
    }
  }, [isDragging, stopDrag]);

  return (
    <div className="cfg-row">
      <span className="cfg-label">Density</span>
      <div
        className="tylko-slider-wrap"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="tylko-slider-bg" />
        <div className="tylko-slider-track" style={{ width: `calc(${percentage * 100}% - ${percentage * PILL_WIDTH}px + ${PILL_WIDTH / 4}px)` }} />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={density}
          onChange={(e) => setDensity(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          className="tylko-slider"
        />

        {showPill ? (
          <div className="tylko-thumb-group" style={{ left: pillLeft }}>
            <button
              className={`tylko-step-btn ${isHovered ? (density > 0 ? 'visible' : 'spacer') : ''}`}
              onClick={() => setDensity(Math.max(0, density - 1))}
            >
              −
            </button>
            <span className="tylko-pill">{density}%</span>
            <button
              className={`tylko-step-btn ${isHovered ? (density < 100 ? 'visible' : 'spacer') : ''}`}
              onClick={() => setDensity(Math.min(100, density + 1))}
            >
              +
            </button>
          </div>
        ) : (
          <>
            <span className="tylko-drag-text" style={{ left: pillLeft }}>
              {density}%
            </span>
            <span className="tylko-drag-dot" style={{ left: pillLeft }} />
          </>
        )}
      </div>
      <button className="tylko-help">?</button>
    </div>
  );
}
