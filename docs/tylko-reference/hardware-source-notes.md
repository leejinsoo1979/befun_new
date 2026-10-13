# Pattern / Mosaic hardware reference — 2026-10-13

This is analysis of the already captured public Tylko JS bundle plus public design JSON, not authenticated application state. No app startup is executed. Module functions are loaded offline after disabling the webpack startup entry. All geometry units below are **millimetres**, except renderSegment fields, which use **metres** (SCENE.SCALAR=.001).

## Files and executable oracles

- `/tmp/mosaic-hardware-oracle.mjs`: `decodeMosaic({width=2320,density=69,depth=320,rowHeights=[400,400,400,400],rowStyles=[11,11,11,11]})` -> `{instructions,raw,clean,format}`. Uses real public modules1436(DnaAdapter),1158(raw),1155(clean),1154(gallery). No approximated Mosaic generator involved.
- Same file `renderType02Fronts(format)` -> real modules335/334 door/drawer renderSegments including all part positions/sizes and motion. Asset mesh vertices themselves not included.
- `/tmp/mosaic-hardware-fixtures.json`: 12 full source geometry fixtures: modes11,12,13,21,22,31 bottom-only and all4rows, width2320,density69,depth320,rowpitch400×4. Includes input,doors,drawers,backs,inserts,horizontals,verticals,clean openings.
- `/tmp/mosaic-hardware-render-fixtures.json`: 5 bottom-row hardware modes12,13,21,22,31 with real current Type02 renderSegments. `position` of segment + local `geometries[].position` gives closed-state part worldcenter. Sizes are metres; asset parts such as slimHandle use scale1 and require real asset mesh for shape.
- `/tmp/pattern-hardware-fixtures.json`: 12 legacy Type02 decoder fixtures, same inputs/modes as above. Direct `get_elements` result in `geometry`. Its Y origin differs: lowest opening9..391; gallery/render conversion adds9mm -> actual18..400. X is already shelf-centered.
- `/tmp/save-hardware-fixtures.mjs` regenerates both structural fixture sets. `/tmp/pattern-hardware-analysis.mjs` initial one-row height sweep.

## Critical distinction: gallery envelope is NOT physical front geometry

Module1154 emits door/drawer envelope z=depth−19..depth. **Do not conclude Type02 physical fronts are19mm.** Current renderer module189 says externalLaminate16mm, externalVeneer19mm, internalLaminate12mm, internalPlywood12mm, structural boards18mm. Type02 door335 and drawer334 select externalLaminate + slimHandle. Hence **Type02 physical front16mm**.

Module135 door envelope adapter:
- Outer left/right/top/bottom inset3mm (FRONT_INNER_OFFSET).
- Double-door left leaf: right/central edge inset1.5mm; double-door right leaf: left/central edge inset1.5mm. Central total seam3mm; outer edges remain3mm.
- z1=original envelope.z2−frontThickness; z2 unchanged.
- Single-door bbox width=W−6, bbox height=H−6, depth16.
- slimHandle `{width:0,height:1,offset:65}`. Front mesh height=bboxH−1=H−7; front centerY=bboxCenterY−.5 (or +.5 if verticalFlip/bottom handle). Width unchanged from bbox. This is separate from the top1mm handle area.
- DoorBuilder motion pivot: left hinge side bboxLeft+20mm; right side bboxRight−20mm. Mesh local X re-centered about this pivot. The hinge asset lies at bboxLeft+21 or bboxRight−21, and y positions ±(bboxH/2−50), on rear z face. Thus pivot is NOT the front edge.
- Type02 slimHandle anchor is 65mm from free edge, y=bboxTop−.5mm, z=front center. Bottom-handle mode y=bboxBottom+.5, asset rotation180deg around Z.
- Left member of a double door omits attached handle; right member includes it.
- Door angles close0°, ajar66°, open85°, sign negative for left hinge, positive right hinge.
- Source asset names: slimHandle / hingeWing / frontalPanel. Asset vertices are not decoded in these fixtures, so exact handle shape remains separate verification.

## Actual Type02 drawer renderer (modules1034/1035/189)

