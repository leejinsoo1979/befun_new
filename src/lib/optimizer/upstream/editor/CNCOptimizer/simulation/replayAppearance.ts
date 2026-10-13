import * as THREE from 'three';
import { materialSwatches, countertopSwatches } from '@/lib/optimizer/upstream/editor/shared/controls/styling/materialData';
import { textureTileMmFor } from '@/lib/optimizer/upstream/editor/shared/utils/materialConstants';
import type { MachiningProgram, ReplayStock } from './program';

/**
 * 재생 판재 겉면의 모습 — 실제 설계 재질을 그대로 빌려 온다(송강 배정 2026-09-28: 재단·가공 시뮬레이션 시각 품질).
 *
 * - 옵티마이저 판재의 textureName 은 가구 설계 재질 선택창의 이름이다(panelTextureNames). 같은 이름의 견본에서
 *   대표 색과 그림 경로를 찾는다. panel.color 는 'MW' 같은 코드라 색으로 쓰지 않는다.
 * - 그림은 실물 타일 크기가 등록된 것(TEXTURE_TILE_MM — 오크 781mm 등)만 입힌다. 가구 설계가 판재에 입히는 규칙과 같다.
 *   등록이 없는 그림은 크기를 지어내지 않고 견본 대표 색만 쓴다.
 * - 원장·재단 조각·잔재에는 빌려올 패널이 없다. 같은 원장에서 나온 패널이 모두 한 재질이면 그 재질을 쓴다.
 * - 아무 정보가 없으면 null — 부르는 쪽은 종전 표시색(stock.color)을 그대로 쓴다.
 * 제조 치수·가공 좌표·순서는 읽기만 한다.
 */
export interface StockLook {
  /** 겉면 색(그림이 있으면 그림에 곱하는 색) */
  color: string;
  /** 실물 타일 그림 — 원장 좌표 mm 기준으로 입힌다 */
  texture?: { url: string; tileMm: number };
  /** 재질 이름(표시·시험용) */
  name: string;
}

const swatches = [...materialSwatches, ...countertopSwatches];
const textureNameOf = (stock: ReplayStock) => (stock.panel as { textureName?: string } | undefined)?.textureName;

function lookFor(textureName: string | undefined): StockLook | null {
  if (!textureName) return null;
  const swatch = swatches.find(s => s.name === textureName);
  if (!swatch) return null;
  const tileMm = swatch.image ? textureTileMmFor(swatch.image) : null;
  return tileMm && swatch.image
    ? { name: swatch.name, color: '#ffffff', texture: { url: swatch.image, tileMm } }
    : { name: swatch.name, color: swatch.color };
}

/** 판재별 겉면 모습. 원장·조각·잔재는 원장 패널이 모두 같은 재질일 때만 그 재질을 받는다 */
export function stockLooks(program: MachiningProgram): Map<string, StockLook | null> {
  const names = new Set(program.stocks.map(textureNameOf).filter((n): n is string => !!n));
  const sheet = names.size === 1 ? lookFor([...names][0]) : null;
  return new Map(program.stocks.map(stock => [stock.id, stock.panel ? lookFor(textureNameOf(stock)) ?? sheet : sheet]));
}

const textureCache = new Map<string, THREE.Texture>();
/** 같은 그림은 한 번만 읽는다. 결(그림의 긴 쪽)은 원장 Y(길이) 방향 — 그림 비율은 읽은 뒤 repeat 로 맞춘다 */
export function lookTexture(url: string): THREE.Texture {
  const cached = textureCache.get(url);
  if (cached) return cached;
  const texture = new THREE.TextureLoader().load(url, t => {
    const image = t.image as { width?: number; height?: number } | undefined;
    if (image?.width && image?.height) t.repeat.set(1, image.width / image.height);
    t.needsUpdate = true;
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache.set(url, texture);
  return texture;
}

/**
 * 절삭 형상의 겉면에 원장 좌표 mm 기준 UV 를 준다(u = X/타일, v = Y/타일). 면이 보는 축에 따라 투영면을 고른다 —
 * 윗·아랫면은 XY, 옆면은 XZ·YZ. 면마다 UV 가 달라야 하므로 꼭짓점을 나눈 복사본을 돌려준다(입력은 해제하지 않는다).
 * origin 은 판재 로컬 → 원장 좌표 이동(stock.sourceOrigin). 가공 형상·치수는 바꾸지 않는다.
 */
export function sheetUv(geometry: THREE.BufferGeometry, tileMm: number, origin: [number, number, number] = [0, 0, 0]): THREE.BufferGeometry {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const p = g.getAttribute('position'), uv = new Float32Array(p.count * 2);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i + 2 < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(c, b).cross(b.clone().sub(a)).set(Math.abs(n.x), Math.abs(n.y), Math.abs(n.z));
    for (let k = 0; k < 3; k++) {
      const x = p.getX(i + k) + origin[0], y = p.getY(i + k) + origin[1], z = p.getZ(i + k) + origin[2];
      const [u, v] = n.z >= n.x && n.z >= n.y ? [x, y] : n.x >= n.y ? [z, y] : [x, z];
      uv[(i + k) * 2] = u / tileMm; uv[(i + k) * 2 + 1] = v / tileMm;
    }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
