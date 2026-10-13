import * as THREE from 'three';

export type PanelGrainMap = { [panelName: string]: 'horizontal' | 'vertical' };

/**
 * 재질 처리 관련 공통 상수
 */

// Cabinet Texture1 재질 설정
export const CABINET_TEXTURE1_SETTINGS = {
  name: 'cabinet texture1',
  rgb: [0.12, 0.12, 0.12] as const,
  toneMapped: false,
  envMapIntensity: 0.0,
  emissive: 0x000000,
  roughness: 0.8
} as const;

// 기본 이미지 텍스처 재질 설정 (메라톤, 한솔, 예림 등)
export const DEFAULT_IMAGE_TEXTURE_SETTINGS = {
  // 2026-03: 옛 메라톤·한솔·예림 텍스처가 밝아 0.35로 눌렀다. 2026-07-21에 재질 세트가 어두운 inshow로
  // 바뀌면서 이 값이 그대로 남아 블랙·다크우드가 두 번 어두워졌다(속장이 새까맣게 보이던 원인). 0.7로 되돌린다.
  rgb: [1.0, 1.0, 1.0] as const, // 곱색 없음 — 썸네일 이미지 그대로
  toneMapped: true,
  envMapIntensity: 0.15,
  emissive: 0x000000,
  roughness: 0.75,
  metalness: 0.0
} as const;

// Oak 재질 설정
export const OAK_TEXTURE_SETTINGS = {
  name: 'oak',
  rgb: [0.6, 0.5, 0.4] as const, // 나무결이 잘 보이도록 어둡게
  toneMapped: true,
  envMapIntensity: 0.2,
  emissive: 0x000000,
  roughness: 0.7,
  metalness: 0.0
} as const;

// 원본 이미지의 결이 세로(높이) 방향인 텍스처 목록
// 회전 로직은 "원본 결 = 가로" 가정이므로, 여기 등록된 텍스처는 회전을 반전해야 함
export const VERTICAL_SOURCE_GRAIN_TEXTURES = ['dark_wood', 'light_wood'] as const;

/**
 * 원본 이미지 결이 세로 방향인 텍스처인지 확인 (결 방향 회전 반전 필요)
 */
export const hasVerticalSourceGrain = (textureUrl?: string): boolean => {
  if (!textureUrl) return false;
  const lower = textureUrl.toLowerCase();
  return VERTICAL_SOURCE_GRAIN_TEXTURES.some((name) => lower.includes(name));
};

/**
 * Cabinet Texture1인지 확인
 */
export const isCabinetTexture1 = (textureUrl?: string): boolean => {
  return textureUrl?.toLowerCase().includes(CABINET_TEXTURE1_SETTINGS.name) ?? false;
};

/**
 * Oak 텍스처인지 확인
 */
export const isOakTexture = (textureUrl?: string): boolean => {
  return textureUrl?.toLowerCase().includes(OAK_TEXTURE_SETTINGS.name) ?? false;
};

/**
 * Cabinet Texture1 재질 속성을 적용
 */
export const applyCabinetTexture1Settings = (material: THREE.MeshStandardMaterial): void => {
  const settings = CABINET_TEXTURE1_SETTINGS;
  material.color.setRGB(...settings.rgb);
  material.toneMapped = settings.toneMapped;
  material.envMapIntensity = settings.envMapIntensity;
  material.emissive.setHex(settings.emissive);
  material.roughness = settings.roughness;
  material.needsUpdate = true;
};

/**
 * 기본 이미지 텍스처 재질 속성을 적용 (메라톤, 한솔, 예림 등)
 */
/** 인쇼블랙 노란 기 제거 배율(선형 R·G·B) — 그림 선형 평균을 채널마다 휘도에 맞춘 값 */
export const INSHOW_BLACK_NEUTRAL = new THREE.Color(0.9685, 0.9976, 1.1361);

