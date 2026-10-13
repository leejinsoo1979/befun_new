// @ts-nocheck — [Befun] 원본(250709in, Vite 빌드는 타입 검사 안 함)에 있던 strict 타입 오류. 로직 수정 없이 검사만 끔. upstream/README.md 참고
import { useFeature } from '@/lib/optimizer/upstream/access/store';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { CNCProvider, useCNCStore } from './store';
import { useCncPanelData } from './hooks/useCncPanelData';
import { restoreCncConversion, useConversionStore } from '@/lib/optimizer/upstream/editor/SketchMode/conversion/conversionStore';
import { useProjectStore } from '@/lib/optimizer/upstream/store/core/projectStore';
import { useFurnitureStore } from '@/lib/optimizer/upstream/store/core/furnitureStore';
import { useNavigate, useLocation, Link } from '@/lib/optimizer/upstream/shims/react-router-dom';
import { ArrowLeft, ArrowRight, ArrowLeftRight, Zap, Play, Pause, ChevronDown, ChevronRight, ChevronUp, Layout, Package, Grid3x3, Cpu, LogOut, Settings2, PencilRuler, Plus } from 'lucide-react';
import { GiCircularSawblade } from 'react-icons/gi';
import Logo from '@/lib/optimizer/upstream/components/common/Logo';
import { initializeTheme } from '@/lib/optimizer/upstream/theme';
import { useTranslation } from '@/lib/optimizer/upstream/i18n/useTranslation';
import { useTheme } from '@/lib/optimizer/upstream/contexts/ThemeContext';
import { calculateShelfBoringPositions, calculateSectionBoringPositions } from '@/lib/optimizer/upstream/domain/boring';
import {
  getDirectLowerDowelShelfBoringDetails,
  isDirectLowerDowelShelfModule,
} from '@/lib/optimizer/upstream/editor/shared/utils/lowerCabinetDowelShelves';
import { getModuleById, buildModuleDataFromPlacedModule } from '@/lib/optimizer/upstream/data/modules';
import { useSpaceConfigStore } from '@/lib/optimizer/upstream/store/core/spaceConfigStore';
import { calculateInternalSpace } from '@/lib/optimizer/upstream/editor/shared/viewer3d/utils/geometry';
import { useAuth } from '@/lib/optimizer/upstream/auth/AuthProvider';
import { canViewManufacturingCostForEmail } from '@/lib/optimizer/upstream/firebase/admins';

// Components
import PanelsTable from './components/SidebarLeft/PanelsTable';
import ExportBar from './components/ExportBar';
import SettingsModal from './components/SettingsModal';
import CuttingLayoutPreview2 from './components/CuttingLayoutPreview2';
import SheetThumbnail from './components/SheetThumbnail';
import ModeTabs from './components/ModeTabs';
import AILoadingModal from './components/AILoadingModal';
import ExitConfirmModal from './components/ExitConfirmModal';
import SimulationStatsModal from './components/SimulationStatsModal';
import type { LayoutReplaySnapshot } from './simulation/LayoutReplayDialog';
const LayoutReplayDialog = React.lazy(() => import('./simulation/LayoutReplayDialog'));
import PanelHighlight3DViewer from './components/PanelHighlight3DViewer';
import { getExcludedPanelAliases } from '@/lib/optimizer/upstream/editor/shared/viewer3d/context/ExcludedPanelsContext';

// Utils
import { optimizePanelsMultiple } from './utils/optimizer';
import { showToast } from '@/lib/optimizer/upstream/utils/cutlist/csv';
import { buildOptimizerCutPlans } from './utils/optimizerCutPlan';
import { formatSize } from '@/lib/optimizer/upstream/utils/cut/format';
import { computeSawStats } from '@/lib/optimizer/upstream/utils/cut/stats';
import type { Panel, StockSheet, Placement } from '../../types/cutlist';
import { OptimizedResult, PlacedPanel } from './types';
import { calculateAssemblyCost, getMaterialSheetPrice } from './utils/manufacturingCost';
import { convertPanelsToManufacturingBoringData } from './utils/mprPanelConversion';
import { toCutlistPanel, toManufacturingPlacedPanel, toOptimizerPanel } from './utils/livePanelToManufacturing';

// Styles
import styles from './CNCOptimizerPro.module.css';
import { readCuttingBoardInput } from './utils/cuttingBoardInput';
import { applySheetDrawing, readSheetDrawing, saveSheetDrawing } from './utils/sheetDrawing';
import { SheetDrawingEditor } from './components/SheetDrawingEditor';
import { AddSheetDialog } from './components/AddSheetDialog';
import { addSheet } from './utils/addSheet';
import { manufacturingQuote, assemblyCabinets } from './utils/manufacturingQuote';
import { manufacturingBlockKey } from '@/lib/optimizer/upstream/domain/boring/manufacturingBlock';

const formatPanelMm = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};

