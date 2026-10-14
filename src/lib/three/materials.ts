import * as THREE from 'three';
import type { MaterialType } from '@/types/shelf';
import type { ColorCategory } from '@/types/shelf';

// ── 색상 딕셔너리 (v1 colorSelect.js 이식) ──

/** Classic/Natural 텍스처 폴더 매핑 */
export const TEXTURE_MAP: Record<string, string> = {
  C_Black: 'wood001',
  C_White: 'wood002',
  C_Pink: 'wood005',
  C_Gray: 'wood003',
  C_Yellow: 'wood013',
  N_Beech: 'natural_bright',
  N_Oak: 'natural_normal',
  N_Walnut: 'natural_dark',
};

/** Solid 색상 hex 코드 */
export const SOLID_COLORS: Record<string, { base: string; edge: string }> = {
  'S_Black':            { base: '#191B1C', edge: '#191B1C' },
  'S_Midnight Blue':    { base: '#283A57', edge: '#283A57' },
  'S_Burgundy':         { base: '#671112', edge: '#671112' },
  'S_Teracotta':        { base: '#C88A64', edge: '#C88A64' },
  'S_Teracotta Orange': { base: '#A8442B', edge: '#A8442B' },
  'S_Gray':             { base: '#C0C0C0', edge: '#C0C0C0' },
  'S_Green':            { base: '#034A22', edge: '#034A22' },
  'S_Ivory':            { base: '#E7E3DA', edge: '#E7E3DA' },
  'S_Sand Beige':       { base: '#9C8E78', edge: '#9C8E78' },
  'S_Olive Green':      { base: '#8F9B79', edge: '#8F9B79' },
  'S_Pink':             { base: '#CEAFAE', edge: '#CEAFAE' },
  'S_Red':              { base: '#DC181C', edge: '#DC181C' },
  'S_Sky Blue':         { base: '#83ABCF', edge: '#83ABCF' },
  'S_Yellow':           { base: '#E6BF78', edge: '#E6BF78' },
};

/** EdgeMix 색상 (base ≠ edge) */
export const EDGE_MIX_COLORS: Record<string, { base: string; edge: string }> = {
  'Sand+Midnight Blue': { base: '#DBD3CB', edge: '#283A57' },
  'Gray+Darkgray':      { base: '#C4C1C0', edge: '#726769' },
  'Sand+Green':         { base: '#E7E3DA', edge: '#034A22' },
  'Sand+Mustard':       { base: '#DBD3CB', edge: '#CEC096' },
};

// ── 카테고리 판별 ──

export function getColorCategory(colorName: string): ColorCategory {
  if (colorName.startsWith('C_')) return 'classic';
  if (colorName.startsWith('N_')) return 'natural';
  if (colorName.startsWith('S_')) return 'solid';
  if (colorName.includes('+')) return 'edgeMix';
  return 'solid';
}

// ── 텍스처 로딩 유틸 ──

// 표면 질감: 1.0(완전 무광)이면 종이처럼 보여서 약간의 광택을 준다
const SOLID_ROUGHNESS = 0.5; // 무광 래커 도장 — 넓은 면에 은은한 반사 그라데이션이 생기도록
const WOOD_ROUGHNESS = 0.72; // 원목/무늬목
const TEXTURE_ANISOTROPY = 8;

const textureLoader = new THREE.TextureLoader();

type TextureMaterialType = keyof MaterialSet;

const MATERIAL_TYPES: TextureMaterialType[] = [
  'verticalBase',
  'verticalEdge',
  'horizontalBase',
  'horizontalEdge',
  'backPanel',
];

export interface MaterialSet {
  verticalBase: THREE.MeshStandardMaterial;
  verticalEdge: THREE.MeshStandardMaterial;
  horizontalBase: THREE.MeshStandardMaterial;
  horizontalEdge: THREE.MeshStandardMaterial;
  backPanel: THREE.MeshStandardMaterial;
}

