# Panel swatch names — 2026-10-16

Removed the persistent selected-colour paragraph from shared furniture-panel Swatches. Each chip retains its localized native `title` hover tooltip and accessible name. Selection, radio checked state, keyboard navigation and material application are unchanged. Removed the unused swatchName CSS rule.

Live `/reference-product/desk-1`: 10 colour chips have localized title/aria-label values; the colour row contains no persistent name text. Clicking White updates selection and the furniture without adding a name below the chips. Scoped ESLint passed.

Full lint: 0 errors / 13 existing warnings. Isolated production webpack build passed in `/private/tmp/befun-wardrobe-build-59jfpn0w`.
