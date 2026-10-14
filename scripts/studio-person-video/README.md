# Studio person video

User-provided `컷편집.mp4`: 448×672, H.264, 30000/1001 fps, 14.7147s, no audio. Original file remains unchanged. Local U2Net foreground extraction removes the grey background; no video is uploaded externally.

`OMP_NUM_THREADS=4 python prepare.py INPUT.mp4 public/three/reference-studio/person/ivory-linen-motion-packed.mp4`

Requires ffmpeg/ffprobe, Python `rembg[cpu]`, and local U2Net model. The output is standard H.264 with original RGB on the left and grayscale foreground alpha on the right. A single VideoTexture samples both halves so image and mask cannot drift out of sync. The mask is applied before alpha testing. Original RGB is decoded using Three.js's video sRGB conversion.

Placement shares StudioPerson's horizontal position, floor clearance, yaw and contact decals. Visible video height is175cm, aspect ratio2:3, lower edge keeps the user-selected5cm downward offset. The static photo's left-ankle warp is not applied to moving feet. No camera or furniture changes.

Muted, inline, looping playback; pause while document is hidden; release decoder and GPU resources on unmount. Retain the existing PNG until playback starts, on load/autoplay failure, or when reduced motion is preferred.

Source resolution is lower than the static PNG. Automated foreground extraction may soften fine hair edges; spatial alignment does not mean pixel-identical poses or manufactured 3D anatomy.
