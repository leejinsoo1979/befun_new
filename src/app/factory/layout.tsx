import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFactoryStaff } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Befun 공장 작업', robots: { index: false, follow: false } };

export default async function FactoryLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?callbackUrl=/factory');
  const staff = await getFactoryStaff();
  if (!staff) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div><h1 className="mb-2 text-xl font-bold">공장 작업 권한이 없습니다</h1><p className="mb-6 text-sm text-gray-500">관리자에게 공장 담당자 지정을 요청해 주세요.</p><Link href="/" className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white">쇼핑몰로</Link></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 print:bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 print:hidden">
        <Link href="/factory" className="font-bold">Befun 공장 작업</Link>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {staff.role === 'ADMIN' && <Link href="/admin/orders">관리자</Link>}
          <span>{staff.name ?? staff.email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
