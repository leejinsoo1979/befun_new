'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheck, FiPlay, FiPause, FiRotateCcw, FiBookOpen, FiDownload } from 'react-icons/fi';
import { chapters, chapterById, canComplete, type Chapter } from '@/lib/assembly-guide/tylko-manual/chapters';
import assets from '@/lib/assembly-guide/tylko-manual/assets.json';
import styles from './manual.module.css';

const Simulation=dynamic(()=>import('./Simulation'),{ssr:false,loading:()=> <div className={styles.loading} role="status">3D 동작을 준비하고 있습니다…</div>});
const imageFor=(n:number)=>assets.images.find(i=>i.file.startsWith(`images/${String(n).padStart(3,'0')}_`));
const seconds=(v:number)=>`${Math.floor(v/60)}:${String(Math.floor(v%60)).padStart(2,'0')}`;

function ChapterPlayer({chapter}:{chapter:Chapter}) {
 const [time,setTime]=useState(0);const [playing,setPlaying]=useState(false);const [speed,setSpeed]=useState(1);
 const [inside,setInside]=useState(chapter.mechanism==='clip');const [close,setClose]=useState(false);const [reset,setReset]=useState(0);
 const [orange,setOrange]=useState(false);const [silver,setSilver]=useState(false);const [support,setSupport]=useState(false);
 const [mode,setMode]=useState<'simulation'|'reference'|'video'>('simulation');const [selectedVideo,setSelectedVideo]=useState(chapter.videos[0]??'');
 const [completed,setCompleted]=useState<ReadonlySet<number>>(new Set());const videoRef=useRef<HTMLVideoElement>(null);
 const [activeChapter,setActiveChapter]=useState(chapter.id);
 // Keep one WebGL canvas across chapter changes; reset only the controls.
 if(activeChapter!==chapter.id){
  setActiveChapter(chapter.id);setTime(0);setPlaying(false);setInside(chapter.mechanism==='clip');
  setClose(false);setReset(0);setOrange(false);setSilver(false);setSupport(false);
  setMode('simulation');setSelectedVideo(chapter.videos[0]??'');setCompleted(new Set());
 }
 const durations=chapter.steps.map(s=>s.duration);const total=durations.reduce((a,b)=>a+b,0);
 const offsets=durations.map((_,i)=>durations.slice(0,i).reduce((a,b)=>a+b,0));
 const at=Math.max(0,offsets.findLastIndex(t=>time>=t));const progress=Math.min(1,(time-offsets[at])/durations[at]);const current=chapter.steps[at];
 const video=assets.videos.find(v=>v.id===selectedVideo);
 const ended=time>=total;
 useEffect(()=>{
  if(!playing||ended)return;let frame=0;let last=0;
  const tick=(now:number)=>{const delta=last?Math.min(.1,(now-last)/1000)*speed:0;last=now;setTime(t=>Math.min(total,t+delta));frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[playing,speed,total,ended]);
 useEffect(()=>{const pause=()=>{if(document.hidden){setPlaying(false);videoRef.current?.pause();}};document.addEventListener('visibilitychange',pause);return()=>document.removeEventListener('visibilitychange',pause);},[]);
 const seek=(value:number)=>{setTime(Math.max(0,Math.min(total,value)));setPlaying(false);};
 const selectMode=(value:typeof mode)=>{setPlaying(false);videoRef.current?.pause();setMode(value);};
 // The current step end is a stable checkpoint, independent of timer interpolation.
 const stepEnd=Math.min(total,offsets[at]+durations[at]);
 const confirmReady=canComplete(at,progress>=.999?1:progress,completed) || completed.has(at);
 return <>
  <div className={styles.toolbar}>
   <div className={styles.segment} role="group" aria-label="안내 보기">
    <button aria-pressed={mode==='simulation'} onClick={()=>selectMode('simulation')}>3D 시뮬레이션</button>
    <button aria-pressed={mode==='reference'} onClick={()=>selectMode('reference')}>원본 도해</button>
    {chapter.videos.length>0&&<button aria-pressed={mode==='video'} onClick={()=>selectMode('video')}>조립 영상</button>}
   </div>
   <a href={chapter.source} target="_blank" rel="noreferrer"><FiBookOpen/> 해당 매뉴얼</a>
  </div>
  <div className={styles.stage}>
   {mode==='simulation'&&<><Simulation chapter={chapter} step={at} progress={progress} inside={inside} close={close} reset={reset} orange={orange} silver={silver} support={support}/>
    <div className={styles.viewTools}><button aria-pressed={inside} onClick={()=>setInside(v=>!v)}>내부 보기</button><button aria-pressed={close} onClick={()=>setClose(v=>!v)}>확대</button><button aria-label="시점 초기화" onClick={()=>setReset(v=>v+1)}><FiRotateCcw/></button>
     {chapter.mechanism==='clip'&&<button aria-pressed={orange} onClick={()=>setOrange(v=>!v)}>{orange?'구형 검정·주황':'검정·은색'}</button>}
     {chapter.mechanism==='leg'&&<button aria-pressed={silver} onClick={()=>setSilver(v=>!v)}>{silver?'실버 메탈':'블랙'}</button>}
     {chapter.mechanism==='back'&&<button aria-pressed={support} onClick={()=>setSupport(v=>!v)}>{support?'S 보강대':'W 백패널'}</button>}
    </div><span className={styles.modelNote}>동작 설명 모델 · 치수·내부 구조는 실측 전</span></>}
   {mode==='reference'&&<div className={styles.diagrams}>{chapter.images.length?chapter.images.map(n=>{const img=imageFor(n);return img?<figure key={n}><Image src={img.url} alt={`${chapter.title} 원본 도해 ${n}`} width={1000} height={700} unoptimized loading="lazy"/><figcaption>도해 {String(n).padStart(3,'0')} · 제공 자료 원본</figcaption></figure>:null;}):<div className={styles.loading}><p>이 항목의 도해는 PDF와 영상에서 확인할 수 있습니다.</p><a href={chapter.source} target="_blank" rel="noreferrer">해당 PDF 페이지 열기 ↗</a></div>}</div>}
   {mode==='video'&&video&&<div className={styles.video}><label>원본 영상<select value={selectedVideo} onChange={e=>setSelectedVideo(e.target.value)}>{chapter.videos.map(id=>{const v=assets.videos.find(a=>a.id===id);return v?<option key={id} value={id}>{v.title}</option>:null;})}</select></label><video ref={videoRef} key={video.id} src={video.src} poster={video.poster??undefined} controls playsInline preload="none"/><p>제공된 원본 영상 · {seconds(video.durationSeconds)} · <a href={video.url} target="_blank" rel="noreferrer">출처</a></p></div>}
  </div>
  <div className={styles.player}>
   <div className={styles.controls}><button className={styles.primary} aria-label={playing&&time<total?'일시 정지':'동작 재생'} onClick={()=>{if(time>=total)setTime(0);setPlaying(p=>time>=total?true:!p);}} disabled={mode==='video'}>{playing&&time<total?<FiPause/>:<FiPlay/>}</button><button aria-label="현재 단계 처음으로" onClick={()=>seek(offsets[at])}><FiRotateCcw/></button><input aria-label="조립 동작 진행" type="range" min={0} max={total} step={.01} value={time} onChange={e=>seek(Number(e.target.value))}/><span>{seconds(time)} / {seconds(total)}</span><select aria-label="동작 재생 속도" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select></div>
   <div className={styles.instruction}><span className={styles.stepNumber}>{String(at+1).padStart(2,'0')} / {chapter.steps.length}</span><div><h2>{current.title}</h2><p>{current.text}</p></div></div>
   <div className={styles.stepActions}><button disabled={at===0} onClick={()=>seek(offsets[at-1])}><FiArrowLeft/> 이전</button><button onClick={()=>seek(Math.max(offsets[at],stepEnd-.001))}>현재 동작 끝 보기</button><button disabled={at===chapter.steps.length-1} onClick={()=>seek(offsets[at+1])}>다음 <FiArrowRight/></button></div>
   <div className={styles.check}><label><input type="checkbox" checked={completed.has(at)} disabled={!confirmReady} onChange={e=>{if(e.target.checked&& !canComplete(at,progress>=.999?1:progress,completed))return;setCompleted(prev=>{const next=new Set(prev);if(e.target.checked)next.add(at);else for(const i of next)if(i>=at)next.delete(i);return next;});}}/> 이 단계의 동작과 주의사항을 확인했습니다</label><span role="status">{completed.size} / {chapter.steps.length} 확인{completed.size===chapter.steps.length?' 완료':''}</span></div>
   {at>0&&!completed.has(at-1)&&<p className={styles.caption}>확인 체크는 앞 단계부터 순서대로 진행합니다. 동작 미리보기는 자유롭게 이동할 수 있습니다.</p>}
  </div>
  <ol className={styles.steps}>{chapter.steps.map((s,i)=><li key={s.title}><button aria-current={i===at?'step':undefined} onClick={()=>seek(offsets[i])}><span>{completed.has(i)?<FiCheck/>:String(i+1).padStart(2,'0')}</span><strong>{s.title}</strong></button><p>{s.text}</p></li>)}</ol>
 </>;
}
function Library() {
 const [videoId,setVideoId]=useState<string|null>(null);
 return <section className={styles.library}><h2>전체 매뉴얼과 원본 자료</h2><p>제공 ZIP의 PDF 14개 · 영상 18개 · 도해 79개. 각 자료를 선택할 때 불러옵니다.</p>
  <h3>조립·분해 PDF</h3><div className={styles.documents}>{assets.pdfs.map(p=><a key={p.file} href={p.src} target="_blank" rel="noreferrer"><FiDownload/><span>{p.title}<small>{p.pages}쪽 · PDF</small></span></a>)}</div>
  <h3>부속별 상세 가이드 · 10개</h3>{assets.guides.map(g=><details key={g.id}><summary>{g.title}</summary><div className={styles.original}><a href={g.pdf} target="_blank" rel="noreferrer">PDF 열기</a> · <a href={g.source} target="_blank" rel="noreferrer">원문 출처</a>{g.blocks.map((b,i)=>b.kind==='image'&&b.src?<Image key={i} src={b.src} alt={b.text} width={1000} height={700} unoptimized loading="lazy"/>:<p key={i}>{b.text}</p>)}</div></details>)}
  <h3>전체 영상 · 18개</h3><div className={styles.videoList}>{assets.videos.map(v=><article key={v.id}><button onClick={()=>setVideoId(videoId===v.id?null:v.id)} aria-expanded={videoId===v.id}><FiPlay/><span>{v.title}<small>{seconds(v.durationSeconds)}</small></span></button>{videoId===v.id&&<video src={v.src} poster={v.poster??undefined} controls playsInline preload="none"/>}</article>)}</div>
  <details><summary>KNAPP 도면과 Tylko 실물의 구분</summary><p>connector.pdf는 Mod-eez 단일 클립의 Pass-thru·비잠금·반잠금·잠금 계열과 타공 템플릿입니다. 도면 4쪽의 32.00은 고정 나사 중심 간 거리이며 클립 전체 길이가 아닙니다. 10.87과 6.35도 도면의 각 기준을 따릅니다. Tylko 사용 품번과 동일하다는 증거가 없으므로 제조 치수로 적용하지 않았습니다.</p><p>공식 Tylko 자료는 잠금형·비잠금형 두 종류와 색상 대응을 설명하지만 색상별 잠금 역할·정확한 타공 치수·내부 스프링 형상은 확정하지 않습니다. 현재 3D 모델은 동작 설명용입니다.</p></details>
 </section>;
}
export function TylkoManual({initialChapter='clip-assemble'}:{initialChapter?:string}) {
 const [selected,setSelected]=useState(chapterById(initialChapter).id);const chapter=chapterById(selected);const [library,setLibrary]=useState(false);
 return <main className={styles.page}>
  <header className={styles.header}><Link href="/configurator"><FiArrowLeft/> 가구로 돌아가기</Link><strong>befun <span>조립 안내</span></strong><Link href="/assembly-guide?topic=connector">OVVO 안내 ↗</Link></header>
  <div className={styles.heading}><div><p>TYLKO CLIP SYSTEM</p><h1>{library?'매뉴얼 자료실':chapter.title}</h1></div><button className={styles.libraryToggle} aria-pressed={library} onClick={()=>setLibrary(v=>!v)}><FiBookOpen/>{library?'시뮬레이션으로':'전체 매뉴얼'}</button></div>
  <div className={styles.layout}><aside className={styles.sidebar}><label>조립 항목<select value={selected} onChange={e=>{setSelected(e.target.value);setLibrary(false);}}>{chapters.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><nav aria-label="Tylko 조립 항목">{chapters.map((c,i)=><button key={c.id} aria-current={!library&&selected===c.id?'page':undefined} onClick={()=>{setSelected(c.id);setLibrary(false);}}><span>{String(i+1).padStart(2,'0')}</span>{c.title}</button>)}</nav><p>가구별 부품 수와 위치는 해당 설계의 전용 설명서를 확인하세요.</p></aside><section className={styles.content}>{library?<Library/>:<ChapterPlayer chapter={chapter}/>}</section></div>
 </main>;
}
