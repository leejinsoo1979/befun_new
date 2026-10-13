import type { PanelCornerNotch } from '@/lib/optimizer/upstream/editor/CNCOptimizer/types';
import type { CuttingBoardShape } from '@/lib/optimizer/upstream/editor/CNCOptimizer/utils/cuttingBoardShape';
export type Grain = 'H' | 'V' | 'NONE';
export type Unit = 'mm' | 'cm' | 'in';

export interface GroovePosition {
  y: number;       // 홈 Y 위치 (패널 하단 기준 mm)
  height: number;  // 홈 높이 (mm)
  depth: number;   // 홈 깊이 (mm)
}

export interface BoringDepthGroup {
  y: number;
  depthPositions: number[];
  boringType?: 'fixed-panel' | 'movable-shelf';
}

export interface Panel {
  /** 디자인 화면에서 실제 적용한 텍스처/표면 재질 이름. */
  textureName?: string;
  /** 스케치에서 수정한 판재와 함께 저장된 제조 좌표. */
  manufacturingBoring?: import('@/lib/optimizer/upstream/domain/boring/types').PanelBoringData;
  /** 확정되지 않은 가공이 있어 생산 파일로 내보낼 수 없음. 승인값(true)은 계약에 없다. */
  manufacturingReady?: false;
  /** 위 표시의 사유. 사용자에게 그대로 보여 준다. */
  manufacturingBlockReasons?: string[];
  cuttingBoardShape?: CuttingBoardShape;
  id: string;
  label: string;
  width: number;   // short side
  length: number;  // long side
  thickness: number;
  quantity: number;
  material?: string;
  grain?: Grain;
  canRotate?: boolean;
  boringPositions?: number[];  // 측판 보링 Y위치 (패널 기준 mm)
  boringDepthPositions?: number[];  // 측판 보링 X위치 (패널 기준 mm, 서랍 측판용)
  boringDepthGroups?: BoringDepthGroup[];  // Y 위치별 보링 X위치
  sideBoringPositions?: number[];  // 천지판/고정선반 측면 피스 유도보링 위치
  sideBoringDiameter?: number;
  sideBoringDepth?: number;
  groovePositions?: GroovePosition[];  // 바닥판 끼우는 홈 위치 (서랍 앞판/뒷판용)
  // 도어 힌지 보링 전용 필드
  screwPositions?: number[];
  screwDepthPositions?: number[];
  isDoor?: boolean;
  isLeftHinge?: boolean;
  screwHoleSpacing?: number;
  // 측판 힌지 브라켓 타공 전용 필드
  bracketBoringPositions?: number[];
  bracketBoringDepthPositions?: number[];
  isBracketSide?: boolean;
  // 따내기 (노치) 정보
  cornerNotch?: PanelCornerNotch;  // 상판 따내기
  sideNotches?: Array<{ y: number; z: number; fromBottom: number }>;       // 측판 따내기
  rebate?: import('@/lib/optimizer/upstream/editor/CNCOptimizer/types').PanelRebate;             // 반턱 따내기
  // 3D 뷰어 패널 하이라이트용
  meshName?: string;
  furnitureId?: string;
}

export interface StockSheet {
  label?: string;
  width: number;
  length: number;
  thickness?: number;
  quantity: number;
  material?: string;
}

// [Befun 타입 보정] 원본 런타임이 'OPTIMAL_L'/'OPTIMAL_W'도 사용(optimizer.ts·store.tsx)하나 타입에 누락.
export type OptimizationType = 'BY_LENGTH' | 'BY_WIDTH' | 'OPTIMAL_CNC' | 'OPTIMAL_L' | 'OPTIMAL_W';

export interface CutSettings {
  unit: Unit;
  kerf: number;
  trimTop?: number;
  trimBottom?: number;
  trimLeft?: number;
  trimRight?: number;
  labelsOnPanels?: boolean;
  singleSheetOnly?: boolean;
  considerMaterial?: boolean;
  edgeBanding?: boolean;
  considerGrain?: boolean;
  alignVerticalCuts?: boolean;
  optimizationType?: OptimizationType;
}

// Cutting simulation types
export type CutAxis = 'x' | 'y';

export interface WorkPiece {
  width: number;
  length: number;
}

export interface Placement {
  sheetId: string;
  panelId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated?: boolean;
}

export interface CutStep {
  id: string;
  order: number;
  sheetId: string;
  panelId?: string;
  axis: CutAxis;
  pos: number;
  spanStart: number;
  spanEnd: number;
  before: WorkPiece;      // 재단 전 워크피스 크기
  result: WorkPiece;      // 재단 결과물 크기
  yieldsPanelId?: string; // 이 재단으로 완성되는 패널 ID
  kerf?: number;
  label?: string;
  source: 'engine' | 'derived';
}

export interface SawStats {
  bySheet: Record<string, number>;  // 시트별 톱날 이동 길이
  total: number;                    // 전체 톱날 이동 길이
  unit: 'mm' | 'm';                // 단위
  totalCuts?: number;              // 총 절단 횟수
  avgKerf?: number;                // 평균 kerf 두께
  details?: Record<string, {       // 시트별 상세 통계
    horizontal: number;            // 가로 절단 길이
    vertical: number;              // 세로 절단 길이
    cuts: number;                  // 절단 횟수
  }>;
}
