# Fig 6 · A380 forward lower-deck cargo hold

A 6 m fuselage barrel segment at the forward hold, seen from aft right (az 40 / el 14). The right (starboard) side is the near side, so the forward cargo door faces the camera. The near lower skin is cut away aft of the door (from station 4.73 m), and the aft end of the barrel is open. All visible UI text is Chinese (`lang="zh-CN"`, CJK font stack). Code and this README are in English.

- `a380-cargo.html` (dark) and `a380-cargo-light.html` (light), about 192 KB each, 150 solids
- `build.mjs` is generated: `bash work/cg-mk.sh` concatenates `work/cg-head.mjs`, `cg-helpers.txt`, `cg-body.mjs` and `cg-tail.mjs`. `cg-tail.mjs` is itself generated from the Fig 5 tail by `work/cg-gen-tail.py`, using `cg-tail-head.txt`, `cg-tail-info.txt` and `cg-tail-keys.txt`.
- `model.mjs` holds the verified numbers and the schematic geometry.

## Contents
- **Fuselage structure (机身结构)**: the shell is drawn as an ellipse 7.14 × 8.41 m and kept from the keel up to about 1 m above the main deck (188°–352°). It is split into a back piece and near pieces around the door aperture. It has 10 frames, the bare frames in the cutaway, a keel beam and the far-side hold lining (stopped short of the aft end). The main deck has floor beams, a forward floor-panel stub and four seat tracks.
- **Cargo floor / rollers (货舱地板/滚棒)**: floor panel, transverse floor beams, four roller trays (rollers drawn as dots), a door-area ball mat, side guides, a centre guide and four power drive units.
- **LD3 (集装箱 LD3)**: four AKE containers with the chamfered side facing outboard. Three sit in the left row and one is rolling in at the door on the ball mat. Each has a base rim, a door panel and two locking bars on its aft face.
- **Cargo door (货舱门)**: upward-opening and hinged along its top edge, with a hinge rod and six latching cams (spools) on the sill. Six precomputed door poses (0–120°) carry latch hooks on the bottom edge (hidden when closed). Only the door moves.

## Interaction
Hovering the 4 zones gives a Chinese readout with numbers. **C** or the button "打开货舱门 (C)" / "关闭货舱门 (C)" toggles the door poses. **E**, Space, Enter or a click explodes the view: containers slide aft 2.1 m (staggered), the door moves out and up, the main deck rises 1.5 m, and the shell pieces move outward. **Esc** restores. Arrow keys move between zones. Reduced motion is respected (no tour, instant poses). The focus ring shows only on keyboard focus (`:focus-visible`). On narrow screens (≤560 px) the readout wraps and the hint sits above it.

## Verified numbers (sources)
| Item | Value used | Source |
|---|---|---|
| Forward cargo door | 3.11 × 1.75 m (aft door 2.79 × 1.75 m) | ANA Cargo A380 spec, https://www.anacargo.jp/en/int/specification/a380.html |
| LD3 / AKE | base 1.562 × 1.534 m, height 1.626 m, overall (top) width 2.007 m | Hansatic AKE guide, https://hansatic.com/en/guides/ake-ld3-uld-dimensions (also Hi Fly A380 sheet 156.2 / 153.4 / 162.6 / 200.7 cm) |
| Lower-deck LD3 capacity | 38 total | Airbus A380 specifications page (archived PDF), https://downloads.regulations.gov/TSA-2013-0004-5585/attachment_20.pdf |
| Forward / aft split | FWD 20 LD3 standard, 22 option; AFT 16 | Airbus A380 Aircraft Characteristics 2-6-0, https://www.aircraft.airbus.com/sites/g/files/jlcbta126/files/2025-12/AC_A380_20251201.pdf (read from the search excerpt; the PDF was not opened in full) |
| Fuselage width | 7.14 m | Airbus specifications PDF above |
| Fuselage height | 8.41 m | Airbus AC doc 2-2-0 General Aircraft Dimensions (search excerpt, same PDF) |

Note: the brief's "about 2.70 × 1.70 m" door matches the **aft** door (ANA 2.79 × 1.75; Fly Us lists 2.69 × 1.70). The forward door is larger, so the figure uses 3.11 × 1.75 m.

## Schematic (not verified)
These are all schematic: the elliptic section shape, barrel length, frame pitch (0.635 m), floor and deck heights, AKE chamfer height (0.64 m), roller-tray/ball-mat/guide/PDU layout, the 120° door opening, the number of latch cams, the cradles and the base plate.

## Checks
- drive `lines`: 0 floating ends at rest, door open and apart, in both light and dark
- console clean in light, dark, phone and reduced motion
- shots: `shots/rest-light.png`, `door-open-light.png`, `apart-light.png`, `zoom-door-light.png`, `phone-light.png` (390×844), `rest-dark.png`

## Step 2 (2026-10-13)
- 近侧下部蒙皮在 CUT_Q (4.73 m) 之后整段剖开至主甲板地板以上；剖开区隔框只保留货舱地板以下的短段（随后壳 shellB 一起移动，末端为剖切色）。
- 剖开区两根主甲板梁近端截短到 y = 0.55 m，端头为剖切色小块；近侧两条座椅滑轨止于 CUT_Q。门、门框（门上下蒙皮与后门框段）不变。
- 集装箱改为深铝色（`.cg-alu`，模式同 `.tl-metal`），后端面加角柱、门框轮廓（`.cg-post`）与门帘板（`.cg-panel`）；滚棒槽/球垫区 `.cg-tray`、动力驱动单元 `.cg-pdu` 为中深色。CSS 在 work/cg-tail-css.txt，经 work/cg-gen-tail.py 注入。
- 拆解时货舱门偏移改为外移 3.4 m、上移 2.0 m（原 2.0 / 0.9）。
- 162 个实体，页面约 199 KB；静止 / 开门 / 拆解，两主题线端悬空均为 0，控制台干净。
- 截图：shots/s2-rest-light.png、s2-door-open-light.png、s2-apart-light.png、s2-rest-dark.png。
- 构建：`cd work && python3 cg-gen-tail.py && cd .. && bash work/cg-mk.sh`（cg-mk.sh 本身不调用生成器）。

## M5 v2 — atlas pass (2026-10-14)
- C door animation verified: the 3 s shot reads 货舱门打开 · 绕上铰链外翻 120° (the base sheet's 关闭 reading came from an earlier capture).
- Light theme: the closed door leaf takes a step of the anatomy ladder (zone door and data-acc="door" solids, mixW 46/64), so the aperture reads on the white skin. When the door is selected it still lights white (selection highlight).
- Four atlas leader labels via tools/labels/a380-cargo.json: 前货舱门 3.11 × 1.75 m, LD3 集装箱, 主舱地板梁, 滚棒货物装卸系统 (fade when exploded, hidden under 480 px).
