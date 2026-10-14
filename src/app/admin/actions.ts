'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getAdmin } from '@/lib/admin';
import type { OrderStatus } from '@/generated/prisma/enums';
import { ORDER_STATUSES } from './_lib/format';

async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new Error('관리자 권한이 필요합니다.');
  return admin;
}
const actorOf = (a: { email: string | null; name: string | null }) => a.email ?? a.name ?? '관리자';
const isStatus = (v: string): v is OrderStatus => (ORDER_STATUSES as string[]).includes(v);

/** 상태 변경 + 결제/배송 레코드 동기화 + 이력 기록 */
async function applyStatus(orderId: string, to: OrderStatus, actor: string, note?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true, shipping: true } });
  if (!order || order.status === to) return;
  if (order.status === 'DELIVERED' && to === 'CANCELLED') throw new Error('배송 완료된 주문은 취소할 수 없습니다. 반품으로 처리해 주세요.');
  if (to === 'SHIPPING' && !order.shipping?.trackingNo && !order.shipping?.carrier) throw new Error('발송 처리 전에 택배사와 송장번호를 입력해 주세요.');
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: to } });
    if (to === 'PAID' && order.payment && order.payment.status === 'PENDING') {
      await tx.payment.update({ where: { orderId }, data: { status: 'PAID', paidAt: order.payment.paidAt ?? now } });
    }
    if (to === 'CANCELLED' && order.payment && order.payment.status === 'PENDING') {
      await tx.payment.update({ where: { orderId }, data: { status: 'CANCELLED', cancelledAt: now } });
    }
    if (to === 'PRODUCING' && !order.shipping) await tx.shipping.create({ data: { orderId, status: 'PREPARING' } });
    if (to === 'SHIPPING') await tx.shipping.update({ where: { orderId }, data: { status: 'SHIPPED', shippedAt: order.shipping?.shippedAt ?? now } });
    if (to === 'DELIVERED') {
      await tx.shipping.upsert({ where: { orderId }, create: { orderId, status: 'DELIVERED', deliveredAt: now }, update: { status: 'DELIVERED', deliveredAt: now } });
    }
    await tx.orderEvent.create({ data: { orderId, type: 'STATUS', fromValue: order.status, toValue: to, note: note || null, actor } });
  });
}

export async function changeOrderStatus(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = String(formData.get('orderId') ?? '');
  const to = String(formData.get('to') ?? '');
  if (!orderId || !isStatus(to)) throw new Error('잘못된 요청입니다.');
  await applyStatus(orderId, to, actorOf(admin), String(formData.get('note') ?? '').slice(0, 300));
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}

export async function bulkChangeStatus(formData: FormData) {
  const admin = await requireAdmin();
  const to = String(formData.get('to') ?? '');
  const ids = formData.getAll('ids').map(String).filter(Boolean).slice(0, 200);
  if (!isStatus(to) || !ids.length) throw new Error('변경할 주문과 상태를 선택해 주세요.');
  const failed: string[] = [];
  for (const id of ids) {
    try { await applyStatus(id, to, actorOf(admin), '일괄 변경'); } catch { failed.push(id); }
  }
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  if (failed.length) throw new Error(`${failed.length}건은 변경하지 못했습니다(송장 미입력·배송 완료 취소 등).`);
}

export async function saveShipping(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = String(formData.get('orderId') ?? '');
  const carrier = String(formData.get('carrier') ?? '').trim().slice(0, 40);
  const trackingNo = String(formData.get('trackingNo') ?? '').replace(/\s/g, '').slice(0, 40);
  if (!orderId || !carrier) throw new Error('택배사를 선택해 주세요.');
  const prev = await prisma.shipping.findUnique({ where: { orderId } });
  await prisma.shipping.upsert({ where: { orderId }, create: { orderId, carrier, trackingNo: trackingNo || null }, update: { carrier, trackingNo: trackingNo || null } });
  await prisma.orderEvent.create({ data: { orderId, type: 'SHIPPING', fromValue: prev ? `${prev.carrier ?? ''} ${prev.trackingNo ?? ''}`.trim() || null : null, toValue: `${carrier} ${trackingNo}`.trim(), actor: actorOf(admin) } });
  if (formData.get('ship') === '1') await applyStatus(orderId, 'SHIPPING', actorOf(admin));
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
}

export async function saveMemo(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = String(formData.get('orderId') ?? '');
  const memo = String(formData.get('memo') ?? '').slice(0, 2000);
  await prisma.order.update({ where: { id: orderId }, data: { adminMemo: memo || null } });
  await prisma.orderEvent.create({ data: { orderId, type: 'MEMO', note: memo ? memo.slice(0, 120) : '메모 삭제', actor: actorOf(admin) } });
  revalidatePath(`/admin/orders/${orderId}`);
}

/** 회원 권한 변경. 자기 자신의 관리자 권한은 해제할 수 없다. */
export async function setUserRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const role = String(formData.get('role') ?? '');
  if (!userId || (role !== 'USER' && role !== 'ADMIN')) throw new Error('잘못된 요청입니다.');
  if (userId === admin.id && role !== 'ADMIN') throw new Error('본인의 관리자 권한은 해제할 수 없습니다.');
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
}
