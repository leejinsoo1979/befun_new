'use client';

import { useLocale } from '@/lib/commerce/useLocale';

import { useEffect, useState } from 'react';
import { useARStore } from '@/components/three/ar/arStore';

interface QuickLookSheetProps {
  onClose: () => void;
}

/**
 * 아이폰/아이패드: 현재 디자인을 USDZ로 만들어 AR Quick Look으로 연다.
 * Quick Look 링크는 사용자가 직접 탭해야 안정적으로 열리므로(비동기 생성 후 자동 실행은 차단될 수 있음)
 * 준비가 끝나면 rel="ar" 링크 버튼을 보여준다. Quick Look 링크는 <img> 자식 하나만 가져야 한다.
 */
export function QuickLookSheet({ onClose }: QuickLookSheetProps) {
  const { t } = useLocale();
  const [url, setUrl] = useState<string | null>(null);
  // 3D 뷰어가 아직 준비되지 않아 내보내기 함수가 없으면 바로 오류 표시
  const [error, setError] = useState(() => !useARStore.getState().exportUSDZ);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    const exportUSDZ = useARStore.getState().exportUSDZ;
    if (!exportUSDZ) return;
    exportUSDZ()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => {
        console.error('[Befun] USDZ 생성 실패', err);
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-[420px] rounded-t-2xl bg-white px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] text-center shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[17px] font-semibold text-[#222]">{t("내 공간에 놓아보기")}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#888]">
           {t("실제 크기로 바닥에 배치돼요. 옵션을 바꾸려면 AR을 닫고")} <br />
           {t("수정한 뒤 다시 열어주세요.")} </p>

        <div className="mt-5 flex justify-center">
          {error ? (
            <p className="py-3 text-[14px] text-[#d33]">{t("AR 모델을 만들지 못했어요. 잠시 후 다시 시도해주세요.")}</p>
          ) : url ? (
            <a
              rel="ar"
              href={`${url}#allowsContentScaling=0`}
              aria-label={t("AR로 보기")}
              className="flex h-14 w-full items-center justify-center rounded-full bg-[var(--green)] shadow-sm active:scale-[0.98]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Quick Look은 <a rel="ar"> 안의 실제 <img>가 필요 */}
              <img src="/imgs/icon/icon_ar.svg" alt={t("AR로 보기")} width={28} height={28} className="brightness-0 invert" />
            </a>
          ) : (
            <p className="py-4 text-[14px] text-[#888]">{t("AR 모델 준비 중…")}</p>
          )}
        </div>
        {url && <p className="mt-2 text-[12px] text-[#aaa]">{t("버튼을 누르면 카메라가 열려요")}</p>}

        <button type="button" onClick={onClose} className="mt-4 w-full py-2 text-[14px] text-[#666]">
           {t("닫기")} </button>
      </div>
    </div>
  );
}
