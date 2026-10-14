import Link from 'next/link';
import { FiAlertCircle, FiChevronRight, FiCreditCard, FiLayers, FiShoppingBag, FiTrendingUp, FiUserPlus } from 'react-icons/fi';
import { prisma } from '@/lib/db';
import { BarChart } from './_components/BarChart';
import { StatusBadge } from './_components/Badge';
import { designSpec } from './_lib/spec';
import { ORDER_STATUS, ORDER_STATUSES, PAID_STATUSES, PERIODS, changePct, dateTime, dayKey, daysAgo, num, orderNo, periodRange, won, type Period } from './_lib/format';
import styles from './admin.module.css';

function Delta({ cur, prev }: { cur: number; prev: number }) {
  const pct = changePct(cur, prev);
  if (pct === null) return <span className={`${styles.delta} ${styles.up}`}>신규</span>;
  if (pct === 0) return <span className={styles.delta}>이전 기간과 같음</span>;
  return <span className={`${styles.delta} ${pct > 0 ? styles.up : styles.down}`}>{pct > 0 ? '▲' : '▼'} {Math.abs(pct)}% <span className={styles.muted}>이전 기간 대비</span></span>;
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const sp = await searchParams;
  const period = (PERIODS.some((p) => p.id === sp.period) ? sp.period : '30d') as Period;
  const { start, prevStart, days } = periodRange(period);
  const paid = { status: { in: PAID_STATUSES } };
  const stalled = daysAgo(7);

  const [cur, prev, newUsers, prevUsers, designs, prevDesigns, byStatus, recentOrders, recentUsers, needShip, stalledProd, pendingPay, periodOrders, orderedDesigns] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalAmount: true }, _count: true, where: { ...paid, createdAt: { gte: start } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, _count: true, where: { ...paid, createdAt: { gte: prevStart, lt: start } } }),
    prisma.user.count({ where: { createdAt: { gte: start } } }),
    prisma.user.count({ where: { createdAt: { gte: prevStart, lt: start } } }),
    prisma.design.count({ where: { createdAt: { gte: start } } }),
    prisma.design.count({ where: { createdAt: { gte: prevStart, lt: start } } }),
    prisma.order.groupBy({ by: ['status'], _count: true }),
    prisma.order.findMany({ take: 6, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } }),
    prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, createdAt: true, accounts: { select: { provider: true } }, passwordHash: true } }),
    prisma.order.count({ where: { status: 'PRODUCING', OR: [{ shipping: null }, { shipping: { trackingNo: null } }] } }),
    prisma.order.count({ where: { status: 'PRODUCING', updatedAt: { lt: stalled } } }),
    prisma.order.count({ where: { status: 'PENDING', createdAt: { lt: daysAgo(1) } } }),
    prisma.order.findMany({ where: { ...paid, createdAt: { gte: start } }, select: { createdAt: true, totalAmount: true } }),
    prisma.orderItem.findMany({ where: { order: { ...paid, createdAt: { gte: start } } }, select: { quantity: true, design: { select: { config: true } } }, take: 2000 }),
  ]);

  const revenue = cur._sum.totalAmount ?? 0, prevRevenue = prev._sum.totalAmount ?? 0;
  const aov = cur._count ? revenue / cur._count : 0, prevAov = prev._count ? prevRevenue / prev._count : 0;
  const statusCount = Object.fromEntries(byStatus.map((s) => [s.status, s._count])) as Record<string, number>;

  // 일별 매출(KST) — 오늘이면 최근 7일을 보여준다
  const chartDays = Math.max(days, 7);
  const buckets = new Map<string, { value: number; count: number }>();
  for (let i = chartDays - 1; i >= 0; i--) buckets.set(dayKey(daysAgo(i)), { value: 0, count: 0 });
  const chartOrders = days >= 7 ? periodOrders : await prisma.order.findMany({ where: { ...paid, createdAt: { gte: daysAgo(7) } }, select: { createdAt: true, totalAmount: true } });
  for (const o of chartOrders) { const b = buckets.get(dayKey(o.createdAt)); if (b) { b.value += o.totalAmount; b.count++; } }
  const chart = [...buckets].map(([k, v]) => ({ label: k.slice(5).replace('-', '/'), ...v }));

  // 인기 스타일·색상(결제 주문 기준)
  const styleCount = new Map<string, number>(), colorCount = new Map<string, { n: number; hex: string }>();
  for (const it of orderedDesigns) {
    const s = designSpec(it.design.config); if (!s) continue;
    styleCount.set(s.style, (styleCount.get(s.style) ?? 0) + it.quantity);
    const c = colorCount.get(s.colorName) ?? { n: 0, hex: s.colorHex }; c.n += it.quantity; colorCount.set(s.colorName, c);
  }
  const topStyles = [...styleCount].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topColors = [...colorCount].sort((a, b) => b[1].n - a[1].n).slice(0, 5);
  const styleMax = Math.max(1, ...topStyles.map((s) => s[1])), colorMax = Math.max(1, ...topColors.map((c) => c[1].n));

  const todos = [
    { n: statusCount.PAID ?? 0, title: '제작 시작 대기', sub: '결제 완료 주문 — 제작에 들어가세요', href: '/admin/orders?status=PAID' },
    { n: needShip, title: '송장 미입력', sub: '제작 중인데 택배사·송장번호가 없음', href: '/admin/orders?status=PRODUCING' },
    { n: stalledProd, title: '제작 지연', sub: '제작 중 상태로 7일 이상 지난 주문', href: '/admin/orders?status=PRODUCING&sort=old' },
    { n: pendingPay, title: '미결제 24시간 경과', sub: '결제 대기 주문 — 확인 또는 취소', href: '/admin/orders?status=PENDING&sort=old' },
  ];

  return (
    <>
      <div className={styles.pageHead}>
        <div><h1>대시보드</h1><p>{dayKey(start)} ~ 오늘 · 결제 완료 이후 주문 기준</p></div>
        <nav className={styles.seg} aria-label="기간">{PERIODS.map((p) => <Link key={p.id} href={`/admin?period=${p.id}`} aria-current={p.id === period ? 'page' : undefined}>{p.label}</Link>)}</nav>
      </div>

      <div className={styles.grid4}>
        <div className={`${styles.card} ${styles.kpi}`}><span><FiTrendingUp />매출</span><strong>{won(revenue)}</strong><Delta cur={revenue} prev={prevRevenue} /></div>
        <div className={`${styles.card} ${styles.kpi}`}><span><FiShoppingBag />주문</span><strong>{num(cur._count)}건</strong><Delta cur={cur._count} prev={prev._count} /></div>
        <div className={`${styles.card} ${styles.kpi}`}><span><FiCreditCard />객단가</span><strong>{won(aov)}</strong><Delta cur={aov} prev={prevAov} /></div>
        <div className={`${styles.card} ${styles.kpi}`}><span><FiUserPlus />신규 회원 · 저장 디자인</span><strong>{num(newUsers)}명 · {num(designs)}개</strong><Delta cur={newUsers + designs} prev={prevUsers + prevDesigns} /></div>
      </div>

      <div className={styles.grid2}>
        <section className={styles.card}>
          <div className={styles.cardHead}><h2>일별 매출</h2><span className={styles.muted}>막대에 마우스를 올리면 금액·건수</span></div>
          <BarChart data={chart} />
        </section>
        <section className={styles.card}>
          <div className={styles.cardHead}><h2><FiAlertCircle style={{ verticalAlign: -2, marginRight: 6 }} />처리할 일</h2></div>
          <div className={styles.todo}>
            {todos.map((t) => (
              <Link key={t.title} href={t.href} className={`${styles.todoItem} ${t.n ? '' : styles.zero}`}>
                <b>{t.n}</b><span>{t.title}<small>{t.sub}</small></span><FiChevronRight />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.card} style={{ marginTop: 14 }}>
        <div className={styles.cardHead}><h2>주문 단계별 현황</h2><Link href="/admin/orders">전체 주문 →</Link></div>
        <div className={styles.pipeline}>
          {ORDER_STATUSES.map((s) => <Link key={s} href={`/admin/orders?status=${s}`} className={styles.stage}><span>{ORDER_STATUS[s].label}</span><strong>{num(statusCount[s] ?? 0)}</strong></Link>)}
        </div>
      </section>

      <div className={styles.grid2}>
        <section className={styles.card}>
          <div className={styles.cardHead}><h2>최근 주문</h2><Link href="/admin/orders">모두 보기 →</Link></div>
          {recentOrders.length === 0 ? <div className={styles.empty}><strong>아직 주문이 없습니다</strong>첫 주문이 들어오면 여기에 표시됩니다.</div> : (
            <table className={styles.table}><tbody>{recentOrders.map((o) => (
              <tr key={o.id}>
                <td><Link className={styles.rowLink} href={`/admin/orders/${o.id}`}><b>{orderNo(o.id, o.createdAt)}</b></Link><div className={styles.muted}>{dateTime(o.createdAt)}</div></td>
                <td>{o.user.name ?? o.user.email ?? '이름 없음'}</td>
                <td className={styles.num}>{won(o.totalAmount)}</td>
                <td><StatusBadge status={o.status} /></td>
              </tr>
            ))}</tbody></table>
          )}
        </section>
        <section className={styles.card}>
          <div className={styles.cardHead}><h2>인기 스타일</h2><span className={styles.muted}>판매 수량</span></div>
          {topStyles.length === 0 ? <p className={styles.muted}>기간 내 판매 데이터가 없습니다.</p> : (
            <div className={styles.rank}>{topStyles.map(([s, n]) => <div key={s} className={styles.rankRow}><span>{s}</span><span className={styles.rankBar}><i style={{ width: `${(n / styleMax) * 100}%` }} /></span><em>{n}</em></div>)}</div>
          )}
          <div className={styles.cardHead} style={{ marginTop: 22 }}><h2>인기 색상</h2></div>
          {topColors.length === 0 ? <p className={styles.muted}>기간 내 판매 데이터가 없습니다.</p> : (
            <div className={styles.rank}>{topColors.map(([c, v]) => <div key={c} className={styles.rankRow}><span><i className={styles.swatchDot} style={{ background: v.hex }} />{c}</span><span className={styles.rankBar}><i style={{ width: `${(v.n / colorMax) * 100}%` }} /></span><em>{v.n}</em></div>)}</div>
          )}
        </section>
      </div>

      <section className={styles.card} style={{ marginTop: 14 }}>
        <div className={styles.cardHead}><h2>최근 가입 회원</h2><Link href="/admin/users">회원 관리 →</Link></div>
        {recentUsers.length === 0 ? <p className={styles.muted}>아직 회원이 없습니다.</p> : (
          <table className={styles.table}><tbody>{recentUsers.map((u) => (
            <tr key={u.id}>
              <td><Link className={styles.rowLink} href={`/admin/users/${u.id}`}><b>{u.name ?? '이름 없음'}</b></Link></td>
              <td>{u.email ?? <span className={styles.muted}>이메일 미동의</span>}</td>
              <td className={styles.muted}>{[u.passwordHash ? '이메일' : null, ...u.accounts.map((a) => ({ google: '구글', kakao: '카카오', naver: '네이버' } as Record<string, string>)[a.provider] ?? a.provider)].filter(Boolean).join(' · ')}</td>
              <td className={styles.muted}>{dateTime(u.createdAt)}</td>
            </tr>
          ))}</tbody></table>
        )}
      </section>
      <p className={styles.muted} style={{ marginTop: 14 }}><FiLayers style={{ verticalAlign: -2 }} /> 매출·객단가는 결제 완료·제작·배송 단계 주문 합계(배송비 포함 전), 취소·결제 대기는 제외합니다.</p>
    </>
  );
}
