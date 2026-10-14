import type { Prisma } from '@/generated/prisma/client';
import type { OrderStatus } from '@/generated/prisma/enums';
import { ORDER_STATUSES } from './format';

export type OrderFilter = { status?: string; q?: string; from?: string; to?: string; sort?: string; page?: string };

/** 주문 목록·CSV 공통 검색 조건 */
export function orderWhere(sp: OrderFilter): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  if (sp.status && (ORDER_STATUSES as string[]).includes(sp.status)) where.status = sp.status as OrderStatus;
  const range: Prisma.DateTimeFilter = {};
  if (sp.from) range.gte = new Date(`${sp.from}T00:00:00+09:00`);
  if (sp.to) range.lt = new Date(new Date(`${sp.to}T00:00:00+09:00`).getTime() + 86400000);
  if (sp.from || sp.to) where.createdAt = range;
  const q = sp.q?.trim();
  if (q) {
    const code = q.replace(/^B\d{6}-/i, '').toLowerCase();
    where.OR = [
      { id: { endsWith: code } },
      { shipName: { contains: q, mode: 'insensitive' } },
      { shipPhone: { contains: q.replace(/\D/g, '') || q } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { shipping: { trackingNo: { contains: q } } },
    ];
  }
  return where;
}
