import { create } from 'zustand';

/** 3D 씬의 선반 그룹 이름 — USDZ 내보내기에서 찾는 데 사용 */
export const SHELF_ROOT_NAME = 'befun-shelf-root';

/**
 * AR 상태 + Canvas 내부(ARController)가 등록하는 제어 함수.
 * WebXR 세션 시작과 USDZ 내보내기에는 렌더러/씬이 필요해서,
 * Canvas 안에서 함수를 등록하고 바깥 UI(버튼)가 호출한다.
 */
interface ARState {
  /** 안드로이드 WebXR 세션 진행 중 */
  webxrActive: boolean;
  /** 바닥에 선반을 놓았는지 */
  placed: boolean;
  /** 바닥 인식 중(레티클 표시 여부) */
  surfaceFound: boolean;

  startWebXR: ((overlayRoot: HTMLElement) => Promise<void>) | null;
  endWebXR: (() => void) | null;
  rotateShelf: ((radians: number) => void) | null;
  exportUSDZ: (() => Promise<Blob>) | null;
}

export const useARStore = create<ARState>(() => ({
  webxrActive: false,
  placed: false,
  surfaceFound: false,
  startWebXR: null,
  endWebXR: null,
  rotateShelf: null,
  exportUSDZ: null,
}));
