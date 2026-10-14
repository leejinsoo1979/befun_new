'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getAdmin } from '@/lib/admin';
import { ORDER_STATUS, type OrderStatusValue } from './format';

/** 주문 상태 변경 — 서버에서 관리자 권한을 다시 확인한다 */
export async function updateOrderStatus(formData: FormData) {
  if (!(await getAdmin())) throw new Error('관리자 권한이 필요합니다.');
  const id = String(formData.get('orderId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!id || !(status in ORDER_STATUS)) throw new Error('잘못된 요청입니다.');
  await prisma.order.update({ where: { id }, data: { status: status as OrderStatusValue } });
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}

/** 회원 권한 변경. 자기 자신의 관리자 권한은 해제할 수 없다(잠김 방지). */
export async function updateUserRole(formData: FormData) {
  const admin = await getAdmin();
  if (!admin) throw new Error('관리자 권한이 필요합니다.');
  const id = String(formData.get('userId') ?? '');
  const role = String(formData.get('role') ?? '');
  if (!id || (role !== 'USER' && role !== 'ADMIN')) throw new Error('잘못된 요청입니다.');
  if (id === admin.id && role !== 'ADMIN') throw new Error('본인의 관리자 권한은 해제할 수 없습니다.');
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath('/admin/users');
}
