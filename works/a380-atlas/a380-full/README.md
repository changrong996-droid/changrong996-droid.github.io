# 图 8 · A380-800 整机

`a380-full-light.html` / `a380-full.html`（浅色 / 深色）。构建：`cd work && python3 fu-gen-tail.py && bash fu-mk.sh`
（源文件：`work/fu-head.mjs`、`fu-helpers.txt`、`fu-body.mjs`、`fu-tail-*.txt`、`fu-gen-tail.py`，几何参数在 `model.mjs`）。

## M1 整机外形
整机示意，按实机外廓尺寸（全长 72.72 m、翼展 79.75 m、高 24.09 m、机身宽 7.14 m / 高 8.41 m、1/4 弦后掠 33.5°）。
左前上方视角（方位 40° / 仰角 27°），起落架放下。7 个悬停区链接 7 张分解详图；E 键拆解为五段机身、机翼外移、发动机下移。
（M1 时本文件尚不存在；尺寸来源见各详图 README 与 Airbus A380 Facts & Figures / Aircraft Characteristics 文档。）

## M2 剖视窗
- 左侧（近侧）阶梯式剖视窗：前段 x 11.9–21.6 m（顶边在上层地板之上约 0.85 m），中段 x 22.4–40.5 m（顶边至上层客舱行李架）。
  底边取左侧蒙皮仍朝向镜头的最低点（轮廓线处），切口边线用 hi 色调闭合描出。内饰以屏幕空间 clipPath 只在窗内显示。
- 舱内：上下两层地板（薄板 + 地板梁层）、座椅排方块（主舱 3-4-3、上舱 2-4-2，排距 1.25 m）、行李架条、
  前货舱地板与 6 个 LD3 集装箱（较深铝色）、中央翼盒。前段与翼盒上方的主舱地板近侧切回到 y = −0.35 m，以便从上方看到货舱与翼盒。
  内饰色调比深灰蒙皮浅，便于辨认。
- 新悬停区「客舱」：读数「客舱 · 上下两层 · 典型 525 座 · 点击查看详图」（525 座为 Airbus 典型三舱布局数字），链接客舱剖面详图。
- 机腹整流罩：独立浅一档色调，凸起最大 0.75 m，在 x = 22 处分为前后两块，前块随前段移动并画在前段之上；剖视窗处被切开。
  整流罩后端改到 x 46.5，货舱门（示意，实机在右侧）移到后段 x 47–49，让出前货舱给剖视窗。
- 内侧机翼（翼根至 y 10.5 m）并入「翼根起落架」悬停区；前起落架并入「机头驾驶舱」悬停区。
- 浅色主题：客舱舷窗点加深；深色主题：各色带面以同色描边，消除面带之间的发丝缝。
- 驾驶舱剖切：本里程碑未做（成本/收益不划算，风挡已在）。
- 预算：199 个实体，页面约 255–260 KB；静止与拆解状态、两种主题浮动线端 0；控制台干净；中文无豆腐块。
- 截图：`shots/m2-rest-light.png`、`m2-apart-light.png`、`m2-zoom-cabin-light.png`、`m2-rest-dark.png`（另有 `m2-apart-dark.png`、`m2-hover-cabin-light.png`）。

## M3 机构（2026-10-14）
- **G 起落架**（按钮 收起起落架 (G) / 放下起落架 (G)）：4 个预计算姿态（0 放下、1/3、2/3、3 收起）。前起落架绕顶部枢轴向前摆入机头舱（约 92°）；翼下起落架绕纵向枢轴向内摆（约 88°）；机身起落架示意为向后转 80° 并上移 1.6 m 收入机腹整流罩。收起姿态为空组，起落架完全隐藏，拆解视图中不会出现悬浮零件。舱门省略（相机在上方，机腹不可见）。
- **F 襟翼**（放下襟翼 (F) / 收起襟翼 (F)）：每侧 3 块后缘襟翼，4 个姿态，每个站位绕自身前缘转 0→30°，同时后移 0.42c、下移 0.16c（富勒运动）；最后姿态每侧 3 块扰流板绕前缘升起 14°。
- **C 货舱门**（打开货舱门 (C) / 关闭货舱门 (C)）：x 47–49 的舱门绕上沿铰链向上向外转到 110°，4 个姿态；开启后露出深色门洞。
- 过渡：每个机构以匀速相位（起落架 2.4 s，襟翼/舱门 1.6 s）加 smoothstep 映射到姿态组（display 切换）；prefers-reduced-motion 时直接跳到终态。按钮文字与 aria-pressed 随状态切换；舞台获得焦点时 G/F/C 键同样有效。姿态组位于原有 data-move 组内，E 拆解时随机翼/机头/后段一起移动。
- 角注提示移到读数上一行（桌面），手机端缩小字号与按钮内边距。
- 291 个实体，页面约 357 KB（浅色）/ 361 KB（深色）。连线端点悬浮 0：浅色 静止/收起落架/放襟翼/开舱门/拆解，深色 静止/收起落架；控制台无报错。
- 截图：shots/m3-gear-up-light.png、m3-flaps-door-light.png、m3-apart-light.png、m3-phone-light.png、m3-gear-up-dark.png。

