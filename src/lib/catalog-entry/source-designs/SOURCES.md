# Photograph-specific Edge / Tone / Uff / Smooth entries

Captured and integrated on 2026-10-15. The catalogue key (`ID,w` or `ID,s`) is the identity, rather than a colour name or a generic family preset.

## Inputs

- Public product pages: `https://tylko.com/de-de/configure/<ID>,w` and `<ID>,s`.
- Public configuration responses: `https://tylko.com/api/v1/watty_configurator/<ID>/` and `https://tylko.com/api/v1/sotty_configurator/<ID>/`. Original responses are retained in `docs/handoffs/thumbnail-configurators/raw/`.
- Nineteen public DNA responses are archived in that handoff's `source-resources/`. `dna/` contains their JSON payloads, without the API envelope.
- Existing public Furniture and Bedside engines are reused from `lib/bookcase/upstream/`; see that directory's `SOURCES.md`.
- `upstream/renderer.js` preserves the dependency closure of the original public renderer's TYPE03/13/veneer13/23/24/25/10/12/14 processors. `upstream/wardrobe.js` preserves the original TYPE03 generator closure. Their original public bundles, captured on October 13/14, are archived as `renderer-bundle.js.gz` and `wardrobe-bundle.js.gz`.
- `upstream/sofa.js` comes from the observed public `https://tylko.com/_nuxt/BFoqguav2.js`, archived as `BFoqguav2.js.gz`. The telemetry prefix is removed, helper imports point to the existing local helpers, and `resetSourceDNA` resets its shared context before each transaction.
- Original sofa geometry, fabric, GI and sheen assets reuse the existing `lib/sofa/source-assets.json` registry and local files. Edge vertical handles and masking profile were downloaded from `https://media.tylko.com/cloudinary/image/upload/v1/renderer/geometry/` as `vertical_handle_30.glb`, `vertical_handle_50.glb`, and `masking_profile.glb`.

## Preparation and boundaries

Run `node scripts/catalog-entry/source-designs/prepare.mjs` to reproduce the extracted engines, material palettes, product records and small client entry index from the archived inputs. Runtime rendering uses these local inputs; it does not call Tylko's APIs.

The union is 891 source products: Edge 259, Tone 182, Uff 244 and Smooth 206. It includes all w/s products in the downloaded manifest, all separate All Sofas colour variants, and previously verified starting products. The existing five dedicated bookcase/bedside entries and six existing desk/wardrobe entries retain their established editors.

All initial geometry is preserved verbatim: the current public generator normalizes some older veneer presets by 9 mm and fills optional sofa fields absent from old responses. Edits use the original generator. TYPE25 stores an inner width but loads an outside width; the adapter accounts for the two 30 mm ends at serialization boundaries. Forty-one standalone sofa/cover/cushion records have no main axis: their captured geometry is retained and size stays fixed. A cover record with no physical geometry displays its own product photograph.

This implements exact product entry and initial configuration. It does not certify full visual or UI equality, every possible edit, manufacturing, pricing for every changed configuration, cart/order integration, or production deployment. The separate lineup audit documents those broader gaps. New source entries preserve the photographed shelf type; the existing dedicated bedside editor retains its style migration controls.

## Verification

`node --test scripts/catalog-entry/entry.test.mjs scripts/catalog-entry/source-designs/source-designs.test.mjs` compares every initial outside dimension and furniture panel coordinate against the independent raw response; sofa module IDs, coordinates, handedness and materials are also compared. It checks local mesh/fabric/GI files, category duplicates, intro photographs, every All Sofas variant, source identity, state restoration and TYPE25 outside-width restoration. Results are written to the handoff's `verification.json`.
