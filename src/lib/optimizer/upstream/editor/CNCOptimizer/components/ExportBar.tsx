// @ts-nocheck — [Befun] 원본(250709in, Vite 빌드는 타입 검사 안 함)에 있던 strict 타입 오류. 로직 수정 없이 검사만 끔. upstream/README.md 참고
import { useFeature, useFeatureAccessStore, canUseFeature } from '@/lib/optimizer/upstream/access/store';
import MprMachineSettings from '@/lib/optimizer/upstream/editor/shared/controls/boring/MprMachineSettings';
import { useMprMachineProfileStore } from '@/lib/optimizer/upstream/editor/shared/controls/boring/mprMachineProfileStore';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCNCStore } from '../store';
import { exportPanelsCsv, exportStockCsv } from '../../../utils/cutlist/export';
import { PDFExporter } from '../utils/pdfExporter';
import { SimpleDXFExporter } from '../utils/simpleDxfExporter';
import {
  exportBoringToCSV
} from '../utils/csvExporter';
import {
  exportToMPR,
  exportToCIX,
  encodeMPRContent,
  encodeMPRZipFileName,
  getMprCompanionFiles,
} from '@/lib/optimizer/upstream/domain/boring/exporters';
import JSZip from 'jszip';
import { OptimizedResult, PlacedPanel, Panel } from '../types';
import { Download, FileText, FileDown, Package, Layers, ChevronDown, Circle, Cpu } from 'lucide-react';
import { doc, getDoc } from '@/lib/optimizer/upstream/shims/firebase-firestore';
import { useAuth } from '@/lib/optimizer/upstream/auth/AuthProvider';
import { db } from '@/lib/optimizer/upstream/firebase/config';
import { sendPartnerRegistrationRequest } from '@/lib/optimizer/upstream/firebase/partnerRegistration';
import { useFurnitureStore } from '@/lib/optimizer/upstream/store/core/furnitureStore';
import { useSpaceConfigStore } from '@/lib/optimizer/upstream/store/core/spaceConfigStore';
import { useProjectStore } from '@/lib/optimizer/upstream/store/core/projectStore';
import { convertPlacedPanelToMprBoringData } from '../utils/mprPanelConversion';
import { buildMprAssemblyMetadata } from '../utils/mprAssemblyMetadata';
import styles from './ExportBar.module.css';

interface ExportBarProps {
  cuttingBoard?: boolean;
  optimizationResults: OptimizedResult[];
  shelfBoringPositions?: Record<string, number[]>; // 가구별 보링 위치 (moduleKey -> positions)
}

interface PartnerRequestForm {
  companyName: string;
  contact: string;
  equipment: string;
  message: string;
}


const EMPTY_PARTNER_REQUEST_FORM: PartnerRequestForm = {
  companyName: '',
  contact: '',
  equipment: '',
  message: ''
};

