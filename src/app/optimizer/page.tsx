import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OptimizerClient } from '@/components/optimizer/OptimizerClient';
import { checkOptimizerAccess } from '@/lib/optimizer/access';

// 접근 권한(세션·환경변수)을 요청마다 확인한다
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CNC 옵티마이저 - Befun',
  robots: { index: false, follow: false },
};

export default async function OptimizerPage() {
  const access = await checkOptimizerAccess();

  if (access === 'login-required') {
    redirect('/login?callbackUrl=/optimizer');
  }

  if (access === 'forbidden') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold text-gray-800">접근 권한이 없습니다</p>
        <p className="text-sm text-gray-500">CNC 옵티마이저는 관리자 계정만 사용할 수 있습니다.</p>
        <Link href="/configurator" className="rounded-full bg-gray-800 px-6 py-2 text-sm text-white hover:bg-gray-700">
          컨피규레이터로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <Suspense>
      <OptimizerClient />
    </Suspense>
  );
}
