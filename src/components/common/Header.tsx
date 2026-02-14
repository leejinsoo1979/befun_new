'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCartStore } from '@/stores/useCartStore';

export function Header() {
  const { data: session } = useSession();
  const itemCount = useCartStore((s) => s.getTotalCount());

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Befun
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/configurator" className="text-gray-600 hover:text-gray-900">
            디자인하기
          </Link>

          <Link href="/cart" className="relative text-gray-600 hover:text-gray-900">
            장바구니
            {itemCount > 0 && (
              <span className="absolute -right-4 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {session?.user ? (
            <>
              <Link href="/mypage" className="text-gray-600 hover:text-gray-900">
                마이페이지
              </Link>
              <button
                onClick={() => signOut()}
                className="text-gray-400 hover:text-gray-600"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
