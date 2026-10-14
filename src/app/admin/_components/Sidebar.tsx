'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiBarChart2, FiBox, FiExternalLink, FiGrid, FiLayers, FiSettings, FiTool, FiUsers } from 'react-icons/fi';
import styles from '../admin.module.css';

const GROUPS = [
  { title: '운영', links: [
    { href: '/admin', label: '대시보드', icon: FiBarChart2, exact: true },
    { href: '/admin/orders', label: '주문 관리', icon: FiBox, badge: 'orders' as const },
  ] },
  { title: '고객·디자인', links: [
    { href: '/admin/users', label: '회원 관리', icon: FiUsers },
    { href: '/admin/designs', label: '저장된 디자인', icon: FiLayers },
  ] },
  { title: '도구', links: [
    { href: '/optimizer', label: 'CNC 옵티마이저', icon: FiTool },
    { href: '/admin/settings', label: '설정', icon: FiSettings },
  ] },
];

export function Sidebar({ actionCount }: { actionCount: number }) {
  const path = usePathname();
  return (
    <nav className={styles.side} aria-label="관리자 메뉴">
      <Link href="/admin" className={styles.brand}><span className={styles.brandMark}>B</span><span><b>Befun Admin</b><small>쇼핑몰 운영</small></span></Link>
      {GROUPS.map((g) => (
        <div key={g.title}>
          <div className={styles.navGroup}>{g.title}</div>
          {g.links.map(({ href, label, icon: Icon, ...rest }) => {
            const active = 'exact' in rest && rest.exact ? path === href : path.startsWith(href);
            return (
              <Link key={href} href={href} className={styles.navLink} aria-current={active ? 'page' : undefined}>
                <Icon />{label}
                {'badge' in rest && actionCount > 0 && <span className={styles.navCount} title="처리할 주문">{actionCount}</span>}
              </Link>
            );
          })}
        </div>
      ))}
      <div className={styles.sideFoot}>
        <Link href="/" className={styles.navLink} target="_blank"><FiExternalLink />쇼핑몰 보기</Link>
        <Link href="/configurator" className={styles.navLink} target="_blank"><FiGrid />컨피규레이터</Link>
      </div>
    </nav>
  );
}
