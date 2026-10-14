import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowRight, FiExternalLink, FiTruck, FiXCircle } from 'react-icons/fi';
import { prisma } from '@/lib/db';
import { changeOrderStatus, saveMemo, saveShipping } from '../../actions';
import { StatusBadge, Badge } from '../../_components/Badge';
import { ConfirmSubmit } from '../../_components/ConfirmSubmit';
import { DesignThumb } from '../../_components/DesignThumb';
import { designSpec } from '../../_lib/spec';
import { CARRIERS, NEXT_STEP, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, PROVIDERS, SHIPPING_STATUS, dateTime, orderNo, won } from '../../_lib/format';
import styles from '../../admin.module.css';

const FLOW = ['PENDING', 'PAID', 'PRODUCING', 'SHIPPING', 'DELIVERED'] as const;

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true, accounts: { select: { provider: true } }, _count: { select: { orders: true } } } },
      items: { include: { design: { select: { shareCode: true, config: true, thumbnailUrl: true } } } },
      payment: true, shipping: true, events: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!o) notFound();
  const next = NEXT_STEP[o.status];
  const flowIndex = FLOW.indexOf(o.status as (typeof FLOW)[number]);
  const canCancel = o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
  const needsTracking = next?.to === 'SHIPPING' && !o.shipping?.trackingNo && !o.shipping?.carrier;
  const itemsTotal = o.items.reduce((a, i) => a + i.price * i.quantity, 0);

  return (
    <>
      <div className={styles.crumb}><Link href="/admin/orders">주문 관리</Link> / {orderNo(o.id, o.createdAt)}</div>
      <div className={styles.pageHead}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{orderNo(o.id, o.createdAt)} <StatusBadge status={o.status} /></h1>
          <p>{dateTime(o.createdAt)} 주문 · 마지막 변경 {dateTime(o.updatedAt)}</p>
        </div>
        <div className={styles.actionRow}>
          {canCancel && (
            <form action={changeOrderStatus}>
              <input type="hidden" name="orderId" value={o.id} /><input type="hidden" name="to" value="CANCELLED" />
              <ConfirmSubmit className={`${styles.btn} ${styles.danger}`} message="이 주문을 취소할까요? 결제가 완료된 주문은 토스페이먼츠에서 환불을 따로 진행해야 합니다."><FiXCircle />주문 취소</ConfirmSubmit>
            </form>
          )}
          {next && !needsTracking && (
            <form action={changeOrderStatus}>
              <input type="hidden" name="orderId" value={o.id} /><input type="hidden" name="to" value={next.to} />
              <button className={`${styles.btn} ${styles.primary}`}>{next.label} <FiArrowRight /></button>
            </form>
          )}
        </div>
      </div>

      {o.status !== 'CANCELLED' ? (
        <div className={styles.card} style={{ marginBottom: 14 }}>
          <div className={styles.steps}>
            {FLOW.map((s, i) => <div key={s} className={`${styles.step} ${i < flowIndex ? styles.stepDone : ''} ${i === flowIndex ? `${styles.stepDone} ${styles.stepNow}` : ''}`}>{ORDER_STATUS[s].label}</div>)}
          </div>
          {needsTracking && <p className={styles.notice}>제작이 끝나면 아래 <b>배송 정보</b>에 택배사와 송장번호를 입력하고 <b>저장 후 발송 처리</b>를 누르세요.</p>}
        </div>
      ) : <p className={styles.notice} style={{ marginBottom: 14 }}>취소된 주문입니다. 결제가 완료되었던 주문이라면 토스페이먼츠 관리자에서 환불 처리 여부를 확인하세요.</p>}

      <div className={styles.detail}>
        <div className={styles.stack}>
          <section className={styles.card}>
            <div className={styles.cardHead}><h2>주문 상품 {o.items.length}종</h2></div>
            {o.items.map((it) => {
              const s = designSpec(it.design.config);
              return (
                <div key={it.id} className={styles.itemRow}>
                  <div className={styles.thumb} style={{ borderRadius: 10 }}><DesignThumb spec={s} /></div>
                  <div>
                    <b>{s ? `맞춤 선반 · ${s.style}` : '맞춤 가구'}</b>
                    {s && (
                      <div className={styles.specChips}>
                        <span className={styles.chip}>{s.width} × {s.height} × {s.depth} cm</span>
                        <span className={styles.chip}><i className={styles.swatchDot} style={{ background: s.colorHex }} />{s.colorName}{s.category && ` · ${s.category}`}</span>
                        <span className={styles.chip}>{s.rows.length}단 ({s.rows.join('/')}cm)</span>
                        {s.doors.length > 0 && <span className={styles.chip}>도어 {s.doors.length}단</span>}
                        {s.drawers.length > 0 && <span className={styles.chip}>서랍 {s.drawers.length}단</span>}
                        <span className={styles.chip}>뒷판 {s.backPanel ? '있음' : '없음'}</span>
                        <span className={styles.chip}>{s.legs ? '다리형' : '기본 받침'}</span>
                      </div>
                    )}
                    <div className={styles.actionRow} style={{ marginTop: 10 }}>
                      <Link className={styles.btn} href={`/share/${it.design.shareCode}`} target="_blank"><FiExternalLink />디자인 열기</Link>
                      <span className={`${styles.muted} ${styles.mono}`}>코드 {it.design.shareCode}</span>
                    </div>
                  </div>
                  <div className={styles.num}><b>{won(it.price * it.quantity)}</b><div className={styles.muted}>{won(it.price)} × {it.quantity}</div></div>
                </div>
              );
            })}
            <div className={styles.totals}>
              <div><span>상품 금액</span><span>{won(itemsTotal)}</span></div>
              <div><span>배송비</span><span>{won(o.shippingFee)}</span></div>
              <div className={styles.grand}><span>결제 금액</span><span>{won(o.totalAmount + o.shippingFee)}</span></div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}><h2><FiTruck style={{ verticalAlign: -2, marginRight: 6 }} />배송 정보</h2>{o.shipping && <Badge tone="gray">{SHIPPING_STATUS[o.shipping.status]}</Badge>}</div>
            {/* key: 저장 후 React가 폼을 초기값으로 되돌리므로, 저장된 값이 바뀌면 새 초기값으로 다시 만든다 */}
            <form key={`ship-${o.shipping?.carrier ?? ''}-${o.shipping?.trackingNo ?? ''}`} action={saveShipping} className={styles.stack} style={{ gap: 10 }}>
              <input type="hidden" name="orderId" value={o.id} />
              <div className={styles.formRow}>
                <label className={styles.field}>택배사
                  <select name="carrier" defaultValue={o.shipping?.carrier ?? ''} required><option value="" disabled>선택</option>{CARRIERS.map((c) => <option key={c}>{c}</option>)}</select>
                </label>
                <label className={styles.field}>송장번호<input name="trackingNo" defaultValue={o.shipping?.trackingNo ?? ''} placeholder="숫자만" inputMode="numeric" /></label>
              </div>
              <div className={styles.actionRow}>
                <button className={styles.btn}>저장</button>
                {(o.status === 'PRODUCING' || o.status === 'PAID') && <button className={`${styles.btn} ${styles.primary}`} name="ship" value="1">저장 후 발송 처리</button>}
                {o.shipping?.shippedAt && <span className={styles.muted}>발송 {dateTime(o.shipping.shippedAt)}</span>}
                {o.shipping?.deliveredAt && <span className={styles.muted}>· 배송 완료 {dateTime(o.shipping.deliveredAt)}</span>}
              </div>
            </form>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}><h2>관리자 메모</h2><span className={styles.muted}>고객에게 보이지 않습니다</span></div>
            <form key={`memo-${o.adminMemo ?? ''}`} action={saveMemo} className={styles.stack} style={{ gap: 10 }}>
              <input type="hidden" name="orderId" value={o.id} />
              <label className={styles.field}><span className="sr-only">메모</span><textarea name="memo" defaultValue={o.adminMemo ?? ''} placeholder="제작 특이사항, 고객 요청, 설치 일정 등" /></label>
              <div><button className={styles.btn}>메모 저장</button></div>
            </form>
          </section>
        </div>

        <div className={styles.stack}>
          <section className={styles.card}>
            <div className={styles.cardHead}><h2>주문자</h2>{o.user.id && <Link href={`/admin/users/${o.user.id}`}>회원 정보 →</Link>}</div>
            <dl className={styles.dl}>
              <dt>이름</dt><dd>{o.user.name ?? '이름 없음'}</dd>
              <dt>이메일</dt><dd>{o.user.email ?? '-'}</dd>
              <dt>가입 방법</dt><dd>{o.user.accounts.map((a) => PROVIDERS[a.provider] ?? a.provider).join(', ') || '이메일'}</dd>
              <dt>누적 주문</dt><dd>{o.user._count.orders}건</dd>
            </dl>
          </section>
          <section className={styles.card}>
            <div className={styles.cardHead}><h2>배송지</h2></div>
            <dl className={styles.dl}>
              <dt>받는 분</dt><dd>{o.shipName}</dd>
              <dt>연락처</dt><dd><a href={`tel:${o.shipPhone}`}>{o.shipPhone}</a></dd>
              <dt>주소</dt><dd>({o.shipZipCode}) {o.shipAddress}{o.shipDetail ? ` ${o.shipDetail}` : ''}</dd>
            </dl>
          </section>
          <section className={styles.card}>
            <div className={styles.cardHead}><h2>결제</h2>{o.payment && <Badge tone={o.payment.status === 'PAID' ? 'green' : o.payment.status === 'PENDING' ? 'gray' : 'red'}>{PAYMENT_STATUS[o.payment.status]}</Badge>}</div>
            {o.payment ? (
              <dl className={styles.dl}>
                <dt>금액</dt><dd>{won(o.payment.amount)}</dd>
                <dt>수단</dt><dd>{o.payment.method ? PAYMENT_METHOD[o.payment.method] ?? o.payment.method : '-'}</dd>
                <dt>결제 일시</dt><dd>{o.payment.paidAt ? dateTime(o.payment.paidAt) : '-'}</dd>
                {o.payment.cancelledAt && <><dt>취소 일시</dt><dd>{dateTime(o.payment.cancelledAt)}</dd></>}
                <dt>결제 키</dt><dd className={styles.mono}>{o.payment.paymentKey ?? '-'}</dd>
              </dl>
            ) : <p className={styles.muted}>결제 정보가 없습니다.</p>}
          </section>
          <section className={styles.card}>
            <div className={styles.cardHead}><h2>처리 이력</h2></div>
            <ol className={styles.timeline}>
              {o.events.map((e) => (
                <li key={e.id}><div>
                  {e.type === 'STATUS' && <>상태 변경: {e.fromValue ? ORDER_STATUS[e.fromValue as keyof typeof ORDER_STATUS]?.label : ''} → <b>{e.toValue ? ORDER_STATUS[e.toValue as keyof typeof ORDER_STATUS]?.label : ''}</b>{e.note ? ` (${e.note})` : ''}</>}
                  {e.type === 'SHIPPING' && <>배송 정보: <b>{e.toValue}</b></>}
                  {e.type === 'MEMO' && <>메모: {e.note}</>}
                  {e.type === 'NOTE' && <>{e.note}</>}
                  <small>{dateTime(e.createdAt)} · {e.actor ?? '시스템'}</small>
                </div></li>
              ))}
              <li><div>주문 접수<small>{dateTime(o.createdAt)} · 고객</small></div></li>
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
