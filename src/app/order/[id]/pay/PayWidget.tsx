'use client';

import { useLocale } from '@/lib/commerce/useLocale';

import { useEffect, useRef, useState } from 'react';
import { loadTossPayments, type TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';

interface Props {
  clientKey: string; customerKey: string; orderId: string; orderName: string; amount: number;
  customerEmail?: string; customerName?: string;
}

export function PayWidget({ clientKey, customerKey, orderId, orderName, amount, customerEmail, customerName }: Props) {
  const { t } = useLocale();
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(clientKey ? '' : '결제 설정(NEXT_PUBLIC_TOSS_CLIENT_KEY)이 없습니다.');

  // 결제위젯은 페이지당 한 번만 렌더 가능 — StrictMode 이중 실행에도 같은 초기화 Promise를 재사용
  const initRef = useRef<Promise<TossPaymentsWidgets> | null>(null);

  useEffect(() => {
    if (!clientKey) return;
    let cancelled = false;
    initRef.current ??= (async () => {
      const toss = await loadTossPayments(clientKey);
      const widgets = toss.widgets({ customerKey });
      await widgets.setAmount({ currency: 'KRW', value: amount });
      await Promise.all([
        widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' }),
        widgets.renderAgreement({ selector: '#agreement', variantKey: 'AGREEMENT' }),
      ]);
      return widgets;
    })();
    initRef.current
      .then((widgets) => { if (!cancelled) { widgetsRef.current = widgets; setReady(true); } })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : '결제창을 불러오지 못했습니다.'); });
    return () => { cancelled = true; };
  }, [clientKey, customerKey, amount]);

  const pay = async () => {
    if (!widgetsRef.current) return;
    setPaying(true);
    setError('');
    try {
      const origin = window.location.origin;
      await widgetsRef.current.requestPayment({
        orderId, orderName, customerEmail, customerName,
        successUrl: `${origin}/order/success`,
        failUrl: `${origin}/order/fail`,
      });
    } catch (e) {
      console.error('[pay] requestPayment', e);
      const code = (e as { code?: string })?.code;
      setError(code === 'USER_CANCEL' ? '결제를 취소했어요.' : (e instanceof Error && e.message) || '결제 요청에 실패했습니다.');
      setPaying(false);
    }
  };

  return (
    <div>
      <div id="payment-method" />
      <div id="agreement" />
      {error && <p className="my-3 text-center text-sm text-red-500" role="alert">{t(error)}</p>}
      <button
        type="button"
        onClick={pay}
        disabled={!ready || paying}
        className="mt-4 w-full rounded-lg bg-gray-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400"
      >
        {t(paying ? '결제 진행 중…' : ready ? `${new Intl.NumberFormat('ko-KR').format(amount)}원 결제하기` : '결제창 불러오는 중…')}
      </button>
    </div>
  );
}
