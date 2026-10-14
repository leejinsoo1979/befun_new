'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShopLayout } from '@/components/common/ShopLayout';
import { useCartStore } from '@/stores/useCartStore';
import { useMoney } from '@/lib/commerce/useMoney';
import { PriceNotice } from '@/components/commerce/PriceNotice';
import { convertedCartTotal } from '@/lib/commerce/quote';
import styles from '@/components/storefront/storefront.module.css';

export default function CartPage() {
  const { formatPrice, formatLocalPrice, t, market } = useMoney();
  const { items, removeItem, updateQuantity } = useCartStore();
  const total = convertedCartTotal(items, market);

  return (
    <ShopLayout>
      <div className={styles.cartContent}>
        <h1 className="mb-8 text-2xl font-bold">{t('장바구니')}</h1>

        {items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mb-4 text-gray-500">{t('장바구니가 비어 있습니다')}</p>
            <Link
              href="/configurator"
              className={styles.darkButton}
            >
              {t('디자인 시작하기')}
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
                      <Image
                        src={item.thumbnailUrl}
                        width={80}
                        height={80}
                        unoptimized
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
                    <p className="text-sm font-medium">{t('맞춤 수납장')}</p>
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
                      aria-label={t('수량 줄이기')}
                      disabled={item.quantity <= 1}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      aria-label={t('수량 늘리기')}
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
                    {t('삭제')}
                  </button>
                </div>
              ))}
            </div>

            <PriceNotice />
            {/* 합계 + 주문 */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{t('총 금액')}</span>
                <span className="text-lg font-bold">{formatLocalPrice(total)}</span>
              </div>
              <Link
                href={market==='KR'?'/order':'/contact?topic=shipping'}
                className="mt-4 block w-full rounded-lg bg-gray-900 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
              >
                {t(market==='KR'?'주문하기':'견적 문의')}
              </Link>
            </div>
          </>
        )}
      </div>
    </ShopLayout>
  );
}
