import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getAdmin } from '@/lib/admin';
import { setUserRole } from '../../actions';
import { Badge, StatusBadge } from '../../_components/Badge';
import { ConfirmSubmit } from '../../_components/ConfirmSubmit';
import { DesignThumb } from '../../_components/DesignThumb';
import { designSpec } from '../../_lib/spec';
import { PAID_STATUSES, PROVIDERS, dateTime, orderNo, won } from '../../_lib/format';
import styles from '../../admin.module.css';

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, u] = await Promise.all([getAdmin(), prisma.user.findUnique({
    where: { id },
    include: { accounts: { select: { provider: true } }, addresses: true, orders: { orderBy: { createdAt: 'desc' }, take: 50 }, designs: { orderBy: { createdAt: 'desc' }, take: 24 } },
  })]);
  if (!u) notFound();
  const spent = u.orders.filter((o) => PAID_STATUSES.includes(o.status)).reduce((a, o) => a + o.totalAmount, 0);
  const self = me?.id === u.id;
  return (
    <>
      <div className={styles.crumb}><Link href="/admin/users">회원 관리</Link> / {u.name ?? u.email ?? '회원'}</div>
      <div className={styles.pageHead}>
        <div><h1 style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{u.name ?? '이름 없음'} {u.role === 'ADMIN' && <Badge tone="ink">관리자</Badge>}</h1><p>{u.email ?? '이메일 미동의'} · {dateTime(u.createdAt)} 가입</p></div>
        <form action={setUserRole}>
          <input type="hidden" name="userId" value={u.id} /><input type="hidden" name="role" value={u.role === 'ADMIN' ? 'USER' : 'ADMIN'} />
          {self ? <span className={styles.muted}>본인 계정은 권한을 바꿀 수 없습니다</span> :
            <ConfirmSubmit className={`${styles.btn} ${u.role === 'ADMIN' ? styles.danger : ''}`} message={u.role === 'ADMIN' ? '관리자 권한을 해제할까요?' : '이 회원에게 관리자 권한을 줄까요? 주문·회원 정보를 모두 볼 수 있게 됩니다.'}>{u.role === 'ADMIN' ? '관리자 권한 해제' : '관리자로 지정'}</ConfirmSubmit>}
        </form>
      </div>
      <div className={styles.grid4} style={{ marginBottom: 14 }}>
        <div className={`${styles.card} ${styles.kpi}`}><span>주문</span><strong>{u.orders.length}건</strong></div>
        <div className={`${styles.card} ${styles.kpi}`}><span>구매 금액</span><strong>{won(spent)}</strong></div>
        <div className={`${styles.card} ${styles.kpi}`}><span>저장 디자인</span><strong>{u.designs.length}개</strong></div>
        <div className={`${styles.card} ${styles.kpi}`}><span>마케팅 수신</span><strong>{u.marketingAgreed ? '동의' : '미동의'}</strong></div>
      </div>
      <div className={styles.detail}>
        <div className={styles.stack}>
          <section className={styles.tableWrap}>
            <div className={styles.cardHead} style={{ padding: '16px 18px 0' }}><h2>주문 내역</h2></div>
            {u.orders.length === 0 ? <div className={styles.empty}>주문이 없습니다.</div> : (
              <table className={styles.table}><thead><tr><th>주문번호</th><th>주문일</th><th className={styles.num}>금액</th><th>상태</th></tr></thead>
                <tbody>{u.orders.map((o) => (
                  <tr key={o.id}><td><Link className={styles.rowLink} href={`/admin/orders/${o.id}`}>{orderNo(o.id, o.createdAt)}</Link></td><td className={styles.muted}>{dateTime(o.createdAt)}</td><td className={styles.num}>{won(o.totalAmount + o.shippingFee)}</td><td><StatusBadge status={o.status} /></td></tr>
                ))}</tbody></table>
            )}
          </section>
          <section className={styles.card}>
            <div className={styles.cardHead}><h2>저장한 디자인</h2></div>
            {u.designs.length === 0 ? <p className={styles.muted}>저장한 디자인이 없습니다.</p> : (
              <div className={styles.gallery}>{u.designs.map((d) => { const s = designSpec(d.config); return (
                <Link key={d.id} href={`/share/${d.shareCode}`} target="_blank" className={styles.designCard}><div className={styles.thumb}><DesignThumb spec={s} /></div><div className={styles.designBody}><strong>{s?.style ?? '맞춤 가구'}</strong><span className={styles.muted}>{s ? `${s.width}×${s.height}×${s.depth}cm · ${s.colorName}` : d.shareCode}</span></div></Link>
              ); })}</div>
            )}
          </section>
        </div>
        <div className={styles.stack}>
          <section className={styles.card}>
            <div className={styles.cardHead}><h2>회원 정보</h2></div>
            <dl className={styles.dl}>
              <dt>회원 ID</dt><dd className={styles.mono}>{u.id}</dd>
              <dt>가입 방법</dt><dd>{[u.passwordHash ? '이메일' : null, ...u.accounts.map((a) => PROVIDERS[a.provider] ?? a.provider)].filter(Boolean).join(', ') || '-'}</dd>
              <dt>연락처</dt><dd>{u.phone ?? '-'}</dd>
              <dt>약관 동의</dt><dd>{u.termsAgreedAt ? dateTime(u.termsAgreedAt) : '소셜 가입(약관 기록 없음)'}</dd>
            </dl>
          </section>
          <section className={styles.card}>
            <div className={styles.cardHead}><h2>배송지</h2></div>
            {u.addresses.length === 0 ? <p className={styles.muted}>저장된 배송지가 없습니다.</p> : u.addresses.map((a) => (
              <dl key={a.id} className={styles.dl} style={{ marginBottom: 12 }}><dt>{a.isDefault ? '기본' : '배송지'}</dt><dd>{a.name} · {a.phone}<br />({a.zipCode}) {a.address} {a.detail ?? ''}</dd></dl>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
