# Recessed divider feet — 2026-10-16

The generated preview for product9281730 included each recessed insert as a support axis. Its structural walls occupy z0–400mm while the two inserts occupy z18–370mm. calculateShortFeet now only takes bottom verticals spanning the base depth as independent axes. Existing outer offsets and 600mm span midpoint rule are preserved. The cabinet-specific four-foot rule and captured native geometry are unchanged.

For the reported239×73×40cm configuration in Solid Lilac, positions change from14 to12 feet: the two insert pairs are removed and the wide70.8cm bay has one central pair. Front x coordinates in cm: -117,-70.8,-35.4,0,59.3,117. The inserts themselves remain unchanged.

Validation: source fixture +24/32/40cm recessed-insert tests2 PASS; cabinet tests3 PASS; measured Mosaic/unequal-axis tests3 PASS; furniture assembly/CNC integration20 PASS. Full lint0errors/12existing warnings; isolated production webpack/TypeScript/route generation PASS. Chrome3003 original product then Solid Lilac, underside enlarged: six pairs, no per-insert feet, same displayed price3,649,970KRW and dimensions; console errors empty. Test tab closed. No commit/push.
