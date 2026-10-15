# Edge / Tone source integration — 2026-10-15

## Sources

- Tone bookcase: https://tylko.com/en-de/configure/1964243,w,large-cashmere-beige-bookcase-210x228x36cm
- Tone wall storage (`wall-green`): https://tylko.com/en-de/configure/1964423,w
- Edge wall storage: https://tylko.com/en-de/configure/540446,w
- Native meshes: https://media.tylko.com/cloudinary/image/upload/v1/renderer/geometry/

`data/*-start.json` records source product ID and original preset. `*-dna.json` contains the corresponding original configuration rules. Geometry uses millimetres, original render schema metres, BEFUN shared studio centimetres.

`upstream/3UiAd3-B2.js` is the original parameter/geometry engine with telemetry prefix removed and local dependency imports. `ebgaXKuC.js` and `iJMyB6Jq2.js` are its dependencies. `renderer.js` preserves the original Edge/Tone processors and dependency closure from the public renderer bundle, wrapped for local import. `native-geometry.ts` applies the source skeleton stretching strategy to the original meshes. No replacement box geometry is used for missing hardware.

`fixtures/*.json` keeps the original API dimensions and component coordinates for independent regression comparison (walls, shelves, doors, backs, hinges).

## Entry points

- `/furniture/wall-green`: original green 206 × 194 × 45 cm Tone wall storage, product 1964423.
- `/bookcase-configurator?line=tone`: cashmere 210 × 228 × 36 cm Tone bookcase, product 1964243.
- `/bookcase-configurator?line=edge`: olive 314 × 228 × 36 cm Edge wall storage, product 540446.
- Classic / Modern editors retain their existing paths.

## Shared studio

The Edge/Tone scene imports BEFUN's existing `ReferenceStudio`, `Background` (including `StudioPerson` / `StudioPersonMotion`) and `Effects`. It does not introduce a separate floor, environment or person image. Camera fitting includes the shared person's position and upright height. Existing avatar preference and camera-facing behaviour are inherited.

## Verification

- `node --test src/lib/bookcase/*.test.mjs`: 9 tests pass. Three original products' full component coordinates match, edited widths survive serialize/restore, lineups do not contaminate one another, changed presets do not reuse initial quotes.
- Scoped ESLint and full TypeScript check pass.
- Isolated webpack production build in `/tmp/befun-bookcase-build-check`: pass. Shared dev server and `.next` were not restarted/cleared.
- Browser: Tone wall storage desktop/mobile (390 × 844), door open/close and camera rotation, person visible beside furniture. Edge preview also inspected.
- Captures: `/tmp/befun-bookcase-checks/`.

## Remaining work — not full original parity

- Official downloads returned Cloudflare 403 for plane_leg, masking_profile, vertical_handle_30/50, back_hole, grommet variants and innerBox_foldable_ao. All except plane_leg remain omitted. plane_leg uses the existing GLB-measured 15 × 30 mm lathe profile from `specs/observedHardware.ts`; this is not the full original GLB.
- Tone standard and Premium Matt now use all six original material IDs, renderer RGB values, and source option images. Material lighting/shader parity is not fully verified.
- Tone TYPE14 now calculates dynamic regular EUR prices using the captured original calculator/coefficients (see follow-up below). Edge and Expressions still show only identical captured-preset quotes. Regional conversions use the existing BEFUN exchange-rate module.
- Full visual/UI parity, translated new controls, cart integration and dynamic product-details synchronization remain to be completed. Existing static product details must not be treated as the edited design's dimensions.

### 2026-10-15 follow-up: sidebar, Space, joints and leveling feet

