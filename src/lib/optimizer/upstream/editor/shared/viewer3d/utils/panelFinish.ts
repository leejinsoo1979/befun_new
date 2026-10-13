import * as THREE from 'three';
import { hasVerticalSourceGrain } from '@/lib/optimizer/upstream/editor/shared/utils/materialConstants';

export type PanelEdgeRole = 'door' | 'interior';

/** 실제 재질 출처가 구분되면 우선 사용한다. 동일 재질인 경우 부재 역할로 구분한다. */
export function panelEdgeRole(material: THREE.Material, panelName = '', isEndPanel = false,
  config: { doorTexture?: string; interiorTexture?: string; doorColor?: string; interiorColor?: string } = {}): PanelEdgeRole {
  const explicit = material.userData.edgeMaterialRole;
  if (explicit === 'door' || explicit === 'interior') return explicit;
  const map = (material as THREE.MeshStandardMaterial).map;
  const image = map?.image as { currentSrc?: string; src?: string } | undefined;
  const source = image?.currentSrc || image?.src;
  const path = (url?: string) => { if (!url) return ''; try { return new URL(url, 'https://local.invalid').pathname; } catch { return url; } };
  if (source) {
    const door = path(source) === path(config.doorTexture), interior = path(source) === path(config.interiorTexture);
    if (door !== interior) return door ? 'door' : 'interior';
  }
  // 도어와 속장에 같은 이미지/색을 쓴 경우에도 EP·마이다의 역할은 바뀌지 않는다.
  if (isEndPanel || /도어|door|마이다|엔드패널|end.?panel|(?:^|[-_ ])ep(?:$|[-_ ])|목찬넬|키큰장찬넬/i.test(panelName)) return 'door';
  return 'interior';
}

/** BoxGeometry의 실제 UV 축에서 요청 결 방향으로 회전. 원본 이미지의 결도 함께 고려한다. */
export function boxGrainRotation(direction: 'horizontal' | 'vertical', source?: string): number {
  const targetIsV = direction === 'vertical';
  return targetIsV !== hasVerticalSourceGrain(source) ? Math.PI / 2 : 0;
}

/** 재단 크기는 그대로 두고, 노출 단면의 재질만 고른다. +X,-X,+Y,-Y,+Z,-Z 순서. */
export function panelEdgeFaces(size: [number, number, number], name = ''): number[] {
  const thin = size.indexOf(Math.min(...size));
  const edge = (face: number) => Math.floor(face / 2) !== thin;
  // 기본은 사방. 마마가 지정한 접합면(다른 판재로 가려지는 면)만 제외한다.
  const drawerBody = /서랍/.test(name) && !/마이다|도어|door/i.test(name);
  const drawerSide = drawerBody && /좌측|우측|측판/.test(name);
  const drawerEnd = drawerBody && /앞판|뒷판/.test(name);
  const frameOrBack = /목찬넬|top-frame|base-frame|상단몰딩|상단프레임|걸레받이|걸래받이|백패널|back[-_ ]?panel|보강대/i.test(name);
  const fixedHorizontal = !drawerBody && !/다보/.test(name) && /고정선반|옷봉선반|상판|천판|천지판|하판|지판|바닥/.test(name);
  const omitLeftRight = frameOrBack || drawerEnd || fixedHorizontal;
  return [0,1,2,3,4,5].filter(face => edge(face)
    && !(omitLeftRight && face < 2)
    && !(drawerSide && face >= 4));
}

export function panelEdgeMaterials(main: THREE.Material, size: [number,number,number], name: string, color?: string): THREE.Material | THREE.Material[] {
  const faces = panelEdgeFaces(size,name);
  if (!color || !faces.length) return main;
  const edge = new THREE.MeshStandardMaterial({color,roughness:.18,metalness:.2,side:THREE.DoubleSide});
  return Array.from({length:6},(_,i) => faces.includes(i) ? edge : main);
}

export function disposePanelEdgeMaterials(materials: THREE.Material | THREE.Material[], main: THREE.Material) {
  if (Array.isArray(materials)) new Set(materials.filter(m => m !== main)).forEach(m => m.dispose());
}
