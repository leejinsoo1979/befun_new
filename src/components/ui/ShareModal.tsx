'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareModalProps {
  shareUrl: string;
  onClose: () => void;
}

export function ShareModal({ shareUrl, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-[380px] rounded-2xl bg-white p-8 shadow-2xl"
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

        <h3 className="mb-6 text-center text-lg font-semibold text-[#333]">
          디자인 공유
        </h3>

        {/* QR 코드 */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <QRCodeSVG value={shareUrl} size={160} level="M" />
          </div>
        </div>

        {/* URL + 복사 */}
        <div className="flex items-stretch gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 outline-none focus:border-[var(--green)]"
          />
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg bg-[var(--green)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a7a1a] active:scale-[0.97]"
          >
            {copied ? '복사됨!' : '복사'}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          링크를 공유하면 누구나 디자인을 확인할 수 있습니다
        </p>
      </div>
    </div>
  );
}
