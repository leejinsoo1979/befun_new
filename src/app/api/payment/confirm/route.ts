import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { confirmPayment, PaymentError } from '@/lib/payment';

/**
 * POST /api/payment/confirm — 토스페이먼츠 결제 승인
 *
 * 플로우:
 * 1. 프론트에서 토스 위젯 결제 완료 → paymentKey, orderId, amount 전달
 * 2. 서버에서 토스 API로 결제 승인 요청
 * 3. 승인 성공 시 DB 업데이트 (Payment → PAID, Order → PAID)
 */
export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: 'paymentKey, orderId, amount 필수' },
        { status: 400 },
      );
    }

    // DB에서 주문 확인 (금액 위변조 방지)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 });
    }

    const expectedAmount = order.totalAmount + order.shippingFee;
    if (amount !== expectedAmount) {
      return NextResponse.json(
        { error: '결제 금액이 일치하지 않습니다' },
        { status: 400 },
      );
    }

    // 토스페이먼츠 결제 승인 요청
    const tossResponse = await confirmPayment(paymentKey, orderId, amount);

    // DB 업데이트
    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId },
        data: {
          paymentKey,
          method: tossResponse.method,
          status: 'PAID',
          paidAt: new Date(tossResponse.approvedAt),
          rawResponse: tossResponse as object,
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      orderId,
      approvedAt: tossResponse.approvedAt,
    });
  } catch (error) {
    if (error instanceof PaymentError) {
      console.error('Payment confirm error:', error.code, error.message);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 },
      );
    }
    console.error('Payment confirm error:', error);
    return NextResponse.json({ error: '결제 승인 실패' }, { status: 500 });
  }
}
