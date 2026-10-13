import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import type { SheetCutPlan } from '@/lib/optimizer/upstream/utils/cut/guillotine';
import type { CutStep } from '@/lib/optimizer/upstream/types/cutlist';
import type { OptimizedResult } from '../types';
import MachiningReplay from './MachiningReplay';
import { layoutReplayProgram, videoProgramsFromLayout } from './layoutReplayProgram';
import { referenceProgram } from './referenceProgram';
import { referenceRouting } from './routingPaths';
import { useSpaceConfigStore } from '@/lib/optimizer/upstream/store/core/spaceConfigStore';
import styles from './LayoutReplayDialog.module.css';

const ReplayVideoExport = lazy(() => import('./ReplayVideoExport'));

export interface LayoutReplaySnapshot {
  results: OptimizedResult[];
  cuts: Array<CutStep & { sheetNumber: number }>;
  plans: Array<SheetCutPlan | null>;
  planErrors?: Array<string | null>;
  kerf: number;
  mode?: string;
}

/** GPU/소재 제거 오류가 나도 옵티마이저와 열려 있던 배치는 보존한다. */
class ReplayBoundary extends React.Component<{ children: React.ReactNode; onClose: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className={styles.error} role="alert">
      <h2>3D 재생을 계속할 수 없습니다.</h2>
      <p>원장 배치는 그대로 유지되어 있습니다.</p>
      <button onClick={this.props.onClose}>옵티마이저로 돌아가기</button>
    </div> : this.props.children;
  }
}

