'use client';

import dynamic from 'next/dynamic';
import { ConfiguratorLoading } from '@/components/ui/ConfiguratorLoading';
import Link from 'next/link';
import { useState } from 'react';
import { FiRotateCcw, FiMaximize, FiSave, FiShare2 } from 'react-icons/fi';
import { FurniturePanel } from '@/components/ui/furniture-panels/FurniturePanel';
import { applyWardrobeIntent, wardrobePanelView } from '@/lib/furniture/wardrobe-panel';
import { applyDeskIntent, deskPanelView } from '@/lib/furniture/desk-panel';
import { FAMILY_NAMES, furnitureDesignHref, parseFurnitureDesign, type FurnitureDesign } from '@/lib/furniture/design';
import styles from './furniture.module.css';

const Scene=dynamic(()=>import('./FurnitureScene'),{ssr:false,loading:()=> <ConfiguratorLoading />});
export function FurnitureConfigurator({initial}:{initial:FurnitureDesign}){
  const [design,setDesign]=useState(initial);
  const [selected,setSelected]=useState<string|null>(initial.kind==='desk'?initial.sectionIds[0]:initial.config.sections[0]?.id??null);
  const [tab,setTab]=useState('appearance');
  const [open,setOpen]=useState(false);
  const [dimensions,setDimensions]=useState(false);
  const [front,setFront]=useState(false);
  const [reset,setReset]=useState(0);
  const [status,setStatus]=useState('');
  const view=design.kind==='desk'?deskPanelView(design,selected):wardrobePanelView(design,selected);
  const select=(id:string)=>{setSelected(id);setTab('interior');};
  const persist=(share=false)=>{
    const href=furnitureDesignHref(design);
    window.history.replaceState(null,'',href);
    if(share){
      navigator.clipboard.writeText(`${window.location.origin}${href}`).then(()=>setStatus('현재 디자인 링크를 복사했습니다.')).catch(()=>setStatus('주소창의 링크를 복사해 공유하실 수 있습니다.'));
      return;
    }
    try{
      localStorage.setItem(`befun:furniture-design:${design.family}`,JSON.stringify(design));
      setStatus('이 브라우저에 디자인을 저장했습니다. 현재 주소로도 같은 디자인을 열 수 있습니다.');
    }catch{setStatus('브라우저 저장 공간을 사용할 수 없습니다. 현재 주소를 복사해 보관해 주세요.');}
  };
  const restore=()=>{
    try {
      const saved=localStorage.getItem(`befun:furniture-design:${design.family}`);
      const restored=saved?parseFurnitureDesign(saved):null;
      if(!restored||restored.family!==design.family){setStatus('이 브라우저에 저장된 디자인이 없습니다.');return;}
      setDesign(restored);setSelected(restored.kind==='desk'?restored.sectionIds[0]:restored.config.sections[0]?.id??null);
      setOpen(false);setReset(value=>value+1);
      window.history.replaceState(null,'',furnitureDesignHref(restored));
      setStatus('저장한 디자인을 불러왔습니다.');
    }catch{setStatus('저장된 디자인을 불러올 수 없습니다.');}
  };
  return <section className={styles.page}>
    <div className={styles.heading}><div><Link href="/configurator-intro">가구 선택</Link><h1>{FAMILY_NAMES[design.family]}</h1></div><p>{design.config.widthMm/10} × {design.kind==='desk'?73:Math.max(design.config.heightMm,...design.config.sections.map(s=>s.localHeightMm??0))/10} × {(design.kind==='desk'?design.config.depthMm:Math.max(design.config.depthMm,...design.config.sections.map(s=>s.localDepthMm??0)))/10} cm</p></div>
    <div className={styles.layout}>
      <div className={styles.viewer}>
        <Scene design={design} open={open} dimensions={dimensions} front={front} reset={reset} selectedSectionId={selected} onSelectSection={select}/>
        <div className={styles.toolbar} aria-label="가구 보기">
          <button onClick={()=>setOpen(!open)} aria-pressed={open}>{open?'문·서랍 닫기':'문·서랍 열기'}</button>
          <button onClick={()=>setDimensions(!dimensions)} aria-pressed={dimensions}>치수</button>
          <button onClick={()=>setFront(!front)} aria-pressed={front}>{front?'입체':'정면'}</button>
          <button onClick={()=>setReset(reset+1)} aria-label="시점 초기화"><FiRotateCcw/></button>
          <button onClick={event=>{const viewer=event.currentTarget.closest(`.${styles.viewer}`);if(document.fullscreenElement)void document.exitFullscreen();else if(viewer instanceof HTMLElement)void viewer.requestFullscreen();}} aria-label="전체 화면"><FiMaximize/></button>
        </div>
        <p className={styles.viewerHint}>드래그하여 회전 · 스크롤하여 확대 · 수납 구획을 눌러 편집</p>
      </div>
      <aside className={styles.options} aria-label="가구 옵션">
        {view&&<FurniturePanel view={view} activeTabId={tab} onTabChange={setTab} onSelectSection={setSelected} onIntent={intent=>{setDesign(current=>current.kind==='desk'?applyDeskIntent(current,intent):applyWardrobeIntent(current,intent));setStatus('');}}/>}
        <div className={styles.saveActions}><button onClick={()=>persist()}><FiSave/> 디자인 저장</button><button onClick={()=>persist(true)}><FiShare2/> 링크 공유</button><button onClick={restore}>저장한 디자인 불러오기</button></div>
        <p role="status" className={styles.status}>{status}</p>
      </aside>
    </div>
    <div className={styles.details}><h2>내 공간에 맞춘 {design.kind==='desk'?'데스크':'옷장'}</h2><p>크기와 수납 구성을 바꾸어 나만의 공간을 만들어 보세요. 저장과 공유에는 현재 선택한 크기, 구성, 색상이 함께 담깁니다.</p></div>
  </section>;
}
