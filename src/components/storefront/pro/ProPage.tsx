'use client';

import { useLocale } from '@/lib/commerce/useLocale';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheck, FiHeadphones, FiSliders, FiLayers, FiPlus } from 'react-icons/fi';
import styles from './pro.module.css';
import { ProReferenceSections } from './ProReferenceSections';

const spaces = [
  { title: '리테일', projects: [['moco_store_london.avif', 'MOCO Store London'], ['birkenstock.avif', 'Birkenstock'], ['collanine_colorate.avif', 'Collanine Colorate']] },
  { title: '주거 공간', projects: [['mistovia.avif', 'Mistovia'], ['felipe_pantone.avif', 'Felipe Pantone'], ['sigfrido_serra.avif', 'Sigfrido Serra']] },
  { title: '레스토랑', projects: [['skina.avif', 'Skina'], ['amator.avif', 'AMATOR'], ['helen_cafe.avif', 'Helen Café']] },
  { title: '호텔', projects: [['plantonia.avif', 'Plantonia'], ['autor_rooms.avif', 'Autor Rooms']] },
  { title: '공공 공간', projects: [['menursery.avif', 'Menursery']] },
  { title: '오피스', projects: [['satyendra_pakhale.avif', 'Satyendra Pakhalé'], ['polaroid.avif', 'Polaroid'], ['koi.avif', 'KOI']] },
];
const benefits = [
  ['소재와 컬러 샘플', '공간의 빛과 주변 소재를 함께 생각해 보세요. 소재 샘플 페이지에서 컬러와 표면의 차이를 살펴볼 수 있습니다.', '/material-samples', '소재 살펴보기'],
  ['3D로 확인하는 디자인', '너비와 높이, 수납 구성을 조절하고 여러 각도에서 확인하세요. 공간에 놓기 전, 원하는 디자인을 구체적으로 그려볼 수 있습니다.', '/configurator-intro', '3D 디자인 시작하기'],
  ['공간에 맞춘 커스터마이징', '작은 틈부터 넓은 벽까지. 가구 종류를 고르고 크기와 마감, 도어와 서랍을 프로젝트에 맞춰 구성하세요.', '/configurator-intro', '가구 선택하기'],
  ['취향을 담는 마감', '합판의 단면, 차분한 단색, 자연스러운 우드. 공간의 분위기를 완성하는 소재를 찾아보세요.', '/material-samples', '마감 살펴보기'],
  ['저장하고 함께 검토하기', '완성한 디자인을 저장하거나 링크로 공유할 수 있습니다. 프로젝트의 여러 구성을 비교하고 함께 검토하세요.', '/saved-designs', '저장한 디자인 보기'],
  ['프로젝트 상담', '공간의 용도와 필요한 가구, 수량과 일정을 알려주세요. 구체적인 요구사항을 정리해 프로젝트 문의를 준비할 수 있습니다.', '#pro-apply', '프로젝트 문의하기'],
];

function Photo({ file, alt, className, priority = false }: { file: string; alt: string; className?: string; priority?: boolean }) {
  return <div className={`${styles.photo} ${className || ''}`}><Image src={`/imgs/pro/${file}`} alt={alt} fill sizes="(max-width: 700px) 100vw, 50vw" priority={priority} /></div>;
}

