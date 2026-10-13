'use client';

import { useCallback, useContext, type ReactNode } from 'react';
import type { Group } from 'three';
import { AssemblyContext } from './AssemblySequence';
import type { AssemblyPartPlan } from './assemblyPlan';

export function ExplodedPart({ part, children }: { part: AssemblyPartPlan; children: ReactNode }) {
  const groups = useContext(AssemblyContext);
  const register = useCallback((group: Group | null) => {
    if (group) groups?.set(part.id, group);
    else groups?.delete(part.id);
  }, [groups, part.id]);
  return <group ref={register} position={part.anchor} userData={{ displayExplodedPart: true, assembledPosition: part.anchor }}>
    <group position={[-part.anchor[0], -part.anchor[1], -part.anchor[2]]}>{children}</group>
  </group>;
}
