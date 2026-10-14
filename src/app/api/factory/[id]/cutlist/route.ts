import { NextRequest, NextResponse } from 'next/server';
import { getFactoryStaff } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { productionSheetFor } from '@/lib/commerce/production';
import { orderNo } from '@/app/admin/_lib/format';

const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** GET /api/factory/[id]/cutlist — 재단 목록 CSV(엑셀용 BOM 포함). 관리자·공장 담당자만 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getFactoryStaff())) return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  const { id } = await params;
  const o = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { design: { select: { shareCode: true, config: true } } } } },
  });
  if (!o) return NextResponse.json({ error: '주문 없음' }, { status: 404 });
  const { sheet } = productionSheetFor(o.productionSheet, o.items);
  const no = orderNo(o.id, o.createdAt);
  const rows = [['주문번호', '제품', '디자인', '색상', '구분', '부재', '길이(mm)', '폭(mm)', '두께(mm)', '1세트 수량', '주문 수량', '총 수량', '비고']];
  sheet.items.forEach((item, idx) => {
    if ('error' in item) { rows.push([no, String(idx + 1), item.designShareCode, '', '오류', '', '', '', '', '', String(item.quantity), '', item.error]); return; }
    for (const c of item.cutList) rows.push([no, String(idx + 1), item.designShareCode, item.spec.color, '판재', c.part, String(c.lengthMm), String(c.widthMm), String(c.thicknessMm), String(c.qty), String(item.quantity), String(c.qty * item.quantity), '']);
    for (const f of item.fronts) rows.push([no, String(idx + 1), item.designShareCode, item.spec.color, '전면', f.type, String(f.heightMm), String(f.widthMm), '', String(f.qty), String(item.quantity), String(f.qty * item.quantity), f.hinge ?? '']);
  });
  const csv = '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
  return new NextResponse(csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${no}-cutlist.csv"` },
  });
}
