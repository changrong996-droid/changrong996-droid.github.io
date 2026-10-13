/*GDGEOM>*/
const GD_GEOM = {
  nose: 8.0, // body x of the nose tip (NOSE_TIP)
  // nozzle exit 12.8 m from the nose (model 15.2), about 0.85 m below the belly as in the photos: the same three
  // segments (1.22 m along the axis) and serrated petals, but the swivel starts 40° down and turns the last 50° to
  // vertical. The first ring sits wholly inside the aft fuselage (its lowest point on the belly skin); the segments
  // are drawn just behind the fuselage, which hides the part inside it, so the duct leaves the belly cleanly.
  nozBase: [-4.3, 0, -0.2],
  nozA0: 40, // deg below the aft horizontal at the first ring
  gearDX: -1.3, // main gear 9.85 m from the nose (model 8.55): legs, wheels, braces, doors, leaves, wells
  noseDX: -0.88, // nose gear 3.83 m from the nose (model 2.95): leg, wheel, brace, doors, bay seam, well → wheelbase 6.02 m
};
function gdPatch(src, G) {
  const one = (s, a, b) => { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error("gdPatch: " + a.slice(0, 40)); return s.slice(0, i) + b + s.slice(i + a.length); };
  const dx = G.gearDX, X = (v) => +(v + dx).toFixed(3), N = (v) => +(v + G.noseDX).toFixed(3);
  const all = (s, a, b, n) => { const k = s.split(a).length - 1; if (k !== n) throw new Error("gdPatch: " + a.slice(0, 40) + " ×" + k); return s.split(a).join(b); };
  let s = one(src, "const base = [-6.42, 0, 0.04];", `const base = [${G.nozBase.join(", ")}];`);
  s = one(s, "const th = Math.max(1e-4, deg * D2R);", `const a0 = ${G.nozA0} * D2R; const th = Math.max(1e-4, deg * D2R - a0);`);
  s = one(s, "const at = (s) => { const f = s / R; return [V3.add(base, [-R * Math.sin(f), 0, -R * (1 - Math.cos(f))]), [-Math.cos(f), 0, -Math.sin(f)]]; };",
    "const at = (s) => { const f = a0 + s / R; return [V3.add(base, [-R * (Math.sin(f) - Math.sin(a0)), 0, -R * (Math.cos(a0) - Math.cos(f))]), [-Math.cos(f), 0, -Math.sin(f)]]; };");
  s = one(s, 'add(`nozzle.${i}`, seg, { tone: "hi", lit: true, bias: 3 + i * 0.01, seams: true, smooth: true, cls: "xr-keep" })',
    'add(`nozzle.${i}`, seg, { tone: "hi", lit: true, bias: 3 + i * 0.01, seams: true, smooth: true, cls: "xr-keep", rel: { to: ["fuselage"], d: 0.05 - i * 0.001, side: [0, 0, -1] } })');
  for (const id of ["mp", "ms"]) { // main legs: every station in the GEAR entry
    const a = s.indexOf(`{ id: "${id}",`), b = s.indexOf("\n", a);
    if (a < 0) throw new Error("gdPatch: gear " + id);
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
  return s;
}
/*<GDGEOM*/
// 地面效应与吸入效应 · F-35B 悬停：one fixed shot; four heights, the inboard weapons-bay doors (LIDs) open/shut.
// Flows are drawn as moving filled chevrons (no stroked lines); every strength on this page is illustrative (示意).
(() => {
  const D0 = window.GD;
  if (!D0 || !window.F35M) return;
  fetch("shared/f35b-model.js").then((r) => r.text()).then((src) => (new Function(gdPatch(src, GD_GEOM) + "\nreturn F35M;"))())
    .catch(() => window.F35M) // file:// (no fetch): the shared geometry
    .then(gdStart);
})();
function gdStart(Mo) {
  const D = window.GD, G = D.GEO;
  const svg = document.querySelector(".tp-svg");
  if (!D || !Mo || !svg) return;
  const $ = (s) => svg.querySelector(s);
  const gAc = $(".fz-ac"), gUnder = $(".gd-under"), gDoors = $(".gd-doors"), gOver = $(".gd-over"), shadow = $(".fz-shadow");
  const clipEl = svg.querySelector(".gd-clip"), chart = document.querySelector(".gd-chart"), mark = chart.querySelector(".gc-mark");
  const dots = { 0: mark.querySelector(".gc-dot.gc-closed"), 1: mark.querySelector(".gc-dot.gc-open") };
  const readEl = document.querySelector("[data-read]");
  const cellEl = {}; document.querySelectorAll("[data-v]").forEach((el) => { cellEl[el.dataset.v] = el; });
  const hBtns = [...document.querySelectorAll("[data-h]")], lidBtn = document.querySelector("[data-lid]"), lidWord = document.querySelector("[data-lidword]");
  const C = Mo.camera(D.P), pr = (p) => Mo.project(p, C), U = D.U;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = matchMedia("(max-width: 700px)");
  const PRE = Object.fromEntries(D.PRESETS.map((p) => [p.id, p]));
  const zoOf = (h) => h - G.FAN[2];

  // ---- the illustrative model (same formulas as build-ground.mjs) ----
  const K = D.CURVE;
  const suck = (x, l) => K.s0 + K.s1 * (1 + (K.lidS - 1) * l) * Math.exp(-x / K.sl);
  const fount = (x, l) => K.f1 * (1 + (K.lidF - 1) * l) * Math.exp(-((x / K.fl) ** 2));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (e0, e1, v) => { const t = clamp((v - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---- aircraft: rendered once (pitch 0), moved with a transform ----
  const base = Mo.stateAt(Mo.TIMES.C.tDescend + 0.02);
  const zRef = zoOf(PRE.low.h);
  const s0 = Object.assign({}, base, { x: D.HX, y: D.HY, z: zRef * U, pitch: 0, roll: 0, fanPhase: 0.9 });
  const R0 = Mo.renderAircraft(s0, D.P);
  gAc.innerHTML = R0.svg;
  shadow.setAttribute("d", "M" + R0.planform.map((p) => { const q = pr([p[0], p[1], 0]); return q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("L") + "Z");

  // ---- helpers ----
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  const P2 = (p) => f1(p[0]) + " " + f1(p[1]);
  let zo = zRef;
  const B = (x, y, z) => pr([D.HX + x * U, D.HY + y * U, (zo + z) * U]); // body-relative point (pitch 0)
  const A = (x, y, z) => pr([D.HX + x * U, D.HY + y * U, z * U]);         // absolute height above the deck (m)
  const qbez = (a, c, b, n = 10) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return o; };
  function arrow(a, b, w, head, cls) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if (L < 1) return "";
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, h = Math.min(head, L * 0.6), hw = Math.max(w * 2.1, h * 0.7);
    const m = [b[0] - ux * h, b[1] - uy * h];
    const pts = [[a[0] + nx * w / 2, a[1] + ny * w / 2], [m[0] + nx * w / 2, m[1] + ny * w / 2], [m[0] + nx * hw / 2, m[1] + ny * hw / 2], b,
      [m[0] - nx * hw / 2, m[1] - ny * hw / 2], [m[0] - nx * w / 2, m[1] - ny * w / 2], [a[0] - nx * w / 2, a[1] - ny * w / 2]];
    return `<path class="fz-arr ${cls}" d="M${pts.map(P2).join("L")}Z"/>`;
  }
  const label = (p, txt, cls, anchor = "middle", dx = 0, dy = 0, op = 1) => op < 0.05 ? "" :
    `<text class="fz-lbl ${cls}" x="${f1(p[0] + dx)}" y="${f1(p[1] + dy)}" text-anchor="${anchor}"${op < 0.99 ? ` opacity="${op.toFixed(2)}"` : ""}>${txt}</text>`;
  function band(out, pts, w0, w1, cls, op) { // a tapered translucent band under a stream of chevrons
    if (op < 0.02 || pts.length < 2) return;
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (pts.length - 1)) / 2;
      L.push([pts[i][0] - dy / l * w, pts[i][1] + dx / l * w]); R.push([pts[i][0] + dy / l * w, pts[i][1] - dx / l * w]);
    }
    out.push(`<path class="gd-band gd-${cls}" opacity="${op.toFixed(2)}" d="M${[...L, ...R.reverse()].map(P2).join("L")}Z"/>`);
  }
  function hull2(pts) { // convex hull (monotone chain)
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of p.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // moving chevrons along a screen polyline: spacing sp, speed v (screen units / s), size z
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
      const k = z * Math.pow(Math.sin(Math.PI * s / L), 0.7);
      if (k < 0.6) continue;
      out.push(`M${P2([p[0] + dx * k, p[1] + dy * k])}L${P2([p[0] - dx * k * 0.8 + nx * k * 0.8, p[1] - dy * k * 0.8 + ny * k * 0.8])}L${P2([p[0] - dx * k * 0.3, p[1] - dy * k * 0.3])}L${P2([p[0] - dx * k * 0.8 - nx * k * 0.8, p[1] - dy * k * 0.8 - ny * k * 0.8])}Z`);
    }
  }

  // ---- state ----
  let cur = { h: PRE[D.START].h, lid: 0 }, target = { id: D.START, lid: 0 };
  let anim = null, lidAnim = null, t0 = performance.now();
  const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };

  function draw(now) {
    const t = reduced.matches ? 0.35 : (now - t0) / 1000;
    const sc = narrow.matches ? 1.5 : 1;
    const h = cur.h, x = h / G.FAN_D, l = cur.lid;
    zo = zoOf(h);
    gAc.setAttribute("transform", `translate(0 ${f1(-(zo - zRef) * U * C.cosE * C.k)})`);
    shadow.style.opacity = (0.04 + 0.08 * smooth(16, 2, h)).toFixed(3);
    const S = suck(x, l), F = fount(x, l);
    const gW = 0.45 + 0.55 * smooth(13, 6, x), gF = smooth(10.5, 3, x), hgiC = smooth(5.5, 1.6, x), hgi = hgiC * (1 - 0.45 * l), inGlow = hgiC * (1 - l);
    const under = [], over = [];
    const fl = { cool: [], hot: [], warm: [], ent: [], hgi: [] };
    const ZS = 36 * sc; // chevron spacing; speed and size below
    const nz = zo + G.NOZ[2];

    // jets: plumes and wash where they hit the deck
    const plume = (bx, top, r0, grad) => {
      const r1 = r0 + 0.11 * top;
      const a1 = A(bx - r0, 0, top), a2 = A(bx + r0, 0, top), b1 = A(bx - r1, 0, 0.05), b2 = A(bx + r1, 0, 0.05);
      under.push(`<path fill="url(#${grad})" d="M${P2(a1)}L${P2(b1)}L${P2(b2)}L${P2(a2)}Z"/>`);
      const c = A(bx, 0, 0), rr = (r1 + 1.6) * U * C.k;
      under.push(`<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(rr * 1.6)}" ry="${f1(rr * 1.6 * C.sinE * 1.4)}" fill="url(#${grad === "gdJetCold" ? "gdWashCold" : "gdWashHot"})"/>`);
      return r1;
    };
    const rF = plume(G.FAN[0], h, 0.62, "gdJetCold"), rN = plume(G.NOZ[0], nz, 0.5, "gdJetHot");
    for (const [px, top, r0, r1, cls] of [[G.FAN[0], h, 0.62, rF, "cool"], [G.NOZ[0], nz, 0.5, rN, "hot"]]) {
      for (const sgn of [-1, 1]) chevrons(fl[cls], [A(px + sgn * r0 * 0.45, 0, top - 0.1), A(px + sgn * r1 * 0.5, 0, 0.25)], t, ZS, 120 * sc, 5.2 * sc);
    }
    // wall jets on the deck: rays away from each impingement point; rays toward the other jet stop at the fountain plane
    const xm = G.XM, wall = (px, r1, ang, cls) => {
      const c = Math.cos(ang * Math.PI / 180), s = Math.sin(ang * Math.PI / 180);
      let L = 8.5; const toward = Math.sign(xm - px) * c > 0.3;
      if (toward) L = (xm - px) / c - 0.2;
      const pts = []; for (let i = 0; i <= 6; i++) { const r = r1 + 0.3 + (L - r1 - 0.3) * i / 6; pts.push(A(px + c * r, s * r, 0.18)); }
      band(under, pts, 0.6 * U * C.k, (toward ? 0.9 : 2.2) * U * C.k * C.sinE * 2.6, cls, 0.08 * gW);
      chevrons(fl[cls], pts, t + ang * 0.003, ZS * 1.05, 90 * sc, 5 * sc);
    };
    for (const a of [0, 45, -45, 90, -90, 155, -155]) wall(G.FAN[0], rF, a, "cool");
    for (const a of [180, 135, -135, 90, -90, 25, -25]) wall(G.NOZ[0], rN, a, "hot");
    // fountain: up from the deck where the wall jets meet, to the belly (weak and short when high up)
    const bellyTop = zo + G.BELLY_XM, fTop = Math.min(bellyTop - 0.05, 1.0 + 9 * smooth(12, 3, x));
    const fcols = [0, 1.5, -1.5].map((y) => [A(xm, y, 0.25), A(xm, y, Math.min(fTop, y ? zo - 0.1 : fTop))]);
    if (gF > 0.02) {
      under.push(`<path fill="url(#gdFount)" opacity="${gF.toFixed(2)}" d="M${P2(A(xm - 0.7, 0, 0.1))}L${P2(A(xm - 0.45, 0, fTop))}L${P2(A(xm + 0.45, 0, fTop))}L${P2(A(xm + 0.7, 0, 0.1))}Z"/>`);
      for (const c of fcols) chevrons(fl.warm, c, t, ZS * 0.9, 85 * sc, 4.8 * sc);
    }
    // entrainment into the jets (near side): the air drawn along the underside that causes suckdown
    const zc = (z) => Math.max(0.3 - zo, z);
    const ent = [[[6.4, 2.3, -0.3], [3.8, 2.0, -0.45], [2.6, 0.7, -2.0]], [[-0.5, 2.9, -0.2], [0.9, 2.3, -0.5], [1.3, 0.7, -2.0]],
      [[-2.0, 2.9, -0.2], [-3.6, 2.2, -0.6], [-4.2, 0.6, -2.4]], [[-9.6, 1.9, -0.4], [-6.8, 1.6, -0.6], [-5.5, 0.6, -2.4]]];
    const entOp = clamp(0.3 + (S - 0.015) / 0.08);
    for (const [a, c, b] of ent) { const q = qbez(B(a[0], a[1], zc(a[2])), B(c[0], c[1], zc(c[2])), B(b[0], b[1], zc(b[2]))); band(over, q, 1.5 * sc, 7 * sc, "ent", 0.1 * entOp); chevrons(fl.ent, q, t, ZS * 0.8, 55 * sc, 5.4 * sc); }
    // hot gas: closed = spills round the fuselage side and creeps forward to the inlet; open = turned down and away
    const HC = [[xm, 0.2, G.BELLY_XM - 0.05], [xm + 0.6, 1.25, -0.6], [0.9, 1.75, -0.45], [2.5, 1.8, -0.35], [3.2, 1.5, -0.2]];
    const HO = [[xm, 0.2, G.BELLY_XM - 0.05], [xm + 0.1, 0.42, G.BELLY_XM - 0.6], [xm - 0.2, 1.4, -1.5], [xm - 0.6, 2.6, -2.0], [xm - 1.1, 3.6, -2.2]];
    if (hgi > 0.03) {
      const hp = HC.map((p, i) => B(lerp(p[0], HO[i][0], l), lerp(p[1], HO[i][1], l), zc(lerp(p[2], HO[i][2], l))));
      band(over, hp, 5 * sc, 12 * sc, "hgi", 0.16 * clamp(hgi * 1.2));
      chevrons(fl.hgi, hp, t, ZS * 0.75, 60 * sc, 6 * sc);
    }
    if (inGlow > 0.03) { const c = B(...G.INLET), r = 1.3 * U * C.k; under.push(`<ellipse class="gd-inglow" cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(r)}" ry="${f1(r * 0.8)}" opacity="${inGlow.toFixed(2)}"/>`); }

    const op = { cool: gW, hot: gW, warm: gF, ent: entOp, hgi: clamp(hgi * 1.2) };
    // jets' own chevrons share the wall-jet class; keep them visible high up
    op.cool = Math.max(op.cool, 0.75); op.hot = Math.max(op.hot, 0.75);
    for (const k of Object.keys(fl)) if (fl[k].length && op[k] > 0.02) (k === "ent" || k === "hgi" ? over : under).push(`<path class="gd-flow gd-${k}" opacity="${op[k].toFixed(2)}" d="${fl[k].join("")}"/>`);
    gUnder.innerHTML = under.join("");

    // doors: inboard bay doors swing from flush (pointing inboard) to hanging down, splayed out a little
    const doors = [];
    if (l > 0.02) {
      const ph = l * (90 + G.BAY.splay) * Math.PI / 180;
      for (const side of [-1, 1]) {
        const dir = [0, -side * Math.cos(ph), -Math.sin(ph)], hinge = G.BAYZ.map(([bx, bz]) => [bx, side * G.BAY.y, bz]);
        const n = hinge.length, edge = hinge.map((p, i) => { const e = i === 0 || i === n - 1 ? 0.55 : 1; return [p[0], p[1] + dir[1] * G.BAY.w * e, p[2] + dir[2] * G.BAY.w * e]; });
        const pts = [...hinge, ...edge.reverse()].map((p) => B(p[0], p[1], p[2]));
        doors.push(`<path class="gd-door${side < 0 ? " gd-door-in" : ""}" d="M${pts.map(P2).join("L")}Z"/>`);
      }
    }
    gDoors.innerHTML = doors.join("");
    if (doors.length) { // below the airframe's lower silhouette, minus the near main gear (which stands in front of the doors)
      const sil = G.SIL.map((p) => B(...p)), y0 = Math.max(...sil.map((p) => p[1])) + 400;
      const hull = hull2(G.GEARHULL.map((p) => B(...p)));
      clipEl.setAttribute("d", `M${P2([sil[0][0], y0])}L${sil.map(P2).join("L")}L${P2([sil[sil.length - 1][0], y0])}ZM${hull.map(P2).join("L")}Z`);
    }

    // forces (illustrative lengths): suckdown pulls down under both wings, fountain lift pushes up on the belly
    // one scale for both (illustrative); shrunk together when the longer one would reach the deck, so the ratio holds
    const KL = 16 * Math.min(1, (zo + G.BELLY_XM - 0.3) / (F * 16 + 1e-6), (zo + G.WINGP.z - 0.3) / (S * 16));
    const wN = B(G.WINGP.x, G.WINGP.y, G.WINGP.z), wF = B(G.WINGP.x, -G.WINGP.y, G.WINGP.z);
    const sTipN = B(G.WINGP.x, G.WINGP.y, G.WINGP.z - S * KL), sTipF = B(G.WINGP.x, -G.WINGP.y, G.WINGP.z - S * KL);
    over.push(arrow(wF, sTipF, 4.2 * sc, 13 * sc, "gd-su"), arrow(wN, sTipN, 4.6 * sc, 14 * sc, "gd-su"));
    const fTip = B(xm, 0, G.BELLY_XM), fLen = F * KL, fTail = B(xm, 0, G.BELLY_XM - fLen);
    if (fLen > 0.15) over.push(arrow(fTail, fTip, 5 * sc, 15 * sc, "gd-fl"));
    gOver.innerHTML = over.join("") + labels(sc, { S, F, fLen, fTail, sTipN, gW, gF, hgi, inGlow, l, nz, rF });

    // strip, header, chart
    const hd = x.toFixed(1);
    cellEl.h.innerHTML = `${h.toFixed(1)} 米<small>${hd} D</small>`;
    cellEl.suck.innerHTML = `${S < 0.025 ? "弱" : S < 0.06 ? "中等" : "强"}<small>向下</small>`;
    cellEl.fount.innerHTML = `${F < 0.01 ? "几乎没有" : F < 0.04 ? "弱" : F < 0.085 ? "中等" : "强"}<small>向上</small>`;
    cellEl.hgi.innerHTML = `${inGlow < 0.1 ? (hgi > 0.1 ? "被导开" : "无") : inGlow < 0.5 ? "少量" : "明显"}<small>${inGlow >= 0.5 ? "推力下降" : "进气口"}</small>`;
    const X = Math.min(x, D.CH.xmax), cxp = D.CH.x0 + (D.CH.x1 - D.CH.x0) * X / D.CH.xmax;
    const cyp = (y) => D.CH.y0 + (D.CH.y1 - D.CH.y0) * (D.CH.ymax - y) / (D.CH.ymax - D.CH.ymin);
    mark.setAttribute("transform", `translate(${cxp.toFixed(1)} 0)`);
    dots[0].setAttribute("cy", cyp(fount(X, 0) - suck(X, 0)).toFixed(1)); dots[1].setAttribute("cy", cyp(fount(X, 1) - suck(X, 1)).toFixed(1));
    chart.dataset.lid = l > 0.5 ? "1" : "0";
  }
  function labels(sc, v) {
    const o = [], big = sc > 1;
    const fanMid = A(G.FAN[0] + 0.62 + 0.11 * cur.h * 0.5 + 0.2, 0, Math.max(cur.h * 0.35, 1.2));
    o.push(label(fanMid, big ? "风扇 · 冷" : "升力风扇 · 较冷的气流", "fz-small gd-t-cool", "start", 4 * sc));
    const nozMid = A(G.NOZ[0] - 0.5 - 0.11 * v.nz * 0.5 - 0.2, 0, Math.max(v.nz * 0.5, 0.9));
    o.push(label(nozMid, big ? "喷管 · 热" : "三轴承喷管 · 热燃气", "fz-small gd-t-hot", "end", -4 * sc));
    o.push(label(A(G.FAN[0] + 6.6, 0.4, 0), "壁面射流", "fz-small gd-t-cool", "start", 0, 20 * sc, v.gW));
    if (v.l < 0.5 && v.gF > 0.1) o.push(label(A(G.XM - 0.6, 0, 0.5), "喷泉", "fz-small gd-t-hot", "end", 0, 0, clamp(v.gF * 1.5) * clamp((0.5 - v.l) * 4)));
    if (v.inGlow > 0.15) o.push(label(B(G.INLET[0] + 0.6, G.INLET[1], 1.0), "热燃气 → 进气口", "fz-small gd-t-hot", "start", 0, 0, clamp(v.inGlow * 1.4)));
    else if (v.hgi > 0.15 && v.l > 0.5) o.push(label(B(G.XM - 1.1, 3.6, Math.max(0.35 - zo, -2.2)), "热燃气被导开", "fz-small gd-t-hot", "end", -8 * sc, 14 * sc, clamp(v.hgi * 1.4)));
    if (v.l > 0.4) o.push(label(B(G.BAY.x0, G.BAY.y, G.BAYZ[0][1] - G.BAY.w), big ? "舱门（LID）" : "内侧武器舱门（LID）", "fz-small gd-t-door", "start", 6 * sc, 16 * sc, clamp((v.l - 0.4) * 2.5)));
    return o.join("");
  }

  // ---- header words ----
  const WORD = {
    hi: ["离地很高：只有空中本来就有的少量吸入；射流到甲板时已经减弱", "离地很高：舱门开不开差别很小"],
    span: ["约一个翼展高：开始进入地面效应，卷吸增强，吸入变大", "约一个翼展高：喷泉还够不到机腹，舱门作用不大"],
    low: ["低悬停：吸入接近最强；喷泉开始顶到机腹，热燃气沿机身爬向进气口", "低悬停：舱门兜住喷泉，吸入减小，热燃气被挡开"],
    td: ["接地前：喷泉升力抵掉大部分吸入，但进气口附近热燃气最多", "接地前：舱门兜住喷泉，净升力转为小幅增益（示意），热燃气被导开"],
  };
  const setWord = () => { const w = WORD[target.id][target.lid]; if (readEl.textContent !== w) readEl.textContent = w; };

  // ---- loop ----
  let raf = 0;
  function frame(now) {
    raf = 0;
    if (anim) { const e = ease((now - anim.t) / anim.d); cur.h = lerp(anim.from, anim.to, e); if (e >= 1) anim = null; }
    if (lidAnim) { const e = ease((now - lidAnim.t) / 650); cur.lid = lerp(lidAnim.from, lidAnim.to, e); if (e >= 1) lidAnim = null; }
    draw(now);
    if (!reduced.matches && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  function setHeight(id) {
    if (!PRE[id]) return;
    target.id = id; hBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.h === id)));
    setWord();
    if (reduced.matches) { cur.h = PRE[id].h; anim = null; draw(performance.now()); return; }
    anim = { from: cur.h, to: PRE[id].h, t: performance.now(), d: 700 + 90 * Math.abs(PRE[id].h - cur.h) };
    kick();
  }
  function setLid(on) {
    target.lid = on ? 1 : 0; lidBtn.setAttribute("aria-pressed", String(!!on)); lidWord.textContent = on ? "开" : "关";
    setWord();
    if (reduced.matches) { cur.lid = target.lid; lidAnim = null; draw(performance.now()); return; }
    lidAnim = { from: cur.lid, to: target.lid, t: performance.now() };
    kick();
  }
  hBtns.forEach((b) => b.addEventListener("click", () => setHeight(b.dataset.h)));
  lidBtn.addEventListener("click", () => setLid(!target.lid));
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const i = "1234".indexOf(e.key);
    if (i >= 0) { setHeight(hBtns[i].dataset.h); hBtns[i].focus({ preventScroll: true }); }
    else if (e.key === "5") { setLid(!target.lid); lidBtn.focus({ preventScroll: true }); }
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !reduced.matches) kick(); });
  reduced.addEventListener("change", () => { anim = lidAnim = null; cur.h = PRE[target.id].h; cur.lid = target.lid; reduced.matches ? draw(0) : kick(); });
  const notes = document.querySelector(".tp-notes");
  if (notes) {
    notes.addEventListener("keydown", (e) => { if (e.key === "Escape" && notes.open) { notes.open = false; notes.querySelector("summary").focus(); } });
    document.addEventListener("pointerdown", (e) => { if (notes.open && !notes.contains(e.target)) notes.open = false; });
  }
  const fitVB = () => { svg.setAttribute("viewBox", narrow.matches ? D.VB_T.join(" ") : `0 0 ${D.W} ${D.H}`); svg.classList.toggle("tp-tight", narrow.matches); reduced.matches ? draw(0) : kick(); };
  narrow.addEventListener("change", fitVB);
  setWord();
  fitVB();
  window.__gd = {
    height: setHeight, lid: (on) => setLid(on), state: () => Object.assign({}, cur, { target: Object.assign({}, target) }),
    bench: () => { const ts = []; for (let i = 0; i < 40; i++) { const t = performance.now(); draw(t); svg.getBoundingClientRect(); ts.push(performance.now() - t); } ts.sort((a, b) => a - b); return ts[20].toFixed(2) + "/" + ts[36].toFixed(2); },
  };
}
