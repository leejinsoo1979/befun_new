import { localizedMetadata } from '@/lib/i18n/server';
import { StorefrontFrame } from '@/components/storefront/StorefrontFrame';
import { TermsPage } from '@/components/storefront/legal/TermsPage';

export async function generateMetadata() {
  return localizedMetadata({
  title: '이용약관 | BEFUN',
  description: 'BEFUN 맞춤 가구의 디자인, 주문, 제작·배송, 취소·반품과 서비스 이용에 관한 약관입니다.',
  robots: { index: false, follow: true },
});
}

export default function Page() {
  return <StorefrontFrame><TermsPage /></StorefrontFrame>;
}
