/*EXGEOM>*/
const EX_GEOM = {
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
function exBase(src, G) {
  const one = (s, a, b) => { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error("exBase: " + a.slice(0, 40)); return s.slice(0, i) + b + s.slice(i + a.length); };
  const dx = G.gearDX, X = (v) => +(v + dx).toFixed(3), N = (v) => +(v + G.noseDX).toFixed(3);
  const all = (s, a, b, n) => { const k = s.split(a).length - 1; if (k !== n) throw new Error("exBase: " + a.slice(0, 40) + " ×" + k); return s.split(a).join(b); };
  let s = one(src, "const base = [-6.42, 0, 0.04];", `const base = [${G.nozBase[0]}, 0, ${G.nozZ0} + (${G.nozBase[2] - G.nozZ0}) * Math.min(1, Math.max(0, deg / 90))];`);
  s = one(s, "const th = Math.max(1e-4, deg * D2R);", `const kk = Math.min(1, Math.max(0, deg / 90)); const a0 = ${G.nozA0} * D2R * kk; const th = Math.max(1e-4, deg * D2R - a0);`);
  s = one(s, "const at = (s) => { const f = s / R; return [V3.add(base, [-R * Math.sin(f), 0, -R * (1 - Math.cos(f))]), [-Math.cos(f), 0, -Math.sin(f)]]; };",
    "const at = (s) => { const f = a0 + s / R; return [V3.add(base, [-R * (Math.sin(f) - Math.sin(a0)), 0, -R * (Math.cos(a0) - Math.cos(f))]), [-Math.cos(f), 0, -Math.sin(f)]]; };");
  s = one(s, 'add(`nozzle.${i}`, seg, { tone: "hi", lit: true, bias: 3 + i * 0.01, seams: true, smooth: true, cls: "xr-keep" })',
    'add(`nozzle.${i}`, seg, { tone: "hi", lit: true, bias: 3 + i * 0.01, seams: true, smooth: true, cls: "xr-keep", rel: { to: ["fuselage"], d: 0.05 - i * 0.001, side: [0, 0, -1] } })');
  for (const id of ["mp", "ms"]) { // main legs: every station in the GEAR entry
    const a = s.indexOf(`{ id: "${id}",`), b = s.indexOf("\n", a);
    if (a < 0) throw new Error("exBase: gear " + id);
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
// exploded view only: the fuselage shell cut into seven panels along the chine and three stations (6.3 radome
// joint, 3.1, −0.4 upper / −2.9 lower, both existing rings, so every cut runs on a mesh edge), and a renderer that
// returns each part's own markup, depth key and body box so the page can translate parts without re-rendering
function exPatch(src) {
  const one = (s, a, b) => { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error("exPatch: " + a.slice(0, 40)); return s.slice(0, i) + b + s.slice(i + a.length); };
  let s = exBase(src, EX_GEOM);
  s = one(s, 'add("fuselage", fus, { tone: "hi", smooth: true, id: "fuselage" });',
    'for (const [nm, sm] of exSplit(fus)) add(nm, sm, { tone: "hi", smooth: true, sortFaces: true, id: nm === "skin.la" ? "fuselage" : nm });');
  s = one(s, "function staticParts() {", `function exSplit(m) {
  const n = 2 * (NL + NU), R = Math.floor((m.v.length - 1) / n), UP = (j) => j >= NL && j <= NL + 2 * NU;
  const by = new Map(), vOf = new Map();
  m.f.forEach((face, fi) => {
    let nm = "skin.la";
    if (face.length <= 4) {
      const ring = face.filter((k) => k < R * n), x = ring.reduce((a, k) => a + m.v[k][0], 0) / ring.length;
      const up = ring.every((k) => UP(k % n));
      nm = x > 6.3 ? "skin.radome" : up ? (x > 3.1 ? "skin.uf" : x > -0.4 ? "skin.um" : "skin.ua") : (x > 3.1 ? "skin.lf" : x > -2.9 ? "skin.lm" : "skin.la");
    }
    if (!by.has(nm)) by.set(nm, []);
    by.get(nm).push(fi);
    for (const k of face) if (!vOf.has(k)) vOf.set(k, nm);
  });
  const out = [];
  for (const [nm, fis] of by) {
    const map = new Map(), v = [];
    const id = (k) => { if (!map.has(k)) { map.set(k, v.length); v.push(m.v[k]); } return map.get(k); };
    const f = fis.map((fi) => m.f[fi].map(id));
    const sm = { v, f, caps: [] };
    sm.crease = new Set();
    for (const key of m.crease) { const [a, b] = key.split(",").map(Number); if (map.has(a) && map.has(b)) { const A = map.get(a), B = map.get(b); sm.crease.add(A < B ? A + "," + B : B + "," + A); } }
    sm.loops = m.loops.filter((L) => L.every((k) => map.has(k))).map((L) => L.map((k) => map.get(k)));
    { // a 2.5 cm thick shell: inner skin (reversed; depth-sorted with the outer) and a rim round the cut, so a panel reads from both sides
      const nv = v.length, vn = v.map(() => [0, 0, 0]);
      f.forEach((fc) => { const nn = newell(fc.map((k) => v[k])); for (const k of fc) vn[k] = V3.add(vn[k], nn); });
      for (let k = 0; k < nv; k++) v.push(V3.sub(v[k], V3.mul(V3.unit(vn[k]), 0.025)));
      const cnt = new Map(), dir = new Map();
      f.forEach((fc) => fc.forEach((a, i) => { const b = fc[(i + 1) % fc.length], key = a < b ? a + "," + b : b + "," + a; cnt.set(key, (cnt.get(key) || 0) + 1); dir.set(key, [a, b]); }));
      const nf = f.length;
      for (let i = 0; i < nf; i++) f.push(f[i].map((k) => k + nv).reverse());
      for (const [key, c] of cnt) if (c === 1) { const [a, b] = dir.get(key); f.push([b, a, a + nv, b + nv]); }
    }
    sm.decals = (m.decals || []).filter((dc) => { let best = -1, bd = Infinity; m.v.forEach((p, k) => { const d = V3.len(V3.sub(p, dc.o)); if (d < bd) { bd = d; best = k; } }); return vOf.get(best) === nm; });
    out.push([nm, sm]);
  }
  return out;
}
function staticParts() {`);
  s = one(s, "return { M, SPEC, DECK,", `function renderParts(s, P, opts = {}) {
  const C = camera(P), xo = opts.xray || null;
  const V = viewDir(C), Lt = lightDir(C);
  if (!STATIC) STATIC = staticParts();
  const toW = bodyToWorld(s), dW = dirToWorld(s);
  const all = [...STATIC, ...movingParts(s).parts];
  if (xo) all.push(...xrayParts(s, xo));
  const pr = (p) => project(toW(p), C);
  const ctx = { pr, toW, dW, V, C, s, path: pathOf };
  const res = [];
  for (const part of all) {
    if (opts.skip && opts.skip(part)) continue;
    const mesh = part.mesh, bv = mesh.v.length ? mesh.v : [part.at || [0, 0, 0]];
    const wv = mesh.v.map(toW);
    const c = wv.length ? centroid(wv) : toW(part.at || [0, 0, 0]);
    let svg;
    if (mesh.custom) svg = mesh.custom(ctx);
    else if (part.flat) { const q = mesh.f[0].map((i) => project(wv[i], C)); const d = pathOf(q); svg = '<path class="ac-cav" d="' + d + '"/><path class="iso-line" data-tone="hi" d="' + d + '"/>'; }
    else {
      const sv = wv.map((p) => project(p, C));
      const g = partSvg(part, wv, sv, V, Lt, pathOf, lineOf, { dW, pr, toW });
      if (xo && part.xr) g.push(xrayExtra(part, s, xo, ctx));
      svg = g.join("");
    }
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const p of bv) for (let i = 0; i < 3; i++) { if (p[i] < lo[i]) lo[i] = p[i]; if (p[i] > hi[i]) hi[i] = p[i]; }
    res.push({ name: part.name, id: part.id || null, rel: part.rel || null, cls: part.cls || "", custom: !!mesh.custom, key: V3.dot(c, V) + (part.bias || 0), cb: centroid(bv), lo, hi, svg, sv: mesh.custom ? null : bv.map(pr) });
  }
  return { parts: res, V, side: (d) => V3.dot(dW(d), V) };
}
return { renderParts, M, SPEC, DECK,`);
  return s;
}
/*<EXGEOM*/
// 部件拆解 · F-35B（STOVL 构型）：the corrected model (wing 1.5 m aft, right-handed projection) with the forces /
// ground / power page geometry block, its skin cut into panels. Each view is rendered once (one <g> per part);
// exploding only translates those groups (orthographic camera: a body offset is a fixed screen offset) and re-sorts
// them by depth. Offsets and the panel cuts are illustrative (示意); the parts and their numbers are the project's.
(() => {
  if (!window.EX || !window.F35M) return;
  fetch("shared/f35b-model.js").then((r) => r.text()).then((src) => (new Function(exPatch(src) + "\nreturn F35M;"))())
    .catch(() => null)
    .then((Mo) => exStart(Mo && Mo.renderParts ? Mo : null));
})();
function exStart(Mo) {
  const D = window.EX, svg = document.querySelector(".tp-svg"), box = document.querySelector(".tp-box");
  if (!svg) return;
  if (!Mo) { svg.insertAdjacentHTML("beforeend", `<text class="ex-fail" x="50%" y="50%" text-anchor="middle">需要通过网页（http）打开本页</text>`); return; }
  const gAc = svg.querySelector(".ex-ac"), gLab = svg.querySelector(".ex-lab");
  const btn = document.querySelector("[data-explode]"), range = document.querySelector("[data-p]"), vBtns = [...document.querySelectorAll("[data-view]")];
  const readEl = document.querySelector("[data-read]"), hintEl = document.querySelector(".ex-hint");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)"), narrow = matchMedia("(max-width: 700px)");
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  const base = Mo.stateAt(Mo.TIMES.C.tDescend + 0.02);
  const S = Object.assign({}, base, { x: 0, y: 0, z: 0, pitch: 0, roll: 0, fanPhase: 0.9, door: 1, aux: 1, fan: 1, nozzle: 90, posts: 1, gear: 1, power: 1, stab: 0, rud: 0 });
  const XO = { x: 1, shaft: 0, clock: 0, inlet: 0, aux: 0 };
  const G = Object.fromEntries(D.GROUPS.map((g) => [g.id, g]));

  // part → group (and side for the mirrored ones)
  function groupOf(p) {
    const n = p.name, x = p.cb[0];
    if (n.startsWith("skin.")) return n;
    if (n.startsWith("canopy")) return "canopy";
    if (n === "fan.well") return "skin.um"; // the fan opening under the open door rides with its panel
    for (const [re, g] of D.MAP) if (new RegExp(re).test(n)) return g;
    if (n === "gear.door") return x > 2.5 ? "gdoorN" : "gdoorM";
    if (n.startsWith("gear.")) return x > 2.5 ? "ngear" : "mgear";
    return null;
  }
  const skip = (part) => /^(gear\.well|gear\.seam)$/.test(part.name); // closed doors: nothing to draw

  // ---- views ----
  const VIEWS = { iso: D.ISO, side: [90, 3], top: [90, 89] };
  let az = VIEWS.iso[0], el = VIEWS.iso[1], view = "iso";
  let parts = [], nodes = [], PJ = null, cur = 0, target = 0, order = "", hl = null, pinned = null;

  const AX = () => (narrow.matches ? D.PHONE_K : [1, 1, 1]); // phone: a narrower spread, a little taller
  const SKIN_P = 0.16; // progress at which the skin layer is ≈ 1/3 out (layer 0 window 0…0.48, eased)
  function offsetOf(q, p) { // body offset (metres) of part q at progress p, layer-staggered and eased
    const g = G[q.g], L = g.L, d = 0.13 * L, w = 1 - 0.13 * 4, K = AX();
    const u = ease(clamp((p - d) / w));
    return [g.o[0] * u * K[0], g.o[1] * q.side * u * K[1], g.o[2] * u * K[2]];
  }
  function fit(W, H) {
    // fit the assembled and the fully exploded aircraft for this view into the box, leaving room for the label
    const P0 = { azimuth: az, elevation: el, scale: 1, origin: [0, 0] }, C0 = Mo.camera(P0);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const A = [Infinity, -Infinity, Infinity, -Infinity];
    for (const q of parts0) for (const p of [0, 1]) {
      const o = p ? q.o1 : [0, 0, 0];
      for (const cx of [q.lo[0], q.hi[0]]) for (const cy of [q.lo[1], q.hi[1]]) for (const cz of [q.lo[2], q.hi[2]]) {
        const s = Mo.project([(cx + o[0]) * 10, (cy + o[1]) * 10, (cz + o[2]) * 10], C0);
        if (s[0] < x0) x0 = s[0]; if (s[0] > x1) x1 = s[0]; if (s[1] < y0) y0 = s[1]; if (s[1] > y1) y1 = s[1];
        if (!p) { A[0] = Math.min(A[0], s[0]); A[1] = Math.max(A[1], s[0]); A[2] = Math.min(A[2], s[1]); A[3] = Math.max(A[3], s[1]); }
      }
    }
    const pad = narrow.matches ? 10 : 22, top = narrow.matches ? 8 : 16;
    const k = Math.min((W - 2 * pad) / (x1 - x0), (H - top - pad) / (y1 - y0));
    const origin = [W / 2 - k * (x0 + x1) / 2, top + (H - top - pad) / 2 - k * (y0 + y1) / 2];
    // assembled: zoom in on the aircraft alone (one transform on the whole group), easing out as it comes apart
    const aw = (A[1] - A[0]) * k, ah = (A[3] - A[2]) * k;
    ZV = { za: Math.max(1, Math.min(narrow.matches ? 2.4 : 1.7, (W - 2 * pad - (narrow.matches ? 6 : 40)) / aw, (H - top - pad - 40) / ah)), ca: [origin[0] + k * (A[0] + A[1]) / 2, origin[1] + k * (A[2] + A[3]) / 2], ce: [W / 2, top + (H - top - pad) / 2] };
    return { azimuth: az, elevation: el, scale: k, origin };
  }
  // body boxes at the default view (independent of the camera): used for the fit
  let parts0 = [], ZV = { za: 1, ca: [0, 0], ce: [0, 0] }, ZT = { z: 1, c: [0, 0] };
  const zpt = (a) => [ZV.ce[0] + (a[0] - ZT.c[0]) * ZT.z, ZV.ce[1] + (a[1] - ZT.c[1]) * ZT.z];
  let VW = 1200, VH = 760;
  function render() {
    const bb = box.getBoundingClientRect();
    VW = Math.max(200, Math.round(bb.width)); VH = Math.max(200, Math.round(bb.height));
    svg.setAttribute("viewBox", `0 0 ${VW} ${VH}`);
    if (!parts0.length) {
      const r0 = Mo.renderParts(S, { azimuth: az, elevation: el, scale: 1, origin: [0, 0] }, { xray: XO, skip });
      parts0 = r0.parts.map((q) => { const g = groupOf(q); const side = Math.abs(q.cb[1]) > 0.05 ? Math.sign(q.cb[1]) : 0; return { g, side, lo: q.lo, hi: q.hi, o1: g ? [G[g].o[0] * AX()[0], G[g].o[1] * side * AX()[1], G[g].o[2] * AX()[2]] : [0, 0, 0] }; });
    }
    PJ = fit(VW, VH);
    const r = Mo.renderParts(S, PJ, { xray: XO, skip });
    const C = Mo.camera(PJ), O = Mo.project([0, 0, 0], C);
    const ux = Mo.project([10, 0, 0], C), uy = Mo.project([0, 10, 0], C), uz = Mo.project([0, 0, 10], C);
    const A = [[ux[0] - O[0], uy[0] - O[0], uz[0] - O[0]], [ux[1] - O[1], uy[1] - O[1], uz[1] - O[1]]];
    const Vd = r.V; // world view direction (body = world here: pitch 0, origin 0; world = body × 10)
    parts = r.parts.map((q, i) => {
      const g = groupOf(q), side = Math.abs(q.cb[1]) > 0.05 ? Math.sign(q.cb[1]) : 0;
      return { ...q, i, g, side, inner: /^xr\./.test(q.name) };
    });
    const html = parts.map((q) => `<g class="ac-part${q.cls ? " " + q.cls : ""}" data-g="${q.g || ""}" data-i="${q.i}">${q.svg.replace(/^<g class="ac-part[^"]*">([\s\S]*)<\/g>$/, "$1")}</g>`).join("");
    gAc.innerHTML = html;
    nodes = [...gAc.children];
    const byId = {}; parts.forEach((q) => { if (q.id) byId[q.id] = q; });
    for (const q of parts) {
      q.A = A; q.Vd = Vd; q.el = nodes[q.i];
      q.relVis = q.rel ? (q.rel.side ? r.side(q.rel.side) > 0 : true) : true;
      q.relTo = q.rel ? (q.relVis || !q.rel.hidTo ? q.rel.to : q.rel.hidTo).map((id) => byId[id]).filter(Boolean) : [];
    }
    order = "";
    place(cur, true);
    if (hl) highlight(hl, true);
  }
  // translate every part for progress p and keep the painter's order (rel pins only between parts moving together)
  function place(p, force) {
    for (const q of parts) {
      const o = q.g ? offsetOf(q, p) : [0, 0, 0];
      q.o = o;
      q.dx = q.A[0][0] * o[0] + q.A[0][1] * o[1] + q.A[0][2] * o[2];
      q.dy = q.A[1][0] * o[0] + q.A[1][1] * o[1] + q.A[1][2] * o[2];
      // inside parts stay under the skin until the skin layer is a third of the way out
      q.k = q.key + 10 * (q.Vd[0] * o[0] + q.Vd[1] * o[1] + q.Vd[2] * o[2]) - (q.inner && p < SKIN_P ? 1e4 : 0);
      const t = Math.abs(q.dx) + Math.abs(q.dy) > 0.05 ? `translate(${q.dx.toFixed(1)} ${q.dy.toFixed(1)})` : "";
      if (q.t !== t || force) { q.t = t; t ? q.el.setAttribute("transform", t) : q.el.removeAttribute("transform"); }
    }
    for (let pass = 0; pass < 2; pass++) for (const q of parts) {
      if (!q.relTo.length) continue;
      const pool = q.relTo.filter((b) => Math.abs(b.o[0] - q.o[0]) + Math.abs(b.o[1] - q.o[1]) + Math.abs(b.o[2] - q.o[2]) < 0.05);
      if (!pool.length) continue;
      q.k = q.relVis ? Math.max(...pool.map((b) => b.k)) + q.rel.d : Math.min(...pool.map((b) => b.k)) - q.rel.d;
    }
    { const e = ease(clamp(p / 0.48)); ZT.z = 1 / (1 / ZV.za + (1 - 1 / ZV.za) * e); /* follows the skin layer's extent */ ZT.c = [ZV.ca[0] + (ZV.ce[0] - ZV.ca[0]) * e, ZV.ca[1] + (ZV.ce[1] - ZV.ca[1]) * e];
      const t = Math.abs(ZT.z - 1) < 1e-3 ? "" : `translate(${f1(ZV.ce[0])} ${f1(ZV.ce[1])}) scale(${ZT.z.toFixed(4)}) translate(${f1(-ZT.c[0])} ${f1(-ZT.c[1])})`;
      if (t) gAc.setAttribute("transform", t); else gAc.removeAttribute("transform"); }
    const sorted = parts.slice().sort((a, b) => a.k - b.k);
    const key = sorted.map((q) => q.i).join(",");
    if (key !== order) { order = key; for (const q of sorted) gAc.appendChild(q.el); }
    if (range && document.activeElement !== range) range.value = String(Math.round(p * 100));
    if (range) range.setAttribute("aria-valuetext", `拆解进度 ${Math.round(p * 100)}%`);
    if (hl) drawLabel(hl);
  }

  // ---- highlight + label ----
  function anchorOf(gid) { // a vertex of the group that is actually on top there (else the one nearest its centroid)
    const qs = parts.filter((q) => q.g === gid && q.sv);
    if (!qs.length) { const q = parts.find((o) => o.g === gid); if (!q) return null; const s = Mo.project(q.cb.map((v) => v * 10), Mo.camera(PJ)); return zpt([s[0] + q.dx, s[1] + q.dy]); }
    const pts = [];
    for (const q of qs) for (const s of q.sv) pts.push(zpt([s[0] + q.dx, s[1] + q.dy]));
    let cx = 0, cy = 0; for (const s of pts) { cx += s[0]; cy += s[1]; } cx /= pts.length; cy /= pts.length;
    pts.sort((u, v) => Math.hypot(u[0] - cx, u[1] - cy) - Math.hypot(v[0] - cx, v[1] - cy));
    const m = svg.getScreenCTM();
    if (m) {
      const step = Math.max(1, Math.floor(pts.length / 90));
      for (let i = 0; i < pts.length; i += step) {
        const s = pts[i]; if (s[0] < 4 || s[1] < 4 || s[0] > VW - 4 || s[1] > VH - 4) continue;
        const t = document.elementFromPoint(s[0] * m.a + m.e, s[1] * m.d + m.f), n = t && t.closest && t.closest("[data-g]");
        if (n && n.dataset.g === gid) return s;
      }
    }
    return pts[0];
  }
  function highlight(gid, keep) {
    hl = gid;
    gAc.classList.toggle("ex-hl", !!gid);
    for (const q of parts) q.el.classList.toggle("ex-on", !!gid && q.g === gid);
    if (gid) drawLabel(gid); else gLab.innerHTML = "";
    if (!keep && readEl) readEl.textContent = gid ? `${G[gid].name}：${G[gid].role}` : D.READ;
  }
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  let measure = null;
  function textW(txt, cls) {
    if (!measure) { measure = document.createElementNS("http://www.w3.org/2000/svg", "text"); measure.setAttribute("class", "ex-m"); svg.appendChild(measure); }
    measure.setAttribute("class", cls + " ex-m"); measure.textContent = txt;
    return measure.getComputedTextLength();
  }
  function drawLabel(gid) {
    const g = G[gid], a = anchorOf(gid);
    if (!a) { gLab.innerHTML = ""; return; }
    const ph = narrow.matches;
    const t1 = g.name, t2 = g.role;
    const w1 = textW(t1, "ex-t1"), w2 = textW(t2, "ex-t2");
    const maxW = VW - 16;
    let lines2 = [t2];
    if (w2 > maxW - 20) { // split the role on a comma or in half
      const i = t2.indexOf("，", Math.floor(t2.length * 0.35));
      const cut = i > 0 ? i + 1 : Math.ceil(t2.length / 2);
      lines2 = [t2.slice(0, cut), t2.slice(cut)];
    }
    const w = Math.min(maxW, Math.max(w1, ...lines2.map((l) => textW(l, "ex-t2"))) + 20);
    const h = 26 + 17 * lines2.length;
    // put the box above or below the anchor, toward the open side, then clamp into the view
    const cx = VW / 2, cy = VH / 2;
    const gap = ph ? 30 : 46;
    let bx = a[0] + (a[0] < cx ? -w - gap * 0.4 : gap * 0.4), by = a[1] < cy ? a[1] - h - gap : a[1] + gap;
    if (by < 4) by = a[1] + gap; if (by + h > VH - 4) by = a[1] - h - gap;
    const bot = ph ? 6 : 28; // keep clear of the hint line
    if (by + h > VH - bot) by = a[1] - h - gap;
    bx = clamp(bx, 6, VW - w - 6); by = clamp(by, 6, VH - h - bot);
    // leader: anchor dot → nearest point on the box outline
    const ex = clamp(a[0], bx, bx + w), ey = clamp(a[1], by, by + h);
    let lx = ex, ly = ey;
    if (ex > bx && ex < bx + w && ey > by && ey < by + h) { lx = a[0]; ly = by; } // anchor inside the box: no leader
    const lead = Math.hypot(lx - a[0], ly - a[1]) > 6 ? `<path class="ex-lead" d="M${f1(a[0])} ${f1(a[1])}L${f1(lx)} ${f1(ly)}"/>` : "";
    gLab.innerHTML = `${lead}<circle class="ex-dot" cx="${f1(a[0])}" cy="${f1(a[1])}" r="3.6"/><rect class="ex-box" x="${f1(bx)}" y="${f1(by)}" width="${f1(w)}" height="${h}" rx="3"/>`
      + `<text class="ex-t1" x="${f1(bx + 10)}" y="${f1(by + 19)}">${esc(t1)}</text>` + lines2.map((l, i) => `<text class="ex-t2" x="${f1(bx + 10)}" y="${f1(by + 38 + 17 * i)}">${esc(l)}</text>`).join("");
  }
  svg.addEventListener("pointerover", (e) => { if (e.pointerType !== "mouse" || pinned) return; const n = e.target.closest("[data-g]"); const gid = n && n.dataset.g; if (gid && G[gid] && gid !== hl) highlight(gid); });
  svg.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !pinned) highlight(null); });
  svg.addEventListener("click", (e) => {
    if (dragMoved) return;
    let n = e.target.closest("[data-g]");
    if (!n && e.pointerType !== "mouse") { // a finger: take the nearest part within ~14 px
      for (const r of [7, 14]) { for (let k = 0; k < 8 && !n; k++) { const t = document.elementFromPoint(e.clientX + r * Math.cos(k * Math.PI / 4), e.clientY + r * Math.sin(k * Math.PI / 4)); n = t && t.closest && t.closest("[data-g]"); } if (n) break; }
    }
    const gid = n && n.dataset.g;
    if (gid && G[gid]) { pinned = pinned === gid ? null : gid; highlight(pinned || (e.pointerType === "mouse" ? gid : null)); }
    else { pinned = null; highlight(null); }
  });
  // keyboard: ←/→ walks the parts (outside → in), Esc clears
  const ORDER = D.GROUPS.map((g) => g.id);
  svg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const i = hl ? ORDER.indexOf(hl) : -1, n = ORDER.length;
      const j = e.key === "ArrowRight" ? (i + 1) % n : (i - 1 + n) % n;
      pinned = ORDER[j]; highlight(pinned);
    } else if (e.key === "Escape") { pinned = null; highlight(null); }
  });

  // ---- explode / assemble ----
  let raf = 0, last = 0;
  const DUR = 2.6; // s for 0 → 1
  function tick(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (cur !== target) {
      const s = Math.sign(target - cur);
      cur = s > 0 ? Math.min(target, cur + dt / DUR) : Math.max(target, cur - dt / DUR);
      place(cur);
      raf = requestAnimationFrame(tick);
    }
    syncBtn();
  }
  function go(t) {
    target = t;
    if (reduced.matches) { cur = t; place(cur); syncBtn(); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  function syncBtn() {
    const out = target > 0.5;
    btn.setAttribute("aria-pressed", String(out));
    btn.querySelector("span").textContent = out ? "装回" : "炸开";
  }
  btn.addEventListener("click", () => go(target > 0.5 || (cur > 0.5 && cur === target) ? 0 : 1));
  range.addEventListener("input", () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } cur = target = Number(range.value) / 100; place(cur); syncBtn(); });

  // ---- views + drag rotation ----
  let vAnim = 0;
  function setView(id) {
    const [a1, e1] = VIEWS[id]; view = id;
    vBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === id)));
    if (reduced.matches) { az = a1; el = e1; render(); return; }
    const a0 = az, e0 = el, t0 = performance.now(), da = ((a1 - a0 + 540) % 360) - 180;
    cancelAnimationFrame(vAnim);
    const stepV = (now) => {
      const u = ease(clamp((now - t0) / 650));
      az = a0 + da * u; el = e0 + (e1 - e0) * u; render();
      if (u < 1) vAnim = requestAnimationFrame(stepV);
    };
    vAnim = requestAnimationFrame(stepV);
  }
  vBtns.forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  let drag = null, dragMoved = false, dq = 0;
  svg.addEventListener("pointerdown", (e) => { if (e.button !== 0) return; drag = { x: e.clientX, y: e.clientY, az, el }; dragMoved = false; });
  addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!dragMoved && Math.hypot(dx, dy) < 5) return;
    if (!dragMoved) { dragMoved = true; svg.setPointerCapture && svg.setPointerCapture(e.pointerId); vBtns.forEach((b) => b.setAttribute("aria-pressed", "false")); cancelAnimationFrame(vAnim); }
    // drag left = the aircraft turns as on the other pages (right-handed view)
    az = drag.az - dx * 0.4; el = clamp(drag.el + dy * 0.3, 0, 89);
    if (!dq) dq = requestAnimationFrame(() => { dq = 0; render(); });
  });
  addEventListener("pointerup", () => { if (drag) { drag = null; setTimeout(() => { dragMoved = false; }, 0); } });
  svg.addEventListener("touchmove", (e) => { if (drag && dragMoved) e.preventDefault(); }, { passive: false });

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.target === range) return;
    if (e.key === " " && e.target === document.body) { e.preventDefault(); btn.click(); }
    const i = "123".indexOf(e.key);
    if (i >= 0) setView(["iso", "side", "top"][i]);
    if (e.key === "Escape" && pinned) { pinned = null; highlight(null); }
  });
  const notes = document.querySelector(".tp-notes");
  if (notes) {
    notes.addEventListener("keydown", (e) => { if (e.key === "Escape" && notes.open) { notes.open = false; notes.querySelector("summary").focus(); } });
    document.addEventListener("pointerdown", (e) => { if (notes.open && !notes.contains(e.target)) notes.open = false; });
  }
  narrow.addEventListener("change", () => { parts0 = []; });
  let rz = 0;
  new ResizeObserver(() => { cancelAnimationFrame(rz); rz = requestAnimationFrame(render); }).observe(box);
  reduced.addEventListener("change", () => { if (reduced.matches) { cur = target; place(cur); } });
  if (readEl) readEl.textContent = D.READ;
  render(); syncBtn();
  window.__ex = {
    set: (p) => { cur = target = p; place(cur); syncBtn(); }, go, view: setView, state: () => ({ cur, target, az, el, n: parts.length, order: order.length }),
    show: (gid) => { pinned = gid; highlight(gid); },
    rot: (a, e) => { az = a; el = e; render(); },
    bench: () => { const ts = []; for (let i = 0; i < 30; i++) { const t = performance.now(); place((i % 10) / 10); svg.getBoundingClientRect(); ts.push(performance.now() - t); } ts.sort((a, b) => a - b); const t0 = performance.now(); render(); const tr = performance.now() - t0; return ts[15].toFixed(2) + "/" + ts[27].toFixed(2) + " render " + tr.toFixed(0); },
  };
}
