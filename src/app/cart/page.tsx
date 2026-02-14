'use client';

import Link from 'next/link';
import { ShopLayout } from '@/components/common/ShopLayout';
import { useCartStore } from '@/stores/useCartStore';
import { formatPrice } from '@/lib/pricing';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const total = getTotalPrice();

  return (
    <ShopLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-8 text-2xl font-bold">장바구니</h1>

        {items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mb-4 text-gray-500">장바구니가 비어 있습니다</p>
            <Link
              href="/configurator"
              className="inline-block rounded-lg bg-gray-900 px-6 py-2.5 text-sm text-white hover:bg-gray-800"
            >
              디자인 시작하기
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
                >
                  {/* 썸네일 */}
                  <div className="h-20 w-20 shrink-0 rounded-md bg-gray-100">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt="가구 미리보기"
                        className="h-full w-full rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        3D
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1">
                    <p className="text-sm font-medium">맞춤 수납장</p>
                    <p className="text-xs text-gray-400">
                      {(item.designConfig as { width?: number })?.width ?? '-'}cm x{' '}
                      {(item.designConfig as { depth?: number })?.depth ?? '-'}cm
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  {/* 수량 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* 삭제 */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            {/* 합계 + 주문 */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">총 금액</span>
                <span className="text-lg font-bold">{formatPrice(total)}</span>
              </div>
              <Link
                href="/order"
                className="mt-4 block w-full rounded-lg bg-gray-900 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
              >
                주문하기
              </Link>
            </div>
          </>
        )}
      </div>
    </ShopLayout>
  );
}
