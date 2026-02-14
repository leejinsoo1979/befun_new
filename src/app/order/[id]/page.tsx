'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ShopLayout } from '@/components/common/ShopLayout';
import { formatPrice } from '@/lib/pricing';

interface OrderDetail {
  id: string;
  status: string;
  totalAmount: number;
  shippingFee: number;
  shipName: string;
  shipPhone: string;
  shipAddress: string;
  shipDetail?: string;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    design: {
      shareCode: string;
      thumbnailUrl?: string;
      config: Record<string, unknown>;
    };
  }>;
  payment?: {
    status: string;
    method?: string;
    paidAt?: string;
  };
  shipping?: {
    status: string;
    carrier?: string;
    trackingNo?: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '주문 대기',
  PAID: '결제 완료',
  PRODUCING: '제작 중',
  SHIPPING: '배송 중',
  DELIVERED: '배송 완료',
  CANCELLED: '취소됨',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error('주문을 찾을 수 없습니다');
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류 발생');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <ShopLayout>
        <div className="py-20 text-center text-gray-500">로딩 중...</div>
      </ShopLayout>
    );
  }

  if (error || !order) {
    return (
      <ShopLayout>
        <div className="py-20 text-center">
          <p className="mb-4 text-gray-500">{error || '주문을 찾을 수 없습니다'}</p>
          <Link href="/mypage" className="text-sm text-gray-600 underline">
            마이페이지로 돌아가기
          </Link>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold">주문 상세</h1>
        <p className="mb-8 text-sm text-gray-400">주문번호: {order.id}</p>

        {/* 주문 상태 */}
        <div className="mb-8 rounded-lg bg-gray-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">주문 상태</span>
            <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            주문일: {new Date(order.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>

        {/* 상품 목록 */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">주문 상품</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
              >
                <div className="h-16 w-16 shrink-0 rounded bg-gray-100">
                  {item.design.thumbnailUrl ? (
                    <img
                      src={item.design.thumbnailUrl}
                      alt="가구"
                      className="h-full w-full rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      3D
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">맞춤 수납장</p>
                  <p className="text-xs text-gray-400">수량: {item.quantity}개</p>
                </div>
                <p className="text-sm font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 배송지 */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">배송지</h2>
          <div className="rounded-lg border border-gray-200 p-4 text-sm">
            <p className="font-medium">{order.shipName}</p>
            <p className="text-gray-500">{order.shipPhone}</p>
            <p className="mt-1 text-gray-500">
              {order.shipAddress}
              {order.shipDetail && ` ${order.shipDetail}`}
            </p>
          </div>
        </section>

        {/* 배송 추적 */}
        {order.shipping && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">배송 정보</h2>
            <div className="rounded-lg border border-gray-200 p-4 text-sm">
              <p>
                <span className="text-gray-500">택배사:</span>{' '}
                {order.shipping.carrier ?? '-'}
              </p>
              <p>
                <span className="text-gray-500">운송장:</span>{' '}
                {order.shipping.trackingNo ?? '-'}
              </p>
            </div>
          </section>
        )}

        {/* 결제 금액 */}
        <section className="rounded-lg border border-gray-200 p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">상품 금액</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">배송비</span>
              <span>
                {order.shippingFee === 0 ? '무료' : formatPrice(order.shippingFee)}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-2">
              <div className="flex justify-between font-bold">
                <span>총 결제 금액</span>
                <span>{formatPrice(order.totalAmount + order.shippingFee)}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link href="/mypage" className="text-sm text-gray-500 underline">
            마이페이지로 돌아가기
          </Link>
        </div>
      </div>
    </ShopLayout>
  );
}
