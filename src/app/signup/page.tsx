'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShopLayout } from '@/components/common/ShopLayout';
import { SocialLogin, safeCallback } from '@/components/account/SocialLogin';
import { AuthShell } from '@/components/account/AuthShell';
import account from '@/components/account/account.module.css';

type Field = 'name' | 'email' | 'password' | 'confirm' | 'terms';

/** 라벨·도움말·오류를 분리한 입력칸(라벨만 접근 가능한 이름, 도움말·오류는 aria-describedby) */
function Input({ id, label, hint, error, ...props }: { id: string; label: string; hint?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const described = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={account.field}>
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={described} {...props} />
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && <span id={`${id}-error`} className={account.fieldError}>{error}</span>}
    </div>
  );
}

function SignupForm() {
  const router = useRouter();
  const callbackUrl = safeCallback(useSearchParams().get('callbackUrl'));
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [agree, setAgree] = useState({ terms: false, privacy: false, marketing: false });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const allAgreed = agree.terms && agree.privacy && agree.marketing;
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    if (form.password !== form.confirm) next.confirm = '비밀번호가 서로 다릅니다.';
    if (!agree.terms || !agree.privacy) next.terms = '필수 약관에 동의해 주세요.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, agreeTerms: agree.terms, agreePrivacy: agree.privacy, marketing: agree.marketing }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.field) setErrors({ [data.field as Field]: data.error });
        else setFormError(data.error ?? '가입에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      const login = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (login?.ok) { router.push(callbackUrl); router.refresh(); }
      else router.push(`/login?email=${encodeURIComponent(form.email)}`);
    } catch {
      setFormError('연결을 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="회원가입" lead="소셜 계정으로 바로 시작하거나 이메일로 가입하세요.">
      <SocialLogin callbackUrl={callbackUrl} verb="시작하기" />
      <div className={account.divider}>또는 이메일로 가입</div>
      <form onSubmit={submit} className={account.form} noValidate>
        <Input id="su-name" label="이름" error={errors.name} value={form.name} onChange={set('name')} autoComplete="name" required maxLength={40} />
        <Input id="su-email" label="이메일" error={errors.email} type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        <Input id="su-password" label="비밀번호" hint="8자 이상, 영문과 숫자를 함께 넣어 주세요." error={errors.password} type="password" value={form.password} onChange={set('password')} autoComplete="new-password" required />
        <Input id="su-confirm" label="비밀번호 확인" error={errors.confirm} type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" required />
        <fieldset className={account.terms}>
          <legend className="sr-only">약관 동의</legend>
          <label className={account.all}><input type="checkbox" checked={allAgreed} onChange={(e) => setAgree({ terms: e.target.checked, privacy: e.target.checked, marketing: e.target.checked })} /> 전체 동의</label>
          <label><input type="checkbox" checked={agree.terms} onChange={(e) => setAgree((a) => ({ ...a, terms: e.target.checked }))} /> 이용약관 동의 <em>(필수)</em></label>
          <label><input type="checkbox" checked={agree.privacy} onChange={(e) => setAgree((a) => ({ ...a, privacy: e.target.checked }))} /> 개인정보 수집·이용 동의 <em>(필수)</em></label>
          <label><input type="checkbox" checked={agree.marketing} onChange={(e) => setAgree((a) => ({ ...a, marketing: e.target.checked }))} /> 할인·이벤트 소식 받기 <em>(선택)</em></label>
          {errors.terms && <span className={account.fieldError}>{errors.terms}</span>}
        </fieldset>
        {formError && <p className={account.error} role="alert">{formError}</p>}
        <button type="submit" disabled={submitting} className={account.submit}>{submitting ? '가입 중…' : '가입하기'}</button>
      </form>
      <p className={account.switch}>이미 회원이신가요?<Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>로그인</Link></p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <ShopLayout>
      <Suspense fallback={<div className="py-20 text-center text-gray-500">로딩 중...</div>}>
        <SignupForm />
      </Suspense>
    </ShopLayout>
  );
}
