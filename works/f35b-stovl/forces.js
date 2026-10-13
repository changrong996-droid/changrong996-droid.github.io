// 力与力矩平衡 · F-35B 悬停：one fixed shot, thrust arrows ∝ force, moment arcs, five commands.
// Page-local geometry override (this page only; shared/f35b-model.js and the two animation pages are unchanged):
// the 3BSM nozzle and the main gear are moved to where photos of the real aircraft put them (RIAT 2016/2025 hover
// photos scaled to the published 6.02 m wheelbase, about ±0.5 m). The shared model's source text is patched and
// evaluated as a private copy; build-forces.mjs applies the same block (between the markers) for its numbers.
/*FZGEOM>*/
const FZ_GEOM = {
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
function fzPatch(src, G) {
  const one = (s, a, b) => { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error("fzPatch: " + a.slice(0, 40)); return s.slice(0, i) + b + s.slice(i + a.length); };
  const dx = G.gearDX, X = (v) => +(v + dx).toFixed(3), N = (v) => +(v + G.noseDX).toFixed(3);
  const all = (s, a, b, n) => { const k = s.split(a).length - 1; if (k !== n) throw new Error("fzPatch: " + a.slice(0, 40) + " ×" + k); return s.split(a).join(b); };
  let s = one(src, "const base = [-6.42, 0, 0.04];", `const base = [${G.nozBase.join(", ")}];`);
  s = one(s, "const th = Math.max(1e-4, deg * D2R);", `const a0 = ${G.nozA0} * D2R; const th = Math.max(1e-4, deg * D2R - a0);`);
  s = one(s, "const at = (s) => { const f = s / R; return [V3.add(base, [-R * Math.sin(f), 0, -R * (1 - Math.cos(f))]), [-Math.cos(f), 0, -Math.sin(f)]]; };",
    "const at = (s) => { const f = a0 + s / R; return [V3.add(base, [-R * (Math.sin(f) - Math.sin(a0)), 0, -R * (Math.cos(a0) - Math.cos(f))]), [-Math.cos(f), 0, -Math.sin(f)]]; };");
  s = one(s, 'add(`nozzle.${i}`, seg, { tone: "hi", lit: true, bias: 3 + i * 0.01, seams: true, smooth: true, cls: "xr-keep" })',
    'add(`nozzle.${i}`, seg, { tone: "hi", lit: true, bias: 3 + i * 0.01, seams: true, smooth: true, cls: "xr-keep", rel: { to: ["fuselage"], d: 0.05 - i * 0.001, side: [0, 0, -1] } })');
  for (const id of ["mp", "ms"]) { // main legs: every station in the GEAR entry
    const a = s.indexOf(`{ id: "${id}",`), b = s.indexOf("\n", a);
    if (a < 0) throw new Error("fzPatch: gear " + id);
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
/*<FZGEOM*/
(() => {
  const D0 = window.FZ;
  if (!D0 || !window.F35M) return;
  // the shared model is already in the HTTP cache (loaded by the page); patch a private copy of it
  fetch("shared/f35b-model.js").then((r) => r.text()).then((src) => (new Function(fzPatch(src, FZ_GEOM) + "\nreturn F35M;"))())
    .catch(() => window.F35M) // file:// (no fetch): fall back to the shared geometry
    .then(fzStart);
})();
function fzStart(Mo) {
  const D = window.FZ;
  const svg = document.querySelector(".tp-svg");
  if (!D || !Mo || !svg) return;
  const gAc = svg.querySelector(".fz-ac"), gOver = svg.querySelector(".fz-over"), gJets = svg.querySelector(".fz-jets"), shadow = svg.querySelector(".fz-shadow");
  const readEl = document.querySelector("[data-read]");
  const cellEl = {}; document.querySelectorAll("[data-v]").forEach((el) => { cellEl[el.dataset.v] = el; });
  const btnEls = [...document.querySelectorAll("[data-cmd]")];
  const C = Mo.camera(D.P), pr = (p) => Mo.project(p, C);
  const U = 10; // world units per metre
  const base = Mo.stateAt(Mo.TIMES.C.tDescend + 0.02);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = matchMedia("(max-width: 700px)");
  const BAL = D.CMD.bal;
  for (const [id, o] of Object.entries({ up: "down", down: "up", left: "right", right: "left" })) Object.defineProperty(D.CMD[id], "opp", { value: D.CMD[o] });
  const KEYS = ["fan", "noz", "postL", "postR"];

  // ---- aircraft (memoised per 0.1° of attitude) ----
  const cache = new Map();
  let shownKey = "", lastRender = null;
  function aircraft(pitch, roll) {
    const qp = Math.round(pitch * 5) / 5, qr = Math.round(roll * 5) / 5, key = qp.toFixed(1) + "," + qr.toFixed(1);
    const r = cache.get(key) || prerender(qp, qr, key);
    if (key !== shownKey) { gAc.innerHTML = r.svg; shownKey = key; }
    lastRender = r;
    return r;
  }
  function prerender(qp, qr, key) {
    let r;
    {
      const s = Object.assign({}, base, { pitch: qp, roll: qr, fanPhase: 0.9 });
      // rotate about the CG: shift the body origin so the CG stays put
      const c0 = Mo.bodyToWorld(Object.assign({}, base, { pitch: 0, roll: 0 }))(D.CG), c1 = Mo.bodyToWorld(s)(D.CG);
      s.x += c0[0] - c1[0]; s.y += c0[1] - c1[1]; s.z += c0[2] - c1[2];
      r = Mo.renderAircraft(s, D.P);
      r.s = s;
      if (cache.size > 260) cache.delete(cache.keys().next().value);
      cache.set(key, r);
    }
    return r;
  }

  // ---- overlay geometry helpers (screen space) ----
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  const P2 = (p) => f1(p[0]) + " " + f1(p[1]);
  function arrow(a, b, w, head, cls) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if (L < 0.5) return "";
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const h = Math.min(head, L * 0.55), hw = Math.max(w * 2.1, h * 0.62);
    const m = [b[0] - ux * h, b[1] - uy * h];
    const pts = [[a[0] + nx * w / 2, a[1] + ny * w / 2], [m[0] + nx * w / 2, m[1] + ny * w / 2], [m[0] + nx * hw / 2, m[1] + ny * hw / 2], b,
      [m[0] - nx * hw / 2, m[1] - ny * hw / 2], [m[0] - nx * w / 2, m[1] - ny * w / 2], [a[0] - nx * w / 2, a[1] - ny * w / 2]];
    return `<path class="${cls}" d="M${pts.map(P2).join("L")}Z"/>`;
  }
  function bar(a, b, w, cls) { // a thin closed band between two screen points
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2;
    return `<path class="${cls}" d="M${P2([a[0] + nx, a[1] + ny])}L${P2([b[0] + nx, b[1] + ny])}L${P2([b[0] - nx, b[1] - ny])}L${P2([a[0] - nx, a[1] - ny])}Z"/>`;
  }
  function ribbonArc(pts, w, head, cls) { // a curved arrow as one closed shape
    if (pts.length < 3) return "";
    const L = [], R = [];
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const h = Math.min(head, len * 0.45);
    // trim the end for the head
    let acc = 0, cut = pts.length - 1;
    for (let i = pts.length - 1; i > 0; i--) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc >= h) { cut = i - 1; break; } }
    const body = pts.slice(0, cut + 1);
    for (let i = 0; i < body.length; i++) {
      const p = body[i], q = body[Math.min(body.length - 1, i + 1)], o = body[Math.max(0, i - 1)];
      const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1;
      L.push([p[0] - dy / l * w / 2, p[1] + dx / l * w / 2]); R.push([p[0] + dy / l * w / 2, p[1] - dx / l * w / 2]);
    }
    const tip = pts[pts.length - 1], e = body[body.length - 1];
    const dx = tip[0] - e[0], dy = tip[1] - e[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, hw = Math.max(w * 2.2, h * 0.7);
    const shape = [...L, [e[0] + nx * hw / 2, e[1] + ny * hw / 2], tip, [e[0] - nx * hw / 2, e[1] - ny * hw / 2], ...R.reverse()];
    return `<path class="${cls}" d="M${shape.map(P2).join("L")}Z"/>`;
  }
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  function label(p, txt, cls, anchor = "middle", dy = 0) {
    return `<text class="fz-lbl ${cls || ""}" x="${f1(p[0])}" y="${f1(p[1] + dy)}" text-anchor="${anchor}">${txt}</text>`;
  }
  const kn = (v) => v.toFixed(1);

  // ---- one frame ----
  let cur = Object.assign({}, BAL), phaseWord = "";
  function draw() {
    const r = aircraft(cur.pitch, cur.roll);
    const s = r.s, toW = Mo.bodyToWorld(s), dW = Mo.dirToWorld(s);
    const up = Mo.V3.unit(dW([0, 0, 1]));
    const big = narrow.matches;
    const sc = big ? 1.5 : 1; // overlay stroke/text scale for the tight mobile crop
    const out = [], jets = [];
    // plumes to the deck (z = 0) along -up
    const plume = (pb, r0, spread, grad) => {
      const p = toW(pb), d = [-up[0], -up[1], -up[2]];
      const tt = p[2] / -d[2];
      const q = [p[0] + d[0] * tt, p[1] + d[1] * tt, 0];
      const a = pr(p), b = pr(q);
      const w0 = r0 * U * C.k, w1 = (r0 + spread) * U * C.k;
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      jets.push(`<path fill="url(#${grad})" d="M${P2([a[0] + nx * w0, a[1] + ny * w0])}L${P2([b[0] + nx * w1, b[1] + ny * w1])}L${P2([b[0] - nx * w1, b[1] - ny * w1])}L${P2([a[0] - nx * w0, a[1] - ny * w0])}Z"/>`);
    };
    plume(D.PTS.fan, 0.55, 2.6, "fzJetCold");
    plume(D.PTS.noz, 0.45, 2.4, "fzJetHot");
    plume(D.PTS.postL, 0.14, 0.9, "fzJetCold");
    plume(D.PTS.postR, 0.14, 0.9, "fzJetCold");
    gJets.innerHTML = jets.join("");
    // shadow straight down on the deck
    shadow.setAttribute("d", "M" + r.planform.map((p) => P2(pr([p[0], p[1], 0]))).join("L") + "Z");

    // lever arms in the body frame, below the gear
    const zDim = -2.75;
    const pF = pr(toW([D.PTS.fan[0], 0, zDim])), pN = pr(toW([D.PTS.noz[0], 0, zDim])), pC = pr(toW([D.CG[0], 0, zDim]));
    out.push(bar(pr(toW(D.PTS.fan)), pF, 1.1 * sc, "fz-ext"), bar(pr(toW(D.PTS.noz)), pN, 1.1 * sc, "fz-ext"));
    out.push(bar(pF, pC, 1.6 * sc, "fz-dim"), bar(pC, pN, 1.6 * sc, "fz-dim"));
    for (const p of [pF, pN, pC]) out.push(bar([p[0], p[1] - 7 * sc], [p[0], p[1] + 7 * sc], 1.6 * sc, "fz-dim"));
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    out.push(label([pF[0] - 4 * sc, pF[1]], `a = ${D.ARM.fan.toFixed(2)} 米`, "fz-dimlbl", "start", 19 * sc)); // short span: label beside the fan end
    out.push(label([pN[0] + 4 * sc, pN[1]], `b = ${D.ARM.noz.toFixed(2)} 米`, "fz-dimlbl", "end", 19 * sc)); // beside the nozzle end, clear of the weight arrow

    // weight at the CG (world vertical)
    const cgW = toW(D.CG), cg = pr(cgW);
    const wTip = pr([cgW[0], cgW[1], cgW[2] - D.FSUM * D.KN_M * U]);
    out.push(arrow(cg, wTip, 5 * sc, 17 * sc, "fz-arr fz-w"));
    out.push(label(wTip, `重量 ≈ ${kn(D.FSUM)} 千牛`, "fz-wl", "start", 0).replace(/x="([\d.-]+)"/, (m0, x) => `x="${f1(+x + 12 * sc)}"`));
    out.push(label([wTip[0] + 12 * sc, wTip[1]], "（由推力反推，非公开数据）", "fz-note", "start", 17 * sc));

    // thrusts: from each post along body-up, length ∝ force
    const T = (key, cls) => {
      const a = toW(D.PTS[key]), F = cur[key];
      const b = [a[0] + up[0] * F * D.KN_M * U, a[1] + up[1] * F * D.KN_M * U, a[2] + up[2] * F * D.KN_M * U];
      const w = key.startsWith("post") ? 3.4 : 5;
      out.push(arrow(pr(a), pr(b), w * sc, (key.startsWith("post") ? 9 : 17) * sc, "fz-arr " + cls));
      out.push(`<circle class="fz-pt ${cls}" cx="${f1(pr(a)[0])}" cy="${f1(pr(a)[1])}" r="${f1(3 * sc)}"/>`);
      return pr(b);
    };
    const tF = T("fan", "fz-cold"), tN = T("noz", "fz-hot"), tL = T("postL", "fz-post"), tR = T("postR", "fz-post");
    // the two tips stand at about the same height ~6.7 m apart: fan labels to the right of its tip, nozzle labels to the left
    // the nozzle's labels stay above the fin tips (in 左滚 the port fin rises into them)
    const finTop = Math.min(...[[-5.47, 2.0, 2.4], [-6.48, 2.0, 2.4], [-5.47, -2.0, 2.4], [-6.48, -2.0, 2.4]].map((p) => pr(toW(p))[1]));
    const tF2 = [tF[0] - 6 * sc, tF[1]], tN2 = [tN[0] + 6 * sc, Math.min(tN[1], finTop - 2 * sc)];
    out.push(label(tF2, "升力风扇", "fz-name", "start", -26 * sc), label(tF2, `${kn(cur.fan)} 千牛 · 示意`, "fz-val fz-cold-t", "start", -9 * sc));
    out.push(label(tN2, "三轴承喷管", "fz-name", "end", -26 * sc), label(tN2, `${kn(cur.noz)} 千牛 · 示意`, "fz-val fz-hot-t", "end", -9 * sc));
    // roll posts: labels off to the side with the value
    const pl = pr(toW(D.PTS.postL)), prr = pr(toW(D.PTS.postR));
    // below the lever-arm line (the moved nose wheel now hangs where this label used to sit, just under the posts)
    out.push(label([pl[0] + 14 * sc, Math.max(pF[1], pC[1]) + 42 * sc], `滚转喷口 左 ${kn(cur.postL)} · 右 ${kn(cur.postR)}`, "fz-small fz-post-t", "start"));

    // CG marker (quartered roundel)
    const R0 = 9 * sc;
    out.push(`<circle class="fz-cg-bg" cx="${f1(cg[0])}" cy="${f1(cg[1])}" r="${f1(R0 + 1.6 * sc)}"/>`);
    out.push(`<path class="fz-cg-q" d="M${P2(cg)}L${P2([cg[0] + R0, cg[1]])}A${f1(R0)} ${f1(R0)} 0 0 0 ${P2([cg[0], cg[1] - R0])}ZM${P2(cg)}L${P2([cg[0] - R0, cg[1]])}A${f1(R0)} ${f1(R0)} 0 0 0 ${P2([cg[0], cg[1] + R0])}Z"/>`);
    out.push(label([cg[0] + 14 * sc, cg[1] - 12 * sc], "重心（估计）", "fz-cgl", "start")); // above-right: the nozzle arrow now stands just left of the CG

    // moments
    const Mp = cur.fan * D.ARM.fan + (cur.postL + cur.postR) * D.ARM.post - cur.noz * D.ARM.noz;
    const Mr = (cur.postR - cur.postL) * D.ARM.roll; // + = port wing down (左滚)
    const arcAt = (plane, a0, a1) => {
      const pts = [], n = 26, Rm = 2.2;
      for (let i = 0; i <= n; i++) {
        const th = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
        const q = plane === "p" ? [D.CG[0] + Rm * Math.cos(th), 0, D.CG[2] + Rm * Math.sin(th)] : [D.CG[0], Rm * Math.cos(th), D.CG[2] + Rm * Math.sin(th)];
        pts.push(pr(toW(q)));
      }
      return pts;
    };
    const mArc = (M, plane, word, nameP, nameN) => {
      const a = Math.min(1, Math.abs(M) / D.MFULL[plane]); // full strength at the commanded moment
      if (a < 0.02) return;
      // roll arcs stop at 60° so the head stays clear of 「重心（估计）」 just above-right of the CG
      const [e0, e1] = plane === "p" ? [35, 145] : [150, 60]; // + : pitch 35° → 145°, roll 150° → 60° (as before, shortened)
      const pts = M > 0 ? arcAt(plane, e0, e1) : arcAt(plane, e1, e0);
      out.push(`<g class="fz-marc" opacity="${a.toFixed(2)}">${ribbonArc(pts, 3.2 * sc, 13 * sc, "fz-arc")}${label(pts[Math.floor(pts.length / 2)], `${(M > 0 ? nameP : nameN).slice(0, big ? 2 : 9)} ${Math.abs(M).toFixed(0)} 千牛·米`, "fz-arcl", "middle", -12 * sc)}</g>`);
    };
    mArc(Mp, "p", "", "抬头力矩", "低头力矩");
    mArc(Mr, "r", "", "左滚力矩", "右滚力矩");
    gOver.innerHTML = out.join("");

    // strip
    cellEl.fan.innerHTML = `${kn(cur.fan)}<small>千牛</small>`;
    cellEl.noz.innerHTML = `${kn(cur.noz)}<small>千牛</small>`;
    cellEl.post.innerHTML = `${kn(cur.postL)} / ${kn(cur.postR)}<small>千牛</small>`;
    cellEl.sum.innerHTML = `${kn(cur.fan + cur.noz + cur.postL + cur.postR)} / ${kn(D.FSUM)}<small>千牛</small>`;
    const mp = Math.abs(Mp) < 0.5 ? "0" : (Mp > 0 ? "+" : "−") + Math.abs(Mp).toFixed(0);
    const mr = Math.abs(Mr) < 0.5 ? "0" : (Mr > 0 ? "+" : "−") + Math.abs(Mr).toFixed(0);
    cellEl.mp.innerHTML = `${mp}<small>千牛·米${Math.abs(Mp) < 0.5 ? " 平衡" : Mp > 0 ? " 抬头" : " 低头"}</small>`;
    cellEl.mr.innerHTML = `${mr}<small>千牛·米${Math.abs(Mr) < 0.5 ? " 平衡" : Mr > 0 ? " 左滚" : " 右滚"}</small>`;
    if (readEl.textContent !== phaseWord) readEl.textContent = phaseWord;
  }

  // ---- commands ----
  const ease = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  const smoother = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * t * (t * (t * 6 - 15) + 10); };
  // u(t): +1 = the command's split, −1 = the opposite split (brakes the rotation), 0 = balance.
  // Attitude follows the moment: accelerate with +1, brake with −1, hold at 0, then the same back.
  const UK = [[0, 0], [0.2, 1], [0.7, 1], [0.9, -1], [1.4, -1], [1.6, 0], [2.4, 0], [2.6, -1], [3.1, -1], [3.3, 1], [3.8, 1], [4.0, 0]];
  const DUR = 4.1;
  const uAt = (t) => { for (let i = 1; i < UK.length; i++) if (t <= UK[i][0]) { const [t0, u0] = UK[i - 1], [t1, u1] = UK[i]; return u0 + (u1 - u0) * ease((t - t0) / (t1 - t0)); } return 0; };
  const attAt = (t) => t < 1.6 ? smoother(t / 1.6) : t < 2.4 ? 1 : 1 - smoother((t - 2.4) / 1.6);
  const WORDS = {
    up: ["多给风扇、少给喷管：抬头力矩，机头抬起", "反过来分配，刹住转动", "保持抬头姿态：分配回到平衡，合力矩为零", "先低头力矩转回，再刹住", "平衡：合推力 = 重量，合力矩 = 0"],
    down: ["少给风扇、多给喷管和滚转喷口：低头力矩，机头下沉", "反过来分配，刹住转动", "保持低头姿态：分配回到平衡，合力矩为零", "先抬头力矩转回，再刹住", "平衡：合推力 = 重量，合力矩 = 0"],
    left: ["右滚转喷口开大、左侧关小：左滚力矩", "反过来分配，刹住滚转", "保持左倾：左右推力相等，合力矩为零", "反向滚转回正，再刹住", "平衡：合推力 = 重量，合力矩 = 0"],
    right: ["左滚转喷口开大、右侧关小：右滚力矩", "反过来分配，刹住滚转", "保持右倾：左右推力相等，合力矩为零", "反向滚转回正，再刹住", "平衡：合推力 = 重量，合力矩 = 0"],
  };
  const BAL_WORD = "平衡：合推力 = 重量，合力矩 = 0";
  let anim = null, raf = 0;
  function setPressed(id) { btnEls.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cmd === id))); }
  // u < 0 brakes with the opposite command's split (抬头 ↔ 低头, 左滚 ↔ 右滚), so every component stays at or
  // below its published maximum throughout
  function mix(c, u, att) {
    const o = {}, e = u < 0 && c.opp ? c.opp : c, w = Math.abs(u);
    for (const k of KEYS) o[k] = BAL[k] + (e[k] - BAL[k]) * w;
    o.pitch = c.pitch * att; o.roll = c.roll * att;
    return o;
  }
  function tick(now) {
    raf = 0;
    if (!anim) return;
    const t = (now - anim.t0) / 1000;
    if (anim.kind === "cmd") {
      const c = D.CMD[anim.id];
      cur = mix(c, uAt(t), attAt(t));
      const w = WORDS[anim.id];
      phaseWord = t < 0.8 ? w[0] : t < 1.6 ? w[1] : t < 2.4 ? w[2] : t < 4.0 ? w[3] : w[4];
      if (t >= DUR) { cur = Object.assign({}, BAL); phaseWord = BAL_WORD; anim = null; setPressed("bal"); }
    } else { // back to balance from wherever we are
      const e = ease(t / 0.6);
      cur = {}; for (const k of [...KEYS, "pitch", "roll"]) cur[k] = anim.from[k] + (BAL[k] - anim.from[k]) * e;
      phaseWord = BAL_WORD;
      if (t >= 0.6) { cur = Object.assign({}, BAL); const nxt = anim.then; anim = nxt ? { kind: "cmd", id: nxt, t0: now } : null; }
    }
    draw();
    if (anim) raf = requestAnimationFrame(tick);
  }
  function command(id) {
    setPressed(id);
    if (reduced.matches) { // no motion: show the commanded split and the attitude it leads to, held until 平衡
      anim = null;
      if (id === "bal") { cur = Object.assign({}, BAL); phaseWord = BAL_WORD; }
      else { cur = mix(D.CMD[id], 1, 1); phaseWord = WORDS[id][0].split("：")[0] + "：结果姿态（按「平衡」复位）"; }
      draw();
      return;
    }
    if (id === "bal") anim = { kind: "bal", t0: performance.now(), from: Object.assign({}, cur) };
    else {
      if (anim || Math.abs(cur.pitch) > 0.05 || Math.abs(cur.roll) > 0.05) { // finish returning first, quickly
        anim = { kind: "bal", t0: performance.now(), from: Object.assign({}, cur), then: id };
      } else anim = { kind: "cmd", id, t0: performance.now() };
    }
  }
  // pre-render a command's attitudes in idle time when the pointer or focus reaches its button
  const idle = window.requestIdleCallback || ((f) => setTimeout(() => f({ timeRemaining: () => 8 }), 30));
  const warmed = new Set();
  function warm(id) {
    const c = D.CMD[id];
    if (!c || id === "bal" || warmed.has(id) || reduced.matches) return;
    warmed.add(id);
    const n = Math.round(Math.max(Math.abs(c.pitch), Math.abs(c.roll)) * 5), list = [];
    for (let i = 1; i <= n; i++) list.push([c.pitch * i / n, c.roll * i / n]);
    const step = (dl) => {
      while (list.length && dl.timeRemaining() > 6) {
        const [p, r] = list.shift(), qp = Math.round(p * 5) / 5, qr = Math.round(r * 5) / 5, key = qp.toFixed(1) + "," + qr.toFixed(1);
        if (!cache.has(key)) { const keep = shownKey; prerender(qp, qr, key); shownKey = keep; }
      }
      if (list.length) idle(step);
    };
    idle(step);
  }
  btnEls.forEach((b) => { b.addEventListener("pointerenter", () => warm(b.dataset.cmd)); b.addEventListener("focus", () => warm(b.dataset.cmd)); });
  const run = () => { if (anim && !raf) raf = requestAnimationFrame(tick); };
  btnEls.forEach((b) => b.addEventListener("click", () => { command(b.dataset.cmd); run(); }));
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const i = "12345".indexOf(e.key);
    if (i >= 0) { command(btnEls[i].dataset.cmd); run(); btnEls[i].focus({ preventScroll: true }); }
  });
  // notes overlay: Esc / outside click closes
  const notes = document.querySelector(".tp-notes");
  if (notes) {
    notes.addEventListener("keydown", (e) => { if (e.key === "Escape" && notes.open) { notes.open = false; notes.querySelector("summary").focus(); } });
    document.addEventListener("pointerdown", (e) => { if (notes.open && !notes.contains(e.target)) notes.open = false; });
  }
  // viewBox: tight crop on phones
  const fitVB = () => { svg.setAttribute("viewBox", narrow.matches ? D.VB_T.join(" ") : `0 0 ${D.W} ${D.H}`); svg.classList.toggle("tp-tight", narrow.matches); draw(); };
  narrow.addEventListener("change", fitVB);
  phaseWord = BAL_WORD;
  fitVB();
  window.__fz = { bench: (fresh) => { if (fresh) cache.clear(); const keep = Object.assign({}, cur), ts = []; for (let i = 0; i < 30; i++) { cur = mix(D.CMD.up, 1, i / 29); const t = performance.now(); draw(); svg.getBoundingClientRect(); ts.push(performance.now() - t); } cur = keep; draw(); ts.sort((a, b) => a - b); return ts[15].toFixed(1) + '/' + ts[27].toFixed(1); }, command: (id) => { command(id); run(); }, state: () => Object.assign({}, cur), anim: () => anim, cache };
}