// ── 단색 도장면 미세 질감 ──
// 완전히 균일한 단색은 플라스틱/CG처럼 보여서, 아주 약한 노이즈로 색(±2%)과 거칠기에 변화를 준다.
let paintNoiseCanvas: HTMLCanvasElement | null = null;

function getPaintNoiseCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (paintNoiseCanvas) return paintNoiseCanvas;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 245 + Math.floor(Math.random() * 11); // 245~255: 곱해지는 값이라 아주 약한 변화
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  paintNoiseCanvas = canvas;
  return canvas;
}

/** 세트마다 새 텍스처를 만든다 (disposeMaterialSet이 map/roughnessMap을 해제하므로 공유하면 안 됨) */
function createPaintTextures(): { map?: THREE.Texture; roughnessMap?: THREE.Texture } {
  const canvas = getPaintNoiseCanvas();
  if (!canvas) return {};
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = TEXTURE_ANISOTROPY;
  const roughnessMap = new THREE.CanvasTexture(canvas);
  roughnessMap.anisotropy = TEXTURE_ANISOTROPY;
  return { map, roughnessMap };
}

// ── 단색 화면 보정 ──
// Tylko 재질값(예: Midnight Blue #101323)은 Tylko 렌더에서 밝은 환경 반사가 얹혀 훨씬 밝게 보인다
// (측정: Midnight #393943, Black #414141, Terracotta #b45c48). 우리 조명은 환경광을 바꿀 수 없으므로(원목 영향)
// 광택 대신 단색 재질의 linear 색을 out = albedo×GAIN + LIFT로 보정해 화면 밝기를 맞춘다. 단색 전용.
const SOLID_DISPLAY_GAIN = 1.25;
const SOLID_DISPLAY_LIFT = 0.038;

export function solidDisplayColor(hex: string): THREE.Color {
  const c = new THREE.Color(hex); // sRGB hex → linear
  c.r = Math.min(1, c.r * SOLID_DISPLAY_GAIN + SOLID_DISPLAY_LIFT);
  c.g = Math.min(1, c.g * SOLID_DISPLAY_GAIN + SOLID_DISPLAY_LIFT);
  c.b = Math.min(1, c.b * SOLID_DISPLAY_GAIN + SOLID_DISPLAY_LIFT);
  return c;
}

