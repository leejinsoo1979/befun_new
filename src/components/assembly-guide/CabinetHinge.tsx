'use client';

import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import { BlumCup } from '@/components/three/blum/BlumHardware';
import type { CabinetPart, CabinetState, CabinetVector } from '@/lib/assembly-guide/cabinet';
import { cabinetDoorDisplay, cabinetHingePress } from '@/lib/assembly-guide/cabinetDoor';
import styles from './cabinet.module.css';

/** Same shared hinge geometry. Free hinges retain a rigid open stance during transport. */
export function CabinetHinge({ center, platePoint, pivot, sign, order, part, state, opening, preview }: {
  center: CabinetVector; platePoint: CabinetVector; pivot: CabinetVector; sign: number; order: number;
  part: CabinetPart; state: RefObject<CabinetState>; opening: RefObject<Group | null>; preview: boolean;
}) {
  const pose = useMemo(() => new Group(), []), proxy = useRef<Group>(pose);
  const endpoint = useMemo(() => [...platePoint] as CabinetVector, [platePoint]);
  const endpointRef = useRef(endpoint);
  const label = useRef<HTMLSpanElement>(null);
  const cue = useRef<Group>(null);
  const vectors = useMemo(() => ({ point: new Vector3(), axis: new Vector3(0, 1, 0) }), []);
  useFrame(() => {
    const value = state.current, press = cabinetHingePress(value, order, part, preview);
    const installed = preview || value.phase === 'complete' || value.phase === 'reveal' || part.number - 1 < value.step || part.number - 1 === value.step && ['hinge-test', 'check'].includes(value.phase);
    proxy.current.rotation.y = installed ? opening.current?.rotation.y ?? 0 : -sign * cabinetDoorDisplay.angle;
    endpointRef.current = endpoint;
    endpointRef.current[0] = platePoint[0] + sign * cabinetDoorDisplay.clipLift * (1 - press);
    vectors.point.set(endpointRef.current[0] - pivot[0], endpointRef.current[1] - pivot[1], endpointRef.current[2] - pivot[2]).applyAxisAngle(vectors.axis, -proxy.current.rotation.y);
    cue.current?.position.set(vectors.point.x + pivot[0], vectors.point.y + pivot[1] + 3.5, vectors.point.z + pivot[2]);
    if (label.current) {
      const active = part.number - 1 === value.step;
      label.current.hidden = preview || !active || !(value.phase === 'hinge-hook' && order === 0 || value.phase === (order === 0 ? 'hinge-top' : 'hinge-bottom'));
      label.current.textContent = value.phase === 'hinge-hook' ? '앞부분 먼저 걸기' : press >= 1 ? '딸깍 · 잠김' : '뒤쪽을 눌러 잠그기';
    }
  }, -.2);
  return <>
    <BlumCup center={center} inwardSign={sign} platePoint={endpoint} pivot={pivot} opening={proxy} />
    <group ref={cue}><Html center zIndexRange={[2, 0]}>
      <span ref={label} hidden className={styles.hingeCue} />
    </Html></group>
  </>;
}
