import Link from 'next/link';
import { prisma } from '@/lib/db';
import { date } from '../format';
import styles from '../admin.module.css';

export default async function AdminDesigns() {
  const designs = await prisma.design.findMany({
    take: 100, orderBy: { createdAt: 'desc' },
    select: { id: true, shareCode: true, createdAt: true, user: { select: { name: true, email: true } }, _count: { select: { orderItems: true } } },
  });
  return (
    <>
      <h1>저장된 디자인</h1>
      <section className={styles.panel}>
        {designs.length === 0 ? <p className={styles.empty}>아직 저장된 디자인이 없습니다.</p> : (
          <table className={styles.table}>
            <thead><tr><th>저장일</th><th>공유 코드</th><th>저장한 회원</th><th>주문에 사용</th><th></th></tr></thead>
            <tbody>{designs.map((d) => (
              <tr key={d.id}>
                <td>{date(d.createdAt)}</td>
                <td>{d.shareCode}</td>
                <td>{d.user ? (d.user.name ?? d.user.email ?? '이름 없음') : <span className={styles.muted}>비회원</span>}</td>
                <td>{d._count.orderItems}건</td>
                <td><Link href={`/share/${d.shareCode}`} target="_blank">열기 ↗</Link></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
    </>
  );
}