export default function ExportBar({ optimizationResults, cuttingBoard = false }: ExportBarProps){
  const { user } = useAuth();
  const machineProfile = useMprMachineProfileStore(state => state.profile);
  const [machineSettingsOpen, setMachineSettingsOpen] = useState(false);
  const { panels, stock } = useCNCStore();
  const modulePlacements = useFurnitureStore((state) => state.placedModules);
  const placedModules = useMemo(() => cuttingBoard ? [] : modulePlacements, [cuttingBoard, modulePlacements]);
  const spaceInfo = useSpaceConfigStore((state) => state.spaceInfo);
  const basicInfo = useProjectStore((state) => state.basicInfo);

  const [isOpen, setIsOpen] = useState(false);
  const accessLoading = useFeatureAccessStore(state => !state.ready);
  const canUseExport = useFeature('cncExport');
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [partnerRequestForm, setPartnerRequestForm] = useState<PartnerRequestForm>(EMPTY_PARTNER_REQUEST_FORM);
  const [requestSending, setRequestSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 보링이 있는 패널 수 계산 (패널에 직접 boringPositions가 포함됨)
  const panelsWithBoring = useMemo(() => {
    const allPanels: PlacedPanel[] = [];
    optimizationResults.forEach(result => {
      result.panels.forEach(panel => {
        if ((panel.boringPositions && panel.boringPositions.length > 0) ||
            (panel.sideBoringPositions && panel.sideBoringPositions.length > 0)) {
          allPanels.push(panel);
        }
      });
    });
    return allPanels;
  }, [optimizationResults]);

  const optimizedPanels = useMemo(() => {
    const allPanels: PlacedPanel[] = [];
    optimizationResults.forEach(result => {
      result.panels.forEach(panel => allPanels.push(panel));
    });
    return allPanels;
  }, [optimizationResults]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExportButtonClick = () => {
    if (accessLoading) return;

    if (!canUseExport) {
      setIsOpen(false);
      setAccessModalOpen(true);
      setRequestStatus('');
      return;
    }

    setIsOpen(!isOpen);
  };

  const requireManufacturerExportAccess = () => {
    if (accessLoading) return false;
    if (canUseFeature('cncExport')) return true;

    setIsOpen(false);
    setAccessModalOpen(true);
    setRequestStatus('');
    return false;
  };

  const openPartnerRequest = () => {
    setAccessModalOpen(false);
    setRequestModalOpen(true);
    setRequestSent(false);
    setRequestStatus('');
  };

  const closePartnerRequest = () => {
    setRequestModalOpen(false);
    setRequestSending(false);
    setRequestSent(false);
    setRequestStatus('');
    setPartnerRequestForm(EMPTY_PARTNER_REQUEST_FORM);
  };

  const updatePartnerRequestField = (field: keyof PartnerRequestForm, value: string) => {
    setPartnerRequestForm((prev) => ({
      ...prev,
      [field]: value
    }));
    setRequestStatus('');
  };

  const handleSendPartnerRequest = async () => {
    if (!user) {
      setRequestStatus('로그인 후 협력업체 등록 요청을 보낼 수 있습니다.');
      return;
    }

    const companyName = partnerRequestForm.companyName.trim();
    const contact = partnerRequestForm.contact.trim();
    const equipment = partnerRequestForm.equipment.trim();
    const note = partnerRequestForm.message.trim();

    if (!companyName || !contact || !equipment) {
      setRequestStatus('업체명, 담당자 연락처, 보유 CNC 장비를 입력해주세요.');
      return;
    }

    const message = [
      `업체명: ${companyName}`,
      `담당자/연락처: ${contact}`,
      `보유 CNC 장비: ${equipment}`,
      note ? `추가 요청사항: ${note}` : '',
      user.email ? `로그인 이메일: ${user.email}` : ''
    ].filter(Boolean).join('\n');

    setRequestSending(true);
    setRequestStatus('');

    try {
      await sendPartnerRegistrationRequest({ message });
      setRequestSent(true);
      setRequestStatus('');
    } catch (error) {
      console.error('협력업체 등록 요청 실패:', error);
      setRequestStatus('요청 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setRequestSending(false);
    }
  };
  
  const handleExportPanels = () => {
    if (panels.length === 0) {
      alert('내보낼 패널이 없습니다.');
      return;
    }
    exportPanelsCsv(panels, 'project');
    setIsOpen(false);
  };

  const handleExportStock = () => {
    if (stock.length === 0) {
      alert('내보낼 원자재가 없습니다.');
      return;
    }
    exportStockCsv(stock, 'project');
    setIsOpen(false);
  };

  const handleExportPDF = async () => {
    if (optimizationResults.length === 0) {
      alert('최적화 결과가 없습니다. 먼저 최적화를 실행하세요.');
      return;
    }
    
    const panelsArray = Array.isArray(panels) ? panels : [];
    
    const furnitureData = {
      projectName: basicInfo?.title || 'Project',
      spaceInfo: spaceInfo,
      placedModules: placedModules,
      panels: panelsArray,
      needsConfiguratorView: true
    };
    
    // ZIP 파일로 내보내기 (전체 PDF + 개별 시트 PDF들)
    try {
      await PDFExporter.exportToZIP(optimizationResults, furnitureData);
    } catch (error) {
      alert(error instanceof Error ? error.message : '재단 PDF 내보내기에 실패했습니다.');
      return;
    }
    setIsOpen(false);
  };

  const handleExportDXF = () => {
    if (optimizationResults.length === 0) {
      alert('최적화 결과가 없습니다. 먼저 최적화를 실행하세요.');
      return;
    }

    let dxfContent: string;
    try {
      dxfContent = SimpleDXFExporter.exportToDXF(optimizationResults);
    } catch (error) {
      // 확정되지 않은 가공이 있으면 파일을 만들지 않고 사유를 그대로 보여 준다.
      alert(error instanceof Error ? error.message : 'DXF 내보내기에 실패했습니다.');
      return;
    }

    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    a.download = `cutting_layout_${timestamp}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  // 보링 좌표 CSV 내보내기
  const handleExportBoringCSV = () => {
    if (panelsWithBoring.length === 0) {
      alert('내보낼 보링 데이터가 없습니다. 측판이 있는 가구를 배치하세요.');
      return;
    }

    // 최적화 결과에서 모든 패널 추출
    const allPanels: Panel[] = [];
    optimizationResults.forEach(result => {
      result.panels.forEach(panel => {
        allPanels.push(panel);
      });
    });

    let boringCSV: string;
    try {
      boringCSV = exportBoringToCSV(allPanels, spaceInfo.panelThickness ?? 18);
    } catch (error) {
      alert(error instanceof Error ? error.message : '보링 CSV 내보내기에 실패했습니다.');
      return;
    }
    const timestamp = new Date().toISOString().slice(0, 10);
    const projectName = basicInfo?.title || 'project';

    // BOM 추가하여 한글 인코딩 지원
    const blob = new Blob(['\uFEFF' + boringCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_boring_${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  // imos MPR 내보내기
  const handleExportMPR = async () => {
    if (!requireManufacturerExportAccess()) return;

    // 모든 패널 수집 (보링 유무와 무관하게 재단 데이터 필요)
    if (optimizedPanels.length === 0) {
      alert('내보낼 패널 데이터가 없습니다.');
      return;
    }

    if (optimizedPanels.some(p => p.cuttingBoardShape?.cuts.length || p.cuttingBoardShape?.profile)) {
      alert('컷팅보드 곡선 외곽·구멍·따내기의 MPR/CIX 변환은 아직 지원하지 않습니다. 가공 형상이 포함된 DXF 또는 컷팅보드 파일을 사용해 주세요.');
      return;
    }
    const panelBoringData = optimizedPanels.map(convertPlacedPanelToMprBoringData);
    const projectName = basicInfo?.title || 'project';
    const timestamp = new Date().toISOString().slice(0, 10);

    // exportToMPR로 imos MPR 콘텐츠 생성
    const result = exportToMPR(panelBoringData, { machineProfile }, projectName);

    if (!result.success || result.files.length === 0) {
      alert('MPR 파일 생성에 실패했습니다: ' + (result.error || '보링 데이터 없음'));
      if (!machineProfile) setMachineSettingsOpen(true);
      return;
    }

    // 패널별 개별 MPR 파일을 ZIP으로 묶어서 다운로드
    const zip = new JSZip();
    result.files.forEach(file => {
      zip.file(file.filename, encodeMPRContent(file.content), { binary: true });
    });
    getMprCompanionFiles(machineProfile).forEach(file => {
      zip.file(file.filename, encodeMPRContent(file.content), { binary: true });
    });
    const assemblyMetadata = buildMprAssemblyMetadata({
      projectName,
      machineProfile,
      panels: optimizedPanels,
      mprPanels: panelBoringData,
      files: result.files,
      placedModules,
      spaceInfo,
    });
    zip.file('assembly.json', JSON.stringify(assemblyMetadata, null, 2));
    zip.file('manufacturing.json', JSON.stringify({ schemaVersion: 1, profile: machineProfile, generatedAt: new Date().toISOString(), validation: 'geometry-and-profile-checked', files: result.files.map((file, i) => ({ filename: file.filename, panelId: file.panelId ?? panelBoringData[i].panelId /* [Befun 확장] */ })) }, null, 2));

    const blob = await zip.generateAsync({
      type: 'blob',
      encodeFileName: encodeMPRZipFileName,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_mpr_${timestamp}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    setIsOpen(false);
  };

  // Biesse CIX 내보내기
  const handleExportCIX = async () => {
    if (!requireManufacturerExportAccess()) return;

    if (optimizedPanels.length === 0) {
      alert('내보낼 패널 데이터가 없습니다.');
      return;
    }

    if (optimizedPanels.some(p => p.cuttingBoardShape?.cuts.length || p.cuttingBoardShape?.profile)) {
      alert('컷팅보드 곡선 외곽·구멍·따내기의 MPR/CIX 변환은 아직 지원하지 않습니다. 가공 형상이 포함된 DXF 또는 컷팅보드 파일을 사용해 주세요.');
      return;
    }
    const panelBoringData = optimizedPanels.map(convertPlacedPanelToMprBoringData);
    const projectName = basicInfo?.title || 'project';
    const timestamp = new Date().toISOString().slice(0, 10);

    // exportToCIX로 CIX 콘텐츠 생성
    const result = exportToCIX(panelBoringData);

    if (!result.success || result.files.length === 0) {
      alert('CIX 파일 생성에 실패했습니다: ' + (result.error || '보링 데이터 없음'));
      return;
    }

    // 패널별 개별 CIX 파일을 ZIP으로 묶어서 다운로드
    const zip = new JSZip();
    result.files.forEach(file => {
      zip.file(file.filename, file.content);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_cix_${timestamp}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    setIsOpen(false);
  };

  const hasData = panels.length > 0 || stock.length > 0 || optimizationResults.length > 0;
  const hasBoringData = panelsWithBoring.length > 0;
  const hasOptimizedPanelData = optimizedPanels.length > 0;

  if (!canUseExport) return null;
  return (
    <div className={styles.exportDropdown} ref={dropdownRef}>
      <button 
        className={styles.exportMainButton}
        onClick={handleExportButtonClick}
        disabled={!hasData}
      >
        <Download size={16} />
        <span>Export</span>
        <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
      </button>
      
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.menuHeader}>내보내기 형식 선택</div>
          
          <button 
            className={styles.menuItem}
            onClick={handleExportPanels}
            disabled={panels.length === 0}
          >
            <Package size={16} />
            <div className={styles.menuItemContent}>
              <span className={styles.menuItemTitle}>패널 목록 (CSV)</span>
              <span className={styles.menuItemDesc}>패널 치수 및 수량 데이터</span>
            </div>
          </button>
          
          <button
            className={styles.menuItem}
            onClick={handleExportStock}
            disabled={stock.length === 0}
          >
            <Layers size={16} />
            <div className={styles.menuItemContent}>
              <span className={styles.menuItemTitle}>원자재 목록 (CSV)</span>
              <span className={styles.menuItemDesc}>원자재 규격 및 수량</span>
            </div>
          </button>

          <button
            className={styles.menuItem}
            onClick={handleExportBoringCSV}
            disabled={!hasBoringData}
          >
            <Circle size={16} />
            <div className={styles.menuItemContent}>
              <span className={styles.menuItemTitle}>보링 좌표 (CSV)</span>
              <span className={styles.menuItemDesc}>측판 선반핀 보링 X, Y, 직경, 깊이</span>
            </div>
          </button>

          <div className={styles.menuDivider} />

          <div className={styles.menuHeader}>CNC 제조사별 내보내기</div>
          {canUseExport && <button className={styles.menuItem} onClick={() => { setMachineSettingsOpen(true); setIsOpen(false); }}>
            <Cpu size={16} /><span>공장 MPR 가공 설정{machineProfile ? ` · ${machineProfile.machineName}` : ''}</span>
          </button>}

          <button
            className={styles.menuItem}
            onClick={handleExportMPR}
            disabled={!hasOptimizedPanelData || !canUseExport}
          >
            <Cpu size={16} />
            <div className={styles.menuItemContent}>
              <span className={styles.menuItemTitle}>HOMAG (MPR)</span>
              <span className={styles.menuItemDesc}>제조 파트너 전용 woodWOP 네이티브 형식</span>
            </div>
          </button>

          <button
            className={styles.menuItem}
            onClick={handleExportCIX}
            disabled={!hasOptimizedPanelData || !canUseExport}
          >
            <Cpu size={16} />
            <div className={styles.menuItemContent}>
              <span className={styles.menuItemTitle}>Biesse (CIX)</span>
              <span className={styles.menuItemDesc}>제조 파트너 전용 bSolid XML 형식</span>
            </div>
          </button>

          <div className={styles.menuDivider} />
          
          <button 
            className={styles.menuItem}
            onClick={handleExportDXF}
            disabled={optimizationResults.length === 0}
          >
            <FileDown size={16} />
            <div className={styles.menuItemContent}>
              <span className={styles.menuItemTitle}>CAD 도면 (DXF)</span>
              <span className={styles.menuItemDesc}>AutoCAD 호환 컷팅 레이아웃</span>
            </div>
          </button>
          
          <button 
            className={`${styles.menuItem} ${styles.recommended}`}
            onClick={handleExportPDF}
            disabled={optimizationResults.length === 0}
          >
            <FileText size={16} />
            <div className={styles.menuItemContent}>
              <span className={styles.menuItemTitle}>종합 리포트 (ZIP)</span>
              <span className={styles.menuItemDesc}>전체 PDF + 개별 시트 PDF + CSV + 요약</span>
            </div>
            <span className={styles.badge}>추천</span>
          </button>
        </div>
      )}

      {accessModalOpen && (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setAccessModalOpen(false)}>
          <div className={styles.accessModal} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <h3 className={styles.modalTitle}>Export 사용 제한</h3>
            <p className={styles.modalText}>제조사로 등록된 업체만 사용이 가능합니다.</p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setAccessModalOpen(false)}
              >
                닫기
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={openPartnerRequest}
              >
                협력업체 등록
              </button>
            </div>
          </div>
        </div>
      )}

      {requestModalOpen && (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={closePartnerRequest}>
          <div className={styles.requestModal} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            {requestSent ? (
              <>
                <h3 className={styles.modalTitle}>메시지가 전달되었습니다.</h3>
                <p className={styles.modalText}>협력업체 등록 요청을 확인한 뒤 연락드리겠습니다.</p>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={closePartnerRequest}
                  >
                    확인
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className={styles.modalTitle}>협력업체 등록 요청</h3>
                <div className={styles.requestForm}>
                  <label className={styles.formField}>
                    <span className={styles.fieldLabel}>업체명 <span className={styles.required}>*</span></span>
                    <input
                      className={styles.requestInput}
                      value={partnerRequestForm.companyName}
                      onChange={(event) => updatePartnerRequestField('companyName', event.target.value)}
                      placeholder="업체명을 입력해주세요."
                    />
                  </label>
                  <label className={styles.formField}>
                    <span className={styles.fieldLabel}>담당자/연락처 <span className={styles.required}>*</span></span>
                    <input
                      className={styles.requestInput}
                      value={partnerRequestForm.contact}
                      onChange={(event) => updatePartnerRequestField('contact', event.target.value)}
                      placeholder="담당자명과 연락처를 입력해주세요."
                    />
                  </label>
                  <label className={styles.formField}>
                    <span className={styles.fieldLabel}>보유 CNC 장비 <span className={styles.required}>*</span></span>
                    <input
                      className={styles.requestInput}
                      value={partnerRequestForm.equipment}
                      onChange={(event) => updatePartnerRequestField('equipment', event.target.value)}
                      placeholder="보유 장비명 또는 가공 가능 장비를 입력해주세요."
                    />
                  </label>
                  <label className={styles.formField}>
                    <span className={styles.fieldLabel}>추가 요청사항</span>
                    <textarea
                      className={styles.requestTextarea}
                      value={partnerRequestForm.message}
                      onChange={(event) => updatePartnerRequestField('message', event.target.value)}
                      placeholder="가공 가능 범위, 지역, 협업 요청 내용을 입력해주세요."
                      rows={5}
                    />
                  </label>
                </div>
                {requestStatus && (
                  <p className={styles.requestStatus}>{requestStatus}</p>
                )}
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={closePartnerRequest}
                    disabled={requestSending}
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleSendPartnerRequest}
                    disabled={requestSending}
                  >
                    {requestSending ? '전송 중...' : '요청 보내기'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {machineSettingsOpen && <div className={styles.modalOverlay}>
        <div className={styles.requestModal} role="dialog" aria-label="공장 MPR 가공 설정" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
          <MprMachineSettings />
          <button type="button" className={styles.secondaryButton} onClick={() => setMachineSettingsOpen(false)}>닫기</button>
        </div>
      </div>}
    </div>
  );
}
