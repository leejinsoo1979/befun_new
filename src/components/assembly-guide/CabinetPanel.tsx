'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, DoubleSide, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import type { RefObject } from 'react';
import { OvvoPH, OvvoPC } from '@/components/three/furniture-hardware/ovvo/OvvoParts';
import { BlumCup, BlumPlate } from '@/components/three/blum/BlumHardware';
import { cabinetPinExtension, createCabinetPanelGeometry, type CabinetPart, type CabinetPlan, type CabinetState } from '@/lib/assembly-guide/cabinet';
import { GuidePanel } from './GuidePanel';
import { usePanelMaterials } from './usePanelMaterials';
import { SpringDowel } from './SpringDowel';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function RearDowel({ x, part, state, inside, preview }: { x: number; part: CabinetPart; state: RefObject<CabinetState>; inside: boolean; preview: boolean }) {
  const extension = useRef<Group>(null), springRoot = useRef<Group>(null);
  useFrame(() => {
    const distance = cabinetPinExtension(part, state.current, preview);
    extension.current?.position.setY(distance);
    springRoot.current?.traverse(object => { if (object.name === 'example-spring') object.scale.y = .3 + distance / 5 * .7; });
  });
  return <group position={[x, 0, 0]}>
    <mesh position={[0, -part.box.h * 5 - 2.5, 0]}><cylinderGeometry args={[1.5, 1.5, 5, 24]} /><meshStandardMaterial color="#b8c1bd" metalness={.7} roughness={.3} /></mesh>
    <group ref={springRoot} position={[0, part.box.h * 5, 0]}><SpringDowel extension={extension} inside={inside} housingColor="#89929a" /></group>
  </group>;
}

function CabinetHandle({ part, plan, finish }: { part: CabinetPart; plan: CabinetPlan; finish: string }) {
  const gltf = useGLTF('/models/handle_door.glb');
  const materials = usePanelMaterials(2, false, .08, finish);
  const source = plan.model.doors[Number(part.animation.id.slice(5))];
  const handle = source?.reference?.handle;
  const clone = useMemo(() => {
    const value = gltf.scene.clone();
    value.traverse(object => { if (object instanceof Mesh) object.material = materials.laminate; });
    value.rotation.y = Math.PI;
    value.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(value), center = bounds.getCenter(new Vector3());
    value.position.sub(new Vector3(center.x, bounds.max.y - .05, center.z));
    return value;
  }, [gltf.scene, materials.laminate]);
  if (!handle) return null;
  return <group position={[(handle.x - source.pivotOffsetX) * 10, (handle.y - (source.reference?.frontOffsetY ?? 0)) * 10, handle.z * 10]} scale={10} dispose={null}>
    <primitive object={clone} dispose={null} />
  </group>;
}

