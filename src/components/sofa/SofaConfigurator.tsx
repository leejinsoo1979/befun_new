'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { MarketSelector } from '@/components/commerce/MarketSelector';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiPlus, FiMinus, FiRotateCcw, FiShare2, FiMaximize, FiCheck, FiHeart, FiArrowLeft, FiFileText } from 'react-icons/fi';
import { useLocale } from '@/lib/commerce/useLocale';
import { formatMoney } from '@/lib/commerce/markets';
import { eurToMarket, EUR_FX_DATE } from '@/lib/commerce/eur-quote';
import { DEFAULT_SOFA, DEFAULT_UFF, sofaModules, isChaise, parseSofaDesign, sofaGeometry, sofaModule, sofaQuote, type SofaDesign } from '@/lib/sofa/design';
import { sourceFabric } from '@/lib/sofa/source-model';
import { sofaFabrics, sofaFabric, smoothSwatch, fabricMaterialIds } from '@/lib/sofa/materials';
import styles from './sofa.module.css';

const Scene = dynamic(() => import('./SofaScene'), { ssr: false, loading: () => <div className={styles.loading}>B E F U N</div> });
const copy = {
  ko: { title:'나만의 모듈 소파', tabs:['레이아웃','크기','재질·색상','액세서리','요약'], straight:'일자형',chaise:'카우치형',left:'왼쪽',right:'오른쪽',direction:'방향',arms:'팔걸이',none:'없음',both:'양쪽',add:'좌석 추가',remove:'좌석 삭제',module:'좌석',width:'너비',depth:'시트 깊이',standard:'기본 58cm',deep:'깊게 70.5cm',fabric:'재질',color:'색상',footrest:'풋스툴',save:'디자인 저장',load:'저장한 디자인 불러오기',share:'링크 공유',saved:'이 브라우저에 저장했습니다.',loaded:'저장한 디자인을 불러왔습니다.',missing:'저장한 디자인이 없습니다.',invalid:'올바르지 않은 디자인 링크입니다. 기본 구성으로 열었습니다.',failed:'저장 공간에 접근할 수 없습니다.',copied:'공유 링크를 복사했습니다.',reset:'시점 초기화',full:'전체 화면',size:'전체 크기',note:'드래그하여 회전 · 스크롤하여 확대 · 좌석을 눌러 편집',source:'독일 EUR 기준 가격',fx:'환율 기준일',total:'합계',quote:'견적 다운로드',preview:'원단 색상과 3D 형상은 미리보기입니다.',file:'견적 파일을 저장했습니다.',home:'가구 선택',empty:'선택 안 함' },
  en: { title:'Your modular sofa',tabs:['Layout','Size','Material & colour','Accessories','Summary'],straight:'Straight',chaise:'Chaise',left:'Left',right:'Right',direction:'Direction',arms:'Armrests',none:'None',both:'Both',add:'Add seat',remove:'Remove seat',module:'Seat',width:'Width',depth:'Seat depth',standard:'Standard 58cm',deep:'Deep 70.5cm',fabric:'Material',color:'Colour',footrest:'Footstool',save:'Save design',load:'Load saved design',share:'Share link',saved:'Saved in this browser.',loaded:'Saved design loaded.',missing:'No saved design found.',invalid:'Invalid design link. Showing the default design.',failed:'Browser storage is unavailable.',copied:'Share link copied.',reset:'Reset view',full:'Full screen',size:'Overall dimensions',note:'Drag to rotate · Scroll to zoom · Select a seat to edit',source:'Germany EUR base price',fx:'Exchange rate date',total:'Total',quote:'Download quote',preview:'Fabric colours and 3D geometry are previews.',file:'Quote downloaded.',home:'Choose furniture',empty:'Not selected' },
  ja: { title:'自分だけのモジュールソファ',tabs:['レイアウト','サイズ','素材・色','アクセサリー','概要'],straight:'ストレート',chaise:'カウチ',left:'左',right:'右',direction:'向き',arms:'アームレスト',none:'なし',both:'両側',add:'シートを追加',remove:'シートを削除',module:'シート',width:'幅',depth:'座面の奥行き',standard:'標準 58cm',deep:'深め 70.5cm',fabric:'素材',color:'色',footrest:'オットマン',save:'デザインを保存',load:'保存したデザインを開く',share:'リンクを共有',saved:'このブラウザに保存しました。',loaded:'保存したデザインを開きました。',missing:'保存したデザインがありません。',invalid:'リンクが無効です。初期設定を表示します。',failed:'保存領域にアクセスできません。',copied:'リンクをコピーしました。',reset:'視点をリセット',full:'全画面',size:'全体サイズ',note:'ドラッグで回転・スクロールで拡大・シートを選択して編集',source:'ドイツEUR基準価格',fx:'為替基準日',total:'合計',quote:'見積書をダウンロード',preview:'生地の色と3D形状はプレビューです。',file:'見積書を保存しました。',home:'家具を選択',empty:'未選択' },
};
const uiCopy = {
  ko: { direction: '소파의 방향을 선택하세요', arms: '팔걸이를 추가하세요', integrated: '일체형 팔걸이', integratedHelp: '카우치 끝부분에만 적용됩니다', size: '공간에 맞게 크기를 조절하세요', material: '재질과 색상을 선택하세요', covers: '고정형 또는 교체형 커버', finish: '나만의 소파가 완성되었습니다', review: '견적 확인', model: '소파 모델', zoomIn: '확대', zoomOut: '축소', dimensions: '치수 표시', back: '뒤로', next: '다음', fixed: '고정형', replaceable: '교체형' },
  en: { direction: 'Choose your sofa orientation', arms: 'Add armrests', integrated: 'Integrated armrest', integratedHelp: 'Available for chaise ends only', size: 'Adjust the size to your space', material: 'Choose your material & colour', covers: 'Fixed or replaceable covers', finish: 'Your sofa is ready', review: 'Review quote', model: 'Sofa model', zoomIn: 'Zoom in', zoomOut: 'Zoom out', dimensions: 'Dimensions', back: 'Back', next: 'Next', fixed: 'Fixed', replaceable: 'Replaceable' },
  ja: { direction: 'ソファの向きを選んでください', arms: 'アームレストを追加', integrated: '一体型アームレスト', integratedHelp: 'カウチの端にのみ対応します', size: 'お部屋に合わせてサイズを調整', material: '素材と色を選んでください', covers: '固定式・交換式カバー', finish: 'ソファが完成しました', review: '見積もりを確認', model: 'ソファモデル', zoomIn: '拡大', zoomOut: '縮小', dimensions: '寸法表示', back: '戻る', next: '次へ', fixed: '固定式', replaceable: '交換式' },
};
const fabricTiles = ['glory_natural','glory_linen','glory_steel','glory_liver','glory_graphite','glory_pale','glory_brass','glory_thyme','glory_hazel','colormax_butter_yellow','colormax_beige','colormax_salt_pepper','colormax_mint','colormax_grey','colormax_black_pink'];
const fabricNames = {
  ko: ['오이스터 그레이','리넨 베이지','문스톤 그레이','토프','그래파이트 그레이','로즈우드','브라스 옐로','타임 그린','월넛 브라운','레몬 크림','아몬드 크림','솔트 앤 페퍼','세이지 앤 민트','멜란지 그레이','플럼 앤 코얼'],
  en: ['Oyster Grey','Linen Beige','Moonstone Grey','Taupe','Graphite Grey','Rosewood','Brass Yellow','Thyme Green','Walnut Brown','Lemon Cream','Almond Cream','Salt & Pepper','Sage & Mint','Melange Grey','Plum & Coal'],
  ja: ['オイスターグレー','リネンベージュ','ムーンストーングレー','トープ','グラファイトグレー','ローズウッド','ブラスイエロー','タイムグリーン','ウォルナットブラウン','レモンクリーム','アーモンドクリーム','ソルト＆ペッパー','セージ＆ミント','メランジグレー','プラム＆コール'],
};
function ChoiceCards({ items, value, onChange, label, wide = false }: { items: { key: string; label: string; image: string; mirror?: boolean }[]; value: string; onChange: (value: string) => void; label: string; wide?: boolean }) {
  return <div className={`${styles.cards} ${wide ? styles.wideCards : ''}`} role="group" aria-label={label}>{items.map(item => <button key={item.key} type="button" aria-label={item.label} title={item.label} aria-pressed={value === item.key} onClick={() => onChange(item.key)}>
    <Image src={`/three/sofa/ui/${item.image}.png`} alt="" width={144} height={192} unoptimized style={item.mirror ? {transform:'scaleX(-1)'} : undefined} />
    {wide && <span>{item.label}</span>}
    {value === item.key && <span className={styles.check}><FiCheck /></span>}
  </button>)}</div>;
}
const STORAGE = 'befun-sofa-design-v1';

