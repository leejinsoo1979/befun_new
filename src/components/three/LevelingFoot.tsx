'use client';

/**
 * 조절발 1개: 지름 25mm, 기본 높이 10mm. 캡처된 캐비넷은 바닥판 하단까지 연결.
 */
export function LevelingFoot({ position, height = 1 }: { position: [number, number, number]; height?: number }) {
  const radius = 1.25; // 지름 25mm / 2

  return (
    <group position={position}>
      {/* position은 바닥 접점이며 위쪽으로 바닥판까지 연결 */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius * 1.08, height, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* 윗부분: 살짝 볼록한 캡 */}
      <mesh position={[0, height + 0.05, 0]}>
        <cylinderGeometry args={[radius * 0.95, radius, 0.15, 16]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* 드라이버 홈 */}
      <mesh position={[0, height + 0.13, 0]}>
        <boxGeometry args={[radius * 0.8, 0.06, 0.15]} />
        <meshStandardMaterial color="#111" roughness={0.8} metalness={0} />
      </mesh>
    </group>
  );
}

