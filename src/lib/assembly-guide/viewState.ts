import type { GuideTopic } from './sequence';
import type { JointAction } from './disassembly';

export type PanelView = 'auto' | 'solid' | 'transparent';

export function panelInside(topic: GuideTopic, step: number, action: JointAction, choice: PanelView) {
  if (topic === 'legs') return false;
  if (choice !== 'auto') return choice === 'transparent';
  return topic === 'connector' ? action === 'disassemble' ? step === 1 || step === 2 : step >= 3 && step <= 6
    : topic === 'tylko-clip' ? step < 4 : step >= 3 && step <= 5;
}
