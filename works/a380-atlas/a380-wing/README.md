# Fig 10 · A380 wing structure (图 10 · A380 机翼结构) — v1

The whole left wing, seen from inboard, a little aft and above (azimuth 170°, elevation 52°), so the root section faces
the camera, the ribs show their faces and the wing runs diagonally up to the tip in the top right of the 600 × 520 card.
The upper skin of the inner wing box is cut away on a straight diagonal (front spar at s = 23.6 m → rear spar at
s = 12.6 m). Same pipeline as the other atlas figures: kit imports from `../../anatomy/kit/`, Chinese UI (lang zh-CN,
CJK font stack, Chinese buttons / readouts / aria / caption), focus ring on Tab only, atlas light ladder
(`mixW` / `mixK` tones of `--anatomy-mid`).

- `node build.mjs` → `a380-wing.html` (dark); `node build.mjs --light` → `a380-wing-light.html`. ~273 KB each, 179 solids.
- Geometry and every number shown in `model.mjs` (s = span outboard from the fuselage side, x = chord aft from the root
  leading edge, z up; world X = span, Y = chord).
- Env knobs for tuning: `WG_AZ`, `WG_EL` (camera), `WG_PRINT=1` (label anchor screen points), `WG_LABELS` (JSON label
  list), `WG_DEBUG=1` (painter-sort stats).

## Contents (parts)
- Wing box: front spar and rear spar (full span, drawn as segments between ribs), centre spar from the root to rib 17;
  27 drawn ribs (the odd numbered ribs 1–49 plus rib 16 = inner pylon rib and rib 22 = tank end), split FWD/AFT at the
  centre spar inboard of rib 17, with lightening holes; 12 drawn as composite (dark), the 2 pylon ribs darker still,
  rib 1 (root) drawn as a cut face; lower skin with 8 stringer lines; upper skin (outboard of the cut) with rib and
  stringer panel lines; two pylon attach fittings on the lower skin at the inner pylon station.
- Leading edge: fixed leading edge, 2 droop noses (inboard), 6 slats, 4 fixed nose fillers in the gaps.
- Trailing edge: fixed shroud strip aft of the rear spar, 3 flaps, 8 spoilers, 3 ailerons.
- Wingtip fence (above and below the tip), 2 engine pylon stubs cut off ahead of the leading edge (cut face).
- Fuel overlay (T): 2 号供油箱 (ribs 1–5), 内侧油箱 (5–13), 中间油箱 (13–22), 1 号供油箱 (22–33), 外侧油箱 (33–45),
  通气 / 缓冲油箱 (45–49), as translucent blue zones on top of the box with name tags.
- 12 leader labels (翼尖小翼, 上蒙皮, 前缘缝翼, 挂架接头, 下垂前缘, 前梁, 翼肋, 中梁, 后梁, 襟翼, 扰流板, 副翼); they fade
  when exploded or in fuel view (the high-lift labels also while F is out); hidden under 480 px.

## Interaction
- **F** / button 放下增升装置 (F) ⇄ 收起增升装置 (F): droop noses, slats and flaps, 5 precomputed poses (0–4).
- **T** / button 显示油箱 (T) ⇄ 隐藏油箱 (T): fuel overlay fades in; arrow keys then step the six tank zones; hover a
  zone for its capacity. T and E are mutually exclusive (one switches the other off).
- **E** / Space / Enter / click: explode — upper skin up 5.5 m, ribs up 2.6 m, centre spar up 1 m, front spar forward
  1.6 m, rear spar aft 1.6 m, lower skin down 1.8 m, fixed leading edge forward 2.3 m, droop/slats forward 3.8 m, shroud
  aft 2.5 m, flaps/ailerons aft 3.9 m, spoilers up 3.2 m and aft 2.5 m, fence outboard 2.2 m, pylon stubs down 2.2 m;
  the view zooms out to fit. **Esc** restores everything.
