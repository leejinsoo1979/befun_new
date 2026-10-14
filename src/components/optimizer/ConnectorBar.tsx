'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { OVVO_CONNECTORS } from '@/lib/optimizer/connectors/ovvo';
import type { ConnectorReport, ConnectorSelection } from '@/lib/optimizer/connectors/apply';
import { CLIP_SPEC_PENDING, PANEL_CONNECTOR_SYSTEMS, type PanelConnectorSystem } from '@/types/connectors';

interface ConnectorBarProps {
  selection: ConnectorSelection;
  report: ConnectorReport | null;
  onChange: (selection: ConnectorSelection) => void;
}

const FAMILY_LABEL: Record<string, string> = {
  milling: '밀링', 'end-drilling': '마구리 드릴', 'face-boring': '면 보링', 'drilling-housing': '드릴 하우징', dowel: '다웰', 'back-lock': '백패널 잠금',
};

/** 관리자용 접합부 커넥터 선택. 선택은 브라우저에 저장되고 옵티마이저 판재(MPR·시뮬레이션)에 반영된다. */
export function ConnectorBar({ selection, report, onChange }: ConnectorBarProps) {
  const [showDetail, setShowDetail] = useState(false);
  const system = selection.system ?? 'ovvo';
  const used = useMemo(() => [...new Set([selection.body, selection.back].filter((m): m is string => !!m))], [selection]);
  const specs = system === 'ovvo' ? used.map((model) => OVVO_CONNECTORS.find((c) => c.model === model)).filter((c) => !!c) : [];

  const select = (group: 'body' | 'back') => (
    <select
      value={selection[group] ?? ''}
      onChange={(e) => onChange({ ...selection, [group]: e.target.value || undefined })}
      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
    >
      <option value="">없음</option>
      {OVVO_CONNECTORS.map((c) => (
        <option key={c.model} value={c.model} disabled={!c.autoApplicable}>
          {`[${FAMILY_LABEL[c.family]}] ${c.name}${c.autoApplicable ? '' : ' — 자동 배치 불가'}`}
        </option>
      ))}
    </select>
  );

  const totalConnectors = Object.values(report?.connectorCount ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-700">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-1 font-semibold">패널 접합 방식
          <select value={system} onChange={(e) => { setShowDetail(false); onChange({ ...selection, system: e.target.value as PanelConnectorSystem }); }}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs">
            {PANEL_CONNECTOR_SYSTEMS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
        <Link href={`/assembly-guide?system=${system}`} className="font-semibold underline underline-offset-4">
          {system === 'ovvo' ? 'OVVO' : 'Tylko'} 시뮬레이션·조립 안내 ↗
        </Link>
        <span className="text-gray-500">관리자 선택 · 이 브라우저에 저장</span>
        {system === 'ovvo' && <>
          <label className="flex items-center gap-1">몸통(가로판·세로판) {select('body')}</label>
          <label className="flex items-center gap-1">백패널·보강대 {select('back')}</label>
        </>}
        {system === 'tylko-clip' && <p role="status" className="text-amber-700">{CLIP_SPEC_PENDING}</p>}
        {specs.map((spec) => (
          <label key={spec.model} className="flex items-center gap-1">
            {spec.model} 커터 공구번호
            <input
              type="number"
              min={1}
              value={selection.toolNumbers?.[spec.model] ?? ''}
              onChange={(e) => {
                const toolNumbers = { ...selection.toolNumbers };
                const value = Number(e.target.value);
                if (e.target.value && Number.isFinite(value)) toolNumbers[spec.model] = value;
                else delete toolNumbers[spec.model];
                onChange({ ...selection, toolNumbers });
              }}
              className="w-16 rounded border border-gray-300 bg-white px-1 py-0.5"
            />
          </label>
        ))}
        {report && (
          <span className="text-gray-500">
            접합부 {report.joints.length}곳 · 커넥터 {totalConnectors}개
            {report.warnings.length > 0 && <span className="ml-1 text-amber-600">· 확인 {report.warnings.length}건</span>}
          </span>
        )}
        {specs.length > 0 && (
          <button type="button" onClick={() => setShowDetail(!showDetail)} className="cursor-pointer text-gray-500 underline">
            {showDetail ? '규격 닫기' : '규격 보기'}
          </button>
        )}
      </div>
      {showDetail && (
        <div className="mt-2 space-y-2">
          {specs.map((spec) => (
            <div key={spec.model}>
              <p className="font-semibold">{spec.name} · 최소 두께 {spec.minThicknessMm}mm · {spec.parts} · {spec.cutter}</p>
              <ul className="ml-4 list-disc">
                {spec.ops.map((op, i) => (
                  <li key={i}>
                    {op.label}: {op.kind === 'slot' ? `폭 ${op.diameter} · 이동 ${op.travel}` : `Ø${op.diameter}${op.count ? ` × ${op.count}개(간격 ${op.pitch})` : ''}`} · 깊이 {op.depth}
                    {op.offset !== undefined ? ` · 기준에서 ${op.offset}` : ''}
                  </li>
                ))}
                <li>간격: 끝에서 {spec.spacing.edgeMin}{spec.spacing.edgeMax ? `~${spec.spacing.edgeMax}` : ' 이상'} · 중심 간격 {spec.spacing.ccMin}~{spec.spacing.ccMax}</li>
                {spec.notes.map((note, i) => <li key={`n${i}`} className="text-amber-700">{note}</li>)}
              </ul>
            </div>
          ))}
          {report?.warnings.map((w, i) => <p key={`w${i}`} className="text-amber-700">{w}</p>)}
        </div>
      )}
    </div>
  );
}