export const applyDefaultImageTextureSettings = (material: THREE.MeshStandardMaterial): void => {
  const settings = DEFAULT_IMAGE_TEXTURE_SETTINGS;
  const image = material.map?.image as { currentSrc?: string; src?: string } | undefined;
  const textureUrl = image?.currentSrc || image?.src;
  material.color.setRGB(...settings.rgb);
  // 2026-10-03: sRGB 해석·무늬 배율은 유지하고 블랙만 선형 밝기를 15% 소폭 보정한다.
  if (textureUrl?.toLowerCase().includes('inshow_black')) {
    material.color.multiplyScalar(1.15);
    // 2026-10-05 마마 지시 「살짝 노란 기운이 돌지 않아?」→ 중립 검정으로: 원본 그림(Downloads/inshow_black.png 부터)이
    // 빨강·초록이 파랑보다 높은 올리브 톤이다. 그림 선형 평균(R .0566·G .0550·B .0483)을 채널마다 휘도(.0548)에 맞추는 배율 —
    // 밝기(휘도)·무늬·크기·비율은 그대로, 색온도만 중립으로.
    material.color.multiply(INSHOW_BLACK_NEUTRAL);
  }
  material.toneMapped = settings.toneMapped;
  material.envMapIntensity = settings.envMapIntensity;
  material.emissive.setHex(settings.emissive);
  material.roughness = settings.roughness;
  material.metalness = settings.metalness;
  // 블랙·패브릭 등 JPEG 원본은 sRGB 이미지다. 색공간 없이 읽으면 짙은 중간톤을
  // 선형 밝기로 오해해 회색으로 뜬다. 원본 색을 복원하고 회전 클론에도 상속한다.
  if (material.map && textureTileMmFor(textureUrl) && material.map.colorSpace !== THREE.SRGBColorSpace) {
    material.map.colorSpace = THREE.SRGBColorSpace;
    material.map.needsUpdate = true;
  }
  material.needsUpdate = true;
};

/**
 * 텍스처별 실물 타일 크기(mm) — 이미지 한 장의 실제 가로 길이(조절용 가정값, 측정 규격 아님). 세로는 이미지 비율로 정한다.
 * 등록된 텍스처는 BoxWithEdges가 판재 여섯 면의 실제 mm 크기에 맞춰 UV를 잡아 무늬가 어느 판재·어느 면에서도
 * 같은 크기·같은 비율로 반복된다(늘리거나 찌그러뜨리지 않음). 등록이 없으면 종전대로 면마다 이미지 한 장.
 * 파일 이름(소문자) 일부로 매칭한다. 2026-09-15 주인님 요청: inshow_fabric 무늬가 너무 잘아 한 장 = 1000mm(가정)로 시작했고 주인님 지시로 10배인 10000mm, 다시 5배인 50000mm, 다시 5배인 250000mm에서 현재 무늬를 1/10로 줄이라는 지시로 25000mm(가정)로 조정.
 */
export const TEXTURE_TILE_MM: Record<string, number> = {
  // 2026-10-02: 기존 큰 뒤판(1199×1665mm에 이미지 한 장) 대비 타일 면적을 약 1/4로.
  // 원본 2048×1486 비율을 복원하면서 무늬의 선형 크기를 약 절반으로 맞춘 조절값(제품 규격 아님).
  inshow_black: 830,
  inshow_fabric: 2500,
  // 2026-09-16 주인님 요청 "레더도 10배": 면 맞춤(도어 폭 ≈586mm에 한 장) 대비 가로 10배인 6000mm → 주인님 "1.5배 줄여" 지시로 4000mm(조절용 가정값)
  inshow_lether: 4000,
  // 2026-09-17 마마 지시 "오크 2배 확대" → 면 맞춤(도어 폭 ≈586mm에 한 장) 기준 2배인 1172mm.
  // 이어진 "1.5배 줄여" 지시로 1172/1.5 = 781mm(조절용 가정값).
  // 등록하면 실물 타일 UV로 바뀌고 applyDefaultImageTextureSettings가 map.colorSpace를 sRGB로 맞춘다.
  light_wood: 781,
};