function PageInner({ cuttingBoard = false, preserved, preservedViewRotation, drawingStorageKey }: { cuttingBoard?: boolean; preserved?: OptimizedResult; preservedViewRotation?: number; drawingStorageKey: string }){
  const navigate = useNavigate();
  const location = useLocation();
  const { basicInfo } = useProjectStore();
  const modulePlacements = useFurnitureStore(s => s.placedModules);
  const sketchConversion = useConversionStore(s => cuttingBoard ? null : s.cnc);
  const placedModules = useMemo(() => sketchConversion || cuttingBoard ? [] : modulePlacements, [sketchConversion, modulePlacements, cuttingBoard]);
  const spaceInfo = useSpaceConfigStore((state) => state.spaceInfo);
  const { panels: livePanels } = useCncPanelData(!cuttingBoard);
  const { t, currentLanguage } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const canViewManufacturingCost = useFeature('manufacturingCost');

  // Configurator에서 왔는지 확인
  const fromConfigurator = location.state?.fromConfigurator;

  // Configurator에서 온 경우 localStorage 초기화 ref
  const hasResetForConfigurator = useRef(false);

  // 디버그: 데이터 소스 확인
  useEffect(() => {
    console.log('🏠 CNCOptimizer 데이터 소스 확인:');
    console.log('  - fromConfigurator:', fromConfigurator);
    console.log('  - placedModules (furnitureStore):', placedModules.length, '개');
    console.log('  - placedModules 상세:', placedModules.map(m => ({
      id: m.id,
      moduleId: m.moduleId,
      moduleType: m.moduleType,
      width: m.width,
      depth: m.depth
    })));
    console.log('  - livePanels (useLivePanelData):', livePanels.length, '개');
    console.log('  - livePanels 상세:', livePanels.map(p => ({
      id: p.id,
      name: p.name,
      width: p.width,
      height: p.height,
      material: p.material
    })));
  }, [fromConfigurator, placedModules, livePanels]);

  // 가구별 커스텀 선반 보링 위치 계산
  // 키는 moduleIndex 기반 (useLivePanelData의 패널 ID "m{moduleIndex}_p{panelIndex}"와 매칭)
  const customShelfPositionsByFurniture = useMemo(() => {
    const positionsMap: Record<string, number[]> = {};
    const internalSpace = calculateInternalSpace(spaceInfo);

    placedModules.forEach((placedModule, moduleIndex) => {
      // customSections가 있으면 사용, 없으면 원본 moduleData에서 가져옴
      let moduleData = (placedModule as any).moduleData
        || getModuleById(placedModule.moduleId, internalSpace, spaceInfo)
        || buildModuleDataFromPlacedModule(placedModule);
      if (!moduleData?.modelConfig?.sections) return;

      // customSections 적용
      if (placedModule.customSections) {
        moduleData = {
          ...moduleData,
          modelConfig: {
            ...moduleData.modelConfig,
            sections: placedModule.customSections
          }
        };
      }

      // 가구 높이 계산 (mm)
      const isUpperModule = moduleData.category === 'upper' || placedModule.moduleId.includes('upper');
      const height = isUpperModule
        ? (placedModule.customHeight ?? placedModule.freeHeight ?? moduleData.dimensions.height)
        : (placedModule.freeHeight ?? placedModule.customHeight ?? moduleData.dimensions.height);
      const basicThicknessMm = moduleData.modelConfig?.basicThickness ?? (spaceInfo.panelThickness ?? 18);

      // 실제 이동선반/추가 다보 위치 계산
      const result = calculateShelfBoringPositions({
        sections: moduleData.modelConfig.sections,
        totalHeightMm: height,
        basicThicknessMm,
        additionalDowelBorings: {
          enabled: !!placedModule.additionalDowelBoringsEnabled,
          count: placedModule.additionalDowelBoringCount ?? 0,
          spacingMm: 32,
        },
      });
      const moduleId = moduleData?.id || placedModule.moduleId || '';
      const details = isDirectLowerDowelShelfModule(moduleId)
        ? getDirectLowerDowelShelfBoringDetails({
          moduleId,
          cabinetHeightMm: height,
          basicThicknessMm,
          sections: moduleData.modelConfig.sections,
          additionalDowelBorings: {
            enabled: !!placedModule.additionalDowelBoringsEnabled,
            count: placedModule.additionalDowelBoringCount ?? 0,
            spacingMm: 32,
          },
        })
        : result.details.filter(detail => detail.role === 'movable-shelf' || detail.role === 'additional-dowel');

      const positions = details
        .filter(detail => (
          detail.role === 'movable-shelf' ||
          detail.role === 'additional-dowel'
        ))
        .map(detail => detail.y);

      if (positions.length > 0) {
        // useFurnitureBoring은 placedModule.id로 조회한다.
        positionsMap[placedModule.id] = positions;
        // 기존 프리뷰/내보내기 호환용 키도 같이 유지한다.
        positionsMap[`m${moduleIndex}`] = positions;
      }
    });

    return positionsMap;
  }, [placedModules, spaceInfo]);

  // 화면 표시와 생산 내보내기가 동일한 실시간 패널 데이터를 사용한다.
  // 패널목록은 width=폭/height=깊이 프레임이라 MPR 변환 전에 생산 프레임(toManufacturingPlacedPanel)으로 옮긴다.
  // 안 그러면 수평판 마구리 보링이 깊이 방향 끝면에 찍힌다(내보내기 경로와 어긋남).
  const boringPanels = useMemo(
    () => convertPanelsToManufacturingBoringData(livePanels.map(toManufacturingPlacedPanel)),
    [livePanels]
  );

  // URL에서 디자인파일 정보 가져오기
  const [designFileName, setDesignFileName] = useState<string>('');

  useEffect(() => {
    const loadDesignFileName = async () => {
      const searchParams = new URLSearchParams(location.search);
      const designFileId = searchParams.get('designFileId');
      const fileName = searchParams.get('designFileName') || searchParams.get('fileName');

      console.log('🔍 CNC Optimizer URL 파라미터 체크:', {
        designFileId,
        fileName,
        fullSearch: location.search,
        allParams: Object.fromEntries(searchParams.entries())
      });

      // 1순위: URL 파라미터에 designFileName이 있으면 바로 사용
      if (fileName) {
        const decodedName = decodeURIComponent(fileName);
        console.log('✅ URL 파라미터에서 디자인파일명 설정 (우선순위 1):', decodedName);
        setDesignFileName(decodedName);
        return;
      }

      // 2순위: designFileId로 Firebase에서 로드
      if (designFileId) {
        console.log('📂 designFileId로 디자인파일 로드 시작 (우선순위 2):', designFileId);
        try {
          const { getDesignFileById } = await import('@/lib/optimizer/upstream/firebase/projects');
          const { designFile, error } = await getDesignFileById(designFileId);

          console.log('📂 디자인파일 로드 결과:', {
            designFile,
            error,
            hasName: !!designFile?.name,
            name: designFile?.name
          });

          if (error) {
            console.error('❌ Firebase 에러:', error);
          }

          if (designFile?.name) {
            console.log('✅ 디자인파일명 설정:', designFile.name);
            setDesignFileName(designFile.name);

            // URL에 디자인파일명이 없으면 추가 (새로고침 시 유지하기 위해)
            const currentParams = new URLSearchParams(window.location.search);
            if (!currentParams.get('designFileName')) {
              currentParams.set('designFileName', encodeURIComponent(designFile.name));
              const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
              window.history.replaceState({}, '', newUrl);
              console.log('🔗 CNC Optimizer URL에 디자인파일명 추가:', newUrl);
            }
          } else {
            console.error('❌ 디자인파일에 name이 없음. designFile:', designFile);
          }
        } catch (err) {
          console.error('❌ 디자인파일 로드 중 에러:', err);
        }
      } else {
        console.log('⚠️ URL에 디자인파일 정보 없음');
      }
    };

    loadDesignFileName();
  }, [location.search]);
  
  const { 
    panels, setPanels, 
    stock, setStock, 
    settings, setSettings,
    selectedPanelId, setSelectedPanelId,
    currentSheetIndex, setCurrentSheetIndex,
    userHasModifiedPanels, setUserHasModifiedPanels,
    setPlacements, selectPanel,
    simulating, setSimulating, simSpeed, setSimSpeed,
    selectedCutIndex, selectCutIndex,
    selectedCutId, selectCutId, setSelectedSheetId,
    sawStats, setSawStats,
    fullSimulating, setFullSimulating, fullSimCurrentSheet, setFullSimCurrentSheet,
    fullSimTotalSheets,
    hoveredPanelName, hoveredFurnitureId, setHoveredPanel,
    excludedPanelIds, assemblyPlaying
  } = useCNCStore();

  // Configurator에서 온 경우 localStorage 초기화하여 새로운 패널 데이터 로드
  useEffect(() => {
    if (!restoredDrawing && fromConfigurator && placedModules.length > 0 && !hasResetForConfigurator.current) {
      console.log('🔄 Configurator에서 진입 - localStorage 초기화');
      localStorage.removeItem('cnc_panels');
      localStorage.removeItem('cnc_user_modified');
      setUserHasModifiedPanels(false);
      hasResetForConfigurator.current = true;
    }
  }, [fromConfigurator, placedModules.length, setUserHasModifiedPanels]);

  const liveSourceSignature = JSON.stringify(livePanels);
  const [restoredDrawing] = useState(() => readSheetDrawing(drawingStorageKey, { panels, stock, settings, excluded: [...excludedPanelIds], source: livePanels }));
  const restoredSourceSignature = useRef(restoredDrawing ? liveSourceSignature : null);
  const keepRestoredDrawing = !!restoredDrawing && restoredSourceSignature.current === liveSourceSignature;
  const [optimizationResults, setOptimizationResults] = useState<OptimizedResult[]>(() => restoredDrawing ?? (preserved ? [preserved] : []));
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [drawingSheet, setDrawingSheet] = useState<number | null>(null);
  const [manualPlacement, setManualPlacement] = useState(!!restoredDrawing);
  const skipPanelAutoOptimize = useRef(false);
  const manualPlacementRef = useRef(manualPlacement);
  manualPlacementRef.current = manualPlacement;
  const [isOptimizing, setIsOptimizing] = useState(false);
  const optimizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const optimizationVersion = useRef(0);
  const pendingResultsRef = useRef<OptimizedResult[]>([]); // Store results temporarily in ref
  
  // 뷰어 상태 (미리보기와 동기화)
  const [viewerScale, setViewerScale] = useState(1);
  const preservingPlacement = manualPlacement || (!!preserved && optimizationResults[0] === preserved);
  const [viewerRotation, setViewerRotation] = useState(preservedViewRotation ?? -90); // 기본값 -90 (가로뷰)
  const [viewerOffset, setViewerOffset] = useState({ x: 0, y: 0 });
  const [showCuttingList, setShowCuttingList] = useState(true); // 컷팅 리스트 탭 기본 선택
  const [viewSwapped, setViewSwapped] = useState(false); // 패널뷰어 ↔ 3D뷰어 위치 스왑
  const handleSwapView = useCallback(() => {
    setViewSwapped(v => {
      const next = !v;
      // 스왑 시 패널 레이아웃 세로(0도) ↔ 가로(-90도) 자동 전환
      setViewerRotation(next ? 0 : -90);
      setViewerOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);
  const [expandedSheets, setExpandedSheets] = useState<Set<number>>(new Set()); // 펼쳐진 시트 인덱스들
  const [showTotalStats, setShowTotalStats] = useState(true); // 전체 통계 표시 여부
  const [showSheetStats, setShowSheetStats] = useState(true); // 시트 통계 표시 여부
  const [methodChanged, setMethodChanged] = useState(false); // 메소드 변경 여부
  
  // AI Loading state
  const [showAILoading, setShowAILoading] = useState(false);
  const [aiLoadingProgress, setAILoadingProgress] = useState(0);
  const [aiLoadingDuration, setAILoadingDuration] = useState(5000);
  
  // Exit confirmation state
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);

  // Simulation complete stats popup state
  const [showSimulationStats, setShowSimulationStats] = useState(false);
  const [layoutReplay, setLayoutReplay] = useState<LayoutReplaySnapshot | null>(null);
  const [simulationStatsData, setSimulationStatsData] = useState<{
    sheetCount: number;
    totalCutLength: number;
    avgEfficiency: number;
    totalPanels: number;
  } | null>(null);


  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (drawingSheet !== null || showAddSheet || layoutReplay) return;
      if (e.key === 'Escape') {
        setSelectedPanelId(null);
        setHoveredPanel(null, null);
      }
      
      // Arrow key navigation for sheets
      if (optimizationResults.length > 0) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setCurrentSheetIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setCurrentSheetIndex(prev => Math.min(optimizationResults.length - 1, prev + 1));
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Clear selection when clicking outside of panels
      const target = e.target as HTMLElement;
      if (!target.closest('.panel-clickable')) {
        setSelectedPanelId(null);
        setHoveredPanel(null, null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [setSelectedPanelId, optimizationResults.length, setCurrentSheetIndex, drawingSheet, showAddSheet, layoutReplay]);

  // Auto-optimization trigger ref to ensure it only runs once
  const hasAutoOptimized = useRef(!!restoredDrawing);
  const initialOptimizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (initialOptimizeTimer.current) clearTimeout(initialOptimizeTimer.current);
    optimizationVersion.current++;
  }, []);
  // Track if panels have been initialized from livePanels
  const hasInitializedFromLive = useRef(false);
  // livePanels 변경 감지용 — 내용 기반 비교로 불필요한 재동기화 방지
  const prevLivePanelsKey = useRef('');
  // handleOptimize 최신 참조 (setTimeout closure 문제 방지)
  const handleOptimizeRef = useRef<(() => void) | null>(null);
  // stock이 livePanels 기반으로 초기화되었는지 추적
  const stockInitializedFromLive = useRef(false);

  // Configurator에서 온 경우 hasInitializedFromLive 리셋
  useEffect(() => {
    if (fromConfigurator && livePanels.length > 0) {
      console.log('🔄 Configurator에서 진입 - hasInitializedFromLive 리셋');
      hasInitializedFromLive.current = false;
    }
  }, [fromConfigurator, livePanels.length]);

  // Initialize with live data - only run once on mount
  useEffect(() => {
    if (cuttingBoard || keepRestoredDrawing) return;
    console.log('=== CNCOptimizerPro Initialization ===');
    console.log('fromConfigurator:', fromConfigurator);
    console.log('livePanels from hook:', livePanels);
    console.log('livePanels.length:', livePanels.length);
    console.log('current panels in store:', panels);
    console.log('current stock in store:', stock);

    // Configurator에서 왔거나 livePanels가 있으면 user modified flag 리셋
    if (fromConfigurator || livePanels.length > 0) {
      // Reset user modified flag since we're getting fresh data from configurator
      setUserHasModifiedPanels(false);
      localStorage.removeItem('cnc_user_modified');
    }

    // Skip initialization if user has already modified panels AFTER checking livePanels
    if (userHasModifiedPanels && livePanels.length === 0 && !fromConfigurator) {
      console.log('User has modified panels and no live panels, keeping user panels');
      return;
    }
    
    // Clear panels if no furniture is placed
    // Always clear panels when there are no live panels (no furniture placed)
    if (livePanels.length === 0) {
      // Check if user has manually added panels
      const hasUserAddedPanels = userHasModifiedPanels && panels.some(p => 
        p.width > 0 && p.length > 0 && p.label !== ''
      );
      
      if (!hasUserAddedPanels) {
        // Clear all panels since no furniture is placed and no user panels
        console.log('No furniture placed, clearing all panels');
        setPanels([]);
        localStorage.removeItem('cnc_panels');
        localStorage.removeItem('cnc_user_modified');
        setUserHasModifiedPanels(false);
      }
    }
    
    // Convert live panels to CutList format - always update when we have live panels
    if (livePanels.length > 0) {
      // Always use live panels when they exist (even after refresh)
      // 항상 livePanels로 업데이트 (boringDepthPositions, groovePositions 포함)
      if (true) { // 항상 업데이트
        // 변환 규칙은 livePanelToManufacturing.toCutlistPanel 하나뿐이다 (3D 보링 표시와 MPR이 같은 프레임을 쓴다)
        const cutlistPanels: Panel[] = livePanels.map(toCutlistPanel);

        console.log('[CNCOptimizerPro] Setting panels from livePanels:');
        cutlistPanels.forEach(p => {
          if (p.label.includes('서랍') && (p.label.includes('좌측판') || p.label.includes('우측판'))) {
            console.log(`[CNCOptimizerPro] ${p.label}: boringDepthPositions=`, p.boringDepthPositions);
          }
        });
        setPanels(cutlistPanels);
        hasInitializedFromLive.current = true;
      }
    } else if (livePanels.length === 0 && !userHasModifiedPanels) {
      // No furniture placed and user hasn't modified - check for old panels
      const hasEmptyPanels = panels.some(p => p.width === 0 || p.length === 0 || p.label === '');
      
      if (!hasEmptyPanels && panels.length > 0) {
        // Only clear if there are no user-added empty panels
        console.log('No furniture placed and no user panels - clearing panels');
        setPanels([]);
      }
    }

    // Initialize theme from localStorage
    initializeTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Stock 초기화: livePanels 기반으로 PET 코팅 여부 판단하여 적절한 stock 설정
  useEffect(() => {
    if (cuttingBoard || keepRestoredDrawing) { stockInitializedFromLive.current = true; return; }
    // livePanels에서 실제 사용되는 두께/재질 조합을 기반으로 stock 생성
    const isPET = livePanels.some(p => p.material === 'PET' || p.thickness === 18.5 || p.thickness === 15.5);

    const defaultStock: StockSheet[] = isPET ? [
      // PET 코팅 원자재 (+0.5mm)
      { label: 'PB_18.5T_2440x1220', width: 1220, length: 2440, thickness: 18.5, quantity: 999, material: 'PB' },
      { label: 'PET_18T_2440x1220', width: 1220, length: 2440, thickness: 18, quantity: 999, material: 'PET' },
      { label: 'PB_15.5T_2440x1220', width: 1220, length: 2440, thickness: 15.5, quantity: 999, material: 'PB' },
      { label: 'MDF_15.5T_2440x1220', width: 1220, length: 2440, thickness: 15.5, quantity: 999, material: 'MDF' },
      { label: 'MDF_9T_2440x1220', width: 1220, length: 2440, thickness: 9, quantity: 999, material: 'MDF' },
      { label: 'MDF_6T_2440x1220', width: 1220, length: 2440, thickness: 6, quantity: 999, material: 'MDF' },
      { label: 'MDF_4.5T_2440x1220', width: 1220, length: 2440, thickness: 4.5, quantity: 999, material: 'MDF' },
      { label: 'MDF_3T_2440x1220', width: 1220, length: 2440, thickness: 3, quantity: 999, material: 'MDF' },
    ] : [
      // 일반 원자재
      { label: 'PB_18T_2440x1220', width: 1220, length: 2440, thickness: 18, quantity: 999, material: 'PB' },
      { label: 'PET_18T_2440x1220', width: 1220, length: 2440, thickness: 18, quantity: 999, material: 'PET' },
      { label: 'PB_15T_2440x1220', width: 1220, length: 2440, thickness: 15, quantity: 999, material: 'PB' },
      { label: 'MDF_15T_2440x1220', width: 1220, length: 2440, thickness: 15, quantity: 999, material: 'MDF' },
      { label: 'MDF_9T_2440x1220', width: 1220, length: 2440, thickness: 9, quantity: 999, material: 'MDF' },
      { label: 'MDF_6T_2440x1220', width: 1220, length: 2440, thickness: 6, quantity: 999, material: 'MDF' },
      { label: 'MDF_4.5T_2440x1220', width: 1220, length: 2440, thickness: 4.5, quantity: 999, material: 'MDF' },
      { label: 'MDF_3T_2440x1220', width: 1220, length: 2440, thickness: 3, quantity: 999, material: 'MDF' },
    ];
    // 인조대리석 패널이 있으면 해당 두께의 stock 추가
    const stoneThicknesses = new Set<number>();
    livePanels.forEach(p => {
      if (p.material === '인조대리석' && p.thickness) {
        stoneThicknesses.add(p.thickness);
      }
    });
    stoneThicknesses.forEach(t => {
      defaultStock.push({
        label: `인조대리석_${t}T_3680x760`,
        width: 760, length: 3680, thickness: t,
        quantity: 999, material: '인조대리석'
      });
    });

    setStock(defaultStock);
    stockInitializedFromLive.current = true;
  }, [livePanels, keepRestoredDrawing]); // livePanels 변경 시 stock 재설정
  
  // Separate effect for live panels initialization - only when they change and user hasn't modified
  useEffect(() => {
    if (cuttingBoard || keepRestoredDrawing) return;
    if (userHasModifiedPanels && livePanels.length === 0) {
      console.log('User has modified panels, skipping livePanels sync');
      return;
    }

    // livePanels 내용 기반 키 생성 — 보링 데이터 변경도 재동기화 대상이다.
    const livePanelsKey = livePanels.map(p => [
      p.id,
      p.name,
      p.width,
      p.height,
      p.thickness,
      p.material,
      p.textureName,
      p.grain,
      JSON.stringify(p.rebate ?? null),
      JSON.stringify(p.cornerNotch ?? null),
      JSON.stringify(p.manufacturingBoring ?? null),
      p.boringPositions?.join(',') || '',
      p.boringDepthPositions?.join(',') || '',
      p.boringDepthGroups?.map(group => `${group.y}:${group.depthPositions.join(',')}:${group.boringType || ''}`).join(';') || '',
      p.sideBoringPositions?.join(',') || '',
      p.sideBoringDiameter || '',
      p.sideBoringDepth || '',
      p.groovePositions?.map(groove => `${groove.y}:${groove.height}:${groove.depth}`).join(';') || '',
      p.sourceFurnitureIds?.join(',') || '',
      // 확정되지 않은 가공 표시만 바뀌어도 다시 동기화해야 한다. 빠지면 막힌 판재가 그대로 남는다.
      manufacturingBlockKey(p),
    ].join(':')).join('|');
    if (livePanelsKey === prevLivePanelsKey.current) {
      return; // 내용이 동일하면 스킵
    }

    console.log('🔄 패널 초기화 체크:', {
      livePanelsCount: livePanels.length,
      hasInitializedFromLive: hasInitializedFromLive.current,
      userHasModifiedPanels
    });

    if (livePanels.length > 0) {
      if (userHasModifiedPanels) {
        localStorage.removeItem('cnc_user_modified');
        setUserHasModifiedPanels(false);
      }
      console.log('✅ livePanels에서 패널 초기화 시작:', livePanels.length, '개');
      // 초기 진입과 갱신이 같은 제조 원본·가공 좌표 프레임을 보존한다.
      const cutlistPanels: Panel[] = livePanels.map(toCutlistPanel);

      setPanels(cutlistPanels);
      prevLivePanelsKey.current = livePanelsKey;
      hasInitializedFromLive.current = true;
    }
  }, [livePanels, userHasModifiedPanels, setPanels, setUserHasModifiedPanels, keepRestoredDrawing]);

  // 제외 패널 ID → furnitureId::meshName 복합키 변환 (3D 뷰어 패널 숨김용)
  // store panels에 meshName이 없으면 livePanels에서 폴백 조회
  const excludedMeshNames = useMemo(() => {
    const names = new Set<string>();
    excludedPanelIds.forEach(panelId => {
      // store panels에서 먼저 찾기
      let panel = panels.find(p => p.id === panelId);
      let meshName = panel?.meshName;
      let furnitureId = panel?.furnitureId;
      let sourceFurnitureIds = panel?.sourceFurnitureIds;

      // store panels에 3D 매칭 정보가 없으면 livePanels에서 폴백
      if ((!meshName || !furnitureId || !sourceFurnitureIds?.length) && livePanels.length > 0) {
        const livePanel = livePanels.find(lp => lp.id === panelId);
        if (livePanel) {
          meshName = meshName || livePanel.meshName;
          furnitureId = furnitureId || livePanel.furnitureId;
          sourceFurnitureIds = sourceFurnitureIds?.length ? sourceFurnitureIds : livePanel.sourceFurnitureIds;
        }
      }

      if (meshName && sourceFurnitureIds?.length) {
        sourceFurnitureIds.forEach(sourceFurnitureId => {
          names.add(`${sourceFurnitureId}::${meshName}`);
        });
      } else if (meshName && furnitureId) {
        names.add(`${furnitureId}::${meshName}`);
      }
    });
    // 가구 편집 팝업 패널 목록에서 사용자가 체크 해제한 패널들도 3D 뷰어에서 숨김
    // ※ furnitureId가 붙은 복합 키만 추가 (범용 키를 넣으면 다른 가구의 동명 패널까지 숨겨짐)
    placedModules.forEach((module) => {
      const exclusions = module.panelExclusions;
      if (!exclusions || exclusions.length === 0) return;
      exclusions.forEach((panelName) => {
        getExcludedPanelAliases(panelName).forEach((alias) => {
          names.add(`${module.id}::${alias}`);
        });
      });
    });
    return names;
  }, [excludedPanelIds, panels, livePanels, placedModules]);

  const handleOptimize = useCallback(async (overrideOptimizationType?: 'OPTIMAL_L' | 'OPTIMAL_W' | 'OPTIMAL_CNC', silent?: boolean) => {
    // overrideOptimizationType이 주어지면 그 값을 사용, 아니면 settings에서 가져옴
    const effectiveOptimizationType = overrideOptimizationType || settings.optimizationType;
    console.log('⚡ handleOptimize called with optimizationType:', effectiveOptimizationType, silent ? '(silent)' : '');

    const version = ++optimizationVersion.current;
    const isCurrent = () => version === optimizationVersion.current;
    const includedPanels = panels.filter(panel => !excludedPanelIds.has(panel.id));
    if (silent) {
      setShowAILoading(false);
      setAILoadingProgress(0);
      setSimulating(false);
      setFullSimulating(false);
    }

    if (includedPanels.length === 0) {
      localStorage.removeItem(drawingStorageKey);
      setManualPlacement(false);
      setOptimizationResults([]);
      pendingResultsRef.current = [];
      setPlacements([]);
      setSawStats({ bySheet: {}, total: 0, unit: 'm' });
      setCurrentSheetIndex(0);
      setSelectedSheetId(undefined);
      setIsOptimizing(false);
      if (!silent) showToast(t('cnc.noPanelsError'), 'error', t('common.confirm'));
      return;
    }

    if (stock.length === 0) {
      if (!silent) showToast(t('cnc.noStockError'), 'error', t('common.confirm'));
      return;
    }

    localStorage.removeItem(drawingStorageKey);
    setManualPlacement(false);
    setIsOptimizing(true);
    setMethodChanged(false); // Calculate 시 강조 제거

    // Clear previous results immediately for cleaner experience
    if (!silent) setOptimizationResults([]);
    pendingResultsRef.current = []; // Clear any pending results

    // 설정값을 전역 변수로 저장 (뷰어에서 접근 가능하도록)
    (window as any).cncSettings = { ...settings, optimizationType: effectiveOptimizationType };

    let progressInterval: ReturnType<typeof setInterval> | null = null;
    const animationStartTime = Date.now();

    if (!silent) {
      // AI 로딩 모달 표시 (수동 계산하기 버튼 클릭 시에만)
      setShowAILoading(true);
      setAILoadingProgress(0);

      const totalPanels = panels.reduce((sum, p) => sum + (p.quantity || 1), 0);
      const estimatedSheets = Math.ceil(totalPanels / 10);
      let loadingDuration = 3000;

      if (estimatedSheets >= 30) {
        loadingDuration = 8000;
      } else if (estimatedSheets >= 20) {
        loadingDuration = 6000;
      } else if (estimatedSheets >= 10) {
        loadingDuration = 4000;
      } else if (estimatedSheets >= 5) {
        loadingDuration = 3500;
      }

      setAILoadingDuration(loadingDuration);

      progressInterval = setInterval(() => {
        if (!isCurrent()) { clearInterval(progressInterval!); return; }
        const elapsed = Date.now() - animationStartTime;
        const progress = Math.min((elapsed / loadingDuration) * 100, 95);
        setAILoadingProgress(progress);

        if (elapsed >= loadingDuration) {
          clearInterval(progressInterval!);
        }
      }, 50);

      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!isCurrent()) return;
    }
    
    try {

      // ★★★ 디버그: panels store의 boringDepthPositions 확인 ★★★
      console.log('[handleOptimize] panels store 확인:');
      includedPanels.forEach(p => {
        if (p.label.includes('서랍') && (p.label.includes('좌측판') || p.label.includes('우측판'))) {
          console.log(`[handleOptimize] ${p.label}: boringDepthPositions=`, p.boringDepthPositions);
        }
      });

      // ★ 패널 크기별 보드 분류
      // 1) ≤1220×2440 → 일반 원장
      // 2) 2440 초과 ~ ≤2750 → 1220×2750 비규격
      // 3) 2750 초과 ~ ≤3050 → 1220×3050 비규격
      // 4) 3050 초과 → 일반 그룹에 그대로 (옵티마이저가 처리)
      const stdW = 1220;
      const stdL = 2440;
      const ext2750 = 2750;
      const ext3050 = 3050;
      const fitInBoard = (w: number, l: number, canRot: boolean, sw: number, sl: number) => {
        const sh = Math.min(w, l);
        const lg = Math.max(w, l);
        if (sh <= sw && lg <= sl) return true;
        if (canRot) return false;
        return w <= sw && l <= sl;
      };
      const regularList = [];
      const ext2750List = [];
      const ext3050List = [];
      includedPanels.forEach(p => {
        const hasG = p.grain && p.grain !== 'NONE';
        const canRot = !hasG;
        if (fitInBoard(p.width, p.length, canRot, stdW, stdL)) {
          regularList.push(p);
        } else if (fitInBoard(p.width, p.length, canRot, stdW, ext2750)) {
          ext2750List.push(p);
        } else if (fitInBoard(p.width, p.length, canRot, stdW, ext3050)) {
          ext3050List.push(p);
        } else {
          regularList.push(p);
        }
      });

      // Group panels by material AND thickness
      const panelGroups = new Map<string, Panel[]>();

      regularList.forEach(panel => {
        // Apply grain and rotation settings
        const processedPanel = { ...panel };
        
        // 패널 치수를 그대로 사용 (width와 length를 변경하지 않음)
        // console.log(`Panel ${panel.label}: ${panel.width}x${panel.length} (grain: ${panel.grain}, thickness: ${panel.thickness}mm)`);
        
        // 결방향(grain)이 있는 패널은 모든 모드에서 회전 불가
        // NONE만 회전 허용 (MDF 등 무결 + 회전 가능한 패널)
        const hasGrain = panel.grain && panel.grain !== 'NONE';
        if (hasGrain) {
          processedPanel.canRotate = false;
        } else if (effectiveOptimizationType === 'OPTIMAL_CNC') {
          // CNC 최적화: 무결 패널만 회전 허용
          processedPanel.canRotate = true;
        } else {
          // 세로/가로 절단 모드: 무결 패널만 회전 허용
          processedPanel.canRotate = !settings.considerGrain ? true : true;
        }
        
        // 재질+두께로 그룹화 (같은 재질의 패널은 한 시트에 최대한 채움)
        const key = settings.considerMaterial
          ? `${processedPanel.material || 'PB'}_${processedPanel.thickness || 18}`
          : `THICKNESS_${processedPanel.thickness || 18}`;
        if (!panelGroups.has(key)) {
          panelGroups.set(key, []);
        }
        panelGroups.get(key)!.push(processedPanel);
      });

      const allResults: OptimizedResult[] = [];

      // 디버그: 그룹화 결과 출력
      console.log('[handleOptimize] 패널 그룹화 결과:');
      let totalGroupedPanels = 0;
      panelGroups.forEach((groupPanels, key) => {
        const totalQty = groupPanels.reduce((sum, p) => sum + (p.quantity || 1), 0);
        totalGroupedPanels += totalQty;
        console.log(`  - ${key}: ${groupPanels.length}개 패널 (총 수량: ${totalQty})`);
      });
      console.log(`[handleOptimize] 총 패널 수: ${panels.length}, 제외: ${excludedPanelIds.size}, 최적화 대상: ${includedPanels.length}, 그룹화된 패널 수: ${totalGroupedPanels}`);

      // Optimize each material/thickness group
      for (const [key, groupPanels] of panelGroups) {
        // Parse material and thickness from key
        let material: string | undefined;
        let thickness: number;
        
        if (key.startsWith('THICKNESS_')) {
          // 재질 구분 없이 두께만 고려: THICKNESS_18.5
          thickness = parseFloat(key.split('_')[1]) || 18;
        } else {
          // 재질+두께: PET_18
          const parts = key.split('_');
          material = parts[0];
          thickness = parseFloat(parts[1]) || 18;
        }
        
        // Find matching stock by material and thickness
        let matchingStock;
        if (material) {
          // 재질과 두께가 모두 일치하는 원자재 찾기
          matchingStock = stock.find(s => 
            s.material === material && s.thickness === thickness
          );
        }
        
        // 재질이 일치하는 게 없으면 두께만 일치하는 것 찾기
        if (!matchingStock) {
          matchingStock = stock.find(s => s.thickness === thickness);
        }
        
        // Last resort: use first stock (but warn)
        if (!matchingStock && stock.length > 0) {
          // console.warn(`No matching stock for ${thickness}mm thickness, using default stock`);
          matchingStock = stock[0];
        }

        if (matchingStock) {
          // Convert to optimizer format
          // stockPanel: width=W방향(1220), height=L방향(2440)
          // 캔버스는 rotation=-90으로 가로로 표시됨
          // material: 그룹의 material을 우선 사용 (stock 폴백 시에도 패널 재질 유지)
          const stockPanel = {
            id: matchingStock.label || 'stock',
            width: matchingStock.width,   // 1220 (W방향)
            height: matchingStock.length, // 2440 (L방향)
            material: material || matchingStock.material || 'PB',
            color: 'MW',
            price: getMaterialSheetPrice(material || matchingStock.material, thickness),
            stock: matchingStock.quantity,
            thickness: thickness,
          };

          // 패널: width=W방향, height=L방향 (시트와 동일한 좌표계)
          const optimizerPanels = groupPanels.map(toOptimizerPanel);

          // 여백을 고려한 사용 가능한 공간 계산
          const adjustedStockPanel = {
            ...stockPanel,
            width: stockPanel.width - (settings.trimLeft ?? 10) - (settings.trimRight ?? 10),
            height: stockPanel.height - (settings.trimTop ?? 10) - (settings.trimBottom ?? 10)
          };
          
          // 체크 변경은 의도적인 대기 없이 같은 계산기로 즉시 재배치한다.
          
          // Run optimization with adjusted stock size
          const results = await optimizePanelsMultiple(
            optimizerPanels,
            adjustedStockPanel, // 여백을 제외한 크기 사용
            settings.singleSheetOnly ? 1 : 999, // 제한 없음
            settings.alignVerticalCuts !== false, // Use aligned packing by default
            settings.kerf ?? 5, // 톱날 두께 전달
            effectiveOptimizationType // 최적화 타입 전달 (override 지원)
          );
          
          if (!isCurrent()) return;

          // 패널 위치를 여백만큼 오프셋
          results.forEach(result => {
            result.panels.forEach(panel => {
              panel.x += (settings.trimLeft ?? 10);
              panel.y += (settings.trimBottom ?? 10);
              // 디버그: optimizer 결과 확인
              if (panel.name?.includes('서랍') && (panel.name?.includes('좌측판') || panel.name?.includes('우측판'))) {
                console.log(`[optimizer result] ${panel.name}: boringDepthPositions=`, panel.boringDepthPositions, 'groovePositions=', panel.groovePositions);
              }
            });
            // 원본 크기 정보 복원
            result.stockPanel = stockPanel;
          });
          
          // console.log(`Optimization for ${material}: ${results.length} sheets generated`);
          // console.log(`Panels to optimize: ${optimizerPanels.length}`);
          allResults.push(...results);
        }
      }

      // ★ 비규격 자재 (1220×2750 / 1220×3050) 옵티마이즈
      const extConfigs = [
        { list: ext2750List, sheetL: ext2750 },
        { list: ext3050List, sheetL: ext3050 },
      ];
      for (let ei = 0; ei < extConfigs.length; ei++) {
        const cfg = extConfigs[ei];
        if (!cfg.list.length) continue;
        // 재질+두께로 그룹화
        const extGroupMap = new Map();
        cfg.list.forEach(p => {
          const hasG = p.grain && p.grain !== 'NONE';
          const proc = Object.assign({}, p);
          const isDrawerSidePanel = proc.label?.includes('서랍') &&
            (proc.label.includes('좌측판') || proc.label.includes('우측판'));
          const isDoorPanel = proc.isDoor === true ||
            proc.label?.includes('도어') ||
            proc.name?.includes('도어') ||
            proc.label?.includes('door') ||
            proc.name?.includes('door');
          proc.canRotate = (isDoorPanel || isDrawerSidePanel) ? false : !hasG;
          const gk = settings.considerMaterial
            ? (proc.material || 'PB') + '_' + (proc.thickness || 18)
            : 'THICKNESS_' + (proc.thickness || 18);
          if (!extGroupMap.has(gk)) extGroupMap.set(gk, []);
          extGroupMap.get(gk).push(proc);
        });
        for (const entry of extGroupMap) {
          const gk = entry[0];
          const gp = entry[1];
          let mat;
          let thk;
          if (gk.indexOf('THICKNESS_') === 0) {
            thk = parseFloat(gk.split('_')[1]) || 18;
          } else {
            const parts = gk.split('_');
            mat = parts[0];
            thk = parseFloat(parts[1]) || 18;
          }
          const extStock = {
            id: 'ext-' + (mat || 'PB') + '-' + thk + '-' + cfg.sheetL,
            width: stdW,
            height: cfg.sheetL,
            material: mat || 'PB',
            color: 'MW',
            price: getMaterialSheetPrice(mat, thk),
            stock: 999,
            thickness: thk,
            label: '비규격 ' + stdW + '×' + cfg.sheetL,
          };
          const extOptPanels = gp.map(toOptimizerPanel);
          const adjExtStock = {
            id: extStock.id,
            width: extStock.width - (settings.trimLeft ?? 10) - (settings.trimRight ?? 10),
            height: extStock.height - (settings.trimTop ?? 10) - (settings.trimBottom ?? 10),
            material: extStock.material,
            color: extStock.color,
            price: extStock.price,
            stock: extStock.stock,
            thickness: extStock.thickness,
          };
          const extRes = await optimizePanelsMultiple(
            extOptPanels,
            adjExtStock,
            settings.singleSheetOnly ? 1 : 999,
            settings.alignVerticalCuts !== false,
            settings.kerf ?? 5,
            effectiveOptimizationType
          );
          if (!isCurrent()) return;
          extRes.forEach(r => {
            r.panels.forEach(pn => {
              pn.x += (settings.trimLeft ?? 10);
              pn.y += (settings.trimBottom ?? 10);
            });
            r.stockPanel = extStock;
            r.isOversized = true;
          });
          allResults.push(...extRes);
        }
      }

      if (!isCurrent()) return;
      console.log('=== Initial Optimization Complete ===');
      console.log('Total sheets generated:', allResults.length);
      console.log('panelGroups count:', panelGroups.size);
      if (allResults.length === 0) {
        console.error('❌ allResults is empty! panelGroups:', [...panelGroups.entries()].map(([k, v]) => `${k}: ${v.length} panels`));
      }

      // 재최적화 비활성화 - 시트 낭비 방지
      const finalResults = [...allResults];
      
      // console.log('=== Final Optimization Complete ===');
      // console.log('Total sheets:', finalResults.length);
      
      // 각 시트의 패널 수 출력
      // finalResults.forEach((result, index) => {
      //   console.log(`Sheet ${index + 1}: ${result.panels.length} panels, efficiency: ${result.efficiency.toFixed(1)}%`);
      // });
      
      // Store results temporarily instead of showing immediately
      pendingResultsRef.current = finalResults;
      
      // Generate placements for simulation
      const placements: Placement[] = [];
      finalResults.forEach((result, sheetIndex) => {
        result.panels.forEach(panel => {
          placements.push({
            sheetId: String(sheetIndex + 1),
            panelId: panel.id,
            x: panel.x,
            y: panel.y,
            width: panel.width,
            height: panel.height,
            rotated: panel.rotated
          });
        });
      });
      setPlacements(placements);
      
      // Calculate actual loading duration based on actual sheet count
      const actualSheetCount = allResults.length;
      let actualLoadingDuration = 3000; // Default 3 seconds for <5 sheets
      
      if (actualSheetCount >= 30) {
        actualLoadingDuration = 8000; // 8 seconds for 30+ sheets
      } else if (actualSheetCount >= 20) {
        actualLoadingDuration = 6000; // 6 seconds for 20-30 sheets
      } else if (actualSheetCount >= 10) {
        actualLoadingDuration = 4000; // 4 seconds for 10-20 sheets
      } else if (actualSheetCount >= 5) {
        actualLoadingDuration = 3500; // 3.5 seconds for 5-10 sheets
      }
      
      if (silent) {
        // 화면·썸네일·시뮬레이션에 같은 최신 결과를 적용한다(빈 결과 포함).
        setOptimizationResults(finalResults);
        const index = Math.max(0, Math.min(currentSheetIndex, finalResults.length - 1));
        setCurrentSheetIndex(index);
        setSelectedSheetId(finalResults.length ? String(index + 1) : undefined);
        pendingResultsRef.current = [];
        setIsOptimizing(false);
      } else {
        // Ensure minimum loading duration based on sheet count
        const elapsedTime = Date.now() - animationStartTime;
        const remainingTime = Math.max(0, actualLoadingDuration - elapsedTime);

        // Complete to 100% after minimum time
        setTimeout(() => {
          if (!isCurrent()) return;
          // Clear any remaining interval
          if (progressInterval) clearInterval(progressInterval);

          // Animate to 100%
          setAILoadingProgress(100);

          // Hide AI loading modal after showing 100% briefly
          setTimeout(async () => {
            if (!isCurrent()) return;
            setShowAILoading(false);
            setAILoadingProgress(0);

            if (allResults.length > 0) {
              const totalPanels = allResults.reduce((sum, r) => sum + r.panels.length, 0);
              const avgEfficiency = allResults.reduce((sum, r) => sum + r.efficiency, 0) / allResults.length;

              // Show success popup and wait for confirmation
              await showToast(t('cnc.optimizationComplete', { panels: totalPanels, sheets: allResults.length, efficiency: avgEfficiency.toFixed(1) }), 'success', t('common.confirm'));

              if (!isCurrent()) return;
              // After user clicks confirm, show the results
              setOptimizationResults(pendingResultsRef.current);

              // Set appropriate sheet index
              if (currentSheetIndex >= pendingResultsRef.current.length && pendingResultsRef.current.length > 0) {
                setCurrentSheetIndex(pendingResultsRef.current.length - 1);
              } else if (currentSheetIndex < 0 && pendingResultsRef.current.length > 0) {
                setCurrentSheetIndex(0);
              }

              // Clear pending results
              pendingResultsRef.current = [];
            } else {
              await showToast(t('cnc.optimizationFailed'), 'error', t('common.confirm'));
            }
          }, 300); // Show 100% for 300ms
        }, remainingTime);
      }
    } catch (error) {
      if (!isCurrent()) return;
      console.error('❌ Optimization error:', error);
      console.error('❌ Stack:', error instanceof Error ? error.stack : '');
      if (progressInterval) clearInterval(progressInterval);
      if (!silent) {
        setShowAILoading(false);
        setAILoadingProgress(0);
        const errMsg = error instanceof Error ? error.message : String(error);
        showToast(`최적화 실패: ${errMsg}`, 'error', t('common.confirm'));
      }
    } finally {
      if (isCurrent()) setIsOptimizing(false);
    }
  }, [panels, excludedPanelIds, stock, settings, currentSheetIndex, setPlacements, setCurrentSheetIndex, setSawStats, setSelectedSheetId, setSimulating, setFullSimulating, drawingStorageKey, t]);

  // 시뮬레이션 완료 콜백 - 전체 시뮬레이션 모드일 때 다음 시트로 진행
  const handleSimulationComplete = useCallback(() => {
    console.log('=== Simulation Complete ===', {
      fullSimulating,
      fullSimCurrentSheet,
      fullSimTotalSheets,
      currentSheetIndex
    });

    if (fullSimulating) {
      const nextSheet = fullSimCurrentSheet + 1;
      if (nextSheet < fullSimTotalSheets) {
        // 다음 시트로 진행
        console.log(`Moving to next sheet: ${nextSheet + 1}/${fullSimTotalSheets}`);
        setFullSimCurrentSheet(nextSheet);
        setCurrentSheetIndex(nextSheet);
        setSelectedSheetId(String(nextSheet + 1));
        // 잠시 후 시뮬레이션 재시작
        setTimeout(() => {
          setSimulating(true);
        }, 500);
      } else {
        // 모든 시트 시뮬레이션 완료 - 통계 팝업 표시
        console.log('All sheets simulation completed');
        setFullSimulating(false);
        setFullSimCurrentSheet(0);

        // 통계 데이터 계산
        const totalPanels = optimizationResults.reduce((sum, r) => sum + r.panels.length, 0);
        const avgEfficiency = optimizationResults.length > 0
          ? optimizationResults.reduce((sum, r) => sum + r.efficiency, 0) / optimizationResults.length
          : 0;

        setSimulationStatsData({
          sheetCount: fullSimTotalSheets,
          totalCutLength: sawStats.total,
          avgEfficiency,
          totalPanels
        });
        setShowSimulationStats(true);
      }
    } else {
      // 단일 시트 시뮬레이션 완료 - 해당 시트 통계 팝업 표시
      const currentResult = optimizationResults[currentSheetIndex];
      if (currentResult) {
        const sheetCutLength = sawStats.bySheet[String(currentSheetIndex + 1)] || 0;
        setSimulationStatsData({
          sheetCount: 1,
          totalCutLength: sheetCutLength,
          avgEfficiency: currentResult.efficiency,
          totalPanels: currentResult.panels.length
        });
        setShowSimulationStats(true);
      }
    }
  }, [fullSimulating, fullSimCurrentSheet, fullSimTotalSheets, currentSheetIndex, setFullSimCurrentSheet, setCurrentSheetIndex, setSelectedSheetId, setSimulating, setFullSimulating, optimizationResults, sawStats]);

  // handleOptimize ref 최신 유지 (setTimeout closure 문제 방지)
  handleOptimizeRef.current = handleOptimize;

  // Auto-optimize effect - must be after handleOptimize definition
  // stockInitializedFromLive가 true일 때만 실행 (localStorage의 stale stock 방지)
  useEffect(() => {
    // Only auto-optimize when we have actual furniture panels from livePanels
    // Don't auto-optimize for empty or manually added panels
    // stock이 livePanels 기반으로 초기화된 후에만 실행
    if (!preserved && !hasAutoOptimized.current && (cuttingBoard || livePanels.length > 0) && panels.length > 0 && stock.length > 0 && stockInitializedFromLive.current) {
      hasAutoOptimized.current = true;

      // 더 긴 딜레이로 settings가 완전히 로드된 후 실행
      // ref를 통해 최신 handleOptimize 호출 (closure 문제 방지)
      initialOptimizeTimer.current = setTimeout(() => {
        console.log('🚀 Auto-optimize with settings:', settings.optimizationType);
        if (!manualPlacementRef.current) handleOptimizeRef.current?.();
      }, 300);
    }
  }, [livePanels, panels, stock, settings.optimizationType, handleOptimize]);

  // 체크 변경은 초기 계산·수동 배치 여부와 무관하게 즉시 반영한다.
  // 조립 재생은 같은 제외 목록을 표시용으로 쓰므로 재생 도중에는 재배치하지 않는다.
  const exclusionSignature = JSON.stringify([...excludedPanelIds].sort());
  const previousExclusions = useRef(exclusionSignature);
  useEffect(() => {
    if (assemblyPlaying || previousExclusions.current === exclusionSignature) return;
    previousExclusions.current = exclusionSignature;
    if (initialOptimizeTimer.current) clearTimeout(initialOptimizeTimer.current);
    hasAutoOptimized.current = true;
    void handleOptimize(undefined, true);
  }, [exclusionSignature, assemblyPlaying, handleOptimize]);

  // 패널 수정(결방향/재질/두께 변경 등) 시 자동 재최적화
  const prevPanelsRef = useRef<string>('');
  const prevStockRef = useRef<string>('');
  useEffect(() => {
    if (!hasAutoOptimized.current || panels.length === 0 || stock.length === 0) return;
    // panels의 치수/재질뿐 아니라 보링 데이터 변경도 재최적화 대상이다.
    const panelsSig = panels.map(p => [
      p.id,
      p.grain,
      p.width,
      p.length,
      p.material,
      p.thickness,
      p.boringPositions?.join(',') || '',
      p.boringDepthPositions?.join(',') || '',
      p.boringDepthGroups?.map(group => `${group.y}:${group.depthPositions.join(',')}:${group.boringType || ''}`).join(';') || '',
      p.sideBoringPositions?.join(',') || '',
      p.sideBoringDiameter || '',
      p.sideBoringDepth || '',
    ].join(':')).join('|');
    const stockSig = stock.map(s => `${s.material}:${s.thickness}`).join('|');
    const panelsChanged = prevPanelsRef.current && prevPanelsRef.current !== panelsSig;
    const stockChanged = prevStockRef.current && prevStockRef.current !== stockSig;
    if (skipPanelAutoOptimize.current) {
      skipPanelAutoOptimize.current = false;
      prevPanelsRef.current = panelsSig;
      prevStockRef.current = stockSig;
      return;
    }
    if (panelsChanged || stockChanged) {
      console.log('🔄 패널/stock 변경 감지 → 자동 재최적화 (silent)', { panelsChanged, stockChanged });
      handleOptimize(undefined, true);
    }
    prevPanelsRef.current = panelsSig;
    prevStockRef.current = stockSig;
  }, [panels, stock, handleOptimize]);

  // URL 파라미터에서 프로젝트명 읽기 (fallback용)
  const urlProjectName = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const name = searchParams.get('projectName');
    return name ? decodeURIComponent(name) : null;
  }, [location.search]);

  const projectName = urlProjectName || basicInfo?.title || 'New Project';
  
  // 컷팅 메소드 드롭다운 컴포넌트
  const CuttingMethodDropdown = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const methodLabels = {
      'OPTIMAL_L': t('cnc.optimalL'),
      'OPTIMAL_W': t('cnc.optimalW'), 
      'OPTIMAL_CNC': t('cnc.optimalCNC')
    };

    // 드롭다운 외부 클릭 감지
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowDropdown(false);
        }
      };

      if (showDropdown) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showDropdown]);

    const handleMethodChange = (method: 'OPTIMAL_L' | 'OPTIMAL_W' | 'OPTIMAL_CNC') => {
      console.log('🔄 handleMethodChange called with:', method);
      setSettings({ optimizationType: method });
      setShowDropdown(false);
      // handleOptimize에 직접 method를 전달하여 클로저 문제 방지
      handleOptimize(method);
    };

    return (
      <div className={styles.dropdownContainer} ref={dropdownRef}>
        <button 
          className={styles.dropdownButton}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <span>{methodLabels[settings.optimizationType || 'OPTIMAL_CNC']}</span>
          <ChevronDown size={14} className={showDropdown ? styles.rotated : ''} />
        </button>
        
        {showDropdown && (
          <div className={styles.dropdownMenu}>
            {Object.entries(methodLabels).map(([key, label]) => (
              <button
                key={key}
                className={`${styles.dropdownItem} ${settings.optimizationType === key ? styles.active : ''}`}
                onClick={() => handleMethodChange(key as 'OPTIMAL_L' | 'OPTIMAL_W' | 'OPTIMAL_CNC')}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 재단 목록과 시뮬레이션이 같은 Cut Tree / CutOperation[]을 사용한다.
  const cutPlans = useMemo(() => buildOptimizerCutPlans(preservingPlacement ? [] : optimizationResults, {
    kerf: settings.kerf, optimizationType: settings.optimizationType, trimLeft: settings.trimLeft,
    trimRight: settings.trimRight, trimTop: settings.trimTop, trimBottom: settings.trimBottom,
  }),
    [optimizationResults, settings.optimizationType, settings.kerf, settings.trimLeft, settings.trimRight, settings.trimTop, settings.trimBottom, preservingPlacement]);
  const allCutSteps = cutPlans.cuts;

  const quote = useMemo(() => manufacturingQuote(
    panels.filter(panel => !excludedPanelIds.has(panel.id)).map(panel => ({
      ...panel, name: panel.label, height: panel.length, color: 'MW', material: panel.material || 'PB',
      grain: panel.grain === 'H' ? 'HORIZONTAL' : panel.grain === 'V' ? 'VERTICAL' : 'NONE',
    })), optimizationResults, {
      preservingPlacement, cutCount: allCutSteps.length, cutErrors: cutPlans.errors,
      nesting: settings.optimizationType === 'OPTIMAL_CNC',
    }), [panels, excludedPanelIds, optimizationResults, preservingPlacement, allCutSteps.length, cutPlans.errors, settings.optimizationType]);
  const manufacturingCost = quote.total;
  const sheetManufacturingCosts = quote.groups;
  const totalMaterialCost = quote.materialCost;
  const cuttingCost = quote.cuttingCost ?? 0;
  const cabinetSizes = useMemo(() => {
    const internalSpace = calculateInternalSpace(spaceInfo);
    return assemblyCabinets(placedModules, quote.furnitureIds, m => {
      const placedModule = placedModules.find(item => item.id === m.id)!;
      return (placedModule as typeof placedModule & { moduleData?: ReturnType<typeof getModuleById> }).moduleData
        || getModuleById(placedModule.moduleId, internalSpace, spaceInfo)
        || buildModuleDataFromPlacedModule(placedModule);
    });
  }, [placedModules, spaceInfo, quote.furnitureIds]);
  const assemblyPending = quote.placed.length > 0 && (Boolean(sketchConversion)
    || cabinetSizes.some(c => ![c.width, c.height, c.depth].every(n => Number.isFinite(n) && n > 0)));
  const assemblyCost = calculateAssemblyCost(cabinetSizes.filter(c => [c.width, c.height, c.depth].every(n => Number.isFinite(n) && n > 0)));
  const quoteIssues = [...quote.issues, ...(assemblyPending ? ['조립 대상 가구의 규격 확인이 필요합니다.'] : []),
    ...(isOptimizing ? ['배치 계산 중입니다.'] : [])];

  const totalManufacturingAndMaterialCost = manufacturingCost.totalCost
    + totalMaterialCost
    + cuttingCost
    + assemblyCost.totalCost;

  // Update saw stats when cut steps change
  useEffect(() => {
    setSawStats(computeSawStats(allCutSteps, 'm'));
  }, [allCutSteps, setSawStats]);

  // 화면상 시트 방향 판별 (rotation 반영)
  const isVisuallyPortrait = (() => {
    const sp = optimizationResults[currentSheetIndex]?.stockPanel;
    if (!sp) return false;
    const isRotated = Math.abs(viewerRotation % 180) === 90;
    return isRotated ? sp.width > sp.height : sp.height > sp.width;
  })();

  const addSheetButton = <button className={styles.addSheetButton}
    disabled={isOptimizing || showAILoading || simulating || fullSimulating || stock.length === 0}
    onClick={() => setShowAddSheet(true)}><Plus size={18} /><span>시트 추가</span></button>;

  return (
    <div className={styles.container} data-theme="light">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Logo size="large" onClick={() => navigate('/')} noAnimation />
          <h1>{t('cnc.title')}</h1>
          <span className={styles.projectName}>
            {(() => {
              console.log('🎯 CNC Optimizer 헤더 렌더링:', {
                projectName,
                designFileName,
                hasProjectName: !!projectName,
                hasDesignFileName: !!designFileName,
                projectNameValue: projectName,
                designFileNameValue: designFileName,
                basicInfo
              });

              if (projectName && designFileName) {
                console.log('✅ 프로젝트명과 디자인파일명 둘 다 있음');
                return (
                  <>
                    {projectName} <span style={{ margin: '0 8px', opacity: 0.5 }}>›</span> <span style={{ color: 'var(--theme-primary)' }}>{designFileName}</span>
                  </>
                );
              } else if (projectName) {
                console.log('⚠️ 프로젝트명만 있음 (디자인파일명 없음)');
                return projectName;
              } else if (designFileName) {
                console.log('⚠️ 디자인파일명만 있음 (프로젝트명 없음)');
                return <span style={{ color: 'var(--theme-primary)' }}>{designFileName}</span>;
              } else {
                console.log('❌ 둘 다 없음');
                return 'New Project';
              }
            })()}
          </span>
        </div>
        
        <div className={styles.headerRight}>
          <button className={styles.simulationButton}
            disabled={!optimizationResults[currentSheetIndex] || optimizationResults[currentSheetIndex]?.isOversized || isOptimizing || showAILoading || simulating || fullSimulating}
            onClick={() => setDrawingSheet(currentSheetIndex)}
            title="선택한 원장의 빈 공간에 패널을 직접 그립니다">
            <PencilRuler size={18} /><span>원장에 그리기</span>
          </button>
          <CuttingMethodDropdown />
          <div className={styles.divider} />
          <button
            className={`${styles.calculateButton} ${methodChanged ? styles.highlighted : ''}`}
            onClick={() => handleOptimize()}
            disabled={isOptimizing || panels.length === 0}
          >
            <Play size={18} />
            <span>{t('cnc.calculate')}</span>
          </button>
          <button
            className={`${styles.simulationButton} ${fullSimulating ? styles.simulating : ''}`}
            onClick={() => {
              setSimulating(false);
              setFullSimulating(false);
              setLayoutReplay(structuredClone({ results: optimizationResults, cuts: allCutSteps, plans: cutPlans.plans, planErrors: cutPlans.errors, kerf: settings.kerf, mode: settings.optimizationType }));
            }}
            disabled={optimizationResults.length === 0 || preservingPlacement || isOptimizing || showAILoading}
            title={preservingPlacement ? "위치 유지 배치에는 자동 재단 경로가 없습니다" : fullSimulating ? "전체 시뮬레이션 정지" : "전체 시트 시뮬레이션"}
          >
            {fullSimulating ? <Pause size={18} /> : <GiCircularSawblade size={18} />}
            <span>{fullSimulating ? '정지' : '전체 시뮬레이션'}</span>
          </button>
          {settings.optimizationType !== 'OPTIMAL_CNC' && cutPlans.errors.some(Boolean) &&
            <span role="alert" title={cutPlans.errors.filter(Boolean).join(' · ')}>재단 경로 미완성 · 재단비 확정 불가</span>}
          <div className={styles.exportGroup}>
            <ExportBar cuttingBoard={cuttingBoard}
              optimizationResults={optimizationResults}
              shelfBoringPositions={customShelfPositionsByFurniture}
            />
          </div>
          <div className={styles.divider} />
          <button
            className={styles.settingsButton}
            onClick={() => setShowSettings(true)}
            title={t('cnc.settings')}
            type="button"
          >
            <Settings2 size={16} />
          </button>
          <div className={styles.divider} />
          <button
            className={styles.exitButton}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowExitConfirm(true);
            }}
            type="button"
          >
            <LogOut size={16} />
            {t('cnc.exit')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${styles.main} ${viewSwapped ? styles.mainSwapped : ''}`}>
        {/* Left Sidebar */}
        <div className={styles.leftSidebar}>
          <PanelsTable cuttingBoard={cuttingBoard} results={optimizationResults} />
        </div>

        {/* Center - Preview */}
        <div className={styles.centerPanel}>
          {viewSwapped ? (
            /* 스왑 모드: 3D 뷰어가 메인 중앙에 표시 */
            <div className={styles.viewerContainer}>
              <button className={styles.swapButton} onClick={handleSwapView} title="뷰어 위치 변경">
                <ArrowLeftRight size={14} />
              </button>
              <div className={styles.mainViewer}>
                <PanelHighlight3DViewer
                  highlightedPanelName={hoveredPanelName}
                  highlightedFurnitureId={hoveredFurnitureId}
                  excludedMeshNames={excludedMeshNames}
                />
              </div>
            </div>
          ) : optimizationResults.length > 0 ? (
            <div className={`${styles.viewerContainer} ${isVisuallyPortrait ? styles.viewerContainerPortrait : ''}`}>
              <div className={styles.mainViewer}>
                <CuttingLayoutPreview2
                  result={optimizationResults[currentSheetIndex]}
                  highlightedPanelId={selectedPanelId}
                  showLabels={settings.labelsOnPanels}
                  onPanelClick={(id) => {
                    setSelectedPanelId(id);
                    // 현재 시트의 배치된 패널에서 meshName/furnitureId 찾기
                    const currentResult = optimizationResults[currentSheetIndex];
                    const placedPanel = currentResult?.panels.find(p => p.id === id);
                    if (placedPanel?.meshName && placedPanel?.furnitureId) {
                      setHoveredPanel(placedPanel.meshName, placedPanel.furnitureId);
                    } else {
                      // 원본 패널에서 찾기 (id가 suffix 포함된 경우)
                      const baseId = id?.replace(/-\d+$/, '');
                      const origPanel = panels.find(p => p.id === baseId || p.id === id);
                      if (origPanel?.meshName && origPanel?.furnitureId) {
                        setHoveredPanel(origPanel.meshName, origPanel.furnitureId);
                      } else {
                        setHoveredPanel(null, null);
                      }
                    }
                  }}
                  allowRotation={!settings.considerGrain}
                  // 뷰어 상태 동기화
                  scale={viewerScale}
                  rotation={viewerRotation}
                  offset={viewerOffset}
                  onScaleChange={setViewerScale}
                  onRotationChange={setViewerRotation}
                  onOffsetChange={setViewerOffset}
                  sheetInfo={{
                    currentIndex: currentSheetIndex,
                    totalSheets: optimizationResults.length,
                    onOptimize: handleOptimize,
                    isOptimizing: isOptimizing,
                    stock: stock
                  }}
                  onCurrentSheetIndexChange={setCurrentSheetIndex}
                  showCuttingListTab={showCuttingList}
                  allCutSteps={allCutSteps}
                  boringData={boringPanels}
                  shelfBoringPositions={customShelfPositionsByFurniture}
                  onSimulationComplete={handleSimulationComplete}
                  simulationAvailable={!preservingPlacement}
                />
              </div>

              <div className={isVisuallyPortrait ? styles.thumbnailBarVertical : styles.thumbnailBar}>
                <div className={isVisuallyPortrait ? styles.thumbnailScrollVertical : styles.thumbnailScroll}>
                  {optimizationResults.map((result, index) => (
                    <SheetThumbnail
                      key={index}
                      result={result}
                      index={index}
                      isActive={index === currentSheetIndex}
                      onClick={() => setCurrentSheetIndex(index)}
                      portrait={isVisuallyPortrait}
                      rotation={viewerRotation}
                    />
                  ))}
                  {addSheetButton}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyPreview}>
              <Cpu size={48} />
              <h3>{t('cnc.noResults')}</h3>
              <p>{t('cnc.setupHint')}</p>
              {addSheetButton}
              <button
                className={`${styles.optimizeButtonLarge} ${styles.primary}`}
                onClick={() => handleOptimize()}
                disabled={isOptimizing}
              >
                {isOptimizing ? t('cnc.optimizing') : t('cnc.generatePanels')}
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - 3D Viewer + Stats */}
        <div className={styles.rightSidebar}>
          <div className={styles.rightSidebarContent}>
            {/* 3D 패널 하이라이트 뷰어 / 스왑 시 커팅 레이아웃 축소 */}
            {cuttingBoard ? null : viewSwapped ? (
              /* 스왑 모드: 패널 뷰어 + 우측 썸네일 바 */
              <div className={styles.swappedViewerRow}>
                <div className={`${styles.viewer3dContainer} ${styles.viewer3dContainerSwapped}`}>
                  <button className={styles.swapButton} onClick={handleSwapView} title="뷰어 위치 변경">
                    <ArrowLeftRight size={14} />
                  </button>
                  {optimizationResults.length > 0 ? (
                    <CuttingLayoutPreview2
                      result={optimizationResults[currentSheetIndex]}
                      highlightedPanelId={selectedPanelId}
                      showLabels={settings.labelsOnPanels}
                      onPanelClick={(id) => {
                        setSelectedPanelId(id);
                        const currentResult = optimizationResults[currentSheetIndex];
                        const placedPanel = currentResult?.panels.find(p => p.id === id);
                        if (placedPanel?.meshName && placedPanel?.furnitureId) {
                          setHoveredPanel(placedPanel.meshName, placedPanel.furnitureId);
                        } else {
                          const baseId = id?.replace(/-\d+$/, '');
                          const origPanel = panels.find(p => p.id === baseId || p.id === id);
                          if (origPanel?.meshName && origPanel?.furnitureId) {
                            setHoveredPanel(origPanel.meshName, origPanel.furnitureId);
                          } else {
                            setHoveredPanel(null, null);
                          }
                        }
                      }}
                      allowRotation={!settings.considerGrain}
                      rotation={viewerRotation}
                      onRotationChange={setViewerRotation}
                      sheetInfo={{
                        currentIndex: currentSheetIndex,
                        totalSheets: optimizationResults.length,
                        onOptimize: handleOptimize,
                        isOptimizing: isOptimizing,
                        stock: stock
                      }}
                      onCurrentSheetIndexChange={setCurrentSheetIndex}
                      showCuttingListTab={showCuttingList}
                      allCutSteps={allCutSteps}
                      boringData={boringPanels}
                      shelfBoringPositions={customShelfPositionsByFurniture}
                      onSimulationComplete={handleSimulationComplete}
                      simulationAvailable={!preservingPlacement}
                    />
                  ) : null}
                </div>
                {optimizationResults.length > 0 && (
                  <div className={styles.thumbnailBarVertical}>
                    <div className={styles.thumbnailScrollVertical}>
                      {optimizationResults.map((result, index) => (
                        <SheetThumbnail
                          key={index}
                          result={result}
                          index={index}
                          isActive={index === currentSheetIndex}
                          onClick={() => setCurrentSheetIndex(index)}
                          portrait
                          rotation={viewerRotation}
                        />
                      ))}
                      {addSheetButton}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.viewer3dContainer}>
                <button className={styles.swapButton} onClick={handleSwapView} title="뷰어 위치 변경">
                  <ArrowLeftRight size={14} />
                </button>
                <PanelHighlight3DViewer
                  highlightedPanelName={hoveredPanelName}
                  highlightedFurnitureId={hoveredFurnitureId}
                  excludedMeshNames={excludedMeshNames}
                />
              </div>
            )}

            {!viewSwapped && <div className={styles.statsCard}>
              <div className={styles.statsCardTitle}>
                <h3>{t('cnc.totalStats')}</h3>
                <button
                  className={styles.foldButton}
                  onClick={() => setShowTotalStats(!showTotalStats)}
                >
                  {showTotalStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {showTotalStats && (
              <div className={styles.statsDetail}>
                <div className={styles.statRow}>
                  <span>{t('cnc.sheets')}</span>
                  <div className={styles.statValue}>
                    <strong>{optimizationResults.length}</strong>
                  </div>
                </div>
                <div className={styles.statRow}>
                  <span>{t('cnc.usedArea')}</span>
                  <div className={styles.statValue}>
                    <strong>{(optimizationResults.reduce((sum, r) => sum + r.usedArea, 0) / 1000000).toFixed(1)}</strong>
                    <span className={styles.statPercent}>
                      {optimizationResults.length > 0
                        ? Math.round(optimizationResults.reduce((sum, r) => sum + r.efficiency, 0) / optimizationResults.length)
                        : 0}%
                    </span>
                  </div>
                </div>
                <div className={styles.statRow}>
                  <span>{t('cnc.wasteArea')}</span>
                  <div className={styles.statValue}>
                    <strong>{(optimizationResults.reduce((sum, r) => sum + r.wasteArea, 0) / 1000000).toFixed(1)}</strong>
                    <span className={styles.statPercent}>
                      {optimizationResults.length > 0
                        ? Math.round((100 - optimizationResults.reduce((sum, r) => sum + r.efficiency, 0) / optimizationResults.length))
                        : 0}%
                    </span>
                  </div>
                </div>
                <div className={styles.statRow}>
                  <span>{t('cnc.totalPanels')}</span>
                  <div className={styles.statValue}>
                    <strong>{optimizationResults.reduce((sum, r) => sum + r.panels.length, 0)}</strong>
                  </div>
                </div>
                <div className={styles.statRow}>
                  <span>{t('cnc.cutCount')}</span>
                  <div className={styles.statValue}>
                    <strong>{allCutSteps.length}</strong>
                  </div>
                </div>
                <div className={styles.statRow}>
                  <span>{t('cnc.cutLength')}</span>
                  <div className={styles.statValue}>
                    <strong>{sawStats.total.toFixed(2)}m</strong>
                  </div>
                </div>
                <div className={styles.statRow}>
                  <span>{t('cnc.bladeThickness')}</span>
                  <div className={styles.statValue}>
                    <strong>{settings.kerf ?? 5}mm</strong>
                  </div>
                </div>
                <div className={styles.statRow}>
                  <span>{t('cnc.stock')}</span>
                  <div className={styles.statValue}>
                    {stock.length > 0 ? `${stock[0].width}×${stock[0].length}` : '-'}
                  </div>
                </div>
                <div className={styles.statRow}>
                  <span>{t('cnc.optimization')}</span>
                  <div className={styles.statValue}>
                    {settings.optimizationType === 'OPTIMAL_CNC' ? t('cnc.minWaste') : 
                     settings.optimizationType === 'BY_LENGTH' ? t('cnc.verticalCut') : t('cnc.horizontalCut')}
                  </div>
                </div>
              </div>
              )}
            </div>}

            {!viewSwapped && canViewManufacturingCost && (
              <div className={styles.statsCard}>
                <div className={styles.statsCardTitle}>
                  <h3>배치분 제조비 (부가세 별도)</h3>
                </div>
                <div className={styles.statsDetail}>
                  <div className={styles.statRow}>
                    <span>엣지 가공 {manufacturingCost.edgeLengthM.toFixed(2)}m</span>
                    <div className={styles.statValue}><strong>{manufacturingCost.edgeCost.toLocaleString()}원</strong></div>
                  </div>
                  <div className={styles.statRow}>
                    <span>엣지 자재 {manufacturingCost.edgeLengthM.toFixed(2)}m</span>
                    <div className={styles.statValue}><strong>{manufacturingCost.edgeMaterialCost.toLocaleString()}원</strong></div>
                  </div>
                  <div className={styles.statRow}>
                    <span>보링 홀 {manufacturingCost.boringHoleCount}개</span>
                    <div className={styles.statValue}><strong>{manufacturingCost.boringCost.toLocaleString()}원</strong></div>
                  </div>
                  <div className={styles.statRow}>
                    <span>경첩보링 {manufacturingCost.hingeBoringCount}개</span>
                    <div className={styles.statValue}><strong>{manufacturingCost.hingeBoringCost.toLocaleString()}원</strong></div>
                  </div>
                  <div className={styles.statRow}>
                    <span>홈파기 {manufacturingCost.grooveLineCount}라인</span>
                    <div className={styles.statValue}><strong>{manufacturingCost.grooveCost.toLocaleString()}원</strong></div>
                  </div>
                  <div className={styles.statRow}>
                    <span>재단 {quote.cuttingCost === null ? '미산정' : `${allCutSteps.length}컷`}</span>
                    <div className={styles.statValue}><strong>{quote.cuttingCost === null ? '미산정' : `${cuttingCost.toLocaleString()}원`}</strong></div>
                  </div>
                  <div className={styles.statRow}>
                    <span>조립/포장 큰통 {assemblyCost.largeCount} · 작은거 {assemblyCost.smallCount}</span>
                    <div className={styles.statValue}><strong>{assemblyPending ? `${assemblyCost.totalCost.toLocaleString()}원 + 미산정` : `${assemblyCost.totalCost.toLocaleString()}원`}</strong></div>
                  </div>
                  <div className={styles.statRow}>
                    <span>자재 {optimizationResults.length}장</span>
                    <div className={styles.statValue}><strong>{quote.materialCosts.some(c => c === null) ? `${totalMaterialCost.toLocaleString()}원 + 미산정` : `${totalMaterialCost.toLocaleString()}원`}</strong></div>
                  </div>
                  <div className={`${styles.statRow} ${styles.manufacturingTotal}`}>
                    <span>{quoteIssues.length ? '산정된 항목 소계' : '합계'}</span>
                    <div className={styles.statValue}><strong>{totalManufacturingAndMaterialCost.toLocaleString()}원</strong></div>
                  </div>
                  {quoteIssues.length > 0 && <div className={styles.quoteStatus} role="status" data-quote-incomplete="true">
                    <strong>견적 미확정</strong>
                    <ul>{quoteIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>
                  </div>}
                </div>
              </div>
            )}

            {!viewSwapped && optimizationResults[currentSheetIndex] && (
              <div className={styles.statsCard}>
                <div className={styles.statsCardTitle}>
                  <h3>{t('cnc.sheetStats')}</h3>
                  <button
                    className={styles.foldButton}
                    onClick={() => setShowSheetStats(!showSheetStats)}
                  >
                    {showSheetStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                {showSheetStats && (
                <>
                <div className={styles.statsCardHeader}>
                  <button 
                    className={styles.statsNavButton}
                    onClick={() => setCurrentSheetIndex(Math.max(0, currentSheetIndex - 1))}
                    disabled={currentSheetIndex === 0}
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <h3>{t('cnc.sheet')} {currentSheetIndex + 1} / {optimizationResults.length}</h3>
                  <button 
                    className={styles.statsNavButton}
                    onClick={() => setCurrentSheetIndex(Math.min(optimizationResults.length - 1, currentSheetIndex + 1))}
                    disabled={currentSheetIndex === optimizationResults.length - 1}
                  >
                    <ArrowRight size={14} />
                  </button>
                  <button 
                    className={`${styles.playButton} ${simulating ? styles.playing : ''}`}
                    onClick={() => {
                      if (simulating) {
                        // 시뮬레이션 정지
                        setSimulating(false);
                      } else {
                        // 현재 시트의 컷팅 시뮬레이션 시작
                        setSelectedPanelId(null); // Clear selected panel for full sheet simulation
                        setSelectedSheetId(String(currentSheetIndex + 1));
                        setSimulating(true);
                      }
                    }}
                    disabled={preservingPlacement}
                    title={preservingPlacement ? "위치 유지 배치에는 자동 재단 경로가 없습니다" : simulating ? "시뮬레이션 정지" : "컷팅 시뮬레이션"}
                  >
                    {simulating ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                </div>
                <div className={styles.statsDetail}>
                  <div className={styles.statRow}>
                    <span>{t('cnc.panelCount')}</span>
                    <div className={styles.statValue}>
                      <strong>{optimizationResults[currentSheetIndex].panels.length}</strong>
                    </div>
                  </div>
                  <div className={styles.statRow}>
                    <span>{t('cnc.efficiency')}</span>
                    <div className={styles.statValue}>
                      <strong>{optimizationResults[currentSheetIndex].efficiency.toFixed(1)}%</strong>
                    </div>
                  </div>
                  <div className={styles.statRow}>
                    <span>{t('cnc.usedArea')}</span>
                    <div className={styles.statValue}>
                      <strong>{(optimizationResults[currentSheetIndex].usedArea / 1000000).toFixed(2)}㎡</strong>
                    </div>
                  </div>
                  <div className={styles.statRow}>
                    <span>{t('cnc.wasteArea')}</span>
                    <div className={styles.statValue}>
                      <strong>{(optimizationResults[currentSheetIndex].wasteArea / 1000000).toFixed(2)}㎡</strong>
                    </div>
                  </div>
                  <div className={styles.statRow}>
                    <span>{t('cnc.cutCount')}</span>
                    <div className={styles.statValue}>
                      <strong>{
                        allCutSteps.filter(step => step.sheetNumber === currentSheetIndex + 1).length
                      }</strong>
                    </div>
                  </div>
                  <div className={styles.statRow}>
                    <span>{t('cnc.cutLength')}</span>
                    <div className={styles.statValue}>
                      <strong>{sawStats.bySheet[String(currentSheetIndex + 1)] 
                        ? sawStats.bySheet[String(currentSheetIndex + 1)].toFixed(2) + 'm'
                        : '0.00m'}</strong>
                    </div>
                  </div>
                  {canViewManufacturingCost && sheetManufacturingCosts[currentSheetIndex] && (
                    <>
                      <div className={styles.manufacturingSectionTitle}>Sheet 제조비 (주문 올림액 배분 · 부가세 별도)</div>
                      <div className={styles.statRow}>
                        <span>엣지 가공 {sheetManufacturingCosts[currentSheetIndex].edgeLengthM.toFixed(2)}m</span>
                        <div className={styles.statValue}><strong>{sheetManufacturingCosts[currentSheetIndex].edgeCost.toLocaleString()}원</strong></div>
                      </div>
                      <div className={styles.statRow}>
                        <span>엣지 자재 {sheetManufacturingCosts[currentSheetIndex].edgeLengthM.toFixed(2)}m</span>
                        <div className={styles.statValue}><strong>{sheetManufacturingCosts[currentSheetIndex].edgeMaterialCost.toLocaleString()}원</strong></div>
                      </div>
                      <div className={styles.statRow}>
                        <span>보링 홀 {sheetManufacturingCosts[currentSheetIndex].boringHoleCount}개</span>
                        <div className={styles.statValue}><strong>{sheetManufacturingCosts[currentSheetIndex].boringCost.toLocaleString()}원</strong></div>
                      </div>
                      <div className={styles.statRow}>
                        <span>경첩보링 {sheetManufacturingCosts[currentSheetIndex].hingeBoringCount}개</span>
                        <div className={styles.statValue}><strong>{sheetManufacturingCosts[currentSheetIndex].hingeBoringCost.toLocaleString()}원</strong></div>
                      </div>
                      <div className={styles.statRow}>
                        <span>홈파기 {sheetManufacturingCosts[currentSheetIndex].grooveLineCount}라인</span>
                        <div className={styles.statValue}><strong>{sheetManufacturingCosts[currentSheetIndex].grooveCost.toLocaleString()}원</strong></div>
                      </div>
                      <div className={styles.statRow}>
                        <span>자재 1장</span>
                        <div className={styles.statValue}><strong>{quote.materialCosts[currentSheetIndex] === null ? '미산정' : `${quote.materialCosts[currentSheetIndex].toLocaleString()}원`}</strong></div>
                      </div>
                      <div className={`${styles.statRow} ${styles.manufacturingTotal}`}>
                        <span>Sheet 가공·자재 소계 (재단·조립 별도)</span>
                        <div className={styles.statValue}><strong>{(
                          sheetManufacturingCosts[currentSheetIndex].totalCost
                          + (quote.materialCosts[currentSheetIndex] ?? 0)
                        ).toLocaleString()}원{quote.materialCosts[currentSheetIndex] === null ? ' + 미산정' : ''}</strong></div>
                      </div>
                    </>
                  )}
                </div>
                </>
                )}
              </div>
            )}

            {/* Sheet List with Tabs */}
            {!viewSwapped && optimizationResults.length > 0 && (
              <div className={`${styles.statsCard} ${styles.sheetListCard}`}>
                <div className={styles.sheetListHeader}>
                  <div className={styles.tabButtons}>
                    <button 
                      className={`${styles.tabButton} ${!showCuttingList ? styles.active : ''}`}
                      onClick={() => setShowCuttingList(false)}
                    >
                      {t('cnc.sheetList')}
                    </button>
                    <button 
                      className={`${styles.tabButton} ${showCuttingList ? styles.active : ''}`}
                      onClick={() => setShowCuttingList(true)}
                    >
                      {t('cnc.cuttingList')}
                    </button>
                  </div>
                </div>
                
                {!showCuttingList ? (
                  <div className={styles.sheetList}>
                    {optimizationResults.map((result, index) => {
                      // 시트의 원자재 정보 찾기
                      const stockLabel = result.stockPanel.id || `${result.stockPanel.material}_${result.stockPanel.width}x${result.stockPanel.height}`;
                      const isExpanded = expandedSheets.has(index);
                      
                      return (
                        <div key={index} className={styles.sheetItemContainer}>
                          <div 
                            className={`${styles.sheetItem} ${index === currentSheetIndex ? styles.active : ''}`}
                            onClick={() => {
                              setCurrentSheetIndex(index);
                              // 시트 클릭 시 자동으로 펼치기
                              setExpandedSheets(prev => {
                                const newSet = new Set(prev);
                                if (!newSet.has(index)) {
                                  newSet.add(index);
                                }
                                return newSet;
                              });
                            }}
                          >
                            <button
                              className={styles.expandButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedSheets(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(index)) {
                                    newSet.delete(index);
                                  } else {
                                    newSet.add(index);
                                  }
                                  return newSet;
                                });
                              }}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            <span className={styles.sheetNumber}>
                              {index + 1}
                            </span>
                            <span className={styles.sheetInfo}>
                              {stockLabel}
                              {(result as any).isOversized && (
                                <span style={{ marginLeft: 6, padding: '1px 6px', background: '#ff9800', color: '#fff', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>비규격</span>
                              )}
                            </span>
                            <span className={styles.sheetPanels}>
                              {result.panels.length}개
                            </span>
                            <span className={styles.sheetEfficiency}>
                              {result.efficiency.toFixed(0)}%
                            </span>
                            <button
                              className={`${styles.sheetPlayButton} ${simulating && currentSheetIndex === index && !fullSimulating ? styles.playing : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                // 해당 시트만 시뮬레이션
                                if (simulating && currentSheetIndex === index) {
                                  setSimulating(false);
                                } else {
                                  setFullSimulating(false); // 전체 시뮬레이션 아님
                                  setCurrentSheetIndex(index);
                                  setSelectedPanelId(null);
                                  setSelectedSheetId(String(index + 1));
                                  setSimulating(true);
                                }
                              }}
                              title={simulating && currentSheetIndex === index ? "시뮬레이션 정지" : `시트 ${index + 1} 시뮬레이션`}
                            >
                              {simulating && currentSheetIndex === index && !fullSimulating ? <Pause size={12} /> : <Play size={12} />}
                            </button>
                          </div>
                          
                          {isExpanded && (
                            <div className={styles.panelListContainer}>
                              {result.panels.map((panel, panelIndex) => (
                                <div 
                                  key={`panel-${index}-${panelIndex}`}
                                  className={`${styles.panelItem} ${selectedPanelId === panel.id ? styles.selectedPanel : ''} panel-clickable`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const panelId = panel.id;
                                    setSelectedPanelId(panelId);
                                    setCurrentSheetIndex(index);
                                    // 3D 뷰어 하이라이트
                                    if (panel.meshName && panel.furnitureId) {
                                      setHoveredPanel(panel.meshName, panel.furnitureId);
                                    } else {
                                      setHoveredPanel(null, null);
                                    }
                                  }}
                                >
                                  <span className={styles.panelName}>{panel.name || `Panel ${panel.id}`}</span>
                                  <span className={styles.panelSize}>
                                    {formatPanelMm(panel.width)} × {formatPanelMm(panel.height)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.cutsList}>
                    <div className={styles.cutsTableHeader}>
                      <span className={styles.cutsCol1}>#</span>
                      <span className={styles.cutsCol2}>Panel</span>
                      <span className={styles.cutsCol3}>Cut</span>
                      <span className={styles.cutsCol4}>Result</span>
                    </div>
                    <div className={styles.cutsTableBody}>
                      {(() => {
                        // Group cuts by sheet for per-sheet numbering
                        const cutsBySheet = new Map<number, typeof allCutSteps>();
                        allCutSteps.forEach(cut => {
                          if (!cutsBySheet.has(cut.sheetNumber)) {
                            cutsBySheet.set(cut.sheetNumber, []);
                          }
                          cutsBySheet.get(cut.sheetNumber)!.push(cut);
                        });
                        
                        let globalIdx = 0;
                        const rows = [];
                        
                        // Render cuts grouped by sheet with restart numbering
                        for (const [sheetNum, sheetCuts] of cutsBySheet) {
                          sheetCuts.forEach((cut, localIdx) => {
                            const currentGlobalIdx = globalIdx++;
                            rows.push(
                              <div 
                                key={`cut-${sheetNum}-${localIdx}`}
                                className={`${styles.cutsRow} ${selectedCutId === cut.id ? styles.selected : ''}`}
                                onClick={() => {
                                  // 해당 패널과 시트 선택
                                  setSelectedSheetId(cut.sheetId);
                                  selectCutId(cut.id);
                                  if (cut.yieldsPanelId) {
                                    selectPanel(cut.yieldsPanelId, cut.sheetId);
                                    setCurrentSheetIndex(cut.sheetNumber - 1);
                                  }
                                  selectCutIndex(currentGlobalIdx);
                                }}
                                onDoubleClick={() => {
                                  if (cut.yieldsPanelId) {
                                    selectPanel(cut.yieldsPanelId, cut.sheetId);
                                    setCurrentSheetIndex(cut.sheetNumber - 1);
                                    setSimulating(true);
                                  }
                                }}
                              >
                                <span className={styles.cutsCol1}>{localIdx + 1}</span>
                                <span className={styles.cutsCol2}>
                                  {formatSize(cut.before.width, cut.before.length)}
                                </span>
                                <span className={styles.cutsCol3}>
                                  {`${cut.axis}=${Math.round(cut.pos)}`}
                                </span>
                                <span className={styles.cutsCol4}>
                                  {cut.yieldsPanelId ? 
                                    `${formatSize(cut.result.width || 0, cut.result.length || 0)} \\ -` :
                                    `- \\ surplus`}
                                </span>
                              </div>
                            );
                          });
                        }
                        
                        return rows;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showAddSheet && <AddSheetDialog busy={isOptimizing || showAILoading} stock={stock} current={optimizationResults[currentSheetIndex]}
        onClose={() => setShowAddSheet(false)} onAdd={index => {
          const added = addSheet(optimizationResults, stock, index, settings);
          saveSheetDrawing(drawingStorageKey, { panels, stock: added.stock, settings, excluded: [...excludedPanelIds], source: livePanels }, added.results);
          skipPanelAutoOptimize.current = added.stock !== stock;
          hasAutoOptimized.current = true;
          setPanels(panels, true);
          if (added.stock !== stock) setStock(added.stock);
          setManualPlacement(true);
          setOptimizationResults(added.results);
          setCurrentSheetIndex(added.results.length - 1);
          setSelectedPanelId(null);
          setViewerOffset({ x: 0, y: 0 });
          setShowAddSheet(false);
        }} />}
      {drawingSheet !== null && optimizationResults[drawingSheet] && <SheetDrawingEditor
        result={optimizationResults[drawingSheet]}
        settings={settings}
        viewTurns={((viewerRotation / 90) % 4 + 4) % 4}
        onClose={() => setDrawingSheet(null)}
        onApply={board => {
          const applied = applySheetDrawing(optimizationResults[drawingSheet], panels, board, settings);
          const results = optimizationResults.map((result, index) => index === drawingSheet ? applied.result : result);
          saveSheetDrawing(drawingStorageKey, { panels: applied.panels, stock, settings, excluded: [...excludedPanelIds], source: livePanels }, results);
          skipPanelAutoOptimize.current = hasAutoOptimized.current;
          setPanels(applied.panels, true);
          setManualPlacement(true);
          setOptimizationResults(results);
          setPlacements(results.flatMap((result, index) => result.panels.map(panel => ({
            ...panel, panelId: panel.id, sheetId: String(index + 1),
          }))));
          setSelectedPanelId(null);
          setDrawingSheet(null);
        }}
      />}

      {/* AI Loading Modal */}
      <AILoadingModal 
        isOpen={showAILoading}
        progress={aiLoadingProgress}
        message={t('cnc.aiOptimizing')}
        duration={aiLoadingDuration}
      />
      
      {layoutReplay && <React.Suspense fallback={<div role="status">가공 화면을 여는 중입니다.</div>}>
        <LayoutReplayDialog snapshot={layoutReplay} onClose={() => setLayoutReplay(null)} />
      </React.Suspense>}
      {/* Simulation Stats Modal */}
      <SimulationStatsModal
        isOpen={showSimulationStats && simulationStatsData !== null}
        onClose={() => setShowSimulationStats(false)}
        stats={simulationStatsData || { sheetCount: 0, totalPanels: 0, totalCutLength: 0, avgEfficiency: 0 }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsChange={handleOptimize}
      />

      {/* Exit Confirmation Modal */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onConfirm={async () => {
          if (cuttingBoard) { navigate(-1); return; }
          console.log('Exit confirmed! Navigating to configurator...');
          // 현재 URL의 search params를 유지하면서 configurator로 이동
          // skipLoad=true로 기존 스토어 데이터(배치 가구 등) 유지
          const params = new URLSearchParams(location.search);
          params.set('skipLoad', 'true');
          if (sketchConversion?.workspace) {
            const { restoreDesignWorkspace } = await import('@/lib/optimizer/upstream/editor/Configurator/designWorkspace');
            restoreDesignWorkspace({ workspace: sketchConversion.workspace });
            params.set('returnMode', sketchConversion.editMode || 'sketch');
          }
          navigate(`/configurator?${params.toString()}`);
        }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
}

export default function CNCOptimizerPro(){
  const location = useLocation();
  const cutting = useMemo(() => {
    try { return { transfer: readCuttingBoardInput(location.search), error: '' }; }
    catch (error) { return { transfer: null, error: error instanceof Error ? error.message : '컷팅보드 데이터를 읽지 못했습니다.' }; }
  }, [location.search]);
  const fromCuttingBoard = new URLSearchParams(location.search).get('source') === 'cutting-board';
  const [ready, setReady] = useState(false);
  const snapshot = useConversionStore(s => s.cnc);
  useEffect(() => {
    let active = true;
    if (fromCuttingBoard) { setReady(true); return; }
    restoreCncConversion().finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  if (cutting.error) return <div role="alert">{cutting.error}<button onClick={() => window.history.back()}>돌아가기</button></div>;
  if (!ready) return <div role="status">컨버팅 데이터를 불러오는 중...</div>;
  if (new URLSearchParams(window.location.search).get('source') === 'sketch' && !snapshot) {
    return <div role="alert">컨버팅 데이터를 찾을 수 없습니다. 편집기에서 다시 컨버팅해 주세요.
      <button onClick={() => window.history.back()}>돌아가기</button>
    </div>;
  }
  return (
    <CNCProvider key={cutting.transfer?.id ?? 'live'} initialInput={cutting.transfer?.input} storagePrefix={cutting.transfer ? `cnc_cutting_${cutting.transfer.id}` : 'cnc'}>
      <PageInner drawingStorageKey={cutting.transfer ? `cnc_cutting_${cutting.transfer.id}_drawing` : 'cnc_drawing'} cuttingBoard={!!cutting.transfer} preserved={cutting.transfer?.preserved} preservedViewRotation={cutting.transfer?.viewRotation} />
    </CNCProvider>
  );
}
