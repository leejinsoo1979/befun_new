'use client';

import { useLocale } from '@/lib/commerce/useLocale';

import dynamic from 'next/dynamic';
import { ConfiguratorLoading } from '@/components/ui/ConfiguratorLoading';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FiMaximize, FiSave, FiShare2 } from 'react-icons/fi';
import { FurnitureViewToolbar } from './FurnitureViewToolbar';
import { DeskSectionEditor } from './DeskSectionEditor';
import type { FurnitureEditIntent } from '@/types/furniture';
import { FurniturePanel } from '@/components/ui/furniture-panels/FurniturePanel';
import { applyWardrobeIntent, wardrobePanelView } from '@/lib/furniture/wardrobe-panel';
import { applyDeskIntent, deskPanelView } from '@/lib/furniture/desk-panel';
import { FAMILY_NAMES, furnitureDesignHref, parseFurnitureDesign, type FurnitureDesign } from '@/lib/furniture/design';
import styles from './furniture.module.css';
import { FurnitureProductDetails } from '@/components/storefront/FurnitureProductDetails';

const Scene=dynamic(()=>import('./FurnitureScene'),{ssr:false,loading:()=> <ConfiguratorLoading />});
export function FurnitureConfigurator({initial, title, catalogId}:{initial:FurnitureDesign;title?:string;catalogId?:string}){
  const { t: tr } = useLocale();
  const [design,setDesign]=useState(initial);
  const [selected,setSelected]=useState<string|null>(initial.kind==='desk'?initial.sectionIds[0]:initial.config.sections[0]?.id??null);
  const [tab,setTab]=useState('appearance');
  const [open,setOpen]=useState(initial.kind==='wardrobe');
  const [dimensions,setDimensions]=useState(false);
  const [front,setFront]=useState(false);
  const [reset,setReset]=useState(0);
  const [zoom,setZoom]=useState({factor:1,revision:0});
  const [fullscreen,setFullscreen]=useState(false);
  const viewerRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const sync=()=>setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange',sync);
    return()=>document.removeEventListener('fullscreenchange',sync);
  },[]);
  useEffect(()=>{
    if(!fullscreen)return;
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!document.fullscreenElement)setFullscreen(false);};
    window.addEventListener('keydown',escape);
    return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',escape);};
  },[fullscreen]);
  const toggleFullscreen=async()=>{
    if(fullscreen){if(document.fullscreenElement)await document.exitFullscreen();setFullscreen(false);return;}
    setFullscreen(true);
    try{await viewerRef.current?.requestFullscreen?.();}catch{/* Keep the same full-window view when native fullscreen is unavailable. */}
  };
  const [status,setStatus]=useState('');
  const [deskEditor,setDeskEditor]=useState<'storage'|'legroom'|null>(null);
  const view=design.kind==='desk'?deskPanelView(design,selected):wardrobePanelView(design,selected);
  const changeTab=(id:string)=>{setTab(id);if(design.kind==='wardrobe'){setFront(id==='interior');if(id==='interior')setOpen(true);setReset(value=>value+1);}};
  const select=(id:string)=>{setSelected(id);if(design.kind==='desk')setDeskEditor('storage');else changeTab('interior');};
  const apply=(intent:FurnitureEditIntent)=>{setDesign(current=>current.kind==='desk'?applyDeskIntent(current,intent):applyWardrobeIntent(current,intent));setStatus('');};
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
      setDeskEditor(null);setOpen(false);setReset(value=>value+1);
      window.history.replaceState(null,'',furnitureDesignHref(restored));
      setStatus('저장한 디자인을 불러왔습니다.');
    }catch{setStatus('저장된 디자인을 불러올 수 없습니다.');}
  };
  return <section id="configuration" className={styles.page}>
    <div className={styles.heading}><div><Link href="/configurator-intro">{tr("가구 선택")}</Link><h1>{tr(title ?? FAMILY_NAMES[design.family])}</h1></div><p>{design.config.widthMm/10} × {design.kind==='desk'?73:Math.max(design.config.heightMm,...design.config.sections.map(s=>s.localHeightMm??0))/10} × {(design.kind==='desk'?design.config.depthMm:Math.max(design.config.depthMm,...design.config.sections.map(s=>s.localDepthMm??0)))/10} cm</p></div>
    <div className={styles.layout}>
      <div ref={viewerRef} className={styles.viewer} data-fullscreen={fullscreen||undefined}>
        <Scene design={design} open={open} dimensions={dimensions} front={front} reset={reset} zoom={zoom} interior={tab==='interior'} selectedSectionId={design.kind==='wardrobe'&&tab!=='interior'?null:selected} onSelectSection={select} onEditDeskLegroom={()=>setDeskEditor('legroom')}/>
        <FurnitureViewToolbar open={open} dimensions={dimensions} front={front} onOpen={()=>setOpen(!open)} onDimensions={()=>setDimensions(!dimensions)} onFront={value=>{setFront(value);setReset(count=>count+1);}} onReset={()=>setReset(count=>count+1)} onZoom={factor=>setZoom(value=>({factor,revision:value.revision+1}))}/>
        <button className={styles.fullscreen} onClick={()=>void toggleFullscreen()} aria-pressed={fullscreen}><FiMaximize/>{tr(fullscreen?'전체 화면 종료':'전체 화면')}</button>
        <p className={styles.viewerHint}>{tr("드래그하여 회전 · 스크롤하여 확대 · 수납 구획을 눌러 편집")}</p>
      </div>
      <aside className={`${styles.options} ${design.kind==='desk'?styles.deskOptions:''}`} aria-label={tr("가구 옵션")}>
        {view&&<FurniturePanel view={view} activeTabId={tab} onTabChange={changeTab} onSelectSection={setSelected} onIntent={apply}/>}
        <div className={styles.saveActions}><button onClick={()=>persist()}><FiSave/> {tr("디자인 저장")}</button><button onClick={()=>persist(true)}><FiShare2/> {tr("링크 공유")}</button><button onClick={restore}>{tr("저장한 디자인 불러오기")}</button></div>
        <p role="status" className={styles.status}>{tr(status)}</p>
      </aside>
    </div>
    {design.kind==='desk'&&deskEditor&&<DeskSectionEditor key={`${deskEditor}:${selected}`} view={view} region={deskEditor} onIntent={apply} onClose={()=>setDeskEditor(null)}/>}
    <FurnitureProductDetails design={design} title={title} catalogId={catalogId} />
  </section>;
}
