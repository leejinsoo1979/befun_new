import Image from 'next/image';
import type { ReactNode } from 'react';
import styles from './account.module.css';

/** 로그인·회원가입 공통 레이아웃: 좌측 라이프스타일 이미지, 우측 카드 */
export function AuthShell({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.visual} aria-hidden>
        <Image src="/imgs/storefront/creator-10.avif" alt="" fill priority sizes="(max-width: 900px) 0px, 52vw" />
        <div className={styles.visualCopy}>
          <strong>공간에 꼭 맞는 가구,<br />지금 시작해 보세요.</strong>
          <span>디자인 저장 · 공유 · 주문 내역을 한곳에서</span>
        </div>
      </div>
      <div className={styles.panel}>
        <div className={styles.card}>
          <h1>{title}</h1>
          <p className={styles.lead}>{lead}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
