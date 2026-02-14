/**
 * 토스페이먼츠 결제 유틸리티
 *
 * 결제 플로우:
 * 1. 프론트 → POST /api/orders (주문 생성, status=PENDING)
 * 2. 프론트 → 토스 위젯 호출 (orderId, amount)
 * 3. 토스 → 리다이렉트 /api/payment/confirm?paymentKey=...&orderId=...&amount=...
 * 4. 서버 → 토스 API 결제 승인 확인
 * 5. 서버 → DB 주문 상태 업데이트 (PAID)
 */

const TOSS_API_BASE = 'https://api.tosspayments.com/v1';

/**
 * 토스페이먼츠 결제 승인 요청 (서버 사이드)
 */
export async function confirmPayment(paymentKey: string, orderId: string, amount: number) {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error('TOSS_SECRET_KEY not configured');

  const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');

  const response = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encodedKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new PaymentError(
      data.code ?? 'UNKNOWN_ERROR',
      data.message ?? '결제 승인 실패',
    );
  }

  return data as TossPaymentResponse;
}

/**
 * 토스페이먼츠 결제 취소 요청 (서버 사이드)
 */
export async function cancelPayment(paymentKey: string, cancelReason: string) {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error('TOSS_SECRET_KEY not configured');

  const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');

  const response = await fetch(`${TOSS_API_BASE}/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encodedKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancelReason }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new PaymentError(
      data.code ?? 'UNKNOWN_ERROR',
      data.message ?? '결제 취소 실패',
    );
  }

  return data;
}

// ── 타입 ──

export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
  receipt?: { url: string };
}

export class PaymentError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'PaymentError';
  }
}
