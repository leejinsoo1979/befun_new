export const won = (n: number) => `${new Intl.NumberFormat('ko-KR').format(n)}원`;
export const date = (d: Date) => new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(d);
export type OrderStatusValue = 'PENDING' | 'PAID' | 'PRODUCING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
export const ORDER_STATUS: Record<OrderStatusValue, string> = { PENDING: '주문 대기', PAID: '결제 완료', PRODUCING: '제작 중', SHIPPING: '배송 중', DELIVERED: '배송 완료', CANCELLED: '취소' };
export const PROVIDERS: Record<string, string> = { google: '구글', kakao: '카카오', naver: '네이버' };
export const PAYMENT_STATUS: Record<'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED', string> = { PENDING: '대기', PAID: '결제됨', CANCELLED: '취소', REFUNDED: '환불' };
/** 최근 N일 기준 시각(서버 요청 시점) */
export const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 3600 * 1000);
