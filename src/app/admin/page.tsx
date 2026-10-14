import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ORDER_STATUS, date, daysAgo, won } from './format';
import styles from './admin.module.css';

export default async function AdminDashboard() {
  const since = daysAgo(30);
  const [users, newUsers, orders, designs, paid, recent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.order.count(),
    prisma.design.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { in: ['PAID', 'PRODUCING', 'SHIPPING', 'DELIVERED'] } } }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } }),
  ]);
  return (
    <>
      <h1>대시보드</h1>
      <div className={styles.cards}>
        <div className={styles.card}><span>전체 회원</span><strong>{users}</strong></div>
        <div className={styles.card}><span>최근 30일 가입</span><strong>{newUsers}</strong></div>
        <div className={styles.card}><span>전체 주문</span><strong>{orders}</strong></div>
        <div className={styles.card}><span>결제 매출</span><strong>{won(paid._sum.totalAmount ?? 0)}</strong></div>
        <div className={styles.card}><span>저장된 디자인</span><strong>{designs}</strong></div>
      </div>
      <section className={styles.panel}>
        <h2>최근 주문 <Link href="/admin/orders" className={styles.muted}>전체 보기</Link></h2>
        {recent.length === 0 ? <p className={styles.empty}>아직 주문이 없습니다.</p> : (
          <table className={styles.table}>
            <thead><tr><th>주문일</th><th>주문자</th><th>금액</th><th>상태</th></tr></thead>
            <tbody>{recent.map((o) => (
              <tr key={o.id}><td>{date(o.createdAt)}</td><td>{o.user.name ?? o.user.email ?? '이름 없음'}</td><td>{won(o.totalAmount)}</td><td><span className={styles.pill}>{ORDER_STATUS[o.status]}</span></td></tr>
            ))}</tbody>
          </table>
        )}
      </section>
    </>
  );
}
