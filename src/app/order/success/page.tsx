'use client';

import { useLocale } from '@/lib/commerce/useLocale';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShopLayout } from '@/components/common/ShopLayout';
import { useCartStore } from '@/stores/useCartStore';

/** 토스 결제 성공 리다이렉트 → 서버 승인(/api/payment/confirm) */
function Confirm() {
  const { t } = useLocale();
  const params = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const orderId = params.get('orderId') ?? '';
  const paymentKey = params.get('paymentKey');
  const amount = Number(params.get('amount'));
  const valid = Boolean(paymentKey && orderId && amount);
  const [state, setState] = useState<'loading' | 'done' | 'error'>(valid ? 'loading' : 'error');
  const [message, setMessage] = useState(valid ? '' : '결제 정보가 올바르지 않습니다.');
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !valid) return;
    sent.current = true;
    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? '결제 승인에 실패했습니다.');
        clearCart();
        setState('done');
      })
      .catch((e: Error) => { setState('error'); setMessage(e.message); });
  }, [valid, paymentKey, orderId, amount, clearCart]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      {state === 'loading' && <p className="text-gray-500">{t("결제를 확인하고 있어요…")}</p>}
      {state === 'done' && (
        <>
          <h1 className="mb-3 text-2xl font-bold">{t("결제가 완료됐어요")}</h1>
          <p className="mb-8 text-sm text-gray-500">{t("주문하신 가구는 공장에서 바로 제작을 준비합니다.")}</p>
          <Link href={`/order/${orderId}`} className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white">{t("주문 상세 보기")}</Link>
        </>
      )}
      {state === 'error' && (
        <>
          <h1 className="mb-3 text-2xl font-bold">{t("결제를 완료하지 못했어요")}</h1>
          <p className="mb-8 text-sm text-red-500">{t(message)}</p>
          {orderId && <Link href={`/order/${orderId}/pay`} className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white">{t("다시 결제하기")}</Link>}
        </>
      )}
    </div>
  );
}

export default function OrderSuccessPage() {
  const { t } = useLocale();
  return (
    <ShopLayout>
      <Suspense fallback={<div className="py-20 text-center text-gray-500">{t("로딩 중...")}</div>}>
        <Confirm />
      </Suspense>
    </ShopLayout>
  );
}
