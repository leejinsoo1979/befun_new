'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShopLayout } from '@/components/common/ShopLayout';
import { SocialLogin, safeCallback } from '@/components/account/SocialLogin';
import { AuthShell } from '@/components/account/AuthShell';
import account from '@/components/account/account.module.css';

const OAUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: '이미 다른 방법으로 가입된 이메일입니다. 처음 가입한 방법으로 로그인해 주세요.',
  CredentialsSignin: '이메일 또는 비밀번호가 맞지 않습니다.',
  OAuthSignin: '소셜 로그인 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  OAuthCallback: '소셜 로그인 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  AccessDenied: '로그인이 취소되었습니다.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallback(searchParams.get('callbackUrl'));
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const urlError = searchParams.get('error');
  const [error, setError] = useState(urlError ? (OAUTH_ERRORS[urlError] ?? '로그인에 실패했습니다. 다시 시도해 주세요.') : '');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error || !result?.ok) setError(OAUTH_ERRORS.CredentialsSignin);
      else { router.push(callbackUrl); router.refresh(); }
    } catch {
      setError('로그인 연결을 확인해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title="로그인" lead="소셜 계정으로 1초 만에 시작하세요. 처음이면 자동으로 가입돼요.">
      <SocialLogin callbackUrl={callbackUrl} />
      <div className={account.divider}>또는 이메일로 로그인</div>
      <form onSubmit={handleEmailLogin} className={account.form}>
        <div className={account.field}>
          <label htmlFor="li-email">이메일</label>
          <input id="li-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required />
        </div>
        <div className={account.field}>
          <label htmlFor="li-password">비밀번호</label>
          <input id="li-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="비밀번호" required />
        </div>
        {error && <p className={account.error} role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting} className={account.submit}>{isSubmitting ? '로그인 중…' : '로그인'}</button>
      </form>
      <p className={account.switch}>아직 회원이 아니신가요?<Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}>회원가입</Link></p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <ShopLayout>
      <Suspense fallback={<div className="py-20 text-center text-gray-500">로딩 중...</div>}>
        <LoginForm />
      </Suspense>
    </ShopLayout>
  );
}
