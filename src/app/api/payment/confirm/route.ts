import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { confirmPayment, PaymentError } from '@/lib/payment';
import { productionSheetFor } from '@/lib/commerce/production';

/**
 * POST /api/payment/confirm — 토스페이먼츠 결제 승인
 *
 * 플로우:
 * 1. 결제창 성공 → /order/success 가 paymentKey, orderId, amount 전달
 * 2. 본인 주문·금액·중복 승인 확인 후 토스 API로 승인 요청
 * 3. 승인 성공 시 Payment·Order → PAID, 공장 제작 지시서(productionSheet) 스냅샷 저장
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const { paymentKey, orderId, amount } = await req.json();

    if (typeof paymentKey !== 'string' || typeof orderId !== 'string' || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'paymentKey, orderId, amount 필수' },
        { status: 400 },
      );
    }

    // DB에서 본인 주문 확인 (금액 위변조 방지)
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      include: { payment: true, items: { include: { design: { select: { shareCode: true, config: true } } } } },
    });

    if (!order || !order.payment) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 });
    }

    // 새로고침 등으로 다시 호출된 경우: 이미 승인된 결제면 성공으로 응답
    if (order.payment.status === 'PAID') {
      if (order.payment.paymentKey === paymentKey) return NextResponse.json({ success: true, orderId, approvedAt: order.payment.paidAt });
      return NextResponse.json({ error: '이미 결제된 주문입니다' }, { status: 409 });
    }
    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: '결제할 수 없는 주문 상태입니다' }, { status: 409 });
    }

    const expectedAmount = order.totalAmount + order.shippingFee;
    if (amount !== expectedAmount || order.payment.amount !== expectedAmount) {
      return NextResponse.json(
        { error: '결제 금액이 일치하지 않습니다' },
        { status: 400 },
      );
    }

    // 토스페이먼츠 결제 승인 요청
    const tossResponse = await confirmPayment(paymentKey, orderId, amount);

    // 공장 제작 지시서: 주문 항목별 재단 목록·전면(도어/서랍)·사양
    const { sheet } = productionSheetFor(null, order.items);
    const now = new Date();

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
        data: {
          status: 'PAID',
          productionSheet: sheet as object,
          productionReadyAt: now,
        },
      }),
      prisma.orderEvent.createMany({
        data: [
          { orderId, type: 'STATUS', fromValue: 'PENDING', toValue: 'PAID', note: `결제 승인(${tossResponse.method ?? '토스'})`, actor: '시스템' },
          { orderId, type: 'NOTE', note: '공장 제작 지시서 생성', actor: '시스템' },
        ],
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
