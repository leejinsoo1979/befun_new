'use client';

import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { moventoCadPose } from '@/lib/three/blum/moventoPlacement';
type MoventoCadLength = 350;
import { MOVENTO_MEMBER_PROFILES, MOVENTO_MEMBER_Z, type MoventoMember } from '@/lib/three/blum/moventoMembers';

const cache = new Map<string, Promise<THREE.Group>>();
function load(url: string) {
  if (!cache.has(url)) cache.set(url, new GLTFLoader().loadAsync(url).then(gltf => gltf.scene).catch(error => {
    cache.delete(url); throw error;
  }));
  return cache.get(url)!;
}

/**
 * 공식 CAD 앞쪽 브래킷(z > 1) 가운데 몸통 레일 쪽 — 옆판에 붙는 세로판·바닥판·앞 걸이. 나머지 앞 끝 부품(|x| 21.5~28.5)은 서랍 레일.
 * 공식 CAD 는 세 부재가 한 메시로 붙어 있어(정점 11,070 중 10,708 한 덩어리) 몸통·가운데·서랍 레일의 긴 몸통은
 * 블럼 설계 DXF 단면으로 새로 만들고(moventoMembers), 앞 브래킷만 원본 면을 쓴다.
 */
const isCabinetFront = (x: number, z: number) => z > 1 && !(Math.abs(x) > 21.5 && Math.abs(x) < 28.5);

const memberCache = new Map<string, Promise<THREE.Group>>();
/** 한 부재 모델 — 원본 앞 브래킷(해당 부재 몫) + DXF 단면을 길이만큼 뽑은 몸통. 원본과 같은 좌표계(부모 노드)에 붙인다 */
function loadMember(url: string, member: MoventoMember, nominalLengthMm: MoventoCadLength, hand: 'left' | 'right') {
  const key = `${url}#${member}`;
  if (!memberCache.has(key)) memberCache.set(key, load(url).then(source => {
    const copy = source.clone(true);
    const meshes: THREE.Mesh[] = [];
    copy.traverse(child => { if (child instanceof THREE.Mesh) meshes.push(child); });
    const largest = Math.max(...meshes.map(m => m.geometry.getAttribute('position').count));
    const body = meshes.filter(m => m.geometry.getAttribute('position').count >= largest * .5);
    for (const mesh of meshes) {
      const isBody = body.includes(mesh);
      // 옆 부품(작은 별도 메시)은 서랍 레일에 붙어 함께 나온다
      if (!isBody) { mesh.visible = member === 'runner'; continue; }
      if (member === 'intermediate') { mesh.visible = false; continue; }
      const geometry = mesh.geometry, pos = geometry.getAttribute('position'), index = geometry.index;
      const keep: number[] = [];
      const count = index ? index.count : pos.count;
      for (let t = 0; t + 2 < count; t += 3) {
        const v = [0, 1, 2].map(k => index ? index.getX(t + k) : t + k);
        const cx = (pos.getX(v[0]) + pos.getX(v[1]) + pos.getX(v[2])) / 3, cz = (pos.getZ(v[0]) + pos.getZ(v[1]) + pos.getZ(v[2])) / 3;
        if (cz <= 1) continue;   // 긴 몸통은 아래에서 단면으로 새로 만든다
        if (isCabinetFront(cx, cz) === (member === 'cabinet')) keep.push(...v);
      }
      const next = geometry.clone(); next.setIndex(keep); next.clearGroups(); mesh.geometry = next;
    }
    const anchor = body[0];
    if (anchor?.parent) {
      const material = (Array.isArray(anchor.material) ? anchor.material[0] : anchor.material) as THREE.Material;
      const [z0, z1] = MOVENTO_MEMBER_Z[nominalLengthMm][member];
      const sign = hand === 'left' ? 1 : -1;
      MOVENTO_MEMBER_PROFILES[member].forEach((profile, i) => {
        const shape = new THREE.Shape(profile.map(([x, y]) => new THREE.Vector2(sign * x, y)));
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false, curveSegments: 4 });
        geometry.translate(0, 0, z0);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `MOVENTO ${member} 단면 ${i + 1}`;
        mesh.position.copy(anchor.position); mesh.quaternion.copy(anchor.quaternion); mesh.scale.copy(anchor.scale);
        anchor.parent!.add(mesh);
      });
    }
    return copy;
  }).catch(error => { memberCache.delete(key); throw error; }));
  return memberCache.get(key)!;
}

