'use client';

import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { FurniturePanel } from '@/components/ui/furniture-panels/FurniturePanel';
import { DESK_CHANNEL_OPTIONS } from '@/lib/furniture/desk';
import type { FurnitureEditIntent, FurniturePanelView } from '@/types/furniture';
import styles from './furniture.module.css';

/** The desk edits one storage column in a separate popover; the global list stays visible. */
export function DeskSectionEditor({ view, region, onIntent, onClose }: {
  view: FurniturePanelView;
  region: 'storage' | 'legroom';
  onIntent: (intent: FurnitureEditIntent) => void;
  onClose: () => void;
}) {
  const returnLabel = region === 'legroom' ? '다리 공간 편집' : `${view.sections.find(s => s.id === view.selectedSectionId)?.label ?? '수납'} 편집`;
  const popover = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const callback = useRef(onClose);
  useEffect(() => { callback.current = onClose; }, [onClose]);
  useEffect(() => {
    const element = popover.current;
    if (!element) return;
    const handleToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === 'closed') callback.current();
    };
    element.addEventListener('toggle', handleToggle);
    element.showPopover();
    close.current?.focus();
    return () => {
      element.removeEventListener('toggle', handleToggle);
      element.hidePopover();
      const trigger = Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-desk-edit-label]')).find(button => button.dataset.deskEditLabel === returnLabel);
      trigger?.focus({ preventScroll: true });
    };
  }, [returnLabel]);
  const tab = view.tabs.find(t => t.id === (region === 'storage' ? 'interior' : 'legroom'));
  if (!tab) return null;
  const storage = tab.controls.find(c => c.id === 'storageKind');
  const title = region === 'legroom' ? '다리 공간 케이블' : `${view.sections.find(s => s.id === view.selectedSectionId)?.label ?? '수납'} 편집`;
  return <div ref={popover} popover="auto" role="dialog" aria-label={title} className={styles.deskEditor}>
    <header><h2>{title}</h2><button ref={close} type="button" onClick={onClose} aria-label="편집 닫기"><FiX /></button></header>
    {storage?.kind === 'choice' && <div className={styles.storageChoices} role="group" aria-label="수납 구성">
      {DESK_CHANNEL_OPTIONS.map(option => {
        let bottom = 0;
        return <button key={option.id} type="button" aria-label={option.label} title={option.label}
          aria-pressed={storage.value === option.id} onClick={() => onIntent({ type: 'set', controlId: storage.id, target: storage.target, value: option.id })}>
          <svg viewBox="0 0 40 64" aria-hidden="true"><rect x="6" y="3" width="28" height="58" fill="none" stroke="currentColor" />
            {option.pitches.map((pitch, index) => {
              const height = pitch / 700 * 58;
              const y = 61 - bottom - height;
              bottom += height;
              const fill = option.fills[index];
              return <g key={index}><rect x="7" y={y + .6} width="26" height={height - 1.2} fill={fill === 'O' ? 'white' : '#dededb'} stroke="currentColor" strokeWidth=".7" />
                {fill === 'T' && <path d={`M8 ${y + 3}h24`} stroke="currentColor" strokeWidth=".7" />}
                {fill === 'D' && <path d={`M29 ${y + height * .4}v${height * .2}`} stroke="currentColor" />}
              </g>;
            })}
          </svg>
        </button>;
      })}
    </div>}
    <FurniturePanel view={{ ...view, layout: 'single', tabs: [{ ...tab, usesSections: false, controls: tab.controls.filter(c => c.id !== 'storageKind') }] }} onIntent={onIntent} />
  </div>;
}
