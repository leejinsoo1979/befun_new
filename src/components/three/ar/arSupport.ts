/**
 * 기기별 AR 지원 판별
 * - 안드로이드 Chrome(ARCore): WebXR immersive-ar → 놓은 채로 실시간 수정
 * - 아이폰/아이패드 Safari: AR Quick Look(USDZ) → 놓아보기만 (수정은 웹으로 돌아와서)
 */
export type ARMode = 'webxr' | 'quicklook' | 'none';

export async function detectARMode(): Promise<ARMode> {
  if (typeof window === 'undefined') return 'none';

  try {
    if (navigator.xr && (await navigator.xr.isSessionSupported('immersive-ar'))) {
      return 'webxr';
    }
  } catch {
    // 권한 정책 등으로 실패하면 다음 방식 확인
  }

  const a = document.createElement('a');
  if (a.relList?.supports?.('ar')) return 'quicklook';

  return 'none';
}
