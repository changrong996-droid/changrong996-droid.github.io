/*PWGEOM>*/
const PW_GEOM = {
  nose: 8.0, // body x of the nose tip (NOSE_TIP)
  // nozzle exit 12.8 m from the nose (model 15.2), about 0.85 m below the belly as in the photos: the same three
  // segments (1.22 m along the axis) and serrated petals, but the swivel starts 40° down and turns the last 50° to
  // vertical. The first ring sits wholly inside the aft fuselage (its lowest point on the belly skin); the segments
  // are drawn just behind the fuselage, which hides the part inside it, so the duct leaves the belly cleanly.
  nozBase: [-4.3, 0, -0.2],
  nozA0: 40, // deg below the aft horizontal at the first ring (at 90°; this page scales it with the nozzle angle, so 0° = straight aft)
  nozZ0: -0.1, // base height when straight (this page only): on the shortened engine's axis
  gearDX: -1.3, // main gear 9.85 m from the nose (model 8.55): legs, wheels, braces, doors, leaves, wells
  noseDX: -0.88, // nose gear 3.83 m from the nose (model 2.95): leg, wheel, brace, doors, bay seam, well → wheelbase 6.02 m
};
function pwPatch(src, G) {
  const one = (s, a, b) => { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error("pwPatch: " + a.slice(0, 40)); return s.slice(0, i) + b + s.slice(i + a.length); };
  const dx = G.gearDX, X = (v) => +(v + dx).toFixed(3), N = (v) => +(v + G.noseDX).toFixed(3);
  const all = (s, a, b, n) => { const k = s.split(a).length - 1; if (k !== n) throw new Error("pwPatch: " + a.slice(0, 40) + " ×" + k); return s.split(a).join(b); };
  let s = one(src, "const base = [-6.42, 0, 0.04];", `const base = [${G.nozBase[0]}, 0, ${G.nozZ0} + (${G.nozBase[2] - G.nozZ0}) * Math.min(1, Math.max(0, deg / 90))];`);
  s = one(s, "const th = Math.max(1e-4, deg * D2R);", `const kk = Math.min(1, Math.max(0, deg / 90)); const a0 = ${G.nozA0} * D2R * kk; const th = Math.max(1e-4, deg * D2R - a0);`);
  s = one(s, "const at = (s) => { const f = s / R; return [V3.add(base, [-R * Math.sin(f), 0, -R * (1 - Math.cos(f))]), [-Math.cos(f), 0, -Math.sin(f)]]; };",
    "const at = (s) => { const f = a0 + s / R; return [V3.add(base, [-R * (Math.sin(f) - Math.sin(a0)), 0, -R * (Math.cos(a0) - Math.cos(f))]), [-Math.cos(f), 0, -Math.sin(f)]]; };");
  s = one(s, 'add(`nozzle.${i}`, seg, { tone: "hi", lit: true, bias: 3 + i * 0.01, seams: true, smooth: true, cls: "xr-keep" })',
    'add(`nozzle.${i}`, seg, { tone: "hi", lit: true, bias: 3 + i * 0.01, seams: true, smooth: true, cls: "xr-keep", rel: { to: ["fuselage"], d: 0.05 - i * 0.001, side: [0, 0, -1] } })');
  for (const id of ["mp", "ms"]) { // main legs: every station in the GEAR entry
    const a = s.indexOf(`{ id: "${id}",`), b = s.indexOf("\n", a);
    if (a < 0) throw new Error("pwPatch: gear " + id);
    s = s.slice(0, a) + s.slice(a, b).replace(/\[(-?[\d.]+), (-?[\d.]+), (-?[\d.]+)\]/g, (m, x, y, z) => `[${X(+x)}, ${y}, ${z}]`) + s.slice(b);
  }
  s = one(s, "lerp(1.0, -0.75, u)", `lerp(${X(1.0)}, ${X(-0.75)}, u)`);
  s = one(s, "skinZ(0.1, side * 1.6, false)", `skinZ(${X(0.1)}, side * 1.6, false)`);
  s = one(s, "lerp(1.06, -0.6, u)", `lerp(${X(1.06)}, ${X(-0.6)}, u)`);
  s = one(s, "skinZ(0.2, side * 0.66, false)", `skinZ(${X(0.2)}, side * 0.66, false)`);
  s = one(s, "lerp(1.06, -0.75, i / 8)", `lerp(${X(1.06)}, ${X(-0.75)}, i / 8)`);
  s = one(s, "lerp(-0.75, 1.06, i / 8)", `lerp(${X(-0.75)}, ${X(1.06)}, i / 8)`);
  s = one(s, "at: [0.2, side * 0.83, -0.7]", `at: [${X(0.2)}, side * 0.83, -0.7]`);
  s = one(s, "at: [0.12, side * 1.3, -0.7]", `at: [${X(0.12)}, side * 1.3, -0.7]`);
  s = one(s, "at: [0.15, side * 1.1, -0.7]", `at: [${X(0.15)}, side * 1.1, -0.7]`);
  s = one(s, "out.L0 = [-0.15, g.side * 1.08, -0.42];", `out.L0 = [${X(-0.15)}, g.side * 1.08, -0.42];`);
  // nose gear: leg, fork, wheel and drag brace; doors and their hinge; bay opening and dark well; the bay seam
  s = one(s, '{ id: "ng", top: [5.05, 0, -0.5], wheel: [5.05, 0, -1.78], r: 0.3, wid: 0.2, brace: [5.6, 0, -0.55],',
    `{ id: "ng", top: [${N(5.05)}, 0, -0.5], wheel: [${N(5.05)}, 0, -1.78], r: 0.3, wid: 0.2, brace: [${N(5.6)}, 0, -0.55],`);
  s = one(s, "lerp(6.5, 4.4, u)", `lerp(${N(6.5)}, ${N(4.4)}, u)`);
  s = one(s, "skinZ(5.4, side * 0.24, false)", `skinZ(${N(5.4)}, side * 0.24, false)`);
  s = all(s, "lerp(6.5, 4.4, i / 8)", `lerp(${N(6.5)}, ${N(4.4)}, i / 8)`, 4);
  s = one(s, "at: [5.4, 0, -0.5]", `at: [${N(5.4)}, 0, -0.5]`);
  s = one(s, "5.05, 4.7, 4.35, 4.0, 3.7, 3.4,", `5.05, ${N(5.7)}, 4.7, 4.35, 4.0, 3.7, ${N(4.35)}, 3.4,`); // fuselage rings for the moved seam
  s = one(s, "const ngA = ri(5.7), ngB = ri(4.35);", `const ngA = ri(${N(5.7)}), ngB = ri(${N(4.35)});`);
  // this page only (x-ray parts): the F135 drawn shorter so its augmentor duct ends at the moved nozzle base (x −4.3);
  // the stations keep their order (fan, core, turbine, augmentor duct), lengths are illustrative
  s = one(s, "eng: { x0: -0.3, x1: -6.4, z0: 0.12, z1: 0.04 },", "eng: { x0: -0.3, x1: -4.3, z0: 0.12, z1: -0.1 },");
  s = one(s, "er(-1.85, 0.6), er(-2.35, 0.5)]", "er(-1.6, 0.6), er(-1.95, 0.5)]");
  s = one(s, "tube([er(-2.35, 0.5), er(-3.45, 0.47), er(-3.7, 0.5)], 26)", "tube([er(-1.95, 0.5), er(-2.75, 0.47), er(-2.95, 0.5)], 26)");
  s = one(s, "tube([er(-3.7, 0.52), er(-4.35, 0.54)], 26)", "tube([er(-2.95, 0.52), er(-3.45, 0.54)], 26)");
  s = one(s, "tube([er(-4.35, 0.55), er(-6.4, 0.615)], 26)", "tube([er(-3.45, 0.55), er(-4.3, 0.6)], 26)");
  s = one(s, "const BYPASS = [[-0.5, 0.64], [-1.2, 0.655], [-1.9, 0.655], [-2.6, 0.6], [-3.6, 0.6], [-4.3, 0.6]];", "const BYPASS = [[-0.5, 0.64], [-1.2, 0.655], [-1.6, 0.655], [-2.1, 0.6], [-2.9, 0.6], [-3.45, 0.6]];");
  return s;
}
/*<PWGEOM*/
// 功率流向 · F-35B STOVL：one fixed x-ray shot; three modes (常规飞行 / 过渡 / STOVL 悬停). Power flow is drawn as
// filled bands with moving chevrons (no stroked lines). Band widths at the outlets follow the P&W hover split
// (83.1 / 83.1 / 7.3 + 7.3 kN) and are illustrative (示意); nothing else on the page is a measured quantity.
(() => {
  const D0 = window.PW;
  if (!D0 || !window.F35M) return;
  fetch("shared/f35b-model.js").then((r) => r.text()).then((src) => (new Function(pwPatch(src, PW_GEOM) + "\nreturn F35M;"))())
    .catch(() => window.F35M) // file:// (no fetch): the shared geometry
    .then(pwStart);
})();
function pwStart(Mo) {
  const D = window.PW;
  const svg = document.querySelector(".tp-svg"), box = document.querySelector(".tp-box");
  if (!D || !Mo || !svg) return;
  const $ = (s) => svg.querySelector(s);
  const gAc = $(".pw-ac"), gBand = $(".pw-bands"), gFlow = $(".pw-flows"), gLbl = $(".pw-lbls"), gHit = $(".pw-hits"), gRing = $(".pw-ring");
  const cap = document.querySelector(".pw-cap"), sankey = document.querySelector(".pw-sk");
  const readEl = document.querySelector("[data-read]");
  const cellEl = {}; document.querySelectorAll("[data-v]").forEach((el) => { cellEl[el.dataset.v] = el; });
  const mBtns = [...document.querySelectorAll("[data-mode]")];
  const C = Mo.camera(D.P);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = matchMedia("(max-width: 700px)");
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (e0, e1, v) => { const t = clamp((v - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  const P2 = (p) => f1(p[0]) + " " + f1(p[1]);
  const base = Mo.stateAt(Mo.TIMES.C.tDescend + 0.02);
  const B = (p) => Mo.project([p[0] * 10, p[1] * 10, p[2] * 10], C); // body metres → screen (aircraft at the origin, pitch 0)

  // ---- modes ----
  const MODES = {
    cruise: { door: 0, aux: 0, fan: 0, noz: 0, posts: 0, gear: 0 },
    trans: { door: 1, aux: 1, fan: 1, noz: 45, posts: 1, gear: 1 },
    hover: { door: 1, aux: 1, fan: 1, noz: 90, posts: 1, gear: 1 },
  };
  const KEYS = ["door", "aux", "fan", "noz", "posts", "gear"];
  // conversion order (illustrative): doors and aux inlet first, then the clutch engages and the fan spools; the 3BSM
  // turns at its published rate (95° in 2.5 s). Back to wingborne flight runs the other way round.
  const TIMING = { up: { door: [0, 0.9], aux: [0.1, 0.9], gear: [0, 1.2], fan: [0.7, 0.8], posts: [0.9, 0.6], noz: [0.5, 0] },
    down: { noz: [0, 0], posts: [0.2, 0.6], fan: [0.4, 0.8], door: [1.1, 0.9], aux: [1.1, 0.9], gear: [1.4, 1.2] } };
  let cur = Object.assign({}, MODES[D.START]), target = D.START, anim = null;

  // ---- aircraft (re-rendered only while the configuration moves) ----
  let acKey = "";
  function renderAc() {
    const k = KEYS.map((q) => cur[q].toFixed(3)).join(",");
    if (k === acKey) return;
    acKey = k;
    const s = Object.assign({}, base, { x: 0, y: 0, z: 0, pitch: 0, roll: 0, fanPhase: 0.9, door: cur.door, aux: cur.aux, fan: cur.fan, nozzle: cur.noz, posts: cur.posts, gear: cur.gear, power: 1 });
    gAc.innerHTML = Mo.renderAircraft(s, D.P, { xray: { x: 1, shaft: 0, clock: 0, inlet: 0, aux: 0 } }).svg;
  }

  // ---- geometry (body metres) ----
  const G = D.GEO;
  const SH_A = [-0.3, 0, 0.12], SH_G = [1.21, 0, 0.44];
  const onShaft = (x) => { const t = (x - SH_A[0]) / (SH_G[0] - SH_A[0]); return [x, 0, lerp(SH_A[2], SH_G[2], t)]; };
  const engZ = (x) => lerp(0.12, -0.1, (-0.3 - x) / 4.0);
  const ax = (x, y = 0, dz = 0) => [x, y, engZ(x) + dz];
  function nozzleLine(deg) { // centreline of the (page-local) 3BSM and its plume
    const k = clamp(deg / 90), a0 = 40 * Math.PI / 180 * k, zb = -0.1 - 0.1 * k;
    const b = [-4.3, 0, zb], ng = Mo.nozzleGeometry(deg), e = ng.exit, d = ng.dir;
    const d0 = [-Math.cos(a0), 0, -Math.sin(a0)];
    const L = Math.hypot(e[0] - b[0], e[2] - b[2]);
    const c = [b[0] + d0[0] * L * 0.55, 0, b[2] + d0[2] * L * 0.55];
    const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, u = 1 - t; pts.push([u * u * b[0] + 2 * u * t * c[0] + t * t * e[0], 0, u * u * b[2] + 2 * u * t * c[2] + t * t * e[2]]); }
    return { pts, exit: e, dir: d };
  }
  const ductLine = (side) => G.DUCT.map((p) => [p[0], side * p[1], p[2]]);
  const sideP = (pts, side) => pts.map((p) => [p[0], side * p[1], p[2]]);
  const qbz = (a, c, b, n = 8) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([0, 1, 2].map((j) => u * u * a[j] + 2 * u * t * c[j] + t * t * b[j])); } return o; };

  // ---- drawing helpers (screen space) ----
  function ribbon(pts, w0, w1) {
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (pts.length - 1)) / 2;
      L.push([pts[i][0] - dy / l * w, pts[i][1] + dx / l * w]); R.push([pts[i][0] + dy / l * w, pts[i][1] - dx / l * w]);
    }
    return "M" + [...L, ...R.reverse()].map(P2).join("L") + "Z";
  }
  function chevrons(out, pts, t, sp, v, z) {
    const seg = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    if (!(L >= sp * 0.6) || L > 1e5) return;
    let s = ((t * v) % sp + sp) % sp, i = 0, acc = 0;
    for (; s < L; s += sp) {
      while (i < seg.length - 1 && acc + seg[i] < s) { acc += seg[i]; i++; }
      const u = seg[i] ? (s - acc) / seg[i] : 0, a = pts[i], b = pts[i + 1];
      const p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
      const l = seg[i] || 1, dx = (b[0] - a[0]) / l, dy = (b[1] - a[1]) / l, nx = -dy, ny = dx;
      const k = z * Math.pow(Math.sin(Math.PI * s / L), 0.5);
      if (k < 0.8) continue;
      out.push(`M${P2([p[0] + dx * k, p[1] + dy * k])}L${P2([p[0] - dx * k * 0.8 + nx * k * 0.8, p[1] - dy * k * 0.8 + ny * k * 0.8])}L${P2([p[0] - dx * k * 0.3, p[1] - dy * k * 0.3])}L${P2([p[0] - dx * k * 0.8 - nx * k * 0.8, p[1] - dy * k * 0.8 - ny * k * 0.8])}Z`);
    }
  }
  const label = (p, txt, cls, anchor = "middle", dx = 0, dy = 0, op = 1) => op < 0.05 ? "" :
    `<text class="fz-lbl ${cls}" x="${f1(p[0] + dx)}" y="${f1(p[1] + dy)}" text-anchor="${anchor}"${op < 0.99 ? ` opacity="${op.toFixed(2)}"` : ""}>${txt}</text>`;
  function arc(out, c, r, z, a0, a1, w, head) { // a filled arc (projected circle, body frame) with an arrowhead at a1
    const n = 12, pts = [];
    for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); pts.push(B([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, z])); }
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      L.push([pts[i][0] - dy / l * w / 2, pts[i][1] + dx / l * w / 2]); R.push([pts[i][0] + dy / l * w / 2, pts[i][1] - dx / l * w / 2]);
    }
    const e = pts[n], q = pts[n - 1], dx = e[0] - q[0], dy = e[1] - q[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    const tip = [e[0] + ux * head, e[1] + uy * head], hw = head * 0.75;
    out.push("M" + [...L, [e[0] - uy * hw, e[1] + ux * hw], tip, [e[0] + uy * hw, e[1] - ux * hw], ...R.reverse()].map(P2).join("L") + "Z");
  }

  // ---- one frame ----
  let tClock = 0, last = performance.now();
  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduced.matches) tClock += dt;
    const t = reduced.matches ? 0.4 : tClock;
    const sc = narrow.matches ? 1.45 : 1, ts = narrow.matches ? 1.9 : 1;
    renderAc();
    const fan = cur.fan, clutch = smooth(0, 0.08, fan), posts = cur.posts, aux = cur.aux, door = cur.door;
    const hv = smooth(80, 90, cur.noz) * clutch * posts * (target === "hover" ? 1 : 0); // the published split applies to hover only
    const bands = [], fl = { air: [], hot: [], cool: [], byp: [], pow: [] }, op = { air: 1, hot: 1, cool: fan, byp: Math.max(0.35, posts), pow: clutch };
    const W = D.BW * sc; // outlet band width for 83.1 kN (示意)
    const ZS = 30 * sc, V = 70 * sc, Z = 4.6 * sc;
    const add = (cls, pts3, w0, w1, o, speed = 1, opts = {}) => {
      if (o < 0.03) return;
      const pts = pts3.map(B);
      bands.push(`<path class="pw-band pw-${cls}" opacity="${((cls === "air" ? 0.46 : 0.34) * o).toFixed(2)}" d="${ribbon(pts, w0, w1)}"/>`);
      if (!opts.noChev) chevrons(fl[cls], pts, t + (opts.ph || 0), ZS, V * speed, Math.min(Z, Math.max(w0, w1) * 0.42 + 2.2 * sc));
    };
    // intake air: both DSI mouths through the S-ducts to the engine face; the auxiliary inlet from above (STOVL)
    for (const side of [1, -1]) add("air", sideP(G.INLET, side), W * 0.55, W * 0.62, side > 0 ? 1 : 0.6, 0.8, { ph: side * 0.21 });
    for (const side of [1, -1]) add("air", sideP(G.AUX, side), W * 0.32, W * 0.36, aux * (side > 0 ? 1 : 0.6), 0.8, { ph: 0.3 });
    // engine: compressor (grey) → combustor/turbine (hot) → augmentor duct → 3BSM → plume
    add("air", [ax(-0.3), ax(-1.0), ax(-1.95)], W * 0.8, W * 0.62, 1, 1);
    const nz = nozzleLine(cur.noz);
    const plumeEnd = [nz.exit[0] + nz.dir[0] * 2.4, 0, nz.exit[2] + nz.dir[2] * 2.4];
    add("hot", [ax(-1.95), ax(-2.75), ax(-3.45), ax(-4.3), ...nz.pts.slice(1), plumeEnd], W * 0.62, W * 1.25, 1, 1.25);
    // bypass air: round the engine to the roll-post ducts (STOVL) and on to the mixer
    for (const side of [1, -1]) {
      const o = side > 0 ? 1 : 0.6;
      add("byp", [ax(-0.5, side * 0.66), ax(-1.0, side * 0.68), ax(-1.42, side * 0.66)], W * 0.2, W * 0.2, o, 0.9, { ph: side * 0.13 });
      add("byp", [ax(-1.42, side * 0.66), ax(-2.4, side * 0.62), ax(-3.4, side * 0.5), ax(-3.6, side * 0.2)], W * 0.2, W * 0.08, o * 0.7, 0.9, { ph: side * 0.13 });
      const d = ductLine(side), pe = [d[d.length - 1][0], d[d.length - 1][1], d[d.length - 1][2] - 1.9];
      add("byp", [...d, pe], W * 0.088, W * 0.088 + 3 * sc, o * posts, 0.9, { ph: side * 0.07 });
    }
    // mechanical power: LP turbine → LP spool forward through the engine → drive shaft → clutch → bevel gearbox → fan
    const powPts = [ax(-3.2, 0, 0.02), ax(-1.5, 0, 0.02), ax(-0.3, 0, 0.02), onShaft(0.4), onShaft(0.99), onShaft(1.31), [G.FAN[0], 0, 0.5]];
    const pO = lerp(0.18, 1, clutch);
    bands.push(`<path class="pw-band pw-pow" opacity="${(0.42 * pO).toFixed(2)}" d="${ribbon(powPts.slice(0, 3).map(B), W * 0.22, W * 0.22)}${ribbon(powPts.slice(2, 6).map(B), W * 0.22, W * 0.3)}"/>`);
    if (clutch > 0.03) chevrons(fl.pow, powPts.map(B), t, ZS * 0.8, V * 1.3, Z * 0.9);
    // fan: air in through the open door above, out through the vane box (VAVN) below, then the cool column
    const FX = G.FAN[0];
    add("cool", [[FX, 0, 1.75], [FX, 0, 1.2], [FX, 0, 0.66]], W * 0.9, W * 0.8, fan * door, 0.9);
    add("cool", [[FX, 0, 0.36], [FX, 0, -0.06], [FX, 0, -0.8], [FX + 0.05, 0, -3.0]], W * 0.8, W * 1.4, fan * door, 1.1);
    // counter-rotating stages: two arrows each, upper one way and lower the other
    const rot = [];
    if (fan > 0.03) {
      const ph = t * 3.2;
      for (const [z, sgn] of [[G.FAN_Z1, 1], [G.FAN_Z2, -1]]) for (const k of [0, Math.PI]) {
        const a0 = sgn * ph + k; arc(rot, [FX, 0], 0.48, z, a0, a0 + sgn * 1.1, 3.2 * sc, 7 * sc);
      }
    }
    gBand.innerHTML = bands.join("") + (rot.length ? `<path class="pw-rot" opacity="${fan.toFixed(2)}" d="${rot.join("")}"/>` : "");
    const flows = [];
    for (const k of Object.keys(fl)) if (fl[k].length && op[k] > 0.03) flows.push(`<path class="pw-ch pw-${k}" opacity="${clamp(op[k]).toFixed(2)}" d="${fl[k].join("")}"/>`);
    gFlow.innerHTML = flows.join("");
    gLbl.innerHTML = labels(ts, { fan, clutch, posts, aux, door, hv, nz, plumeEnd });
    // the hover targets follow the moving parts (3BSM, roll posts)
    for (const h of hits) { const p = B(h.at()); h.el.setAttribute("cx", f1(p[0])); h.el.setAttribute("cy", f1(p[1])); h.el.setAttribute("r", f1(h.r * sc)); }
    if (capFor) placeCap(capFor);
    strip(hv);
  }

  function labels(sc, v) {
    const o = [], big = sc > 1, fs = big ? " pw-big" : "";
    const L = D.LBL;
    if (!big) { // phone: these four are in the captions and the 说明 only
      o.push(label(B(L.dsi), "主进气口", "pw-t-air fz-small", "start", 8, 0));
      o.push(label(B(L.aux), "辅助进气口", "pw-t-air fz-small", "end", -6, -4, v.aux));
      o.push(label(B(L.eng), "F135 发动机", "pw-t-eng fz-small", "middle", 0, -6));
      o.push(label(B(L.lpt), "低压涡轮 → 低压轴", "pw-t-pow fz-small", "middle", 0, 18));
    }
    o.push(label(B(L.shaft), v.clutch > 0.5 ? (big ? "传动轴 ≈29,000 轴马力" : "传动轴 · 最高约 29,000 轴马力") : "传动轴 · 不传功率", "pw-t-pow fz-small" + fs, "end", -10 * sc, 14 * sc, lerp(0.55, 1, v.clutch)));
    o.push(label(B(L.clutch), v.clutch > 0.5 ? "离合器 · 接合" : "离合器 · 分离", "pw-t-pow fz-small" + fs, "middle", 0, -12 * sc));
    o.push(label(B(L.fan), big ? "升力风扇" : "升力风扇 · 两级对转", "pw-t-cool fz-small" + fs, "start", 14 * sc, 0, Math.max(0.5, v.fan)));
    // outlets: thrust readouts in hover only (P&W split); names elsewhere
    const fanOut = B([G.FAN[0] + 0.05, 0, -3.0]), nozOut = B(v.plumeEnd), postOut = B(L.postOut);
    if (v.hv > 0.05) {
      o.push(label(fanOut, `<tspan class="fz-val">83.1</tspan> 千牛`, "pw-t-cool" + fs, "middle", 0, 22 * sc, v.hv));
      o.push(label(nozOut, `<tspan class="fz-val">83.1</tspan> 千牛`, "pw-t-hot" + fs, "middle", 0, 22 * sc, v.hv));
      o.push(label(postOut, `<tspan class="fz-val">7.3</tspan> 千牛 ×2`, "pw-t-byp" + fs, "middle", 0, 22 * sc, v.hv));
    }
    o.push(label(fanOut, big ? "风扇冷气流" : "风扇冷气流（VAVN）", "pw-t-cool fz-small" + fs, "middle", 0, (v.hv > 0.05 ? 42 : 20) * sc, v.fan * v.door));
    if (big && cur.noz < 80) o.push(label(B(v.nz.exit), "三轴承喷管", "pw-t-hot fz-small" + fs, "start", 18 * sc, 30 * sc)); // phone: the plume end can leave the crop
    else o.push(label(nozOut, big ? "三轴承喷管" : "三轴承喷管 · 热燃气", "pw-t-hot fz-small" + fs, cur.noz < 30 ? "end" : "middle", cur.noz < 30 ? -6 * sc : 0, (cur.noz < 30 ? 4 : v.hv > 0.05 ? 42 : 20) * sc));
    o.push(label(postOut, big ? "滚转喷口" : "滚转喷口 · 外涵空气", "pw-t-byp fz-small" + fs, "middle", 0, (v.hv > 0.05 ? 42 : 20) * sc, v.posts));
    return o.join("");
  }

  // ---- hover / tap captions ----
  const hits = D.HITS.map((h) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("class", "pw-hit"); el.setAttribute("tabindex", "0"); el.setAttribute("role", "button"); el.setAttribute("aria-label", h.name + "：" + h.text.replace(/<[^>]+>/g, ""));
    gHit.appendChild(el);
    const at = h.id === "noz" ? () => { const n = nozzleLine(cur.noz); return n.pts[5]; } : () => h.at;
    const o = { ...h, el, at };
    el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") show(o); });
    el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !pinned) hide(); });
    el.addEventListener("focus", () => show(o));
    el.addEventListener("blur", () => { if (!pinned) hide(); });
    el.addEventListener("click", (e) => { e.stopPropagation(); if (pinned === o) { pinned = null; hide(); } else { pinned = o; show(o); } });
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pinned = pinned === o ? null : o; pinned ? show(o) : hide(); } });
    return o;
  });
  let capFor = null, pinned = null;
  function show(h) { capFor = h; cap.innerHTML = `<b>${h.name}</b>${h.text}`; cap.hidden = false; placeCap(h); }
  function hide() { capFor = null; cap.hidden = true; gRing.setAttribute("d", ""); }
  function placeCap(h) {
    const p = B(h.at()), m = svg.getScreenCTM(), bb = box.getBoundingClientRect();
    if (!m) return;
    const x = p[0] * m.a + m.e - bb.left, y = p[1] * m.d + m.f - bb.top, r = h.r * (narrow.matches ? 1.45 : 1) * m.a;
    const cw = cap.offsetWidth, ch = cap.offsetHeight;
    let left = x - cw / 2, top = y + r + 8;
    if (top + ch > bb.height - 6) top = y - r - 8 - ch;
    left = clamp(left, 6, bb.width - cw - 6); top = clamp(top, 6, bb.height - ch - 6);
    cap.style.left = left.toFixed(0) + "px"; cap.style.top = top.toFixed(0) + "px";
    const rr = h.r * (narrow.matches ? 1.45 : 1), q = B(h.at());
    gRing.setAttribute("d", `M${f1(q[0] - rr)} ${f1(q[1])}a${f1(rr)} ${f1(rr)} 0 1 0 ${f1(2 * rr)} 0a${f1(rr)} ${f1(rr)} 0 1 0 ${f1(-2 * rr)} 0ZM${f1(q[0] - rr + 2)} ${f1(q[1])}a${f1(rr - 2)} ${f1(rr - 2)} 0 1 1 ${f1(2 * rr - 4)} 0a${f1(rr - 2)} ${f1(rr - 2)} 0 1 1 ${f1(-2 * rr + 4)} 0Z`);
  }
  document.addEventListener("pointerdown", (e) => { if (pinned && !e.target.closest(".pw-hit") && !e.target.closest(".pw-cap")) { pinned = null; hide(); } });

  // ---- strip, header, inset ----
  const WORD = {
    cruise: "常规飞行：离合器分离，升力风扇停转、舱门关闭，喷管伸直，推力全部向后",
    trans: "过渡：舱门打开、离合器接合，风扇开始供推力，喷管部分下偏（角度为示意）",
    hover: "STOVL 悬停：低压涡轮的功率经传动轴、离合器和锥齿轮箱驱动升力风扇；喷管转下，滚转喷口打开",
  };
  let stripKey = "";
  function strip(hv) {
    const c = smooth(0, 0.08, cur.fan) > 0.5, m = target === "hover" && hv <= 0.5 ? (c ? "trans" : "cruise") : target; // numbers only once the hover configuration is reached
    const k = m + c + target;
    if (k === stripKey) return; stripKey = k;
    const H = m === "hover";
    cellEl.clutch.innerHTML = c ? "接合<small>驱动风扇</small>" : "分离<small>风扇不转</small>";
    cellEl.fan.innerHTML = H ? "83.1<small>千牛 · 46 %</small>" : m === "trans" ? "工作中<small>分配未公开</small>" : "停转<small>舱门关</small>";
    cellEl.noz.innerHTML = H ? "83.1<small>千牛 · 46 %</small>" : m === "trans" ? "部分下偏<small>示意</small>" : "向后<small>全部推力</small>";
    cellEl.post.innerHTML = H ? "7.3 + 7.3<small>千牛 · 8 %</small>" : m === "trans" ? "打开<small>分配未公开</small>" : "关闭<small>无外涵引气</small>";
    sankey.dataset.on = H ? "1" : "0";
    if (readEl.textContent !== WORD[target]) readEl.textContent = WORD[target];
  }

  // ---- loop ----
  let raf = 0;
  function step(now) {
    if (!anim) return false;
    const dtS = (now - anim.t) / 1000, T = TIMING[anim.dir];
    let done = true;
    for (const q of KEYS) {
      const [d0, dur0] = T[q], dur = q === "noz" ? Math.max(0.05, Math.abs(anim.to[q] - anim.from[q]) / 95 * 2.5) : dur0;
      const e = smooth(0, 1, (dtS - d0) / dur);
      cur[q] = lerp(anim.from[q], anim.to[q], q === "noz" ? clamp((dtS - d0) / dur) : e);
      if (dtS < d0 + dur) done = false;
    }
    if (done) { cur = Object.assign({}, anim.to); anim = null; }
    return true;
  }
  function frame(now) {
    raf = 0;
    step(now);
    draw(now);
    if (!reduced.matches && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  function setMode(id) {
    if (!MODES[id]) return;
    const rank = { cruise: 0, trans: 1, hover: 2 };
    const dir = rank[id] >= rank[target] ? "up" : "down";
    target = id; mBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === id)));
    if (reduced.matches) { cur = Object.assign({}, MODES[id]); anim = null; draw(performance.now()); return; }
    anim = { from: Object.assign({}, cur), to: Object.assign({}, MODES[id]), t: performance.now(), dir };
    kick();
  }
  mBtns.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const i = "123".indexOf(e.key);
    if (i >= 0) { setMode(mBtns[i].dataset.mode); mBtns[i].focus({ preventScroll: true }); }
    else if (e.key === "Escape" && pinned) { pinned = null; hide(); }
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !reduced.matches) { last = performance.now(); kick(); } });
  reduced.addEventListener("change", () => { anim = null; cur = Object.assign({}, MODES[target]); reduced.matches ? draw(performance.now()) : kick(); });
  const notes = document.querySelector(".tp-notes");
  if (notes) {
    notes.addEventListener("keydown", (e) => { if (e.key === "Escape" && notes.open) { notes.open = false; notes.querySelector("summary").focus(); } });
    document.addEventListener("pointerdown", (e) => { if (notes.open && !notes.contains(e.target)) notes.open = false; });
  }
  const fitVB = () => { svg.setAttribute("viewBox", narrow.matches ? D.VB_T.join(" ") : `0 0 ${D.W} ${D.H}`); svg.classList.toggle("tp-tight", narrow.matches); reduced.matches ? draw(performance.now()) : kick(); };
  narrow.addEventListener("change", fitVB);
  addEventListener("resize", () => { if (capFor) placeCap(capFor); if (reduced.matches) draw(performance.now()); });
  fitVB();
  window.__pw = {
    mode: setMode, state: () => Object.assign({}, cur, { target }),
    show: (id) => { const h = hits.find((q) => q.id === id); if (h) { pinned = h; show(h); } else { pinned = null; hide(); } },
    bench: () => { const ts = []; for (let i = 0; i < 40; i++) { const t = performance.now(); draw(t); svg.getBoundingClientRect(); ts.push(performance.now() - t); } ts.sort((a, b) => a - b); return ts[20].toFixed(2) + "/" + ts[36].toFixed(2); },
  };
}
