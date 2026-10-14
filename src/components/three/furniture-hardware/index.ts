// R1-VISUAL 하드웨어 외형 — 공개 진입점 (리더 연결용)
export { LatheLeg } from './LatheLeg';
export { latheLegGeometry } from './legGeometry';
export { ShortLeg, PlaneLeg } from './legs';
export { FullHeightHandle30 } from './handles';
export { extrudedHandleGeometry } from './handleGeometry';
export { OBSERVED_HARDWARE, OBSERVED_LEG_PROFILES, OBSERVED_FULL_HANDLE_30_SECTION } from './specs/observedHardware';
export type { ObservedHardwarePart, ObservedBounds, ObservedStatus } from './specs/observedHardware';
// Tylko 클립(단면 매입) + 상대 핀 — 좌표 계약은 connectors/clipContract.ts
export { TylkoClip, TylkoClipPin, TylkoClipJoint, createClipMaterials, CLIP_APPEARANCE } from './connectors/TylkoClip';
export { pinPositionInClip, clipBodyExtent, validateClipPair, isManufacturingReady } from './connectors/clipContract';
export type { TylkoClipDimensions, TylkoClipPinDimensions, ClipColor, ClipJointPhase, ClipDimensionStatus } from './connectors/clipContract';
export { ILLUSTRATIVE_CLIP, ILLUSTRATIVE_PIN } from './connectors/illustrativeDimensions';
// OVVO V-1230 P/R (R2-HW) — 좌표 계약은 ovvo/ovvoContract.ts, 단면 치수는 설명용(OVVO_ILLUSTRATIVE)
export { OvvoPH, OvvoPC, OvvoRC, OvvoRH, OvvoJoint } from './ovvo/OvvoParts';
export { phGeometry, pcGeometry, rcGeometry, rhGeometry, slotEnvelopeGeometry, OVVO_ILLUSTRATIVE } from './ovvo/ovvoGeometry';
export { OVVO_V1230_OBSERVED, SLOT_CAPSULE, insideSlotEnvelope, panelAPose, panelAToJoint, jointToPanelA } from './ovvo/ovvoContract';
export type { OvvoModel, OvvoPhaseP, OvvoPhaseR, PanelAPose } from './ovvo/ovvoContract';
// R2.1-HW 조립 화면 변환(mm 장면) — 전체 공개 입구는 './ovvo' (index.ts)
export { guideMounts, slotPointToGuide, guidePointToSlot, SLOT_TO_GUIDE_QUATERNION, SLOT_TO_GUIDE_MATRIX_ROWS, FLIP_X_QUATERNION } from './ovvo/guideAdapter';
export type { GuideMount } from './ovvo/guideAdapter';
// R3-HW 원본 장다리 표시 어댑터 — 계약은 legs/longLegContract.ts (몸통+장착판 rigid, 나사·핀 미포함)
export { LongLeg } from './legs/LongLeg';
export type { LongLegProps } from './legs/LongLeg';
export { createLongLegInstance, releaseLongLegInstance } from './legs/longLegInstance';
export { LONG_LEG_ASSET, LONG_LEG_GEOMETRY_MM, LONG_LEG_PARTS, LONG_LEG_UNKNOWN, LONG_LEG_RIGID_GROUP, longLegSceneScale, longLegHeight } from './legs/longLegContract';
export type { LegSceneUnit, LegHardwarePart, LegHardwareRole } from './legs/longLegContract';
