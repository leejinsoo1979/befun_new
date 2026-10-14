import type { OrderStatus, PaymentStatus, ShippingStatus } from '@/generated/prisma/enums';

export const won = (n: number) => `${new Intl.NumberFormat('ko-KR').format(Math.round(n))}원`;
export const num = (n: number) => new Intl.NumberFormat('ko-KR').format(n);
const tz = { timeZone: 'Asia/Seoul' } as const;
export const dateTime = (d: Date) => new Intl.DateTimeFormat('ko-KR', { ...tz, year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
export const dateOnly = (d: Date) => new Intl.DateTimeFormat('ko-KR', { ...tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
/** YYYY-MM-DD (KST) */
export const dayKey = (d: Date) => new Intl.DateTimeFormat('sv-SE', tz).format(d);
export const orderNo = (id: string, createdAt: Date) => `B${dayKey(createdAt).replace(/-/g, '').slice(2)}-${id.slice(-5).toUpperCase()}`;

export const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'PRODUCING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  PENDING: { label: '결제 대기', tone: 'gray' },
  PAID: { label: '결제 완료', tone: 'blue' },
  PRODUCING: { label: '제작 중', tone: 'amber' },
  SHIPPING: { label: '배송 중', tone: 'violet' },
  DELIVERED: { label: '배송 완료', tone: 'green' },
  CANCELLED: { label: '취소', tone: 'red' },
};
export const PAYMENT_STATUS: Record<PaymentStatus, string> = { PENDING: '결제 대기', PAID: '결제 완료', CANCELLED: '결제 취소', REFUNDED: '환불 완료' };
export const SHIPPING_STATUS: Record<ShippingStatus, string> = { PREPARING: '준비 중', SHIPPED: '발송', IN_TRANSIT: '배송 중', DELIVERED: '배송 완료' };
export const PAYMENT_METHOD: Record<string, string> = { CARD: '카드', TRANSFER: '계좌이체', EASY_PAY: '간편결제', VIRTUAL_ACCOUNT: '가상계좌', MOBILE_PHONE: '휴대폰' };
export const PROVIDERS: Record<string, string> = { google: '구글', kakao: '카카오', naver: '네이버', credentials: '이메일' };
export const CARRIERS = ['CJ대한통운', '롯데택배', '한진택배', '우체국택배', '로젠택배', '경동택배', '직접 배송(설치)'];
export const PAID_STATUSES: OrderStatus[] = ['PAID', 'PRODUCING', 'SHIPPING', 'DELIVERED'];

/** 다음 단계(정상 흐름). 취소는 배송 완료 전 어느 단계에서나 가능 */
export const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  PENDING: { to: 'PAID', label: '결제 확인' },
  PAID: { to: 'PRODUCING', label: '제작 시작' },
  PRODUCING: { to: 'SHIPPING', label: '발송 처리' },
  SHIPPING: { to: 'DELIVERED', label: '배송 완료' },
};

export type Period = 'today' | '7d' | '30d' | '90d';
export const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: 'today', label: '오늘', days: 1 }, { id: '7d', label: '7일', days: 7 }, { id: '30d', label: '30일', days: 30 }, { id: '90d', label: '90일', days: 90 },
];
/** 기간 시작(KST 자정 기준)과 직전 동일 기간 시작 */
export function periodRange(period: Period, now = new Date()) {
  const days = PERIODS.find((p) => p.id === period)?.days ?? 30;
  const kstMidnight = new Date(`${dayKey(now)}T00:00:00+09:00`);
  const start = new Date(kstMidnight.getTime() - (days - 1) * 86400000);
  const prevStart = new Date(start.getTime() - days * 86400000);
  return { start, prevStart, days };
}
/** 증감률(%). 이전 값이 0이면 비교 불가(null) */
export const changePct = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? null : 0) : Math.round(((cur - prev) / prev) * 100));

/** 지금으로부터 n일(소수 가능) 전 시각 */
export const daysAgo = (days: number) => new Date(Date.now() - days * 86400000);
