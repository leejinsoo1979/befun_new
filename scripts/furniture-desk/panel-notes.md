# Desk panel adapter — 2026-10-14

Exports `deskPanelView(design, selectedSectionId)` and `applyDeskIntent(design, intent)` from `src/lib/furniture/desk-panel.ts`. Reuses the shared `FurniturePanel` contract. No store/UI/common-type modification.

Global controls follow category-desk-001 observed order: width, fixed73cm height notice,40/50/60 depth, storage count stepper, legroom location, backs, colour. Classic showed a back-panel notice; Modern showedOff/On. Off is unavailable when no open storage remains; mandatory legroom and closed-storage backs are unaffected.

The interior tab is the integration requested by the leader, exposing the8 confirmed Desk series and left/right hinge selection, addressed by stable sectionId. This tab is not claimed to be a literal copy of the Tylko popup layout. Paired doors disable single-direction editing because the generator fixes opposite hinges. Unknown/stale section IDs and disabled/invalid values are rejected.

Width changes call `normalizeDeskDesign` and select a legal storage count, preserving surviving stable section IDs and channel settings. Legroom position remains in0..storageColumns. UI selections are not persisted as geometry.

Colour values reuse verified reference-colours. Modern Desk now exposes the exact twelve choices and order observed by the leader in both the upper swatches and gallery: White, Gray, Sand+Midnight Blue, Olive Green, Sage Green, Butter Yellow, Cotton, Teracotta, Stone Gray, Reisinger Pink, Lilac, Dark Brown. Classic keeps nine verified Classic colours. Both families use >570mm paired-door threshold; exact material/foot mesh equivalence remains open.

Cable controls are integrated as a global legroom Off/Left/Right choice and per-storage Off/On choice. Per-storage availability is obtained from the geometry result and follows backs, drawer exclusion, and the actual series. A hidden setting retains its value for later restoration. This placement adapts the observed actions to the shared tabs, and is not claimed to reproduce the original context popup.

Verification:6 focused adapter tests PASS (count/width/legroom transition and save parsing; global order/stable selection; stale/disabled/invalid guards). Changed-file lint PASS. Whole-project TypeScript attempt found only pre-existing `.next/dev/types/validator.ts` route constraints; no Desk adapter/core errors. Full isolated build and actual panel interaction are leader integration checks.
