# Public category / collection / product-line evidence

## Correction: current intro mappings, observed 2026-10-13

**Current browser/API evidence overrides legacy internal naming below.** Leader capture `/tmp/tylko-category-products.json` confirms current Tone sideboard `/de-de/configure/907980,w` fetches shelf_type6,7,8 with collection_type=Sideboard (all HTTP200), and uses watty_configurator. Therefore module39 `TYPE_03 -> tone` must NOT be described as the current Tone product mapping; it is a legacy/internal mapping. The same bundle maps6/7/8 to TYPE_23/TYPE_24/TYPE_25 (module12), classifies these with checkIsNewExpression (module954), and provides separate processors1053/1054/1055. Internal expressions naming and current Tone marketing name differ. The subsequent bodies `/tmp/tylko-category-tone-{6,7,8}-dna.json` have now been read. All three report configurator_type3, superior_object_type mesh, superior_object_ids[2590], superior_object_collection Sideboard, with superior_object_line6/7/8 respectively.

Observed Original Modern product mappings:
- desk3854739 and dressing_table7388995 -> shelf_type1, collection Desk.
- sideboard3516437, tv-stand4665821, chest-of-drawers5142251, bedside_table3763450 -> shelf_type1, collection Sideboard.
- shoerack3516416 and bookcase486320 -> shelf_type1, collection Bookcase.
- wallstorage1596673: corrected final active preset and request are shelf_type1 / Bookcase. Earlier type0 attribution belonged to a prior page and was discarded.
- vinyl_storage3763292 -> shelf_type0, collection VinylStorage.
- Original Classic sideboard4665612 -> shelf_type0, collection Sideboard.
- Edge sideboard1430061 -> requests shelf_type4 and5, collection Sideboard.

Thus the enum ShelfType/CollectionType facts below remain true source declarations, but marketing shoerack does not necessarily use collection ShoeRack, chest-of-drawers does not necessarily use collection Chest, and current Dressing table is empirically confirmed Desk for the observed product. Collection request distinguishes row vs column for Original, while current Tone/Edge use their own separate product processors and cannot inherit Jetty Bookcase geometry.

Tone numeric enum/render evidence: module12 maps6=TYPE_23,7=TYPE_24,8=TYPE_25. Module1053 Type23 renders slabs/walls/expression fronts and ordinary legs;1054 Type24 renders the same family without legs and module12 selects HANGING_AT origin;1055 Type25 renders expression legs and distinct bottom/front flags. These support materially different model variants but do not alone prove which UI style label maps to6 vs8. Module192 uses a separate dimension generation path for all three. Material modules527/528/529 each have five palette IDs: offWhite,oysterBeige,pistachioGreen,midnightBlue,powderPink. The current captured UI also displays five corresponding colors.


Read-only investigation; no browser interactions or project edits. Bundle: `/tmp/tylko-public-bundle.js`, startup replaced before inspecting pure webpack modules. Source extracts: `/tmp/category-source-<module>.js`. Desk DNA: `/tmp/tylko-category-desk-type02-dna.json` (response wrapper `.json`). Findings below are source declarations, not assertions that every declared feature is currently exposed on every product.

## Three distinct classifications

1. Module12 `ShelfCategory`: bedside_table, bookcase, chest, desk, dressing_table, shoerack, sideboard, tvstand, vinyl_storage, wallstorage, wardrobe, sofa, wallunit. Category getter returns furniture_category || category || fallback. These are presentation/merchandising categories, not generator identities.
2. Module18 exported `CollectionType` (definition re-exported through shared modules): Bookcase, VinylStorage, ShoeRack, Chest, Sideboard, Desk. `DressingTable` is absent.
3. Module12 `getShelfType(number)`: 0 TYPE_01; 1 TYPE_02; 2 VENEER_01; 3 TYPE_03; 4 TYPE_13; 5 VENEER_13; 6 TYPE_23; 7 TYPE_24; 8 TYPE_25; 9 VENEER_25; 10 TYPE_10; 12 TYPE_12; 14 TYPE_14. The old Jetty geometry module18 `ShelfType` only exports T01=0,T02=1,VENEER_T01=2; it is not the full renderer product-type enum.

