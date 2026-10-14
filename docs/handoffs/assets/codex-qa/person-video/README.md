# Video avatar verification

User source: 컷편집.mp4, original unchanged. Local U2Net extraction, 441 frames at30000/1001fps, duration14.7147s. Packed RGB/mask H.264 output896×672, 1,362,758bytes. No audio or external video upload.

Actual Chrome localhost:3003/furniture/sideboard-terra: video figure visible without grey rectangle, moving poses captured, zoom-out placement inspected. Parent position/yaw retained, visible height175cm, user-selected5cm downward offset retained. Shader samples RGB and mask from the same frame. Mesh key separates the video geometry from fallback PNG geometry when playback becomes ready.

Reduced-motion/static fallback and visibility pause/cleanup implemented; autoplay failure/reduced-motion device matrix not independently simulated. Source resolution and automated mask edge quality limit exact pixel equivalence to the1024×1536 PNG. This is an animated billboard, not3D anatomy.

Scoped ESLint and TypeScript checked. Renderer/camera/lighting/other owners not modified. Preparation procedure: scripts/studio-person-video/README.md.

Final placement: moved 10cm right toward furniture (horizontal gap constant 66 → 56cm). Existing captures precede this final shift. User reports slight leg flicker and accepts it for this commit; flicker remains unresolved.

Commit integration replaces the previous silhouette in Background only; the separate in-progress studio-room rewrite remains unstaged.
