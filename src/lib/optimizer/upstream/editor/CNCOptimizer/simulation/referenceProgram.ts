import type { MachiningProgram } from './program';

/**
 * 중간 점검용 4×8 원장. CNCOptimizerPro의 1220×2440 규격을
 * 긴 변 X / 짧은 변 Y로 배치한다. 공구·시간·공정은 시험용이며 공장 순서가 아니다.
 */
export const referenceProgram: MachiningProgram = {
  units: 'mm',
  source: { label: '4×8 원장 · 시험 순서', machineModel: '가공 형상 검증 작업대', verifiedSequence: false },
  stocks: [{ id: 'QA', name: '4×8 원장', size: [2440, 1220, 18], position: [0, 0, 0], color: '#b9c9d4' }],
  tools: [
    { id: 'saw', kind: 'saw', diameter: 180, kerf: 5, teeth: 48, rpm: 3000, appearance: { boreDiameter: 30, gulletDepth: 5 } },
    { id: 'bit', kind: 'drill', diameter: 35, length: 90, tipLength: 0, rpm: 6000,
      appearance: { cuttingLength: 55, shankDiameter: 35, coreDiameter: 18, flutes: 2, helixAngleDeg: 30, fluteOpeningDeg: 120 } },
  ],
  steps: [
    { id: 'approach', kind: 'travel', stockId: 'QA', toolId: 'saw', label: '톱 이동', from: [-120, 500, -20], to: [-100, 500, -20], direction: [0, -1, 0], durationMs: 1000 },
    { id: 'cut', kind: 'saw', stockId: 'QA', toolId: 'saw', label: '원장 길이 2,440mm 관통 재단', from: [-100, 500, -20], to: [2540, 500, -20], durationMs: 12000 },
    { id: 'move', kind: 'travel', stockId: 'QA', toolId: 'bit', label: '가공 헤드 이동', from: [2000, 250, 160], to: [1600, 250, 18], direction: [0, 0, -1], durationMs: 2000 },
    { id: 'bore', kind: 'drill', stockId: 'QA', toolId: 'bit', label: '보링 · 깊이 13mm', surface: [1600, 250, 18], direction: [0, 0, -1], depth: 13, durationMs: 4000 },
    { id: 'retract', kind: 'travel', stockId: 'QA', toolId: 'bit', label: '비트 상승', from: [1600, 250, 5], to: [1600, 250, 150], direction: [0, 0, -1], durationMs: 1800 },
    { id: 'move2', kind: 'travel', stockId: 'QA', toolId: 'bit', label: '다음 보링 위치로 이동', from: [1600, 250, 150], to: [1000, 250, 18], direction: [0, 0, -1], durationMs: 1800 },
    { id: 'bore2', kind: 'drill', stockId: 'QA', toolId: 'bit', label: '두 번째 보링 · 깊이 13mm', surface: [1000, 250, 18], direction: [0, 0, -1], depth: 13, durationMs: 4000 },
    { id: 'retract2', kind: 'travel', stockId: 'QA', toolId: 'bit', label: '가공 헤드 복귀', from: [1000, 250, 5], to: [1000, 250, 150], direction: [0, 0, -1], durationMs: 1800 },
  ],
};
