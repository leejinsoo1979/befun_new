'use client';

import { signOut } from 'next-auth/react';
import { FiLogOut, FiSearch } from 'react-icons/fi';
import styles from '../admin.module.css';

export function Topbar({ name }: { name: string }) {
  return (
    <header className={styles.topbar}>
      <form action="/admin/search" className={styles.search} role="search">
        <FiSearch aria-hidden />
        <input type="search" name="q" placeholder="주문번호 · 이름 · 이메일 · 연락처 · 공유코드 검색" aria-label="관리자 통합 검색" />
      </form>
      <div className={styles.who}>
        <span className={styles.avatar} aria-hidden>{name.slice(0, 1).toUpperCase()}</span>
        <span>{name}</span>
        <button type="button" className={styles.btn} onClick={() => signOut({ callbackUrl: '/' })}><FiLogOut />로그아웃</button>
      </div>
    </header>
  );
}
