import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ShopLayout } from '@/components/common/ShopLayout';
import { PayWidget } from './PayWidget';

export const dynamic = 'force-dynamic';

/** 토스 결제위젯 화면. 본인의 결제 대기 주문만 */
export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/order/${id}/pay`)}`);
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true, payment: true, user: { select: { email: true, name: true } } },
  });
  if (!order || !order.payment) notFound();
  if (order.status !== 'PENDING' || order.payment.status !== 'PENDING') redirect(`/order/${id}`);

  const amount = order.totalAmount + order.shippingFee;
  const count = order.items.reduce((n, i) => n + i.quantity, 0);
  const orderName = count > 1 ? `맞춤 수납장 외 ${count - 1}건` : '맞춤 수납장';
  const won = (n: number) => `${new Intl.NumberFormat('ko-KR').format(n)}원`;

  return (
    <ShopLayout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold">결제하기</h1>
        <p className="mb-6 text-sm text-gray-500">{orderName} · 상품 {won(order.totalAmount)} · 배송비 {order.shippingFee ? won(order.shippingFee) : '무료'}</p>
        <PayWidget
          clientKey={process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? ''}
          customerKey={session.user.id}
          orderId={order.id}
          orderName={orderName}
          amount={amount}
          customerEmail={order.user.email ?? undefined}
          customerName={order.shipName || order.user.name || undefined}
        />
      </div>
    </ShopLayout>
  );
}
