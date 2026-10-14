'use client';

import Image from 'next/image';
import { clipReferences, userClipPhoto } from '@/lib/assembly-guide/clipReferences';
import type { ClipColourVersion } from '@/lib/assembly-guide/tylkoClip';
import styles from './guide.module.css';

export function ReferenceClipGuide({ step, detail, colourVersion }: { step: number; detail: boolean; colourVersion: ClipColourVersion }) {
  const official = clipReferences[step];
  const legacyPhoto = step === 0 && colourVersion === 'black-orange';
  const reference = legacyPhoto ? userClipPhoto : official;
  return <figure className={styles.reference}>
    <figcaption>{legacyPhoto ? '사용자 지정 원본 실물 사진' : `공식 PDF ${official.page}쪽 원본 도해`} · {detail ? '원본 영역 확대' : '전체 도해'}</figcaption>
    <div className={styles.referenceViewport}>
      <Image src={reference.src} alt={reference.alt} width={reference.width} height={reference.height} priority unoptimized style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: detail ? 'scale(2.3)' : undefined, transformOrigin: reference.focus }} />
    </div>
  </figure>;
}
