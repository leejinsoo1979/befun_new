/** Original evidence only. PDF regions are rendered by Poppler without changing their artwork. */
export const clipReferences = [
  { src: '/imgs/assembly-guide/clip-colour-official.png', page: 2, alt: '공식 PDF의 검정·은색 클립 실물 사진', focus: '20% 50%', width: 675, height: 438 },
  { src: '/imgs/assembly-guide/clip-align-official.png', page: 3, alt: '공식 PDF의 핀과 클립 입구 대응 도해', focus: '65% 35%', width: 646, height: 755 },
  { src: '/imgs/assembly-guide/clip-enter-official.png', page: 4, alt: '공식 PDF의 핀 진입 방향 도해', focus: '70% 35%', width: 646, height: 760 },
  { src: '/imgs/assembly-guide/clip-slide-official.png', page: 5, alt: '공식 PDF의 핀 진입 후 슬라이드 도해와 원본 확대도', focus: '82% 17%', width: 675, height: 700 },
  { src: '/imgs/assembly-guide/clip-check-official.png', page: 6, alt: '공식 PDF의 체결 위치와 끝선 정렬 원본 확대도', focus: '82% 30%', width: 675, height: 705 },
] as const;

export const userClipPhoto = {
  src: '/imgs/assembly-guide/clip-colour-user.png',
  alt: '사용자가 지정한 검정·주황 매입 클립의 원본 실물 사진',
  focus: '55% 58%',
  width: 452,
  height: 678,
} as const;
