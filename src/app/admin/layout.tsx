import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdmin } from '@/lib/admin';
import { AdminNav } from './AdminNav';
import styles from './admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: '관리자 | Befun', robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin');
  const admin = await getAdmin();
  if (!admin) {
    return <div className={styles.denied}><h1>관리자 권한이 없습니다</h1><p>관리자 계정으로 로그인해 주세요. <Link href="/">홈으로</Link></p></div>;
  }
  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <div className={styles.brand}>Befun 관리자<small>{admin.email ?? admin.name}</small></div>
        <AdminNav />
        <Link href="/" className={styles.back}>← 쇼핑몰로</Link>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
