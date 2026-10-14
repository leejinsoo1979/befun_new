import type { DesignSpec } from '../_lib/spec';

/** 선반 정면 도식(행·도어·서랍·색상). 실제 렌더 썸네일이 없을 때 사용 */
export function DesignThumb({ spec }: { spec: DesignSpec | null }) {
  if (!spec) return <svg viewBox="0 0 100 70" aria-hidden><rect x="20" y="10" width="60" height="50" rx="2" fill="#e5e3dd" /></svg>;
  const w = 100, h = Math.max(30, Math.min(140, (spec.height / spec.width) * 100));
  const rows = [...spec.rows].reverse();
  const total = rows.reduce((a, r) => a + r, 0);
  const cols = Math.max(2, Math.round(spec.width / 45));
  const t = 1.6;
  const edge = '#1d1e1f22';
  const heights = rows.map((r) => ((h - t * (rows.length + 1)) * r) / total);
  const tops = heights.map((_, i) => t + heights.slice(0, i).reduce((a, v) => a + v + t, 0));
  return (
    <svg viewBox={`-4 -4 ${w + 8} ${h + 8}`} role="img" aria-label={spec.summary}>
      <rect x="0" y="0" width={w} height={h} rx="1.5" fill={spec.colorHex} stroke={edge} strokeWidth="0.6" />
      {rows.map((_, i) => {
        const rh = heights[i], top = tops[i];
        const row = spec.rows.length - 1 - i;
        const door = spec.doors.includes(row), drawer = spec.drawers.includes(row);
        const cell = (w - t * (cols + 1)) / cols;
        return Array.from({ length: cols }, (_, c) => {
          const x = t + c * (cell + t);
          return (
            <g key={`${i}-${c}`}>
              <rect x={x} y={top} width={cell} height={rh} fill={door || drawer ? spec.colorHex : '#00000026'} stroke={door || drawer ? '#00000033' : 'none'} strokeWidth="0.5" />
              {drawer && <line x1={x + cell * 0.35} x2={x + cell * 0.65} y1={top + rh * 0.3} y2={top + rh * 0.3} stroke="#00000055" strokeWidth="0.8" />}
              {door && !drawer && <line x1={x + cell * 0.85} x2={x + cell * 0.85} y1={top + rh * 0.4} y2={top + rh * 0.6} stroke="#00000055" strokeWidth="0.8" />}
            </g>
          );
        });
      })}
      {spec.legs && [[6, h], [w - 6, h]].map(([x, y2]) => <line key={x} x1={x} x2={x} y1={y2} y2={y2 + 4} stroke="#555" strokeWidth="1.2" />)}
    </svg>
  );
}
