'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ReferenceImage } from './StorefrontUI';
import { useI18n } from '@/lib/i18n/I18nProvider';
import styles from './storefront.module.css';

// 2026-10-13 원본에서 각 스와치를 선택한 후 DOM의 picture/srcset으로 확인한 이미지.
/** 스와치는 우리 서버에서만: t02는 저장된 원본 SVG, 옷장(t13)은 WARDROBE_COLORS 렌더러 색, 소파 울은 근사색(원본 hex 미확보) */
const SWATCH_COLORS: Record<string, string> = {
  't13/white': '#F5F5F5', 't13/grey': '#B2B2B2', 't13/black': '#1F1F1E', 't13/clay-brown': '#B57E5B', 't13/olive-green': '#5C6C3C',
  't13/sand': '#D5CABC', 't13/dusk-blue': '#56697B', 't13/midnight-blue': '#101323', 't13/stone-grey': '#B2AEA7',
  't13/butter-yellow': '#D9CAA3', 't13/deep-plum': '#67132C',
  's01/wool/dark_brown': '#5a4636', 's01/wool/khaki': '#9a8f6e', 's01/wool/grey': '#9c9a96', 's01/wool/pale_yellow': '#e3d39b',
  's01/wool/powder_pink': '#d9b3ad', 's01/wool/green': '#6f7b5c', 's01/wool/lilac_blue': '#a9aec8',
};
function Swatch({ prefix, id }: { prefix: string; id: string }) {
  if (prefix === 't02') return <Image src={`/imgs/tylko-gallery/swatches/t02/${id}/small/A.svg`} alt="" width={24} height={24} unoptimized />;
  return <span aria-hidden="true" style={{ display: 'block', width: 24, height: 24, borderRadius: '50%', background: SWATCH_COLORS[`${prefix}/${id}`] ?? '#ccc' }} />;
}

const collections = [
  { title: '수납장', slug: 'storage', fallback: 'storage.avif', initial: 5, swatchPrefix: 't02', options: [
    ['화이트','white','basic_white'], ['코튼','cotton','cotton'], ['베이지','beige','beige'], ['그레이','grey','t02_grey'], ['스카이 블루','sky-blue','sky_blue'], ['테라코타','terracotta','orange'], ['미드나잇 블루','indygo','indygo'], ['버건디','burgundy','burgundy'], ['매트 블랙','matte-black','matte_black'], ['블랙','black','black'], ['라이징어 핑크','reisingers-pink','reisingers_pink'], ['세이지 그린','sage-green','sage_green'], ['스톤 그레이','stone-grey','stone_grey'], ['버터 옐로','butter-yellow','butter_yellow'], ['라일락','pale-lilac','pale_lilac'], ['올리브 그린','olive-green','olive_green'], ['다크 브라운','dark-brown','dark_brown'],
  ] },
  { title: '옷장', slug: 'wardrobe', fallback: 'wardrobe.avif', initial: 4, swatchPrefix: 't13', options: [
    ['화이트','white','white'], ['그레이','grey','grey'], ['블랙','black','black'], ['클레이 브라운','clay-brown','clay-brown'], ['올리브 그린','olive-green','olive-green'], ['샌드','sand','sand'], ['더스크 블루','dusk-blue','dusk-blue'], ['미드나잇 블루','midnight-blue','midnight-blue'], ['스톤 그레이','stone-grey','stone-grey'], ['버터 옐로','butter-yellow','butter-yellow'], ['딥 플럼','deep-plum','deep-plum'],
  ] },
  { title: '소파', slug: 'sofa', fallback: 'sofa.avif', initial: 3, swatchPrefix: 's01/wool', options: [
    ['다크 브라운','dark_brown','wool_dark_brown'], ['카키','khaki','wool_khaki'], ['그레이','grey','wool_grey'], ['페일 옐로','pale_yellow','wool_pale_yellow'], ['파우더 핑크','powder_pink','wool_powder_pink'], ['그린','green','wool_green'], ['라일락 블루','lilac_blue','wool_lilac_blue'],
  ] },
];
export function CollectionChooser() {
  const { t } = useI18n();
  const [selected, setSelected] = useState(collections.map(collection=>collection.initial));
  return <div className={styles.collections}>{collections.map((collection,index)=> {
    const choice=collection.options[selected[index]];
    return <article key={collection.slug} className={styles.collection}><div className={styles.collectionImage}><ReferenceImage key={choice[2]} source={`https://media.tylko.com/cloudinary/lp/blackfriday/choose-line/${collection.slug}/${choice[2]}/A.avif`} fallback={collection.fallback} alt={`${t(collection.title)} · ${t(choice[0])}`} sizes="(max-width:700px) 85vw,33vw" /></div><h3>{t(collection.title)}</h3><div className={`${styles.swatches} ${styles.collectionSwatches}`} role="group" aria-label={`${t(collection.title)} ${t('컬러')}`}>{collection.options.map(([label,swatch],colorIndex)=><button key={swatch} className={selected[index]===colorIndex?styles.swatchSelected:''} aria-label={`${t(collection.title)} ${t(label)}`} title={t(label)} aria-pressed={selected[index]===colorIndex} onClick={()=>setSelected(current=>current.map((value,position)=>position===index?colorIndex:value))}><Swatch prefix={collection.swatchPrefix} id={swatch} /></button>)}</div><p className={styles.colorName}>{t(choice[0])}</p><Link href={`/furniture-c/${collection.slug==='sofa'?'sofas':collection.slug}`} className={styles.outlineButton}>{t('둘러보기')}</Link></article>;
  })}</div>;
}
