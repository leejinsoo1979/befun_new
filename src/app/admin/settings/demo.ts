'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getAdmin } from '@/lib/admin';
import type { OrderStatus } from '@/generated/prisma/enums';

/** 데모 데이터 식별: 회원 이메일 도메인 */
const DEMO_DOMAIN = '@demo.befun.test';
const NAMES = ['김서연', '이도윤', '박지우', '최하준', '정민서', '강예준', '조수아', '윤지호', '장하은', '임시우'];
const VIA = ['kakao', 'naver', 'google', 'email'] as const;
const STYLES = ['grid', 'slant', 'pixel', 'gradient', 'pattern', 'mosaic'];
const COLORS = [['S_White', 'solid'], ['S_Midnight Blue', 'solid'], ['S_Sage Green', 'solid'], ['S_Teracotta', 'solid'], ['C_Clay Brown', 'classic'], ['N_Oak', 'natural'], ['S_Butter Yellow', 'solid']] as const;
const ADDR = ['서울 성동구 성수이로 77', '서울 마포구 와우산로 94', '경기 성남시 분당구 판교역로 166', '서울 강남구 테헤란로 152', '부산 해운대구 센텀중앙로 79', '인천 연수구 송도과학로 32'];

function guard() { if (process.env.NODE_ENV === 'production') throw new Error('운영 환경에서는 데모 데이터를 만들 수 없습니다.'); }
const pick = <T,>(a: readonly T[], i: number) => a[i % a.length];

export async function createDemoData() {
  guard();
  const admin = await getAdmin(); if (!admin) throw new Error('관리자 권한이 필요합니다.');
  if (await prisma.user.count({ where: { email: { endsWith: DEMO_DOMAIN } } })) return;
  const now = Date.now();
  for (let u = 0; u < NAMES.length; u++) {
    const via = pick(VIA, u);
    const user = await prisma.user.create({ data: {
      name: NAMES[u], email: `demo${u + 1}${DEMO_DOMAIN}`, phone: `010-${String(2000 + u * 137).padStart(4, '0')}-${String(5000 + u * 91).padStart(4, '0')}`,
      marketingAgreed: u % 3 !== 0, termsAgreedAt: via === 'email' ? new Date() : null, passwordHash: via === 'email' ? 'demo$disabled' : null,
      createdAt: new Date(now - (80 - u * 7) * 86400000),
      ...(via !== 'email' && { accounts: { create: { type: 'oauth', provider: via, providerAccountId: `demo-${u}` } } }),
    } });
    const orderCount = 2 + (u % 4);
    for (let k = 0; k < orderCount; k++) {
      const seed = u * 7 + k * 3;
      const rows = Array.from({ length: 3 + (seed % 4) }, (_, i) => pick([28, 38, 28, 18], seed + i));
      const [color, category] = pick(COLORS, seed);
      const width = 90 + (seed % 9) * 20, depth = pick([24, 32, 40], seed);
      const design = await prisma.design.create({ data: {
        userId: user.id, shareCode: `D${Math.random().toString(36).slice(2, 9)}`.slice(0, 8),
        config: { style: pick(STYLES, seed), width, depth, density: 40 + (seed % 5) * 10, color, colorCategory: category, hasBackPanel: seed % 2 === 0,
          rowHeights: rows, numRows: rows.length, doorsCreatedLayers: seed % 3 === 0 ? [0] : [], drawersCreatedLayers: seed % 4 === 1 && depth >= 32 ? [1] : [], baseType: seed % 5 === 0 && depth > 24 ? 'legs' : 'standard' },
      } });
      const daysAgo = (seed * 5) % 75;
      const createdAt = new Date(now - daysAgo * 86400000 - (seed % 10) * 3600000);
      const status: OrderStatus = daysAgo > 20 ? (seed % 9 === 0 ? 'CANCELLED' : 'DELIVERED') : daysAgo > 12 ? 'SHIPPING' : daysAgo > 5 ? 'PRODUCING' : daysAgo > 1 ? 'PAID' : pick(['PENDING', 'PAID'] as const, seed);
      const price = Math.round((width * depth * rows.reduce((a, r) => a + r, 0) * 0.42) / 1000) * 1000;
      const paid = status !== 'PENDING' && status !== 'CANCELLED';
      await prisma.order.create({ data: {
        userId: user.id, status, totalAmount: price, shippingFee: price > 500000 ? 0 : 30000, createdAt,
        shipName: NAMES[u], shipPhone: `0101234${String(1000 + u).slice(-4)}`, shipZipCode: String(4700 + u * 13), shipAddress: pick(ADDR, u), shipDetail: `${100 + k}호`,
        adminMemo: seed % 6 === 0 ? '설치 희망 시간: 평일 오후' : null,
        items: { create: { designId: design.id, quantity: 1, price } },
        payment: { create: { amount: price, method: pick(['CARD', 'EASY_PAY', 'TRANSFER'], seed), status: paid ? 'PAID' : status === 'CANCELLED' ? 'CANCELLED' : 'PENDING', paidAt: paid ? createdAt : null, paymentKey: paid ? `demo_${design.id.slice(-8)}` : null } },
        ...(['PRODUCING', 'SHIPPING', 'DELIVERED'].includes(status) && { shipping: { create: {
          status: status === 'DELIVERED' ? 'DELIVERED' : status === 'SHIPPING' ? 'SHIPPED' : 'PREPARING',
          carrier: status === 'PRODUCING' ? null : pick(['CJ대한통운', '경동택배', '직접 배송(설치)'], seed), trackingNo: status === 'PRODUCING' ? null : String(6000000000 + seed * 7919),
          shippedAt: status !== 'PRODUCING' ? new Date(createdAt.getTime() + 8 * 86400000) : null, deliveredAt: status === 'DELIVERED' ? new Date(createdAt.getTime() + 11 * 86400000) : null,
        } } }),
        events: { create: [{ type: 'NOTE', note: '데모 데이터', actor: '시스템', createdAt }] },
      } });
    }
  }
  revalidatePath('/admin', 'layout');
}

export async function deleteDemoData() {
  guard();
  const admin = await getAdmin(); if (!admin) throw new Error('관리자 권한이 필요합니다.');
  const users = await prisma.user.findMany({ where: { email: { endsWith: DEMO_DOMAIN } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (!ids.length) return;
  const orders = await prisma.order.findMany({ where: { userId: { in: ids } }, select: { id: true } });
  const orderIds = orders.map((o) => o.id);
  await prisma.$transaction([
    prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } }),
    prisma.shipping.deleteMany({ where: { orderId: { in: orderIds } } }),
    prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    prisma.design.deleteMany({ where: { userId: { in: ids } } }),
    prisma.user.deleteMany({ where: { id: { in: ids } } }),
  ]);
  revalidatePath('/admin', 'layout');
}