/** 텍스처 경로에 맞는 실물 타일 가로(mm) — 등록이 없으면 null */
export const textureTileMmFor = (textureUrl?: string): number | null => {
  const lower = (textureUrl ?? '').toLowerCase();
  for (const [key, mm] of Object.entries(TEXTURE_TILE_MM)) if (lower.includes(key)) return mm;
  return null;
};

/**
 * 패널 이름으로 기본 결 방향 판단 (단일 기준 — CNC 옵티마이저와 팝업 패널목록 공통)
 *
 * 규칙:
 * - VERTICAL (결이 높이 방향, L=Y축): 백패널, 측판, 칸막이, 도어, 서랍속장, 커튼박스, 목찬넬프레임수직, 좌우 분할판
 * - HORIZONTAL (결이 너비 방향, L=X축): 상판, 바닥, 선반, 분할판, 보강대, 마이다, 서랍 앞판·뒷판·측판, 목찬넬프레임수평
 *
 * 주의: 백패널은 MDF 무결이지만 2440방향 고정 → VERTICAL로 취급(회전 불가).
 *
 * @param panelName - 패널 이름
 * @returns 'horizontal' | 'vertical'
 */
export const getDefaultGrainDirection = (panelName?: string): 'horizontal' | 'vertical' => {
  if (!panelName) {
    return 'vertical';
  }

  // 백패널: MDF 무결이지만 무조건 높이(Y축)=Length 고정 → vertical (회전 불가)
  if (panelName.includes('백패널')) return 'vertical';

  // 서랍 바닥 (MDF): 폭(L)방향 고정, 회전 불가
  if (panelName.includes('바닥') && panelName.includes('서랍')) return 'horizontal';

  // ── 서랍 부품 ────────────────────────────────
  if (panelName.includes('마이다')) return 'horizontal'; // 서랍 손잡이판
  if (panelName.includes('서랍') && panelName.includes('앞판')) return 'horizontal';
  if (panelName.includes('서랍') && panelName.includes('뒷판')) return 'horizontal';
  if (panelName.includes('서랍') && (panelName.includes('좌측판') || panelName.includes('우측판'))) {
    return 'horizontal'; // 서랍 측판: L=깊이(Z축)
  }

  // 서랍속장 (날개벽) - 세로 방향
  if (panelName.includes('서랍속장')) return 'vertical';

  // ── 프레임류 ──────────────────────────────────
  if (panelName.includes('커튼박스')) return 'vertical';
  if (panelName.includes('상부 EP 앞판') || panelName.includes('상부 EP 뒷턱')) return 'vertical';
  if (
    panelName.includes('키큰장찬넬 전면프레임') ||
    panelName.includes('키큰장찬넬 좌EP') ||
    panelName.includes('키큰장찬넬 우EP')
  ) {
    return 'vertical';
  }
  if (panelName.includes('목찬넬프레임수평')) return 'horizontal';
  if (panelName.includes('목찬넬프레임수직')) return 'horizontal';

  // ── 가구 구조 패널 (세로 방향) ─────────────────
  if (panelName.includes('좌측') || panelName.includes('우측') || panelName.includes('측판')) {
    return 'vertical';
  }
  if (panelName.includes('칸막이')) return 'vertical';
  if (panelName.includes('좌우 분할판')) return 'vertical'; // horizontalSplit 분할판
  if (panelName.includes('도어') || panelName.includes('Door')) return 'vertical';

  // ── 가구 구조 패널 (가로 방향) ─────────────────
  if (panelName.includes('상판') || panelName.includes('바닥')) return 'horizontal';
  if (panelName.includes('선반')) return 'horizontal';
  if (panelName.includes('분할판')) return 'horizontal'; // areaSubSplit 수평 분할판
  if (panelName.includes('보강대')) return 'horizontal';

  // 기본값: horizontal (가로 결)
  return 'horizontal';
};

