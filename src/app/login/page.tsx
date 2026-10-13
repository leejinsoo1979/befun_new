'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShopLayout } from '@/components/common/ShopLayout';
import styles from '@/components/storefront/storefront.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCallback = searchParams.get('callbackUrl') ?? '/mypage';
  const callbackUrl = requestedCallback.startsWith('/') && !requestedCallback.startsWith('//') ? requestedCallback : '/mypage';
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError('');

    try {
      const result = await signIn('credentials', { email, redirect: false });
      if (result?.error || !result?.ok) setError('로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      else router.push(callbackUrl);
    } catch {
      setError('로그인 연결을 확인해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.accountForm}>
      <h1 className="mb-8 text-center text-2xl font-bold">로그인</h1>

      {/* 소셜 로그인 */}
      <div className="space-y-3">
        <button
          onClick={() => signIn('google', { callbackUrl })}
          className={styles.outlineButton}
        >
          Google로 로그인
        </button>
        <button
          onClick={() => signIn('kakao', { callbackUrl })}
          className={styles.whiteButton}
          style={{background: "#FEE500"}}
        >
          카카오로 로그인
        </button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">또는</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* 이메일 로그인 */}
      <form onSubmit={handleEmailLogin} className={styles.form}>
        <label>이메일 주소<input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
        /></label>
        {error && <p className="text-center text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.darkButton}
        >
          {isSubmitting ? '로그인 중...' : '이메일로 로그인'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-400">
        계정이 없으면 자동으로 생성됩니다
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ShopLayout>
      <Suspense
        fallback={
          <div className="py-20 text-center text-gray-500">로딩 중...</div>
        }
      >
        <LoginForm />
      </Suspense>
    </ShopLayout>
  );
}
