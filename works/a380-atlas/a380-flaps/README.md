# Fig 7 · A380 trailing-edge flaps (图 7 · A380 后缘襟翼) — step 1

An ~11 m spanwise segment of the inboard trailing edge of the (left) wing, between the rear spar and the trailing edge,
seen from outboard, aft and above (series azimuth 40°, elevation raised to 45° so a raised spoiler does not lie along the
sight line). Same pipeline as Figs 5/6: Chinese UI (lang zh-CN, CJK font stack, Chinese buttons, readouts, aria, title),
focus ring on Tab only.

- `a380-flaps.html` (dark), `a380-flaps-light.html` (light), ~251 KB each, 198 solids.
- Built by `build.mjs`, which is generated: `python3 work/fl-gen-tail.py && bash work/fl-mk.sh`
  (sources `work/fl-head.mjs`, `fl-helpers.txt`, `fl-body.mjs`, `fl-tail-*.txt`; the path compaction and the CJK/button
  CSS constants are copied verbatim from Fig 6's `work/cg-tail.mjs`).
- Geometry constants in `model.mjs` (model x = chord aft from the rear spar, y = span outboard, z up; world X = span,
  world Y = chord).

## Contents
- Rear spar web with vertical stiffeners and caps; wing-box upper skin strip cut back outboard of 7.6 m; lower skin strip;
  two ribs; outboard of 9.3 m the web is cut down to show the drive shaft; lower cove skin.
- Two Fowler flap panels (of three per wing); the outboard end is a cut face showing the airfoil section.
- Three flap-track ("canoe") fairings with track, carriage and link; the outboard one is cut open (inboard wall only).
  The aft fairing part rides with the flap.
- Four spoilers hinged on the shroud, each with a hydraulic actuator (cylinder + rod) anchored on the spar web.
- Flap drive shaft along the spar with a rotary actuator (gearbox) and output link at each track station.

## Interaction
- F: flaps, 6 poses — leading edge runs 1.4 m aft and 0.32 m down along the tracks while the panel rotates 0 → 32°
  (plus the 5° stowed tilt). Button 放下襟翼 (F) / 收起襟翼 (F).
- S: spoilers, 4 poses 0/15/30/45° about the shroud hinge, actuators follow. Button 升起扰流板 (S) / 收起扰流板 (S).
- E / Space / Enter / click: explode (spoilers + actuators up, shroud and skin up, flaps aft and up, fairings aft and down);
  Escape restores everything. Arrow keys step the five zones. prefers-reduced-motion: no tour, instant poses.
- Hover readouts (Chinese) for flap, spoiler, track fairing, rear spar, actuator.

## Verified numbers (sources)
- 3 flaps, 8 spoilers, 3 ailerons per wing: Airbus, "A380 Flight Controls overview" (DGLR/HAW Hamburg talk, 27 Sep 2007),
  p. 3 "Flaps (3x2) · Ailerons (3x2) · spoilers (8x2)",
  https://www.fzt.haw-hamburg.de/pers/Scholz/dglr/hh/text_2007_09_27_A380_Flight_Controls.pdf
  (consistent with Airframer's A380 supplier guide: "Three-section flaps and ailerons on each wing, plus eight spoilers",
  https://www.airframer.com/aircraft_detail.html?model=A380).
- Fowler-type flaps extending aft on tracks: same Airbus overview (flap tracks, flap PCU, drive shaft system).

## Schematic (not verified)
Segment length, spar depth (1.2 m), skin/rib layout, stiffener pitch, flap chord (3.3 m) and section, Fowler travel and
angle, track/fairing stations and shape, carriage and link, spoiler chord, hinge position and 45° max, actuator geometry,
shaft position and gearbox shape — all schematic.

## Checks (2026-10-14)
- Line ends: 0 floating in rest / flaps-down / spoilers-up / apart, light and dark (`shots/lines-*.png`).
- Console clean in both themes; Noto Sans SC installed, no tofu in shots.
- Shots: `shots/rest-light.png`, `flaps-down-light.png`, `spoilers-up-light.png`, `apart-light.png`, `rest-dark.png`.

## Step 2 — cut-away and darker metal (2026-10-14)

- **Cut-away bay (outboard).** Shroud cut back at y = `SHROUD_END` 7.02 m (cut-tone end slice); the outboard spoiler is cut back to an 0.8 m stub (`SP_STUB`, cut-tone end) so its actuator stays attached and still rises with S. Outboard of `FLAP_OPEN` 8.1 m the outer flap loses its skins: D-nose, rear spar (u 1.9 m) and trailing-edge wedge remain, with ribs at `FLAP_RIBS` 8.75 / 9.4 (support rib at the outboard track) / 10.2 m and a cut-tone end rib at 11.0 m. At rest the track, carriage, one spoiler actuator and the drive shaft with its rotary actuator show through the bay. Inboard spoilers 1–3 are whole.
- **Tones.** New classes in `fl-tail-css.txt`: `fl-alu` (spoilers, flap skins: mid 72 % + lo), `fl-skin` (shroud / box skin), `fl-rib`, `fl-dark` (actuator bodies, rotary actuators, carriages: mid 55 % + black), `fl-steel` (shaft, piston rods, links). The lit highlight on `fl-alu`/`fl-rib` blends 55–60 % metal with the lit tone, so highlighted panels no longer go to plain paper (light) or black (dark).
- **Spoiler thickness.** Section 0.125 m at the hinge, 0.05 m at the trailing edge (was 0.08 / 0.012); trailing-edge rest gap raised to 0.028 m so it clears the flap.
- **Framing.** Plate depth 7.2 → 6.4 m, base 3.0 → 2.4 m below the datum; plaque moved forward.
- **Readouts.** Flap: “… · 外段去蒙皮见翼肋（示意）”; spoiler: “图示 4 块（外侧一块截短）”. Everything else unchanged and still from `model.mjs`.
- Result: 233 solids, page 296 KB (both themes). Line check 0 floating ends in rest / flaps / spoilers / apart, light and dark; console clean. Shots: `shots/s2-*.png`.
- Backups of step 1: `work/fl-*-s1.*`, `model-s1.mjs`. Shot scripts: `work/fl-s2-step2.json`, `work/fl-s2d-step2.json` (copies of fl-s2/fl-s2d with `s2-` names).

## M5 v2 — atlas pass (2026-10-14)
- Camera azimuth 40 → 55°, elevation 45 → 28°: the flap section, the slot and the Fowler travel now read instead of a top-down slab.
- Light palette on the atlas ladder (same as Fig 8): pale shroud/box skin, flaps a step darker, spoilers (new class `fl-spl`) between, fairings mid, actuators/shaft dark.
- Five leader labels (扰流板, 富勒襟翼, 滑轨整流罩, 后梁, 襟翼传动轴) outside the silhouette; fade out when exploded, the flap label also while the flap is out; hidden under 480 px.
- All figures: the tour no longer resumes (and resets F/S) 3.6 s after a key press; now 15 s.
- Backup: /workspace/work/a380r/pre-goal/a380-flaps.build.mjs. Review shots: /workspace/work/a380r/review/a380-flaps/{base,v3}.