export function ProPage() {
  const { t } = useLocale();
  const [category, setCategory] = useState(0);
  const [position, setPosition] = useState(0);
  const [visibleCards, setVisibleCards] = useState(2);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const update = () => setVisibleCards(query.matches ? 1 : 2);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const [step, setStep] = useState(1);
  const [prepared, setPrepared] = useState(false);
  const [fields, setFields] = useState({ name: '', email: '', company: '', role: '', message: '' });
  const gallery = useRef<HTMLDivElement>(null);
  const stepTitle = useRef<HTMLHeadingElement>(null);
  const projects = spaces[category].projects;
  const move = (index: number) => {
    const card = gallery.current?.children[index] as HTMLElement | undefined;
    if (card && gallery.current) gallery.current.scrollTo({ left: card.offsetLeft - gallery.current.offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    setPosition(index);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1) { setStep(2); requestAnimationFrame(() => stepTitle.current?.focus()); return; }
    const body = `Befun Pro ${t('프로젝트 문의')}\n\n${t('이름')}: ${fields.name}\n${t('이메일')}: ${fields.email}\n${t('회사 · 스튜디오')}: ${fields.company}\n${t('분야')}: ${t(fields.role)}\n\n${fields.message}`;
    window.location.href = `mailto:contact@befun.co.kr?subject=${encodeURIComponent(`[Befun Pro] ${t('프로젝트 문의')}`)}&body=${encodeURIComponent(body)}`;
    setPrepared(true);
  };
  return <div className={styles.page}>
    <section className={styles.hero} aria-labelledby="pro-title">
      <Image src="/imgs/pro/hero.avif" alt={t("맞춤 가구로 완성한 건축 공간")} fill priority sizes="100vw" />
      <div className={styles.heroContent}><p className={styles.wordmark}>befun<sup>PRO</sup></p><h1 id="pro-title">{t("당신의 프로젝트에,")}<br className={styles.mobileBreak} />  {t("더 많은 가능성을.")}</h1><p>{t("공간에 맞는 크기, 취향을 담은 소재.")}<br className={styles.mobileBreak} />  {t("아이디어를 완성하는 맞춤 가구.")}</p><a className={styles.whiteButton} href="#pro-apply">{t("프로젝트 문의하기")} <FiArrowRight /></a></div>
      <div className={styles.heroBottom}><span>ARCHITECTURE</span><span>INTERIOR</span><span>DESIGN</span></div>
    </section>
    <section className={`${styles.section} ${styles.intro}`}>
      <p className={styles.eyebrow}>{t("건축가 · 디자이너 · 공간을 만드는 사람들을 위해")}</p><h2>{t("프로젝트에 필요한 모든 선택")}</h2>
      <div className={styles.columns}>{[
        [FiHeadphones, '당신의 프로젝트에서 시작', '공간의 목적부터 필요한 수납까지. 프로젝트의 아이디어와 요구사항을 함께 나눠보세요.'],
        [FiSliders, '디테일까지 내 방식대로', '너비와 높이, 구성과 컬러를 조절해 공간의 비례에 맞는 가구를 디자인하세요.'],
        [FiLayers, '마감이 만드는 차이', '다양한 소재와 컬러를 살펴보고, 공간 전체의 분위기를 완성하는 조합을 찾아보세요.'],
      ].map(([Icon, title, text]) => { const Symbol = Icon as typeof FiLayers; return <article key={title as string}><Symbol /><div><h3>{t(title as string)}</h3><p>{t(text as string)}</p></div></article>; })}</div>
    </section>
    <section className={`${styles.section} ${styles.spaces}`} aria-labelledby="spaces-title">
      <p className={styles.eyebrow}>{t("공간을 위한 새로운 관점")}</p><h2 id="spaces-title">{t("다양한 공간,")}<br />{t("각자의 방식으로.")}</h2>
      <div className={styles.tabs} role="tablist" aria-label={t("공간 종류")}>{spaces.map((space, index) => <button key={space.title} role="tab" id={`space-tab-${index}`} aria-selected={category === index} aria-controls="pro-projects" tabIndex={category === index ? 0 : -1} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? spaces.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + spaces.length) % spaces.length;
        setCategory(next); setPosition(0); document.getElementById(`space-tab-${next}`)?.focus(); gallery.current?.scrollTo({ left: 0 });
      }} onClick={() => { setCategory(index); setPosition(0); gallery.current?.scrollTo({ left: 0 }); }}>{t(space.title)}</button>)}</div>
      <div id="pro-projects" role="tabpanel" aria-labelledby={`space-tab-${category}`}>
        <div ref={gallery} className={styles.gallery} onScroll={() => { const el = gallery.current; if (!el || !el.children.length) return; const width = (el.children[0] as HTMLElement).offsetWidth + 20; setPosition(Math.round(el.scrollLeft / width)); }}>
          {projects.map(([file, name]) => <article key={file}><Photo file={file} alt={`${name} ${t('공간 레퍼런스')}`} /><h3>{name}</h3><p>{t(spaces[category].title)}</p></article>)}
        </div>
        <div className={styles.galleryFooter}><p>{t("Tylko Pro 공간 레퍼런스")}</p><div><button aria-label={t("이전 프로젝트")} disabled={position === 0} onClick={() => move(Math.max(0, position - 1))}><FiArrowLeft /></button><button aria-label={t("다음 프로젝트")} disabled={position >= projects.length - visibleCards} onClick={() => move(Math.min(projects.length - 1, position + 1))}><FiArrowRight /></button></div></div>
      </div>
    </section>
    <section className={`${styles.section} ${styles.benefits}`}>
      <Photo file="benefits.avif" alt={t("버건디와 핑크 소재 샘플")} />
      <div><p className={styles.eyebrow}>{t("아이디어에서 구체적인 디자인까지")}</p><h2>{t("함께 만드는")}<br />{t("더 나은 공간.")}</h2><a href="#pro-apply" className={styles.darkButton}>{t("프로젝트 문의하기")} <FiArrowRight /></a>
        <div className={styles.accordion}>{benefits.map(([title, text, href, label]) => <details key={title}><summary>{t(title)}<FiPlus /></summary><div><p>{t(text)}</p><Link href={href}>{t(label)} <FiArrowRight /></Link></div></details>)}</div>
      </div>
    </section>
    <section className={styles.vision}><Image src="/imgs/pro/brand.avif" alt={t("소재와 디자인이 어우러진 공간")} fill sizes="100vw" /><div><p className={styles.eyebrow}>{t("당신의 아이디어를 위해")}</p><h2>{t("가구에 공간을 맞추는 대신,")}<br />{t("공간에 맞는 가구를.")}</h2><Link href="/configurator-intro" className={styles.whiteButton}>{t("나만의 가구 만들기")} <FiArrowRight /></Link></div></section>
    <ProReferenceSections />
    <section id="pro-apply" className={`${styles.section} ${styles.apply}`}>
      <div><p className={styles.eyebrow}>LET’S CREATE TOGETHER</p><h2>{t("좋은 공간의 시작,")}<br />Befun Pro.</h2><p className={styles.lead}>{t("어떤 공간을 만들고 계신가요?")}<br />{t("프로젝트의 이야기를 들려주세요.")}</p><ul>{['공간에 맞는 크기와 구성', '소재와 컬러 선택', '3D 디자인과 공유', '프로젝트 요구사항 정리'].map(text => <li key={text}><FiCheck />{t(text)}</li>)}</ul><a className={styles.textLink} href="mailto:contact@befun.co.kr">contact@befun.co.kr <FiArrowRight /></a><Photo file="form.avif" alt={t("컬러와 마감을 비교하는 디자인 작업")} className={styles.applyPhoto} /></div>
      <div className={styles.formCard}><div className={styles.steps}><span aria-current={step === 1 ? 'step' : undefined}><b>1</b>  {t("담당자 정보")}</span><span aria-current={step === 2 ? 'step' : undefined}><b>2</b>  {t("프로젝트 정보")}</span></div><h3 tabIndex={-1} ref={stepTitle}>{t(step === 1 ? '먼저, 당신을 소개해 주세요.' : '프로젝트에 대해 알려주세요.')}</h3>
        <form onSubmit={submit}>{step === 1 ? <><label>{t("이름")}<input autoComplete="name" required value={fields.name} onChange={e => setFields({ ...fields, name: e.target.value })} placeholder={t("이름을 입력해 주세요")} /></label><label>{t("이메일")}<input type="email" autoComplete="email" required value={fields.email} onChange={e => setFields({ ...fields, email: e.target.value })} placeholder="name@company.com" /></label></> : <><label>{t("회사 · 스튜디오")}<input autoComplete="organization" required value={fields.company} onChange={e => setFields({ ...fields, company: e.target.value })} /></label><label>{t("분야")}<select required value={fields.role} onChange={e => setFields({ ...fields, role: e.target.value })}><option value="">{t("선택해 주세요")}</option>{['건축', '인테리어 디자인', '리테일 · 브랜드', '호텔 · 레스토랑', '기타'].map(role => <option key={role} value={role}>{t(role)}</option>)}</select></label><label>{t("프로젝트 내용")}<textarea required rows={4} value={fields.message} onChange={e => setFields({ ...fields, message: e.target.value })} placeholder={t("공간의 용도, 필요한 가구, 수량과 일정을 알려주세요.")} /></label></>}
          <div className={styles.formActions}>{step === 2 && <button type="button" className={styles.backButton} onClick={() => { setStep(1); setPrepared(false); }}><FiArrowLeft />  {t("이전")}</button>}<button className={styles.darkButton} type="submit">{t(step === 1 ? '다음' : '이메일로 문의하기')} <FiArrowRight /></button></div>
          <p className={styles.note}>{t("입력한 내용으로 이메일 앱이 열립니다. 내용을 확인한 뒤 직접 전송해 주세요.")}</p>{prepared && <p role="status" className={styles.status}>{t("문의 내용을 준비했습니다. 이메일 앱에서 전송을 완료해 주세요.")}</p>}
        </form>
      </div>
    </section>
  </div>;
}
