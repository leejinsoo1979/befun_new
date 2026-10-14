import Link from 'next/link';
import { prisma } from '@/lib/db';
import { StatusBadge } from '../_components/Badge';
import { orderWhere } from '../_lib/queries';
import { dateTime, orderNo, won } from '../_lib/format';
import styles from '../admin.module.css';

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() ?? '';
  if (!q) return <div className={styles.pageHead}><h1>검색</h1></div>;
  const [orders, users, designs] = await Promise.all([
    prisma.order.findMany({ where: orderWhere({ q }), take: 20, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }),
    prisma.user.findMany({ where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }] }, take: 20, select: { id: true, name: true, email: true, createdAt: true } }),
    prisma.design.findMany({ where: { shareCode: { contains: q } }, take: 20, select: { id: true, shareCode: true, createdAt: true } }),
  ]);
  return (
    <>
      <div className={styles.pageHead}><div><h1>“{q}” 검색 결과</h1><p>주문 {orders.length} · 회원 {users.length} · 디자인 {designs.length}</p></div></div>
      <div className={styles.stack}>
        <section className={styles.tableWrap}><div className={styles.cardHead} style={{ padding: '16px 18px 0' }}><h2>주문</h2></div>
          {orders.length === 0 ? <div className={styles.empty}>없음</div> : <table className={styles.table}><tbody>{orders.map((o) => (
            <tr key={o.id}><td><Link className={styles.rowLink} href={`/admin/orders/${o.id}`}>{orderNo(o.id, o.createdAt)}</Link></td><td>{o.user.name ?? '-'} → {o.shipName}</td><td className={styles.muted}>{dateTime(o.createdAt)}</td><td className={styles.num}>{won(o.totalAmount)}</td><td><StatusBadge status={o.status} /></td></tr>
          ))}</tbody></table>}
        </section>
        <section className={styles.tableWrap}><div className={styles.cardHead} style={{ padding: '16px 18px 0' }}><h2>회원</h2></div>
          {users.length === 0 ? <div className={styles.empty}>없음</div> : <table className={styles.table}><tbody>{users.map((u) => (
            <tr key={u.id}><td><Link className={styles.rowLink} href={`/admin/users/${u.id}`}>{u.name ?? '이름 없음'}</Link></td><td>{u.email ?? '-'}</td><td className={styles.muted}>{dateTime(u.createdAt)}</td></tr>
          ))}</tbody></table>}
        </section>
        <section className={styles.tableWrap}><div className={styles.cardHead} style={{ padding: '16px 18px 0' }}><h2>디자인</h2></div>
          {designs.length === 0 ? <div className={styles.empty}>없음</div> : <table className={styles.table}><tbody>{designs.map((d) => (
            <tr key={d.id}><td><Link className={styles.rowLink} href={`/share/${d.shareCode}`} target="_blank">{d.shareCode}</Link></td><td className={styles.muted}>{dateTime(d.createdAt)}</td></tr>
          ))}</tbody></table>}
        </section>
      </div>
    </>
  );
}
