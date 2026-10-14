'use client';

import { createContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Group, Matrix4, Quaternion, Vector3 } from 'three';
import { assemblyPlayback, playbackTiming } from './cinematic';
import { useDisplayStore } from './displayStore';
import { partProgress, samplePart, type AssemblyPlan, type Vec3 } from './assemblyPlan';

export const AssemblyContext = createContext<Map<string, Group> | null>(null);

export function AssemblySequence({ plan, enabled, children }: { plan: AssemblyPlan; enabled: boolean; children: ReactNode }) {
  const groups = useMemo(() => new Map<string, Group>(), []);
  const clock = useRef({ id: -1, elapsed: 0, reported: -1, cinematic: false });
  const floorRotation = useMemo(() => new Quaternion(), []);
  const identity = useMemo(() => new Quaternion(), []);
  const euler = useMemo(() => new Euler(), []);
  const focus = useMemo(() => new Vector3(), []);
  const rotation = useMemo(() => new Matrix4(), []);
  const layout = useMemo(() => {
    const minX = Math.min(...plan.parts.map(p => p.floor[0] - p.footprint[0] / 2));
    const maxX = Math.max(...plan.parts.map(p => p.floor[0] + p.footprint[0] / 2));
    const minZ = Math.min(...plan.parts.map(p => p.floor[2] - p.footprint[1] / 2));
    const maxZ = Math.max(...plan.parts.map(p => p.floor[2] + p.footprint[1] / 2));
    const height = Math.max(10, ...plan.parts.map(p => p.floor[1] * 2 + 2));
    return plan.parts.length ? { width: maxX - minX, height, depth: maxZ - minZ,
      center: [(maxX + minX) / 2, height / 2, (maxZ + minZ) / 2] as Vec3 } : plan.bounds;
  }, [plan]);

  useLayoutEffect(() => {
    if (!enabled) return;
    useDisplayStore.getState().resetAssembly();
    useDisplayStore.setState({ stageBounds: plan.bounds });
    return () => { assemblyPlayback.active=false; useDisplayStore.getState().resetAssembly(); };
  }, [enabled, plan]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const state = useDisplayStore.getState();
    if (clock.current.id !== state.playbackId) clock.current = { id: state.playbackId, elapsed: 0, reported: -1, cinematic: state.cinematic };
    const moving = state.phase === 'assembling' || state.phase === 'disassembling';
    if (moving && !state.paused) clock.current.elapsed += Math.min(delta, 0.05) * state.speed;
    assemblyPlayback.active=moving;
    const timing = playbackTiming(plan, state.phase, clock.current.cinematic, clock.current.elapsed);
    const shotStage = state.phase === 'disassembling' ? plan.stages.length - 1 - timing.shotStage : timing.shotStage;
    let label = state.phase === 'laidOut' ? '부품 정렬 완료 · 조립을 눌러 시작하세요' : '조립 완료';
    for (const part of plan.parts) {
      const group = groups.get(part.id);
      if (!group) continue;
      const progress = partProgress(part, plan, state.phase, timing.partTime, timing.disassemblyInterval);
      const pose = samplePart(part, progress);
      group.position.set(...pose.position);
      floorRotation.setFromEuler(euler.set(...part.rotation));
      group.quaternion.copy(floorRotation).slerp(identity, pose.rotationProgress);
      if (part.stage === shotStage && moving) {
        label = state.phase === 'assembling' ? part.label : `${part.label.replace(/체결|설치|놓기|세우기/g, '').trim()} · 분리`;
        // World position includes the existing furniture-base offset; framing follows the actual carry.
        group.getWorldPosition(focus);
        assemblyPlayback.focus[0] = focus.x;
        assemblyPlayback.focus[1] = focus.y;
        assemblyPlayback.focus[2] = focus.z;
        const size = part.size ?? [part.footprint[0], 40, part.footprint[1]];
        const m = rotation.makeRotationFromQuaternion(group.quaternion).elements;
        for (let axis = 0; axis < 3; axis++) {
          assemblyPlayback.extent[axis] = Math.abs(m[axis]) * size[0] + Math.abs(m[axis + 4]) * size[1] + Math.abs(m[axis + 8]) * size[2];
        }
        assemblyPlayback.kind=part.kind ?? 'upright';
        assemblyPlayback.beat=progress;
      }
    }
    if (!moving) return;
    assemblyPlayback.phase = state.phase;
    assemblyPlayback.layout = layout;
    assemblyPlayback.elapsed=clock.current.elapsed;assemblyPlayback.duration=timing.baseDuration;
    assemblyPlayback.outro=timing.outro;
    if(clock.current.elapsed>=timing.baseDuration) label=state.phase==='assembling'?'완성된 가구':'펼쳐진 부품 전체 보기';
    if (clock.current.elapsed - clock.current.reported > 0.1) {
      clock.current.reported = clock.current.elapsed;
      useDisplayStore.setState({ progress: Math.min(clock.current.elapsed / timing.duration, 1), stageLabel: label === '조립 완료' ? '다음 부품 준비' : label });
    }
    if (clock.current.elapsed >= timing.duration) {
      if (state.phase === 'disassembling' && state.autoAssemble) {
        useDisplayStore.setState({ phase: 'assembling', playbackId: state.playbackId + 1, progress: 0, stageLabel: '조립 시작' });
      } else {
        const assembled = state.phase === 'assembling';
        useDisplayStore.setState({ phase: assembled ? 'assembled' : 'laidOut', exploded: !assembled, progress: 1, paused: false, stageLabel: assembled ? '조립 완료' : '부품 정렬 완료 · 조립을 눌러 시작하세요' });
      }
    }
  }, -2);

  return <AssemblyContext.Provider value={enabled ? groups : null}>{children}</AssemblyContext.Provider>;
}
