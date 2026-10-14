import type { TylkoClipDimensions, TylkoClipPinDimensions } from './clipContract';

/**
 * 설명용(illustrative) 치수 — 제조 기본값이 아니다.
 * connector-clip-004 사진에서 18mm 안팎 합판 단면 대비 비례를 눈으로 잡은 값이며 측정값이 아니다.
 * 단품 캡처·조립 설명 애니메이션에만 사용한다. isManufacturingReady()는 항상 false를 반환한다.
 * 실측/공식 도면 확보 시 status:'measured' 객체를 별도로 만들고 이 값을 수정하지 않는다.
 */
export const ILLUSTRATIVE_CLIP: TylkoClipDimensions = {
  lengthMm: 32,
  widthMm: 9,
  depthMm: 12,
  entryDiameterMm: 6.5,
  slotWidthMm: 3.2,
  travelMm: 11,
  lipThicknessMm: 2,
  status: 'illustrative',
  source: 'connector-clip-004 사진 비례(설명용, 미측정)',
};

export const ILLUSTRATIVE_PIN: TylkoClipPinDimensions = {
  headDiameterMm: 5.5,
  headHeightMm: 2,
  neckDiameterMm: 2.6,
  neckLengthMm: 6,
  status: 'illustrative',
  source: 'connector-clip-003 p5 확대도 형태(설명용, 미측정)',
};
