'use client';

import Link from 'next/link';
import { ShopLayout } from '@/components/common/ShopLayout';

export default function Home() {
  return (
    <ShopLayout>
      {/* 히어로 섹션 */}
      <section className="flex min-h-[60vh] flex-col items-center justify-center bg-[#e9eaea] px-4">
        <h1 className="mb-4 text-5xl font-bold text-gray-800">Befun</h1>
        <p className="mb-8 text-center text-lg text-gray-600">
          3D 커스터마이저로 나만의 맞춤 수납 가구를 디자인하세요
        </p>
        <Link
          href="/configurator"
          className="rounded-full bg-gray-800 px-8 py-3 text-white transition-colors hover:bg-gray-700"
        >
          디자인 시작하기
        </Link>
      </section>

      {/* 특징 섹션 */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold text-gray-800">
          나만의 가구, 이렇게 만들어요
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-4 text-4xl">1</div>
            <h3 className="mb-2 font-semibold">디자인</h3>
            <p className="text-sm text-gray-500">
              3D 커스터마이저에서 크기, 스타일, 색상을 자유롭게 설정하세요
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 text-4xl">2</div>
            <h3 className="mb-2 font-semibold">주문</h3>
            <p className="text-sm text-gray-500">
              마음에 드는 디자인을 장바구니에 담고 간편하게 결제하세요
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 text-4xl">3</div>
            <h3 className="mb-2 font-semibold">배송</h3>
            <p className="text-sm text-gray-500">
              맞춤 제작 후 안전하게 배송해드립니다
            </p>
          </div>
        </div>
      </section>
    </ShopLayout>
  );
}
