'use client';

import { useLocale } from '@/lib/commerce/useLocale';
import { MarketSettings } from '@/components/commerce/MarketSelector';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { FiArrowRight, FiBox, FiEdit3, FiHelpCircle, FiSearch, FiTruck } from 'react-icons/fi';
import { Breadcrumbs } from './CatalogPages';
import { ReferenceImage } from './StorefrontUI';
import { faqItems, infoTitles } from './navigation';
import styles from './storefront.module.css';

export function FaqPage() {
  const { t } = useLocale();
  const [query,setQuery]=useState('');
  const [group,setGroup]=useState('전체');
  const groups=['전체','디자인','소재','주문','배송'];
  const matches=faqItems.filter(item=>(group==='전체'||item.group===group)&&`${t(item.q)} ${t(item.a)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <section className={styles.pageSection}><Breadcrumbs title={t("고객 지원")} /><h1>{t("무엇을 도와드릴까요?")}</h1><label className={styles.searchField}><FiSearch /><input aria-label={t("도움말 검색")} placeholder={t("질문을 검색하세요")} value={query} onChange={e=>setQuery(e.target.value)} /></label><div className={styles.supportTiles}>{[['주문 상태','/contact?topic=order_status',FiBox],['배송 안내','/shipping',FiTruck],['디자인 가이드','/configurator',FiEdit3],['제품 정보','/furniture-c',FiBox],['소재와 컬러','/material-samples',FiEdit3],['문제 신고','/contact?topic=issue',FiHelpCircle]].map(([title,href,Icon])=>{const Symbol=Icon as typeof FiBox;return <Link key={t(title as string)} href={href as string} className={styles.supportTile}><Symbol /><h2>{t(title as string)}</h2><FiArrowRight /></Link>;})}</div><div className={styles.supportLayout}><nav className={styles.supportSidebar} aria-label={t("도움말 종류")}>{groups.map(item=><button key={item} aria-pressed={group===item} onClick={()=>setGroup(item)}>{t(item)}</button>)}</nav><div className={styles.faq}><h2>{t(group==='전체'?'자주 묻는 질문':group)}</h2>{matches.map(item=><details key={item.q}><summary>{t(item.q)}<span>+</span></summary><p>{t(item.a)}</p></details>)}{!matches.length?<p className={styles.empty}>{t("검색 결과가 없습니다. 다른 검색어를 입력해 보세요.")}</p>:null}<Link href="/contact" className={styles.outlineButton}>{t("더 궁금한 점이 있나요?")} <FiArrowRight /></Link></div></div></section>;
}
const topics:Record<string,string>={general:'일반 문의',order_status:'주문 상태',cancellation:'주문 취소',issue:'제품 문제',pro:'프로젝트 문의',shipping:'배송 문의',privacy:'개인정보 문의',whatsapp:'WhatsApp 상담',chat:'채팅 상담'};
export function ContactPage({initialTopic='general'}:{initialTopic?:string}) {
  const { t } = useLocale();
  const [topic,setTopic]=useState(topics[initialTopic]?initialTopic:'general');
  const [prepared,setPrepared]=useState(false);
  function prepare(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const text=`${t('문의 종류')}: ${t(topics[topic])}\n${t('이름')}: ${data.get('name')}\n${t('이메일')}: ${data.get('email')}\n${t('주문 번호')}: ${data.get('order') || '-'}\n\n${data.get('message')}`;
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='befun-inquiry.txt';link.click();URL.revokeObjectURL(url);setPrepared(true);
  }
  return <section className={styles.pageSection}><Breadcrumbs title={t("문의하기")} /><h1>{t("어떤 도움이 필요하세요?")}</h1><div className={styles.supportLayout}><nav className={styles.supportSidebar} aria-label={t("문의 종류")}>{Object.entries(topics).map(([key,title])=><Link key={key} aria-current={topic===key?'page':undefined} href={`/contact?topic=${key}`} onClick={()=>{setTopic(key);setPrepared(false);}}>{t(title)}</Link>)}</nav><div><h2>{t(topics[topic])}</h2>{topic==='order_status'?<div className={styles.supportTile}><h2>{t("내 주문 확인")}</h2><p>{t("주문에 사용한 계정으로 로그인한 후 주문 내역과 상세 정보를 확인하세요.")}</p><Link href="/mypage" className={styles.darkButton}>{t("주문 내역 확인")} <FiArrowRight /></Link></div>:null}{topic==='cancellation'?<p className={styles.referenceNotice}>{t("이 화면에서 주문을 자동 취소하지 않습니다. 주문 번호와 요청 내용을 준비하고 주문 상세에서 현재 상태를 확인하세요.")}</p>:null}<p className={styles.referenceNotice}>{t("Befun의 문의 수신 이메일과 상담 API가 아직 설정되어 있지 않습니다. 아래 양식은 문의 내용을 파일로 저장하며, 상담 담당자에게 전송하지 않습니다.")}</p><form onSubmit={prepare} className={styles.form}><label>{t("이름")}<input name="name" autoComplete="name" required /></label><label>{t("이메일")}<input name="email" type="email" autoComplete="email" required /></label><label>{t("주문 번호 (선택)")}<input name="order" /></label><label>{t("문의 내용")}<textarea name="message" required /></label><button type="submit" className={styles.darkButton}>{t("문의 내용 저장")} <FiArrowRight /></button>{prepared?<p role="status">{t("문의 내용이 파일로 저장되었습니다. 아직 전송되지 않았습니다.")}</p>:null}</form></div></div></section>;
}
export function ShippingPage() {
  const { t } = useLocale();
  return <section className={styles.pageSection}><Breadcrumbs title={t("배송 안내")} /><h1>{t("디자인에서 배송까지")}</h1><div className={styles.supportLayout}><nav className={styles.supportSidebar}><a href="#shipping-order">{t("주문 절차")}</a><a href="#shipping-address">{t("배송 정보")}</a><a href="#shipping-status">{t("주문 상태")}</a><a href="#shipping-policy">{t("배송 · 반품 정책")}</a></nav><div className={styles.article}><h2 id="shipping-order">{t("완성한 디자인을 주문하세요")}</h2><p>{t("커스터마이저에서 크기와 컬러, 선반과 도어 구성을 확인하고 장바구니에 담습니다. 장바구니에서 수량과 최종 금액을 확인한 후 주문 화면으로 이동하세요.")}</p><h2 id="shipping-address">{t("배송 정보를 입력하세요")}</h2><p>{t("주문 화면에서 수령인, 연락처, 주소와 배송 메모를 입력할 수 있습니다. 결제 전에 주소와 주문 구성을 다시 확인하세요.")}</p><h2 id="shipping-status">{t("내 주문을 확인하세요")}</h2><p>{t("마이페이지에서 주문 내역을 열고 주문 상세의 상태와 배송 정보를 확인할 수 있습니다.")}</p><Link href="/mypage" className={styles.outlineButton}>{t("내 주문 확인")}</Link><h2 id="shipping-policy">{t("배송과 반품 정책")}</h2><p className={styles.referenceNotice}>{t("Befun의 실제 배송비, 제작 기간, 반품 조건이 아직 제공되지 않았습니다. Tylko의 배송·반품 정책을 Befun의 약속으로 적용하지 않습니다.")}</p><Link href="/contact?topic=shipping" className={styles.darkButton}>{t("배송 문의 준비")}</Link></div></div></section>;
}
export function PolicyPage({path}:{path:string}) {
  const { t } = useLocale();
  const title=infoTitles[path];
  const isPrivacy=path==='privacy_policy';
  return <section className={styles.pageSection}><Breadcrumbs title={title} /><h1>{t(title)}</h1><div className={styles.supportLayout}><nav className={styles.supportSidebar}><a href="#policy-intro">{t("안내")}</a><a href="#policy-current">{t("현재 서비스")}</a><a href="#policy-contact">{t("문의")}</a></nav><article className={styles.article}><p className={styles.referenceNotice}>{t("이 페이지는 정책 화면의 구조를 제공합니다. Befun 사업자 정보와 승인된 정책 원문이 아직 제공되지 않아 실제 계약 조건을 대신 작성하지 않았습니다.")}</p><h2 id="policy-intro">{t(title)}</h2><p>{t(isPrivacy?'계정, 주문 및 디자인 저장 기능에는 이메일과 배송 정보가 사용됩니다. 실제 처리 목적·보관 기간·수탁 업체 안내는 운영자의 정책 원문이 필요합니다.':path==='terms-gift-card'?'Befun의 기프트카드 상품 및 발행·사용·환불 조건은 아직 등록되지 않았습니다.':path==='digital-services-act'?'신고 접수와 처리 절차는 운영자의 실제 연락처 및 정책에 따라 안내되어야 합니다.':'주문, 결제, 배송과 계정 이용 조건은 운영자의 승인된 안내를 기준으로 제공되어야 합니다.')}</p><h2 id="policy-current">{t("현재 서비스에서 확인할 수 있는 기능")}</h2><ul><li>{t("맞춤 가구의 크기·소재·구성과 계산 가격 확인")}</li><li>{t("브라우저에 저장되는 장바구니와 즐겨찾기")}</li><li>{t("로그인 계정의 디자인 및 주문 내역 확인")}</li></ul><h2 id="policy-contact">{t("문의하기")}</h2><p>{t("주문 관련 내용은 마이페이지에서 확인할 수 있습니다. 개인정보나 정책 관련 문의는 문의 내용을 준비한 후 운영자가 제공하는 수신처로 전달해야 합니다.")}</p><Link href={isPrivacy?'/contact?topic=privacy':'/contact'} className={styles.outlineButton}>{t("문의 화면")}</Link><p><a href={`https://tylko.com/en-uk/${path}`} target="_blank" rel="noreferrer">{t("Tylko 원본 정책 화면 보기")}</a>  {t("(Befun에 적용되지 않음)")}</p></article></div></section>;
}
const preferenceKey = 'befun-cookie-preferences';
function subscribePreferences(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('befun-cookie-change', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('befun-cookie-change', callback); };
}
function readPreferences() { try { return localStorage.getItem(preferenceKey); } catch { return null; } }
export function CookiePage() {
  const { t } = useLocale();
  const raw = useSyncExternalStore(subscribePreferences, readPreferences, () => null);
  let stored = { analytics: false, marketing: false };
  try { if (raw) { const value=JSON.parse(raw); stored={analytics:value.analytics===true,marketing:value.marketing===true}; } } catch { /* 잘못된 설정은 기본값을 사용한다. */ }
  const [analytics,setAnalytics]=useState<boolean | null>(null);
  const [marketing,setMarketing]=useState<boolean | null>(null);
  const [status,setStatus]=useState('');
  return <section className={styles.pageSection}><Breadcrumbs title={t("쿠키 설정")} /><h1>{t("개인정보 선택")}</h1><div className={styles.article}><p>{t("로그인과 장바구니를 위한 필수 저장 기능은 유지됩니다. 이 쇼핑몰에는 선택형 분석·마케팅 서비스가 연결되어 있지 않습니다.")}</p><div className={styles.faq}><details open><summary>{t("필수 저장 기능")}</summary><p>{t("로그인 세션, 장바구니와 즐겨찾기를 유지하는 데 필요한 저장 기능입니다.")}</p></details></div><form className={styles.form} onSubmit={e=>{e.preventDefault();try{localStorage.setItem(preferenceKey,JSON.stringify({analytics:analytics??stored.analytics,marketing:marketing??stored.marketing}));window.dispatchEvent(new Event('befun-cookie-change'));setStatus('이 브라우저에 설정을 저장했습니다.');}catch{setStatus('브라우저 저장소를 사용할 수 없어 설정을 저장하지 못했습니다.');}}}><label><span><input type="checkbox" checked={analytics??stored.analytics} onChange={e=>setAnalytics(e.target.checked)} />  {t("분석 서비스 동의")}</span></label><label><span><input type="checkbox" checked={marketing??stored.marketing} onChange={e=>setMarketing(e.target.checked)} />  {t("마케팅 서비스 동의")}</span></label><button type="submit" className={styles.darkButton}>{t("선택 저장")}</button>{status?<p role="status">{t(status)}</p>:null}</form></div></section>;
}
export function GiftPage() {
  const { t } = useLocale();
  const [amount,setAmount]=useState(100000);
  return <><section className={styles.pageHero}><ReferenceImage source="https://media.tylko.com/cloudinary/pdp/gift-card/banner/D.webp" fallback="creator-3.avif" alt={t("기프트카드")} sizes="100vw" /><div className={styles.pageHeroContent}><h1>{t("취향을 선물하는 즐거움")}</h1><p>{t("좋아하는 공간을 직접 고르는 선물.")}</p><a href="#gift-options" className={styles.whiteButton}>{t("기프트카드 살펴보기")}</a></div></section><section id="gift-options" className={styles.pageSection}><div className={styles.contentSplit}><div className={styles.editorialImage}><ReferenceImage source="https://media.tylko.com/cloudinary/pdp/gift-card/banner/D.webp" fallback="creator-3.avif" alt={t("선물 디자인")} sizes="50vw" /></div><div><h2>E-Gift Card</h2><p className={styles.pageLead}>{t("원하는 금액을 선택하세요.")}</p><div className={styles.filterTabs}>{[50000,100000,200000,500000].map(value=><button key={value} aria-pressed={amount===value} onClick={()=>setAmount(value)}>{t(`${value.toLocaleString('ko-KR')}원`)}</button>)}</div><p className={styles.referenceNotice}>{t("기프트카드 선택 화면입니다. Befun의 상품 및 발행 시스템이 등록되지 않아 결제를 진행하지 않습니다.")}</p><Link className={styles.outlineButton} href="/terms-gift-card">{t("기프트카드 이용 안내")}</Link></div></div><div className={styles.faq}><details><summary>{t("기프트카드는 어떻게 사용하나요?")}</summary><p>{t("Befun의 발행·사용 조건이 확정된 후 사용 방법이 제공됩니다.")}</p></details></div></section></>;
}
export function CorporatePage({path}:{path:string}) {
  const { t } = useLocale();
  const investor=path==='investor-relations-login';
  return <section className={styles.pageSection}><Breadcrumbs title={infoTitles[path]} /><h1>{t(infoTitles[path])}</h1>{investor?<div className={styles.accountForm}><h2>{t("투자자 자료")}</h2><p className={styles.referenceNotice}>{t("Befun의 투자자 자료와 전용 접근 권한이 등록되지 않았습니다. 일반 쇼핑 계정 로그인과는 별도 서비스입니다.")}</p><a href="https://tylko.com/en-uk/investor-relations-login" className={styles.outlineButton} target="_blank" rel="noreferrer">{t("Tylko 원본 투자자 화면")}</a></div>:path==='tylko-sound'?<div className={styles.contentSplit}><div className={styles.editorialImage}><ReferenceImage source="https://media.tylko.com/cloudinary/lp/inspirations/hero/XLD.webp" fallback="creator-9.avif" alt={t("음악과 공간")} sizes="50vw" /></div><div><h2>{t("공간에 흐르는 음악")}</h2><p>{t("가구와 음악이 만나는 원본 Tylko Sound를 살펴보세요.")}</p><a href="https://tylko.com/en-uk/tylko-sound" target="_blank" rel="noreferrer" className={styles.outlineButton}>{t("Tylko Sound 듣기")}</a></div></div>:<><p className={styles.pageLead}>{t("브랜드와 제품의 이야기를 찾아보세요.")}</p><div className={styles.supportTiles}><Link className={styles.supportTile} href="/about-tylko"><h2>{t("브랜드 소개")}</h2><span>{t("소개 보기")} <FiArrowRight /></span></Link><Link className={styles.supportTile} href="/journal"><h2>{t("디자인 이야기")}</h2><span>{t("저널 보기")} <FiArrowRight /></span></Link><Link className={styles.supportTile} href="/contact"><h2>{t("미디어 문의")}</h2><span>{t("문의 준비")} <FiArrowRight /></span></Link></div><p className={styles.referenceNotice}>{t("Befun의 공식 미디어 키트와 보도 자료는 아직 등록되지 않았습니다.")}</p></>}</section>;
}
export function RegionPage() {
  const { t } = useLocale();
  return <section className={styles.pageSection}><Breadcrumbs title={t('지역 설정')} /><h1>{t('언어와 지역')}</h1><MarketSettings /></section>;
}
