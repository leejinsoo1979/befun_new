'use client';

import { useLocale } from '@/lib/commerce/useLocale';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShopLayout } from '@/components/common/ShopLayout';

function Fail() {
  const { t } = useLocale();
  const params = useSearchParams();
  const code = params.get('code');
  const orderId = params.get('orderId');
  const message = code === 'PAY_PROCESS_CANCELED' ? '결제를 취소했어요.' : params.get('message') ?? '결제에 실패했어요.';
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="mb-3 text-2xl font-bold">{t("결제되지 않았어요")}</h1>
      <p className="mb-8 text-sm text-gray-500">{t(message)}</p>
      {orderId ? (
        <Link href={`/order/${orderId}/pay`} className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white">{t("다시 결제하기")}</Link>
      ) : (
        <Link href="/cart" className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white">{t("장바구니로")}</Link>
      )}
    </div>
  );
}

export default function OrderFailPage() {
  const { t } = useLocale();
  return (
    <ShopLayout>
      <Suspense fallback={<div className="py-20 text-center text-gray-500">{t("로딩 중...")}</div>}>
        <Fail />
      </Suspense>
    </ShopLayout>
  );
}
