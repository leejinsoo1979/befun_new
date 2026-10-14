import Link from 'next/link';
import { FiSearch } from 'react-icons/fi';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { DesignThumb } from '../_components/DesignThumb';
import { designSpec } from '../_lib/spec';
import { dateTime, num } from '../_lib/format';
import styles from '../admin.module.css';

const PAGE = 36;
type SP = { q?: string; ordered?: string; page?: string };

export default async function Designs({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.DesignWhereInput = {};
  const q = sp.q?.trim();
  if (q) where.OR = [{ shareCode: { contains: q } }, { user: { email: { contains: q, mode: 'insensitive' } } }, { user: { name: { contains: q, mode: 'insensitive' } } }];
  if (sp.ordered === '1') where.orderItems = { some: {} };
  const [designs, total] = await Promise.all([
    prisma.design.findMany({ where, take: PAGE, skip: (page - 1) * PAGE, orderBy: { createdAt: 'desc' }, select: { id: true, shareCode: true, config: true, createdAt: true, user: { select: { id: true, name: true, email: true } }, _count: { select: { orderItems: true } } } }),
    prisma.design.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (p: number) => `?${new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([, v]) => v) as [string, string][])}`;
  return (
    <>
      <div className={styles.pageHead}><div><h1>저장된 디자인</h1><p>고객이 저장·공유한 디자인 {num(total)}개</p></div></div>
      <div className={styles.tableWrap} style={{ marginBottom: 14 }}>
        <form className={styles.filters} role="search" style={{ borderBottom: 0 }}>
          <input type="search" name="q" defaultValue={sp.q} placeholder="공유 코드, 회원 이름·이메일" aria-label="디자인 검색" />
          <label className={styles.muted}><input type="checkbox" name="ordered" value="1" defaultChecked={sp.ordered === '1'} /> 주문된 디자인만</label>
          <button className={`${styles.btn} ${styles.primary}`}><FiSearch />검색</button>
        </form>
      </div>
      {designs.length === 0 ? <div className={`${styles.card} ${styles.empty}`}><strong>저장된 디자인이 없습니다</strong>고객이 컨피규레이터에서 디자인을 저장하면 여기에 모입니다.</div> : (
        <div className={styles.gallery}>{designs.map((d) => {
          const s = designSpec(d.config);
          return (
            <article key={d.id} className={styles.designCard}>
              <Link href={`/share/${d.shareCode}`} target="_blank" className={styles.thumb}><DesignThumb spec={s} /></Link>
              <div className={styles.designBody}>
                <strong>{s ? `${s.style} · ${s.colorName}` : '맞춤 가구'}</strong>
                <span className={styles.muted}>{s ? `${s.width}×${s.height}×${s.depth}cm · ${s.rows.length}단${s.doors.length ? ` · 도어 ${s.doors.length}` : ''}${s.drawers.length ? ` · 서랍 ${s.drawers.length}` : ''}` : ''}</span>
                <span className={styles.muted}>{d.user ? <Link href={`/admin/users/${d.user.id}`}>{d.user.name ?? d.user.email}</Link> : '비회원'} · {dateTime(d.createdAt)}</span>
                <span className={styles.muted}><span className={styles.mono}>{d.shareCode}</span>{d._count.orderItems > 0 && <> · <b style={{ color: '#1f8f0b' }}>주문 {d._count.orderItems}건</b></>}</span>
              </div>
            </article>
          );
        })}</div>
      )}
      {pages > 1 && <div className={styles.pager} style={{ border: 0 }}><span>{num(total)}개</span><div>{page > 1 && <Link className={styles.btn} href={href(page - 1)}>이전</Link>}<span className={styles.btn}>{page} / {pages}</span>{page < pages && <Link className={styles.btn} href={href(page + 1)}>다음</Link>}</div></div>}
    </>
  );
}
