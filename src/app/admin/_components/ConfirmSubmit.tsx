'use client';

/** 되돌리기 어려운 처리(취소 등) 전 확인창을 띄우는 제출 버튼 */
export function ConfirmSubmit({ message, className, children }: { message: string; className?: string; children: React.ReactNode }) {
  return <button type="submit" className={className} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>{children}</button>;
}