- Original Tone UI checked against product 1964423: 36 px selected tab pills, 56 px framed dimension tracks with separate pencil buttons, ± column stepper, 3:4 colour and door-opening image cards. Downloaded UI resources are documented in `public/three/bookcase/ui/SOURCES.md`.
- The original site remained under its loading overlay; detailed column-editor interaction and Premium Matt selection could not be validated. Full parity is not claimed.
- Space resets the camera; input fields, editable content and interactive controls retain normal Space behavior. The reset button advertises the shortcut.
- The 320 cm fixture resolves to 320 × 194 × 45 cm, six active columns, two top boards meeting at x=10 mm and 14 supports (seven front, seven rear).
- `PanelJoints` traces only actual touching board boundaries. It does not split a continuous board at each column or alter original panel dimensions. Native bevels remain intact.
- `planeLeg` is now rendered at all original render-schema positions, including the outer-foot inset. The measured 30 mm profile has 10 mm inserted into the bottom panel, exposing 20 mm above the ground. Source GLB download still returns a provider security check; native file fidelity remains unverified.
- Browser checks: width 320→325→320 cm, columns 6→5→6, handle/push-open selection, cashmere colour, orbit→Space reset, desktop and 390×844 mobile. Fixed mobile menu scrolling so the selected section heading clears the sticky viewer/tabs. No browser console errors observed.
- Captures: `/tmp/befun-bookcase-checks/tone-sidebar-desktop.png`, `tone-sidebar-mobile.png`, `tone-panel-joint.png`.

### 1964607 stepped Tone wall storage

- Source: https://tylko.com/de-de/configure/1964607,w, read 2026-10-15. Source manager `getItem()`, `getPreset()` and `getGeometry()` captured from the original page. Its `geom_id:2590` uses the existing Wallstorage DNA; coordinate fixtures verify compatibility.
- Entry: `/bookcase-configurator?line=tone&product=1964607`. Initial size 255 × 134 × 45 cm; active column heights 134 / 44 / 44 cm; material 1, Off White Premium Matt; push-to-open.
- Regular source price EUR 2569. Club price EUR 1593 was visible but is not used as an unconditional price. Configuration changes still require a new verified quote.
- `/catalog-item/storage/7` belongs to source 1964589,w (Ash Gray), which is a different product. No false product/image/name association was added. The exact identity 1964607,w is registered for catalog entries when that source product is present.
- Missing RGB values recovered from original `https://tylko.com/_nuxt/C-45Czmk2.js`: matteOffWhite 14671836, matteCashmere 12563622, mattePistachioGreen 11120030, onyxGray 6776165, matteOnyxGray 7236973, matteMidnightBlue 1514283, matteMistyBlue 8689575, midGray 10921897.
- Fixed HTML column marker pointer bubbling so clicking a numbered marker opens its editor instead of being immediately cleared by Canvas onPointerMissed.
- Validation: 12 geometry/regression tests pass, scoped ESLint, full TypeScript, isolated webpack production build pass. Browser: initial shape, standard/premium switch, Ash Gray→Off White, column 2 height 44→74→44 cm, door opening, desktop/mobile 390×844. Native missing assets and full shader/UI parity limitations above still apply.
- Captures: `/tmp/befun-bookcase-checks/1964607-desktop.png`, `1964607-doors-open.png`, `1964607-mobile.png`.

### 657092 Expressions bedside table — partial source integration

- Source https://tylko.com/de-de/configure/657092,w is a white **60 × 25 × 36 cm bedside table**, shelf type 6 (TYPE23), not the wardrobe shown in the supplied intro screenshot.
- `upstream/g9uRfoWh2.js` is the actual Expressions geometry engine loaded by that page. Telemetry prefix and one unconditional drawer debug log removed. Existing Edge/Tone engine remains separate. TYPE23/24/25 render processors copied from the public source renderer; initial TYPE23 panels, drawers and four foot placements match the independently captured geometry fixture.
- Entry `/bookcase-configurator?product=657092`; furniture intro's initial bedside tile now uses the actual 657092 source preview and exact product identity. No unrelated catalog product was remapped. No studio cut was available, so none was fabricated.
- Added source width/height/depth constraints, five material IDs, section layout thumbnails, drawer travel, save/restore/share, shared studio/person and Space reset. Source regular price EUR602 applies only to the identical captured preset; changed configurations have no invented quote.
- Style/colour images: observed `https://res.cloudinary.com/cstm/image/upload/v1/configurator/tiles/tile_style_T23`, T24, T25 and tile_color_off_white/oyster_beige/pistachio_green/inky_black/powder_pink. Product preview: `https://media.tylko.com/media/gallery/sellable_item_abstract/2024/09/unreal_render_tasks/unreal_293843.webp`.
- **Incomplete:** original `geometry/lift_leg.glb` download returned HTTP403. Its four original schema locations are retained but the native foot is not rendered. TYPE25 pillar-leg model is also unavailable; legs style is disabled rather than showing invented legs. Hanging is disabled by the original preset's own rules. Full original material shader/face colouring, cable-hole hardware and style switching are not complete. Original page remained under its renderer loading overlay, preventing full live visual comparison.
- Checks: 14 geometry/regression tests pass; scoped ESLint, full TypeScript and isolated webpack production build pass. Desktop: initial shape, width120/height65, green colour, drawer open/close, internal layout selection, save/share reload. Mobile390×844: navigation and pink colour selection verified; instant section scrolling avoids an animated-scroll target moving under the sticky viewer. No console errors observed.
- Captures `/tmp/befun-bookcase-checks/657092-desktop.png`, `657092-open.png`, `657092-mobile.png`.

