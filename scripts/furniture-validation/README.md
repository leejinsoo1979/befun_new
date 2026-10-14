# Independent furniture validation

Run from the repository root with Node 24 (verified: v24.19.0), using installed dependencies. No product or reference files are modified.

```sh
node scripts/furniture-validation/reference-audit.mjs
node --test scripts/furniture-validation/*.test.mjs
node --experimental-strip-types --test scripts/tylko-hardware/*.test.mjs scripts/tylko-grid-slant/*.test.mjs scripts/tylko-pattern/*.test.mjs scripts/tylko-pixel-gradient/*.test.mjs scripts/tylko-mosaic/*.test.mjs src/components/three/display/*.test.mjs
```

The audit writes `reference-results.json` here. It separates inventory model arrays, wardrobe edit records, other observation cases, and derived artifacts. Inventory + distinct wardrobe initial URLs yield 34 products; 14 edits do not become 14 new products. A matching URL/preset ID or existing image is only a field-level check. Loading previews, unmeasured geometry, unspecified units/precision and edited-state nulls stay unknown. Both repository-relative and case-relative screenshot paths are resolved explicitly. Unknown fields do not make the process fail; inspect counts rather than interpreting exit 0 as visual parity.

`compare.mjs` accepts **separate** reference/generated JSON files plus tolerance JSON:

```sh
node scripts/furniture-validation/compare.mjs reference.json generated.json tolerance.json
```

Each input uses `{ "unit":"mm", "parts":[{"id":"bottom","role":"panel","connections":["foot-1"],"positionMm":[0,10,160],"sizeMm":[900,20,320]}] }`. Tolerance uses `{ "mm":0, "source":"explicit measurement/source justification" }`. This is a validation-only adapter, not the pending production contract. Stable IDs must be supplied by the producer; never synthesize identity from array position. Exit: 0 pass, 1 fail, 2 unknown. Reports separate missing, extra, role/connections differences, coordinate deltas and unknowns. Tests demonstrate each outcome. No measured reference input has been supplied yet.

`integration.test.mjs` exercises 6 legacy styles × 3 widths, actual generator → assembly/CNC, door/drawer counts, feet-to-bottom-board assignment, actual store/JSON restore, and edit order. Board multisets verify internal propagation, **not** reference topology parity or actual GPU meshes. CNC rounding allowance is 0.05 mm + floating-point epsilon, derived from its 0.1 mm exporter rounding. This is not a fabrication tolerance. Existing tests include source fixtures and held-out fixtures; synthetic internal-consistency tests are not independent Tylko held-out measurements.

`gallery.test.mjs` compares all 96 image URLs and 12 swatches against the observation JSON. Browser actions and remaining integration gaps are recorded in `docs/handoffs/codex-assistant-validation.md`. `browser-results.json` records this run, not a reusable browser automation script. Authentication, cookies and tokens are excluded.

## R2.1 independent QA

Original failure tests remain unchanged. Reproduce the original 26 connector and 48 UI checks:

```sh
node --test scripts/furniture-validation/left4-connectors.test.mjs scripts/connector-validation/connector.test.mjs
QA_UI_DEPS=/existing/vitest3/node_modules node scripts/furniture-validation/run-left4-ui.mjs
node --test scripts/furniture-validation/r2-preservation.test.mjs
QA_UI_DEPS=/existing/vitest3/node_modules QA_UI_SUITES=scripts/furniture-validation/ui-r21 QA_UI_FILTER=r21-optimizer node scripts/furniture-validation/run-left4-ui.mjs
QA_UI_DEPS=/existing/vitest3/node_modules QA_UI_SUITES=scripts/furniture-validation/ui-r21 QA_UI_FILTER=legacy-r21 node scripts/furniture-validation/run-left4-ui.mjs
```

Replace the placeholder with an existing Vitest3/jsdom/testing-library install; do not install or upgrade product dependencies. This run used `/private/tmp/claude-501/-Users-leejinsoo-Downloads-befun-new-main/d7c82b8e-7ff3-4752-9c32-7595b6d56314/scratchpad/testrun/node_modules`.

The new optimizer suite intentionally retains a failing remount-persistence expectation. It injects into the Befun store and mocks the CNC editor; it does **not** test the separate persisted sheet-drawing path. Real Chrome reproduced a different P1: custom drawn panel/cutout disappears when changing connector system. Without that change, refresh restored the drawing. See `r21-results.json` and the QA handoff for exact scopes, screenshots, and fingerprints. Historical `archive-r2` tests target the superseded adapter and are evidence only, not current runnable tests.

Cross-checks: `node --test scripts/storefront-save-validation/save.test.mjs`; `node --test src/lib/assembly-guide/*.test.mjs`; `node --no-warnings --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs src/components/three/furniture-hardware/ovvo/ovvo.r21.test.mjs`. A passing geometry/transform test does not validate the unknown manufacturing undercut or exact vendor CAD.
