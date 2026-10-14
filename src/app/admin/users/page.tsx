import Link from 'next/link';
import { FiSearch } from 'react-icons/fi';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { Badge } from '../_components/Badge';
import { PROVIDERS, dateTime, num, won } from '../_lib/format';
import styles from '../admin.module.css';

const PAGE = 30;
type SP = { q?: string; via?: string; role?: string; marketing?: string; page?: string };
const qs = (sp: SP, patch: Partial<SP>) => `?${new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][])}`;

export default async function Users({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.UserWhereInput = {};
  const q = sp.q?.trim();
  if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }];
  if (sp.via === 'email') where.passwordHash = { not: null };
  else if (sp.via) where.accounts = { some: { provider: sp.via } };
  if (sp.role === 'ADMIN' || sp.role === 'USER') where.role = sp.role;
  if (sp.marketing === '1') where.marketingAgreed = true;
  const [users, total, totalAll, admins, marketing] = await Promise.all([
    prisma.user.findMany({
      where, take: PAGE, skip: (page - 1) * PAGE, orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, passwordHash: true, marketingAgreed: true, accounts: { select: { provider: true } },
        orders: { where: { status: { in: ['PAID', 'PRODUCING', 'SHIPPING', 'DELIVERED'] } }, select: { totalAmount: true } }, _count: { select: { orders: true, designs: true } } },
    }),
    prisma.user.count({ where }), prisma.user.count(), prisma.user.count({ where: { role: 'ADMIN' } }), prisma.user.count({ where: { marketingAgreed: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <>
      <div className={styles.pageHead}><div><h1>회원 관리</h1><p>전체 {num(totalAll)}명 · 관리자 {admins}명 · 마케팅 수신 동의 {num(marketing)}명</p></div></div>
      <div className={styles.tableWrap}>
        <form className={styles.filters} role="search">
          <input type="search" name="q" defaultValue={sp.q} placeholder="이름, 이메일, 연락처" aria-label="회원 검색" />
          <select name="via" defaultValue={sp.via ?? ''} aria-label="가입 방법"><option value="">가입 방법 전체</option><option value="email">이메일</option><option value="naver">네이버</option><option value="kakao">카카오</option><option value="google">구글</option></select>
          <select name="role" defaultValue={sp.role ?? ''} aria-label="권한"><option value="">권한 전체</option><option value="USER">일반</option><option value="ADMIN">관리자</option></select>
          <label className={styles.muted}><input type="checkbox" name="marketing" value="1" defaultChecked={sp.marketing === '1'} /> 마케팅 동의만</label>
          <button className={`${styles.btn} ${styles.primary}`}><FiSearch />검색</button>
          {(sp.q || sp.via || sp.role || sp.marketing) && <Link className={styles.btn} href="/admin/users">초기화</Link>}
        </form>
        {users.length === 0 ? <div className={styles.empty}><strong>조건에 맞는 회원이 없습니다</strong></div> : (
          <div className={styles.tableScroll}><table className={styles.table}>
            <thead><tr><th>회원</th><th>가입 방법</th><th>가입일</th><th className={styles.num}>주문</th><th className={styles.num}>구매 금액</th><th className={styles.num}>디자인</th><th>마케팅</th><th>권한</th></tr></thead>
            <tbody>{users.map((u) => {
              const via = [u.passwordHash ? '이메일' : null, ...u.accounts.map((a) => PROVIDERS[a.provider] ?? a.provider)].filter(Boolean).join(' · ');
              return (
                <tr key={u.id}>
                  <td><Link className={styles.rowLink} href={`/admin/users/${u.id}`}>{u.name ?? '이름 없음'}</Link><div className={styles.muted}>{u.email ?? '이메일 미동의'}</div></td>
                  <td>{via || '-'}</td>
                  <td className={styles.muted}>{dateTime(u.createdAt)}</td>
                  <td className={styles.num}>{u._count.orders}</td>
                  <td className={styles.num}>{won(u.orders.reduce((a, o) => a + o.totalAmount, 0))}</td>
                  <td className={styles.num}>{u._count.designs}</td>
                  <td>{u.marketingAgreed ? <Badge tone="green">동의</Badge> : <span className={styles.muted}>-</span>}</td>
                  <td>{u.role === 'ADMIN' ? <Badge tone="ink">관리자</Badge> : <span className={styles.muted}>일반</span>}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
        <div className={styles.pager}>
          <span>{num(total)}명</span>
          <div>
            {page > 1 ? <Link className={styles.btn} href={qs(sp, { page: String(page - 1) })}>이전</Link> : <span className={styles.btn}>이전</span>}
            <span className={styles.btn}>{page} / {pages}</span>
            {page < pages ? <Link className={styles.btn} href={qs(sp, { page: String(page + 1) })}>다음</Link> : <span className={styles.btn}>다음</span>}
          </div>
        </div>
      </div>
    </>
  );
}