### 2026-10-15: Tone dynamic price and viewer toolbar

- Original public calculator source: `https://tylko.com/_nuxt/C-45Czmk2.js`, TYPE14 (`_Te`). Preserved its component area/perimeter, compensation, drawer-depth, material, margin and logistics calculation in `upstream/tone-price.js`; dependencies are a small local helper closure. `data/tone-price-coefficients.json` contains the relevant captured coefficients from the 2026-10-14 coefficient snapshot. Unknown coefficients throw instead of silently substituting zero.
- Canonical regular EUR conversion is the source's `Math.trunc(nativePrice * 1.23 / 4.3)`. Club promotions are separate; no automatic Club discount is invented. The captured coefficients are local, not a live price feed.
- Live original UI verified 2026-10-15: initial 1964243 EUR3237, width314 EUR4463, 314 × 224 × 39 cm / four columns / Pistachio Green standard EUR4722, Premium Matt EUR5018. Local calculator matches all four. Initial 1964423 EUR3921 and 1964607 EUR2569 also match saved original regular quotes. `fixtures/tone-price-4722.json` captures the independent original live geometry/preset.
- Tone updates price after configuration edits; KRW/USD/JPY use the existing canonical EUR conversion. Compact region picker added. Price and product specification always read the same current geometry.
- Viewer toolbar now uses circular zoom/dimensions/decor/doors/specification/share controls, separators and a separate Edit section pill. Column targets appear only in edit mode. Reset remains accessible above and via Space. Shared background/person preserved; camera framing enlarged. Standard/Premium Matt use original-like pill controls.
- Original decor assets remain unavailable: decor button is explicitly disabled, not a non-working active control. Original shader/lighting parity and full section editor parity remain incomplete. No cart integration added.
- Verification: 17 tests pass, scoped ESLint and TypeScript pass, isolated webpack production build passes. Browser: EUR4722→5018→4722, KRW conversion, product spec, dimensions, door opening, column target toggle; responsive390×844 and normal desktop. No captured console errors. Screenshots `/tmp/befun-bookcase-checks/tone-price-eur-desktop.png`, `tone-price-mobile.png`.

## Bedside style selection fix — 2026-10-15

- Replaced hardcoded minimal-only selection with TYPE23/24/25 DNA and `switchShelfType`; availability comes from the current `shelfType.options`, not a blanket disabled flag. At 165 × 65 × 36 cm, hanging migrates to 62 cm and legs to 72 cm while retaining channels, material and outside width. The original 25 cm preset disallows hanging.
- Optional `Design.bedsideStyle` persists through local JSON/share links; old designs default to TYPE23. TYPE25 preset width excludes two 30 mm side uprights while `loadPreset` expects outside width. The wrapper adds 60 mm only when loading TYPE25, preventing repeated shrinkage.
- Correction: terminal HTTP403 did not mean original assets were unavailable. VPN Chrome received HTTP200 for pillar_leg.glb, lift_leg.glb and thick_leg.glb; their actual response bodies now replace the approximate parts. Pillar uses the original extendSingleBone rule.
- rounded-panel.js preserves original renderer Vpe geometry and signed X/Z extension, replacing the invented bevel.
- Wall mounting uses original calculateShelfOrigin / HANGING_AT.y=250 mm. Furniture, joints, edit targets and dimension labels rise 25 cm together; other styles remove this elevation.
- Chrome localhost:3057: height65 → Hanging gives 60×62×36 cm, visibly lifted above floor. Scoped lint passes; 15 engine tests pass. Original-asset isolated build passed; final elevation build rerun. Full lighting/manufacturing parity is not claimed.
