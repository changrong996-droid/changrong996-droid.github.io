# Fig 5 — A380 tail section and APU (`a380-tail`)

Aft fuselage behind the rear pressure bulkhead, tail cone cut away on the near (aircraft right) side, seen from aft-right at the series camera (az 40 / el 14). The tail points +x, toward the viewer. All visible UI text is Chinese (`lang="zh-CN"`); code and this README are English.

## Build

Sources are split in `work/` (tl-head.mjs, tl-helpers.txt (= en-helpers.txt), tl-body.mjs, tl-tail.mjs); `bash work/tl-mk.sh` concatenates them into `build.mjs` and writes `a380-tail-light.html` and `a380-tail.html`. Numbers live in `model.mjs`.

- ~128 solids, page ≈ 250 KB each theme.
- Floating line ends ("lines" check): 0 in rest, exploded and inlet-open, light and dark, and under reduced motion. Console clean.

## Contents

- Tail cone shell (lathe, cut 315°→40° on the near side), 20 inner frames, 11 stringers, cone-tip ring.
- Rear pressure bulkhead as a dome (convex aft) with a rim frame and 3 stiffener rings.
- Fin root (swept prism, cut flat at ~4.7 m above the axis) with root fittings and rib caps; rudder in 2 segments (upper/lower).
- Left trimmable horizontal stabiliser (THS) stub: swept prism with 6° dihedral, inner/outer elevator, hinge fairings, plus the centre box, trim screwjack and pivot fittings inside the cone.
- APU bay: firewall, fire bottle, PW980A body (load compressor scroll, gearbox, 2 generators, starter, oil cooler, mount links), intake plenum and duct, exhaust duct/silencer to the cone tip.
- APU air inlet door on the upper right (t = 62°), 5 precomputed poses (0–40°), hinged at its aft edge.

## Interaction

Hover zones: 尾锥 / 后压力隔框, 垂尾/方向舵, 平尾/升降舵, APU. E / Space / click explodes (fin up, stabiliser outward, APU aft and down, cone shell pieces outward); A toggles the inlet door (button "打开 / 关闭 APU 进气门 (A)"); Escape restores; arrow keys step zones; reduced motion snaps all transitions and stops the tour.

## Verified numbers and sources

| Item | Value | Source |
|---|---|---|
| APU model | Pratt & Whitney Canada PW980A, two-shaft, 2 × 120 kVA generators | https://www.rtx.com/prattwhitney/products/commercial-auxiliary-power-units |
| APU power | "more than 1,800 hp" equivalent | P&WC certification release: https://www.aerospaceonline.com/doc/pratt-whitney-canadas-pw980a-apu-receives-tra-0001 (Wikipedia gives 1,300 kW; Forecast International lists 390 shp at 24,000 rpm, likely the shaft load only — not used) |
| APU size | 2,006 × 1,239 × 1,173 mm (L × W × H incl. intake plenum) | Forecast International PW901/PW980 report: https://www.forecastinternational.com/archive/disp_pdf.cfm?DACH_RECNO=1624 |
| Overall height | 24.1 m | Airbus A380 Aircraft Characteristics: https://aircraft.airbus.com/sites/g/files/jlcbta126/files/2023-12/ac_a380_1223.pdf |
| Horizontal tail span | 30.37 m (Facts & Figures: 30.4 m) | Airbus AC doc (above); https://www.airbus.com/sites/g/files/jlcbta136/files/2021-11/EN-Airbus-A380-Facts-and-Figures-Nov%20-2021.pdf |
| THS sweep | 30° at 25 % chord, 6° dihedral, 205 m² | JEC Composites HTP geometry table: https://www.jeccomposites.com/news/spotted-by-jec/the-airbus-a380-htp-the-worlds-largest-airborne-composite-tanker (the same table lists a span of 38.8 m, which disagrees with Airbus; sweep is treated as approximate) |
| Rudder segments | 2 (upper and lower rudder) | Airbus "A380 Flight Controls overview" (2007): https://www.fzt.haw-hamburg.de/pers/Scholz/dglr/hh/text_2007_09_27_A380_Flight_Controls.pdf |

Fin height on its own was not found in an authoritative source; only the root (~1.7–4 m above the cone) is drawn, so it is schematic.

## Schematic

