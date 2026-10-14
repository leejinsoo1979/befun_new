# Desk reference comparison

Run `node --test scripts/furniture-desk/structure.test.mjs` (Node supports TypeScript stripping).

Fixtures contain generated geometry only, no original presets, owner fields, credentials or network headers. Runtime code does not depend on these files or an external API. Comparison rounds numeric centimetres to1e−5 to remove floating arithmetic noise.

Offline capture: set `TYLKO_PUBLIC_BUNDLE` and `TYLKO_DESK_DNA` to the existing public source capture and response wrapper, optionally `DESK_FIXTURE_OUTPUT`, then run `node scripts/furniture-desk/capture-source-fixtures.mjs`. The source oracle disables bundle startup and only invokes pure geometry modules.

Captured source hashes:
- Type02 Desk DNA wrapper SHA256 `513ee91e3252b23590a3913460f75815beaedad9a9425704d5a4c963779b3db5`
- Public bundle SHA256 `c1c360c5db33998a46a58640949f25204485676b725dbb2457ddb4aad0b00694`

Frozen corpus comprises808 initial settings,552 mixed-channel heldout settings,672 further heldout/boundary settings. Widths of further heldout set:917,1043,1327,1639,1784,1785,1937,2261,2387mm. Covered source outputs: panels including inserts, front bounds/direction, beam, feet. Not covered: source meshes/material appearance, cable management, machining.

Type01 follow-up: `type01-source-fixtures.json` adds1,480 independent settings (808 baseline+672 mixed/boundary). Type01 response SHA256 `409b55446e740bae4cbc98a5f531aa2b29e741f20bc8ecd0303161f9f6ebd8e9`. source-oracle infers shelfType from the selected DNA superior_object_line. Combined structural corpus3,512 settings.

Cable extension: `capture-cable-fixtures.mjs` records 560 cases for each Desk DNA family. Set `TYLKO_DESK_DNA` and `DESK_FIXTURE_OUTPUT` as for the main capture. Captures include decoder cable centres/radii, per-channel availability, and a negative local-edge support check. The application stores only optional selections and independently computes these outputs. `node --test scripts/furniture-desk/cable.test.mjs scripts/furniture-desk/panel.test.mjs scripts/furniture-desk/structure.test.mjs` now passes 4,639 tests. These fixtures establish the tested domain, not all possible inputs or final render equivalence.