The older envelope metadata bottom13/offset22/backH−92 fields are not the final current renderer values. Current renderer uses:
- Front inset3mm each edge, physical front W−6 by H−7 by16, centerY originalCenter−.5, centerZ=depth−8.
- Internal board thickness12.
- Bbox width W−6, height H−6.
- innerBottomDepth by shelf depth:320→258,400→338,500→438,600→538.
- bboxDepth=innerBottomDepth+16+12 (=286 at depth320).
- bbox z range depth−bboxDepth..depth, centerZ depth−bboxDepth/2.
- Side-height lookup H182→106,H282→206,H382→306.
- Back-height lookup H182→86,H282→186,H382→286.
- compartment side inset6 from front bbox edge; outer box width=bboxW−12; innerWidth=bboxW−36.
- Side size:12 × sideHeight × (bboxDepth−16). SideX bboxLeft+12 / bboxRight−12. SideY=bboxBottom+12+sideHeight/2.
- Bottom size:innerWidth ×12×innerBottomDepth. BottomY=bboxBottom+32+6.
- Back size:innerWidth × backHeight ×12. BackY=bboxBottom+32+backHeight/2. BackZ=bboxRear+12.
- SlimHandle anchor: default(nonflip) bboxLeft+65, bboxTop−.5, depth−8. Flip reverses X side.
- Motion: closed at bboxCenterZ; ajar at center+.55*bboxDepth; open at center+.95*bboxDepth.

Example source fixture W402,H382,depth320: actual front396×375×16; side12×306×270; bottom360×12×258; back360×286×12. Drawer total bbox396×376×286.

## Mode interaction (module1462)

Occurrence codes None1/Some2/Max3. rowStyle=10*drawerCode+doorCode -> allowed11,12,13,21,22,31.
- Setting either kind to Max sets the other to None.
- Setting either to Some reduces the other Max to Some; otherwise leaves the other unchanged.
- Setting None leaves other kind unchanged.

## Availability and automatic correction

- Depth<320 disables drawers; depth320 and400 are valid.
- Cumulative row upper pitch plus active bottom-storage height >1578 disables drawers.
- Door row pitch<300 disables doors (18cm UI row); 300/400 enable.
- Some is disabled for <=1 compartment.
- UI module632 considers Mosaic/Pixel drawer openings width<=264 ineligible (minAxis282−board18). Generation module1159 converts T→O when actual axisWidth<282. Exact equality differs between these comparisons; do not hide this discrepancy.
- In mixedstyle22 (A=D,B=T,C=D), narrow B or D groups below282 become D when row pitch>200; for200 they stayO.
- Container1490 first normalizes non-door-height row to doorNone. It normalizes unavailable drawers to drawerNone. Source allows legacy heights278/398 and current300/400 for doors.

## Mosaic mapping / topology

Source row_style_table groups A/B/C:
11 O/O/O;12 O/D/D;13 D/D/D;21 O/T/T;22 D/T/D;31 T/T/T.

1143(main56500):A;1146(expo1 56776):C;1147(expo2 56775):C;1150(fill56782):B. Constants show partialbacks in expo/fill, no implicit backs in mainO.

At rowpitch400, #ih1=200. Fill1150 uses subconfig when axiswidth>=282. Source full decoder confirms:
- Open fill: two182 clear slots with18mm insert.
- Door fill: ONE382mm door over that module (interior shelf remains behind).
- Drawer fill: TWO182mm drawer envelopes, with middle horizontal front insert subtype`t`.
- Expo/main drawer: ONE382mm drawer (unless some other source splitting applies).
- On a200 or300 pitch, do not blindly create two drawers; source-derived subconfig/insert parameters decide.

#merge_bottom default1(keep divider), leave component's0(merge) only when row>0 and one of:
1. current11 and previous11;
2. current in[12,13,22], previous height!=200 and previous in[12,13,22];
3. current11, previous height200 and previous style12 or13.
Thus two neighbouring door rows can produce a tall782mm door. Do not simply disable all tall merges whenever any hardware is present.

Source fixture232/69/pitch400×4: bottom SomeDoors3,MaxDoors6,SomeDrawers5,Mixed4doors+4drawers,MaxDrawers8. All4SomeDoors gives8doors including2tall782; All4MaxDoors22 including2tall782. Highest fourth row is above drawer1578 limit, so its drawers automatically clear.

## Pattern Type02 E/W algorithm

