import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { marketCheckoutAvailable } from '@/lib/commerce/quote';
import { normalizeShelfConfig, shippingFeeFor, unitPrice, type ShelfOrderConfig } from '@/lib/commerce/production';
import { generateShareCode } from '@/lib/sharing';

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * POST /api/orders — 주문 생성(결제 대기)
 * 가격·배송비는 브라우저 값을 쓰지 않고 디자인 config로 서버에서 다시 계산한다.
 * 장바구니 항목마다 Design을 새로 저장해 주문 당시 사양을 고정한다.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const body = await req.json();
    const { items, shipping } = body;
    const market = body.market ?? req.cookies.get('befun_region')?.value?.toUpperCase() ?? 'KR';
    if (!marketCheckoutAvailable(market, body.currency ?? 'KRW')) {
      return NextResponse.json({code:'REGIONAL_QUOTE_REQUIRED',error:'International orders require a confirmed regional quote.'},{status:409});
    }

    if (!Array.isArray(items) || !items.length || items.length > 10 || !shipping) {
      return NextResponse.json({ error: '주문 항목과 배송지가 필요합니다' }, { status: 400 });
    }
    const ship = {
      name: text(shipping.name, 40), phone: text(shipping.phone, 20), zipCode: text(shipping.zipCode, 10),
      address: text(shipping.address, 200), detail: text(shipping.detail, 200),
    };
    if (!ship.name || !/^[0-9+\-\s]{9,20}$/.test(ship.phone) || !ship.address) {
      return NextResponse.json({ error: '받는 분·연락처·주소를 확인해 주세요' }, { status: 400 });
    }

    const lines: { config: ShelfOrderConfig; quantity: number; price: number }[] = [];
    for (const item of items) {
      const config = normalizeShelfConfig(item?.designConfig);
      const quantity = Number(item?.quantity);
      if (!config || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        return NextResponse.json({ error: '주문할 수 없는 디자인이 있습니다. 장바구니를 다시 담아 주세요' }, { status: 400 });
      }
      const price = unitPrice(config);
      if (!(price > 0)) return NextResponse.json({ error: '가격을 계산할 수 없는 디자인이 있습니다' }, { status: 400 });
      lines.push({ config, quantity, price });
    }
    const totalAmount = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const shippingFee = shippingFeeFor(totalAmount);
    const userId = session.user.id;

    const order = await prisma.$transaction(async (tx) => {
      const designs: { id: string }[] = [];
      for (const l of lines) {
        designs.push(await tx.design.create({ data: { userId, shareCode: generateShareCode(), config: l.config as object } }));
      }
      return tx.order.create({
        data: {
          userId, totalAmount, shippingFee,
          shipName: ship.name, shipPhone: ship.phone, shipZipCode: ship.zipCode, shipAddress: ship.address, shipDetail: ship.detail || null,
          items: { create: lines.map((l, i) => ({ designId: designs[i].id, quantity: l.quantity, price: l.price })) },
          payment: { create: { amount: totalAmount + shippingFee } },
          events: { create: { type: 'STATUS', toValue: 'PENDING', note: '주문 생성(결제 대기)', actor: '고객' } },
        },
      });
    });

    return NextResponse.json({ orderId: order.id, totalAmount, shippingFee, amount: totalAmount + shippingFee });
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
