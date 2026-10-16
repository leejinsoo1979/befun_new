'use client';

import { useLocale } from '@/lib/commerce/useLocale';

import { QRCodeSVG } from 'qrcode.react';

interface ARModalProps {
  shareUrl: string;
  onClose: () => void;
}

export function ARModal({ shareUrl, onClose }: ARModalProps) {
  const { t } = useLocale();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h3 className="mb-2 text-center text-lg font-semibold text-[#333]">
           {t("AR 뷰어")} </h3>
        <p className="mb-6 text-center text-sm text-gray-500">
           {t("모바일에서 QR 코드를 스캔하여")}<br />{t("디자인을 확인하세요")} </p>

        {/* QR 코드 */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <QRCodeSVG value={shareUrl} size={200} level="M" />
          </div>
        </div>

        {/* 안내 */}
        <div className="rounded-lg bg-gray-50 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-base">📱</span>
            <p className="text-xs leading-relaxed text-gray-500">
               {t("스마트폰 카메라로 QR 코드를 스캔하면 브라우저에서 선반 디자인을 바로 확인할 수 있습니다.")} </p>
          </div>
        </div>
      </div>
    </div>
  );
}
