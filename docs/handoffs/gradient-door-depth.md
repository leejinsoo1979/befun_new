# Gradient door fit after depth changes — 2026-10-16

Reported: `/configurator?product=9283007`, Classic yellow, 109 × 213 cm, density 43%, depth changed from 24 to 40 cm. The last door in each closed row was too narrow, exposing the interior at its right edge.

The legacy Classic Gradient panel generator anchors its final vertical wall at `width / 2 - thickness / 2`. Hardware placement instead accumulated all nominal compartment widths. These do not necessarily sum to the final wall position (the reported configuration differed by 2 cm). Depth changes invalidated the captured initial geometry and exposed the mismatch in the generated layout.

`src/lib/three/hardware.ts` now accumulates only interior boundaries and uses the same fixed outer-wall coordinate as the panel generator. Door and drawer openings share this correction. Depth/front-plane placement and all other style generators are unchanged.

Validation:
- New regression test fails before the fix at all three depths, passes after it. Checks actual panel faces against door edges (3 mm reveal), front plane and drawer opening width across 24/32/40 cm, 5 widths and 4 densities.
- New tests + existing resize/save-restore and all 201 source-initial product tests: 214 passed.
- Full lint: 0 errors, 13 pre-existing warnings.
- Browser: reported 109 cm Classic yellow configuration reproduced; corrected 40 cm, 32 cm and return to 24 cm visually checked. No captured browser console errors.
- Isolated production webpack build and TypeScript: passed in `/private/tmp/befun-door-depth-build-xz5ls46_`. Shared server and `.next` left intact.
