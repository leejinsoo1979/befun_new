import styles from './configurator-loading.module.css';

/** Lightweight DOM/SVG fallback: available before the WebGL bundle loads. */
export function ConfiguratorLoading({ ready = false }: { ready?: boolean }) {
  return <div className={`${styles.loader} ${ready ? styles.ready : ''}`} role={ready ? undefined : 'status'} aria-live="polite" aria-hidden={ready || undefined}>
    <div className={styles.composition} aria-hidden="true">
      <div className={styles.halo} />
      <svg className={styles.shelf} viewBox="0 0 240 240" fill="none">
        <defs>
          <linearGradient id="befun-loader-top" x1="45" y1="0" x2="195" y2="100" gradientUnits="userSpaceOnUse"><stop stopColor="#a4cc81"/><stop offset="1" stopColor="#659b45"/></linearGradient>
        </defs>
        <ellipse className={styles.shadow} cx="120" cy="205" rx="78" ry="12" fill="#334a24" opacity=".12"/>
        <g className={styles.blueprint} stroke="#769366" strokeWidth=".7" strokeDasharray="3 5"><path d="M35 194 120 225 206 181M35 194V70M206 181V55"/></g>
        {[0,1,2].map(level => <g key={level} className={styles.tier} style={{ '--tier': level } as React.CSSProperties}>
          <g transform={`translate(0 ${-level * 48})`}>
            <path d="m48 169 97-26 49 24-98 29Z" fill="url(#befun-loader-top)"/>
            <path d="m48 169 48 27v7l-48-27Z" fill="#548c36"/>
            <path d="m96 196 98-29v7l-98 29Z" fill="#346327"/>
            {level < 2 && <g className={styles.uprights}>
              <path d="m52 166 5-2v-40l-5 1Z" fill="#365f2a"/><path d="m57 164 39 21v-40l-39-21Z" fill="#73a951"/>
              <path d="m143 142 5-2v-40l-5 1Z" fill="#365f2a"/><path d="m148 140 40 20v-40l-40-20Z" fill="#80b45e"/>
              <path d="m101 153 5-2v-40l-5 1Z" fill="#365f2a"/><path d="m106 151 38 20v-40l-38-20Z" fill="#6a9f48"/>
            </g>}
          </g>
        </g>)}
      </svg>
      <div className={styles.sweep} />
    </div>
    <div className={styles.copy}><span className={styles.eyebrow}>MADE FOR YOUR SPACE</span><p>당신의 공간을 만들고 있어요</p><div className={styles.track} aria-hidden="true"><span /></div><span className={styles.caption}>잠시 후, 나만의 가구를 만나보세요</span></div>
  </div>;
}
