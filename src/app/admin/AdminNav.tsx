'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS: [string, string][] = [['/admin', '대시보드'], ['/admin/orders', '주문'], ['/admin/users', '회원'], ['/admin/designs', '저장된 디자인']];

export function AdminNav() {
  const path = usePathname();
  return <>{LINKS.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>{label}</Link>)}</>;
}