- Arrow keys / Home / End step the zones: 蒙皮, 翼肋, 前梁, 中梁, 后梁, 下垂前缘, 缝翼, 襟翼, 扰流板, 副翼, 翼尖小翼, 挂架.
- Hover readouts in Chinese for every zone; default readout = wing numbers (翼展 / 面积 / 后掠).
- Tour (watch-and-explore, off under prefers-reduced-motion): ribs → spars → fuel on (inner, feed 1) → off → high-lift
  out → flaps → in → explode → close, 31 s loop; any input pauses it for 15 s.
- State names in the page: `data-hl-pose` 0–4, `svg[data-fuel-on]`, explode via `[data-move]` groups
  (skin, spoiler, rib, lower, fs, rs, ms, fixle, le, shroud, te, fence, pylon); zones `data-zone` =
  wing(default)/skin/rib/fs/ms/rs/droop/slat/flap/spoiler/aileron/fence/pylon/tank-{feed2,inner,mid,feed1,outer,vent}.

## Painter's order
Fence → leading-edge items (devices, nose fillers, pylon stubs) sorted outboard-first → fixed leading edge → lower skin
→ box interior → upper skin → shroud → flaps/ailerons (outboard first) → spoilers → fuel overlay → labels. The box
interior (ribs, spar segments, fittings) is topologically sorted by separating planes (each rib's plane, each spar's
vertical plane and the span planes at segment ends) for every pair whose projected hulls overlap; 2 undecided pairs
(fittings straddling rib 16) fall back to depth. Lofts are oriented by signed volume (a centroid test flipped faces on
the thin, bent lower skin and left holes); the upper skin is oriented against per-face local mid-thickness points.

