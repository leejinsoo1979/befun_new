'use client';

import type { CSSProperties } from 'react';
import styles from './configurator-loading.module.css';

// Five horizontal layers reuse the supplied artwork; the bottom lands first.
const panels = [4, 3, 2, 1, 0];

/** Lightweight fallback shown until the existing scene-ready signal arrives. */
export function ConfiguratorLoading({ ready = false }: { ready?: boolean }) {
  return <div
    className={`${styles.loader} ${ready ? styles.ready : ''}`}
    role={ready ? undefined : 'status'}
    aria-live="polite"
    aria-hidden={ready || undefined}
  >
    <div className={styles.mark} aria-hidden="true">
      <span className={styles.outline} />
      {panels.map((row, index) => <span
        key={row}
        className={styles.panel}
        data-logo-panel={row}
        style={{
          '--delay': `${index * 110}ms`,
          '--clip': `inset(${row * 20}% 0 ${80 - row * 20}% 0)`,
        } as CSSProperties}
      ><span className={styles.artwork} /></span>)}
    </div>
    <span className={styles.caption}>불러오는 중</span>
  </div>;
}