Direct public legacy decoder1496/get_elements:
- Requested mode pass E uses styles11→441,12→412,13→113,21→422,22→212,31→222.
- In 3-digit style, units=layout, tens=fillA, hundreds=fillB. Fill1=door,2=drawer,3=back-only,4=open.
- Node front edges: per row take nodes with vertical or doorL or doorR, sort X, merge equalX with MAX(leftFlag/rightFlag).
- Adjacent edge pair is eligible iff leftEdge.rightFlag!=0, rightEdge.leftFlag!=0 and260<clearW<1500.
- If leftEdge.rightFlag==3 choose fillB else fillA. For single door, rightFlag1 or3 -> flip0(right hinge), otherwiseflip1(left hinge).
- Type02 then computes pass W with all rowstyles13 and extended valid door heights[208,278,398,200,300,400]. This determines common geometry independent of displayed modes. W converts paired leaf spans>=551mm into two compartments by inserting18mm vertical at split and trimming leaves9mm each; both new leaves become flip0.
- Final doors: W.doors whose x interval contains an E.door interval or is contained by it, with2mm tolerance on containing bounds. Do not use mere overlaps.
- Final drawers: same comparison using E.drawers and W.doors; merge adjacent selected W leaf intervals only if x2==next.x1. Keep18mm-separated cells separate.
- Back panels similarly W.backs filtered against E.backs. E.supports replaces W.supports.
- Remaining E.verticals not within40mm of a matching Wvertical (same y1/y2) get appended, with corresponding shadow cleanup.
- Width split candidates from doorS: within leftEdgeX+200+9 < split < rightEdgeX−200−9. First sorted candidate wins. Otherwise rounded midpoint.
- A raw leaf splits if clearW >= door_settings[2]+18 (=569) unless narrower; or a forced candidate when clearW>400.
- Pattern fixture JSON is sourcegroundtruth for the final result; do not apply Mosaic template rules to Pattern.

## Unknowns / limited scope

- Exact slimHandle/hingeWing asset mesh vertices are not contained in generated part metadata; need inspect public assets separately for perfect hardware shape.
- Fixtures described here focus Type02 current renderer. Other finish families require their own adapters.
- Source applies additional global/per-component direction override. Current helper notes default direction and explicit door envelope direction only.
- No private state, auth, cookies or tokens were written.

## Implemented family adapters and remaining mesh limitation

`ReferenceFront.family` now selects `type01` or `type02` (default Type02). The numerical placement functions and renderer components have been implemented. 88 public-renderer fixture cases plus one unsupported-input guard test pass; this verifies part bounds, anchors and motion, not GLB vertices/material BRDF.

Type01 door (module335): front type externalVeneer=19mm while material name is laminate. DirectionLeft uses verticalLeftFullHandle width10mm; DirectionRight uses verticalRightFullHandle width30mm. The front mesh width is inset bbox width minus handle width. Left-hinged front center shifts−handleWidth/2; right-hinged shifts+handleWidth/2. Front height remains inset bboxHeight. Motion pivot remains bbox hinge-side edge+/-20mm. Full handle part width10/30, height=bboxHeight, depth19; anchors are bboxRight−10 / bboxLeft+30, centerY,frontcenterZ. These anchors reflect source assets' authored origins, not assumptions about geometric handle centering.

Type01 drawer (module334): externalLaminate16, internalLaminate12, horizontalFullHandle30mm high. Front width=inset bboxWidth, height=inset bboxHeight−30, centerY−15mm. Full handle part width=bboxWidth,height30,depth16, anchor x=center,y=bboxTop−30,z=frontcenter. Box parts match Type02.

Public asset base string: `https://media.tylko.com/cloudinary/raw/upload/v1/renderer`. Defined paths:
- `geometry/slim_handle.glb` (default_glb)
- `geometry/hinge_wing.glb`, `geometry/hinge_anchor.glb` (default_glb)
- `geometry/horizontal_handle_50.glb` (fullHandleTop; skeleton_glb)
- `geometry/vertical_handle_30.glb` (fullHandleLeft; skeleton_glb)
- `geometry/vertical_handle_50.glb` (fullHandleRight; skeleton_glb)

**These candidate concatenated URLs were not successfully retrieved/verified as network resources.** Existing Chrome resource inventory did not reveal GLB entries; shell network did not fetch them. Thus raw source geometry and skeleton stretching are not proven equal to Befun assets. Existing local `handle_door.glb` is 13cm wide with bounds X[-6.5,6.5],Y[-1.701,0.299],Z[-2.225,1.675]. Existing `handle_drawer_unit.glb` has bounds X[-.5,.5],Y[-1.176,1.824],Z[-1.227,1.173] in cm.

Implementation uses the existing local slim handle model at the exact source anchor. Type01 full handles reuse the existing local full-handle profile normalized to source part bounds (rotated for vertical handles). This is explicitly a **temporary profile approximation**, not source mesh equivalence. Source skeleton assets must replace this to claim exact visual hardware parity. Existing local hinge halves remain with corrected reference anchor/spacing; their vertices likewise remain unverified.

Module334 material/color: Type01 and Type02 front/sides/bottom/back all use `material:'laminate', colors:t.colors` (same selected palette); do not introduce a white box interior without evidence. Veneer01 alone uses `drawersStructure.colors` separately.
