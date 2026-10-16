# Finish labels and persistent edge banding — 2026-10-16

User-requested finish labels: 자작합판 / 우드 / 솔리드 / 믹스. Exposed birch plywood (C_ keys except C_Clay Brown) keeps square generated panels. Wood, solid and mix finishes use a fixed 1mm edge radius, including panels, doors, drawer fronts/bodies and shared desk/wardrobe panels. Source Edge/Tone/native panels already contain their bevels and remain unchanged.

The native horizontal_sample.glb has outer coordinates at 0.050m and a flat-face boundary at 0.049m. Generated meshes now use the corresponding 0.1cm radius, independent of width/height/depth, with unchanged outer dimensions and six material slots. Boring and cable-hole CSG starts from the rounded body; delayed and cached geometry keys include radius so switching finishes cannot restore a sharp cached box.

C_Clay Brown remains a compatible saved colour key but resolves to Mix in the picker, preset and setter. It uses the existing native plywood edge image, rotated along vertical edges, and the existing brown face colour. The source pricing family/material ID stays unchanged when its display category changes. Source layout family remains Type01; this is a finish change, not a configurator reroute.

Panel/Door/Drawer and DeskPanel consume finish metadata from their MaterialSet. Shelf and FurnitureScene stamp metadata for calibrated colours; imported natural textures also receive it. Material clones and new geometries are disposed. Original native initial assets, geometry generators, nominal thicknesses, fitting positions and manufacturing-stock rules are preserved.

Verification:
- scripts/catalog-presets/panel-edge.test.mjs: 5 tests for category, constant radius + bounds + six face slots across dimensions, cached finish switching with real blind cup depth, cable through-holes, unchanged source pricing after resize.
- Combined with door-depth, desk cable-render and Blum integration: 14 passed (six shelf styles included by the existing integration check).
- Scoped ESLint: no errors or warnings; full lint: 0 errors / 12 existing warnings elsewhere.
- Browser localhost:3003/configurator?product=9280727: Mix selected on load; 227→228→229cm widths and 24/32/40cm depths retain brown face/birch edging; zoomed texture orientation checked. Solid and Wood selection + resize, birch palette exception checked; console error list empty. Restored initial product by reload.
- Isolated final production webpack build: /private/tmp/befun-panel-edge-build-6d6eiq9y PASS: webpack compilation, TypeScript and route generation; all 19 changed source files match the validated build copy by SHA-256. Shared .next and dev server are untouched.

No commit, push or deployment in this task. Does not change the source preset layout into a continuously scaled native model; resized layouts still follow the existing style generator.

## Follow-up: clean laminate faces
Removed the old procedural paint albedo/roughness noise in materials.ts. Its 256px UV image stretched across long boards and looked like unwanted timber grain, reproduced on product9269282 in Sand+Midnight Blue. Real wood and birch-edge image maps and the 1mm bevel remain unchanged. Browser comparison after material reselection confirms a uniform face and retained dark edge; console errors empty. Existing5 edge tests PASS, full lint0errors/12existing warnings, isolated webpack/TypeScript production build PASS. No commit/push.