Cone contour and length (~16 m), straight (not upswept) cone axis, skin thickness, frame/stringer pitch, bulkhead depth, fin and THS planforms, chords and the cut heights, elevator split, structural fittings, APU bay layout and accessories, inlet door position, size, hinge side and opening angle, explode distances, display base and stands.

## Step 2 changes (2026-10-14)

- **APU window**: over the APU bay (q 9.9–12.75 m, `APU_WIN`) the near cut now runs up to +72° instead of +40°, so the APU top, the mount struts and the inlet duct show at rest. The top-near shell is built in three q pieces; an aft-facing cut ring closes the step at q 9.9.
- **Inlet door moved** from t 62° to t 87° (width 0.72 → 0.58 m) so it sits on the kept skin strip (72–100°) with its frame intact; the inlet duct now rises to it (with a flange and a plenum clamp).
- **Actuators (schematic)**: 2 per rudder segment (4 in all; the aircraft has 3 per rudder), step 3: mounted on the fin rear spar inside the skin (bracket, body, piston rod into the rudder), seen through the fin-root cutaway. 2 elevator actuators on the left THS upper skin at the rear spar (b 4.7 and 6.4 m).
- **THS trim actuator**: now its own hover zone `jack`, readout "配平作动筒". Ballscrew at the front spar, ballnut on its gimbal, gearbox with 2 hydraulic motors and 1 electric motor, upper gimbal. It stays put when the THS explodes.
- **Structure**: firewall rim frame, duct-pass seal ring, firewall stiffeners; 4 upper APU mount struts plus 2 mount beams; bleed-air duct and fuel feed line.
- **Focus ring**: `.iso-stage:focus{outline:none}`; only `:focus-visible` (Tab) shows a thin 1 px `--anatomy-mid` outline.
- Solids 128 → 178; page 254 → 290 KB. Line check: 0 floating ends at rest / apu-open / apart, light and dark. Console clean.
- Step-1 sources are backed up as `work/tl-*-s1.mjs`, `work/tl-helpers-s1.txt` and `model-s1.mjs`.

## Step 3 (2026-10-14)
- **APU reads at rest**: the APU group (body, gearbox, generators, exhaust/silencer, inlet duct, mounts) sits in `.tl-metal`, top fill `--anatomy-lo`, sides `--anatomy-lo` mixed 22 % toward black, in both themes (same approach as the Fig 4 cascade tone). The firewall uses the lighter `.tl-metal-fw` (lo mixed toward `--anatomy-top`) so APU, firewall and the pale shell separate. APU position unchanged.
- **Fin-root cutaway** (`FIN_CUT` in model.mjs, schematic): the near (right) skin is removed between the front spar and the hinge line, from the root up to z 4.45 m; the leading-edge nose and the fin above the window stay full. Inside: far skin, front spar (20 % of LE-to-hinge), rear spar (1.05 m ahead of the hinge), 5 ribs (z 2.6–4.35 m) as thin slabs, 4 fin-to-fuselage attach fitting stubs inside the box (the forward one at q 1.2 m stays outside on the nose). Cut faces (front edge, top of window, skin strip left along the root) carry `tl-cut tl-cut-fin`, the Fig 3 wing-cut style. The old near-skin rib caps are gone.
- Rudder actuators moved from outside the skin onto the rear spar, inside the fin. All of the fin box is in the 垂尾/方向舵 zone; spars are hover accents. Readout: "垂尾 / 方向舵 · 上下 2 段 · 近侧剖开见翼盒 · 作动筒在后梁（示意）".
- 182 solids, page ~296 KB. Lines: 0 floating ends in rest / apu-open / apart, both themes; console clean. Shots: shots/s3-*.png (actions work/tl-s3x.json, tl-s3d.json, tl-s3z.json).

## M5 v2 — atlas pass (2026-10-14)
- Fin drawn up to 8.6 m above the cone axis (`FIN.zTop`, was 4.7) with a cut face across the top, so it reads as an upright swept fin instead of a flat box; rudder split moved to 5.3 m (both schematic).
- Fin and rudder a step darker than the cone shell on the light theme (`.tl-finskin`, Fig 8 ladder).
- Five leader labels via `tools/addlabels.py` (spec `tools/labels/a380-tail.json`): 垂尾, 方向舵, 水平安定面, APU, 后压力隔框; fade when exploded, hidden under 480 px.
- Backups: /workspace/work/a380r/pre-goal/a380-tail.{build,model}.mjs.
