import Link from 'next/link';
import { FiCheckCircle, FiDatabase, FiXCircle } from 'react-icons/fi';
import { prisma } from '@/lib/db';
import { Badge } from '../_components/Badge';
import { ConfirmSubmit } from '../_components/ConfirmSubmit';
import { createDemoData, deleteDemoData } from './demo';
import { dateTime } from '../_lib/format';
import styles from '../admin.module.css';

const has = (k: string) => Boolean(process.env[k]?.trim());

export default async function Settings() {
  const [admins, demoUsers] = await Promise.all([
    prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, name: true, email: true, createdAt: true } }),
    prisma.user.count({ where: { email: { endsWith: '@demo.befun.test' } } }),
  ]);
  const checks: [string, boolean, string][] = [
    ['데이터베이스', has('DATABASE_URL'), '회원·주문·디자인 저장'],
    ['로그인 암호화 키', has('NEXTAUTH_SECRET'), 'NEXTAUTH_SECRET'],
    ['사이트 주소', has('NEXTAUTH_URL'), process.env.NEXTAUTH_URL ?? 'NEXTAUTH_URL 미설정'],
    ['네이버 로그인', has('NAVER_CLIENT_ID') && has('NAVER_CLIENT_SECRET'), '네이버 개발자센터'],
    ['카카오 로그인', has('KAKAO_CLIENT_ID') && has('KAKAO_CLIENT_SECRET'), '카카오 디벨로퍼스'],
    ['구글 로그인', has('GOOGLE_CLIENT_ID') && has('GOOGLE_CLIENT_SECRET'), 'Google Cloud'],
    ['토스페이먼츠 결제', has('TOSS_SECRET_KEY'), has('TOSS_SECRET_KEY') ? '시크릿 키 등록됨' : 'TOSS_SECRET_KEY 미설정 — 실결제 불가'],
    ['토스 웹훅', has('TOSS_WEBHOOK_SECRET'), '결제 상태 자동 반영'],
  ];
  const dev = process.env.NODE_ENV !== 'production';
  return (
    <>
      <div className={styles.pageHead}><div><h1>설정</h1><p>운영 환경 점검과 관리자 계정</p></div></div>
      <div className={styles.grid2even} style={{ marginTop: 0 }}>
        <section className={styles.card}>
          <div className={styles.cardHead}><h2>시스템 상태</h2><span className={styles.muted}>값은 표시하지 않고 설정 여부만 확인</span></div>
          <table className={styles.table}><tbody>{checks.map(([name, ok, note]) => (
            <tr key={name}><td>{ok ? <FiCheckCircle color="#1f8f0b" /> : <FiXCircle color="#c62a2a" />} {name}</td><td className={styles.muted}>{note}</td><td>{ok ? <Badge tone="green">정상</Badge> : <Badge tone="red">필요</Badge>}</td></tr>
          ))}</tbody></table>
        </section>
        <section className={styles.card}>
          <div className={styles.cardHead}><h2>관리자 계정 {admins.length}명</h2><Link href="/admin/users?role=ADMIN">회원에서 관리 →</Link></div>
          <table className={styles.table}><tbody>{admins.map((a) => (
            <tr key={a.id}><td><Link className={styles.rowLink} href={`/admin/users/${a.id}`}>{a.name ?? '이름 없음'}</Link></td><td>{a.email}</td><td className={styles.muted}>{dateTime(a.createdAt)}</td></tr>
          ))}</tbody></table>
          <p className={styles.muted} style={{ marginTop: 12 }}>서버 설정 ADMIN_EMAILS에 있는 이메일은 로그인할 때 자동으로 관리자가 됩니다. 다른 회원은 회원 상세에서 지정할 수 있습니다.</p>
        </section>
      </div>
      {dev && (
        <section className={styles.card} style={{ marginTop: 14 }}>
          <div className={styles.cardHead}><h2><FiDatabase style={{ verticalAlign: -2, marginRight: 6 }} />데모 데이터 (개발 서버 전용)</h2>{demoUsers > 0 && <Badge tone="amber">데모 회원 {demoUsers}명 있음</Badge>}</div>
          <p className={styles.muted} style={{ marginBottom: 12 }}>관리자 화면을 미리 보기 위한 가상 회원 10명·주문 약 35건을 만듭니다. 모두 <span className={styles.mono}>@demo.befun.test</span> 이메일로 표시되며 한 번에 삭제할 수 있습니다. 운영(배포) 환경에서는 이 기능이 보이지 않습니다.</p>
          <div className={styles.actionRow}>
            <form action={createDemoData}><button className={`${styles.btn} ${styles.primary}`} disabled={demoUsers > 0}>데모 데이터 만들기</button></form>
            <form action={deleteDemoData}><ConfirmSubmit className={`${styles.btn} ${styles.danger}`} message="데모 회원·주문·디자인을 모두 삭제할까요?">데모 데이터 삭제</ConfirmSubmit></form>
          </div>
        </section>
      )}
    </>
  );
}
