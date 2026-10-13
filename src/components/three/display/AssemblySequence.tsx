'use client';

import { createContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Group, Quaternion } from 'three';
import { assemblyPlayback, CINEMATIC_OUTRO, CINEMATIC_HOLD, cinematicAssemblyTime } from './cinematic';
import { useDisplayStore } from './displayStore';
import { partProgress, samplePart, type AssemblyPlan } from './assemblyPlan';

export const AssemblyContext = createContext<Map<string, Group> | null>(null);

export function AssemblySequence({ plan, enabled, children }: { plan: AssemblyPlan; enabled: boolean; children: ReactNode }) {
  const groups = useMemo(() => new Map<string, Group>(), []);
  const clock = useRef({ id: -1, elapsed: 0, reported: -1, cinematic: false });
  const floorRotation = useMemo(() => new Quaternion(), []);
  const identity = useMemo(() => new Quaternion(), []);
  const euler = useMemo(() => new Euler(), []);

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
    const paced=state.phase==='assembling' && clock.current.cinematic;
    const partTime=paced?cinematicAssemblyTime(clock.current.elapsed,plan.stages.length):clock.current.elapsed;
    let focusCount=0, focusX=0, focusY=0, focusZ=0;
    let label = state.phase === 'laidOut' ? '부품 정렬 완료 · 조립을 눌러 시작하세요' : '조립 완료';
    for (const part of plan.parts) {
      const group = groups.get(part.id);
      if (!group) continue;
      const progress = partProgress(part, plan, state.phase, partTime);
      const pose = samplePart(part, progress);
      group.position.set(...pose.position);
      floorRotation.setFromEuler(euler.set(...part.rotation));
      group.quaternion.copy(floorRotation).slerp(identity, pose.rotationProgress);
      if (progress > 0 && progress < 1) {
        label = state.phase === 'assembling' ? part.label : '부품을 바닥에 정렬하는 중';
        focusCount++;
        // Follow the arriving board without dragging the camera all the way to the staging area.
        const carry = Math.sin(Math.PI*progress)*.18;
        focusX+=part.anchor[0]+(pose.position[0]-part.anchor[0])*carry;
        focusY+=part.anchor[1]+(pose.position[1]-part.anchor[1])*carry;
        focusZ+=part.anchor[2]+(pose.position[2]-part.anchor[2])*carry;
        assemblyPlayback.kind=part.kind ?? 'upright';
        assemblyPlayback.beat=progress;
      }
    }
    if (!moving) return;
    const baseDuration = state.phase === 'assembling' ? plan.assemblyDuration+(paced?Math.max(0,plan.stages.length-1)*CINEMATIC_HOLD:0) : plan.disassemblyDuration;
    const ending = state.phase === 'assembling' && clock.current.cinematic;
    const duration=baseDuration+(ending?CINEMATIC_OUTRO:0);
    assemblyPlayback.elapsed=clock.current.elapsed;assemblyPlayback.duration=baseDuration;
    assemblyPlayback.outro=ending?Math.max(0,(clock.current.elapsed-baseDuration)/CINEMATIC_OUTRO):0;
    if(focusCount) assemblyPlayback.focus=[focusX/focusCount,focusY/focusCount,focusZ/focusCount];
    if(ending && clock.current.elapsed>=baseDuration) label='완성된 가구';
    if (clock.current.elapsed - clock.current.reported > 0.1) {
      clock.current.reported = clock.current.elapsed;
      useDisplayStore.setState({ progress: Math.min(clock.current.elapsed / duration, 1), stageLabel: label === '조립 완료' ? '다음 부품 준비' : label });
    }
    if (clock.current.elapsed >= duration) {
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
