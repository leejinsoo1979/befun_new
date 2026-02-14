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

const textureLoader = new THREE.TextureLoader();

const MATERIAL_TYPES: MaterialType[] = [
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

/** Solid/EdgeMix 용 단색 머티리얼 세트 생성 */
export function createColorMaterials(baseHex: string, edgeHex: string): MaterialSet {
  const base = new THREE.MeshStandardMaterial({
    color: new THREE.Color(baseHex),
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const edge = new THREE.MeshStandardMaterial({
    color: new THREE.Color(edgeHex),
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const back = new THREE.MeshStandardMaterial({
    color: new THREE.Color(baseHex),
    roughness: 1.0,
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
          const mat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 1.0,
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
            roughness: 1.0,
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
