# User-provided desk accessories

Source: /Users/leejinsoo/Downloads/7987.rar, explicitly provided for desk placement.
SHA256: 799d3be22f003f24dfe356c9c8918faa84c5af1e7c6ddef02ff66165af753cc9
Geometry and UV source: Export/Classic Silver Workplace MacBoo.fbx in that archive.
The .max files were not directly opened. Embedded source bitmap resources come from map/.
Conversion: scripts/assets/convert-desk-7987.py (Blender 4.5.13).

- macbook-open.glb: VRay-60/61; 34.02cm width, 26.04cm open depth, 23.61cm height.
- coffee.glb: VRay-03/05/06; 16.66cm saucer diameter, 7.10cm height.
- phone.glb: VRay-57/59; 7.685 × 15.595 × 0.758cm.

Output coordinates: centimetres, Y up, bottom y=0, centred X/Z.
V-Ray procedural glass replaced with transparent PBR; screen bitmap VRay-08 reconnected.
Metal/ceramic PBR properties restored; cup subdivision restored for display.
These are decorative meshes only, excluded from generated furniture parts/pricing/CNC.
No full licence text was present in the archive; source provenance is the user-supplied file.

Normals revision 3: bake transforms with Mesh.transform (including normals), clear stale
FBX custom normals, weld coincident vertices, recalculate winding and split hard edges.
MacBook deck uses planar face normals; curved perimeter retains smooth/weighted normals.
Cup subdivision is explicitly applied before GLB export, rather than relying on exporter
modifier defaults. Runtime asset URL revision invalidates the previous useGLTF cache.