/** Uses the shared CNC result in memory. No machining, order or settings data is saved. */
export function CabinetPanel({ part, plan, inside, finish, state, preview, doorOpen }: {
  part: CabinetPart; plan: CabinetPlan; inside: boolean; finish: string;
  state: RefObject<CabinetState>; preview: boolean; doorOpen: boolean;
}) {
  const box = part.box;
  const geometry = useMemo(() => createCabinetPanelGeometry(part), [part]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  const materials = useMemo(() => ({
    housing: new MeshStandardMaterial({ color: '#b9bec6', roughness: .3, side: DoubleSide, transparent: inside, opacity: inside ? .55 : 1, depthWrite: !inside }),
    connector: new MeshStandardMaterial({ color: '#22262c', roughness: .4, side: DoubleSide }),
    feet: new MeshStandardMaterial({ color: '#1a1a1a', roughness: .6, transparent: inside, opacity: inside ? .1 : 1, depthWrite: !inside }),
  }), [inside]);
  useEffect(() => () => Object.values(materials).forEach(material => material.dispose()), [materials]);
  const hardwareRoot = useRef<Group>(null);
  const opening = useRef<Group>(null);
  const doorIndex = part.animation.id.startsWith('door-') ? Number(part.animation.id.slice(5)) : -1;
  const door = plan.model.doors[doorIndex], hinge = plan.hinges[doorIndex];
  const sign = hinge?.side === 'left' ? 1 : -1;
  const pivot: [number, number, number] = door ? [-sign * door.width * 5, -(door.reference?.frontOffsetY ?? 0) * 10, -box.d * 5] : [0, 0, 0];
  const vectors = useMemo(() => ({ normal: new Vector3() }), []);
  useFrame((_, delta) => {
    const value = state.current;
    const installed = preview || value.phase === 'complete' || value.phase === 'reveal' || part.number - 1 < value.step;
    const active = part.number - 1 === value.step;
    const preparing = active && value.phase === 'hardware';
    const hardwareProgress = installed || active && !['choose', 'hardware'].includes(value.phase) ? 1 : preparing ? value.progress : 0;
    if (hardwareRoot.current) {
      hardwareRoot.current.visible = installed || active && value.selectedId === part.id;
      hardwareRoot.current.children.forEach((node, index) => {
        const mount = part.hardware[index];
        const normal = vectors.normal.set(0, 0, 1).applyQuaternion(node.quaternion);
        const housingProgress = clamp(hardwareProgress / .55);
        node.position.set(...mount.at).addScaledVector(normal, 24 * (1 - housingProgress));
        const connector = node.children.find(child => child.name === 'cabinet-central-connector');
        if (connector) {
          connector.position.set(0, 0, 30 * (1 - clamp((hardwareProgress - .55) / .45)) - 24 * (1 - housingProgress));
        }
      });
    }
    if (opening.current) {
      const angle = doorOpen && (installed || value.phase === 'check') ? door?.reference?.openAngle ?? Math.PI / 2 : 0;
      if (value.automatic) {
        const p = clamp(value.progress / .6), blend = p * p * (3 - 2 * p);
        opening.current.rotation.y = angle * (value.phase === 'reveal' ? blend : 1);
      } else opening.current.rotation.y += (angle - opening.current.rotation.y) * (1 - Math.exp(-delta * 9));
    }
  });
  const body = <>
    <GuidePanel source={geometry} size={[box.w * 10, box.h * 10, box.d * 10]} axis={box.frame.n} inside={inside} finish={finish} mdfCuts />
    {part.pinCenters.map(x => <RearDowel key={x} x={x} part={part} state={state} inside={inside} preview={preview} />)}
    <group ref={hardwareRoot}>
      {part.hardware.map(mount => <group key={mount.id} position={mount.at} quaternion={mount.quaternion}>
        <OvvoPH material={materials.housing} />
        {mount.role === 'end' && <group name="cabinet-central-connector" quaternion={[1, 0, 0, 0]}><OvvoPC material={materials.connector} /></group>}
      </group>)}
    </group>
    {part.feet && plan.feet.map((at, index) => <mesh key={index} position={[(at[0] - box.x) * 10, -box.h * 5 - 5, (at[2] - box.z) * 10]} material={materials.feet} castShadow={!inside}>
      {/* Same fixed 25mm/10mm pad envelope as the existing Befun LevelingFeet renderer. */}
      <cylinderGeometry args={[12.5, 13.5, 10, 16]} />
    </mesh>)}
    {!door && <group position={[-box.x * 10, -box.y * 10, -box.z * 10]} scale={10}>
      {plan.hinges.flatMap(value => value.mounts).filter(mount => plan.model.panels[mount.panelIndex] === plan.model.panels[Number(part.animation.id.slice(6))]).map((mount, index) => <BlumPlate key={index} mount={mount} />)}
    </group>}
    {door && <>
      <CabinetHandle part={part} plan={plan} finish={finish} />
      <group scale={10}>
        {hinge?.cups.map((center, index) => {
          const mount = hinge.mounts[index];
          return <BlumCup key={index} center={center.map(value => value / 10) as [number, number, number]} inwardSign={sign}
            platePoint={[mount.position[0] - box.x + sign * .85, mount.position[1] - box.y, mount.position[2] - box.z]}
            pivot={pivot.map(value => value / 10) as [number, number, number]} opening={opening} />;
        })}
      </group>
    </>}
  </>;
  return door ? <group ref={opening} position={pivot}><group position={pivot.map(value => -value) as [number, number, number]}>{body}</group></group> : body;
}
