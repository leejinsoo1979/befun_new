# Edge finish and furniture support publication — 2026-10-17

Prepared from origin/main 628ad46 in an isolated checkout. Includes finish labels and Clay Brown Mix classification, persistent 1mm banded panel edges, clean laminate faces, Gradient outer door boundary alignment, and removal of recessed-divider foot axes.

Only owned changes were ported. Unpublished native catalog expansion/initial-model rendering and its pricing override in the shared checkout are excluded. The preset regression uses the existing bookcase-brown fixture; the feet regression embeds the measured 9281730 bottom-row panel bounds and does not depend on unpublished catalog data. Earlier handoff browser/build results describe the shared development checkout; this note records publication validation.

Publication checks:
- 39 tests passed: edge finish, door depth, recessed feet, desk cable render, Blum integration, Mosaic feet and furniture integration.
- Full ESLint: 0 errors, 12 existing warnings.
- Production webpack build, TypeScript, page data and static generation passed. Initial sandbox font fetch failed; rerun with network permission passed.
- React review: geometry memoization includes dimensions/radius; owned geometry/material clones are disposed; shared materials retained; hooks remain unconditional.
- git diff --check passed. No deployment performed. Shared HEAD, index, .next and server untouched.
