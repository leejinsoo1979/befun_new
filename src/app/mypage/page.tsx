'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShopLayout } from '@/components/common/ShopLayout';
import { formatPrice } from '@/lib/pricing';

interface OrderSummary {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    quantity: number;
    design: {
      thumbnailUrl?: string;
    };
  }>;
  payment?: {
    status: string;
  };
}

interface DesignSummary {
  id: string;
  shareCode: string;
  config: Record<string, unknown>;
  thumbnailUrl?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '주문 대기',
  PAID: '결제 완료',
  PRODUCING: '제작 중',
  SHIPPING: '배송 중',
  DELIVERED: '배송 완료',
  CANCELLED: '취소됨',
};

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<'orders' | 'designs'>('orders');
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [designs, setDesigns] = useState<DesignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/mypage');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    async function fetchData() {
      setLoading(true);
      try {
        const [ordersRes, designsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/designs'),
        ]);
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (designsRes.ok) setDesigns(await designsRes.json());
      } catch {
        // 조용히 실패
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [status]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <ShopLayout>
        <div className="py-20 text-center text-gray-500">로딩 중...</div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* 사용자 정보 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">마이페이지</h1>
          <p className="mt-1 text-sm text-gray-500">{session?.user?.email}</p>
        </div>

        {/* 탭 */}
        <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setTab('orders')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === 'orders'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            주문 내역
          </button>
          <button
            onClick={() => setTab('designs')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === 'designs'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            저장된 디자인
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">로딩 중...</div>
        ) : tab === 'orders' ? (
          /* 주문 내역 */
          orders.length === 0 ? (
            <div className="py-10 text-center text-gray-500">주문 내역이 없습니다</div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/order/${order.id}`}
                  className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        맞춤 수납장{' '}
                        {order.items.length > 1 && `외 ${order.items.length - 1}건`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium">
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                      <p className="mt-1 text-sm font-semibold">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          /* 저장된 디자인 */
          designs.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              <p className="mb-3">저장된 디자인이 없습니다</p>
              <Link
                href="/configurator"
                className="text-sm text-gray-600 underline"
              >
                디자인 시작하기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {designs.map((design) => (
                <Link
                  key={design.id}
                  href={`/share/${design.shareCode}`}
                  className="group overflow-hidden rounded-lg border border-gray-200"
                >
                  <div className="aspect-video bg-gray-100">
                    {design.thumbnailUrl ? (
                      <img
                        src={design.thumbnailUrl}
                        alt="디자인"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                        3D
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-400">
                      {new Date(design.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                    <p className="mt-1 text-sm font-medium group-hover:text-gray-600">
                      {(design.config as { style?: string })?.style ?? '맞춤 수납장'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </ShopLayout>
  );
}