## M4 打磨（2026-10-14）
- **状态读数**：右下角读数与舞台 aria-valuetext 随机构状态更新。任一按钮切换后显示「起落架收起 · 襟翼放下 · 货舱门开启」这类三段状态；悬停区段时显示区段说明，aria-valuetext 同时附带当前机构状态；拆解时显示拆解说明并附状态。图注与 SVG 标签不再写死「起落架放下」，改为说明三项可切换、初始为放下/收起/关闭。
- **襟翼/扰流板**：偏转后的襟翼（姿态 1–3）改用更深的 `fu-flapdn` 色调，升起的扰流板用 `fu-spl`，描边加粗到 1.5 px（浅色主题黑色、深色主题 hi 色），两侧机翼上都清楚可见；深色主题已检查。
- **货舱门**：门板色调加深一档、描边加粗；开启后门洞改为接近黑色的 `fu-hole`。
- **手机**：390 px 宽时舞台加 8 px 上内边距，按钮底边（115.5）与 SVG 顶边（120）不再重叠。
- 291 个实体，页面约 360 KB（浅色）/ 365 KB（深色）。连线端点悬浮 0：浅色 静止/收起落架/放襟翼/开舱门/拆解，深色 静止/放襟翼；控制台干净；中文无豆腐块。
- 截图：shots/m4-rest-light.png、m4-flaps-gear-door-light.png（三项全切换）、m4-apart-light.png、m4-phone-light.png、m4-rest-dark.png（另有 m4-flaps-dark.png）。

## M5 v2 改版（2026-10-14，迁到 changrong996-droid.github.io/works/a380-atlas/）
- **配色（浅色主题）**：不再整机一片中灰。机身浅灰白、机腹整流罩稍深、机翼/尾翼/吊挂中灰（新类 `fu-wing`）、短舱更深，襟翼与扰流板比机翼深一档；深色主题保持原样。
- **襟翼**：去掉 1.5 px 黑色粗描边；富勒行程加大到后移 0.62c、下移 0.2c，缝道更清楚；新增每侧 6 个襟翼滑轨整流罩（`fu-canoe`，y = 6.4/10.2/14.0/17.7/21.4/25.0 m，示意），尾端伸出后缘、与放下的襟翼对齐。
- **舷窗与舱门**：舷窗点放大（浅色 1.05），舱门轮廓加深。
- **驾驶舱风挡**：四块分散的黑块改为一条贴着机头曲面、向侧后掠的连续风挡带（两块正面 + 两块侧面，细窗框分隔）。
- **翼尖篱**：改为 A380 的箭头形：上方较大三角 + 下方较小三角，共用近竖直后缘。
- **底座**：从只托机头（x 3–43 m、±9.5 m）放大到 x 1–62 m、±12 m，铭牌移到左前角。
- **焦点框**：改为舞台内侧虚线（outline-offset −3 px），不再压到左上角标题。
- 303 个实体，页面约 376 KB（浅色）；静止/拆解/三项全切换/深色/手机截图检查，控制台干净。

## 资料来源（整机图）
- 外廓尺寸（全长 72.72 m、翼展 79.75 m、高 24.09 m、机身宽 7.14 m / 高 8.41 m、1/4 弦后掠 33.5°）：Airbus A380 Aircraft Characteristics — Airport and Maintenance Planning
  （https://www.aircraft.airbus.com/sites/g/files/jlcbta126/files/2025-12/AC_A380_20251201.pdf ；旧版 https://www.airbus.com/sites/g/files/jlcbta136/files/2021-11/Airbus-Aircraft-AC-A380.pdf ），
  以及 Airbus A380 Facts & Figures（https://www.airbus.com/sites/g/files/jlcbta136/files/2022-01/EN-Airbus-A380-Facts-and-Figures-January-2022.pdf ）。
- 每侧 3 块后缘襟翼、8 块扰流板：Airbus A380 Flight Controls 概述（2007，HAW Hamburg DGLR 讲座，https://www.fzt.haw-hamburg.de/pers/Scholz/dglr/hh/text_2007_09_27_A380_Flight_Controls.pdf ）。本图每侧只画 3 块扰流板（示意，非 8 块）。
- 货舱门尺寸 3.11 × 1.75 m：ANA Cargo A380 规格页（https://www.anacargo.jp/en/int/specification/a380.html ）。
- 典型三舱 525 座：Airbus A380 Facts & Figures（同上）。
- 4 台遄达 900：Rolls-Royce Trent 900（https://www.rolls-royce.com/products-and-services/civil-aerospace/widebody/trent-900.aspx ）；各区段细节来源见对应详图 README。

## 示意部分（非实测）
- 机身截面形状、翼型与厚度分布、翼尖小翼、短舱与吊挂外形、尾翼剖面均为示意。
- 货舱门实机在右侧前部；此处画在可见的左侧、并移到后段 x 47–49 m，仅为展示。
- 扰流板数量（每侧 3 块，实机 8 块）、襟翼偏角（30°）与富勒行程、扰流板升角（14°）为示意。
- 起落架收放路径、机身起落架后转上移、省略的起落架舱门均为示意；机轮数与布局按实机。
- 剖视窗位置、座椅排（排距 1.25 m）、行李架、6 个 LD3、中央翼盒为示意排布，不代表具体航司布局。
- 拆解位移与展示底座为图示手段。

## M5 v2 — atlas pass (2026-10-14)
- Six index leader labels via tools/labels/a380-full.json, each naming the detail figure it opens (图1 客舱剖面, 图2 驾驶舱, 图3 翼根起落架, 图4 发动机, 图5 尾段, 图7 襟翼); fade when exploded, hidden under 480 px.
- Light theme hover/tour highlight: LIT() now blends toward the series' warm lamp tone (#f4dc9a / #e3c27a) instead of white, which barely read on the pale airframe. Dark theme unchanged.
- Nose facets and near-side flap visibility reviewed at 2x zoom: no defect worth changing at this camera.

## M6 (2026-10-14)
- Cabin cut-away zone now links to 图9 a380-cabin; new zone "wing" (outer wings + fences) links to 图10 a380-wing; added to ORDER and tour. Labels: 图9 客舱内部 (cut-away), 图1 客舱剖面 (fuselage), 图10 机翼结构 (near outer wing).
