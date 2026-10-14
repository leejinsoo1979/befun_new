'use client';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useState } from 'react';
import { asset } from './catalog';
import styles from './storefront.module.css';
const steps = [
  { title: '당신이 디자인해요', text: '크기와 색, 구성을 선택해 우리 집에 맞는 가구를 디자인하세요.' },
  { title: '당신을 위한 가구', text: '선택한 디자인의 크기와 소재를 확인하고 주문을 준비하세요.' },
  { title: '공간을 완성해요', text: '선반과 도어, 수납할 물건에 맞춰 필요한 구성을 만들어 보세요.' },
  { title: '오래 함께해요', text: '좋아하는 물건과 나만의 취향이 오래 머무는 공간을 상상하세요.' },
];
export function ProcessCards() {
  const { t } = useI18n();
  const [active,setActive]=useState(0);
  return <div className={styles.processCards}>{steps.map((step,index)=><button key={step.title} className={`${styles.processCard} ${active===index?styles.processActive:''}`} onMouseEnter={()=>setActive(index)} onFocus={()=>setActive(index)} onClick={()=>setActive(index)} aria-expanded={active===index} aria-label={`${index+1}. ${t(step.title)}`}><Image src={asset(`befun/step-${index+1}.avif`)} alt="" fill sizes="(max-width:700px) 90vw,65vw" /><span className={styles.processIndex}>0{index+1}</span><div className={styles.processCopy}><h3>{t(step.title)}</h3><p>{t(step.text)}</p></div></button>)}</div>;
}
