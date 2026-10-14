'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/commerce/useLocale';
import { LegacyShelfPanel, LEGACY_MOBILE_TABS } from './furniture-panels';
import { FeetSelector } from '@/components/ui/FeetSelector';
import { ColorPicker } from './ColorPicker';
import { PriceDisplay } from './PriceDisplay';

const TABS = [
  { key: 'style', label: '스타일' },
  { key: 'size', label: '크기' },
  { key: 'color', label: '색상' },
  { key: 'option', label: '옵션' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface MobileConfiguratorPanelProps {
  onPurchase: () => void;
  /** AR 오버레이 안에서 쓸 때: 화면 크기와 관계없이 표시하고 뷰어와 겹치는 여백 제거 */
  inOverlay?: boolean;
}

/**
 * 모바일(lg 미만) 컨피규레이터 하단 시트
 * - 탭으로 옵션을 나눠 스크롤을 줄이고, 3D 뷰어를 최대한 크게 유지
 * - 현재 탭을 다시 누르거나 핸들을 누르면 접힘 → 뷰어가 커지고 카메라가 자동 재조정
 * - 가격 + 구매하기는 항상 하단에 고정
 */
export function MobileConfiguratorPanel({ onPurchase, inOverlay = false }: MobileConfiguratorPanelProps) {
  const { t: tr } = useLocale();
  const [tab, setTab] = useState<TabKey>('style');
  const [open, setOpen] = useState(true);

  const handleTab = (key: TabKey) => {
    if (key === tab) {
      setOpen((o) => !o);
    } else {
      setTab(key);
      setOpen(true);
    }
  };

  return (
    <div
      className={`relative z-20 shrink-0 rounded-t-[20px] bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.08)] ${
        inOverlay ? '' : '-mt-4 lg:hidden'
      }`}
    >
      {/* 핸들 */}
      <button
        type="button"
        aria-label={tr(open ? '옵션 패널 접기' : '옵션 패널 펼치기')}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer justify-center pt-2.5 pb-1"
      >
        <span className="h-1 w-9 rounded-full bg-[#d9d9d9]" />
      </button>

      {/* 탭 */}
      <div role="tablist" className="flex border-b border-[#f0f0f0] px-3">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleTab(t.key)}
              className={`relative flex-1 cursor-pointer py-2.5 text-[14px] font-semibold transition-colors ${
                active ? 'text-[#111]' : 'text-[#9a9a9a]'
              }`}
            >
              {tr(t.label)}
              {active && (
                <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-[var(--green)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* 탭 내용 */}
      <div
        role="tabpanel"
        className={`overflow-y-auto overscroll-contain px-4 transition-[max-height] duration-300 ease-out ${
          open ? 'max-h-[36dvh]' : 'max-h-0'
        }`}
      >
        <div className="py-2">
          {tab === 'style' && (
            <LegacyShelfPanel controls={LEGACY_MOBILE_TABS.style} />
          )}
          {tab === 'size' && <LegacyShelfPanel controls={LEGACY_MOBILE_TABS.size} />}
          {tab === 'color' && <ColorPicker />}
          {tab === 'option' && (
            <>
              <FeetSelector />
              <LegacyShelfPanel controls={LEGACY_MOBILE_TABS.option} />
              <p className="pb-2 text-[12px] leading-relaxed text-[#999]">
                {tr('선반의 칸을 탭하면 칸 높이·도어·서랍을 바꿀 수 있어요.')}
              </p>
            </>
          )}
        </div>
      </div>

      {/* 가격 + 구매 (항상 고정) */}
      <div className="flex items-center gap-3 border-t border-[#f0f0f0] px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1">
          <PriceDisplay compact />
        </div>
        <button
          type="button"
          onClick={onPurchase}
          className="h-12 shrink-0 cursor-pointer rounded-full bg-[var(--green)] px-8 text-[15px] font-semibold text-white shadow-sm transition-transform active:scale-[0.97]"
        >
          {tr('구매하기')}
        </button>
      </div>
    </div>
  );
}
