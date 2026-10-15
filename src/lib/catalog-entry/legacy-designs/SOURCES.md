# Dressing tables and record storage — source provenance

Captured 2026-10-15 from public Tylko product/configurator resources. This adapter uses the original Classic/Modern FPM geometry, render schema and EUR pricing core; it does not substitute a generic desk or shelf preset.

- Public product endpoint: `https://tylko.com/api/v1/jetty_configurator/{id}/`; 100 responses archived under `docs/handoffs/legacy-priority/raw/` (50 dressing tables, 50 record-storage products from the local catalog manifest).
- Public bundle: `https://tylko.com/r_static/dist_vue/vueCplusV2-es6-adcb9eecc6cc1173956e.js`, archived as `source-resources/cplus.js.gz`.
- FPM: module 1414; renderer: 1013/1046; material mapping: 57,523,524; pricing: 802, including required dependency closures.
- Original DNA response envelopes: `source-resources/desk-0.json`, `desk-1.json`, `bookcase-0.json`. Canonical presets come from `loadPresetFromJetty`, then `getPreset`.
- Hardware: `https://media.tylko.com/cloudinary/image/upload/v1/renderer/geometry/short_leg.glb`, `slim_handle.glb`; texture: same root `texture/plywood_edge_512_albedo.jpg`.
- EUR coefficients: existing `src/lib/commerce/data/tylko-coefficients-20261014.json`. Prices are regular Germany EUR prices, not promotions/Club prices. Existing market conversion provides KRW/USD/JPY display.

Reproduce offline from the archived source responses:

```sh
node scripts/catalog-entry/legacy-designs/prepare.mjs
node scripts/catalog-entry/legacy-designs/products.mjs
node scripts/catalog-entry/legacy-designs/verify.mjs
```

The shared viewer maps original GLB `top`, `edge`, `bottom` material slots to source primary/secondary/tertiary colors. Classic plywood edges use the source edge texture. The shared controls expose original configuration parameters; this work does not assert pixel-identical Tylko menus or add checkout integration.
