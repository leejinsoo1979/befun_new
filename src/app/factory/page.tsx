import Link from 'next/link';
import { prisma } from '@/lib/db';
import { dateTime, orderNo, ORDER_STATUS } from '@/app/admin/_lib/format';
import { designSpec } from '@/app/admin/_lib/spec';
import { startProduction } from './actions';

/** 공장 작업 목록: 결제 완료(제작 대기) · 제작 중 */
export default async function FactoryPage() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ['PAID', 'PRODUCING'] } },
    orderBy: { createdAt: 'asc' },
    include: {
      items: { include: { design: { select: { config: true } } } },
      payment: { select: { paidAt: true } },
      events: { where: { note: '제작 완료 — 출고 대기' }, select: { id: true }, take: 1 },
    },
  });
  const waiting = orders.filter((o) => o.status === 'PAID').length;

  return (
    <>
      <div className="mb-5 flex items-end justify-between">
        <div><h1 className="text-2xl font-bold">작업 목록</h1><p className="text-sm text-gray-500">제작 대기 {waiting}건 · 제작 중 {orders.length - waiting}건 · 오래된 주문 먼저</p></div>
      </div>
      {orders.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">대기 중인 작업이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr><th className="px-4 py-3">주문번호</th><th className="px-4 py-3">결제</th><th className="px-4 py-3">제품</th><th className="px-4 py-3">상태</th><th className="px-4 py-3 text-right">작업</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const done = o.events.length > 0;
                return (
                  <tr key={o.id} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-3 font-mono font-semibold"><Link href={`/factory/${o.id}`}>{orderNo(o.id, o.createdAt)}</Link></td>
                    <td className="px-4 py-3 text-gray-500">{o.payment?.paidAt ? dateTime(o.payment.paidAt) : dateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      {o.items.map((it) => {
                        const s = designSpec(it.design.config);
                        return <div key={it.id}>{s?.summary ?? '사양 확인 필요'} <b>× {it.quantity}</b></div>;
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={o.status === 'PAID' ? 'text-blue-600' : 'text-amber-600'}>{ORDER_STATUS[o.status].label}</span>
                      {done && <div className="text-xs text-green-600">제작 완료 · 출고 대기</div>}
                      {!o.productionSheet && <div className="text-xs text-gray-400">지시서 미저장</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/factory/${o.id}`} className="rounded-md border border-gray-300 px-3 py-1.5">작업지시서</Link>
                        {o.status === 'PAID' && (
                          <form action={startProduction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded-md bg-gray-900 px-3 py-1.5 text-white">제작 시작</button></form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
