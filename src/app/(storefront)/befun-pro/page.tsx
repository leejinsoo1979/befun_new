import { currentRegion } from '@/lib/i18n/server';
import styles from '@/components/storefront/pro/pro.module.css';
import { StorefrontFrame } from '@/components/storefront/StorefrontFrame';
import { ProPage } from '@/components/storefront/pro/ProPage';

export async function generateMetadata() {
  const { locale } = await currentRegion();
  const descriptions = {
    ko: '건축가, 인테리어 디자이너와 공간을 만드는 사람들을 위한 맞춤 가구. 프로젝트에 맞는 크기와 소재, 컬러를 만나보세요.',
    en: 'Custom furniture for architects, interior designers and people creating spaces. Explore sizes, materials and colours for your project.',
    ja: '建築家やインテリアデザイナー、空間をつくる方のためのオーダー家具。プロジェクトに合うサイズ、素材、カラーをご覧ください。',
  };
  return { title: 'Befun Pro | BEFUN', description: descriptions[locale] };
}

export default function Page() {
  return <div className={styles.frame}><StorefrontFrame overlay><ProPage /></StorefrontFrame></div>;
}
