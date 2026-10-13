'use client';

import { useDisplayStore } from './displayStore';
import styles from './display.module.css';

export function AssemblyTransport() {
  const { cinematic, setCinematic, phase, exploded, progress, stageLabel, paused, speed, togglePause, setSpeed, replay, resetAssembly, toggleExploded } = useDisplayStore();
  if (!exploded && progress !== 1) return null;
  const moving = phase === 'assembling' || phase === 'disassembling';
  const heading = phase === 'assembling' ? '단별 조립' : phase === 'disassembling' ? '부품 펼치기' : phase === 'laidOut' ? '조립 준비 완료' : '조립 완료';
  return <>
  <div className={`${styles.cinemaFrame} ${cinematic && moving ? styles.cinemaActive : ''}`} aria-hidden="true"><span/><span/></div>
  <section className={styles.transport} aria-label="조립 시뮬레이션">
    <div className={styles.transportHeading}><span className={styles.liveDot} /><strong>{heading}</strong><span>{Math.round(progress * 100)}%</span></div>
    <p role="status">{paused ? '일시정지' : stageLabel || '가로판 → 세로판 → 다음 가로판 순서로 조립합니다.'}</p>
    <div className={styles.progressTrack} role="progressbar" aria-label="시뮬레이션 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><div style={{ transform: `scaleX(${progress})` }} /></div>
    <div className={styles.transportActions}>
      <button aria-label="시네마틱 카메라" aria-pressed={cinematic} onClick={()=>setCinematic(!cinematic)}>{cinematic?'◉ 시네마틱':'◎ 고정 시점'}</button>
      {moving && <button onClick={togglePause} aria-label={paused ? '조립 영상 재생' : '조립 영상 일시정지'}>{paused ? '▶ 재생' : 'Ⅱ 일시정지'}</button>}
      {phase === 'laidOut' && <button onClick={toggleExploded}>▶ 조립 시작</button>}
      {phase === 'assembled' && <button onClick={replay}>↻ 다시 보기</button>}
      <label>속도 <select aria-label="재생 속도" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select></label>
      <button className={styles.finish} onClick={resetAssembly}>{moving ? '건너뛰기' : '닫기'}</button>
    </div>
  </section></>;
}