Module39 `getShelfLine(type)`:
- TYPE_01,TYPE_02,VENEER_01 => original
- TYPE_03 => tone
- TYPE_23,TYPE_24,TYPE_25,VENEER_25 => expressions
- TYPE_10,TYPE_12 => sofa
- else => edge (among known valid enum values: TYPE_13,VENEER_13,TYPE_14).

Classic and Modern are not independent `ShelfLineOption` values. Module1343/1369 finish toggle directly maps common_finish_modern→shelfType1, common_finish_plywood→0, common_finish_veneer→2. German translations module2304: Farbe / Multiplexplatte / Furnier. Module2305 English: Board / Plywood / Veneer. A veneer product translation calls it Tylko Original Classic in Veneer. No literal global `Classic=0,Modern=1` product-line mapping was located in this source; the current observed Original Classic/Modern sideboard product requests above now establish0/1 for those cases. Do not treat Edge as merely an edge-material toggle: it is a separate source product line.

## Collection generator families

Module1457:
- isRowBasedCollectionType = Bookcase or VinylStorage. Preset V1_LEGACY_ROW.
- isColumnBasedCollectionType = Sideboard or ShoeRack or Chest or Desk. Preset V2_LOWBOARD.
- isDeskCollectionType = Desk exactly.

Module1436 DnaAdapter derives configuration ROW/COLUMN from the DNA superior_object_collection. Module1158 dispatches from geom_type to container, mesh, component_series, component, grasshopper. Module1414 getDomainGeometry uses a row-render conversion for Bookcase/VinylStorage; other collections use column geometry. Thus category display names cannot select the existing Bookcase generator safely.

Module1521 configuration schemes:
- Bookcase: furnitureStyle,width,row-count height,depth,density,row backs,snapping,material,top/bottom storage + heights; nested rows rowHeight,rowDoors,rowDrawers.
- VinylStorage: style variant vinylStorage,width,row-count height,depth variant vinylStorage,backs rowAlwaysOn,snapping,material,top/bottom storage + heights; nested rows rowHeight,rowDoors,rowDrawers. No density parameter in this scheme. Module1514 only Pattern/Grid container IDs accepted; other style IDs coerce to Grid. Module18 vinyl UI style names Pattern,StandardGrid,DenseGrid.
- Sideboard/ShoeRack/Chest share scheme: column-style,width,height,depth,backs,feet,columnCount,distortion,material; nested channels seriesId,doorDirection,cableOpenings,inserts; nested lines localEdge. Availability constraints still differ, so scheme membership does not prove all controls visible.
- Desk: desk-style,legroomArea,width,depth,backs,columnCount,material; nested channels seriesId,doorDirection,cableOpenings,cablesSystem,drawerHandleFlip; nested lines localEdge. No height or density parameter.

Module1464 depth constraints: Desk [400,500,600]mm; other column-based collections [240,320,400,500]mm. Width comes from mesh.parameters.size_x and height constraints from size_y. No current UI assertion beyond source.

Module1524: feet visible on Sideboard/Chest/ShoeRack, not Desk. Distortion visible only on those three collections AND pattern CHARLIE/PORTO. Back panels visible on all four column collections; Off disabled when unforcedBackOpeningCount=0. These are parameter-creator rules.

## Desk evidence from actual fetched DNA

Response `.json`: superior_object_collection='Desk', superior_object_line=1, superior_object_type='mesh'. Only mesh2498, constants.pattern=3 (Grid enum), parameters distortion_mode='shift', density_mode='setup_range_stepper', size_x=[900,2400]mm, size_y=[300,400,...1200]mm, object_type=1. 7 setup records, although their upper widths extend beyond the public mesh maximum; do not expose those as allowed UI width.

Each setup includes one 2x-ratio column tagged distortion_tag='shift', table1066, default series4751, followed by 1x storage columns table1065, default series4754. Setups contain 2 through8 total columns. Width ranges: [836,1836], [1254,2454], [1572,3072], [1860,3690], [2208,4308], [2526,4926], [2844,5544]mm. These are eligibility ranges, bounded by mesh public limits.

