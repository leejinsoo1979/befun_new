import { Noto_Sans_KR } from 'next/font/google';
import { Providers } from '@/components/common/Providers';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { currentRegion, localizedMetadata } from '@/lib/i18n/server';
import './globals.css';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-sans-kr',
});

export async function generateMetadata() {
  return localizedMetadata({
    title: 'Befun - 나만의 맞춤 가구',
    description: '3D 커스터마이저로 나만의 수납 가구를 디자인하세요',
  });
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const region = await currentRegion();
  return (
    <html lang={region.htmlLang}>
      <body className={`${notoSansKR.variable} font-sans antialiased`}>
        <Providers><I18nProvider initialRegion={region.id}>{children}</I18nProvider></Providers>
      </body>
    </html>
  );
}
