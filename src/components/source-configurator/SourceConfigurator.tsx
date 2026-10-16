'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiArrowLeft, FiHeart, FiMaximize, FiMinus, FiPlus, FiRotateCcw, FiShare2 } from 'react-icons/fi';
import { calculateSource, readSourceState, sourceInitialState } from '@/lib/catalog-entry/source-designs/engine';
import type { SourceDefinition, SourceParameter, SourceState, FurnitureSnapshot } from '@/lib/catalog-entry/source-designs/types';
import { legacyEuro } from '@/lib/catalog-entry/legacy-designs/engine';
import legacyPalettes from '@/lib/catalog-entry/legacy-designs/palettes.json';
import palettes from '@/lib/catalog-entry/source-designs/palettes.json';
import { colorHex } from '@/lib/bookcase/material';
import { hasTonePricing, toneEuro } from '@/lib/bookcase/pricing';
import { quoteSofa } from '@/lib/commerce/reference-sofa-pricing';
import { eurToMarket } from '@/lib/commerce/eur-quote';
import { formatMoney } from '@/lib/commerce/markets';
import { useLocale } from '@/lib/commerce/useLocale';
import { MarketSelector } from '@/components/commerce/MarketSelector';
import { localizedProductName } from '@/lib/catalog-expansion/names';
import { sofaProductName } from '@/lib/sofa-catalog/names';
import { sofaColor, sofaFabric, smoothSwatch } from '@/lib/sofa/materials';
import type { Thumbnail } from '@/lib/bookcase/types';
import shared from '@/components/bookcase/bookcase.module.css';
import styles from './source-configurator.module.css';

const FurnitureScene = dynamic(() => import('@/components/bookcase/BookcaseScene'), { ssr: false });
const SofaScene = dynamic(() => import('./SourceSofaScene'), { ssr: false });
const labels: Record<string, string> = {
  legroomArea: '발 공간 너비', backPanels: '뒷판', density: '밀도', snapping: '정렬', topStorage: '상단 수납', bottomStorage: '하단 수납', topStorageHeight: '상단 수납 높이', bottomStorageHeight: '하단 수납 높이', rowHeight: '칸 높이', rowDoors: '도어', rowDrawers: '서랍', cablesSystem: '케이블 시스템', drawerHandleFlip: '서랍 손잡이 방향',
  width: '너비', height: '높이', depth: '깊이', columnCount: '구획 개수', ridges: '상단 돌출', handles: '손잡이',
  drawerStyle: '서랍 형식', lighting: '조명', local_height: '구획 높이', local_depth: '구획 깊이', localX: '구획 너비 조합',
  columnExposition: '도어 구성', doorDirection: '도어 방향', shelfDistribution: '선반 간격', cableOpenings: '케이블 홀', cableOpeningsTop: '상단 케이블 홀',
  drawersMerge: '서랍 합치기', style: '스타일', furnitureStyle: '스타일', direction: '방향', armrests: '팔걸이', integratedArmrest: '일체형 팔걸이',
  globalSeatDepth: '좌석 깊이', footrest: '풋스툴', replaceableCovers: '교체형 커버', widthLeft: '왼쪽 길이', widthRight: '오른쪽 길이',
  type: '모듈 종류', addModule: '모듈 추가', deleteModule: '모듈 삭제', extraCushion: '추가 쿠션', skin: '모서리 마감',
};
const optionNames: Record<string, string> = { true: '있음', false: '없음', none: '없음', none2: '오픈', left: '왼쪽', right: '오른쪽', both: '양쪽',
  full: '전체 도어', half: '부분 오픈', partial: '부분 도어', splitDouble: '상·하 도어', open: '오픈', internal: '내부', external: '외부', off: '없음',
  seater: '좌석', chaise_longue: '카우치', chaise_longue_armrest: '팔걸이 카우치', corner: '코너', footrest: '오토만', open_end: '오픈 모듈',
  Grid: '그리드', Pattern: '패턴', Slant: '슬랜트', Gradient: '그라디언트', Pixel: '픽셀', Mosaic: '모자이크', Left: '왼쪽', Right: '오른쪽', Off: '없음', On: '있음', None: '없음', Some: '일부', Max: '전체',
  Standard: '기본', High: '넓게', Low: '촘촘하게' };
