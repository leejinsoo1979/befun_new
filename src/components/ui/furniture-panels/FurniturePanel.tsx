'use client';

import { useLocale } from '@/lib/commerce/useLocale';

import { useId, useRef, useState } from 'react';
import styles from './panels.module.css';
import { ControlView, useRovingKeys } from './controls';
import type { FurnitureEditIntent, FurniturePanelView } from './types';

export interface FurniturePanelProps {
  view: FurniturePanelView;
  /** 사용자의 변경 의도. 리더의 상태 전이가 검증·적용하고 새 view를 내려준다. */
  onIntent: (intent: FurnitureEditIntent) => void;
  /** 구획 선택은 UI 상태다(가구 설계 상태 아님). 선택 결과는 view.selectedSectionId로 다시 받는다. */
  onSelectSection?: (sectionId: string) => void;
  /** 탭을 외부에서 제어하려면 지정. 없으면 내부 상태로 첫 탭부터. */
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
}

/**
 * 제품별 우측 옵션 패널. view에 있는 탭·컨트롤을 받은 순서대로 렌더한다.
 * 값 계산·범위 보정·노출 조건은 하지 않는다(모두 view가 결정).
 */
export function FurniturePanel({ view, onIntent, onSelectSection, activeTabId, onTabChange }: FurniturePanelProps) {
  const { t: tr } = useLocale();
  const [localTab, setLocalTab] = useState(view.tabs[0]?.id);
  const tabId = activeTabId ?? (view.tabs.some((t) => t.id === localTab) ? localTab : view.tabs[0]?.id);
  const tab = view.tabs.find((t) => t.id === tabId) ?? view.tabs[0];
  const baseId = useId();
  const tabList = useRef<HTMLDivElement>(null);
  const sectionGroup = useRef<HTMLDivElement>(null);

  const changeTab = (id: string) => { setLocalTab(id); onTabChange?.(id); };
  const tabKeys = useRovingKeys(view.tabs.length, () => true, (i) => {
    changeTab(view.tabs[i].id);
    tabList.current?.querySelectorAll<HTMLElement>('[role="tab"]')[i]?.focus();
  });
  const selectedSection = Math.max(0, view.sections.findIndex((s) => s.id === view.selectedSectionId));
  const sectionKeys = useRovingKeys(view.sections.length, () => true, (i) => {
    onSelectSection?.(view.sections[i].id);
    sectionGroup.current?.querySelectorAll<HTMLElement>('[role="radio"]')[i]?.focus();
  });

  if (!tab) return null;

  const renderTabBody = (t: typeof tab) => (
    <>
      {t.usesSections && view.sections.length > 0 && (
        <div ref={sectionGroup} role="radiogroup" aria-label={tr("구획 선택")} className={styles.sections}>
          {view.sections.map((s, i) => (
            <button key={s.id} type="button" role="radio" aria-checked={s.id === view.selectedSectionId}
              tabIndex={i === selectedSection ? 0 : -1} className={styles.section}
              onClick={() => onSelectSection?.(s.id)} onKeyDown={(e) => sectionKeys(e, i)}>{tr(s.label)}</button>
          ))}
        </div>
      )}
      {t.sectionSummary && (
        <div className={styles.summary}>
          <span className={styles.label}>{tr(t.sectionSummary.title)}</span>
          <div><strong>{t.sectionSummary.value}</strong>{t.sectionSummary.caption && <small>{tr(t.sectionSummary.caption)}</small>}</div>
        </div>
      )}
      {/* 제품 profile이 바뀌면 같은 controlId라도 새로 마운트해 이전 제품의 입력 상태를 쓰지 않는다. */}
      {t.controls.map((c) => <ControlView key={`${view.panelProfileId}:${c.id}:${c.target.scope === 'section' ? c.target.sectionId : 'global'}`} control={c} emit={onIntent} />)}
    </>
  );

  const previewNote = view.preview && (
    <p className={styles.preview} role="status">
      PREVIEW · 3D 미연결 — {view.preview.note} (근거: {view.preview.caseIds.join(', ')})
    </p>
  );

  // 단일 목록(Original·Desk·Vinyl): 탭 없이 첫 탭 내용을 그대로
  if (view.layout === 'single') {
    return <div className={styles.panel} data-panel-profile={view.panelProfileId}>{previewNote}{renderTabBody(view.tabs[0])}</div>;
  }

  // 단계형(Tone): 모든 단계를 한 화면에 순서대로 두고, 단계 버튼은 해당 섹션으로 이동만 한다(UI 상태).
  if (view.layout === 'steps') {
    return (
      <div className={styles.panel} data-panel-profile={view.panelProfileId}>
        {previewNote}
        <nav className={styles.stepNav} aria-label={tr("단계")}>
          {view.tabs.map((t) => (
            <button key={t.id} type="button" aria-current={t.id === tab.id ? 'step' : undefined}
              onClick={() => { changeTab(t.id); document.getElementById(`${baseId}-step-${t.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }}>{tr(t.label)}</button>
          ))}
        </nav>
        {view.tabs.map((t) => (
          <section key={t.id} id={`${baseId}-step-${t.id}`} className={styles.stepSection} aria-labelledby={`${baseId}-h-${t.id}`}>
            <h4 id={`${baseId}-h-${t.id}`} className={styles.stepHeading}>{tr(t.heading ?? t.label)}</h4>
            {renderTabBody(t)}
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.panel} data-panel-profile={view.panelProfileId}>
      {previewNote}

      {view.tabs.length > 1 && (
        <div ref={tabList} role="tablist" aria-label={tr("옵션 구분")} className={styles.tabs}>
          {view.tabs.map((t, i) => (
            <button key={t.id} type="button" role="tab" id={`${baseId}-tab-${t.id}`} aria-controls={`${baseId}-panel`}
              aria-selected={t.id === tab.id} tabIndex={t.id === tab.id ? 0 : -1} className={styles.tab}
              onClick={() => changeTab(t.id)} onKeyDown={(e) => tabKeys(e, i)}>{tr(t.label)}</button>
          ))}
        </div>
      )}

      <div role={view.tabs.length > 1 ? 'tabpanel' : undefined} id={`${baseId}-panel`}
        aria-labelledby={view.tabs.length > 1 ? `${baseId}-tab-${tab.id}` : undefined}>
        {renderTabBody(tab)}
      </div>
    </div>
  );
}
