'use client';

import { useEffect, useId, useRef } from 'react';
import styles from './configurator-loading.module.css';

const logoWidth = 211.5;
const logoHeight = 49.5;
const panels = Array.from({ length: 25 }, (_, index) => ({
  index,
  x: (index % 5) * logoWidth / 5,
  y: (4 - Math.floor(index / 5)) * logoHeight / 5,
}));

/** Lightweight DOM/SVG fallback: available before the WebGL bundle loads. */
export function ConfiguratorLoading({ ready = false }: { ready?: boolean }) {
  const logo = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    if (ready || !logo.current) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animations: Animation[] = [];
    const assemble = () => {
      animations.forEach(animation => animation.cancel());
      animations = [];
      if (motion.matches) return;
      const startTime = document.timeline.currentTime;
      logo.current?.querySelectorAll<SVGGElement>('[data-logo-panel]').forEach((panel, index) => {
        const start = 0.03 + index * 0.021;
        const finish = start + 0.15;
        const lifted = 'translateY(25px) skewX(-8deg)';
        const landed = 'translateY(0px) skewX(0deg)';
        const animation = panel.animate([
          { opacity: 0, transform: lifted, offset: 0 },
          { opacity: 0, transform: lifted, offset: start, easing: 'cubic-bezier(.22,1,.36,1)' },
          { opacity: 1, transform: landed, offset: finish },
          { opacity: 1, transform: landed, offset: 0.86 },
          { opacity: 0, transform: landed, offset: 0.96 },
          { opacity: 0, transform: lifted, offset: 1 },
        ], { duration: 3400, iterations: Infinity });
        if (typeof startTime === 'number') animation.startTime = startTime;
        animations.push(animation);
      });
    };
    assemble();
    motion.addEventListener('change', assemble);
    return () => {
      motion.removeEventListener('change', assemble);
      animations.forEach(animation => animation.cancel());
    };
  }, [ready]);

  return <div className={`${styles.loader} ${ready ? styles.ready : ''}`} role={ready ? undefined : 'status'} aria-live="polite" aria-hidden={ready || undefined}>
    <div className={styles.composition} aria-hidden="true">
      <svg ref={logo} className={styles.mark} viewBox="-8 -14 227.5 105" fill="none">
        <defs>
          <image id={`${id}-artwork`} href="/imgs/icon/befun_logo.svg" width={logoWidth} height={logoHeight} />
          {panels.map(panel => <clipPath key={panel.index} id={`${id}-panel-${panel.index}`}>
            <rect x={panel.x} y={panel.y} width={logoWidth / 5 + 0.01} height={logoHeight / 5 + 0.01} />
          </clipPath>)}
        </defs>
        <ellipse className={styles.shadow} cx="105.75" cy="72" rx="90" ry="3" fill="currentColor" />
        {panels.map(panel => <g key={panel.index} className={styles.panel} data-logo-panel={panel.index} clipPath={`url(#${id}-panel-${panel.index})`}>
          <use href={`#${id}-artwork`} />
        </g>)}
      </svg>
    </div>
    <div className={styles.copy}><p>당신의 공간을 만들고 있어요</p><div className={styles.track} aria-hidden="true"><span /></div><span className={styles.caption}>잠시 후, 나만의 가구를 만나보세요</span></div>
  </div>;
}
