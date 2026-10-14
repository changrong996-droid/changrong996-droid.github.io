# 图 9 · A380 客舱内部 (a380-cabin) — v1

Build: `node build.mjs` → `a380-cabin.html` (dark) · `node build.mjs --light` → `a380-cabin-light.html`. Model numbers: `model.mjs`.
Canvas 600 × 520, azimuth 60°, elevation 24°, fit pad 14 (rest) / 14 (apart, second fit eased in on explode).

## What it shows
A forward fuselage segment 8.0 m long, cut off just below the main-deck floor beams (display cut at z 2.05 m) and
standing on a plinth (feet, seam, corner screws, metre ruler, label plate). The near (starboard, +y) skin is cut
away above the main floor; only the lower near skin strip (with frame lines and rivets) remains. Far skin with
stringers and two window belts (one window per frame bay), 13 frames, full rings at both ends.

- Main deck: economy 3-4-3, 5 rows (centre block 4 rows; row 1 centre left out at the stair foot), 0.81 m pitch.
  Each seat block: two leg frames, spreader, cushions, armrests, seat backs with head seam, tray-table outline and
  latch, and a seat-back screen (IFE) facing aft toward the camera. Seat tracks, aisle carpet edges, floor beams.
  Far overhead bins (steep inboard chamfer carrying one PSU per row: reading lights, gasper, sign), ceiling cove and
  lit valance (light strip). Centre bins over the 2+2 block with PSUs on their near chamfer, hung from a ceiling band.
  Forward galley on the far wall (5 trolley bays, work deck, ovens/lockers, knobs). Forward lavatory on the near
  side by Door 1 (bifold door, vents, sign lamp).
- Forward main stair: a straight flight at the forward end, centred, climbing forward from the main deck (foot at
  x 3.87 m) to the upper deck (landing edge x 0.76 m): 14 risers × 0.196 m (2.75 m), 13 goings × 0.24 m, 1.0 m
  clear between 5 cm side panels (closed underneath, drawn per tread so the profile reads as a sawtooth), handrails
  0.9 m over the nosing line, balusters, newels at the foot, top riser board.
- Upper deck: Lufthansa A380 (2014 cabin, "V.1") business class, 2-2-2 lie-flat, 1.63 m pitch, 4 rows (the front
  row has no centre pair: the stair well). Each pair: plinth, two ottomans, outer armrests, centre console with lamp
  and privacy divider, cushions, backrests, shell back with two screens for the row behind. Sidewall lockers both
  sides (the A380 upper-deck sidewall stowage) in 0.62 m lids, far overhead bins with PSUs, ceiling cove and light
  strip, forward closet on the far wall. Floor in four pieces round the stair well (0.76–3.12 m × ±0.62 m), trimmer
  and header beams, near-edge fascia, guard rails on three sides of the well.

