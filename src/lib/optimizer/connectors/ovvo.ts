/**
 * OVVO 커넥터 카탈로그 (https://ovvotech.com/technical-downloads/ 의 설치 설명서·사양서, 2026-10-13 확인).
 *
 * 가공 위치 규칙
 * - end: 마구리(판재 끝 단면)가 상대 판재 면에 닿는 쪽. 두께 중앙, 마구리에서 판재 안쪽으로 가공.
 * - face: 상대 판재 면. 마구리 판재의 두께 중심선 위(offset이 있으면 마구리 판재 윗면에서 offset만큼 바깥).
 * - endFace: 마구리 판재의 윗면. 마구리 끝에서 offset만큼 안쪽.
 * 슬롯은 접합선 방향으로 travel(공구 중심 이동 거리)만큼 이동한다. 슬롯 길이 = travel + 폭.
 * notes에는 문서 간 불일치·미기재로 선택한 값을 남긴다. 공장 시험 가공으로 확인해야 한다.
 */

export type ConnectorFamily = 'milling' | 'end-drilling' | 'face-boring' | 'drilling-housing' | 'dowel' | 'back-lock';

export interface ConnectorOp {
  on: 'end' | 'face' | 'endFace';
  kind: 'slot' | 'hole';
  /** 구멍 지름 또는 슬롯 폭(=공구 지름) mm */
  diameter: number;
  depth: number;
  /** 슬롯 공구 중심 이동 거리 mm */
  travel?: number;
  /** 슬롯 중심을 커넥터 중심에서 접합선 방향으로 옮기는 거리 mm */
  shift?: number;
  /** 커넥터 하나당 구멍 수와 간격(접합선 방향) */
  count?: number;
  pitch?: number;
  offset?: number;
  label: string;
}

export interface ConnectorSpec {
  model: string;
  name: string;
  family: ConnectorFamily;
  releasable: boolean;
  minThicknessMm: number;
  ops: ConnectorOp[];
  /** 판재 끝에서 첫 커넥터 중심까지 / 커넥터 중심 간격 mm */
  spacing: { edgeMin: number; edgeMax?: number; ccMin: number; ccMax: number };
  cutter: string;
  parts: string;
  /** 접합부에 자동 배치할 수 있는지. false면 사유를 reason에 둔다. */
  autoApplicable: boolean;
  reason?: string;
  notes: string[];
  source: string;
}

const MILLING_SPACING_150 = { edgeMin: 35, edgeMax: 80, ccMin: 150, ccMax: 350 };
const MILLING_SPACING_100 = { edgeMin: 35, edgeMax: 80, ccMin: 100, ccMax: 250 };
const DRILL_SPACING_320 = { edgeMin: 20, ccMin: 32, ccMax: 320 };
const DRILL_SPACING_256 = { edgeMin: 20, ccMin: 32, ccMax: 256 };
const DOWEL_SPACING = { edgeMin: 15, ccMin: 32, ccMax: 128 };
const FACE_BORE_SPACING = { edgeMin: 25, ccMin: 100, ccMax: 300 };

const vSlot = (depth: number): ConnectorOp[] => [
  { on: 'end', kind: 'slot', diameter: 9.4, depth, travel: 20.6, label: '마구리 키홀 슬롯' },
  { on: 'face', kind: 'slot', diameter: 9.4, depth, travel: 20.6, label: '면 키홀 슬롯' },
];

const DOC = 'https://ovvotech.com/technical-downloads/';

