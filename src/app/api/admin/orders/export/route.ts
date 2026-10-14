import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdmin } from '@/lib/admin';
import { orderWhere } from '@/app/admin/_lib/queries';
import { ORDER_STATUS, PAYMENT_METHOD, dateTime, orderNo } from '@/app/admin/_lib/format';
import { designSpec } from '@/app/admin/_lib/spec';

/** 주문 목록 CSV(엑셀) — 현재 필터 그대로. 관리자만. */
export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const orders = await prisma.order.findMany({
    where: orderWhere(sp), orderBy: { createdAt: 'desc' }, take: 5000,
    include: { user: { select: { name: true, email: true } }, payment: true, shipping: true, items: { include: { design: { select: { shareCode: true, config: true } } } } },
  });
  const cell = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const header = ['주문번호', '주문일시', '상태', '주문자', '이메일', '받는 분', '연락처', '우편번호', '주소', '상세주소', '상품 사양', '수량', '상품 금액', '배송비', '결제 금액', '결제수단', '결제상태', '택배사', '송장번호', '디자인 코드', '관리자 메모'];
  const rows = orders.map((o) => [
    orderNo(o.id, o.createdAt), dateTime(o.createdAt), ORDER_STATUS[o.status].label, o.user.name, o.user.email, o.shipName, o.shipPhone, o.shipZipCode, o.shipAddress, o.shipDetail,
    o.items.map((i) => designSpec(i.design.config)?.summary ?? '맞춤 선반').join(' / '), o.items.reduce((a, i) => a + i.quantity, 0),
    o.totalAmount, o.shippingFee, o.totalAmount + o.shippingFee, o.payment?.method ? PAYMENT_METHOD[o.payment.method] ?? o.payment.method : '', o.payment?.status ?? '',
    o.shipping?.carrier, o.shipping?.trackingNo, o.items.map((i) => i.design.shareCode).join(' '), o.adminMemo,
  ]);
  const csv = '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="befun-orders-${stamp}.csv"` } });
}
