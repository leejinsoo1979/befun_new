'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useLocale } from '@/lib/commerce/useLocale';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { products } from './catalog';
import { ReferenceImage, useConfigureProduct } from './StorefrontUI';
import { JoinSection } from './JoinSection';
import { catalogCategories, catalogHref } from './navigation';
import styles from './storefront.module.css';

const categories = [
  ['sideboard', 'sideboard', 'sideboard-terra'], ['bookcase', 'bookcase', 'bookcase-brown'],
  ['wallstorage', 'wallstorage', 'wall-green'], ['wallunits', 'wallunit', 'wall-green'],
  ['wardrobe', 'wardrobe', ''], ['desk', 'desk', ''], ['dressing_table', 'dressingtable', ''],
  ['tv-stand', 'tvstand', 'tv-brown'], ['chest-of-drawers', 'chest', ''],
  ['shoerack', 'shoerack', ''], ['bedside_table', 'bedsidetable', ''],
  ['vinyl_storage', 'vinylstorage', ''], ['sofas', 'sofa-uff', ''],
] as const;
/** 분류 대표 이미지: R6 다운로드 원본 썸네일(각 CSV 카테고리 1번째), 우리 서버 파일 */
const categoryThumbnails: Record<string, string> = {
  sideboard: '/imgs/product-cards/62fff045754e99f8a37d990f4c32b66149734ac51d1dc2eae68b39f2d655beb6.webp',
  bookcase: '/imgs/product-cards/1ed3be94bde027f1073c43a4ed3e77ebf0aa0e05b634b057a27ba99178bf127f.webp',
  wallstorage: '/imgs/product-cards/17abb14138b18b9a8d17b6e62aee16218bcadcb39e6b69848e6fbd8ce92dd89d.webp',
  wallunits: '/imgs/product-cards/11625dc657f4f55c4d420f19347bca41cb141c0c26cedb009b6370271fbdd1d9.webp',
  wardrobe: '/imgs/product-cards/48e0a08bbba2d38b730d60211ec1845ae21497d12a835a026e8cd29238c896cb.webp',
  desk: '/imgs/product-cards/c7bda8b9570345d25d987717a045dc11d2ba6e2065099c83014c4cfee0b3c92a.webp',
  dressing_table: '/imgs/product-cards/1d68970736c39d2befb4636ab3a47dc3aea38b9b53de0c1d667ec124cf41d946.webp',
  'tv-stand': '/imgs/product-cards/ef2c475e4e05b85146f118f1a9ef6834c8d9d435aedc2b04fc52e56919a82ada.webp',
  'chest-of-drawers': '/imgs/product-cards/1b209e4c1ef137f50f4a47aeb9cf929a61b1316b46e6c3534beaba58d6da330b.webp',
  shoerack: '/imgs/product-cards/1364470ccf96ada19ddf86df368630ceb91e445b7f0f2ac09c1b19b7169f7595.webp',
  bedside_table: '/imgs/product-cards/c8cf63fe3b5195737fe986173d0ceb592807dc525a7c7f0285390c7d5164d84f.webp',
  vinyl_storage: '/imgs/product-cards/45c098df0e42a70a2fa96dace6f71f7389ea682ea1b523b12508a240aeedbdcc.webp',
  sofas: '/imgs/product-cards/f12ec0dc977e4624c938691273dcfe7afdbb85556c606203b71985599bfc5270.webp',
};
const models = [
  { name: 'Original Classic', image: 'classic', color: 'C_Black', category: 'classic' as const, copy: '판재의 대비와 간결한 선으로 시작해 보세요.' },
  { name: 'Original Modern', image: 'modern', color: 'S_Midnight Blue', category: 'solid' as const, copy: '선명한 단색과 원하는 수납 구성을 조합해 보세요.' },
  { name: 'Edge', image: 'edge', color: 'Sand+Midnight Blue', category: 'edgeMix' as const, copy: '다른 색의 면과 모서리가 만드는 리듬을 살펴보세요.' },
  { name: 'Tone', image: 'tone', color: 'S_Stone Gray', category: 'solid' as const, copy: '차분한 컬러로 공간과 자연스럽게 어우러지는 디자인을 만드세요.' },
];

