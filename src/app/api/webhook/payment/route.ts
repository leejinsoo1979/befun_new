import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/webhook/payment — 토스페이먼츠 웹훅
 *
 * 토스에서 결제 상태 변경 시 호출 (취소, 환불 등)
 * 토스 웹훅 시크릿으로 검증 후 DB 업데이트
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, data } = body;

    // 웹훅 시크릿 검증
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get('toss-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      // TODO: HMAC 검증 구현 (프로덕션 필수)
    }

    switch (eventType) {
      case 'PAYMENT_STATUS_CHANGED': {
        const { paymentKey, status, cancels } = data;

        const payment = await prisma.payment.findFirst({
          where: { paymentKey },
        });

        if (!payment) {
          console.warn('Webhook: payment not found', paymentKey);
          return NextResponse.json({ received: true });
        }

        if (status === 'CANCELED' || status === 'PARTIAL_CANCELED') {
          await prisma.$transaction([
            prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'CANCELLED',
                cancelledAt: cancels?.[0]?.canceledAt
                  ? new Date(cancels[0].canceledAt)
                  : new Date(),
              },
            }),
            prisma.order.update({
              where: { id: payment.orderId },
              data: { status: 'CANCELLED' },
            }),
          ]);
        }
        break;
      }

      default:
        console.log('Webhook: unhandled event', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook 처리 실패' }, { status: 500 });
  }
}