const colorNames: Record<string, string> = { white: '화이트', whiteSmoke: '화이트', gray: '그레이', black: '블랙', clayBrown: '클레이 브라운', oliveGreen: '올리브 그린',
  terracotta: '테라코타', mint: '민트', skyBlue: '스카이 블루', burgundy: '버건디', cotton: '코튼', forestGreen: '포레스트 그린', lilac: '라일락', reisingerPink: '라이징거 핑크', sageGreen: '세이지 그린', darkBrownT02: '다크 브라운', sand: '샌드', duskBlue: '더스크 블루', stoneLightGray: '스톤 그레이', midnightBlue: '미드나이트 블루', butterYellow: '버터 옐로', deepPlum: '딥 플럼',
  offWhite: '오프화이트', cashmere: '캐시미어 베이지', pistachioGreen: '피스타치오 그린', onyxGray: '애쉬 그레이', mistyBlue: '미스티 블루',
  graphite: '그래파이트', beige: '베이지', pink: '핑크', lightCleaf: '라이트 우드', darkCleaf: '다크 우드', inkyBlack: '잉키 블랙', powderPink: '파우더 핑크' };
const uffTiles = ['glory_natural', 'glory_linen', 'glory_steel', 'glory_liver', 'glory_graphite', 'glory_pale', 'glory_brass', 'glory_thyme', 'glory_hazel', 'colormax_butter_yellow', 'colormax_beige', 'colormax_salt_pepper', 'colormax_mint', 'colormax_grey', 'colormax_black_pink'];
const uffNames = ['오이스터 그레이', '리넨 베이지', '문스톤 그레이', '토프', '그래파이트 그레이', '로즈우드', '브라스 옐로', '타임 그린', '월넛 브라운', '레몬 크림', '아몬드 크림', '솔트 & 페퍼', '세이지 & 민트', '멜란지 그레이', '플럼 & 차콜'];
const valueKey = (value: unknown): string => JSON.stringify(value, value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).sort() : undefined);
function colourName(name: string) {
  const standard = name.replace(/^matte([A-Z])/, (_, letter: string) => letter.toLowerCase());
  return `${colorNames[standard] ?? standard}${name.startsWith('matte') ? ' · 프리미엄 매트' : ''}`;
}
function ParameterControl({ name, parameter, value, change }: { name: string; parameter?: SourceParameter; value: unknown; change: (value: unknown) => void }) {
  if (!parameter?.visible || parameter.type === 'custom' || name === 'localMaterial') return null;
  const title = labels[name] ?? parameter.label ?? name;
  const choices = parameter.options ?? [];
  if (parameter.type.includes('ranges')) {
    const ranges = parameter.ranges ?? [];
    const numbers = choices.filter(option => typeof option.value === 'number' && !option.disabled).map(option => Number(option.value));
    const minimum = Math.min(...numbers, ...ranges.map(range => range.min));
    const maximum = Math.max(...numbers, ...ranges.map(range => range.max));
    const snap = (next: number) => {
      const candidates = [...numbers, ...ranges.map(range => Math.max(range.min, Math.min(range.max, range.min + Math.round((next - range.min) / range.step) * range.step)))];
      change(candidates.reduce((closest, current) => Math.abs(current - next) < Math.abs(closest - next) ? current : closest, candidates[0]));
    };
    return <label className={styles.dimension}>{title}<span><input aria-label={`${title} 슬라이더`} type="range" min={minimum} max={maximum} step={.1} value={Number(value)} disabled={!parameter.enabled} onChange={event => snap(Number(event.target.value))} /><input key={String(value)} type="number" aria-label={title} min={minimum} max={maximum} defaultValue={Number(value)} disabled={!parameter.enabled} onBlur={event => { if (event.target.value && Number.isFinite(Number(event.target.value))) snap(Number(event.target.value)); }} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} /><small>{name === 'density' ? '%' : 'cm'}</small></span></label>;
  }
  if (choices.length > 12 || parameter.type === 'action-options') return <label className={styles.select}>{title}<select aria-label={title} value={parameter.type === 'action-options' ? '' : valueKey(value)} disabled={!parameter.enabled} onChange={event => { const option = choices.find(option => valueKey(option.value) === event.target.value); if (option) change(option.value); }}><option value="" disabled>{title} 선택</option>{choices.map(option => <option key={valueKey(option.value)} value={valueKey(option.value)} disabled={option.disabled}>{optionNames[option.label] ?? option.label}</option>)}</select></label>;
  return <fieldset className={styles.parameter}><legend>{title}</legend><div>{choices.map(option => {
    const selected = parameter.type === 'multiselect' ? Array.isArray(value) && value.some(entry => valueKey(entry) === valueKey(option.value)) : valueKey(value) === valueKey(option.value);
    return <button type="button" key={valueKey(option.value)} disabled={option.disabled || !parameter.enabled} aria-pressed={selected} onClick={() => change(parameter.type === 'multiselect' ? selected ? (value as unknown[]).filter(entry => valueKey(entry) !== valueKey(option.value)) : [...(Array.isArray(value) ? value : []), option.value] : option.value)}>{optionNames[option.label] ?? optionNames[String(option.value)] ?? option.label}</button>;
  })}</div></fieldset>;
}
function Template({ thumbnail }: { thumbnail: Thumbnail }) {
  const panels = [...thumbnail.format.walls, ...thumbnail.format.slabs];
  if (!panels.length) return null;
  const left = Math.min(...panels.map(panel => panel.x1));
  const top = Math.max(...panels.map(panel => panel.y2));
  const width = Math.max(...panels.map(panel => panel.x2)) - left;
  return <svg viewBox={`${left - 25} -25 ${width + 50} ${top + 50}`} aria-hidden="true">{panels.map((panel, i) => <rect key={i} x={panel.x1} y={top - panel.y2} width={Math.max(panel.x2 - panel.x1, 8)} height={Math.max(panel.y2 - panel.y1, 8)} fill="#555" />)}{[...(thumbnail.format.doors ?? []), ...(thumbnail.format.drawers ?? [])].map((front, i) => <rect key={`front-${i}`} x={front.x1} y={top - front.y2} width={front.x2 - front.x1} height={front.y2 - front.y1} fill="#ddd" stroke="#777" strokeWidth={5} />)}</svg>;
}

