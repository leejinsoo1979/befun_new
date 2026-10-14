'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { legReferenceFrame, legVideoSource, type LegAction } from '@/lib/assembly-guide/legs';
import styles from './guide.module.css';

export function ReferenceLegGuide({ action, step, progress, detail, onPauseGuide }: { action: LegAction; step: number; progress: number; detail: boolean; onPauseGuide: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const openVideo = () => { onPauseGuide(); setVideoOpen(true); dialog.current?.showModal(); };
  const frame = legReferenceFrame(action, step, progress);
  return <figure className={`${styles.reference} ${styles.legReference}`}>
    <figcaption>Tylko 공식 영상 원본 장면 · {action === 'assemble' && step === 2 ? '상세 슬라이드는 분리 역순 추정' : '실제 장면 확인'}</figcaption>
    <div className={styles.referenceViewport}>
      <Image src={`/assembly-guide/legs/${frame}.jpg`} alt={frame === 'removed' ? '다리가 분리된 뒤 판재에 남은 나사 3개와 중앙 은색 핀' : frame === 'press' ? '드라이버로 장착판 중앙 은색 잠금핀을 누르는 실제 장면' : frame === 'entry' ? '슬라이드 뒤 키홀 큰 입구와 나사머리 3개가 맞은 실제 장면' : '공식 영상의 장착판과 몸통을 함께 잡고 조립 또는 분리하는 실제 장면'} width={1205} height={600} priority unoptimized style={{ width: '100%', height: '100%', objectFit: 'contain', transform: detail ? 'scale(1.85)' : undefined, transformOrigin: '51% 48%' }} />
    </div>
    <button type="button" className={styles.sourceLink} onClick={openVideo}>공식 영상 재생 ↗</button>
    <dialog ref={dialog} className={styles.videoDialog} aria-label="Tylko 공식 다리 조립·분리 영상" onClose={() => setVideoOpen(false)} onCancel={() => setVideoOpen(false)}>
      <div className={styles.videoHeading}><span>Tylko · Leg Assembly and Disassembly</span><button type="button" onClick={() => dialog.current?.close()} aria-label="공식 영상 닫기">닫기</button></div>
      {videoOpen && <iframe title="Tylko 공식 다리 조립·분리 영상" src={`https://www.youtube.com/embed/y_6rMHwOIzo?start=${action === 'disassemble' ? 6 : 0}&autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
      <a className={styles.sourceLink} href={`${legVideoSource}&t=${action === 'disassemble' ? 6 : 0}s`} target="_blank" rel="noreferrer">YouTube에서 원본 열기 ↗</a>
    </dialog>
  </figure>;
}
