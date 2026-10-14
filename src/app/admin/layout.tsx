import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { Sidebar } from './_components/Sidebar';
import { Topbar } from './_components/Topbar';
import styles from './admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Befun 관리자', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin');
  const admin = await getAdmin();
  if (!admin) {
    return (
      <div className={styles.denied}>
        <div><h1>관리자 권한이 없습니다</h1><p>관리자로 지정된 계정으로 로그인해 주세요.</p><Link href="/" className={`${styles.btn} ${styles.primary}`}>쇼핑몰로 돌아가기</Link></div>
      </div>
    );
  }
  // 사이드바 배지: 바로 처리해야 하는 주문(결제 완료 → 제작 시작 전)
  const actionCount = await prisma.order.count({ where: { status: 'PAID' } });
  return (
    <div className={styles.shell}>
      <Sidebar actionCount={actionCount} />
      <div className={styles.content}>
        <Topbar name={admin.name ?? admin.email ?? '관리자'} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