export default function SourceConfigurator({ source }: { source: SourceDefinition }) {
  const params = useSearchParams();
  const { language, market } = useLocale();
  const legacy = source.shelfType === 0 || source.shelfType === 1;
  const sofa = source.shelfType === 10 || source.shelfType === 12;
  const originalState = useMemo(() => sourceInitialState(source), [source]);
  const [state, setState] = useState<SourceState>(() => { try { return params.get('design') ? readSourceState(params.get('design')!, source) : originalState; } catch { return originalState; } });
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState('size');
  const [open, setOpen] = useState(false);
  const [dimensions, setDimensions] = useState(false);
  const [full, setFull] = useState(false);
  const [reset, setReset] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [message, setMessage] = useState('');
  const [share, setShare] = useState('');
  const snapshot = useMemo(() => calculateSource(source, state, undefined, selected ?? 0), [source, state, selected]);
  const original = useMemo(() => calculateSource(source, originalState), [source, originalState]);
  const unchanged = JSON.stringify(original.preset) === JSON.stringify(snapshot.preset);
  const values = snapshot.configuration.values;
  const parameters = snapshot.configuration.parameters;
  const channels = values.channels ?? {};
  const selectedChannel = String((selected ?? 0) + 1);
  const sourceTitle = sofa ? sofaProductName(source.title, language) : localizedProductName(source.title, language);
  const sofaModel = source.line === 'uff' ? 'uff' : 'smooth';
  const materialId = sofa ? Number((values.material as { material?: number })?.material ?? (state.preset.material as { material?: number })?.material) : Number(values.material);
  const palette = ({ ...palettes, ...legacyPalettes } as Record<string, { id: number; outer: string; inner: string }[]>)[source.shelfType] ?? [];
  const selectedColour = palette.find(entry => entry.id === materialId);
  const storageKey = `befun-source-design-v1:${source.key}`;
  const category = source.category === 'wardrobe' ? 'wardrobe' : source.category === 'wallunit' ? 'wallunits' : source.category === 'tvstand' ? 'tv-stand' : source.category === 'chest' ? 'chest-of-drawers' : source.category === 'sofa' ? 'sofas' : source.category;
  const update = (patch: Record<string, unknown>) => {
    try { const next = calculateSource(source, state, patch, selected ?? 0); setState({ version: 1, key: source.key, preset: next.preset }); setMessage(''); setShare(''); }
    catch { setMessage('이 구성에서는 선택할 수 없는 옵션입니다.'); }
  };
  let euro: number | null = unchanged ? source.eur : null;
  if (!unchanged && legacy) { try { euro = legacyEuro(snapshot.geometry, source.category); } catch { /* Missing rates are not guessed. */ } }
  if (!unchanged && hasTonePricing(snapshot.geometry.shelf_type)) { try { euro = toneEuro(snapshot.geometry); } catch { /* Unobserved coefficient is not an invented price. */ } }
  if (!unchanged && sofa && !source.coversOnly) {
    const geometry = snapshot.geometry as unknown as Record<string, { id: string; material: number }[]>;
    const quote = quoteSofa(['seaters', 'armrests', 'chaise_longues', 'chaise_longue_armrests', 'corners', 'open_ends', 'footrests'].flatMap(key => geometry[key] ?? []), Boolean(state.preset.replaceable_covers));
    if (quote.status === 'available') euro = quote.regularEur;
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.closest('input,textarea,select,button,a,[role="dialog"]')))) return;
      event.preventDefault(); if (!event.repeat) setReset(value => value + 1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify({ ...state, preset: snapshot.preset })); setMessage('이 상품의 디자인을 저장했습니다.'); } catch { setMessage('브라우저 저장 공간에 접근할 수 없습니다.'); } };
  const load = () => { try { const raw = localStorage.getItem(storageKey); if (!raw) return setMessage('이 상품에 저장한 디자인이 없습니다.'); setState(readSourceState(raw, source)); setSelected(null); setMessage('저장한 디자인을 불러왔습니다.'); } catch { setMessage('저장한 디자인을 읽을 수 없습니다.'); } };
  const shareDesign = async () => {
    const url = new URL(legacy ? '/legacy-configurator' : sofa ? '/sofa-configurator' : '/bookcase-configurator', window.location.origin);
    url.searchParams.set('product', String(source.id)); url.searchParams.set('line', source.line); url.searchParams.set('design', JSON.stringify({ ...state, preset: snapshot.preset }));
    setShare(url.href);
    try { await navigator.clipboard.writeText(url.href); setMessage('디자인 링크를 복사했습니다.'); } catch { setMessage('아래 링크를 복사해 주세요.'); }
  };
  // The source's shelf type selects both its DNA and renderer. This entry edits
  // that exact photographed type; migrations use the dedicated existing editor.
  const globalKeys = Object.keys(parameters).filter(key => !['channels', 'lines', 'material', 'shelfType'].includes(key));
  const renderControl = (key: string) => <ParameterControl key={key} name={key} parameter={parameters[key]} value={values[key]} change={value => update({ [key]: value })} />;
  const selectMaterial = (id: number) => update({ material: sofa ? { material: id, material_backrest: id, material_cushion: id } : id });
  const fabricName = (id: number) => {
    const nameIndex = language === 'ko' ? 0 : language === 'ja' ? 2 : 1;
    const colour = sofaModel === 'uff' ? uffNames[id] : smoothSwatch(id)?.name[nameIndex];
    return `${colour ?? ''} · ${sofaFabric(id, sofaModel).name[nameIndex]}`;
  };
  const colorPanel = <section><h2>재질과 색상을 선택하세요</h2><div className={styles.colours}>
    {sofa ? Array.from({ length: source.shelfType === 12 ? 15 : 28 }, (_, id) => id).filter(id => id !== 25).map(id => {
      const name = fabricName(id);
      const image = sofaModel === 'uff' ? `/three/sofa/ui/tile_color_12_${uffTiles[id]}.png` : smoothSwatch(id)?.image;
      return <button key={id} aria-label={name} title={name} aria-pressed={materialId === id} onClick={() => selectMaterial(id)}>{image ? <Image src={image} alt="" width={72} height={96} /> : <span style={{ background: sofaColor(id, sofaModel) }} />}<small>{name}</small></button>;
    }) : palette.map(entry => <button key={entry.id} aria-label={entry.outer === entry.inner ? colourName(entry.outer) : `${colourName(entry.outer)} · ${source.shelfType === 1 ? '테두리' : '내부'} ${colourName(entry.inner)}`} title={`${colourName(entry.outer)} / ${colourName(entry.inner)}`} aria-pressed={materialId === entry.id} onClick={() => selectMaterial(entry.id)}><span style={{ background: `linear-gradient(135deg,${colorHex(entry.outer)} 65%,${colorHex(entry.inner)} 65%)` }} /><small>{colourName(entry.outer)}</small></button>)}
  </div><p className={styles.caption}>{sofa ? fabricName(materialId) : selectedColour ? `표면: ${colourName(selectedColour.outer)} · ${source.shelfType === 1 ? '테두리' : '내부'}: ${colourName(selectedColour.inner)}` : source.color}</p></section>;
  const hasSofaParts = !!snapshot.schema.find(group => group.key === 'sofaParts')?.children.length;
  return <div className={`${shared.root} ${styles.root} ${full ? shared.full : ''}`} data-source-product-key={source.key} data-lineup={source.line} data-width-mm={snapshot.geometry.width} data-height-mm={snapshot.geometry.height} data-depth-mm={snapshot.geometry.depth}>
    <div className={shared.viewer}>
      <div className={shared.brand}><Link href="/" aria-label="Befun 홈"><Image src="/imgs/icon/befun_logo.svg" alt="BEFUN" width={130} height={38} /></Link><Link href={`/furniture-c/${sofa ? 'sofas' : category}`}><FiArrowLeft /> 뒤로</Link></div>
      <button className={shared.fullButton} aria-label="전체 화면" aria-pressed={full} onClick={() => setFull(value => !value)}><FiMaximize /></button>
      {sofa ? hasSofaParts ? <SofaScene snapshot={snapshot} model={sofaModel} selected={selected} onSelect={index => { setSelected(index); if (index !== null) setTab('sections'); }} reset={reset} zoom={zoom} /> : source.image ? <div className={styles.coverPreview}><Image src={source.image} alt={sourceTitle} fill sizes="(max-width:800px) 100vw, 68vw" /></div> : null : <FurnitureScene snapshot={snapshot as unknown as FurnitureSnapshot} selected={selected} onSelect={index => { setSelected(index); if (index !== null) setTab('sections'); }} open={open} editingColumns={tab === 'sections'} dimensions={dimensions} reset={reset} zoom={zoom} />}
      <div className={shared.toolDock}><div className={shared.tools} role="toolbar" aria-label="가구 보기 도구"><button aria-label="축소" onClick={() => setZoom(value => value - 1)}><FiMinus /></button><button aria-label="확대" onClick={() => setZoom(value => value + 1)}><FiPlus /></button><button aria-label="치수 표시" aria-pressed={dimensions} onClick={() => setDimensions(value => !value)}>↔</button>{!sofa && <button aria-label="도어·서랍 열기" aria-pressed={open} onClick={() => setOpen(value => !value)}>▥</button>}<button aria-label="디자인 공유" onClick={shareDesign}><FiShare2 /></button></div></div>
      <button className={shared.resetButton} aria-label="시점 초기화" aria-keyshortcuts="Space" onClick={() => setReset(value => value + 1)}><FiRotateCcw /></button>
      {sofa && dimensions && <p className={styles.dimensions}>{snapshot.geometry.width / 10} × {snapshot.geometry.height / 10} × {snapshot.geometry.depth / 10} cm</p>}
    </div>
    <aside className={shared.sidebar}>
      <nav className={shared.tabs} aria-label="가구 편집 메뉴">{[['size', '크기·형태'], ['colour', '재질·색상'], ['sections', sofa ? '모듈 편집' : '구획 편집'], ['summary', '요약']].map(([key, label]) => <button key={key} aria-current={tab === key ? 'step' : undefined} onClick={() => setTab(key)}>{label}</button>)}</nav>
      <div className={shared.panel}>
        <header className={styles.product}><h1>{source.line === 'uff' ? 'Uff' : source.line === 'smooth' ? 'Smooth' : source.line === 'classic' ? 'Original Classic' : source.line === 'modern' ? 'Original Modern' : source.line === 'edge' ? 'Edge' : 'Tone'}</h1><p>{sourceTitle}</p><strong>{snapshot.geometry.width / 10} × {snapshot.geometry.height / 10} × {snapshot.geometry.depth / 10} cm</strong></header>
        {tab === 'size' && <section><h2>공간에 맞게 디자인하세요</h2>{globalKeys.map(renderControl)}{source.detached && <p className={styles.caption}>이 단품은 표시된 크기로 제공됩니다.</p>}</section>}
        {tab === 'colour' && colorPanel}
        {tab === 'sections' && <section><h2>{sofa ? '모듈을 선택하세요' : '구획을 선택하세요'}</h2><div className={styles.sectionButtons}>{Object.keys(channels).map((key, index) => <button key={key} aria-pressed={selected === index} aria-label={`${index + 1}${sofa ? '번 모듈' : source.category === 'vinyl_storage' ? '단' : '열'} 편집`} onClick={() => setSelected(index)}>{index + 1}</button>)}</div>
          {snapshot.thumbnails.length > 0 && <div className={styles.templates}>{snapshot.thumbnails.filter(thumbnail => thumbnail.render).map((thumbnail, index) => <button key={String(thumbnail.series_id)} aria-label={`내부 구성 ${index + 1}`} aria-pressed={channels[selectedChannel]?.seriesId === thumbnail.series_id} title={thumbnail.series_name} onClick={() => update({ channels: { [selectedChannel]: { seriesId: thumbnail.series_id } } })}><Template thumbnail={thumbnail} /></button>)}</div>}
          {Object.entries(parameters.channels?.[selectedChannel] ?? {}).map(([key, parameter]) => key === 'seriesId' ? null : <ParameterControl key={key} name={key} parameter={parameter} value={channels[selectedChannel]?.[key]} change={value => update({ channels: { [selectedChannel]: { [key]: value } } })} />)}
          {source.detached && colorPanel}
        </section>}
        {tab === 'summary' && <section><h2>나만의 디자인</h2><p>{sourceTitle}</p><p>{snapshot.geometry.width / 10} × {snapshot.geometry.height / 10} × {snapshot.geometry.depth / 10} cm</p><button className={shared.textButton} onClick={load}>저장한 디자인 불러오기</button><button className={shared.textButton} onClick={() => { setState(originalState); setSelected(null); setShare(''); setMessage('사진 속 초기 구성으로 돌아왔습니다.'); }}>사진 속 초기 구성으로</button></section>}
      </div>
      <footer className={shared.footer}><div className={shared.total}><span>합계</span><strong aria-live="polite" data-eur={euro ?? undefined}>{euro !== null ? formatMoney(eurToMarket(euro, market), market) : '가격 확인 필요'}</strong></div><div className={shared.marketRow}><MarketSelector /></div><p className={styles.caption}>독일 EUR 기준 참고 견적</p><div className={shared.actions}><button onClick={save}><FiHeart /> 디자인 저장</button><button onClick={shareDesign}><FiShare2 /> 링크 공유</button></div>{message && <p role="status">{message}</p>}{share && <input className={styles.share} aria-label="디자인 공유 링크" value={share} readOnly onFocus={event => event.target.select()} />}</footer>
    </aside>
  </div>;
}
