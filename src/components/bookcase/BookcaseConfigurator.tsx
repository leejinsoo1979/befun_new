'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {FiArrowLeft,FiMinus,FiPlus,FiRotateCcw,FiMaximize,FiShare2,FiHeart,FiCheck,FiEdit2,FiFileText,FiX} from 'react-icons/fi';
import {toneEuro} from '@/lib/bookcase/pricing';
import {BookcaseToolIcon} from './BookcaseToolIcon';
import {calculate,initialDesign,readDesign,starts,switchBedsideStyle} from '@/lib/bookcase/engine';
import type {BedsideStyle,Design,Parameter,Snapshot,StartKey,Thumbnail,Value} from '@/lib/bookcase/types';
import bedsidePalette from '@/lib/bookcase/data/bedside-palette.json';
import palette from '@/lib/bookcase/data/palette.json';
import materialColors from '@/lib/bookcase/data/colors.json';
import {colorHex} from '@/lib/bookcase/material';
import {useLocale} from '@/lib/commerce/useLocale';
import {MarketSelector} from '@/components/commerce/MarketSelector';
import {formatMoney} from '@/lib/commerce/markets';
import {eurToMarket} from '@/lib/commerce/eur-quote';
import styles from './bookcase.module.css';
const Scene=dynamic(()=>import('./BookcaseScene'),{ssr:false,loading:()=> <div className={styles.loading}>가구 불러오는 중…</div>});
const labels:Record<string,string>={width:'너비',height:'높이',depth:'깊이',columnCount:'열 개수',ridges:'상부 돌출',handles:'손잡이',local_depth:'열 깊이',local_height:'열 높이',columnExposition:'도어 구성',doorDirection:'도어 열림 방향',shelfDistribution:'선반 간격',cableOpenings:'케이블 홀',cableOpeningsTop:'상단 케이블 홀'};
const options:Record<string,string>={true:'있음',false:'없음',none2:'오픈',splitDouble:'상·하부 도어',partial:'부분 도어',full:'전체 도어',High:'넓게',Standard:'기본',left:'왼쪽',right:'오른쪽',middle:'가운데',off:'없음'};
const colors:Record<string,string>={offWhite:'오프화이트',cashmere:'캐시미어 베이지',pistachioGreen:'피스타치오 그린',white:'화이트',gray:'그레이',clayBrown:'클레이 브라운',oliveGreen:'올리브 그린',sand:'샌드',black:'블랙',duskBlue:'더스크 블루',stoneLightGray:'스톤 그레이',midnightBlue:'미드나이트 블루',butterYellow:'버터 옐로',deepPlum:'딥 플럼',onyxGray:'애쉬 그레이',mistyBlue:'미스티 블루'};
function validNumbers(p:Parameter):number[]{
 const values=(p.options??[]).filter(o=>!o.disabled&&typeof o.value==='number').map(o=>o.value as number);
 for(const r of p.ranges??[])for(let v=r.min;v<=r.max;v+=r.step)values.push(v);
 return [...new Set(values)].sort((a,b)=>a-b);
}
function DimensionControl({parameter,value,onChange}:{parameter:Parameter;value:Value;onChange:(value:Value)=>void}){
 const current=Number(value);const values=validNumbers(parameter);
 const [editing,setEditing]=useState(false);const [draft,setDraft]=useState(String(current));const input=useRef<HTMLInputElement>(null);
 const title=labels[parameter.name]??parameter.label;
 const commit=()=>{const n=Number(draft);setEditing(false);if(!draft||!Number.isFinite(n))return;const next=values.reduce((a,b)=>Math.abs(b-n)<Math.abs(a-n)?b:a,current);if(next!==current)onChange(next);};
 const edit=()=>{setDraft(String(current));setEditing(true);requestAnimationFrame(()=>{input.current?.focus();input.current?.select();});};
 const fixed=(parameter.options??[]).filter(o=>!o.disabled&&typeof o.value==='number').map(o=>Number(o.value)).sort((a,b)=>a-b);
 // Original mixed-height control reserves 60% for standard sizes and 40%
 // for the continuous custom-height range (224–296 cm in Tone Wallstorage).
 const split=fixed.length>1&&(parameter.ranges?.length??0)>0;
 const end=fixed.at(-1)??current;const maximum=values.at(-1)??current;
 const percent=split?(current<=end?Math.max(0,fixed.indexOf(current))/(fixed.length-1)*60:60+(current-end)/(maximum-end)*40):(current-values[0])/(maximum-values[0])*100;
 const slide=(position:number)=>{const raw=split?(position<=60?fixed[Math.round(position/60*(fixed.length-1))]:end+(position-60)/40*(maximum-end)):values[0]+position/100*(maximum-values[0]);onChange(values.reduce((a,b)=>Math.abs(b-raw)<Math.abs(a-raw)?b:a,current));};
 return <div className={styles.control}>
  <label id={`${parameter.name}-label`}>{title}</label>
  <div className={styles.sizeRow}>
   <div className={styles.sizeTrack} style={{background:`linear-gradient(to right,#fff ${percent}%,#dfe1e2 ${percent}%)`}}>
    <input aria-label={`${title} 슬라이더`} aria-valuetext={`${current} cm`} type="range" min={0} max={100} step={.01} value={Number.isFinite(percent)?percent:0} disabled={!parameter.enabled} onChange={e=>slide(Number(e.target.value))}/>
    {editing?<span className={styles.sizeValue}><input ref={input} type="number" aria-label={title} value={draft} min={values[0]} max={values.at(-1)} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();if(e.key==='Escape')setEditing(false);}}/> cm</span>:<span className={styles.sizeValue}>{current} cm</span>}
   </div>
   <button className={styles.editSize} aria-label={`${title} 숫자로 입력`} disabled={!parameter.enabled} onClick={edit}><FiEdit2/></button>
  </div>
 </div>;
}
function Control({parameter,value,onChange}:{parameter:Parameter|undefined;value:Value;onChange:(v:Value)=>void}){
 if(!parameter?.visible)return null;
 const title=labels[parameter.name]??parameter.label;
 if(parameter.type.includes('ranges'))return <DimensionControl parameter={parameter} value={value} onChange={onChange}/>;
 if(parameter.name==='columnCount'){
  const values=validNumbers(parameter);const index=values.indexOf(Number(value));
  return <div className={styles.stepper} role="group" aria-label="열 개수"><button aria-label="열 줄이기" disabled={index<=0||!parameter.enabled} onClick={()=>onChange(values[index-1])}><FiMinus/></button><output>{String(value)}</output><button aria-label="열 늘리기" disabled={index<0||index>=values.length-1||!parameter.enabled} onClick={()=>onChange(values[index+1])}><FiPlus/></button></div>;
 }
 if(parameter.name==='handles')return <><div className={styles.imageChoices}>{parameter.options?.map(o=><button key={String(o.value)} title={o.value?'손잡이':'푸시 투 오픈'} aria-label={o.value?'손잡이':'푸시 투 오픈'} aria-pressed={value===o.value} disabled={o.disabled||!parameter.enabled} onClick={()=>onChange(o.value)}><Image src={`/three/bookcase/ui/${o.value?'handles':'push-to-open'}.webp`} alt={o.value?'손잡이':'푸시 투 오픈'} width={120} height={160}/>{value===o.value&&<FiCheck/>}</button>)}</div><p className={styles.choiceLabel}>도어 여는 방식: {value?'손잡이':'푸시 투 오픈'}</p></>;
 return <fieldset className={styles.control}><legend>{title}</legend><div className={styles.choices}>{parameter.options?.map(o=>{
 const selected=Array.isArray(value)?value.includes(Number(o.value)):value===o.value;
 return <button key={String(o.value)} disabled={o.disabled||!parameter.enabled} aria-pressed={selected} onClick={()=>onChange(parameter.type==='multiselect'?(selected?(value as number[]).filter(n=>n!==o.value):[...(Array.isArray(value)?value:[]),Number(o.value)]):o.value)}>{parameter.name==='doorDirection'?(o.value===1||o.value==='left'?'왼쪽':'오른쪽'):options[String(o.value)]??o.label}</button>;
 })}</div></fieldset>;
}
function LayoutThumbnail({thumbnail}:{thumbnail:Thumbnail}){
 const panels=[...thumbnail.format.walls,...thumbnail.format.slabs];const fronts=[...(thumbnail.format.doors??[]),...(thumbnail.format.drawers??[])];
 const x=Math.min(...panels.map(p=>p.x1));const top=Math.max(...panels.map(p=>p.y2));const width=Math.max(...panels.map(p=>p.x2))-x;
 return <svg viewBox={`${x-25} -25 ${width+50} ${top+50}`} aria-hidden="true">{panels.map((p,i)=><rect key={i} x={p.x1} y={top-p.y2} width={Math.max(p.x2-p.x1,8)} height={Math.max(p.y2-p.y1,8)} fill="#585858"/>)}{fronts.map((p,i)=><rect key={`f${i}`} x={p.x1} y={top-p.y2} width={p.x2-p.x1} height={p.y2-p.y1} fill="#ddd" stroke="#777" strokeWidth={5}/>)}</svg>;
}
export default function BookcaseConfigurator({start='tone',embedded=false}:{start?:StartKey;embedded?:boolean}){
 const {market}=useLocale();
 const params=useSearchParams();const initial=params.get('design');
 const [design,setDesign]=useState<Design>(()=>{try{return initial?readDesign(initial):initialDesign(start);}catch{return initialDesign(start);}});
 const [specification,setSpecification]=useState(false);const [editingColumns,setEditingColumns]=useState(false);
 const [selected,setSelected]=useState<number|null>(null);const [tab,setTab]=useState(0);const [open,setOpen]=useState(false);const [dimensions,setDimensions]=useState(false);const [reset,setReset]=useState(0);const [zoom,setZoom]=useState(0);const [full,setFull]=useState(false);const [message,setMessage]=useState('');const [share,setShare]=useState('');
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if(event.code!=='Space'||event.altKey||event.ctrlKey||event.metaKey)return;
   const target=event.target;
   if(target instanceof HTMLElement&&(target.isContentEditable||target.closest('input,textarea,select,button,a,[role="button"],[role="dialog"]')))return;
   event.preventDefault();if(!event.repeat)setReset(v=>v+1);
  };
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[]);
 const viewport=useRef<HTMLDivElement>(null);const scroll=useRef<HTMLDivElement>(null);const sections=useRef<(HTMLElement|null)[]>([]);
 const snapshot:Snapshot=useMemo(()=>calculate(design,undefined,selected??0),[design,selected]);
 const original=useMemo(()=>calculate(initialDesign(design.start)),[design.start]);
 const isOriginal=(design.bedsideStyle??6)===6 && JSON.stringify(original.preset)===JSON.stringify(snapshot.preset);
 const bedside=design.start==='bedside';const line=bedside?'bedside':design.start==='edge'?'edge':'tone';const values=snapshot.configuration.values;const parameters=snapshot.configuration.parameters;
 const euro=line==='tone'||bedside?toneEuro(snapshot.geometry):isOriginal?Number(starts[design.start].sourceDiscountEuro):null;
 const premium=line==='tone'&&values.material%2===1;
 const activePalette=bedside?bedsidePalette:line==='edge'?palette.edge:premium?palette.toneMatte:palette.tone;
 const colorLabel=(name:string)=>{const standard=name.replace(/^matte([A-Z])/,(_,letter:string)=>letter.toLowerCase());return `${colors[standard]??standard}${name.startsWith('matte')?' 프리미엄 매트':''}`;};
 const column=String(Math.min(selected??0,values.columnCount-1)+1);const channel=values.channels[column];const channelParameters=parameters.channels[column];
 const tabs=bedside?['스타일','크기','색상','구성','요약']:line==='edge'?['형태','구성']:['크기','색상','열','도어 여는 방식','요약'];
 const update=(patch:Record<string,unknown>)=>{try{const next=calculate(design,patch,selected??0);setDesign({...design,preset:next.preset});setMessage('');}catch{setMessage('이 구성에서는 선택할 수 없는 옵션입니다.');}};
 const changeColumn=(key:string,value:Value)=>update({channels:{[column]:{[key]:value}}});
 const chooseColumn=(n:number|null)=>{setSelected(n);if(n!==null){setEditingColumns(true);}if(n!==null){setTab(bedside?3:line==='edge'?1:2);scroll.current?.scrollTo({top:0});}};
 const save=()=>{try{localStorage.setItem(`befun-${line}-design-v1`,JSON.stringify({...design,preset:snapshot.preset}));setMessage('디자인을 이 브라우저에 저장했습니다.');}catch{setMessage('브라우저 저장 공간에 접근할 수 없습니다. 링크를 저장해 주세요.');}};
 const load=()=>{try{const raw=localStorage.getItem(`befun-${line}-design-v1`);if(!raw){setMessage('저장된 디자인이 없습니다.');return;}setDesign(readDesign(raw));setSelected(null);setMessage('저장된 디자인을 불러왔습니다.');}catch{setMessage('저장된 디자인을 읽을 수 없습니다.');}};
 const shareLink=async()=>{const url=new URL('/bookcase-configurator',window.location.origin);url.searchParams.set('line',line);url.searchParams.set('design',JSON.stringify({...design,preset:snapshot.preset}));setShare(url.href);try{await navigator.clipboard.writeText(url.href);setMessage('디자인 링크를 복사했습니다.');}catch{setMessage('아래 링크를 복사해 주세요.');}};
 const go=(i:number)=>{setTab(i);if(line!=='edge'){setSelected(null);setEditingColumns(false);requestAnimationFrame(()=>{const section=sections.current[i];const panel=scroll.current;if(section&&panel){if(window.matchMedia('(max-width:800px)').matches)section.scrollIntoView({block:'start',behavior:bedside?'instant':'smooth'});else panel.scrollTo({top:section.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop-24,behavior:'smooth'});}});}else scroll.current?.scrollTo({top:0});};
 const standardForm=<><section ref={e=>{sections.current[0]=e;}}><h2>크기를 조절하세요</h2>{(['width','height','depth']as const).map(k=><Control key={k} parameter={parameters[k]} value={values[k]} onChange={v=>update({[k]:v})}/>)}</section><section ref={e=>{sections.current[1]=e;}}><h2>마감과 색상을 선택하세요</h2>{line==='tone'&&<div className={styles.finishOptions} role="radiogroup" aria-label="마감">{[false,true].map(matte=><button key={String(matte)} role="radio" aria-checked={premium===matte} onClick={()=>update({material:values.material-(values.material%2)+(matte?1:0)})}>{matte?'프리미엄 매트':'스탠다드'}</button>)}</div>}<div className={styles.swatches}>{activePalette.map(p=><button key={p.id} disabled={!Object.hasOwn(materialColors,p.colors.primary)} title={Object.hasOwn(materialColors,p.colors.primary)?colorLabel(p.colors.primary):`${colorLabel(p.colors.primary)} — 준비 중`} aria-label={colorLabel(p.colors.primary)} aria-pressed={values.material===p.id} onClick={()=>update({material:p.id})} style={{background:colorHex(p.colors.primary)}}>{line==='tone'&&<Image src={`/three/bookcase/ui/${({0:'off-white',2:'cashmere',4:'pistachio-green',6:'onyx-gray',8:'midnight-blue',10:'misty-blue'} as Record<number,string>)[premium?p.id-1:p.id]}${premium?'-mat':''}.webp`} alt={colorLabel(p.colors.primary)} width={120} height={160}/>} {values.material===p.id&&<FiCheck/>}</button>)}</div><p className={styles.choiceLabel}>외부: {colorLabel(activePalette.find(p=>p.id===values.material)?.colors.primary??'')}　내부: {colorLabel(activePalette.find(p=>p.id===values.material)?.colors.primary??'')}</p></section><section ref={e=>{sections.current[2]=e;}}><h2>열 개수</h2><Control parameter={parameters.columnCount} value={values.columnCount} onChange={v=>{update({columnCount:v});setSelected(null);}}/><p className={styles.muted}>선택 가능한 열 개수는 전체 너비와 구성에 따라 달라집니다.</p></section><section ref={e=>{sections.current[3]=e;}}><h2>{line==='tone'?'도어 여는 방식을 선택하세요':'상단 형태를 선택하세요'}</h2><Control parameter={line==='tone'?parameters.handles:parameters.ridges} value={line==='tone'?values.handles:values.ridges} onChange={v=>update({[line==='tone'?'handles':'ridges']:v})}/></section><section ref={e=>{sections.current[4]=e;}}><h2>나만의 {line==='tone'?'Tone':'Edge'}</h2><p>{snapshot.geometry.width/10} × {snapshot.geometry.height/10} × {snapshot.geometry.depth/10} cm</p><p>{values.columnCount}열</p><button className={styles.textButton} onClick={load}>저장한 디자인 불러오기</button></section></>;
 const functionPanel=<section><div className={styles.columnHeader}><h2>{column}열 편집</h2><div className={styles.choices}>{Object.keys(values.channels).map((id,i)=><button key={id} aria-pressed={column===id} onClick={()=>setSelected(i)}>{id}</button>)}</div></div><Control parameter={channelParameters.local_height} value={channel.local_height} onChange={v=>changeColumn('local_height',v)}/><Control parameter={channelParameters.local_depth} value={channel.local_depth} onChange={v=>changeColumn('local_depth',v)}/><h3>내부 구성</h3><div className={styles.templates}>{snapshot.thumbnails.filter(t=>t.render).map((t,i)=><button key={t.series_id} aria-label={`내부 구성 ${i+1}`} aria-pressed={channel.seriesId===t.series_id} title={t.series_name} onClick={()=>changeColumn('seriesId',t.series_id)}><LayoutThumbnail thumbnail={t}/>{channel.seriesId===t.series_id&&<FiCheck/>}</button>)}</div>{(['columnExposition','shelfDistribution','doorDirection','cableOpenings','cableOpeningsTop']as const).map(k=><Control key={k} parameter={channelParameters[k]} value={channel[k]} onChange={v=>changeColumn(k,v)}/>)}<button className={styles.textButton} onClick={()=>{setSelected(null);setTab(0);}}>전체 가구 편집으로 돌아가기</button></section>;
 const bedsideNames=['오프화이트','캐시미어 베이지','피스타치오 그린','잉키 블랙','파우더 핑크'];
 const bedsideImages=['off-white','cashmere','pistachio','inky','pink'];
 const form=bedside?<>
 <section ref={e=>{sections.current[0]=e;}}><h2>스타일을 선택하세요</h2><div className={styles.imageChoices}>{[{id:6,name:'미니멀',image:'minimal'},{id:7,name:'벽걸이',image:'hanging'},{id:8,name:'다리형',image:'legs'}].map(style=><button key={style.id} aria-label={style.name} aria-pressed={style.id===(design.bedsideStyle??6)} disabled={parameters.shelfType.options?.find(o=>o.value===style.id)?.disabled??true} title={parameters.shelfType.options?.find(o=>o.value===style.id)?.disabled?'현재 크기·구성에서는 선택할 수 없습니다.':style.name} onClick={()=>{try{setDesign(switchBedsideStyle(design,style.id as BedsideStyle));setMessage('');}catch{setMessage('현재 크기·구성에서는 선택할 수 없습니다.');}}}><Image src={`/three/bookcase/ui/bedside-${style.image}.png`} alt={style.name} width={120} height={160}/>{style.id===(design.bedsideStyle??6)&&<FiCheck/>}</button>)}</div><p className={styles.choiceLabel}>스타일: {({6:'미니멀',7:'벽걸이',8:'다리형'})[design.bedsideStyle??6]}</p></section>
 <section ref={e=>{sections.current[1]=e;}}><h2>크기를 조절하세요</h2>{(['width','height']as const).map(k=><DimensionControl key={k} parameter={parameters[k]} value={values[k]} onChange={v=>update({[k]:v})}/>)}<Control parameter={parameters.depth} value={values.depth} onChange={v=>update({depth:v})}/></section>
 <section ref={e=>{sections.current[2]=e;}}><h2>색상을 선택하세요</h2><div className={styles.swatches}>{bedsidePalette.map(p=><button key={p.id} aria-label={bedsideNames[p.id]} aria-pressed={values.material===p.id} onClick={()=>update({material:p.id})}><Image src={`/three/bookcase/ui/bedside-${bedsideImages[p.id]}.png`} alt={bedsideNames[p.id]} width={120} height={160}/>{values.material===p.id&&<FiCheck/>}</button>)}</div><p className={styles.choiceLabel}>외부: {bedsideNames[values.material]}</p></section>
 <section ref={e=>{sections.current[3]=e;}}><h2>구획 개수</h2><Control parameter={parameters.columnCount} value={values.columnCount} onChange={v=>{update({columnCount:v});setSelected(null);}}/><div className={styles.choices}>{Object.keys(values.channels).map((id,i)=><button key={id} onClick={()=>chooseColumn(i)}>{id}열 편집</button>)}</div></section>
 <section ref={e=>{sections.current[4]=e;}}><h2>나만의 협탁</h2><p>{snapshot.geometry.width/10} × {snapshot.geometry.height/10} × {snapshot.geometry.depth/10} cm</p><button className={styles.textButton} onClick={load}>저장한 디자인 불러오기</button></section>
 </>:standardForm;
 return <div ref={viewport} className={`${styles.root} ${embedded?styles.embedded:''} ${full?styles.full:''}`} data-lineup={line}>
 <div className={styles.viewer}><div className={styles.brand}><Link href="/" aria-label="BEFUN 홈">BEFUN</Link><Link href={bedside?'/furniture-c/bedside_table':design.start==='tone-1964607'?'/furniture-c/wallunits':design.start==='edge'||design.start==='tone-wall'?'/furniture-c/wallstorage':'/furniture-c/bookcase'}><FiArrowLeft/> 뒤로</Link></div><button className={styles.fullButton} aria-label="전체 화면" onClick={()=>setFull(v=>!v)}><FiMaximize/></button>
 <Scene snapshot={snapshot} selected={selected} onSelect={chooseColumn} open={open} editingColumns={editingColumns} dimensions={dimensions} reset={reset} zoom={zoom}/>
 <div className={styles.toolDock}><div className={styles.tools} role="toolbar" aria-label="가구 보기 도구">
 <button aria-label="축소" title="축소" onClick={()=>setZoom(v=>v-1)}><FiMinus/></button><button aria-label="확대" title="확대" onClick={()=>setZoom(v=>v+1)}><FiPlus/></button><span className={styles.toolDivider}/>
 <button aria-label="치수 표시" title="치수 표시" aria-pressed={dimensions} onClick={()=>setDimensions(v=>!v)}><BookcaseToolIcon kind="ruler"/></button>
 <button aria-label="소품 표시" title="원본 소품 연결 준비 중" disabled><BookcaseToolIcon kind="decor"/></button>
 <button aria-label={bedside?'서랍 열기·닫기':'도어 열기·닫기'} title={bedside?'서랍 열기·닫기':'도어 열기·닫기'} aria-pressed={open} onClick={()=>setOpen(v=>!v)}><BookcaseToolIcon kind="doors"/></button><span className={styles.toolDivider}/>
 <button aria-label="제품 사양" title="제품 사양" aria-pressed={specification} onClick={()=>setSpecification(v=>!v)}><FiFileText/></button>
 <button aria-label="디자인 공유" title="디자인 공유" onClick={shareLink}><BookcaseToolIcon kind="share"/></button></div>
 <div className={styles.editDock}><button aria-pressed={editingColumns} onClick={()=>{setEditingColumns(v=>!v);setSelected(null);}}><FiEdit2/> 구획 편집</button></div></div>
 <button className={styles.resetButton} aria-label="시점 초기화" aria-keyshortcuts="Space" title="시점 초기화 (Space)" onClick={()=>setReset(v=>v+1)}><FiRotateCcw/></button>
 {specification&&<section className={styles.specification} role="dialog" aria-modal="false" aria-label="제품 사양"><button aria-label="제품 사양 닫기" onClick={()=>setSpecification(false)}><FiX/></button><h2>제품 사양</h2><dl><dt>크기</dt><dd>{snapshot.geometry.width/10} × {snapshot.geometry.height/10} × {snapshot.geometry.depth/10} cm</dd><dt>구획</dt><dd>{values.columnCount}열</dd><dt>색상</dt><dd>{colorLabel(activePalette.find(p=>p.id===values.material)?.colors.primary??'')}</dd><dt>합계</dt><dd>{euro!==null?formatMoney(eurToMarket(euro,market),market):'가격 확인 필요'}</dd></dl></section>}

 </div><aside className={styles.sidebar}><nav className={styles.tabs} aria-label="가구 편집 메뉴">{tabs.map((name,i)=><button key={name} aria-current={tab===i?'step':undefined} onClick={()=>go(i)}>{tab===i&&<FiCheck/>}{name}</button>)}</nav><div ref={scroll} className={styles.panel}>{(line==='edge'&&tab===1)||(selected!==null&&tab===(bedside?3:2))?functionPanel:form}</div><footer className={styles.footer}><div className={styles.total}><span>합계</span><strong aria-live="polite" data-eur={euro??undefined}>{euro!==null?formatMoney(eurToMarket(euro,market),market):'가격 확인 필요'}</strong></div><div className={styles.marketRow}><MarketSelector/></div><p className={styles.muted}>{line==='tone'||bedside?'EUR 기준 · 선택한 구성에 따라 자동 계산':isOriginal?'동일 원본 구성의 EUR 기준 환산 가격':'변경한 구성의 동일 원본 가격은 아직 확인되지 않았습니다.'}</p><div className={styles.actions}><button onClick={save}><FiHeart/> 디자인 저장</button><button onClick={shareLink}><FiShare2/> 링크 공유</button></div>{message&&<p role="status">{message}</p>}{share&&<input aria-label="디자인 공유 링크" readOnly value={share} onFocus={e=>e.target.select()}/>}</footer></aside>
 </div>;
}
