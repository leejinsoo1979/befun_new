'use client';

import { useMemo, useEffect, Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

// 룸 색상 — 무채색 라이트그레이 벽 + 한 톤 낮은 바닥 (albedo 값, 노란 기 없이 중성 유지)
const WALL_COLOR = '#d9d9d9';
const FLOOR_COLOR = '#bababa';

interface BackgroundProps {
  shelfWidth: number;
  shelfDepth: number;
}

/**
 * 접지 그림자 데칼 — 선반 바로 아래 바닥에 깔리는 부드러운 그림자 텍스처.
 * 선반 발판 영역을 캔버스에 블러로 그려 평면에 입힌다. (선반은 z=0~depth)
 */
const CONTACT_MARGIN = 14; // cm, 선반 밖으로 번지는 범위

export function ContactShadowDecal({ shelfWidth, shelfDepth }: BackgroundProps) {
  const planeW = shelfWidth + CONTACT_MARGIN * 2;
  const planeD = shelfDepth + CONTACT_MARGIN * 2;

  const texture = useMemo(() => {
    const pxPerCm = 4;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(planeW * pxPerCm);
    canvas.height = Math.ceil(planeD * pxPerCm);
    const ctx = canvas.getContext('2d')!;
    // 사각형을 캔버스 밖에 그리고 그림자만 안쪽으로 오프셋 → 블러된 발판 그림자만 남김
    const off = canvas.width + 100;
    ctx.shadowColor = 'rgba(0,0,0,1)';
    ctx.shadowBlur = CONTACT_MARGIN * pxPerCm * 0.9;
    ctx.shadowOffsetX = off;
    ctx.fillStyle = '#000';
    const inset = (CONTACT_MARGIN - 2) * pxPerCm;
    ctx.fillRect(inset - off, inset, canvas.width - inset * 2, canvas.height - inset * 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [planeW, planeD]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, shelfDepth / 2]} renderOrder={1}>
      <planeGeometry args={[planeW, planeD]} />
      <meshBasicMaterial map={texture} transparent opacity={0.45} depthWrite={false} color="#000000" />
    </mesh>
  );
}

function Silhouette({ shelfWidth }: { shelfWidth: number }) {
  const texture = useLoader(THREE.TextureLoader, '/imgs/bg/man.png');

  const { width: personWidth, height: personHeight, xPos } = useMemo(() => {
    const img = texture.image;
    const imgAspect = img.width / img.height;
    const h = 170;
    const w = h * imgAspect;
    const x = -(shelfWidth / 2) - w / 2 - 5;
    return { width: w, height: h, xPos: x };
  }, [texture, shelfWidth]);

  return (
    <mesh
      position={[xPos, personHeight / 2, 0.3]}
      renderOrder={1}
    >
      <planeGeometry args={[personWidth, personHeight]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={1}
        color="#d4d4d4"
        depthWrite={false}
      />
    </mesh>
  );
}

export function Background({ shelfWidth, shelfDepth }: BackgroundProps) {
  const roomWidth = 4000;
  const floorDepth = 2000;
  const wallHeight = 800;

  return (
    <group>
      {/* 바닥: 선반은 z=0(벽)~depth에 놓인다 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, floorDepth / 2]} receiveShadow userData={{ excludeFromAO: true }}>
        <planeGeometry args={[roomWidth, floorDepth]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.95} metalness={0} />
      </mesh>

      {/* 뒷벽: 선반 그림자가 벽에 떨어져 공간감을 만든다 */}
      <mesh position={[0, wallHeight / 2, 0]} receiveShadow userData={{ excludeFromAO: true }}>
        <planeGeometry args={[roomWidth, wallHeight]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.95} metalness={0} />
      </mesh>

      <ContactShadowDecal shelfWidth={shelfWidth} shelfDepth={shelfDepth} />

      {/* 사람 실루엣 - 로딩 실패 시 생략 */}
      <Suspense fallback={null}>
        <Silhouette shelfWidth={shelfWidth} />
      </Suspense>
    </group>
  );
}
