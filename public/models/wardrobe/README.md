# Wardrobe hinge reference models

The user requested matching visible hardware. These two public Tylko renderer models are stored locally; the application does not fetch Tylko during runtime. The source provenance is retained here. No claim of authorship or manufacturing specification is made.

Retrieved 2026-10-14 from the public renderer asset URLs:

- `hinge-wing.glb`: https://media.tylko.com/cloudinary/image/upload/v1/renderer/geometry/hinge_wing.glb
- `hinge-anchor.glb`: https://media.tylko.com/cloudinary/image/upload/v1/renderer/geometry/hinge_anchor.glb

SHA256:

- wing: `277122893f41e6077b01f0679d8a5d145bc2dc1e3d175ec10888d5d1693ddb38`
- anchor: `ef20a10f2a5548d3f288f22ec062d2d2e1469b6b0e5c12cf4483b5af37cad5d0`

Each GLB has one unskinned mesh, no node translation/rotation/scale, and metre units. `wardrobe-hinge-assets.ts` clones the geometry and scales it 100× into the app's cm coordinates, preserving its local origin and normals. The supplied renderer sets chrome material externally. Wing attaches to the moving door; anchor attaches to the stationary side board.

The public render files alone do not establish the hinge manufacturer, model number, cup boring depth or manufacturing tolerances. They are not treated as Blum 71B3790/174H7100E parts.
