import { prisma } from '@/lib/db';
import { updateOrderStatus } from '../actions';
import { ORDER_STATUS, PAYMENT_STATUS, date, won } from '../format';
import styles from '../admin.module.css';

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    take: 100, orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } }, items: { select: { quantity: true } }, payment: { select: { status: true, method: true } } },
  });
  return (
    <>
      <h1>주문 관리</h1>
      <section className={styles.panel}>
        {orders.length === 0 ? <p className={styles.empty}>아직 주문이 없습니다.</p> : (
          <table className={styles.table}>
            <thead><tr><th>주문일</th><th>주문번호</th><th>주문자</th><th>받는 분</th><th>수량</th><th>금액</th><th>결제</th><th>상태 변경</th></tr></thead>
            <tbody>{orders.map((o) => (
              <tr key={o.id}>
                <td>{date(o.createdAt)}</td>
                <td className={styles.muted}>{o.id.slice(-8)}</td>
                <td>{o.user.name ?? '이름 없음'}<div className={styles.muted}>{o.user.email ?? ''}</div></td>
                <td>{o.shipName}<div className={styles.muted}>{o.shipPhone}</div></td>
                <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td>{won(o.totalAmount)}</td>
                <td><span className={styles.pill} data-tone={o.payment?.status === 'PAID' ? 'paid' : o.payment?.status === 'CANCELLED' || o.payment?.status === 'REFUNDED' ? 'cancel' : undefined}>{o.payment ? PAYMENT_STATUS[o.payment.status] : '결제 전'}</span></td>
                <td>
                  <form action={updateOrderStatus} className={styles.inline}>
                    <input type="hidden" name="orderId" value={o.id} />
                    <select name="status" defaultValue={o.status} aria-label="주문 상태">
                      {Object.entries(ORDER_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <button type="submit">저장</button>
                  </form>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
    </>
  );
}
