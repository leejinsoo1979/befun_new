# Type02 Grid / Slant source regression

Run `node --test scripts/tylko-grid-slant/structure.test.mjs` (Node 24 native TypeScript support).

`source-fixtures.json` freezes 1,296 independent outputs from the public Type02 DNA decoder, cleanup, gallery conversion, and final physical horizontal split. Public JavaScript application startup was not executed; the application bundle is not a production dependency or part of these fixtures. Each SHA-256 digest covers sorted numeric records rounded to 0.00001 mm, a normalization tolerance rather than a measurement accuracy claim.

Coverage per style: 12 widths × 9 densities × 6 row-mode configurations. Inputs alternate 2, 3, or 5 rows; 18/28/38 cm row settings; 24/32/40 cm depths; backs; uniform and mixed hardware modes. Widths include 43.1, 58.7, 263.3, and 449.9 cm, catching millimetre and half-millimetre boundaries. Front checks include left/right hinges and single/double parity. Opening checks include physically present 3 cm open side wings, before display-label filtering.

Additional independent offline sweeps compared unsplit structural unions and front envelopes/hinges: 2,880 core configurations and 4,536 held-out configurations per style (14,832 total). These are not exhaustive proofs of all settings. The full-coordinate final-split fixtures are the stronger reproducible subset.

Production maps are independently expressed numeric inputs, not copied decoder functions:

- Grid: container 3, mesh 2169; 23 setup ranges with per-column support/group data. Density chooses among width-eligible setups. Integer division remainder goes left to right. Type02 axis spans over 568 mm are bisected before constructing columns; this affects the 58.7–58.9 cm edge.
- Slant: container 0, grasshopper 10; 861 declarative geometry rules. Width-dependent density remapping feeds the rules, followed by 30 mm ordered snapping. Type02 uses a front-compatible structural pass and intersects it with the requested front pass. Door pair threshold is 519 mm clear; a center vertical appears at 551 mm clear.
- Both use 18 mm structure, 12 mm backs/supports, 125 mm support width and the actual source 2400 mm manufacturing splitter.

Known scope boundaries: Type01 uses the preserved legacy generator until its own DNA is available; source Type02 inputs do not prove Type01 equivalence. Materials, hardware meshes, animation, camera, price and hidden UI state are not asserted here. Decimal Slant widths within source rule gaps can yield horizontal boards without vertical frames; those source outputs are preserved, rather than inventing a valid cabinet. A slider's raw DOM number does not prove the decoder received that exact width.
