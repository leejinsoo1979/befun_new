'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type MouseEvent } from 'react';
import { useSession } from 'next-auth/react';
import { FiArrowRight, FiChevronDown, FiHeart, FiMenu, FiSearch, FiShoppingCart, FiUser, FiX } from 'react-icons/fi';
import { useCartStore } from '@/stores/useCartStore';
import { useSavedProducts } from './useSavedProducts';
import { BrandLogo } from './StorefrontUI';
import { footerGroups, menuGroups } from './navigation';
import styles from './storefront.module.css';

const subscribeMobileFooter = (update: () => void) => {
  const media = window.matchMedia('(max-width: 700px)');
  media.addEventListener('change', update);
  return () => media.removeEventListener('change', update);
};
const isMobileFooter = () => window.matchMedia('(max-width: 700px)').matches;

// 상단 알림바 닫힘 상태 — 이 브라우저에 보관(localStorage). 다른 탭/프레임과 동기화.
const ANNOUNCEMENT_KEY = 'befun-announcement-dismissed';
const announcementListeners = new Set<() => void>();
const subscribeAnnouncement = (update: () => void) => {
  announcementListeners.add(update);
  window.addEventListener('storage', update);
  return () => { announcementListeners.delete(update); window.removeEventListener('storage', update); };
};
const isAnnouncementDismissed = () => { try { return localStorage.getItem(ANNOUNCEMENT_KEY) === '1'; } catch { return false; } };
const dismissAnnouncement = () => {
  try { localStorage.setItem(ANNOUNCEMENT_KEY, '1'); } catch { /* 저장 불가 환경에서는 이번 화면에서만 닫힘 */ }
  announcementListeners.forEach(update => update());
};
function FooterGroup({ group }: { group: typeof footerGroups[number] }) {
  const mobile = useSyncExternalStore(subscribeMobileFooter, isMobileFooter, () => false);
  const [expanded, setExpanded] = useState(false);
  return <details className={styles.footerGroup} open={!mobile || expanded}>
    <summary onClick={event => { event.preventDefault(); if (mobile) setExpanded(!expanded); }}>{group.title}<FiChevronDown /></summary>
    <nav aria-label={group.title}>{group.links.map(([title, href]) => <Link key={href} href={href} target={href.startsWith('https:') ? '_blank' : undefined} rel={href.startsWith('https:') ? 'noreferrer' : undefined}>{title}</Link>)}</nav>
  </details>;
}

export function StorefrontFrame({ children, overlay = false }: { children: ReactNode; overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const announcementDismissed = useSyncExternalStore(subscribeAnnouncement, isAnnouncementDismissed, () => false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const lastScroll = useRef(0);
  const { data: session } = useSession();
  const { saved } = useSavedProducts();
  const count = useCartStore(state => state.items.reduce((total, item) => total + item.quantity, 0));
  useEffect(() => {
    const scroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastScroll.current) < 8) return;
      setHidden(y > 200 && y > lastScroll.current);
      lastScroll.current = y;
    };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('scroll', scroll); window.removeEventListener('keydown', key); };
  }, []);
  useEffect(() => { if (open) menuRef.current?.querySelector<HTMLAnchorElement>('a')?.focus(); }, [open]);
  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    if (window.location.pathname === '/') {
      event.preventDefault();
      window.scrollTo({top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    }
  };
  return <div className={`${styles.storefront} ${overlay ? '' : styles.innerStorefront} ${announcementDismissed ? styles.noAnnouncement : ''}`}>
    <a href="#main" className={styles.skipLink}>본문으로 바로가기</a>
    {announcementDismissed ? null : <div className={styles.announcement} role="region" aria-label="프로모션 알림"><Link href="/furniture-c">공간에 딱 맞는 수납. <strong>나만의 디자인, 20% 할인.</strong><span> 지금 만나보세요 <FiArrowRight /></span></Link><button type="button" className={styles.announcementClose} aria-label="알림 닫기" onClick={dismissAnnouncement}><FiX /></button></div>}
    <header className={`${styles.header} ${hidden && !open ? styles.headerHidden : ''}`}>
      <Link href="/" aria-label="Befun 홈" className={styles.logo} onClick={goHome}><BrandLogo /></Link>
      <div className={styles.navPill}>
        <nav aria-label="주 메뉴" className={styles.desktopNav}><button ref={triggerRef} aria-expanded={open} aria-controls="storefront-menu" onClick={() => setOpen(!open)}>쇼핑 <FiChevronDown /></button><Link href="/inspirations">커뮤니티</Link><Link href="/tylko-pro">Befun Pro</Link><Link href="/showrooms">쇼룸</Link></nav>
        <button className={`${styles.iconButton} ${styles.mobileMenu}`} aria-label={open ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={open} aria-controls="storefront-menu" onClick={() => setOpen(!open)}>{open ? <FiX /> : <FiMenu />}</button>
        <div className={styles.navIcons}><Link className={styles.iconButton} href="/search" aria-label="제품 검색"><FiSearch /></Link><Link className={styles.iconButton} href={session?.user ? '/mypage' : '/login'} aria-label={session?.user ? '마이페이지' : '로그인'}><FiUser /></Link><Link className={styles.iconButton} href="/wishlist" aria-label="즐겨찾기 보기"><FiHeart />{saved.length ? <span className={styles.badge}>{saved.length}</span> : null}</Link><Link className={styles.iconButton} href="/cart" aria-label={`장바구니 ${count}개`}><FiShoppingCart />{count ? <span className={styles.badge}>{count}</span> : null}</Link></div>
      </div>
      {open ? <div ref={menuRef} id="storefront-menu" className={`${styles.megaMenu} ${styles.fullMenu}`}><div className={styles.mobilePrimary}>{[['커뮤니티', '/inspirations'], ['Befun Pro', '/tylko-pro'], ['쇼룸', '/showrooms'], ['로그인', '/login']].map(([title, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{title}</Link>)}</div>{menuGroups.map(group => <nav key={group.title} aria-label={group.title}><h3>{group.title}</h3>{group.links.map(([title, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{title}</Link>)}</nav>)}</div> : null}
    </header>
    {open ? <button className={styles.menuBackdrop} aria-label="메뉴 닫기" onClick={() => setOpen(false)} /> : null}
    <main id="main">{children}</main>
    <footer className={styles.footer}><h2>가구에 공간을 맞추는 대신,<br />당신에게 맞는 가구를 만드세요.</h2><div className={styles.footerColumns}>{footerGroups.map(group => <FooterGroup key={group.title} group={group} />)}</div><div className={styles.footerBottom}><Link href="/" className={styles.footerLogo} aria-label="Befun 홈" onClick={goHome}><BrandLogo /></Link><Link href="/region-settings">대한민국 · 한국어 · KRW</Link><span>© {new Date().getFullYear()} Befun</span><span>Visa · Mastercard · 간편결제</span></div></footer>
    <Link className={styles.helpButton} href="/contact"><span>?</span> 도움이 필요하세요?</Link>
  </div>;
}
