import { num } from '../_lib/format';
import styles from '../admin.module.css';

/** 일별 매출 막대 차트(서버 렌더 SVG) */
export function BarChart({ data }: { data: { label: string; value: number; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 700, H = 220, pad = 24, bw = (W - pad) / Math.max(1, data.length);
  const grid = [0.25, 0.5, 0.75, 1];
  return (
    <>
      <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="일별 매출">
        {grid.map((g) => <line key={g} x1={pad} x2={W} y1={H - 18 - (H - 30) * g} y2={H - 18 - (H - 30) * g} stroke="#eef0f2" />)}
        {grid.map((g) => <text key={`t${g}`} x="0" y={H - 14 - (H - 30) * g} fontSize="9" fill="#9aa0a6">{num(Math.round((max * g) / 10000))}만</text>)}
        {data.map((d, i) => {
          const bh = ((H - 30) * d.value) / max;
          return (
            <g key={d.label}>
              <rect x={pad + i * bw + bw * 0.18} y={H - 18 - bh} width={bw * 0.64} height={Math.max(bh, d.value ? 2 : 0)} rx="3" fill={d.value ? '#17181a' : '#eef0f2'}>
                <title>{`${d.label} · ${num(d.value)}원 · ${d.count}건`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className={styles.chartLegend}><span>{data[0]?.label}</span><span>{data[Math.floor(data.length / 2)]?.label}</span><span>{data[data.length - 1]?.label}</span></div>
    </>
  );
}
