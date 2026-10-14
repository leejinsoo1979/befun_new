import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { dateTime, orderNo, ORDER_STATUS } from '@/app/admin/_lib/format';
import { productionSheetFor } from '@/lib/commerce/production';
import { markProduced, startProduction } from '../actions';
import { PrintButton } from './PrintButton';

const STYLE: Record<string, string> = { grid: 'Grid', slant: 'Slant', pixel: 'Pixel', gradient: 'Gradient', pattern: 'Pattern', mosaic: 'Mosaic' };
const LEG: Record<string, string> = { silver: '실버', black: '블랙', panel: '패널' };

/** 작업지시서(인쇄용): 사양 · 재단 목록 · 도어/서랍 · 배송지 */
export default async function FactoryOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { design: { select: { shareCode: true, config: true } } } },
      events: { where: { note: '제작 완료 — 출고 대기' }, select: { createdAt: true }, take: 1 },
    },
  });
  if (!o) notFound();
  const { sheet, snapshot } = productionSheetFor(o.productionSheet, o.items);
  const no = orderNo(o.id, o.createdAt);
  const canWork = o.status === 'PAID' || o.status === 'PRODUCING';

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/factory" className="text-sm text-gray-500">← 작업 목록</Link>
        <div className="flex gap-2 text-sm">
          <PrintButton />
          <a href={`/api/factory/${o.id}/cutlist`} className="rounded-md border border-gray-300 bg-white px-3 py-1.5">재단 목록 CSV</a>
          {o.status === 'PAID' && <form action={startProduction}><input type="hidden" name="orderId" value={o.id} /><button className="rounded-md bg-gray-900 px-3 py-1.5 text-white">제작 시작</button></form>}
          {o.status === 'PRODUCING' && !o.events.length && <form action={markProduced}><input type="hidden" name="orderId" value={o.id} /><button className="rounded-md bg-green-700 px-3 py-1.5 text-white">제작 완료</button></form>}
        </div>
      </div>

      <article className="rounded-lg border border-gray-200 bg-white p-6 print:border-0 print:p-0">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-gray-900 pb-4">
          <div>
            <p className="text-xs text-gray-500">BEFUN 작업지시서</p>
            <h1 className="font-mono text-2xl font-bold">{no}</h1>
            <p className="text-sm text-gray-500">주문 {dateTime(o.createdAt)} · {ORDER_STATUS[o.status].label}{o.events[0] ? ` · 제작 완료 ${dateTime(o.events[0].createdAt)}` : ''}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{o.shipName} · {o.shipPhone}</p>
            <p>({o.shipZipCode}) {o.shipAddress} {o.shipDetail ?? ''}</p>
            <p className="text-xs text-gray-400">{snapshot ? `지시서 생성 ${dateTime(new Date(sheet.createdAt))}` : '미리보기 — 제작 시작 시 저장'}</p>
          </div>
        </header>
        {!canWork && <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-700">현재 상태({ORDER_STATUS[o.status].label})는 제작 대상이 아닙니다.</p>}

        {sheet.items.map((item, idx) => (
          <section key={idx} className="mb-8 break-inside-avoid">
            <h2 className="mb-2 text-lg font-bold">제품 {idx + 1} <span className="font-normal text-gray-500">× {item.quantity}개 · 디자인 {item.designShareCode}</span></h2>
            {'error' in item ? (
              <p className="rounded bg-red-50 p-3 text-sm text-red-600">{item.error}</p>
            ) : (
              <>
                <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                  <div><dt className="text-xs text-gray-500">스타일</dt><dd>{STYLE[item.spec.style] ?? item.spec.style}</dd></div>
                  <div><dt className="text-xs text-gray-500">외곽(W×H×D)</dt><dd className="font-semibold">{item.spec.widthCm}×{item.spec.heightCm}×{item.spec.depthCm}cm</dd></div>
                  <div><dt className="text-xs text-gray-500">단 높이(아래→위)</dt><dd>{item.spec.rows.join(' / ')}cm</dd></div>
                  <div><dt className="text-xs text-gray-500">색상</dt><dd>{item.spec.color}</dd></div>
                  <div><dt className="text-xs text-gray-500">뒷판</dt><dd>{item.spec.backPanel ? '있음' : '없음'}</dd></div>
                  <div><dt className="text-xs text-gray-500">받침</dt><dd>{item.spec.base}{item.spec.legFinish ? ` · ${LEG[item.spec.legFinish] ?? item.spec.legFinish}` : ''}</dd></div>
                  <div><dt className="text-xs text-gray-500">판재 수(1세트)</dt><dd>{item.totals.panels}장</dd></div>
                  <div><dt className="text-xs text-gray-500">판재 면적(1세트)</dt><dd>{item.totals.areaM2}㎡</dd></div>
                </dl>
                <table className="mb-4 w-full border-collapse text-sm">
                  <thead><tr className="border-b border-gray-900 text-left text-xs"><th className="py-1.5">부재</th><th>길이(mm)</th><th>폭(mm)</th><th>두께(mm)</th><th className="text-right">1세트</th><th className="text-right">총 수량</th></tr></thead>
                  <tbody>
                    {item.cutList.map((c, i) => (
                      <tr key={i} className="border-b border-gray-100"><td className="py-1.5">{c.part}</td><td className="font-mono">{c.lengthMm}</td><td className="font-mono">{c.widthMm}</td><td className="font-mono">{c.thicknessMm}</td><td className="text-right">{c.qty}</td><td className="text-right font-semibold">{c.qty * item.quantity}</td></tr>
                    ))}
                  </tbody>
                </table>
                {item.fronts.length > 0 && (
                  <table className="mb-3 w-full border-collapse text-sm">
                    <thead><tr className="border-b border-gray-900 text-left text-xs"><th className="py-1.5">전면</th><th>폭(mm)</th><th>높이(mm)</th><th>경첩</th><th className="text-right">1세트</th><th className="text-right">총 수량</th></tr></thead>
                    <tbody>
                      {item.fronts.map((f, i) => (
                        <tr key={i} className="border-b border-gray-100"><td className="py-1.5">{f.type}</td><td className="font-mono">{f.widthMm}</td><td className="font-mono">{f.heightMm}</td><td>{f.hinge ?? '-'}</td><td className="text-right">{f.qty}</td><td className="text-right font-semibold">{f.qty * item.quantity}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {item.notes.map((n) => <p key={n} className="text-xs text-amber-700">※ {n}</p>)}
                <p className="mt-2 text-xs text-gray-400 print:hidden"><a href={`/share/${item.designShareCode}`} target="_blank" rel="noreferrer" className="underline">3D 디자인 열기</a></p>
              </>
            )}
          </section>
        ))}
      </article>
    </>
  );
}