Module1159 shift algorithm reorders the tagged column to min(floor(columnCount*distortion/100),columnCount−1), then calculates ratios. Desk-specific branch sets facing/legroom_flip on storage columns according to side of legroom. If exactly one storage column remains on a side, it sets the matching outer support. Its >568mm Type02 axis bisection applies only ROW collections, therefore not Desk.

Module1532 hides/disables desk furniture style (Grid only). Legroom slider step depends on total actual component count; columnCount option label is String(totalCount−1), excluding the legroom column. Drawer handle flip options map RIGHT enum→labelLeft and LEFT→labelRight. Cable management options Off/Left/Right, conditionally visible from computedChannelParameters.cablesSystem.available.

Module1534: first/last legroom slider positions snap underlying distortion to0/100. Desk cable-management transform sets channel.cables=true for Left/Right, and door_flip='left'/'right'; Off disables cables. Module1533 extracts legroom location using the component associated with desk_beams.

Module1491 Desk-specific geometry: when a FRONT_BOX opening has no bottom frame, creates a desk beam across its clear interior, width reduced by9mm per side, height40mm, depth20mm, front setback24mm. Constants in module1434: DESK_BEAM_HEIGHT40, DESK_BEAM_DEPTH20, DESK_BEAM_OFFSET24, INSERT_Z_SIDEBOARD_OFFSET30. Geometry expression beam y1=top−(9+40), y2=top−9; z1=front−(24+20),z2=front−24. Actual local coordinate/frame meaning should be kept separate from world-space gallery translation.

## Dressing table and remaining uncertainty

Module784 only exposes GET_IS_DRESSING_TABLE from shelf_category==='dressing_table'. Other occurrences are category enums, dressing_table decoration layout, scene choice, pricing category. No geometry CollectionType DressingTable or distinct generator branch was found. The current observed dressing-table7388995 request above now establishes Desk for that product. This conclusion comes from the API request, not appearance.

Other named marketing categories (TV stand, bedside table, wall storage) likewise have no dedicated value in this legacy CollectionType enum. Observed product mappings are now recorded in the correction section above; they are not universal mappings for every product or family. Edge/Tone own DNA/decoder inputs are not verified by the painted Bookcase DNA.

## Width rounding footnote

Module1522 width parameter→module1530 makeRootValueSizeMmFromCmOverwriteTransform→module1456 mmFromCm(value)=10*value. This common FPM transform does not round to whole cm. A legacy front-end slider may round before passing its value; that upstream handler was not confirmed. Therefore DOM aria263.3/display263 alone still does not prove internal2633mm.


## Tone DNA body follow-up

All three use mesh2590 with parameters density_mode=setup_range_stepper, size_x=[400,2400], size_y=[], object_type=0; constants #object_type=0,pattern=1. Those nested numeric constants are not safe to interpret through Jetty Type01/Gradient enums: the response itself explicitly identifies a different superior line and configurator_type.

First setup19004 ranges differ: line6 [400,1036], line7 [400,836], line8 [336,1032]mm. First config uses table Full and series Full_High_Full_drawers_default. The referenced component series defines internal heights250,350,...1250mm; component examples have type T,drawer_exterior=true,drawer_autofill=true,drawer_height=200. Full/High and other names are source layout labels, not proof of visible UI choices.

Leader-observed watty_configurator907980 current preset is shelf_type8 and selected UI Stil Mit Beinen, outer width800,height520,depth360; configurator internal width740,height450. This now confirms8 as the selected legs variant. Exact internal-to-exterior conversion must be decoded from this product family before implementation; these two differences alone do not prove30mm per-side walls or a70mm leg height. The shared renderer distinguishes6 TYPE_23 ordinary leg adaptation,7 TYPE_24 hanging origin/no legs,8 TYPE_25 expression-leg adaptation and different slab/front flags, but those render distinctions alone are not the complete generator formula.