export const OVVO_CONNECTORS: ConnectorSpec[] = [
  {
    model: 'V-0930P', name: 'V-0930P 영구 밀링', family: 'milling', releasable: false, minThicknessMm: 12,
    ops: vSlot(9.5), spacing: MILLING_SPACING_150, cutter: 'OVVO V-0930 커터(Ø8 생크, 언더컷 프로파일)', parts: 'V-0930PH ×2 + V-0930PC',
    autoApplicable: true, source: `${DOC} V-0930 Combined Instructions p1`,
    notes: ['깊이 9.5 ±0.5, 슬롯 30 × 9.4, 이동 20.6', '슬롯 폭 9.4는 30 − 20.6에서 산출(커터 지름 미기재)'],
  },
  {
    model: 'V-0930R', name: 'V-0930R 분리형 밀링', family: 'milling', releasable: true, minThicknessMm: 12,
    ops: vSlot(9.5), spacing: MILLING_SPACING_100, cutter: 'OVVO V-0930 커터', parts: 'V-0930PH(마구리) + V-0930RH(면) + V-0930RC',
    autoApplicable: true, source: `${DOC} V-0930R Instructions`,
    notes: ['깊이 9.5 ±0.5, 슬롯 30 × 9.4, 이동 20.6', '분리형 하우징 방향 주의(면 쪽)'],
  },
  {
    model: 'V-1230P', name: 'V-1230P 영구 밀링', family: 'milling', releasable: false, minThicknessMm: 15,
    ops: vSlot(12.5), spacing: MILLING_SPACING_150, cutter: 'OVVO V-1230 커터(Ø12.7/12/8 생크)', parts: 'V-1230PH ×2 + V-1230PC',
    autoApplicable: true, source: `${DOC} V-1230P Combined Instructions p1`,
    notes: ['깊이 12.5 ±0.5, 슬롯 30 × 9.4, 이동 20.5~20.7(20.6 사용)'],
  },
  {
    model: 'V-1230R', name: 'V-1230R 분리형 밀링', family: 'milling', releasable: true, minThicknessMm: 15,
    ops: vSlot(12.5), spacing: MILLING_SPACING_100, cutter: 'OVVO V-1230 커터', parts: 'V-1230PH(마구리) + V-1230RH(면) + V-1230RC',
    autoApplicable: true, source: `${DOC} V-1230R Instructions`,
    notes: ['깊이 12.5 ±0.5, 슬롯 30 × 9.4, 이동 20.6', '분리: 밀어서 들어 올림'],
  },
  {
    model: '1240P', name: '1240P 영구 밀링', family: 'milling', releasable: false, minThicknessMm: 20,
    ops: [
      { on: 'end', kind: 'slot', diameter: 12, depth: 12.9, travel: 39.3, label: '마구리 키홀 슬롯' },
      { on: 'face', kind: 'slot', diameter: 12, depth: 12.9, travel: 39.3, label: '면 키홀 슬롯' },
    ],
    spacing: MILLING_SPACING_150, cutter: 'OVVO 1240 커터(Ø12.7/12)', parts: '1240PH ×2 + 1240PC',
    autoApplicable: true, source: `${DOC} 1240P Instructions`,
    notes: ['깊이 12.9 ±0.5, 슬롯 51.3 × 12, 이동 39.3', '1240 문서에 권장 간격이 없어 V 시리즈 간격(35~80 / 150~350) 사용 — 확인 필요'],
  },
  {
    model: '1240R', name: '1240R 분리형 밀링', family: 'milling', releasable: true, minThicknessMm: 20,
    ops: [
      { on: 'end', kind: 'slot', diameter: 12, depth: 12.9, travel: 39.3, label: '마구리 키홀 슬롯' },
      { on: 'face', kind: 'slot', diameter: 12, depth: 12.9, travel: 39.3, label: '면 키홀 슬롯' },
    ],
    spacing: MILLING_SPACING_100, cutter: 'OVVO 1240 커터', parts: '1240PH + 1240RH + 1240RC',
    autoApplicable: true, source: `${DOC} 1240R Instructions`,
    notes: ['깊이 12.9 ±0.5, 슬롯 51.3 × 12, 이동 39.3', '권장 간격 미기재 — V 시리즈 분리형 간격(35~80 / 100~250) 사용, 확인 필요'],
  },
  {
    model: 'PD6', name: 'PD6 영구 면 드릴', family: 'face-boring', releasable: false, minThicknessMm: 15,
    ops: [
      { on: 'face', kind: 'hole', diameter: 8, depth: 7, count: 2, pitch: 32, label: 'Ø8 면 드릴' },
      { on: 'end', kind: 'slot', diameter: 9, depth: 12.7, travel: 31, label: '마구리 하우징 슬롯(V-1240PH)' },
    ],
    spacing: DRILL_SPACING_320, cutter: 'V-1230 커터 + Ø8 드릴', parts: 'PD6 + V-1240PH',
    autoApplicable: true, source: `${DOC} Permanent PD-6 V1240PH Combined Instructions`,
    notes: ['슬롯 길이 40, 이동 31 → 폭 9 산출', '깊이 12.7 ±0.3(2쪽 일반 예시는 12 ±0.3)', '최소 두께: 사양서 10, 드릴 12, 밀링 15 → 15 사용'],
  },
  {
    model: 'PD9', name: 'PD9 영구 마구리 드릴', family: 'end-drilling', releasable: false, minThicknessMm: 12,
    ops: [
      { on: 'end', kind: 'hole', diameter: 6, depth: 25, count: 2, pitch: 32, label: 'Ø6 마구리 드릴' },
      { on: 'face', kind: 'slot', diameter: 9.4, depth: 9.4, travel: 29, label: '면 하우징 슬롯(V-0940PH)' },
    ],
    spacing: DRILL_SPACING_320, cutter: 'V-0930 커터 + Ø6 드릴', parts: 'PD9 + V-0940PH',
    autoApplicable: true, source: `${DOC} Permanent PD9 V-0940PH Combined Instructions`,
    notes: ['구멍: 도면·사양서 Ø6 사용(설정 문구는 Ø7.8/8)', '깊이 9.4 ±0.3(도면 9.2)', '슬롯 폭 미기재 — V-09 커터 9.4 사용'],
  },
  {
    model: 'PD10', name: 'PD10 영구 면 드릴', family: 'face-boring', releasable: false, minThicknessMm: 15,
    ops: [
      { on: 'face', kind: 'hole', diameter: 8, depth: 11, count: 2, pitch: 32, label: 'Ø8 면 드릴' },
      { on: 'end', kind: 'slot', diameter: 9, depth: 12.7, travel: 31, label: '마구리 하우징 슬롯(V-1240PH)' },
    ],
    spacing: DRILL_SPACING_320, cutter: 'V-1230 커터 + Ø8 드릴', parts: 'PD10 + V-1240PH',
    autoApplicable: true, source: `${DOC} Permanent PD10 V1240PH Combined Instructions`,
    notes: ['슬롯 길이 40, 이동 31 → 폭 9 산출', '최소 두께: 드릴 12, 밀링 15 → 15 사용'],
  },
  {
    model: 'PD20', name: 'PD20 영구 마구리 드릴', family: 'end-drilling', releasable: false, minThicknessMm: 15,
    ops: [
      { on: 'end', kind: 'hole', diameter: 8, depth: 21, count: 2, pitch: 32, label: 'Ø8 마구리 드릴' },
      { on: 'face', kind: 'slot', diameter: 9, depth: 12.7, travel: 31, label: '면 하우징 슬롯(V-1240PH)' },
    ],
    spacing: DRILL_SPACING_320, cutter: 'V-1230 커터 + Ø8 드릴', parts: 'PD20 + V-1240PH',
    autoApplicable: true, source: `${DOC} Permanent PD20 V-1240PH Combined Instructions 3.0`,
    notes: ['이동 "31+" 표기 → 31 사용', '최소 두께: 사양서 15, 설명서 12 → 15 사용'],
  },
  {
    model: 'RD9', name: 'RD9 분리형 마구리 드릴', family: 'end-drilling', releasable: true, minThicknessMm: 12,
    ops: [
      { on: 'end', kind: 'hole', diameter: 8, depth: 26, label: 'Ø8 마구리 드릴' },
      { on: 'face', kind: 'slot', diameter: 9.4, depth: 9.4, travel: 20.35, shift: -2.75, label: '면 키홀 슬롯(V-0930RH)' },
    ],
    spacing: DRILL_SPACING_256, cutter: 'V-0930 커터 + Ø8 드릴', parts: 'RD9 + V-0930RH',
    autoApplicable: true, source: `${DOC} Releasable RD9 V-0930RH Combined Instructions`,
    notes: ['도면 치수 22.25 / 29.75, 시작 X−2.75의 기준이 불명확 — 슬롯 길이 29.75, 중심 −2.75 이동으로 해석', '구멍 Ø7.8/8 → 8 사용'],
  },
  {
    model: 'RD12', name: 'RD12 분리형 마구리 드릴', family: 'end-drilling', releasable: true, minThicknessMm: 15,
    ops: [
      { on: 'end', kind: 'hole', diameter: 8, depth: 26, label: 'Ø8 마구리 드릴' },
      { on: 'face', kind: 'slot', diameter: 9.4, depth: 12.7, travel: 20.35, shift: -2.75, label: '면 키홀 슬롯(V-1230RH)' },
    ],
    spacing: DRILL_SPACING_256, cutter: 'V-1230 커터 + Ø8 드릴', parts: 'RD12 + V-1230RH',
    autoApplicable: true, source: `${DOC} Releasable RD12 V-1230RH Combined Instructions`,
    notes: ['RD9와 같은 슬롯 배치 해석(확인 필요)', '최소 두께: 사양서 15, 도면 12 → 15 사용'],
  },
  {
    model: 'PN12', name: 'PN12 영구 면 보링(25mm)', family: 'face-boring', releasable: false, minThicknessMm: 15,
    ops: [
      { on: 'endFace', kind: 'hole', diameter: 25, depth: 12, offset: 10.1, label: 'Ø25 면 보링' },
      { on: 'face', kind: 'slot', diameter: 9, depth: 12.7, travel: 21, offset: 9, label: '면 하우징 슬롯(V-1230PH)' },
    ],
    spacing: FACE_BORE_SPACING, cutter: 'V-1230 커터 + Ø25 보링 비트', parts: 'PN12 + V-1230PH',
    autoApplicable: true, source: `${DOC} PN12 Combined Instructions`,
    notes: ['보링 깊이 12는 단면도에서 읽음(치수 표기 없음)', '슬롯 길이 30, 이동 21 → 폭 9 산출', '1쪽 깊이 12.7 ±0.5 / 2쪽 12.3 ±0.3 → 12.7 사용'],
  },
  {
    model: 'RN12', name: 'RN12 분리형 면 보링(25mm)', family: 'face-boring', releasable: true, minThicknessMm: 15,
    ops: [
      { on: 'endFace', kind: 'hole', diameter: 25, depth: 12, offset: 10.1, label: 'Ø25 면 보링' },
      { on: 'face', kind: 'slot', diameter: 9, depth: 12.7, travel: 21, offset: 8.8, label: '면 키홀 슬롯(V-1230RH)' },
    ],
    spacing: FACE_BORE_SPACING, cutter: 'V-1230 커터 + Ø25 보링 비트', parts: 'RN12 + V-1230RH',
    autoApplicable: true, source: `${DOC} RN12 Instructions`,
    notes: ['보링 깊이 12는 단면도에서 읽음', '슬롯 길이 30, 이동 21 → 폭 9 산출'],
  },
  {
    model: 'DH1-RD12', name: 'DH1 + RD12 드릴 하우징', family: 'drilling-housing', releasable: false, minThicknessMm: 15,
    ops: [
      { on: 'end', kind: 'hole', diameter: 8, depth: 26, label: 'Ø8 마구리 드릴' },
      { on: 'face', kind: 'hole', diameter: 10, depth: 12, count: 2, pitch: 8, label: 'Ø10 8자 하우징 구멍' },
    ],
    spacing: DRILL_SPACING_256, cutter: 'Ø8 · Ø10 드릴(밀링 없음)', parts: 'RD12 + DH1',
    autoApplicable: true, source: `${DOC} RD12 DH1 Combined Instruction Sheet rev 6`,
    notes: ['Ø10 두 구멍을 8mm 간격으로 겹쳐 8자 하우징 자리 형성', '첫 구멍 X−4 기준 → 두 구멍 중심을 커넥터 중심에 둠'],
  },
  {
    model: 'DH1-RN12', name: 'DH1 + RN12 드릴 하우징', family: 'drilling-housing', releasable: false, minThicknessMm: 15,
    ops: [
      { on: 'endFace', kind: 'hole', diameter: 25, depth: 12, offset: 10, label: 'Ø25 면 보링' },
      { on: 'face', kind: 'hole', diameter: 10, depth: 12, count: 2, pitch: 8, offset: 7.5, label: 'Ø10 8자 하우징 구멍' },
    ],
    spacing: FACE_BORE_SPACING, cutter: 'Ø10 · Ø25 드릴', parts: 'RN12 + DH1',
    autoApplicable: true, source: `${DOC} DH1 RN12 Drilling Connector Instructions rev 7`,
    notes: ['보링·하우징 구멍 깊이와 간격 미기재 — PN12 보링 12, DH1-RD12 하우징 12, PN12 간격 100~300 사용(확인 필요)'],
  },
  {
    model: 'OD640', name: 'OD640 다웰(Ø6)', family: 'dowel', releasable: false, minThicknessMm: 12,
    ops: [
      { on: 'end', kind: 'hole', diameter: 6, depth: 28, label: 'Ø6 마구리 드릴' },
      { on: 'face', kind: 'hole', diameter: 6, depth: 13, label: 'Ø6 면 드릴' },
    ],
    spacing: DOWEL_SPACING, cutter: 'Ø6 드릴', parts: 'OD640',
    autoApplicable: true, source: `${DOC} Permanent OD640 Solo Instructions`,
    notes: ['최소 두께: 설명서·브로슈어 12, 사양서 10 → 12 사용'],
  },
  {
    model: 'OD830', name: 'OD830 다웰(Ø8 × 30)', family: 'dowel', releasable: false, minThicknessMm: 15,
    ops: [
      { on: 'end', kind: 'hole', diameter: 8, depth: 18, label: 'Ø8 마구리 드릴' },
      { on: 'face', kind: 'hole', diameter: 8, depth: 13, label: 'Ø8 면 드릴' },
    ],
    spacing: DOWEL_SPACING, cutter: 'Ø8 드릴', parts: 'OD830',
    autoApplicable: true, source: `${DOC} Permanent OD830 Solo Instructions`,
    notes: ['최소 두께: 설명서·브로슈어 15, 사양서 12 → 15 사용'],
  },
  {
    model: 'OD840', name: 'OD840 다웰(Ø8 × 40)', family: 'dowel', releasable: false, minThicknessMm: 15,
    ops: [
      { on: 'end', kind: 'hole', diameter: 8, depth: 28, label: 'Ø8 마구리 드릴' },
      { on: 'face', kind: 'hole', diameter: 8, depth: 13, label: 'Ø8 면 드릴' },
    ],
    spacing: DOWEL_SPACING, cutter: 'Ø8 드릴', parts: 'OD840',
    autoApplicable: true, source: `${DOC} Permanent OD840 Solo Instructions`,
    notes: [],
  },
  {
    model: 'V-Clasp', name: 'V-Clasp 백패널 잠금', family: 'back-lock', releasable: true, minThicknessMm: 15,
    ops: [],
    spacing: { edgeMin: 30, ccMin: 30, ccMax: 320 },
    cutter: 'Ø10 드릴', parts: 'V-Clasp',
    autoApplicable: false,
    reason: '백패널이 몸통 판재의 반턱(백패널 두께+1 × 깊이 6) 안에 들어가는 구조 전용입니다. Befun 백패널은 세로판 사이에 끼우는 구조라 반턱이 없어 자동 배치하지 않습니다.',
    source: `${DOC} V-Clasp INSTRUCTIONS V4`,
    notes: ['구멍 Ø10 × 12, 위치 A = B − C − 4(B: 바깥면~반턱 안쪽, C: 백패널 두께)', '끝에서 30 이상, 간격 최대 320, 마주 보게 배치'],
  },
];

export function findConnector(model: string): ConnectorSpec | undefined {
  return OVVO_CONNECTORS.find((c) => c.model === model);
}
