import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/orders/[id] — 주문 상세 조회
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            design: {
              select: { shareCode: true, thumbnailUrl: true, config: true },
            },
          },
        },
        payment: true,
        shipping: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order detail error:', error);
    return NextResponse.json({ error: '주문 조회 실패' }, { status: 500 });
  }
}