const MEMBER_LABEL: Record<MoventoMember, string> = { cabinet: '몸통 레일', intermediate: '가운데 레일', runner: '서랍 레일' };

/**
 * MOVENTO 760H 레일·잠금부품. 좌우 별도 공식 원본, 미터→앱 단위 외에 모델 축척·미러·중심 재정렬을 하지 않는다.
 * member: 레일 한 부재만 — 'cabinet' 은 몸통 고정 자리, 'intermediate' 는 서랍 이동의 절반, 'runner' 는 서랍과 같이 움직이는 묶음에 둔다
 * (마마 지시 2026-09-28 「서랍과 같이 나와야 하는 레일은 그 자리에 그대로 있네」). 없으면 세 부재를 닫힌 자세로 모두 그린다.
 */
export default function MoventoDrawerCad({ nominalLengthMm, cabinetInnerWidthMm, bottomUnderMm, frontMm, locking = false, member }: {
  nominalLengthMm: MoventoCadLength; cabinetInnerWidthMm: number; bottomUnderMm: number; frontMm: number; locking?: boolean; member?: MoventoMember;
}) {
  const folder = locking ? 'locking' : String(nominalLengthMm);
  const members: (MoventoMember | null)[] = locking ? [null] : member ? [member] : ['cabinet', 'intermediate', 'runner'];
  const loadKey = `${folder}#${members.join(',')}`;
  const [loaded, setLoaded] = useState<{ key: string; models: { hand: 'left' | 'right'; member: MoventoMember | null; model: THREE.Group }[] }>();
  useEffect(() => {
    let active = true;
    const jobs = (['left', 'right'] as const).flatMap(hand => members.map(m => {
      const url = `/models/blum/movento/${folder}/${hand}/model.glb`;
      return (m ? loadMember(url, m, nominalLengthMm, hand) : load(url)).then(source => ({ hand, member: m, source }));
    }));
    Promise.all(jobs).then(results => {
      if (!active) return;
      setLoaded({ key: loadKey, models: results.map(({ hand, member: m, source }) => {
        const model = source.clone(true);
        model.traverse(child => { if (child instanceof THREE.Mesh) child.raycast = () => {}; });
        return { hand, member: m, model };
      }) });
    }).catch(error => { if (active) console.error('MOVENTO 공식 CAD를 불러오지 못했습니다.', error); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);
  if (loaded?.key !== loadKey) return null;
  return <>{loaded.models.map(({ hand, member: m, model }) => {
    const pose = moventoCadPose(cabinetInnerWidthMm, bottomUnderMm, frontMm, hand);
    return <group key={`${loadKey}-${hand}-${m ?? 'all'}`} name={`MOVENTO ${locking ? '잠금부품' : m ? MEMBER_LABEL[m] : '레일'} ${hand}`}
      position={pose.position} scale={pose.scale} userData={{ movento: true, moventoMember: m ?? (locking ? 'locking' : 'all'), nominalLengthMm, sourceHand: hand,
        renderExclude: true,   /* 2D 도면(Room 평면)에는 레일·잠금부품을 그리지 않는다(마마 지시) */
        room3DOnly: true,      /* Room 3D 복사에는 남긴다 — 빠지면 Room 에서 레일이 통째로 사라진다(마마 지적 2026-09-28, 옛 레일 모델 5ca5fd5c2 와 같은 표식) */
        assemblyOnly: true, manufacturingReady: false, motion: locking || m === 'runner' ? 'drawer-translation' : m === 'intermediate' ? 'drawer-half-translation' : 'closed-source-pose' }}>
      <primitive object={model} dispose={null} />
    </group>;
  })}</>;
}