export default function SofaConfigurator() {
  const params = useSearchParams();
  const { language, market } = useLocale(); const c = copy[language]; const u = uiCopy[language];
  const [design, setDesign] = useState<SofaDesign>(DEFAULT_UFF);
  const [tab, setTab] = useState(0); const [selected, setSelected] = useState<number | null>(0);
  const [reset, setReset] = useState(0); const [message, setMessage] = useState(''); const [share, setShare] = useState('');
  const [full, setFull] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const [zoom, setZoom] = useState(0);
  const panelScroll = useRef<HTMLDivElement>(null);
  const sections = useRef<(HTMLElement | null)[]>([]);
  const goTo = (index: number) => {
    setTab(index);
    const root = panelScroll.current, section = sections.current[index];
    if (root && section) root.scrollTo({ top: section.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  useEffect(() => {
    const root = panelScroll.current;
    if (!root) return;
    const track = () => {
      const y = root.getBoundingClientRect().top + 80;
      let active = 0;
      sections.current.forEach((section, index) => { if (section && section.getBoundingClientRect().top <= y) active = index; });
      setTab(active);
    };
    root.addEventListener('scroll', track, {passive:true});
    return () => root.removeEventListener('scroll', track);
  }, []);
  const modelParam = params.get('model');
  const encoded = params.get('design');
  useEffect(() => {
    if (!encoded) { setDesign(modelParam === 'smooth' ? DEFAULT_SOFA : DEFAULT_UFF); return; }
    let parsed: SofaDesign | null = null;
    try { parsed = parseSofaDesign(JSON.parse(encoded)); } catch { /* invalid URL */ }
    if (parsed) { setDesign(parsed); setSelected(0); } else setMessage(copy[language].invalid);
    // Locale changes must preserve edits made after opening a shared design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encoded, modelParam]);
  useEffect(() => { if (!full) return; const exit = (event: KeyboardEvent) => { if (event.key === 'Escape') setFull(false); }; window.addEventListener('keydown', exit); return () => window.removeEventListener('keydown', exit); }, [full]);
  const geometry = useMemo(() => sofaGeometry(design), [design]);
  const originalAppearance = sourceFabric(design.model, design.material) !== null;
  const quote = useMemo(() => sofaQuote(design), [design]);
  const fabric = sofaFabric(design.material,design.model); const langIndex = language === 'ko' ? 0 : language === 'ja' ? 2 : 1;
  const current = sofaModule(design.seats[Math.max(0, Math.min(selected ?? 0, design.seats.length - 1))].key,design.model)!;
  const uff = design.model === 'uff';
  const findModule = (key: string) => sofaModule(key,design.model)!;
  const deep = design.seats.some(s => s.key.startsWith('ST_') && findModule(s.key).depth === (uff ? 1000 : 1125));
  const fabrics = sofaFabrics(design.model);
  const availableModules = sofaModules(design.model);
  const seatDepth = uff ? (deep ? 1000 : 900) : (deep ? 1125 : 1000);
  const update = (patch: Partial<SofaDesign>) => {
    const next = parseSofaDesign({ ...design, ...patch });
    if (!next) return;
    setDesign(next);
    if (selected !== null && !sofaGeometry(next).placed.some(part => part.index === selected)) setSelected(null);
    setMessage(''); setShare('');
  };
  const changeSeat = (key: string) => update({ seats: design.seats.map((seat, index) => index === selected ? { key } : seat) });
  const layout = (chaise: boolean) => update({ seats: design.seats.map((s,i) => i === design.seats.length-1 ? {key:chaise ? (uff ? 'CL_D1500_W900' : 'CL_D1625_W875') : `ST_D${seatDepth}_W${uff ? 900 : 875}`} : s) });
  const add = () => { const seats = [...design.seats]; const index = seats.findIndex(s => isChaise(s.key)); seats.splice(index < 0 ? seats.length : index, 0, { key:`ST_D${seatDepth}_W${uff ? 900 : 875}` }); update({ seats }); setSelected(index < 0 ? seats.length - 1 : index); };
  const setArms = (value: string) => update({armrests:value as SofaDesign['armrests'],seats:design.seats.map(s=>s.key.startsWith('CA_') && !['right','both'].includes(value) ? {key:`CL_D1500_W${findModule(s.key).width-250}`} : s)});
  const integrated = (enabled: boolean) => update({armrests:enabled ? (design.armrests === 'left' || design.armrests === 'both' ? 'both' : 'right') : design.armrests,seats:design.seats.map(s=>isChaise(s.key) ? {key:enabled ? `CA_D1500_W${Math.min(900,s.key.startsWith('CA_') ? findModule(s.key).width-250 : findModule(s.key).width)+250}` : `CL_D1500_W${s.key.startsWith('CA_') ? findModule(s.key).width-250 : findModule(s.key).width}`} : s)});
  const save = () => { try { localStorage.setItem(STORAGE, JSON.stringify(design)); setMessage(c.saved); } catch { setMessage(c.failed); } };
  const load = () => { try { const saved = parseSofaDesign(JSON.parse(localStorage.getItem(STORAGE) ?? 'null')); if (saved) { setDesign(saved); setSelected(0); setMessage(c.loaded); } else setMessage(c.missing); } catch { setMessage(c.failed); } };
  const shareDesign = async () => { const url = new URL('/sofa-configurator', window.location.origin); url.searchParams.set('design', JSON.stringify(design)); setShare(url.href); try { await navigator.clipboard.writeText(url.href); setMessage(c.copied); } catch { /* selectable URL remains available */ } };
  const download = () => { const blob = new Blob([JSON.stringify({ design, dimensionsMm: { width: geometry.width, depth: geometry.depth, height: geometry.height }, quote, market, localPrice: quote.status === 'available' ? eurToMarket(quote.regularEur, market) : null, fxDate: EUR_FX_DATE }, null, 2)], { type:'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'befun-sofa-quote.json'; a.click(); URL.revokeObjectURL(url); setMessage(c.file); };
  const options = (items: [string, string][], value: string, onChange: (value: string) => void) => <div className={styles.options}>{items.map(([key, label]) => <button key={key} aria-pressed={value === key} onClick={() => onChange(key)}>{label}</button>)}</div>;
  const directionCards = ['left','right'].map(key => ({key, label:key === 'left' ? c.left : c.right, image:`tile_direction_${key}`}));
  const armCards = ['none','left','right','both'].map(key => ({key, label:c[key as 'none'|'left'|'right'|'both'], image:`tile_armrests_${key}`}));
  const widthChoices = availableModules.filter(m => m.type[0] === current.type[0] && m.depth === current.depth);
  return <main id="main" className={styles.page} aria-label={c.title}>
    <div className={styles.layout}>
      <div className={`${styles.viewer} ${full ? styles.full : ''}`}>
        <Scene design={design} selected={selected} onSelect={index => {setSelected(index); if (index !== null) goTo(index >= 0 ? 1 : index === -3 ? 3 : 0);}} reset={reset} zoom={zoom} />
        <div className={styles.brand}><Link href="/" aria-label="Befun"><Image src="/imgs/icon/befun-logo-static-black.png" alt="BEFUN" width={130} height={38} priority /></Link><Link href="/configurator-intro"><FiArrowLeft />{u.back}</Link></div>
        <h1 className={styles.srOnly}>{c.title}</h1>
        <div className={styles.viewButtons}><button aria-label={c.full} title={c.full} aria-pressed={full} onClick={() => setFull(!full)}><FiMaximize /></button></div>
        {showDimensions && <div className={styles.dimensions}>{geometry.width / 10} × {geometry.depth / 10} × {geometry.height / 10} cm</div>}
        <div className={styles.viewerBottom}>
          <div className={styles.tools} role="group" aria-label={c.note}>
            <button aria-label={u.zoomOut} title={u.zoomOut} onClick={() => setZoom(n => n-1)}><FiMinus /></button>
            <button aria-label={u.zoomIn} title={u.zoomIn} onClick={() => setZoom(n => n+1)}><FiPlus /></button>
            <span className={styles.divider} />
            <button aria-label={u.dimensions} title={u.dimensions} aria-pressed={showDimensions} onClick={() => setShowDimensions(!showDimensions)}><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 15 15 3l6 6L9 21zM7 11l3 3m0-6 3 3m0-6 3 3" /></svg></button>
            <button aria-label={c.reset} title={c.reset} onClick={() => setReset(n => n+1)}><FiRotateCcw /></button>
            <button aria-label={c.share} title={c.share} onClick={shareDesign}><FiShare2 /></button>
          </div>
          <button className={styles.addModule} disabled={design.seats.length >= 5} onClick={add}><FiPlus />{c.add}</button>
        </div>
        {!originalAppearance && <p className={styles.hint}>{c.preview}</p>}
      </div>
      <aside className={styles.panel} aria-label={c.title}>
        <nav className={styles.tabs} aria-label={c.title}>{c.tabs.map((label,index) => <button aria-current={index === tab ? 'step' : undefined} aria-controls={`sofa-section-${index}`} key={label} onClick={() => goTo(index)}>{index === tab && <FiCheck />}{label}</button>)}</nav>
        <div className={styles.controls} ref={panelScroll}>
          <section id="sofa-section-0" ref={node => {sections.current[0]=node;}}>
            <h2>{u.direction}</h2>
            <ChoiceCards label={c.direction} items={directionCards} value={design.direction} onChange={v => update({direction:v as SofaDesign['direction']})} />
            <p className={styles.selection}>{c.direction}: {c[design.direction]}</p>
            <h2>{u.arms}</h2><ChoiceCards label={c.arms} items={armCards} value={design.armrests} onChange={setArms} />
            <p className={styles.selection}>{c.arms}: {c[design.armrests]}</p>
            {uff && design.seats.some(s=>isChaise(s.key)) && <><h2>{u.integrated}</h2><p className={styles.help}>{u.integratedHelp}</p>
              <ChoiceCards label={u.integrated} items={[{key:'off',label:c.none,image:'tile_integrated_armrest_none'},{key:'on',label:c[design.direction],image:'tile_integrated_armrest_right',mirror:design.direction==='left'}]} value={design.seats.some(s=>s.key.startsWith('CA_'))?'on':'off'} onChange={v=>integrated(v==='on')} />
              <p className={styles.selection}>{u.integrated}: {design.seats.some(s=>s.key.startsWith('CA_')) ? c[design.direction] : c.none}</p></>}
          </section>
          <section id="sofa-section-1" ref={node => {sections.current[1]=node;}}>
            <h2>{u.size}</h2><p className={styles.measure}>{geometry.width / 10} × {geometry.depth / 10} × {geometry.height / 10}<small> cm</small></p>
            <h3>{c.module}</h3><div className={styles.options}>{design.seats.map((s,index) => <button key={index} aria-pressed={selected === index} onClick={() => setSelected(index)}>{index+1}</button>)}</div>
            {selected !== null && selected >= 0 ? <>
              <label className={styles.select}>{c.width}<select value={current.key} onChange={e => changeSeat(e.target.value)}>{widthChoices.map(m => <option key={m.key} value={m.key}>{m.width/10} cm</option>)}</select></label>
              <input className={styles.widthRange} type="range" aria-label={`${c.module} ${selected+1} ${c.width}`} min={0} max={widthChoices.length-1} value={widthChoices.findIndex(m=>m.key===current.key)} onChange={e=>changeSeat(widthChoices[Number(e.target.value)].key)} />
            </> : <p className={styles.selection}>{c.empty}</p>}
            <h3>{c.depth}</h3>{options([['standard',uff ? '90 cm' : c.standard],['deep',uff ? '100 cm' : c.deep]],deep?'deep':'standard',v=>update({seats:design.seats.map(s=>s.key.startsWith('ST_')?{key:`ST_D${uff?(v==='deep'?1000:900):(v==='deep'?1125:1000)}_W${findModule(s.key).width}`}:s)}))}
            <h3>{c.tabs[0]}</h3>{options([['straight',c.straight],['chaise',c.chaise]],design.seats.some(s=>isChaise(s.key))?'chaise':'straight',v=>layout(v==='chaise'))}
            <button className={styles.add} disabled={selected === null || selected < 0 || design.seats.length<=1} onClick={()=>{update({seats:design.seats.filter((_,i)=>i!==selected)});setSelected(0);}}><FiMinus />{c.remove}</button>
          </section>
          <section id="sofa-section-2" ref={node => {sections.current[2]=node;}}>
            <h2>{u.material}</h2><div className={styles.fabric}>{fabrics.map(f=><button key={f.id} aria-pressed={fabric.id===f.id} onClick={()=>update({material:f.start})}>{f.name[langIndex]}</button>)}</div>
            <div className={styles.swatches}>{fabricMaterialIds(fabric, design.model).map(material => {
              const swatch = smoothSwatch(material);
              const name = uff ? fabricNames[language][material] : (swatch?.name[langIndex] ?? c.preview);
              return <button key={material} disabled={!sourceFabric(design.model, material)} aria-label={name} title={name} aria-pressed={design.material===material} onClick={()=>update({material})}>
                <Image src={uff ? `/three/sofa/ui/tile_color_12_${fabricTiles[material]}.png` : swatch!.image} width={84} height={112} alt="" unoptimized />
                {design.material===material && <span className={styles.check}><FiCheck /></span>}
              </button>;
            })}</div><p className={styles.selection}>{c.color}: {uff ? fabricNames[language][design.material] : (smoothSwatch(design.material)?.name[langIndex] ?? c.preview)}</p>
            {!originalAppearance && <small>{c.preview}</small>}
          </section>
          <section id="sofa-section-3" ref={node => {sections.current[3]=node;}}>
            {uff && <><h2>{u.covers}</h2><ChoiceCards wide label={u.covers} items={[{key:'fixed',label:u.fixed,image:'fixed'},{key:'replaceable',label:u.replaceable,image:'exchangeable'}]} value={design.replaceableCovers?'replaceable':'fixed'} onChange={v=>update({replaceableCovers:v==='replaceable'})} /><p className={styles.selection}>{design.replaceableCovers?u.replaceable:u.fixed}</p></>}
            <h2>{c.footrest}</h2><ChoiceCards wide label={c.footrest} items={[{key:'yes',label:c.footrest,image:'tile_footrest'}]} value={design.footrest?'yes':'none'} onChange={()=>update({footrest:design.footrest?null:(uff?'FR_D700_W900':'FR_D625_W875')})} />
            {design.footrest && <label className={styles.select}>{c.size}<select value={design.footrest} onChange={e=>update({footrest:e.target.value})}>{availableModules.filter(m=>m.key.startsWith('FR_')&&m.width>=m.depth).map(m=><option key={m.key} value={m.key}>{m.width/10} × {m.depth/10} cm</option>)}</select></label>}
          </section>
          <section id="sofa-section-4" ref={node => {sections.current[4]=node;}}>
            <h2>{u.finish}</h2><dl className={styles.summary}><dt>{c.module}</dt><dd>{design.seats.length}</dd><dt>{c.size}</dt><dd>{geometry.width/10} × {geometry.depth/10} × {geometry.height/10} cm</dd><dt>{c.fabric}</dt><dd>{fabric.name[langIndex]}</dd><dt>{c.arms}</dt><dd>{c[design.armrests]}</dd><dt>{c.footrest}</dt><dd>{design.footrest?c.footrest:c.none}</dd></dl>
            <button className={styles.add} disabled={quote.status!=='available'} onClick={download}><FiFileText />{c.quote}</button>
            <button className={styles.load} onClick={load}>{c.load}</button>
            <details className={styles.details}><summary>{u.model}</summary>{options([['smooth','Smooth'],['uff','Uff']],design.model,v=>{setDesign(v==='uff'?DEFAULT_UFF:DEFAULT_SOFA);setSelected(0);setMessage('');setShare('');})}</details>
            <p className={styles.provenance}>{c.source}{quote.status==='available'?` · €${quote.regularEur.toLocaleString('en-US')}`:''}{market!=='EU'&&` · ${c.fx} ${EUR_FX_DATE}`}</p>
          </section>
        </div>
        <div className={styles.checkout}>
          <div className={styles.price}><span>{c.total}</span><strong>{quote.status==='available'?formatMoney(eurToMarket(quote.regularEur,market),market):'—'}</strong></div>
          <div className={styles.actions}><button className={styles.primary} disabled={quote.status!=='available'} onClick={()=>tab===4?download():goTo(4)}><FiFileText />{tab===4?c.quote:u.review}</button><button onClick={save}><FiHeart />{c.save}</button></div>
          <div className={styles.checkoutMeta}><span>BEFUN · {design.model.toUpperCase()}</span><MarketSelector /></div>
          {message && <p className={styles.message} role="status">{message}</p>}{share && <input className={styles.share} aria-label={c.share} readOnly value={share} onFocus={e=>e.target.select()} />}
        </div>
      </aside>
    </div>
  </main>;
}
