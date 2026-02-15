'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useShelfStore } from '@/stores/useShelfStore';

const THUMB_WIDTH = 72;

const DEPTH_OPTIONS = [
  { label: '24cm', value: 24 },
  { label: '32cm', value: 32 },
  { label: '40cm', value: 40 },
];

function TylkoSlider({
  label,
  value,
  displayValue,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const percentage = (value - min) / (max - min);
  const atEdge = value <= min || value >= max;

  const thumbLeft = useMemo(() => {
    return `calc(${percentage * 100}% - ${percentage * THUMB_WIDTH}px + ${THUMB_WIDTH / 2}px)`;
  }, [percentage]);

  const fillWidth = `calc(${percentage * 100}% - ${percentage * THUMB_WIDTH}px + ${THUMB_WIDTH / 4}px)`;
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
      <span className="cfg-label">{label}</span>
      <div
        className="tylko-slider-wrap"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="tylko-slider-bg" />
        <div className="tylko-slider-track" style={{ width: fillWidth }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          className="tylko-slider"
        />

        {showPill ? (
          <div className="tylko-thumb-group" style={{ left: thumbLeft }}>
            <button
              className={`tylko-step-btn ${isHovered ? (value > min ? 'visible' : 'spacer') : ''}`}
              onClick={() => onChange(Math.max(min, value - step))}
            >
              −
            </button>
            <span className="tylko-pill">{displayValue}</span>
            <button
              className={`tylko-step-btn ${isHovered ? (value < max ? 'visible' : 'spacer') : ''}`}
              onClick={() => onChange(Math.min(max, value + step))}
            >
              +
            </button>
          </div>
        ) : (
          <>
            <span className="tylko-drag-text" style={{ left: thumbLeft }}>
              {displayValue}
            </span>
            <span className="tylko-drag-dot" style={{ left: thumbLeft }} />
          </>
        )}
      </div>
    </div>
  );
}

function HeightSlider({
  numRows,
  maxRows,
  onChange,
  displayValue,
}: {
  numRows: number;
  maxRows: number;
  onChange: (count: number) => void;
  displayValue: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const percentage = (numRows - 1) / (maxRows - 1);
  const atEdge = numRows <= 1 || numRows >= maxRows;

  const thumbLeft = useMemo(() => {
    return `calc(${percentage * 100}% - ${percentage * THUMB_WIDTH}px + ${THUMB_WIDTH / 2}px)`;
  }, [percentage]);

  const fillWidth = `calc(${percentage * 100}% - ${percentage * THUMB_WIDTH}px + ${THUMB_WIDTH / 4}px)`;
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
      <span className="cfg-label">Height</span>
      <div className="tylko-slider-wrap">
        <div className="tylko-slider-bg" />
        <div className="tylko-slider-track" style={{ width: fillWidth }} />
        {/* 10 dot markers */}
        <div className="tylko-height-markers">
          {Array.from({ length: maxRows }, (_, i) => {
            const pct = i / (maxRows - 1);
            const rowNum = i + 1;
            const isCurrent = rowNum === numRows;
            const isActive = rowNum < numRows;
            return (
              <div
                key={i}
                className={`tylko-marker ${isCurrent ? 'current' : isActive ? 'active' : ''}`}
                style={{ left: `calc(${pct * 100}% - ${pct * THUMB_WIDTH}px + ${THUMB_WIDTH / 2}px)` }}
              />
            );
          })}
        </div>
        <input
          type="range"
          min={1}
          max={maxRows}
          step={1}
          value={numRows}
          onChange={(e) => onChange(Math.round(Number(e.target.value)))}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          className="tylko-slider"
        />
        {showPill ? (
          <span className="tylko-pill tylko-pill--abs" style={{ left: thumbLeft }}>
            {displayValue}
          </span>
        ) : (
          <span className="tylko-drag-text" style={{ left: thumbLeft }}>
            {displayValue}
          </span>
        )}
      </div>
    </div>
  );
}

export function DimensionPanel() {
  const width = useShelfStore((s) => s.width);
  const setWidth = useShelfStore((s) => s.setWidth);
  const depth = useShelfStore((s) => s.depth);
  const setDepth = useShelfStore((s) => s.setDepth);
  const numRows = useShelfStore((s) => s.numRows);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const thickness = useShelfStore((s) => s.thickness);

  const handleRowCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(10, Math.round(newCount)));
    const newRowHeights = [...rowHeights];
    while (newRowHeights.length < count) {
      newRowHeights.push(32);
    }
    let totalHeight = thickness;
    for (let i = 0; i < count; i++) {
      totalHeight += (newRowHeights[i] ?? 32) + thickness;
    }
    useShelfStore.setState({
      rowHeights: newRowHeights,
      numRows: count,
      height: totalHeight,
    });
  };

  const totalHeight = thickness + rowHeights.slice(0, numRows).reduce((sum, h) => sum + h + thickness, 0);

  return (
    <div>
      <TylkoSlider
        label="Width"
        value={width}
        displayValue={`${Math.round(width)}cm`}
        min={30}
        max={450}
        step={1}
        onChange={setWidth}
      />

      <HeightSlider
        numRows={numRows}
        maxRows={10}
        onChange={handleRowCountChange}
        displayValue={`${Math.round(totalHeight)}cm`}
      />

      <div className="cfg-row">
        <span className="cfg-label">Depth</span>
        <div className="flex items-center">
          <div className="tylko-pill-group">
            {DEPTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDepth(opt.value)}
                className={`tylko-pill-btn ${Math.abs(depth - opt.value) < 0.5 ? 'active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button className="tylko-help">?</button>
        </div>
      </div>
    </div>
  );
}
