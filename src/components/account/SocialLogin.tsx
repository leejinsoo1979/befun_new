'use client';

import { signIn } from 'next-auth/react';
import styles from './account.module.css';

const NaverIcon = () => (
  <svg viewBox="-6 -6 36 36" aria-hidden><path fill="#fff" d="M16.27 12.85 7.38 0H0v24h7.73V11.16L16.62 24H24V0h-7.73z" /></svg>
);
const KakaoIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden><path fill="#000" d="M12 3C6.48 3 2 6.52 2 10.86c0 2.8 1.86 5.26 4.66 6.65l-.95 3.48c-.08.3.26.54.52.37l4.14-2.75c.53.07 1.07.11 1.63.11 5.52 0 10-3.52 10-7.86S17.52 3 12 3z" /></svg>
);
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/** 네이버·카카오·구글 로그인 버튼(처음이면 자동 가입) */
export function SocialLogin({ callbackUrl, verb = '로그인' }: { callbackUrl: string; verb?: string }) {
  return (
    <div className={styles.social}>
      <button type="button" className={styles.naver} onClick={() => signIn('naver', { callbackUrl })}><NaverIcon />네이버로 {verb}</button>
      <button type="button" className={styles.kakao} onClick={() => signIn('kakao', { callbackUrl })}><KakaoIcon />카카오로 {verb}</button>
      <button type="button" className={styles.google} onClick={() => signIn('google', { callbackUrl })}><GoogleIcon />Google로 {verb}</button>
    </div>
  );
}

/** 외부에서 받은 callbackUrl은 같은 사이트 경로만 허용 */
export function safeCallback(value: string | null, fallback = '/mypage') {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}