/**
 * Oak 재질 속성을 적용
 * @param material - 적용할 재질
 * @param rotateTexture - 텍스처를 90도 회전할지 여부 (기본: true, 가로 결 방향)
 */
export const applyOakTextureSettings = (
  material: THREE.MeshStandardMaterial,
  rotateTexture: boolean = true
): void => {
  const settings = OAK_TEXTURE_SETTINGS;
  material.color.setRGB(...settings.rgb);
  material.toneMapped = settings.toneMapped;
  material.envMapIntensity = settings.envMapIntensity;
  material.emissive.setHex(settings.emissive);
  material.roughness = settings.roughness;
  material.metalness = settings.metalness;

  // Oak 텍스처 회전 설정 (기본: 가로 결 방향)
  if (material.map && rotateTexture) {
    material.map.rotation = Math.PI / 2; // 90도 회전
    material.map.center.set(0.5, 0.5); // 중심점 기준 회전
  }

  material.needsUpdate = true;
};

const normalizePanelNameForCompare = (name: string) => {
  return name
    .replace(/\s+/g, '')
    .replace(/[\(\)\[\]]/g, '')
    .replace(/상부/g, '상')
    .replace(/하부/g, '하')
    .replace(/좌측/g, '좌')
    .replace(/우측/g, '우')
    .replace(/왼쪽/g, '좌')
    .replace(/오른쪽/g, '우')
    .replace(/-/g, '')
    .toLowerCase();
};

const extractDoorInfo = (name: string) => {
  if (!name.includes('도어')) {
    return null;
  }

  const normalized = normalizePanelNameForCompare(name);
  const hasLeft = normalized.includes('좌');
  const hasRight = normalized.includes('우');
  const hasUpper = normalized.includes('상');
  const hasLower = normalized.includes('하');

  return {
    hasLeft,
    hasRight,
    hasUpper,
    hasLower
  };
};

export const resolvePanelGrainDirection = (
  panelName?: string,
  directions?: PanelGrainMap
): 'horizontal' | 'vertical' | undefined => {
  if (!panelName || !directions) {
    return undefined;
  }

  if (directions[panelName]) {
    return directions[panelName];
  }

  const entries = Object.entries(directions);

  const directInclude = entries.find(([key]) => panelName.includes(key) || key.includes(panelName));
  if (directInclude) {
    return directInclude[1];
  }

  const normalizedPanel = normalizePanelNameForCompare(panelName);
  const normalizedInclude = entries.find(([key]) => {
    const normalizedKey = normalizePanelNameForCompare(key);
    return normalizedPanel.includes(normalizedKey) || normalizedKey.includes(normalizedPanel);
  });
  if (normalizedInclude) {
    return normalizedInclude[1];
  }

  if (panelName.includes('도어')) {
    const panelDoorInfo = extractDoorInfo(panelName);
    for (const [key, value] of entries) {
      if (!key.includes('도어')) continue;
      const keyDoorInfo = extractDoorInfo(key);
      if (!panelDoorInfo || !keyDoorInfo) continue;

      if (panelDoorInfo.hasLeft !== keyDoorInfo.hasLeft && (panelDoorInfo.hasLeft || keyDoorInfo.hasLeft)) {
        continue;
      }
      if (panelDoorInfo.hasRight !== keyDoorInfo.hasRight && (panelDoorInfo.hasRight || keyDoorInfo.hasRight)) {
        continue;
      }
      if (panelDoorInfo.hasUpper && keyDoorInfo.hasLower) {
        continue;
      }
      if (panelDoorInfo.hasLower && keyDoorInfo.hasUpper) {
        continue;
      }
      return value;
    }
  }

  return undefined;
};
