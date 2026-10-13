/**
 * 3D 뷰어 밖(UI 버튼 등)에서 카메라를 제어하기 위한 이벤트.
 * Scene은 dynamic import라 ref를 넘기기 번거로워 window 이벤트로 연결한다.
 */
export const CAMERA_RESET_EVENT = 'befun:camera-reset';

/** 카메라를 정면 기본 시점으로 부드럽게 되돌린다 (스페이스바와 동일) */
export function requestCameraReset() {
  window.dispatchEvent(new Event(CAMERA_RESET_EVENT));
}