## Verified numbers (sources)
| Item | Value | Source |
|---|---|---|
| Span | 79.75 m | Airbus A380 Aircraft Characteristics (AC) 2-2-0, https://www.aircraft.airbus.com/sites/g/files/jlcbta126/files/2023-12/ac_a380_1223.pdf (Facts & Figures rounds to 79.8 m) |
| Root chord / tip chord | 17.67 m / 3.98 m | same AC 2-2-0 sheet 2 (dimension labels 17.67 m (57.97 ft), 3.98 m (13.06 ft); read as root and tip chord — the labels' meaning is inferred from the drawing text, consistent with RAeS Hamburg's 17.7 m) |
| Semi-span fuselage side → tip | 36.3 m | Airbus / RAeS Hamburg & VDI, Jan 2008, p. 9, https://www.fzt.haw-hamburg.de/pers/Scholz/dglr/hh/text_2008_01_31_A380.pdf ; Emerald, "A380 wing production investment", AEAT 75(6) 2003, https://doi.org/10.1108/aeat.2003.12775faf.008 |
| Area, sweep | 845 m², 33.5° at 25 % chord | Airbus A380 Facts & Figures, https://www.airbus.com/sites/g/files/jlcbta136/files/2021-11/EN-Airbus-A380-Facts-and-Figures-Nov%20-2021.pdf |
| Engine stations | 29.6 m and 51.4 m between engine centrelines (→ 11.2 / 22.1 m from the fuselage side with the 7.14 m fuselage width) | AC 2-2-0 sheet 1 (labels read as engine spacings — inferred) |
| 3 spars per wing (front, centre, rear); centre spar only inboard, "fuselage to just past the inner engine" | — | Emerald 2003 ("six aluminium alloy spars" per wing set); Falzon & Brown, create digital, 2 Jul 2026, https://createdigital.org.au/engineering-evidence-a380-wing-cracks/ |
| Centre spar end at rib 17 | — | EASA AD 2013-0108R3 lists split ribs up to "Rib 17 AFT", https://ad.easa.europa.eu/blob/EASA_AD_2013_0108_R3.pdf/AD_2013-0108R3_1 (inferred end) |
| Ribs, stringers, skins | 126 ribs per wing set (80 metal, 46 CFRP); 62 upper / 95 lower stringers per wing; 20 skin panels per set | Emerald 2003 |
| Wing tanks | 5 per wing: feed 1, feed 2, inner, mid, outer; plus surge and vent tanks; trim tank in the THS | A380 Technical Training Manual ATA 28 (via https://idoc.tips/download/a380level-i-ata-28-fuel-3-pdf-free.html); https://oat.aero/2023/03/17/airbus-a380-general-familiarisation-fuel-storage |
| Tank order along the span | feed 2 at rib 3, inner at ribs 11–12, mid at 14–21, feed 1 at 24–30, outer at 36–39, vent at 48–49 | EASA AD 2013-0108R3 rib references |
| Tank capacities | feed 2 29,340 L; inner 46,140 L; mid 36,460 L; feed 1 27,960 L; outer 10,520 L | Airbus "Flight Deck and Systems Briefing for Pilots" STL 945.1380/05 and Airbus ARFC chart — **read from the search engine's extracted text** of https://www.yumpu.com/en/document/view/7139691/a380-indicating-recording-systems-smartcockpit/153 and https://www.aircraft.airbus.com/sites/g/files/jlcbta126/files/2023-02/Airbus-Commercial-Aircraft-ARFC-A380-Dec-2015.pdf (the yumpu page would not load and the ARFC PDF is image-only, so neither was opened directly) |
| High lift | 2 droop noses (inboard), 6 slats, 3 flaps, 8 spoilers, 3 ailerons per wing; single-slotted tracked flaps; A320-like wingtip fence | Airbus "A380 Flight Controls overview", 2007, https://www.fzt.haw-hamburg.de/pers/Scholz/dglr/hh/text_2007_09_27_A380_Flight_Controls.pdf ; RAeS Hamburg 2008 pp. 36–37 |

## Schematic (not verified) — shown 「（示意）」 in the readouts
Planform kink (s = 11 m, chord 11 m; the leading-edge sweep is derived so the outboard quarter-chord line is exactly
33.5°), dihedral 5.6°, airfoil and thickness (12 % → 9 %), spar chord positions, rib stations (uniform 0.74 m pitch, 49
ribs, every second one drawn), which ribs are composite, tank boundaries (ribs chosen to match the capacity ratios and
the AD rib references), device spans and chords, droop 20°, slat travel, flap travel and 30°, spoiler chord, fence
outline, pylon stub shape and fittings, explode distances. The figure has no display base (dropped so the long wing
fills the card).

## Checks (2026-10-14)
- Line ends: 0 floating at rest / high-lift out / apart / fuel, light and dark (`scripts/lines.mjs`, `drive.mjs`).
- Console clean in both themes; Noto Sans SC installed, no tofu.
- Shots: `shots/v1-rest-light.png` (svg only, 658 px wide, reduced motion), `v1-hl-light.png`, `v1-fuel-light.png`,
  `v1-apart-light.png`, `v1-rest-dark.png`, `v1-fuel-dark.png`, `v1-apart-dark.png` (2× plate shots; the plate outline in
  the keyed shots is the Tab focus ring the capture script triggers).

## Known issues
- The swept wing fills a diagonal band: the top-left and bottom-right corners of the card stay empty (fill ≈ 25 % of
  the card area, the best of the camera sweep tried).
- Droop/slat deployment is small on screen (≈ 1–2 m of travel at ~15 px/m); flaps read clearly.
- Pylon stubs are plain dark wedges; the pylon attach fittings show only at the inner pylon (the outer one is under the
  skin).
- Several leader lines cross parts (后梁 crosses the inner flap, 前缘缝翼 / 上蒙皮 cross the leading edge).
- The tank capacities were not read from an opened copy of the Airbus documents (see sources).

## M2 phone (2026-10-14)
- Under 640 px the button bar moves to the top left (the wingtip fence sat under it at top right).
