'use server';

import { revalidatePath } from 'next/cache';
import { getFactoryStaff } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { productionSheetFor } from '@/lib/commerce/production';

/** 제작 시작: 결제 완료 → 제작 중. 지시서가 없던 주문은 이 시점 스냅샷을 저장 */
export async function startProduction(formData: FormData) {
  const staff = await getFactoryStaff();
  if (!staff) throw new Error('공장 작업 권한이 없습니다.');
  const orderId = String(formData.get('orderId') ?? '');
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { design: { select: { shareCode: true, config: true } } } } },
  });
  if (!order || order.status !== 'PAID') throw new Error('제작을 시작할 수 없는 주문입니다.');
  const { sheet, snapshot } = productionSheetFor(order.productionSheet, order.items);
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: 'PRODUCING', ...(snapshot ? {} : { productionSheet: sheet as object, productionReadyAt: new Date() }) },
    }),
    prisma.orderEvent.create({ data: { orderId, type: 'STATUS', fromValue: 'PAID', toValue: 'PRODUCING', note: '공장 제작 시작', actor: staff.email ?? staff.name ?? '공장' } }),
  ]);
  revalidatePath('/factory');
  revalidatePath(`/factory/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
}

/** 제작 완료 기록(발송·송장은 관리자 화면에서) */
export async function markProduced(formData: FormData) {
  const staff = await getFactoryStaff();
  if (!staff) throw new Error('공장 작업 권한이 없습니다.');
  const orderId = String(formData.get('orderId') ?? '');
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (order?.status !== 'PRODUCING') throw new Error('제작 중인 주문이 아닙니다.');
  await prisma.orderEvent.create({ data: { orderId, type: 'NOTE', note: '제작 완료 — 출고 대기', actor: staff.email ?? staff.name ?? '공장' } });
  revalidatePath('/factory');
  revalidatePath(`/factory/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
}