/** Solid/EdgeMix 용 단색 머티리얼 세트 생성 */
export function createColorMaterials(baseHex: string, edgeHex: string): MaterialSet {
  const base = new THREE.MeshStandardMaterial({
    ...createPaintTextures(),
    color: solidDisplayColor(baseHex),
    roughness: SOLID_ROUGHNESS,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const edge = new THREE.MeshStandardMaterial({
    ...createPaintTextures(),
    color: solidDisplayColor(edgeHex),
    roughness: SOLID_ROUGHNESS,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const back = new THREE.MeshStandardMaterial({
    ...createPaintTextures(),
    color: solidDisplayColor(baseHex),
    roughness: SOLID_ROUGHNESS,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  return {
    verticalBase: base,
    verticalEdge: edge,
    horizontalBase: base.clone(),
    horizontalEdge: edge.clone(),
    backPanel: back,
  };
}

/** Classic/Natural 용 텍스처 머티리얼 세트 생성 (비동기) */
export function createTextureMaterials(textureName: string): Promise<MaterialSet> {
  return new Promise((resolve) => {
    const materials: Partial<MaterialSet> = {};
    let loaded = 0;
    const total = MATERIAL_TYPES.length;

    MATERIAL_TYPES.forEach((type) => {
      const path = `/imgs/textures/${textureName}/${type}_diff.jpg`;

      textureLoader.load(
        path,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          // 비스듬한 시점에서 나뭇결이 뭉개지지 않도록 (렌더러 최대값으로 자동 제한)
          texture.anisotropy = TEXTURE_ANISOTROPY;
          const mat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: WOOD_ROUGHNESS,
            metalness: 0.0,
            side: THREE.DoubleSide,
          });
          materials[type] = mat;
          loaded++;
          if (loaded === total) resolve(materials as MaterialSet);
        },
        undefined,
        (error) => {
          console.warn(`[Befun] 텍스처 로드 실패: ${path}`, error);
          // 텍스처 로드 실패 시 흰색 폴백
          materials[type] = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: SOLID_ROUGHNESS,
            metalness: 0.0,
            side: THREE.DoubleSide,
          });
          loaded++;
          if (loaded === total) resolve(materials as MaterialSet);
        },
      );
    });
  });
}

/** 색상명으로 머티리얼 세트 생성 */
export async function createMaterialsForColor(colorName: string): Promise<MaterialSet> {
  const category = getColorCategory(colorName);

  if (category === 'classic' || category === 'natural') {
    const textureName = TEXTURE_MAP[colorName];
    if (textureName) {
      return createTextureMaterials(textureName);
    }
  }

  if (category === 'edgeMix') {
    const colors = EDGE_MIX_COLORS[colorName];
    if (colors) {
      return createColorMaterials(colors.base, colors.edge);
    }
  }

  // Solid 또는 폴백
  const colors = SOLID_COLORS[colorName] ?? { base: '#283A57', edge: '#283A57' };
  return createColorMaterials(colors.base, colors.edge);
}

// ── 텍스처 해제 유틸 (v1 disposeTextures 이식) ──

export function disposeMaterialSet(materials: MaterialSet): void {
  Object.values(materials).forEach((mat) => {
    if (mat instanceof THREE.MeshStandardMaterial) {
      if (mat.map) {
        mat.map.dispose();
        mat.map = null;
      }
      if (mat.roughnessMap) {
        mat.roughnessMap.dispose();
        mat.roughnessMap = null;
      }
      if (mat.normalMap) {
        mat.normalMap.dispose();
        mat.normalMap = null;
      }
      if (mat.aoMap) {
        mat.aoMap.dispose();
        mat.aoMap = null;
      }
      mat.dispose();
    }
  });
}

// ── 멀티페이스 머티리얼 배열 생성 (v1 addBox.js 이식) ──

export interface TextureRotation {
  verticalBase: number;
  horizontalBase: number;
}

export const DEFAULT_TEXTURE_ROTATION: TextureRotation = {
  verticalBase: 0,
  horizontalBase: 0,
};

/**
 * BoxGeometry의 6면에 적용할 머티리얼 배열 생성
 * v1 addBox.js의 multi-face 로직 이식
 *
 * Three.js BoxGeometry face order:
 * [0:+x(right), 1:-x(left), 2:+y(top), 3:-y(bottom), 4:+z(front), 5:-z(back)]
 */
export function createFaceMaterials(
  baseMat: THREE.MeshStandardMaterial,
  edgeMat: THREE.MeshStandardMaterial,
  isVertical: boolean,
  textureRotation: TextureRotation = DEFAULT_TEXTURE_ROTATION,
): THREE.MeshStandardMaterial[] {
  if (isVertical) {
    // 세로 패널: base가 left/right, edge가 top/bottom/front/back
    const rotated = baseMat.clone();
    if (rotated.map) {
      rotated.map = rotated.map.clone();
      rotated.map.rotation = THREE.MathUtils.degToRad(textureRotation.verticalBase);
      rotated.map.center.set(0.5, 0.5);
    }
    return [
      rotated,    // +x right
      rotated,    // -x left
      edgeMat,    // +y top
      edgeMat,    // -y bottom
      edgeMat,    // +z front
      edgeMat,    // -z back
    ];
  } else {
    // 가로 패널: base가 top/bottom, edge가 left/right/front/back
    const rotated = baseMat.clone();
    if (rotated.map) {
      rotated.map = rotated.map.clone();
      rotated.map.rotation = THREE.MathUtils.degToRad(textureRotation.horizontalBase);
      rotated.map.center.set(0.5, 0.5);
    }
    return [
      edgeMat,    // +x right
      edgeMat,    // -x left
      rotated,    // +y top
      rotated,    // -y bottom
      edgeMat,    // +z front
      edgeMat,    // -z back
    ];
  }
}
