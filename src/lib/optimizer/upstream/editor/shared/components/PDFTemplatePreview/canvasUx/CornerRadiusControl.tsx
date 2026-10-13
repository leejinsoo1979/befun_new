import React from 'react';

/** 요소 도형과 컷팅보드가 공유하는 모서리 둥글기 입력. 값의 단위는 호출자가 지정한다. */
export function CornerRadiusControl({ value, onChange, max = 100, unit = '', sliderClassName, valueClassName }: {
  value: number; onChange: (value: number) => void; max?: number; unit?: string; sliderClassName?: string; valueClassName?: string;
}) {
  return <>
    <input className={sliderClassName} type="range" min={0} max={max} step={1} value={value} onChange={e => onChange(Number(e.target.value))} aria-label="모서리 둥글게" />
    <input className={valueClassName} style={{ width: 72 }} type="number" min={0} max={max} step={0.1} value={value} aria-label="모서리 반경" onChange={e => {
      const n = Number(e.target.value); if (e.target.value !== '' && Number.isFinite(n)) onChange(Math.max(0, Math.min(max, n)));
    }} />{unit && <span>{unit}</span>}
  </>;
}
