# Pixel and Gradient numerical reference checks

Run `node --test scripts/tylko-pixel-gradient/structure.test.mjs`.

The generator is independently implemented. `reference-pixel-gradient-data.json`
contains numerical column presets and density ratios extracted from the public
Type02 DNA and public ratio map, not the reference decoder implementation.

Mapping verified from public enums and DNA:
- Gradient: container 1, mesh 2426, `gradient` distortion.
- Pixel: container 5, dynamic mesh templates 2694–2697, `charlie_transform`.

Source: public bundle
`https://tylko.com/r_static/dist_vue/vueCrowV2-es6-adcb9eecc6cc1173956e.js`,
SHA256 `c1c360c5db33998a46a58640949f25204485676b725dbb2457ddb4aad0b00694`;
Type02 product DNA was already obtained from the reference session. Source
module 1158/1155/1154 runs the geometry decoder and module 1502 applies the actual
horizontal splitting stage. Fixtures contain input plus numeric output only.

Full development comparison: 1,584 cases, 792 per style; 33 widths including
layout boundaries, eight density values, one/three/five rows, all six front modes
across samples, back on/off, 32/40 cm depth. All boards, openings and front bounds
matched. `boundary-fixtures.json` preserves 264 representative cases from that run.

Independent held-out comparison: 480 cases, 240 per style; widths
63/83/118/143/167/197/223/263.3/277/303/343/377/413/447 cm, density generated with
`(index*37+13)%101`, one to eight rows mixing 18/28/38 cm labels, mixed six hardware
modes, back on/off and 24/32/40 cm depth. Requested hardware is normalized through
verified height/depth UI restrictions before running the source decoder.

Coordinate comparisons use millimetres with 0.000001 mm numeric tolerance. The
screen's truncated centimetre labels are checked separately; they are not assumed
to be precise coordinates. Source snapshots/fixture capture: 2026-10-13.

Known scope limits:
- Type01 has a preserved legacy branch; its DNA has not been captured, so no
  Type01 structural equivalence is claimed.
- Individual edit overrides, row selection restrictions and material appearance
  are separate integration tasks.
- Pixel source width ranges assume the reference's 1 cm steps; a saved width
  within a gap between those ranges uses the closest lower template in Befun.
- Initial held-out verification exposed 34 fractional-width horizontal split
  mismatches caused by whole-mm rounding in the shared splitter. The leader
  preserved half-mm world coordinates there; revalidation passed all 480 held-out
  cases, including all board bounds. All five committed regression tests pass.