export function ConfiguratorIntro() {
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const [model, setModel] = useState(0);
  const configure = useConfigureProduct();
  const router = useRouter();
  const { t } = useLocale();
  const category = categories[selected];
  const product = products.find(item => item.id === category[2]);
  const isDesk = category[0] === 'desk';
  const isWardrobe = category[0] === 'wardrobe';
  const familyModels = isDesk ? models.slice(0, 2) : isWardrobe ? models.slice(2) : models;
  const finish = familyModels[model] ?? familyModels[0];
  const collectionCopy = isWardrobe ? (model === 0 ? '구획마다 높이와 깊이를 조절하고, 옷봉·선반·서랍을 조합하세요.' : '외부와 내부 컬러를 따로 고르고, 옷봉·선반·서랍과 조명을 구성하세요.') : isDesk ? '작업 공간의 위치와 너비를 정하고, 필요한 수납과 케이블 홀을 더하세요.' : finish.copy;
  const optionCopy = isDesk || isWardrobe ? '3D 화면에서 크기와 컬러, 구획별 내부 구성과 문 방향을 변경할 수 있습니다.' : `Befun의 ${finish.category === 'edgeMix' ? 'Mix' : finish.category === 'solid' ? 'Solid' : 'Classic'} 마감으로 시작합니다. 3D 화면에서 크기와 컬러, 선반 스타일을 변경할 수 있습니다.`;
  const familyRoute = isDesk ? (model === 0 ? 'desk-classic' : 'desk-modern') : (model === 0 ? 'wardrobe-edge' : 'wardrobe-tone');
  return <><section className={`${styles.pageSection} ${styles.configuratorIntro}`}>
    <h1>{step === 0 ? '가구 종류를 선택하세요' : catalogCategories[category[0]]}</h1>
    <p>{step === 0 ? '수납장부터 옷장까지, 공간에 필요한 가구를 선택하세요.' : '모델을 선택하고 컬러와 스타일을 살펴보세요.'}</p>
    {step === 0 ? <div className={styles.introCategories}>{categories.map(([slug], index) => <button key={slug} aria-pressed={selected === index} onClick={() => { setSelected(index); setModel(0); }}><div><Image src={categoryThumbnails[slug]} alt={t(catalogCategories[slug])} fill sizes="(max-width:700px) 42vw, 20vw" /></div><span>{t(catalogCategories[slug])}</span></button>)}</div> : <div className={styles.introModelLayout}><div><div className={styles.introModels}>{familyModels.map((item, index) => <button key={item.name} aria-pressed={model === index} onClick={() => setModel(index)}><div><ReferenceImage source={category[0] === 'bookcase' ? `https://media.tylko.com/cloudinary/configurator-intro/grid/bookcase_${item.image}/A.avif` : `https://media.tylko.com/cloudinary/common/menu/categories/${category[1]}/A.avif`} fallback={product?.image ?? 'storage.avif'} alt={item.name} sizes="(max-width:700px) 42vw, 20vw" /></div><span>{item.name}</span></button>)}</div><div className={styles.introModelCopy}><h2>컬렉션 소개</h2><p>{collectionCopy}</p><h2>컬러와 스타일</h2><p>{optionCopy}</p></div></div><div className={styles.introModelImage}><ReferenceImage source={isDesk || isWardrobe ? `https://media.tylko.com/cloudinary/common/menu/categories/${category[1]}/A.avif` : "https://media.tylko.com/cloudinary/configurator-intro/models/Bookcases/original%20classic/A.avif"} fallback={product?.image ?? 'storage.avif'} alt="컬렉션 디자인 레퍼런스" sizes="400px" /></div></div>}
    <div className={styles.introNavigation}>{step === 0 ? <Link href="/furniture-c" className={styles.outlineButton}><FiArrowLeft /> 돌아가기</Link> : <button className={styles.outlineButton} onClick={() => setStep(0)}><FiArrowLeft /> 이전</button>}{step === 0 ? <button className={styles.darkButton} onClick={() => { if (!product && !isDesk && !isWardrobe) { router.push(catalogHref(category[0])); return; } setStep(1); window.scrollTo({ top: 0, behavior: 'instant' }); }}>다음 <FiArrowRight /></button> : isDesk || isWardrobe ? <button className={styles.darkButton} onClick={() => router.push(`/furniture-design/${familyRoute}`)}>커스터마이즈 <FiArrowRight /></button> : product ? <button className={styles.darkButton} onClick={() => configure({ ...product, color: finish.color, colorCategory: finish.category })}>커스터마이즈 <FiArrowRight /></button> : <Link className={styles.darkButton} href={catalogHref(category[0])}>컬렉션 보기 <FiArrowRight /></Link>}</div>
  </section><JoinSection /></>;
}
