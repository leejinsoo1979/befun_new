'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShopLayout } from '@/components/common/ShopLayout';
import { useCartStore } from '@/stores/useCartStore';
import { useMoney } from '@/lib/commerce/useMoney';
import { PriceNotice } from '@/components/commerce/PriceNotice';

interface ShippingForm {
  name: string;
  phone: string;
  zipCode: string;
  address: string;
  detail: string;
}

export default function OrderPage() {
  const { formatPrice, t, market } = useMoney();
  const router = useRouter();
  const { items, getTotalPrice } = useCartStore();
  const total = getTotalPrice();
  const shippingFee = total >= 100000 ? 0 : 5000;

  const [form, setForm] = useState<ShippingForm>({
    name: '',
    phone: '',
    zipCode: '',
    address: '',
    detail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (market !== 'KR') { setError(t('해외 주문은 견적 문의를 이용해 주세요.')); return; }
    if (!form.name || !form.phone || !form.address) {
      setError('배송지 정보를 모두 입력해주세요');
      return;
    }
    if (items.length === 0) {
      setError('장바구니가 비어있습니다');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. 주문 생성
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            designConfig: item.designConfig,
            quantity: item.quantity,
          })),
          market, currency:'KRW',
          shipping: form,
        }),
      });

      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent('/order')}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? '주문 생성 실패');
      }

      const { orderId } = await res.json();

      // 2. 토스 결제위젯 화면으로. 장바구니는 결제 승인 후(/order/success) 비운다
      router.push(`/order/${orderId}/pay`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '주문 처리 중 오류');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (market !== 'KR') return <ShopLayout><div className="mx-auto max-w-3xl p-10"><h1>{t('견적 문의')}</h1><PriceNotice /><Link href="/contact?topic=shipping">{t('문의하기')}</Link></div></ShopLayout>;

  if (items.length === 0) {
    return (
      <ShopLayout>
        <div className="py-20 text-center">
          <p className="mb-4 text-gray-500">{t("장바구니가 비어 있습니다")}</p>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-8 text-2xl font-bold">{t("주문하기")}</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 배송지 입력 */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">{t("배송지 정보")}</h2>
            <div className="space-y-3">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t("받는 사람")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={t("연락처 (예: 010-1234-5678)")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  name="zipCode"
                  value={form.zipCode}
                  onChange={handleChange}
                  placeholder={t("우편번호")}
                  className="w-32 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                />
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                   {t("주소 검색")} </button>
              </div>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder={t("기본 주소")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
              <input
                name="detail"
                value={form.detail}
                onChange={handleChange}
                placeholder={t("상세 주소 (선택)")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
          </section>

          {/* 주문 상품 */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">{t("주문 상품")}</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{t("맞춤 수납장")}</p>
                    <p className="text-xs text-gray-400">{t("수량:")} {item.quantity}{t("개")}</p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 결제 금액 */}
          <section className="rounded-lg border border-gray-200 p-5">
            <h2 className="mb-4 text-lg font-semibold">{t("결제 금액")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("상품 금액")}</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("배송비")}</span>
                <span>
                  {shippingFee === 0 ? '무료' : formatPrice(shippingFee)}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <div className="flex justify-between font-bold">
                  <span>{t("총 결제 금액")}</span>
                  <span className="text-lg">{formatPrice(total + shippingFee)}</span>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <p className="text-center text-sm text-red-500">{t(error)}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gray-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400"
          >
            {t(isSubmitting ? '주문 처리 중...' : `${formatPrice(total + shippingFee)} 결제하기`)}
          </button>
        </form>
      </div>
    </ShopLayout>
  );
}