## Interaction (Chinese UI)
- Hover: every part has a `data-part`; the part under the pointer takes a warm tone (#f6e4b2 / #ecd296 on light) and
  the readout names it with sourced or （示意） numbers.
- U (or →/←, or 1/2/3, or the buttons 全景 / 主舱 / 上层) cycles the focus states:
  - 全景 `all` — everything.
  - 主舱 `main` — the upper deck rises 1.6 m and fades out; the main floor warms.
  - 上层 `upper` — the upper deck rises 0.35 m, its floor warms, the main deck and its ceiling are ghosted
    (paper fill, faint strokes, CSS only).
- E / Space / Enter / click / 拆解 button: explode (`apart`): upper deck +3.0 m, main-deck ceiling + centre bins
  +1.1 m (staggered springs, view eases to the second fit). Esc → 全景.
- Idle tour: 主舱 → 上层 → 全景 → 拆解 → 合拢 (18 s loop); any hover/key holds it 15 s. Reduced motion: no
  animation, states still switch.
- Hint footer: 悬停识别部件 · U 主舱/上层 · E 拆解.

## Painter's order
Every interior part is an item with its world box (`item(g, part, bb, svg)`); items are topologically sorted over
screen-overlapping pairs (convex-hull SAT) using the axis that splits their boxes (the view vector is positive on
x, y and z, so the high side is nearer). Long parts are split into short chunks (lockers per lid, fascia per bay,
stair side panels and handrails per tread) so their boxes stay tight. Build log: 0 fallback (intersecting) pairs;
14 residual cycles are broken by depth — all among far-side upper-deck items and stair rail chunks that do not
overlap on screen in practice; none visible in the checks. Motions are whole groups rising straight up with
upper ≥ ceiling ≥ main in every frame, so the static order holds in every pose. Hull, far frames and the forward
ring paint first; the near skin strip and the aft ring paint last. Groups are emitted as consecutive
`<g data-g="main|ceil|upper">` runs; the live script moves/fades all runs of a group together.

## Sources
- Fuselage 7.14 × 8.41 m: Airbus A380 AC manual 2-2-0, https://www.aircraft.airbus.com/sites/g/files/jlcbta126/files/2025-12/AC_A380_20251201.pdf
- Cabin width main 6.5 m / upper 5.8 m: Airbus A380 Facts & Figures, https://www.airbus.com/sites/g/files/jlcbta136/files/2021-12/EN-Airbus-A380-Facts-and-Figures-December-2021_0.pdf
- Main deck 3-4-3 seat units 1.57/1.07/1.07/1.57 m, aisle 0.51 m: AC manual 2-5-0 (as in a380-section).
- Lufthansa A380 V.1: business 78 seats, 2+2+2, 64 in pitch, 19.5 in wide, upper deck; economy 3+4+3 on the main deck,
  31–32 in pitch, 18 in wide: https://seatmaps.com/airlines/lh-lufthansa/airbus-a380 (Lufthansa's 2026 refit to
  1-2-1 is noted on the same page; the figure shows the 2-2-2 cabin).
- Forward stair at Door 1 (New Forward Stairs option would move it to Door 2); standard rear stair is spiral:
  Airbus press release 2017-04, https://www.airbus.com/en/newsroom/press-releases/2017-04-airbus-develops-package-of-new-a380-cabin-enablers-including-new
- Forward stair is a straight flight wide enough for two people side by side: Simple Flying,
  https://simpleflying.com/airbus-a380-staircase-structure/

## Schematic / estimated (marked （示意） in readouts)
Deck heights (main 2.55, upper 5.30 m, as in a380-section), ovoid as two half-ellipses, frame pitch 0.667 m, the
display cut; stair position on the centreline, its width, going, riser count and the well size (real stair
geometry not published); business pair width 1.32 m and aisle 0.55 m; seat, shell and screen sizes; bin, PSU,
ceiling and light-strip details; galley, lavatory and closet sizes and positions; window size and one-per-bay.
Headroom over the lower stair treads under the well end is about 1.7 m in this drawing (the well is kept short so
the business rows fit) — schematic.

## Checks (v1)
- Headless Chrome captures in both themes, all four states, hover highlight, mid-explode and mid-fade frames.
- `scripts/lines.mjs` on the light page: 0 floating ends (334 ends / 133 lines).
- Console clean. Page 662 KB (path data rounded to 0.1 and written relative).
- Shots: `shots/v1-rest-light.png`, `v1-main-light.png`, `v1-upper-light.png`, `v1-apart-light.png`,
  `v1-rest-dark.png` (captured with `--select ".iso-stage > svg" --scale 2 --reduced`, resized to 658 px wide; the
  button bar overlaps the top edge of these crops, as in the stage).

## Known issues
- At rest most of the main deck sits under the upper floor (true to the cutaway); 主舱 focus is the way to see it.
- The stair is mostly hidden under the upper floor at rest; its treads read in 主舱 and 拆解.
- The aft end ring crosses the last economy rows (it is in front of them); intended, as in a380-section.
- No leader labels yet (the atlas adds them with tools/addlabels.py); not integrated into figures/index.html.
- No `--audit` (no pipes/round parts); painter's order verified by the sort log and screenshots only.
