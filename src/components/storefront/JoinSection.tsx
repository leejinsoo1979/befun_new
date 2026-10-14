'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './storefront.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
export function JoinSection() {
  const { t } = useI18n();
  const router=useRouter();
  const [email,setEmail]=useState('');
  return <section className={styles.joinSection}><p className={styles.eyebrow}>{t('Befun과 함께 시작하세요')}</p><h2>{t('당신의 취향이,')}<br className={styles.mobileBreak} /> {t('다음 디자인이 됩니다.')}</h2><form className={styles.joinForm} onSubmit={event=>{event.preventDefault();router.push(`/login?email=${encodeURIComponent(email)}`);}}><label className={styles.srOnly} htmlFor="join-email">{t('이메일 주소')}</label><input id="join-email" type="email" autoComplete="email" placeholder={t('이메일 주소를 입력하세요')} value={email} onChange={event=>setEmail(event.target.value)} required /><button type="submit" className={styles.orangeButton}>{t('계정 시작하기')}</button></form><p>{t('이메일로 계정을 시작하고 내 디자인과 주문을 확인하세요.')}</p><p><Link href="/terms/user-account-and-promo-codes">{t('계정 이용 안내')}</Link> · <Link href="/privacy_policy">{t('개인정보 처리 안내')}</Link></p></section>;
}
