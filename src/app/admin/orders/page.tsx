import Link from 'next/link';
import { FiDownload, FiSearch } from 'react-icons/fi';
import { prisma } from '@/lib/db';
import { bulkChangeStatus } from '../actions';
import { StatusBadge } from '../_components/Badge';
import { SelectAll } from '../_components/SelectAll';
import { designSpec } from '../_lib/spec';
import { orderWhere, type OrderFilter as SP } from '../_lib/queries';
import { ORDER_STATUS, ORDER_STATUSES, PAYMENT_METHOD, dateTime, num, orderNo, won } from '../_lib/format';
import styles from '../admin.module.css';

const PAGE = 20;

const qs = (sp: SP, patch: Partial<SP>) => {
  const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
  return `?${p.toString()}`;
};

export default async function Orders({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = orderWhere(sp);
  const baseWhere = orderWhere({ ...sp, status: undefined });
  const [orders, total, counts, sum] = await Promise.all([
    prisma.order.findMany({
      where, take: PAGE, skip: (page - 1) * PAGE,
      orderBy: { createdAt: sp.sort === 'old' ? 'asc' : 'desc' },
      include: { user: { select: { name: true, email: true } }, payment: { select: { method: true, status: true } }, shipping: { select: { carrier: true, trackingNo: true } }, items: { select: { quantity: true, design: { select: { config: true } } } } },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ['status'], _count: true, where: baseWhere }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where }),
  ]);
  const countOf = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;
  const all = counts.reduce((a, c) => a + c._count, 0);
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <>
      <div className={styles.pageHead}>
        <div><h1>주문 관리</h1><p>조건에 맞는 주문 {num(total)}건 · 합계 {won(sum._sum.totalAmount ?? 0)}</p></div>
        <a className={styles.btn} href={`/api/admin/orders/export${qs(sp, { page: undefined })}`}><FiDownload />엑셀(CSV) 다운로드</a>
      </div>
      <div className={styles.tableWrap}>
        <nav className={styles.tabs} aria-label="주문 상태">
          <Link href={qs(sp, { status: undefined, page: undefined })} aria-current={!sp.status ? 'page' : undefined}>전체 <i>{num(all)}</i></Link>
          {ORDER_STATUSES.map((s) => <Link key={s} href={qs(sp, { status: s, page: undefined })} aria-current={sp.status === s ? 'page' : undefined}>{ORDER_STATUS[s].label} <i>{num(countOf[s] ?? 0)}</i></Link>)}
        </nav>
        <form className={styles.filters} role="search">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input type="search" name="q" defaultValue={sp.q} placeholder="주문번호, 주문자·받는 분, 이메일, 연락처, 송장번호" aria-label="주문 검색" />
          <label className={styles.muted}>기간 <input type="date" name="from" defaultValue={sp.from} aria-label="시작일" /> ~ <input type="date" name="to" defaultValue={sp.to} aria-label="종료일" /></label>
          <select name="sort" defaultValue={sp.sort ?? 'new'} aria-label="정렬"><option value="new">최신순</option><option value="old">오래된순</option></select>
          <button className={`${styles.btn} ${styles.primary}`}><FiSearch />검색</button>
          {(sp.q || sp.from || sp.to) && <Link className={styles.btn} href={qs({ status: sp.status }, {})}>초기화</Link>}
        </form>
        {orders.length === 0 ? (
          <div className={styles.empty}><strong>조건에 맞는 주문이 없습니다</strong>검색어나 기간을 바꿔 보세요.</div>
        ) : (
          <form action={bulkChangeStatus}>
            <div className={styles.bulkBar}>
              <span>선택한 주문을</span>
              <select name="to" aria-label="변경할 상태" className={styles.btn} defaultValue="">
                <option value="" disabled>상태 선택</option>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
              </select>
              <button className={styles.btn}>일괄 변경</button>
              <span className={styles.muted}>발송 처리는 송장이 입력된 주문만 바뀝니다.</span>
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead><tr><th><SelectAll /></th><th>주문번호 · 일시</th><th>주문자</th><th>상품</th><th>받는 분</th><th className={styles.num}>결제 금액</th><th>결제</th><th>배송</th><th>상태</th></tr></thead>
                <tbody>{orders.map((o) => {
                  const first = designSpec(o.items[0]?.design.config);
                  const qty = o.items.reduce((a, i) => a + i.quantity, 0);
                  return (
                    <tr key={o.id}>
                      <td><input type="checkbox" name="ids" value={o.id} className={styles.check} aria-label={`${orderNo(o.id, o.createdAt)} 선택`} /></td>
                      <td><Link className={styles.rowLink} href={`/admin/orders/${o.id}`}>{orderNo(o.id, o.createdAt)}</Link><div className={styles.muted}>{dateTime(o.createdAt)}</div></td>
                      <td>{o.user.name ?? '이름 없음'}<div className={styles.muted}>{o.user.email ?? ''}</div></td>
                      <td>{first ? first.summary : '맞춤 선반'}{qty > 1 && <div className={styles.muted}>외 {qty - 1}개 · 총 {qty}개</div>}</td>
                      <td>{o.shipName}<div className={styles.muted}>{o.shipPhone}</div></td>
                      <td className={styles.num}><b>{won(o.totalAmount + o.shippingFee)}</b></td>
                      <td className={styles.muted}>{o.payment?.method ? PAYMENT_METHOD[o.payment.method] ?? o.payment.method : '-'}</td>
                      <td className={styles.muted}>{o.shipping?.trackingNo ? `${o.shipping.carrier ?? ''} ${o.shipping.trackingNo}` : o.shipping?.carrier ?? '-'}</td>
                      <td><StatusBadge status={o.status} /></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </form>
        )}
        <div className={styles.pager}>
          <span>{num(total)}건 중 {num(Math.min(total, (page - 1) * PAGE + 1))}–{num(Math.min(total, page * PAGE))}</span>
          <div>
            {page > 1 ? <Link className={styles.btn} href={qs(sp, { page: String(page - 1) })}>이전</Link> : <span className={styles.btn} aria-disabled>이전</span>}
            <span className={styles.btn}>{page} / {pages}</span>
            {page < pages ? <Link className={styles.btn} href={qs(sp, { page: String(page + 1) })}>다음</Link> : <span className={styles.btn} aria-disabled>다음</span>}
          </div>
        </div>
      </div>
    </>
  );
}
