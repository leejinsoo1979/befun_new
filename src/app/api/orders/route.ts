import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/orders — 주문 생성
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const body = await req.json();
    const { items, shipping, shippingFee = 0 } = body;

    if (!items?.length || !shipping) {
      return NextResponse.json({ error: '주문 항목과 배송지가 필요합니다' }, { status: 400 });
    }

    // 총액 계산
    const totalAmount = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0,
    );

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        totalAmount,
        shippingFee,
        shipName: shipping.name,
        shipPhone: shipping.phone,
        shipZipCode: shipping.zipCode,
        shipAddress: shipping.address,
        shipDetail: shipping.detail ?? null,
        items: {
          create: items.map(
            (item: { designId: string; quantity: number; price: number }) => ({
              designId: item.designId,
              quantity: item.quantity,
              price: item.price,
            }),
          ),
        },
        payment: {
          create: {
            amount: totalAmount + shippingFee,
          },
        },
      },
      include: {
        items: true,
        payment: true,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      totalAmount: order.totalAmount,
      paymentId: order.payment?.id,
    });
  } catch (error) {
    console.error('Order create error:', error);
    return NextResponse.json({ error: '주문 생성 실패' }, { status: 500 });
  }
}

/**
 * GET /api/orders — 내 주문 목록
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            design: {
              select: { shareCode: true, thumbnailUrl: true, config: true },
            },
          },
        },
        payment: {
          select: { status: true, method: true, paidAt: true },
        },
        shipping: {
          select: { status: true, carrier: true, trackingNo: true },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Order list error:', error);
    return NextResponse.json({ error: '주문 목록 조회 실패' }, { status: 500 });
  }
}