/** 계산 결과를 그대로 받는다. 열린 동안 원본 배치·설정·저장 설계는 변경하지 않는다. */
export default function LayoutReplayDialog({ snapshot, onClose }: { snapshot: LayoutReplaySnapshot; onClose: () => void }) {
  const [sheetIndex, setSheetIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(4);
  const [diameter, setDiameter] = useState(180), [rpm, setRpm] = useState(3000);
  const [routing, setRouting] = useState(referenceRouting);
  const material = useSpaceConfigStore(state => state.spaceInfo.materialConfig);
  // 사용자 지정 1mm. 도어 특수엣지의 정면 표시 폭과는 별도다.
  const [tapeThickness, setTapeThickness] = useState('1');
  const [runningAll, setRunningAll] = useState(false);
  const [completedAll, setCompletedAll] = useState(false), [replaySerial, setReplaySerial] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
  const closeVideo = useCallback(() => setVideoOpen(false), []);
  const replayOptions = useMemo(() => {
    const saw = referenceProgram.tools[0];
    if (saw.kind !== 'saw') throw new Error('톱 공구가 없습니다.');
    return { kerf: snapshot.kerf, saw: { ...saw, diameter, rpm }, feedMmPerSecond: 400, routing,
      banding: Number(tapeThickness) > 0 ? { thickness: Number(tapeThickness), material: material ?? {} } : undefined };
  }, [snapshot.kerf, diameter, rpm, routing, tapeThickness, material]);
  const replay = useMemo(() => {
    try { return { program: layoutReplayProgram(snapshot, sheetIndex, replayOptions) }; }
    catch (error) { return { error: error instanceof Error ? error.message : String(error) }; }
  }, [snapshot, sheetIndex, replayOptions]);
  const makeVideoPrograms = useCallback(() => videoProgramsFromLayout(snapshot, replayOptions), [snapshot, replayOptions]);
  const changeSheet = (index: number) => { setRunningAll(false); setCompletedAll(false); setSheetIndex(index); };
  return <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="전체 가공 시뮬레이션">
    <div className={styles.workspace} hidden={videoOpen}>
    <div className={styles.toolbar}>
      <strong className={styles.title}>재단·가공 시뮬레이션</strong>
      <div className={styles.sheets}><button aria-label="이전 원장" disabled={sheetIndex === 0} onClick={() => changeSheet(sheetIndex - 1)}><ChevronLeft size={18} /></button>
        <strong>원장 {sheetIndex + 1} / {snapshot.results.length}</strong><button aria-label="다음 원장" disabled={sheetIndex === snapshot.results.length - 1} onClick={() => changeSheet(sheetIndex + 1)}><ChevronRight size={18} /></button></div>
      <span className={styles.kerf}>톱날 절단폭 <b>{snapshot.kerf} mm</b> · 옵티마이저 설정</span>
      <details className={styles.toolSettings}><summary>공구 설정</summary><div>
        <label>지름(mm)<input aria-label="톱 지름" type="number" value={diameter} min={50} onChange={e => { setRunningAll(false); setDiameter(Number(e.target.value)); }} /></label>
        <label>회전수(rpm)<input aria-label="톱 회전수" type="number" value={rpm} min={1} onChange={e => { setRunningAll(false); setRpm(Number(e.target.value)); }} /></label>
        <label>루터 지름(mm)<input aria-label="루터 지름" type="number" value={routing.diameter} min={1} onChange={e=>{setRunningAll(false);setRouting(v=>({...v,diameter:Number(e.target.value)}));}} /></label>
        <label>루터 패스 깊이(mm)<input aria-label="루터 패스 깊이" type="number" value={routing.maxPassDepth} min={.1} step={.1} onChange={e=>{setRunningAll(false);setRouting(v=>({...v,maxPassDepth:Number(e.target.value)}));}} /></label>
        <label>루터 회전수(rpm)<input aria-label="루터 회전수" type="number" value={routing.rpm} min={1} onChange={e=>{setRunningAll(false);setRouting(v=>({...v,rpm:Number(e.target.value)}));}} /></label>
        <p>좁은 홈은 홈 폭에 맞는 참조 공구로 전환합니다.</p>
        <label>엣지 테이프 두께(mm)<input aria-label="엣지 테이프 두께" type="number" min={.1} max={3} step={.1} placeholder="실제 두께 입력" value={tapeThickness} onChange={e=>{setRunningAll(false);setTapeThickness(e.target.value);}} /></label>
        <p>테이프 두께만큼 프리밀링한 뒤 부착해 완성 치수를 유지합니다. 설계의 엣지 색·적용 면을 따릅니다. 장비는 단면 자동 밴더 참조 모델입니다.</p>
        <p>지름·회전수·외형은 시험값입니다. 실제 장비 공구표와 대조 전입니다. 화면 재생 속도는 가공 이송속도 검증값이 아닙니다.</p>
      </div></details>
      <button disabled={runningAll && !completedAll} onClick={() => { setSheetIndex(0); setRunningAll(true); setCompletedAll(false); setReplaySerial(v => v + 1); }}>{completedAll ? '첫 원장부터 다시 재생' : runningAll ? '전체 재생 중' : '첫 원장부터 이어 재생'}</button>
      <button disabled={!!replay.error} onClick={() => setVideoOpen(true)}><Download size={15} /> 영상 저장</button>
      <span className={styles.referenceNote} title="배치·절단폭·MPR 보링 데이터 기반 참조 공정입니다. 작업자 재투입을 포함하며 실제 기종·NC의 운전 순서와 대조 전입니다.">참조 공정 · 기계 NC 미대조</span>
      <button aria-label="시뮬레이션 닫기" onClick={onClose}><X size={20} /></button>
    </div>
    {replay.error ? <div role="alert" className={styles.error}><h2>현재 배치를 보존하기 위해 재생을 보류했습니다.</h2><p>{replay.error}</p><button onClick={onClose}>옵티마이저로 돌아가기</button></div> : replay.program && <>
      {!!replay.program.machiningAudit?.omitted.length && <details className={styles.incomplete}><summary>미재생 가공 {replay.program.machiningAudit.omitted.length}건</summary><p>{replay.program.machiningAudit.omitted.join(' · ')}. 해당 가공까지 완료된 판재로 판단하지 마십시오.</p></details>}
      {!!replay.program.layoutAudit?.uncutEdges.length && <div className={styles.incomplete} role="alert">
        <strong>현재 재단 목록만으로는 패널 분리가 끝나지 않습니다.</strong>
        <span>추가 재단이 필요한 변 {replay.program.layoutAudit.uncutEdges.length}곳: {replay.program.layoutAudit.uncutEdges.join(', ')}. 아래 화면은 전달된 목록만 재생합니다.</span>
      </div>}
      <div className={styles.replay}><ReplayBoundary key={sheetIndex} onClose={onClose}><MachiningReplay key={`${sheetIndex}-${runningAll}-${replaySerial}`} program={replay.program} suspended={videoOpen} playbackSpeed={playbackSpeed} onPlaybackSpeedChange={setPlaybackSpeed} layoutResult={snapshot.results[sheetIndex]} autoPlay={runningAll} onComplete={() => {
        if (!runningAll) return;
        if (sheetIndex + 1 < snapshot.results.length) setSheetIndex(sheetIndex + 1); else setCompletedAll(true);
      }} /></ReplayBoundary></div>
    </>}
    </div>
    {videoOpen && <Suspense fallback={<div role="status">영상 저장 준비 중…</div>}><ReplayVideoExport makePrograms={makeVideoPrograms} onClose={closeVideo} /></Suspense>}
  </div>;
}
