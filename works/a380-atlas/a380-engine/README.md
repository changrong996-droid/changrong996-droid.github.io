# Fig 4 — A380 engine and pylon (Rolls-Royce Trent 900)

Hero-size anatomy figure: A380 inboard engine (Trent 900) on its pylon under a short wing segment, near-side nacelle and core cowl cut away. UI is Chinese (lang zh-CN, CJK font stack); code and this README stay English.

## Build
`build.mjs` is GENERATED: edit `work/en-head.mjs`, `work/en-helpers.txt`, `work/en-body.mjs`, `work/en-tail.mjs`, plus `model.mjs` here, then `bash work/en-mk.sh` (writes a380-engine-light.html and a380-engine.html).

## Verified (sources opened or official)
- EASA TCDS E.012 (https://www.easa.europa.eu/en/downloads/7779/en): fan 2.95 m; three-shaft, HP spool contra-rotating; stages fan 1 / IPC 8 / HPC 6 / HPT 1 / IPT 1 / LPT 5; length 5,477.5 mm (spinner tip to TBH mount flange); max diameter 3,944 mm; dry weight 6,246 kg; take-off net thrust 970-84 75,152 lbf, 972-84 76,752 lbf; reverser (Aircelle) on inboard positions only, outboard positions have a fixed fan duct.
- Safran A380 nacelle page (https://www.safran-group.com/products-services/airbus-a380-nacelle-systems): cascade-type reverser, first electrically actuated thrust reverser (ETRAS).
- Rolls-Royce Trent 900 product page (https://www.rolls-royce.com/products-and-services/civil-aerospace/widebody/trent-900.aspx): 24 swept fan blades, 116 in.
- Bypass ratio: Rolls-Royce factsheet and Aircraft Commerce spec table give 8.5–8.7. The Rolls-Royce poster prints "7:7–8:5"; treated as a print error / older figure, not used.

## Schematic
Nacelle lines, station positions, sleeve stroke (1.0 m), blocker doors (7), cascade segments, OGV count, flat (untwisted) fan blades, disc counts per module (IPC 4 discs for 8 stages, HPC 3 for 6), pylon shape, mount positions, wing segment (3.1 m chord shown, 33.5° sweep, no dihedral).

## Interaction
Hover zones 机翼/吊挂, 短舱, 风扇, 核心机, 反推 (Chinese readouts with numbers; cut faces darken on hover). R / button toggles reverser (sleeve slides aft, 7 precomputed door poses). Click / E explodes along the axis (inlet and fan forward, nozzle aft, cowls outward, pylon and wing up). Escape restores. Reduced motion respected. Four leader labels (风扇, 高压压气机, 燃烧室, 涡轮), hidden when exploded and ≤480 px; the anatomy skill's no-labels rule is waived on request, as in Fig 3.

## Checks (step 1, 2026-10-14)
226 solids, ~289 KB per page. lines.mjs: 0 floating ends in rest / reverser / exploded, light and dark. Console clean. Shots: shots/rest-light.png, reverser-light.png, apart-light.png, zoom-fan-core-light.png, zoom-rev-light.png, phone-light.png (390 px), lines-*.png. Scripts: work/en-a.json, en-z.json, en-lines.json, en-lines-d.json, en-phone.json. Backups before the wing/stroke/cascade-tone change: work/en-model-s1a.mjs, work/en-body-s1a.mjs.

## Known faults
- Cascades still read weakly when deployed (lo tone added, band is narrow at this camera).
- Light theme interiors are pale, with little layering.
- Core leaders cross the lower nacelle shell (the core sits inside it, so this cannot be fully avoided).
- Exploded readout says cowls move 0.85 m (EXPLODE.cowl; correct, but easy to confuse with the 1.0 m sleeve stroke).
- No display base yet.

## Step 2 (2026-10-14)
- Fan blades twisted: each blade is two stacked prisms, root stagger 60°, tip 44° (schematic angles; real blades twist continuously).
- Slow fan spin: F key / button 转动风扇 (F) / 停止风扇 (F). 4 precomputed fan poses one quarter blade pitch apart, cycled every 70 ms. Disabled under reduced motion; Escape stops it.
- 400 solids counted (the 4 fan poses repeat the blades), ~416 KB per page. lines.mjs: 0 floating ends in rest / reverser / exploded, both themes, and while the fan spins. Console clean. Shots: shots/s2-rest-light.png, s2-zoom-fan-light.png. Script: work/en-s2.json. Backups: work/en-body-s1b.mjs, en-tail-s1b.mjs.
- Not done: display base, cascade grid, gearbox/accessories.

## Step 3 (2026-10-14)
- Display base in the series style. A plate 9.3 × 4.8 m sits 2.55 m below the axis, with four feet, a halo, an inset outline, screws, and a plaque reading "Trent 900 · 内侧". Two cradle stands (twin posts plus a saddle) sit under the fan cowl (s 0.9) and the sleeve (s 3.6). The base and stands are schematic; the engine still reads as hung from its pylon. Base corners are added to the fit, so the figure is a little smaller.
- Accessory gearbox was not drawn. On the Trent family the HSGB mounts on the LP compressor (fan) case, low on the engine. At this camera it sits inside the solid fan-cowl wall drawn here, so it would never be visible. It needs a fan-cowl opening or a lower camera.
- 416 solids, ~419 KB per page. lines.mjs: 0 floating ends in rest / reverser / exploded, both themes. Console clean. Shots: shots/s3-rest-light.png, s3-reverser-light.png, s3-apart-light.png, s3-zoom-base-light.png. Backups: work/en-head-s2.mjs, en-tail-s2.mjs.

## M5 v2 — atlas pass (2026-10-14)
- Fan blades: one segment at the mean stagger (52°) instead of the two-segment twist, whose mid-span kink drew the fan as a sawtooth star.
- Explode distances: inlet 1.5 → 2.6 m, fan 0.75 → 1.4, nozzle 1.15 → 2.0, cowl 0.85 → 1.5, pylon 1.25 → 2.0, so the modules clearly separate.
- Light theme: fan and core zones take steps of the anatomy ladder (mixW of --anatomy-mid) so the rotating parts read against the white nacelle.
- Two more leader labels in LABELS: 进气道声衬, 反推套筒.
