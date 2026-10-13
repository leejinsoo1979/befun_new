import { befunMaterialSwatches } from '@/lib/optimizer/befun/colors';

// 재질 스와치 데이터 — MaterialPanel(우측 재질 패널)과 SpaceDefaultsModal(공간설정 기본값)에서 공용 사용

export interface MaterialSwatch {
  id: string;
  name: string;
  type: string;
  category: string;
  color: string;
  texture: string;
  image: string;
  /** 스와치 미리보기 전용 이미지. 없으면 image를 쓴다.
   *  판재 한 장을 찍은 세로로 긴 원본은 정사각 스와치에 cover되면 무늬가 크게 보인다. */
  thumbnail?: string;
}

// 재질 데이터 정의 (도어: 전체)
// 섬네일(_thumb, 256×256): 원본 가운데 1024 를 Lanczos 로 미리 줄였다(카드 약 130px × 윈도우 125~150% ≈ 200px 라 브라우저가 거의 다시 줄이지 않는다) — 원본을 칸에 통째로 줄이면 촘촘한 패브릭 올이 뭉개져 윈도우(배율 100~150%)에서 얼룩졌다(마마 지적 2026-09-28). 3D 는 원본 그대로.
export const materialSwatches: MaterialSwatch[] = [
  { id: "in1", name: "다크우드", type: "텍스처", category: "mmm", color: "#4a443f", texture: "image", image: "/materials/solid/dark_wood.jpg", thumbnail: "/materials/solid/dark_wood_thumb.jpg" },
  { id: "in2", name: "블랙", type: "텍스처", category: "mmm", color: "#3a3a38", texture: "image", image: "/materials/solid/inshow_black.jpg", thumbnail: "/materials/solid/inshow_black_thumb.jpg" },
  { id: "in3", name: "패브릭", type: "텍스처", category: "mmm", color: "#d6d2cf", texture: "image", image: "/materials/solid/inshow_fabric.jpg", thumbnail: "/materials/solid/inshow_fabric_thumb.jpg" },
  { id: "in4", name: "레더", type: "텍스처", category: "mmm", color: "#c9c0b6", texture: "image", image: "/materials/solid/inshow_lether.jpg", thumbnail: "/materials/solid/inshow_lether_thumb.jpg" },
  // 2026-09-17 마마 지시로 추가. 원본 3572x14400(11.6MB)을 결 비율 그대로 1024x4128로 줄이고 품질 60으로 저장(848KB).
  // 파일 이름에 oak를 넣지 않는다 — materialConstants의 isOakTexture가 URL로 판정해 OAK_TEXTURE_SETTINGS(결을 어둡게 누르는 rgb 0.6/0.5/0.4)가 자동 적용된다.
  { id: "in5", name: "오크", type: "텍스처", category: "mmm", color: "#b19377", texture: "image", image: "/materials/solid/light_wood.jpg", thumbnail: "/materials/solid/light_wood_thumb.jpg" },
];

// 속장 재질: 블랙, 패브릭만 노출
// [Befun 추가] 재생 시뮬레이션이 Befun 판재 색(textureName = 'Befun <색상명>')을 찾도록 견본을 덧붙인다. src/lib/optimizer/befun/colors.ts
materialSwatches.push(...befunMaterialSwatches());

export const interiorSwatches: MaterialSwatch[] = materialSwatches.filter((m) => m.id === 'in2' || m.id === 'in3');

// 상판 재질 데이터
export const countertopSwatches: MaterialSwatch[] = [
  // 현대칸스톤
  { id: "ct1", name: "루나쉐도우", type: "인조대리석", category: "현대칸스톤", color: "#FFFFFF", texture: "image", image: "/materials/countertop/luna_shadow_hanwha.png" },
  { id: "ct2", name: "루나화이트", type: "인조대리석", category: "현대칸스톤", color: "#FFFFFF", texture: "image", image: "/materials/countertop/luna_white_hanwha.png" },
  { id: "ct3", name: "애쉬콘크리트", type: "인조대리석", category: "현대칸스톤", color: "#FFFFFF", texture: "image", image: "/materials/countertop/ash_concrete_hanwha.png" },

  // 사일스톤(AAM)
  { id: "ct4", name: "노리타", type: "인조대리석", category: "사일스톤", color: "#FFFFFF", texture: "image", image: "/materials/countertop/norita_silestone.png" },
  { id: "ct5", name: "시포트", type: "인조대리석", category: "사일스톤", color: "#FFFFFF", texture: "image", image: "/materials/countertop/siport_silestone.png" },
  { id: "ct6", name: "퍼블레노", type: "인조대리석", category: "사일스톤", color: "#FFFFFF", texture: "image", image: "/materials/countertop/publeno_silestone.png" },

  // LX하이막스
  { id: "ct7", name: "스노우콘크리트", type: "인조대리석", category: "LX하이막스", color: "#FFFFFF", texture: "image", image: "/materials/countertop/snow_concrete_lx.png" },
  { id: "ct8", name: "어반콘크리트", type: "인조대리석", category: "LX하이막스", color: "#FFFFFF", texture: "image", image: "/materials/countertop/urban_concrete_lx.png" },
  { id: "ct9", name: "클라우드콘크리트", type: "인조대리석", category: "LX하이막스", color: "#FFFFFF", texture: "image", image: "/materials/countertop/cloud_concrete_lx.png" },
];

// 필터 탭 고정 순서
export const materialCategories = ['mmm'] as const;
export const countertopCategories = ['현대칸스톤', '사일스톤', 'LX하이막스'] as const;

/**
 * 이 저장소에 실제로 들어 있는 텍스처 경로.
 *
 * 예전에 쓰던 재질(한솔 등)이 저장된 프로젝트에 그대로 남아 있는데,
 * 그 PNG는 저장소에 없다. Vite 개발 서버는 없는 경로에 404가 아니라
 * index.html을 200으로 돌려주므로, 브라우저가 HTML을 이미지로
 * 디코딩하려다 실패해 콘솔에 '텍스처 로딩 실패'가 프레임 수만큼 쌓인다.
 */
const KNOWN_TEXTURES: ReadonlySet<string> = new Set(
  [...materialSwatches, ...countertopSwatches].map((m) => m.image)
);

/**
 * 쓸 수 있는 텍스처 경로인지.
 *
 * 카탈로그에 없는 `/materials/...` 경로는 사라진 재질로 본다.
 * 그 밖의 경로(data URL, 사용자가 올린 이미지, 다른 폴더)는 건드리지
 * 않는다 — 카탈로그가 모든 텍스처의 목록은 아니다.
 */
export const isUsableTexture = (url?: string | null): boolean => {
  if (!url) return false;
  if (!url.startsWith('/materials/')) return true;
  return KNOWN_TEXTURES.has(url);
};
