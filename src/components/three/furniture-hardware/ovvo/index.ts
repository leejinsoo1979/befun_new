/**
 * OVVO V-1230 P/R 하드웨어 — 공개 import 입구 (R2.1-HW)
 *   import { OvvoPH, OvvoRH, OvvoPC, OvvoRC, guideMounts } from '@/components/three/furniture-hardware/ovvo';
 * 단위 mm. 좌표 계약: ovvoContract.ts(홈 좌표 S / 접합 좌표 J), 장면 변환: guideAdapter.ts.
 * 부품 단면 치수는 설명용(OVVO_ILLUSTRATIVE.status = 'illustrative'). CNC/BOM으로 내보내지 않는다.
 */
export { OvvoPH, OvvoRH, OvvoPC, OvvoRC, OvvoJoint } from './OvvoParts';
export { phGeometry, rhGeometry, pcGeometry, rcGeometry, slotEnvelopeGeometry, OVVO_ILLUSTRATIVE } from './ovvoGeometry';
export {
  OVVO_V1230_OBSERVED, SLOT_CAPSULE, insideSlotEnvelope, panelAPose, panelAToJoint, jointToPanelA,
  type OvvoModel, type OvvoPhaseP, type OvvoPhaseR, type PanelAPose,
} from './ovvoContract';
export {
  guideMounts, slotPointToGuide, guidePointToSlot, quatMul,
  SLOT_TO_GUIDE_QUATERNION, SLOT_TO_GUIDE_MATRIX_ROWS, FLIP_X_QUATERNION, type GuideMount,
} from './guideAdapter';
export { checkRTongueEngagement, connectorInsideBothSlots, maxRadialExcess, legacyEndcapCorner, flipAboutZ, vertices } from './ovvoChecks';
