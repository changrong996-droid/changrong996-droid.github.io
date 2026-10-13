/* F-35B 模型与渲染器（由 model.mjs 生成，供各专题页共用；全局 F35M）。github.com/wheresryan22/anatomy 方法，MIT */
var F35M = (() => {
const M = 10; // world units per metre
const D2R = Math.PI / 180;
const FT = 3.28084;
const KT = 1.943844;
const SPEC = {
length: 15.6, span: 10.7,
fanKN: 89, nozzleKN: 80, postKN: 8.7, stoKN: 181.2, hoverKN: 180.8, maxKN: 182.4,
nozzleMax: 95, nozzleRate: 95 / 2.5, // deg per second
shaftRpm: 8000, // clutch engages at up to ~8,500 rpm (US Navy SBIR N121-023); hover shaft speed is an estimate
wod: 20, // kt of wind over the deck (ship steaming into wind)
rampDeg: 12,
};
const DECK = { x0: -1970, x1: 330, y0: -180, y1: 180, thick: 14, hull: 205 }; // the whole flight deck (ramp end at the bow)
const RAMP = { x0: 0, x1: 330, y0: 22, y1: 180 };
RAMP.R = (RAMP.x1 - RAMP.x0) / Math.sin(SPEC.rampDeg * D2R);
RAMP.h = RAMP.R - Math.sqrt(RAMP.R ** 2 - (RAMP.x1 - RAMP.x0) ** 2);
function rampZ(x) {
if (x <= RAMP.x0) return 0;
const s = Math.min(x, RAMP.x1) - RAMP.x0;
return RAMP.R - Math.sqrt(RAMP.R * RAMP.R - s * s);
}
function groundAt(x, y) {
if (x < DECK.x0 || x > DECK.x1 || y < DECK.y0 || y > DECK.y1) return null; // over the sea
return y >= RAMP.y0 ? rampZ(x) : 0;
}
const SPOT = { x: -180, y: 108, r: 46 };
const LANE_Y = 100;
const visZ = (h) => (h <= 15 * M ? h : 15 * M + (h - 15 * M) * 0.052);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const smoother = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const WHEEL = 21; // origin height above the ground with gear down (wheel bottoms at body z = -2.1 m)
const A = { spool: 2.0, x0: -330, acc: 45 };
A.dist = RAMP.x1 + 6 - A.x0; // main wheels (6 units aft of origin) leave the ramp edge
A.roll = Math.sqrt((2 * A.dist) / A.acc);
A.exit = A.spool + A.roll;
A.vExit = A.acc * A.roll;
A.toe = A.spool + Math.sqrt((2 * (RAMP.x0 - 50 - A.x0)) / A.acc); // nose wheel reaches the ramp toe
A.end = A.exit + 3.0;
const B = { start: A.end, dur: 7.5, x0: -780, x1: 880, h: 500 / FT * M };
B.end = B.start + B.dur;
const C = { start: B.end, decel: 4.0, hold: 1.5, slide: 4.5, x0: -900, y0: 340, h0: 40 / FT * M };
C.tHold = C.start + C.decel;
C.tSlide = C.tHold + C.hold;
C.tDescend = C.tSlide + C.slide;
const DESC = [C.h0];
{
let h = C.h0, v = 0, t = 0;
while (h > 0 && t < 30) {
const target = h > 2.2 * M ? 5.5 / FT * M : 3.0 / FT * M;
v += (target - v) * (1 - Math.exp(-(1 / 120) / 0.7));
h = Math.max(0, h - v / 120);
DESC.push(h);
t += 1 / 120;
}
}
C.descent = (DESC.length - 1) / 120;
C.tTouch = C.tDescend + C.descent;
C.end = C.tTouch + 3.2;
const CYCLE = C.end + 0.6;
const PHASES = [
{ id: "sto", name: "短距起飞", start: 0, end: A.end, key: A.exit - 0.15 },
{ id: "flight", name: "常规飞行", start: B.start, end: B.end, key: B.start + B.dur * 0.66 },
{ id: "vl", name: "垂直降落", start: C.start, end: CYCLE, key: C.tDescend + 2.6 },
];
const TIMES = { A, B, C };
function descentAt(tau) {
const i = tau * 120;
const a = Math.floor(i);
if (a >= DESC.length - 1) return 0;
return lerp(DESC[a], DESC[a + 1], i - a);
}
function stateAt(t) {
t = ((t % CYCLE) + CYCLE) % CYCLE;
const s = {
t, phase: 0, word: "", x: 0, y: LANE_Y, z: WHEEL, pitch: 0, vx: 0, vz: 0, vy: 0,
nozzle: 0, door: 0, aux: 0, fan: 0, gear: 1, posts: 0, power: 0, vane: 0, show: 1, mode: "stovl",
onDeck: true, kt: 0, ft: 0, kN: 0, fanKN: 0, nozKN: 0, postKN: 0,
};
if (t < A.end) {
s.phase = 0;
s.door = smooth(0.0, 1.3, t);
s.aux = smooth(0.2, 1.2, t);
s.fan = smooth(0.7, 1.9, t) * 0.97;
s.power = lerp(0.18, 1, smooth(0.6, 1.9, t));
s.vane = 34 * smooth(0.8, 1.8, t);
if (t < A.spool) {
s.x = A.x0; s.word = "发动机加速 · 舱门打开";
s.nozzle = 10 * smooth(0.8, 1.8, t);
s.posts = smooth(0.8, 1.8, t);
} else if (t < A.exit) {
const tau = t - A.spool;
s.x = A.x0 + 0.5 * A.acc * tau * tau;
s.vx = A.acc * tau;
const xm = s.x - 6, xn = s.x + 50;
s.z = rampZ(xm) + WHEEL;
s.pitch = Math.atan2(rampZ(xn) - rampZ(xm), 56) / D2R;
s.vz = s.vx * Math.tan(s.pitch * D2R);
const dn = Math.max(0, t - A.toe) * SPEC.nozzleRate;
s.nozzle = Math.min(50, 10 + dn);
s.posts = 1;
s.word = s.x + 50 < RAMP.x0 ? "甲板滑跑" : "滑跃甲板";
} else {
const te = t - A.exit;
s.onDeck = false;
s.vx = A.vExit + 30 * te;
const v0 = A.vExit * Math.sin(SPEC.rampDeg * D2R);
s.vz = v0 - 30 * te + 18 * te * te;
s.x = RAMP.x1 + 6 + A.vExit * Math.cos(SPEC.rampDeg * D2R) * te + 15 * te * te;
s.z = RAMP.h + WHEEL + v0 * te - 15 * te * te + 6 * te * te * te;
s.pitch = lerp(SPEC.rampDeg, 9.5, smooth(0, 1.2, te));
s.nozzle = Math.max(28, 50 - Math.max(0, te - 0.4) * 18);
s.gear = 1 - smooth(1.2, 3.0, te);
s.posts = 1;
s.word = "爬升离舰";
}
s.kN = SPEC.stoKN * s.power;
} else if (t < B.end) {
s.phase = 1; s.mode = "conventional"; s.onDeck = false;
const u = (t - B.start) / B.dur;
s.x = lerp(B.x0, B.x1, u);
s.vx = (B.x1 - B.x0) / B.dur;
s.y = -60;
s.z = visZ(B.h);
s.pitch = 2.5;
s.gear = 0; s.door = 0; s.fan = 0; s.nozzle = 0; s.posts = 0;
s.power = 0.42;
s.kN = 62;
s.word = "机翼升力 · 舱门关闭";
} else {
s.phase = 2; s.onDeck = false;
s.door = 1; s.aux = 1; s.fan = 1; s.posts = 1; s.gear = 1; s.power = 1;
let h = C.h0;
if (t < C.tHold) {
const tau = t - C.start;
const v0 = (2 * (SPOT.x - C.x0)) / C.decel;
const a = v0 / C.decel;
s.x = C.x0 + v0 * tau - 0.5 * a * tau * tau;
s.vx = v0 - a * tau;
s.y = C.y0;
s.pitch = lerp(6, 4.5, smooth(0, C.decel, tau));
s.nozzle = lerp(72, 90, smooth(0, C.decel * 0.85, tau));
s.vane = lerp(-18, 0, smooth(0, C.decel, tau));
s.word = "舷侧减速";
} else if (t < C.tDescend) {
s.x = SPOT.x;
s.pitch = 4.5;
s.nozzle = 90;
const u = smoother((t - C.tSlide) / C.slide);
s.y = lerp(C.y0, SPOT.y, u);
const du = t > C.tSlide && t < C.tDescend ? 30 * u * u * (u * (u - 2) + 1) / C.slide : 0;
s.vy = -(C.y0 - SPOT.y) * du;
s.word = t < C.tSlide ? "舷侧悬停" : "横移至降落点";
} else {
s.x = SPOT.x; s.y = SPOT.y; s.pitch = 4.5; s.nozzle = 90;
const tau = t - C.tDescend;
h = descentAt(tau);
s.vz = -(descentAt(Math.max(0, tau - 0.05)) - descentAt(tau + 0.05)) / 0.1;
if (t >= C.tTouch) {
const after = t - C.tTouch;
s.power = lerp(1, 0.16, smooth(0.15, 1.4, after));
s.fan = lerp(1, 0.25, smooth(0.3, 2.4, after));
s.posts = 1 - smooth(0.2, 1.2, after);
s.pitch = lerp(4.5, 0, smooth(0, 0.6, after));
s.word = "着舰 · 收至慢车";
s.onDeck = true;
} else s.word = "垂直下降";
}
s.z = h + WHEEL;
if (t >= C.tDescend && t < C.tTouch) s.z = h + WHEEL;
s.fanKN = SPEC.fanKN * s.fan * s.power;
s.nozKN = SPEC.nozzleKN * s.power;
s.postKN = 2 * SPEC.postKN * s.posts * s.power;
s.kN = s.fanKN + s.nozKN + s.postKN;
}
s.show = Math.min(smooth(0, 0.45, t), 1 - smooth(C.end + 0.05, CYCLE - 0.05, t));
const ground = s.phase === 0 && s.onDeck ? s.z - WHEEL : s.phase === 0 ? s.z - WHEEL : s.phase === 1 ? B.h : s.z - WHEEL;
s.ft = s.phase === 1 ? 500 : Math.max(0, ground / M * FT);
if (s.phase === 0 && s.onDeck) s.ft = Math.max(0, (s.z - WHEEL) / M * FT); // height of the wheels above the flight deck (ramp counts)
const speed = Math.hypot(s.vx, s.vy, s.vz) / M; // m/s relative to the deck
s.kt = s.phase === 1 ? 250 : speed * KT + SPEC.wod;
if (s.phase === 0) { s.fanKN = SPEC.fanKN * s.fan * s.power; s.postKN = 2 * SPEC.postKN * s.posts * s.power; s.nozKN = Math.max(0, s.kN - s.fanKN - s.postKN); }
s.rpm = Math.round(SPEC.shaftRpm * s.fan);
const cs = surfacesAt(t);
s.stab = cs.stab; s.rud = cs.rud;
gearDetail(s);
return s;
}
const bumpW = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));
const OLEO = 0.14; // stroke, m
function gearDetail(s) {
const t = s.t;
s.oleoM = 1; s.oleoN = 1; s.steer = 0;
if (s.phase === 0) {
const tn = A.spool + Math.sqrt((2 * (RAMP.x1 - 50 - A.x0)) / A.acc); // nose wheel passes the ramp edge
s.oleoN = smooth(tn, tn + 0.25, t);
s.oleoM = smooth(A.exit, A.exit + 0.3, t);
if (t > A.spool && t < A.toe) {
const tau = t - A.spool;
const env = smooth(0.3, 1.0, tau) * (1 - smooth(A.toe - A.spool - 1.1, A.toe - A.spool - 0.3, tau));
s.steer = env * (2.6 * Math.sin(tau * 2.83 + 0.6) + 1.2 * Math.sin(tau * 8.2 + 1.7));
}
} else if (s.phase === 2) {
const h = Math.max(0, s.z - WHEEL), k = OLEO * M;
s.oleoM = Math.min(1, h / k);
s.oleoN = Math.min(1, (h + Math.sin(s.pitch * D2R) * 56) / k);
}
}
function surfacesAt(t) {
t = ((t % CYCLE) + CYCLE) % CYCLE;
let stab = 0, rud = 0;
if (t < A.end) {
stab = 3 * smooth(A.toe - 1.0, A.toe + 0.3, t) + 9 * bumpW(A.exit - 0.45, A.exit, A.exit + 0.3, A.exit + 1.6, t);
stab = lerp(stab, 2, smooth(A.exit + 1.0, A.end, t));
rud = 1.5 * Math.sin((t - A.exit) * 2.1) * bumpW(A.exit + 0.2, A.exit + 1.0, A.end - 1.0, A.end, t);
} else if (t < B.end) {
const env = bumpW(B.start, B.start + 1, B.end - 1, B.end, t);
stab = 2 + 0.5 * Math.sin((t - B.start) * 2.7) * env;
rud = 0.8 * Math.sin((t - B.start) * 1.9 + 0.5) * env;
} else {
const tau = t - C.start;
const env = bumpW(C.start + 0.8, C.start + 2.5, C.tTouch - 0.3, C.tTouch + 0.5, t);
stab = lerp(2, 1, smooth(C.start, C.tHold, t)) + 1.4 * (Math.sin(tau * 1.7) + 0.6 * Math.sin(tau * 3.1 + 1)) * env;
stab = lerp(stab, 0, smooth(C.tTouch, C.tTouch + 1.5, t));
rud = 4 * (Math.sin(tau * 1.3) + 0.5 * Math.sin(tau * 2.9 + 0.7)) * env;
}
return { stab, rud };
}
const V3 = {
add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
len: (a) => Math.hypot(a[0], a[1], a[2]),
unit: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};
function newell(pts) {
let nx = 0, ny = 0, nz = 0;
for (let i = 0; i < pts.length; i++) {
const a = pts[i], b = pts[(i + 1) % pts.length];
nx += (a[1] - b[1]) * (a[2] + b[2]);
ny += (a[2] - b[2]) * (a[0] + b[0]);
nz += (a[0] - b[0]) * (a[1] + b[1]);
}
return [nx, ny, nz];
}
function newellIdx(face, v) {
let nx = 0, ny = 0, nz = 0;
const n = face.length;
for (let i = 0; i < n; i++) {
const a = v[face[i]], b = v[face[(i + 1) % n]];
nx += (a[1] - b[1]) * (a[2] + b[2]);
ny += (a[2] - b[2]) * (a[0] + b[0]);
nz += (a[0] - b[0]) * (a[1] + b[1]);
}
return [nx, ny, nz];
}
const centroid = (pts) => V3.mul(pts.reduce((s, p) => V3.add(s, p), [0, 0, 0]), 1 / pts.length);
function orient(mesh, insideOf) {
mesh.f = mesh.f.map((face) => {
const pts = face.map((i) => mesh.v[i]);
const n = newell(pts);
const c = centroid(pts);
return V3.dot(n, V3.sub(c, insideOf(c, face))) < 0 ? face.slice().reverse() : face;
});
return mesh;
}
function plate(poly, normal, thick) {
const n = V3.unit(normal);
if (V3.dot(newell(poly), n) < 0) poly = poly.slice().reverse();
const top = poly.map((p) => V3.add(p, V3.mul(n, thick / 2)));
const bot = poly.map((p) => V3.sub(p, V3.mul(n, thick / 2)));
const v = [...top, ...bot];
const k = poly.length;
const f = [Array.from({ length: k }, (_, i) => i), Array.from({ length: k }, (_, i) => 2 * k - 1 - i)];
for (let i = 0; i < k; i++) { const j = (i + 1) % k; f.push([i, k + i, k + j, j]); }
return { v, f };
}
function tube(rings, sides = 16, { capStart = false, capEnd = false } = {}) {
const v = [], f = [];
let prevU = null;
for (const ring of rings) {
const a = V3.unit(ring.axis);
let u = prevU ? V3.unit(V3.sub(prevU, V3.mul(a, V3.dot(prevU, a)))) : V3.unit(V3.cross(a, Math.abs(a[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]));
prevU = u;
const w = V3.cross(a, u);
for (let i = 0; i < sides; i++) {
const ang = (i / sides) * Math.PI * 2;
v.push(V3.add(ring.c, V3.add(V3.mul(u, Math.cos(ang) * ring.r), V3.mul(w, Math.sin(ang) * ring.r))));
}
}
for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < sides; i++) {
const j = (i + 1) % sides, a = r * sides, b = (r + 1) * sides;
f.push([a + i, b + i, b + j, a + j]);
}
const caps = [];
if (capStart) { f.push(Array.from({ length: sides }, (_, i) => i)); caps.push(f.length - 1); }
if (capEnd) { const b = (rings.length - 1) * sides; f.push(Array.from({ length: sides }, (_, i) => b + i)); caps.push(f.length - 1); }
const mesh = orient({ v, f }, (c, face) => {
let best = rings[0].c, dist = Infinity;
for (const ring of rings) { const d = V3.len(V3.sub(ring.c, c)); if (d < dist) { dist = d; best = ring.c; } }
if (face.length === sides) { // cap: inside is toward the neighbouring ring
const idx = face[0] < sides ? 1 : rings.length - 2;
return rings[idx].c;
}
return best;
});
mesh.caps = caps;
return mesh;
}
function wheel(c, r, width, sides = 14) {
return tube([{ c: V3.add(c, [0, -width / 2, 0]), axis: [0, 1, 0], r }, { c: V3.add(c, [0, width / 2, 0]), axis: [0, 1, 0], r }], sides, { capStart: true, capEnd: true });
}
function box(a, b, r) { // a square strut from a to b, half-width r
const ax = V3.unit(V3.sub(b, a));
const u = V3.unit(V3.cross(ax, Math.abs(ax[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]));
const w = V3.cross(ax, u);
const sq = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([p, q]) => V3.add(V3.mul(u, p * r), V3.mul(w, q * r)));
const v = [...sq.map((o) => V3.add(a, o)), ...sq.map((o) => V3.add(b, o))];
const f = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
const c = V3.mul(V3.add(a, b), 0.5);
return orient({ v, f }, () => c);
}
function rot(p, o, a, ang) {
const q = V3.sub(p, o);
const c = Math.cos(ang), s = Math.sin(ang);
const r = V3.add(V3.add(V3.mul(q, c), V3.mul(V3.cross(a, q), s)), V3.mul(a, V3.dot(a, q) * (1 - c)));
return V3.add(r, o);
}
const rotMesh = (mesh, o, a, ang) => ({ ...mesh, v: mesh.v.map((p) => rot(p, o, a, ang)) });
const FUS_KEYS = [
[7.62, 0.13, -0.07, 0.04, -0.15, 2.0, 1.0, 2.0, 1.0],
[7.0, 0.32, -0.07, 0.24, -0.31, 2.0, 1.0, 2.2, 1.0],
[6.2, 0.5, -0.06, 0.45, -0.45, 2.0, 1.0, 2.6, 1.0],
[5.4, 0.64, -0.04, 0.6, -0.56, 2.2, 1.0, 3.0, 1.0],
[4.6, 0.76, -0.01, 0.69, -0.64, 2.4, 1.0, 3.5, 1.0],
[3.9, 0.88, 0.03, 0.77, -0.7, 2.6, 1.0, 4.0, 1.0],
[3.0, 1.25, 0.1, 0.95, -0.78, 3.2, 1.0, 5.0, 1.0],
[2.2, 1.63, 0.14, 0.985, -0.81, 4.0, 1.0, 6.0, 1.0],
[1.2, 1.79, 0.15, 0.99, -0.82, 4.5, 1.0, 6.0, 1.0],
[0.0, 1.82, 0.15, 0.97, -0.82, 4.5, 1.0, 6.0, 1.0],
[-1.2, 1.79, 0.15, 0.92, -0.8, 4.0, 1.0, 6.0, 1.0],
[-2.4, 1.7, 0.15, 0.85, -0.76, 3.6, 1.0, 5.5, 1.0],
[-3.6, 1.5, 0.14, 0.77, -0.7, 3.4, 1.05, 5.0, 1.05],
[-4.6, 1.36, 0.13, 0.72, -0.64, 3.4, 1.1, 4.5, 1.1],
[-5.5, 1.31, 0.12, 0.69, -0.6, 3.2, 1.15, 4.0, 1.15],
[-6.0, 1.29, 0.11, 0.68, -0.6, 3.0, 1.2, 3.6, 1.2],
[-6.42, 1.28, 0.1, 0.68, -0.6, 3.0, 1.2, 3.4, 1.2],
];
const NOSE_TIP = [8.0, 0, -0.07];
function pchip(keys, col) {
const xs = keys.map((k) => k[0]), ys = keys.map((k) => k[col]);
const n = xs.length, d = [], m = [];
for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
for (let i = 0; i < n; i++) {
if (i === 0) m.push(d[0]); else if (i === n - 1) m.push(d[n - 2]);
else m.push(d[i - 1] * d[i] <= 0 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]));
}
return (x) => {
let i = 0;
while (i < n - 2 && !((x <= xs[i] && x >= xs[i + 1]) || (x >= xs[i] && x <= xs[i + 1]))) i++;
const h = xs[i + 1] - xs[i], t = Math.min(1, Math.max(0, (x - xs[i]) / h));
const t2 = t * t, t3 = t2 * t;
return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
};
}
const FUS_F = [1, 2, 3, 4, 5, 6, 7, 8].map((c) => pchip(FUS_KEYS, c));
function sectionAt(x) {
const [w, zc, zt, zb, au, bu, al, bl] = FUS_F.map((f) => f(x));
return { x, w, zc, zt, zb, au, bu, al, bl };
}
const upperZ = (st, y) => st.zc + (st.zt - st.zc) * Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(y) / st.w), st.au)), 1 / st.bu);
const lowerZ = (st, y) => st.zc - (st.zc - st.zb) * Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(y) / st.w), st.al)), 1 / st.bl);
function fusY(x, z) {
const st = sectionAt(x);
if (z >= st.zc) { const q = Math.min(1, (z - st.zc) / (st.zt - st.zc)); return st.w * Math.pow(Math.max(0, 1 - Math.pow(q, st.bu)), 1 / st.au); }
const q = Math.min(1, (st.zc - z) / (st.zc - st.zb)); return st.w * Math.pow(Math.max(0, 1 - Math.pow(q, st.bl)), 1 / st.al);
}
function topAt(x) { return sectionAt(Math.min(7.6, Math.max(-6.42, x))).zt; }
function skinZ(x, y, upper = true) { const st = sectionAt(x); return upper ? upperZ(st, y) : lowerZ(st, y); }
const NU = 10, NL = 7;
const CHINE = [NL, NL + 2 * NU];
function fusRing(st) {
const port = [];
for (let k = 0; k <= NL; k++) { const y = st.w * Math.sin((k / NL) * Math.PI / 2); port.push([y, lowerZ(st, y)]); }
for (let k = 1; k <= NU; k++) { const y = st.w * Math.cos((k / NU) * Math.PI / 2); port.push([k === NU ? 0 : y, upperZ(st, y)]); }
const stbd = port.slice(1, -1).reverse().map(([y, z]) => [-y, z]);
return [...port, ...stbd].map(([y, z]) => [st.x, y, z]);
}
function loftRings(rings, centres, { tip = null, closed = true, capEnd = false, capStart = false } = {}) {
const v = [], f = [], n = rings[0].length;
const base = rings.map((r) => { const b = v.length; v.push(...r); return b; });
const fc = []; // inside point per face
let ti = -1;
if (tip) {
ti = v.length; v.push(tip);
for (let j = 0; j < (closed ? n : n - 1); j++) { f.push([ti, base[0] + j, base[0] + ((j + 1) % n)]); fc.push(centres[0]); }
}
for (let r = 0; r < rings.length - 1; r++) for (let j = 0; j < (closed ? n : n - 1); j++) {
const j1 = (j + 1) % n;
f.push([base[r] + j, base[r + 1] + j, base[r + 1] + j1, base[r] + j1]);
fc.push(V3.mul(V3.add(centres[r], centres[r + 1]), 0.5));
}
const caps = [];
if (capEnd) { const L = rings.length - 1; f.push(Array.from({ length: n }, (_, j) => base[L] + j)); fc.push(centres[Math.max(0, L - 1)]); caps.push(f.length - 1); }
if (capStart) { f.push(Array.from({ length: n }, (_, j) => base[0] + j)); fc.push(centres[1]); caps.push(f.length - 1); }
f.forEach((face, i) => {
const pts = face.map((k) => v[k]);
if (V3.dot(newell(pts), V3.sub(centroid(pts), fc[i])) < 0) f[i] = face.slice().reverse();
});
return { v, f, base, n, capsFaces: caps };
}
const alongX = (L, j, r0, r1) => { const out = []; const s = r0 < r1 ? 1 : -1; for (let r = r0; r !== r1 + s; r += s) out.push(L.base[r] + j); return out; };
const aroundRing = (L, r, j0, j1) => { const out = []; const s = j0 < j1 ? 1 : -1; for (let j = j0; j !== j1 + s; j += s) out.push(L.base[r] + ((j + L.n) % L.n)); return out; };
function fuselageMesh() {
const xs = new Set([7.62, 7.45, 7.25, 7.0, 6.75, 6.5, 6.3, 6.05, 5.7, 5.4, 5.05, 4.7, 4.35, 4.0, 3.7, 3.4, 3.1, 2.8, 2.5, 2.2, 1.9, 1.5, 1.1, 0.6, 0.1, -0.4, -0.9, -1.4, -1.9, -2.4, -2.9, -3.4, -3.9, -4.4, -4.85, -5.3, -5.7, -6.05, -6.42]);
const X = [...xs].sort((a, b) => b - a);
const secs = X.map(sectionAt);
const L = loftRings(secs.map(fusRing), secs.map((s) => [s.x, 0, (s.zt + s.zb) / 2]), { tip: NOSE_TIP, capEnd: true });
const mesh = { v: L.v, f: L.f, caps: [] };
mesh.crease = new Set();
for (let r = 0; r < X.length - 1; r++) for (const j of CHINE) { const a = L.base[r] + j, b = L.base[r + 1] + j; mesh.crease.add(a < b ? a + "," + b : b + "," + a); }
const ri = (x) => X.indexOf(x);
const loops = [];
loops.push(aroundRing(L, ri(6.3), CHINE[0], CHINE[1]));
const bayA = ri(0.6), bayB = ri(-2.9);
for (const [j0, j1] of [[1, 2], [2, 3], [L.n - 2, L.n - 1], [L.n - 3, L.n - 2]]) {
loops.push([...alongX(L, j0, bayA, bayB), ...aroundRing(L, bayB, j0, j1).slice(1), ...alongX(L, j1, bayB, bayA).slice(1), ...aroundRing(L, bayA, j1, j0).slice(1)]);
}
const ngA = ri(5.7), ngB = ri(4.35);
loops.push([...alongX(L, 1, ngA, ngB), ...aroundRing(L, ngB, 1, -1).slice(1), ...alongX(L, L.n - 1, ngB, ngA).slice(1), ...aroundRing(L, ngA, -1, 1).slice(1)]);
const spA = ri(-2.9), spB = ri(-4.4);
loops.push([...alongX(L, NL + NU - 2, spA, spB), ...aroundRing(L, spB, NL + NU - 2, NL + NU + 2).slice(1), ...alongX(L, NL + NU + 2, spB, spA).slice(1), ...aroundRing(L, spA, NL + NU + 2, NL + NU - 2).slice(1)]);
mesh.loops = loops;
return mesh;
}
function canopyMesh() {
const keys = [[6.0, 0.03, 0.5], [5.75, 0.24, 0.8], [5.35, 0.38, 1.0], [4.95, 0.46, 1.13], [4.55, 0.5, 1.22], [4.1, 0.51, 1.26], [3.65, 0.49, 1.25], [3.3, 0.45, 1.19], [3.02, 0.4, 1.1]];
const N = 16;
const rings = [], centres = [];
for (const [x, w, zt] of keys) {
const zb = skinZ(x, w) - (x > 5.9 ? 0.0 : 0.012);
const ring = [];
for (let i = 0; i <= N; i++) {
const ph = (i / N) * Math.PI, c = Math.cos(ph), s = Math.sin(ph);
ring.push([x, w * Math.sign(c) * Math.pow(Math.abs(c), 0.85), zb + (zt - zb) * Math.pow(s, 0.8)]);
}
rings.push(ring); centres.push([x, 0, zb]);
}
const L = loftRings(rings, centres, { closed: false });
const mesh = { v: L.v, f: L.f, loops: [aroundRing(L, 4, 0, N)] }; // frame bow at x 4.55
const at = (x, ph, dz = 0.006) => {
const k = keys.findIndex((q) => q[0] <= x);
const a = keys[Math.max(0, k - 1)], b = keys[k];
const t = (a[0] - x) / (a[0] - b[0] || 1);
const w = lerp(a[1], b[1], t), zt = lerp(a[2], b[2], t), zb = skinZ(x, w) - 0.012;
const c = Math.cos(ph), s = Math.sin(ph);
return [x, (w + dz) * Math.sign(c) * Math.pow(Math.abs(c), 0.85), zb + (zt - zb + dz) * Math.pow(s, 0.8)];
};
const glint = [];
for (const [x0, x1, p0, p1] of [[5.3, 3.75, 0.3, 0.37], [5.45, 4.95, 0.42, 0.46]]) {
const pts = [];
for (let i = 0; i <= 6; i++) pts.push(at(lerp(x0, x1, i / 6), lerp(p0, p0 + 0.02, Math.sin((i / 6) * Math.PI)) * Math.PI));
for (let i = 6; i >= 0; i--) pts.push(at(lerp(x0, x1, i / 6), lerp(p1, p1 - 0.02, Math.sin((i / 6) * Math.PI)) * Math.PI));
glint.push({ pts, n: [0, Math.cos(((p0 + p1) / 2) * Math.PI), Math.sin(((p0 + p1) / 2) * Math.PI)] });
}
mesh.glint = glint;
return mesh;
}
function canopyAftMesh() {
const x = 3.02, w = 0.4, zt = 1.1, N = 16;
const zb = skinZ(x, w) - 0.012;
const v = [];
for (let i = 0; i <= N; i++) { const ph = (i / N) * Math.PI, c = Math.cos(ph), s = Math.sin(ph); v.push([x - 0.004, w * Math.sign(c) * Math.pow(Math.abs(c), 0.85), zb + (zt - zb) * Math.pow(s, 0.8)]); }
let face = v.map((_, i) => i);
if (V3.dot(newell(v), [-1, 0, 0]) < 0) face = face.reverse();
return { v, f: [face] };
}
function fairingMesh() {
const keys = [[3.05, 0.42, 1.11], [2.75, 0.38, 1.04], [2.45, 0.3, 1.0], [2.15, 0.2, 0.99]];
const N = 12, rings = [], centres = [];
for (const [x, w, zt] of keys) {
const zb = skinZ(x, w) - 0.02;
const ring = [];
for (let i = 0; i <= N; i++) { const ph = (i / N) * Math.PI, c = Math.cos(ph), s = Math.sin(ph); ring.push([x, w * Math.sign(c) * Math.pow(Math.abs(c), 0.85), zb + (zt - zb) * Math.pow(s, 0.8)]); }
rings.push(ring); centres.push([x, 0, zb]);
}
const L = loftRings(rings, centres, { closed: false, capEnd: true });
return { v: L.v, f: L.f, hideBoundary: true };
}
function intakeMesh(side) {
const ringAt = (x, pts) => pts.map(([y, z, dx = 0]) => [x + dx, side * y, z]);
const mouth = ringAt(0, [[fusY(3.96, 0.21) - 0.01, 0.21, 3.96], [1.5, 0.14, 3.6], [1.46, -0.13, 3.42], [1.36, -0.42, 3.27], [fusY(3.4, -0.5) - 0.01, -0.5, 3.4]]);
const r1 = ringAt(3.05, [[fusY(3.05, 0.2) - 0.01, 0.2], [1.6, 0.15], [1.56, -0.13], [1.45, -0.45], [fusY(3.05, -0.55) - 0.01, -0.55]]);
const r2 = ringAt(2.6, [[fusY(2.6, 0.17) - 0.01, 0.17], [1.63, 0.15], [1.59, -0.14], [1.46, -0.47], [fusY(2.6, -0.6) - 0.01, -0.6]]);
const s22 = sectionAt(2.2);
const r3 = ringAt(2.2, [[fusY(2.2, 0.11) - 0.004, 0.11], [s22.w - 0.004, s22.zc], [fusY(2.2, -0.12) - 0.004, -0.12], [fusY(2.2, -0.42) - 0.004, -0.42], [fusY(2.2, -0.5) - 0.004, -0.5]]);
const rings = [mouth, r1, r2, r3];
const centres = [[3.6, side * 1.05, -0.2], [3.05, side * 1.2, -0.2], [2.6, side * 1.3, -0.2], [2.2, side * 1.35, -0.2]];
const L = loftRings(rings, centres, { closed: false });
const mesh = { v: L.v, f: L.f, caps: [] };
mesh.f.push(Array.from({ length: 5 }, (_, i) => i));
const mf = mesh.f.length - 1;
if (V3.dot(newell(mesh.f[mf].map((i) => mesh.v[i])), [1, 0, 0]) < 0) mesh.f[mf] = mesh.f[mf].slice().reverse();
mesh.caps.push(mf);
mesh.crease = new Set();
for (let r = 0; r < 3; r++) { const a = L.base[r] + 1, b = L.base[r + 1] + 1; mesh.crease.add(a < b ? a + "," + b : b + "," + a); }
mesh.softEdges = new Set();
for (let r = 0; r < 3; r++) for (const j of [0, 4]) { const a = L.base[r] + j, b = L.base[r + 1] + j; mesh.softEdges.add(a < b ? a + "," + b : b + "," + a); }
return mesh;
}
function bumpMesh(side) {
const v = [], f = [];
const NA = 10, NB = 8;
const cx = 3.95, cz = -0.2, ax = 0.62, bz = 0.3, hgt = 0.15;
for (let i = 0; i <= NA; i++) for (let j = 0; j <= NB; j++) {
const a = -1 + (2 * i) / NA, b = -1 + (2 * j) / NB;
const r = Math.max(0, 1 - a * a - b * b);
const x = cx + a * ax * (a < 0 ? 0.75 : 1), z = cz + b * bz;
v.push([x, side * (fusY(x, z) - 0.006 + hgt * Math.pow(r, 0.7)), z]);
}
const id = (i, j) => i * (NB + 1) + j;
for (let i = 0; i < NA; i++) for (let j = 0; j < NB; j++) {
const face = [id(i, j), id(i + 1, j), id(i + 1, j + 1), id(i, j + 1)];
const pts = face.map((k) => v[k]);
f.push(V3.dot(newell(pts), [0, side, 0]) < 0 ? face.slice().reverse() : face);
}
return { v, f, hideBoundary: true, smooth: true };
}
function foilMesh({ rootLE, rootTE, tipLE, tipTE, up, thick: [tr, tt], us, vs, camber = 0.62, rootFix = null }) {
const n = V3.unit(up);
const nu = us.length;
const tdist = (u) => (u <= 0 || u >= 1 ? 0 : (Math.sqrt(u) * (1 - u)) / 0.385);
const rings = [], centres = [];
for (const vv of vs) {
const le = V3.add(V3.mul(rootLE, 1 - vv), V3.mul(tipLE, vv)), te = V3.add(V3.mul(rootTE, 1 - vv), V3.mul(tipTE, vv));
const th = lerp(tr, tt, vv);
const mid = (u) => V3.add(V3.mul(le, 1 - u), V3.mul(te, u));
const ring = [];
for (let i = 0; i < nu; i++) ring.push(V3.add(mid(us[i]), V3.mul(n, tdist(us[i]) * th * camber)));
for (let i = nu - 2; i >= 1; i--) ring.push(V3.sub(mid(us[i]), V3.mul(n, tdist(us[i]) * th * (1 - camber))));
rings.push(vv === 0 && rootFix ? ring.map(rootFix) : ring); centres.push(mid(0.4));
}
const L = loftRings(rings, centres, { capEnd: true });
const R = rings[0].length;
L.f.forEach((face, fi) => {
if (face.length === R) return;
const pts = face.map((k) => L.v[k]);
const idx = face.map((k) => (k - L.base[0]) % R);
const top = idx.every((i) => i <= nu - 1);
const want = top ? n : V3.mul(n, -1);
if (V3.dot(newell(pts), want) < 0) L.f[fi] = face.slice().reverse();
});
const topLine = (iu, v0 = 0, v1 = vs.length - 1) => alongX(L, iu, v0, v1);
const botLine = (iu, v0 = 0, v1 = vs.length - 1) => alongX(L, R - iu, v0, v1);
return { v: L.v, f: L.f, L, R, nu, topLine, botLine, rootBoundary: true };
}
const WING = { rootLE: [2.05, 1.66], rootTE: [-3.11, 1.6], tipLE: [-0.56, 5.35], tipTE: [-2.2, 5.35], z0: 0.15, z1: 0.11, thick: [0.24, 0.07] };
const BOOM = { y: 1.08 };
const WING_US = [0, 0.025, 0.08, 0.16, 0.3, 0.45, 0.6, 0.72, 0.8, 0.9, 1];
const WING_VS = [0, 0.15, 0.35, 0.55, 0.75, 0.9, 1];
const POST = { x: -1.75, y: 2.4, r: 0.15, door: [-1.4, -2.1, 2.15, 2.65], hingeY: 2.65 };
function postDoor(side, z) {
const [x0, x1, y0, y1] = POST.door;
return plate([[x0, side * y0, z], [x0, side * y1, z], [x1, side * y1, z], [x1, side * y0, z]], [0, 0, 1], 0.03);
}
function postNozzle(side, z) { // from the lower skin down to the jet's origin, where the shader starts it
return tube([{ c: [POST.x, side * POST.y, z + 0.01], axis: [0, 0, -1], r: POST.r }, { c: [POST.x, side * POST.y, -0.05], axis: [0, 0, -1], r: POST.r * 0.87 }], 16, { capEnd: true });
}
function wingBottomZ(x, y) {
const v = (Math.abs(y) - WING.rootLE[1]) / (WING.tipLE[1] - WING.rootLE[1]);
const le = lerp(WING.rootLE[0], WING.tipLE[0], v), te = lerp(WING.rootTE[0], WING.tipTE[0], v);
const u = (le - x) / (le - te);
const th = lerp(WING.thick[0], WING.thick[1], v);
return lerp(WING.z0, WING.z1, v) - ((Math.sqrt(u) * (1 - u)) / 0.385) * th * 0.38;
}
function boomMesh(side) {
const keys = [[-7.42, 0.09, 0.1, 0.16, 0.03], [-7.1, 0.15, 0.1, 0.24, -0.06], [-6.75, 0.19, 0.1, 0.31, -0.16], [-6.4, 0.2, 0.1, 0.37, -0.25]];
const NUb = 5, NLb = 4;
const rings = [], centres = [];
for (const [x, w, zc, zt, zb] of keys) {
const st = { x, w, zc, zt, zb, au: 3, bu: 1, al: 3, bl: 1 };
const pts = [];
for (let k = 0; k <= NLb; k++) { const y = w * Math.sin((k / NLb) * Math.PI / 2); pts.push([y, lowerZ(st, y)]); }
for (let k = 1; k <= NUb; k++) { const y = w * Math.cos((k / NUb) * Math.PI / 2); pts.push([k === NUb ? 0 : y, upperZ(st, y)]); }
const other = pts.slice(1, -1).reverse().map(([y, z]) => [-y, z]);
rings.push([...pts, ...other].map(([y, z]) => [x, side * BOOM.y + y, z]));
centres.push([x, side * BOOM.y, (zt + zb) / 2]);
}
const L = loftRings(rings, centres, { tip: [-7.66, side * BOOM.y, 0.1] });
const mesh = { v: L.v, f: L.f, smooth: true, hideBoundary: true };
mesh.crease = new Set();
const n = rings[0].length;
for (let r = 0; r < rings.length - 1; r++) for (const j of [NLb, NLb + 2 * NUb]) { const a = L.base[r] + j, b = L.base[r + 1] + j; mesh.crease.add(a < b ? a + "," + b : b + "," + a); }
void n;
return mesh;
}
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const tdist = (u) => (u <= 0 || u >= 1 ? 0 : (Math.sqrt(u) * (1 - u)) / 0.385);
const ekey = (a, b) => (a < b ? a + "," + b : b + "," + a);
function foilRange({ rootLE, rootTE, tipLE, tipTE, up, thick: [tr, tt], us, vs, capRoot = false, camber = 0.5 }) {
const n = V3.unit(up);
const nu = us.length;
const z0 = tdist(us[0]) === 0, z1 = tdist(us[nu - 1]) === 0;
const tag = [];
const rings = [], centres = [];
vs.forEach((vv, r) => {
const le = lerp3(rootLE, tipLE, vv), te = lerp3(rootTE, tipTE, vv);
const th = lerp(tr, tt, vv);
const mid = (u) => lerp3(le, te, u);
const ring = [];
for (let i = 0; i < nu; i++) { ring.push(V3.add(mid(us[i]), V3.mul(n, tdist(us[i]) * th * camber))); if (!r) tag.push((i === 0 && z0) || (i === nu - 1 && z1) ? "E" : "T"); }
for (let i = nu - 1; i >= 0; i--) {
if ((i === nu - 1 && z1) || (i === 0 && z0)) continue;
ring.push(V3.sub(mid(us[i]), V3.mul(n, tdist(us[i]) * th * (1 - camber)))); if (!r) tag.push("B");
}
rings.push(ring); centres.push(mid((us[0] + us[nu - 1]) / 2));
});
const L = loftRings(rings, centres, { capEnd: true, capStart: capRoot });
const R = rings[0].length;
const chord = V3.unit(V3.sub(lerp3(rootTE, tipTE, 0.5), lerp3(rootLE, tipLE, 0.5)));
const strips = (vs.length - 1) * R;
L.f.forEach((face, fi) => {
if (fi >= strips) return; // tip / root caps: loftRings already wound them
const j = fi % R, j1 = (j + 1) % R;
const a = tag[j], b = tag[j1];
let want;
if ((a === "T" || a === "E") && (b === "T" || b === "E") && !(a === "E" && b === "E")) want = n;
if ((a === "B" || a === "E") && (b === "B" || b === "E") && !(a === "E" && b === "E")) want = V3.mul(n, -1);
if ((a === "T" && b === "B") || (a === "B" && b === "T")) want = j === nu - 1 ? chord : V3.mul(chord, -1);
if (a === "T" && b === "T") want = n;
if (a === "B" && b === "B") want = V3.mul(n, -1);
const pts = face.map((k) => L.v[k]);
if (want && V3.dot(newell(pts), want) < 0) L.f[fi] = face.slice().reverse();
});
const bIdx = (k) => nu + (nu - 1 - k) - (z1 ? 1 : 0);
const topFace = (r, i) => r * R + i;
const botFace = (r, i) => r * R + (i + 1 === nu - 1 && z1 ? nu - 1 : bIdx(i + 1));
const topLine = (iu, v0 = 0, v1 = vs.length - 1) => alongX(L, iu, v0, v1);
const botLine = (iu, v0 = 0, v1 = vs.length - 1) => alongX(L, iu === 0 && z0 ? 0 : bIdx(iu), v0, v1);
return { v: L.v, f: L.f, L, R, nu, topFace, botFace, topLine, botLine, rings: vs.length };
}
function ramBands(m, le, te) {
const out = new Set();
for (let r = 0; r < m.rings - 1; r++) {
for (let i = 0; i < le; i++) { out.add(m.topFace(r, i)); out.add(m.botFace(r, i)); }
for (let i = m.nu - 1 - te; i < m.nu - 1; i++) { out.add(m.topFace(r, i)); out.add(m.botFace(r, i)); }
}
return out;
}
function shellMesh(surf, us, vs, thick, outward) {
const NU = us.length, NV = vs.length;
const v = [], f = [], want = [];
const nrmAt = (u, w) => {
const e = 1e-3;
const du = V3.sub(surf(Math.min(1, u + e), w), surf(Math.max(0, u - e), w));
const dv = V3.sub(surf(u, Math.min(1, w + e)), surf(u, Math.max(0, w - e)));
let n = V3.unit(V3.cross(du, dv));
if (V3.dot(n, outward) < 0) n = V3.mul(n, -1);
return n;
};
const T = (i, j) => i * NV + j, B = (i, j) => NU * NV + i * NV + j;
for (const u of us) for (const w of vs) v.push(surf(u, w));
for (const u of us) for (const w of vs) v.push(V3.sub(surf(u, w), V3.mul(nrmAt(u, w), thick)));
const inner = new Set(), edge = new Set();
for (let i = 0; i < NU - 1; i++) for (let j = 0; j < NV - 1; j++) {
const n = nrmAt((us[i] + us[i + 1]) / 2, (vs[j] + vs[j + 1]) / 2);
f.push([T(i, j), T(i + 1, j), T(i + 1, j + 1), T(i, j + 1)]); want.push(n);
if (i === 0 || j === 0 || i === NU - 2 || j === NV - 2) edge.add(f.length - 1);
f.push([B(i, j), B(i, j + 1), B(i + 1, j + 1), B(i + 1, j)]); want.push(V3.mul(n, -1)); inner.add(f.length - 1);
}
const mid = surf(0.5, 0.5);
const wall = (a, b) => { f.push([a[0], a[1], b[1], b[0]]); const c = centroid([v[a[0]], v[a[1]]]); want.push(V3.sub(c, mid)); };
for (let j = 0; j < NV - 1; j++) { wall([T(0, j), T(0, j + 1)], [B(0, j), B(0, j + 1)]); wall([T(NU - 1, j), T(NU - 1, j + 1)], [B(NU - 1, j), B(NU - 1, j + 1)]); }
for (let i = 0; i < NU - 1; i++) { wall([T(i, 0), T(i + 1, 0)], [B(i, 0), B(i + 1, 0)]); wall([T(i, NV - 1), T(i + 1, NV - 1)], [B(i, NV - 1), B(i + 1, NV - 1)]); }
f.forEach((face, fi) => { if (V3.dot(newell(face.map((k) => v[k])), want[fi]) < 0) f[fi] = face.slice().reverse(); });
return { v, f, inner, ram: edge, nrmAt, T, NU, NV };
}
function torus(c, axis, R0, rr, hw, nT = 24, nP = 10) {
const a = V3.unit(axis);
const e1 = V3.unit(V3.cross(a, Math.abs(a[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1])), e2 = V3.cross(a, e1);
const v = [], f = [];
for (let i = 0; i < nT; i++) {
const t = (i / nT) * Math.PI * 2, r = V3.add(V3.mul(e1, Math.cos(t)), V3.mul(e2, Math.sin(t)));
for (let j = 0; j < nP; j++) { const p = (j / nP) * Math.PI * 2; v.push(V3.add(c, V3.add(V3.mul(r, R0 + rr * Math.cos(p)), V3.mul(a, hw * Math.sin(p))))); }
}
for (let i = 0; i < nT; i++) for (let j = 0; j < nP; j++) {
const i1 = (i + 1) % nT, j1 = (j + 1) % nP;
f.push([i * nP + j, i1 * nP + j, i1 * nP + j1, i * nP + j1]);
}
const hull = new Set();
for (let i = 0; i < nT; i++) for (let j = 0; j < nP; j++) if (Math.cos(((j + 0.5) / nP) * Math.PI * 2) > 0) hull.add(i * nP + j);
return Object.assign(orient({ v, f }, (q) => { const d = V3.sub(q, c); const pl = V3.sub(d, V3.mul(a, V3.dot(d, a))); return V3.add(c, V3.mul(V3.unit(pl), R0)); }), { hull });
}
function latheAlong(a, b, profile, sides = 12, caps = true) {
const ax = V3.unit(V3.sub(b, a));
return tube(profile.map(([s, r]) => ({ c: V3.add(a, V3.mul(ax, s)), axis: ax, r })), sides, { capStart: caps, capEnd: caps });
}
const rod = (a, b, r, sides = 10) => latheAlong(a, b, [[0, r], [V3.len(V3.sub(b, a)), r]], sides);
const FIN = { rootLE: -3.75, rootTE: -6.3, tipLE: -5.47, tipTE: -6.48, h: 2.05, cant: 25, y: 1.12, thick: [0.14, 0.06], hinge: 0.7 };
const finRootZ = (x) => lerp(0.5, 0.31, (FIN.rootLE - x) / (FIN.rootLE - FIN.rootTE)) - 0.02;
function finFrame(side) {
const c = FIN.cant * D2R;
const up = [0, side * Math.sin(c), Math.cos(c)];
const nrm = [0, side * Math.cos(c), -Math.sin(c)]; // outer face
const root = (x) => [x, side * FIN.y, finRootZ(x)];
const tipOf = (x, xr) => V3.add(root(xr), V3.add([x - xr, 0, 0], V3.mul(up, FIN.h)));
return { up, nrm, root, rootLE: root(FIN.rootLE), rootTE: root(FIN.rootTE), tipLE: tipOf(FIN.tipLE, FIN.rootLE), tipTE: tipOf(FIN.tipTE, FIN.rootTE) };
}
function finPoint(F, u, v) {
const le = lerp3(F.rootLE, F.tipLE, v), te = lerp3(F.rootTE, F.tipTE, v);
return { p: lerp3(le, te, u), ht: tdist(u) * lerp(FIN.thick[0], FIN.thick[1], v) * 0.5 };
}
const FIN_VS = [0, 0.25, 0.5, 0.75, 0.9, 1];
function finFixedMesh(side) {
const F = finFrame(side);
const m = foilRange({ rootLE: F.rootLE, rootTE: F.rootTE, tipLE: F.tipLE, tipTE: F.tipTE, up: F.nrm, thick: FIN.thick, us: [0, 0.012, 0.04, 0.1, 0.2, 0.34, 0.5, 0.62, FIN.hinge], vs: FIN_VS });
m.ram = ramBands(m, 2, 0);
m.loops = [];
m.decals = finDecals(side, F);
m.hideBoundary = true; // the open root is buried in the fillets: no junction tick at the leading edge
return m;
}
const RUD = { v0: 0.03, v1: 0.68, gap: 0.012 };
function finSub(F, v0, v1) { // a span slice of the fin as its own foil corners and thicknesses
return { rootLE: lerp3(F.rootLE, F.tipLE, v0), rootTE: lerp3(F.rootTE, F.tipTE, v0), tipLE: lerp3(F.rootLE, F.tipLE, v1), tipTE: lerp3(F.rootTE, F.tipTE, v1), thick: [lerp(FIN.thick[0], FIN.thick[1], v0), lerp(FIN.thick[0], FIN.thick[1], v1)] };
}
function rudderBase(side) {
const F = finFrame(side);
const S = finSub(F, RUD.v0, RUD.v1);
const m = foilRange({ ...S, up: F.nrm, us: [FIN.hinge + 0.006, 0.78, 0.88, 1], vs: [0, 0.25, 0.5, 0.75, 1], capRoot: true });
m.ram = ramBands(m, 0, 1);
const h0 = finPoint(F, FIN.hinge, RUD.v0).p, h1 = finPoint(F, FIN.hinge, RUD.v1).p;
m.hinge = { o: h0, a: V3.unit(V3.sub(h1, h0)) };
return m;
}
function finTipAftMesh(side) {
const F = finFrame(side);
const S = finSub(F, RUD.v1 + RUD.gap, 1);
const m = foilRange({ ...S, up: F.nrm, us: [FIN.hinge + 0.006, 0.78, 0.88, 1], vs: [0, 0.5, 1], capRoot: true });
m.ram = ramBands(m, 0, 1);
m.loops = [];
return m;
}
function finFillet(side, outer) {
const F = finFrame(side);
const sg = outer ? 1 : -1;
const n = V3.mul(F.nrm, sg);
const hy = outer ? side : -side; // horizontal direction away from the fin
const xs = [-3.75, -3.85, -4.0, -4.2, -4.5, -4.85, -5.2, -5.6, -5.95, -6.2, -6.3];
const prof = (x) => smooth(-3.75, -4.45, x) * lerp(1, 0.45, smooth(-5.6, -6.3, x));
const rings = [], centres = [];
for (const x of xs) {
const p = prof(x);
const u = Math.min(1, Math.max(0, (FIN.rootLE - x) / (FIN.rootLE - FIN.rootTE)));
const ht = tdist(u) * FIN.thick[0] * 0.5;
const r0 = F.root(x);
const yK = side * FIN.y + hy * ht;
const K = [x, yK, skinZ(x, yK)];
void r0;
const A = V3.add(K, V3.mul(F.up, 0.17 * p)); // up the fin face from the skin line (the fin root itself is buried)
const w = sectionAt(x).w - 0.03;
let yB = side * FIN.y + hy * (ht + 0.24 * p);
if (Math.abs(yB) > w) yB = Math.sign(yB) * w;
const Bp = [x, yB, skinZ(x, yB) + 0.004];
const ring = [];
for (let k = 0; k <= 4; k++) { const t = k / 4; ring.push(V3.add(V3.add(V3.mul(A, (1 - t) * (1 - t)), V3.mul(K, 2 * t * (1 - t))), V3.mul(Bp, t * t))); }
rings.push(ring); centres.push(V3.add(K, [0, 0, -0.03]));
}
const L = loftRings(rings, centres, { closed: false });
return { v: L.v, f: L.f, hideBoundary: true, noSil: true }; // a fillet blends into both skins: no outline
}
const STAB = { rootLE: [-4.75, 1.25], rootTE: [-7.58, 1.25], tipLE: [-6.24, 3.33], tipTE: [-7.05, 3.33], z: 0.15, thick: [0.17, 0.055], pivot: -6.05 };
function stabBase(side) {
const P = (xy, z) => [xy[0], side * xy[1], z];
const m = foilRange({ rootLE: P(STAB.rootLE, STAB.z), rootTE: P(STAB.rootTE, STAB.z), tipLE: P(STAB.tipLE, STAB.z - 0.02), tipTE: P(STAB.tipTE, STAB.z - 0.02), up: [0, 0, 1], thick: STAB.thick, us: [0, 0.015, 0.05, 0.12, 0.25, 0.42, 0.6, 0.8, 0.92, 1], vs: [0, 0.35, 0.7, 1] });
m.ram = ramBands(m, 2, 1);
m.loops = [];
return m;
}
const GLYPHS = {"M":{"a":0.995,"c":[[0.092,0.729,0.331,0.729,0.497,0.339,0.664,0.729,0.903,0.729,0.903,0.0,0.725,0.0,0.725,0.533,0.557,0.14,0.438,0.14,0.27,0.533,0.27,0.0,0.092,0.0]]},"A":{"a":0.774,"c":[[0.534,0.133,0.24,0.133,0.194,0.0,0.005,0.0,0.275,0.729,0.499,0.729,0.769,0.0,0.58,0.0],[0.287,0.268,0.487,0.268,0.387,0.558]]},"R":{"a":0.77,"c":[[0.359,0.406,0.395,0.408,0.423,0.416,0.444,0.428,0.458,0.446,0.466,0.47,0.469,0.5,0.466,0.53,0.458,0.554,0.444,0.571,0.423,0.583,0.395,0.59,0.359,0.593,0.28,0.593,0.28,0.406],[0.28,0.276,0.28,0.0,0.092,0.0,0.092,0.729,0.379,0.729,0.466,0.724,0.537,0.708,0.59,0.681,0.627,0.642,0.65,0.591,0.657,0.528,0.653,0.483,0.642,0.443,0.622,0.409,0.595,0.381,0.56,0.358,0.517,0.341,0.542,0.332,0.565,0.319,0.586,0.301,0.607,0.277,0.627,0.245,0.648,0.207,0.75,0.0,0.55,0.0,0.461,0.181,0.443,0.214,0.425,0.239,0.406,0.256,0.386,0.267,0.362,0.274,0.333,0.276]]},"I":{"a":0.372,"c":[[0.092,0.729,0.28,0.729,0.28,0.0,0.092,0.0]]},"N":{"a":0.837,"c":[[0.092,0.729,0.302,0.729,0.567,0.229,0.567,0.729,0.745,0.729,0.745,0.0,0.535,0.0,0.27,0.5,0.27,0.0,0.092,0.0]]},"E":{"a":0.683,"c":[[0.092,0.729,0.599,0.729,0.599,0.587,0.28,0.587,0.28,0.451,0.58,0.451,0.58,0.309,0.28,0.309,0.28,0.142,0.61,0.142,0.61,0.0,0.092,0.0]]},"S":{"a":0.72,"c":[[0.599,0.706,0.599,0.552,0.559,0.568,0.52,0.582,0.482,0.592,0.445,0.6,0.409,0.604,0.374,0.606,0.333,0.604,0.3,0.598,0.274,0.587,0.257,0.573,0.246,0.554,0.242,0.53,0.245,0.512,0.252,0.496,0.264,0.484,0.282,0.474,0.309,0.464,0.343,0.456,0.423,0.44,0.496,0.421,0.554,0.396,0.596,0.366,0.624,0.328,0.641,0.281,0.647,0.224,0.639,0.151,0.615,0.091,0.575,0.045,0.519,0.012,0.447,-0.008,0.357,-0.014,0.311,-0.013,0.264,-0.008,0.218,-0.001,0.171,0.009,0.125,0.022,0.078,0.038,0.078,0.197,0.124,0.174,0.169,0.155,0.213,0.141,0.256,0.13,0.298,0.124,0.339,0.122,0.377,0.124,0.408,0.131,0.433,0.143,0.451,0.158,0.462,0.178,0.466,0.201,0.463,0.222,0.456,0.24,0.444,0.254,0.424,0.266,0.394,0.277,0.355,0.287,0.282,0.303,0.216,0.322,0.163,0.347,0.122,0.378,0.094,0.416,0.077,0.462,0.072,0.516,0.08,0.583,0.103,0.639,0.142,0.684,0.196,0.716,0.263,0.736,0.344,0.742,0.385,0.741,0.426,0.738,0.468,0.733,0.511,0.726,0.554,0.717]]},"U":{"a":0.812,"c":[[0.092,0.729,0.28,0.729,0.28,0.292,0.283,0.237,0.293,0.194,0.309,0.163,0.333,0.141,0.365,0.128,0.406,0.124,0.446,0.128,0.479,0.141,0.503,0.163,0.519,0.194,0.529,0.237,0.532,0.292,0.532,0.729,0.72,0.729,0.72,0.292,0.712,0.198,0.686,0.121,0.643,0.062,0.582,0.019,0.503,-0.006,0.406,-0.014,0.309,-0.006,0.23,0.019,0.169,0.062,0.126,0.121,0.1,0.198,0.092,0.292]]},"C":{"a":0.734,"c":[[0.67,0.04,0.635,0.024,0.599,0.01,0.562,-0.0,0.524,-0.008,0.485,-0.013,0.445,-0.014,0.332,-0.003,0.236,0.031,0.156,0.088,0.097,0.164,0.062,0.256,0.05,0.364,0.062,0.472,0.097,0.564,0.156,0.64,0.236,0.697,0.332,0.731,0.445,0.742,0.485,0.741,0.524,0.736,0.562,0.729,0.599,0.718,0.635,0.704,0.67,0.688,0.67,0.537,0.635,0.559,0.601,0.576,0.567,0.589,0.532,0.599,0.497,0.604,0.46,0.606,0.398,0.599,0.345,0.577,0.302,0.542,0.27,0.493,0.251,0.434,0.244,0.364,0.251,0.294,0.27,0.235,0.302,0.187,0.345,0.151,0.398,0.129,0.46,0.122,0.497,0.124,0.532,0.129,0.567,0.139,0.601,0.152,0.635,0.169,0.67,0.191]]},"V":{"a":0.774,"c":[[0.005,0.729,0.194,0.729,0.387,0.191,0.58,0.729,0.769,0.729,0.499,0.0,0.275,0.0]]},"0":{"a":0.696,"c":[[0.46,0.365,0.457,0.447,0.449,0.512,0.434,0.558,0.413,0.589,0.385,0.608,0.348,0.614,0.312,0.608,0.283,0.589,0.262,0.558,0.247,0.512,0.239,0.447,0.236,0.365,0.239,0.282,0.247,0.217,0.262,0.17,0.283,0.139,0.312,0.12,0.348,0.114,0.384,0.12,0.413,0.139,0.434,0.17,0.448,0.217,0.457,0.282],[0.648,0.364,0.639,0.252,0.613,0.159,0.57,0.084,0.51,0.03,0.437,-0.003,0.348,-0.014,0.259,-0.003,0.185,0.03,0.126,0.084,0.083,0.159,0.057,0.252,0.048,0.364,0.057,0.476,0.083,0.569,0.126,0.644,0.185,0.698,0.259,0.731,0.348,0.742,0.437,0.731,0.51,0.698,0.57,0.644,0.613,0.569,0.639,0.476]]},"1":{"a":0.696,"c":[[0.117,0.13,0.283,0.13,0.283,0.601,0.113,0.566,0.113,0.694,0.282,0.729,0.461,0.729,0.461,0.13,0.627,0.13,0.627,0.0,0.117,0.0]]}};
function decal(o, n, upHint, snap, groups, minDot = 0.1) {
n = V3.unit(n);
const v = V3.unit(V3.sub(upHint, V3.mul(n, V3.dot(upHint, n))));
const u = V3.unit(V3.cross(n, v)); // text-right: reads unmirrored from the front face
const at = (a, b) => snap(V3.add(o, V3.add(V3.mul(u, a), V3.mul(v, b))));
const dense = (c, closed) => { // no edge longer than 8 cm, so long straight strokes bend with the skin too
const out = [];
const m = closed ? c.length : c.length - 1;
for (let i = 0; i < m; i++) {
const a = c[i], b = c[(i + 1) % c.length], k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.08));
for (let j = 0; j < k; j++) out.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]);
}
if (!closed) out.push(c[c.length - 1]);
return out;
};
const thin = (c, tol) => { // Douglas–Peucker on a closed outline (split at its farthest pair)
const dp = (a, b, out) => {
let k = -1, dm = tol;
const A = c[a], B = c[b % c.length], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1e-9;
for (let i = a + 1; i < b; i++) { const d = Math.abs((c[i][0] - A[0]) * dy - (c[i][1] - A[1]) * dx) / L; if (d > dm) { dm = d; k = i; } }
if (k < 0) { out.push(A); return; }
dp(a, k, out); dp(k, b, out);
};
if (c.length < 5) return c;
let far = 0, dmax = 0;
for (let i = 1; i < c.length; i++) { const d = Math.hypot(c[i][0] - c[0][0], c[i][1] - c[0][1]); if (d > dmax) { dmax = d; far = i; } }
const out = [];
dp(0, far, out); dp(far, c.length, out);
return out.length >= 3 ? out : c;
};
const gs = groups.map((gr) => {
let cx = 0, cy = 0, k = 0;
for (const c of gr.c) for (const p of c) { cx += p[0]; cy += p[1]; k++; }
cx /= k; cy /= k;
const e = 0.01, c0 = at(cx, cy);
let nn = V3.unit(V3.cross(V3.sub(at(cx + e, cy), c0), V3.sub(at(cx, cy + e), c0)));
if (V3.dot(nn, n) < 0) nn = V3.mul(nn, -1);
return { line: !!gr.line, n: nn, cs: gr.c.map((c) => (gr.line ? dense(c, false) : thin(c, 0.015)).map((p) => at(p[0], p[1]))), c: gr.c.map((c) => (gr.line ? dense(c, false) : c).map((p) => at(p[0], p[1]))), cd: gr.c.map((c) => dense(c, !gr.line).map((p) => at(p[0], p[1]))) };
});
return { o: at(0, 0), u, n, groups: gs, minDot };
}
function markGlyphs(txt, h, ls = 0) {
const W = [...txt].reduce((s, ch) => s + GLYPHS[ch].a * h, 0) + ls * (txt.length - 1);
let x = -W / 2;
const out = [];
for (const ch of txt) {
const g = GLYPHS[ch];
out.push({ c: g.c.map((f) => { const pts = []; for (let i = 0; i < f.length; i += 2) pts.push([x + f[i] * h, (f[i + 1] - 0.36) * h]); return pts; }) });
x += g.a * h + ls;
}
return out;
}
function roundelGroups(R) {
const circ = [];
for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; circ.push([Math.cos(a) * R, Math.sin(a) * R]); }
const bar = (s) => { const x0 = s * R * 0.62, x1 = s * R * 2.0, y0 = R * 0.12, y1 = -R * 0.44; return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; };
const star = [];
for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? R * 0.38 : R * 0.97; star.push([Math.cos(a) * r, Math.sin(a) * r]); }
const area = (pts) => { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; };
const wind = (pts, ccw) => ((area(pts) > 0) === ccw ? pts : pts.slice().reverse());
const y = -R * 0.16;
return [
{ c: [wind(circ, true), wind(bar(1), true), wind(bar(-1), true), wind(star, false)] },
{ line: true, c: [[[R * 0.98, y], [R * 1.92, y]], [[-R * 0.98, y], [-R * 1.92, y]]] },
];
}
function finSnap(F, sg, lift = 0.004) {
const n = V3.mul(F.nrm, sg);
return (p) => {
let u = 0.4, w = 0.4;
for (let it = 0; it < 4; it++) {
const e = 1e-3, q = finPoint(F, u, w).p, r = V3.sub(p, q);
const ju = V3.mul(V3.sub(finPoint(F, u + e, w).p, q), 1 / e), jv = V3.mul(V3.sub(finPoint(F, u, w + e).p, q), 1 / e);
const a = V3.dot(ju, ju), b = V3.dot(ju, jv), c = V3.dot(jv, jv), d1 = V3.dot(ju, r), d2 = V3.dot(jv, r), det = a * c - b * b;
u += (c * d1 - b * d2) / det; w += (a * d2 - b * d1) / det;
}
const q = finPoint(F, u, w);
return V3.add(q.p, V3.mul(n, q.ht + lift));
};
}
function finDecals(side, F) {
const out = [];
for (const sg of [1, -1]) { // both faces of the fin
const n = V3.mul(F.nrm, sg), snap = finSnap(F, sg);
const at = (u, v) => snap(finPoint(F, u, v).p);
out.push(decal(at(0.38, 0.47), n, F.up, snap, markGlyphs("VM", 0.44, 0.02)));
out.push(decal(at(0.42, 0.21), n, F.up, snap, markGlyphs("01", 0.2)));
}
return out;
}
function wingTopZ(x, y) {
const v = (Math.abs(y) - WING.rootLE[1]) / (WING.tipLE[1] - WING.rootLE[1]);
const le = lerp(WING.rootLE[0], WING.tipLE[0], v), te = lerp(WING.rootTE[0], WING.tipTE[0], v);
const u = (le - x) / (le - te);
const th = lerp(WING.thick[0], WING.thick[1], v);
return lerp(WING.z0, WING.z1, v) + tdist(u) * th * 0.62;
}
const fusSnap = (side) => (p) => [p[0], side * (fusY(p[0], p[2]) + 0.004), p[2]];
function fuselageDecals() {
const out = [];
for (const side of [1, -1]) {
const snap = fusSnap(side), nAt = (x, z) => { const e = 1e-3; let n = V3.unit(V3.cross(V3.sub(snap([x + e, 0, z]), snap([x - e, 0, z])), V3.sub(snap([x, 0, z + e]), snap([x, 0, z - e])))); return n[1] * side < 0 ? V3.mul(n, -1) : n; };
out.push(decal(snap([-4.05, 0, 0.0]), nAt(-4.05, 0.0), [0, 0, 1], snap, markGlyphs("MARINES", 0.2, 0.03), 0.15));
out.push(decal(snap([4.95, 0, -0.14]), nAt(4.95, -0.14), [0, 0, 1], snap, markGlyphs("USMC", 0.13, 0.015), 0.15));
}
return out;
}
function wingDecals(side) {
if (side > 0) { // national insignia: upper port wing
const snap = (p) => [p[0], p[1], wingTopZ(p[0], p[1]) + 0.004];
return [decal(snap([-1.25, 4.15, 0]), [0, 0, 1], [1, 0, 0], snap, roundelGroups(0.3), 0.08)];
} // and lower starboard wing
const snap = (p) => [p[0], p[1], wingBottomZ(p[0], p[1]) - 0.004];
return [decal(snap([-1.25, -4.15, 0]), [0, 0, -1], [1, 0, 0], snap, roundelGroups(0.3), 0.08)];
}
function wingWalk(side) {
const pts = (path) => path.map(([x, y]) => [x, side * y, wingTopZ(x, side * y) + 0.004]);
const line = (x0, y0, x1, y1, n = 8) => pts(Array.from({ length: n + 1 }, (_, i) => [lerp(x0, x1, i / n), lerp(y0, y1, i / n)]));
return [
{ n: [0, 0, 1], line: line(0.95, 1.95, -1.9, 1.95) },
{ n: [0, 0, 1], line: line(-1.9, 1.95, -1.9, 2.75, 3) },
{ n: [0, 0, 1], line: line(-1.9, 2.75, 0.6, 2.75) },
];
}
function staticParts() {
const parts = [];
const add = (name, mesh, opt = {}) => parts.push({ name, mesh, ...opt });
const fus = fuselageMesh();
fus.decals = fuselageDecals();
add("fuselage", fus, { tone: "hi", smooth: true, id: "fuselage" });
add("canopy.aft", canopyAftMesh(), { tone: "hi", bias: 6.1 });
add("canopy", canopyMesh(), { tone: "hi", cls: "canopy", bias: 6, smooth: true });
for (const side of [1, -1]) {
const sfx = side > 0 ? ".port" : ".stbd";
const ik = intakeMesh(side);
ik.ram = new Set([0, 1, 2, 3]); // the caret lip
add("intake" + sfx, ik, { tone: "hi", smooth: true, bias: 0.5 });
add("bump" + sfx, bumpMesh(side), { tone: "hi", smooth: true, bias: 0.3 });
add("boom" + sfx, boomMesh(side), { tone: "hi", smooth: true, id: "boom" + sfx });
const P = (xy, z) => [xy[0], side * xy[1], z];
const onChine = (p) => [p[0], side * (sectionAt(p[0]).w - 0.006), p[2]];
const wing = foilMesh({ rootLE: P(WING.rootLE, WING.z0), rootTE: P(WING.rootTE, WING.z0), tipLE: P(WING.tipLE, WING.z1), tipTE: P(WING.tipTE, WING.z1), up: [0, 0, 1], thick: WING.thick, us: WING_US, vs: WING_VS, rootFix: onChine });
const fl = wing.topLine(7, 0, 5);
const flEnd = [wing.L.base[5] + 7, wing.L.base[5] + 8, wing.L.base[5] + 9, wing.L.base[5] + 10];
wing.loops = [wing.topLine(3), [...fl, ...flEnd.slice(1)], wing.botLine(3)];
wing.ram = new Set();
{ const R = wing.R, nuW = WING_US.length; for (let r = 0; r < WING_VS.length - 1; r++) for (const i of [0, 1, nuW - 2]) { wing.ram.add(r * R + i); wing.ram.add(r * R + ((R - (i + 1)) % R)); } }
wing.decals = wingDecals(side);
wing.lines3 = wingWalk(side);
add("wing" + sfx, wing, { tone: "hi", smooth: true });
add("fin" + sfx, finFixedMesh(side), { tone: "hi", smooth: true, bias: 0.5, id: "fin" + sfx });
add("fin.tip" + sfx, finTipAftMesh(side), { tone: "hi", smooth: true, bias: 0.55, id: "fintip" + sfx });
const F = finFrame(side);
for (const outer of [true, false]) add("fillet" + sfx, finFillet(side, outer), { tone: "hi", smooth: true, rel: { to: ["fin" + sfx, "fuselage", "boom" + sfx], d: 0.02, side: V3.mul(F.nrm, outer ? 1 : -1), hidTo: ["fin" + sfx] } });
}
return parts;
}
function edgeMap(mesh) {
if (mesh._emap) return mesh._emap;
const map = new Map();
for (const e of edgesOf(mesh)) map.set(e.a < e.b ? e.a + "," + e.b : e.b + "," + e.a, e);
mesh._emap = map;
return map;
}
function cornerGroups(mesh) {
if (mesh._groups && mesh._gid) return mesh._groups;
const vf = mesh.v.map(() => []);
mesh.f.forEach((face, fi) => face.forEach((i) => vf[i].push(fi)));
const n0 = mesh.f.map((face) => V3.unit(newell(face.map((i) => mesh.v[i]))));
mesh._groups = mesh.f.map((face, fi) => face.map((i) => vf[i].filter((gi) => !(mesh.caps && mesh.caps.includes(gi)) && V3.dot(n0[fi], n0[gi]) > 0.5)));
const ids = new Map();
mesh._gl = [];
mesh._gid = mesh._groups.map((cs) => cs.map((gl) => {
const k = gl.join(",");
let id = ids.get(k);
if (id === undefined) { id = mesh._gl.length; ids.set(k, id); mesh._gl.push(gl); }
return id;
}));
return mesh._groups;
}
function clipS(poly, thr, above) {
const out = [];
const inside = (o) => (above ? o.s >= thr : o.s < thr);
for (let i = 0; i < poly.length; i++) {
const a = poly[i], b = poly[(i + 1) % poly.length];
const ia = inside(a), ib = inside(b);
if (ia) out.push(a);
if (ia !== ib) {
const t = (thr - a.s) / (b.s - a.s);
out.push({ p: [a.p[0] + (b.p[0] - a.p[0]) * t, a.p[1] + (b.p[1] - a.p[1]) * t], s: thr });
}
}
return out;
}
function smoothScores(mesh, normals, Lt) {
cornerGroups(mesh);
const gid = mesh._gid, gl = mesh._gl, gs = new Float64Array(gl.length).fill(NaN);
return (fi) => mesh.f[fi].map((_, c) => {
const id = gid[fi][c];
let v = gs[id];
if (v !== v) { let n = [0, 0, 0]; for (const gi of gl[id]) n = V3.add(n, normals[gi]); v = gs[id] = V3.dot(V3.unit(n), Lt); }
return v;
});
}
function partSvg(part, wv, sv, V, Lt, fmtPath, fmtLine, opts = {}) {
const mesh = part.mesh;
if (part.cull && opts.dW && V3.dot(opts.dW(part.cull), V) < -0.05) return [];
const normals = mesh.f.map((face) => V3.unit(newellIdx(face, wv)));
const front = normals.map((n) => V3.dot(n, V) > 1e-4);
const order = mesh.f.map((_, i) => i).filter((i) => front[i]);
const g = [];
const toneOf = (fi) => (mesh.caps && mesh.caps.includes(fi) ? "c" : band(V3.dot(normals[fi], Lt)));
if (part.sortFaces) {
const depth = mesh.f.map((face) => V3.dot(centroid(face.map((i) => wv[i])), V));
order.sort((a, b) => depth[a] - depth[b]);
let run = null, d = "";
const emit = (t, poly) => {
if (poly.length < 3) return;
if (t !== run && d) { g.push(`<path data-s="${run}" d="${d}"/>`); d = ""; }
run = t; d += fmtPath(poly);
};
let big = false;
if (part.smooth) { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const q of sv) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; } big = x1 - x0 + (y1 - y0) > 60; }
const sc = big ? smoothScores(mesh, normals, Lt) : null;
const hull = mesh.hull ? new Map() : null;
const out = (t, poly) => { if (hull && mesh.hull.has(cur)) { if (poly.length > 2) hull.set(t, (hull.get(t) || "") + fmtPath(poly)); } else emit(t, poly); };
let cur = -1;
const seq = hull ? [...order.filter((fi) => !mesh.hull.has(fi)), ...order.filter((fi) => mesh.hull.has(fi))] : order;
for (const fi of seq) {
cur = fi;
if (!sc || (mesh.caps && mesh.caps.includes(fi))) { out(toneOf(fi), mesh.f[fi].map((i) => sv[i])); continue; }
const s = sc(fi), lo = Math.min(...s), hi = Math.max(...s), b0 = band(lo), b1 = band(hi);
if (b0 === b1) { out(b0, mesh.f[fi].map((i) => sv[i])); continue; }
const fp = mesh.f[fi].map((i) => sv[i]);
if (Math.abs(fp[2][0] - fp[0][0]) + Math.abs(fp[2][1] - fp[0][1]) < 5) { out(band(s.reduce((a, b) => a + b, 0) / s.length), fp); continue; }
const poly = mesh.f[fi].map((i, c) => ({ p: sv[i], s: s[c] }));
for (let t = b0; t <= b1; t++) {
let q = poly;
if (t > 0) q = clipS(q, BANDS[t - 1], true);
if (t < BANDS.length) q = clipS(q, BANDS[t], false);
out(t, q.map((o) => o.p));
}
}
if (d) g.push(`<path data-s="${run}" d="${d}"/>`);
if (hull) for (const t of [0, 1, 2, 3, 4, "c"]) { const h = hull.get(t); if (h) g.push(`<path data-s="${t}" d="${h}"/>`); }
} else if (part.smooth) {
cornerGroups(mesh);
const gid = mesh._gid, gl = mesh._gl, gs = new Float64Array(gl.length).fill(NaN);
const capSet = mesh.caps && mesh.caps.length ? new Set(mesh.caps) : null;
const by = new Map();
const put = (t, poly) => { if (poly.length > 2) by.set(t, (by.get(t) || "") + fmtPath(poly)); };
for (const fi of order) {
if (capSet && capSet.has(fi)) { put("c", mesh.f[fi].map((i) => sv[i])); continue; }
const face = mesh.f[fi];
const sc = face.map((_, c) => {
const id = gid[fi][c];
let v = gs[id];
if (v !== v) {
let n = [0, 0, 0];
for (const gi of gl[id]) n = V3.add(n, normals[gi]);
v = gs[id] = V3.dot(V3.unit(n), Lt);
}
return v;
});
const lo = Math.min(...sc), hi = Math.max(...sc);
const b0 = band(lo), b1 = band(hi);
if (b0 === b1) { put(b0, face.map((i) => sv[i])); continue; }
const poly = face.map((i, c) => ({ p: sv[i], s: sc[c] }));
for (let t = b0; t <= b1; t++) {
let q = poly;
if (t > 0) q = clipS(q, BANDS[t - 1], true);
if (t < BANDS.length) q = clipS(q, BANDS[t], false);
put(t, q.map((o) => o.p));
}
}
for (const t of [0, 1, 2, 3, 4, "c"]) { const d = by.get(t); if (d) g.push(`<path data-s="${t}" d="${d}"/>`); }
} else {
const by = new Map();
for (const fi of order) { const t = toneOf(fi); by.set(t, (by.get(t) || "") + fmtPath(mesh.f[fi].map((i) => sv[i]))); }
for (const t of ["0", "1", "2", "3", "4", "c"]) { const d = by.get(t === "c" ? "c" : Number(t)); if (d) g.push(`<path data-s="${t}" d="${d}"/>`); }
}
const over = (set, cls) => { let d = ""; for (const fi of order) if (set.has(fi)) d += fmtPath(mesh.f[fi].map((i) => sv[i])); if (d) g.push(`<path class="${cls}" d="${d}"/>`); };
if (mesh.ram) over(mesh.ram, "ac-ram");
if (mesh.inner) over(mesh.inner, "ac-inner");
if (mesh.innerWebs && opts.pr && V3.dot(V3.unit(opts.dW ? opts.dW(mesh.innerN) : mesh.innerN), V) > 0.02) {
const webs = mesh.innerWebs.map((w) => ({ w, d: opts.toW ? V3.dot(centroid(w.map(opts.toW)), V) : 0 })).sort((a, b) => a.d - b.d);
let d = "";
for (const { w } of webs) d += fmtPath(w.map(opts.pr));
g.push(`<path class="ac-web" d="${d}"/>`);
}
if (mesh.decals && opts.pr && opts.dW) {
let fill = "", line = "";
const A0 = opts.pr([0, 0, 0]), AX = opts.pr([1, 0, 0]), AY = opts.pr([0, 1, 0]), AZ = opts.pr([0, 0, 1]);
const ax = AX[0] - A0[0], bx = AX[1] - A0[1], ay = AY[0] - A0[0], by = AY[1] - A0[1], az = AZ[0] - A0[0], bz = AZ[1] - A0[1];
const P = (p) => (A0[0] + ax * p[0] + ay * p[1] + az * p[2]).toFixed(1) + " " + (A0[1] + bx * p[0] + by * p[1] + bz * p[2]).toFixed(1);
for (const dc of mesh.decals) {
const O = opts.pr(dc.o), U = opts.pr(V3.add(dc.o, dc.u)), ppm = Math.hypot(U[0] - O[0], U[1] - O[1]);
if (ppm < 7) continue; // under 7 px a metre: too small to read, skip
for (const gr of dc.groups) {
if (V3.dot(V3.unit(opts.dW(gr.n)), V) < dc.minDot) continue;
for (const c of ppm > 60 ? gr.cd : ppm > 30 ? gr.c : gr.cs) { const d = "M" + c.map(P).join("L"); if (gr.line) line += d; else fill += d + "Z"; }
}
}
if (fill) g.push(`<path class="ac-mark" d="${fill}"/>`);
if (line) g.push(`<path class="ac-mark-line" d="${line}"/>`);
}
if (mesh.lines3 && opts.pr && opts.dW) {
let d = "";
for (const ln of mesh.lines3) if (V3.dot(V3.unit(opts.dW(ln.n)), V) > 0.05) d += "M" + ln.line.map((p) => { const q = opts.pr(p); return q[0].toFixed(2) + " " + q[1].toFixed(2); }).join("L");
if (d) g.push(`<path class="ac-mark-line" d="${d}"/>`);
}
const key = (a, b) => (a < b ? a + "," + b : b + "," + a);
const sil = [], crease = [], soft = [];
for (const e of edgesOf(mesh)) {
const k = key(e.a, e.b);
if (e.faces.length === 1) {
if (!front[e.faces[0]] || mesh.hideBoundary) continue;
if (mesh.softEdges && mesh.softEdges.has(k)) soft.push(fmtLine(sv[e.a], sv[e.b])); else sil.push(fmtLine(sv[e.a], sv[e.b]));
continue;
}
const [fa, fb] = e.faces;
if (front[fa] !== front[fb]) { if (!mesh.noSil) sil.push(fmtLine(sv[e.a], sv[e.b])); }
else if (front[fa] && ((mesh.crease && mesh.crease.has(k)) || (!part.smooth && V3.dot(normals[fa], normals[fb]) < 0.7))) crease.push(fmtLine(sv[e.a], sv[e.b]));
}
const panel = [];
if (mesh.loops) {
const em = edgeMap(mesh);
for (const loop of mesh.loops) {
let cur = null;
for (let i = 0; i < loop.length - 1; i++) {
const e = em.get(key(loop[i], loop[i + 1]));
const vis = e && e.faces.some((fi) => front[fi]) && !(e.faces.length === 2 && front[e.faces[0]] !== front[e.faces[1]]);
if (vis) { if (!cur) { cur = [sv[loop[i]]]; panel.push(cur); } cur.push(sv[loop[i + 1]]); } else cur = null;
}
}
}
if (panel.length) g.push(`<path class="iso-line" data-tone="lo" d="${panel.map((pts) => "M" + pts.map((p) => fmtLine(p, p).split("L")[0].slice(1)).join("L")).join("")}"/>`);
if (mesh.glint && opts.dW) {
for (const gl of mesh.glint) if (V3.dot(V3.unit(opts.dW(gl.n)), V) > 0.12) g.push(`<path class="ac-glint" d="${fmtPath(gl.pts.map(opts.pr))}"/>`);
}
if (soft.length) g.push(`<path class="iso-line" data-tone="lo" d="${soft.join("")}"/>`);
if (crease.length) g.push(`<path class="iso-line" data-tone="${part.tone === "hi" ? "lo" : "faint"}" d="${crease.join("")}"/>`);
if (sil.length) g.push(`<path class="iso-line" data-tone="${part.lit ? "lit" : part.tone || "hi"}" d="${sil.join("")}"/>`);
return g;
}
let STATIC = null;
const PLANFORM = [NOSE_TIP, [3.6, 1.5, 0], [2.05, 1.66, 0], [-0.56, 5.35, 0], [-2.2, 5.35, 0], [-3.11, 1.6, 0], [-4.75, 1.3, 0], [-6.24, 3.33, 0], [-7.05, 3.33, 0], [-7.58, 1.25, 0], [-7.6, 0, 0]]
.flatMap((p, i, a) => (i === a.length - 1 ? [p] : [p])).concat([[-7.58, -1.25, 0], [-7.05, -3.33, 0], [-6.24, -3.33, 0], [-4.75, -1.3, 0], [-3.11, -1.6, 0], [-2.2, -5.35, 0], [-0.56, -5.35, 0], [2.05, -1.66, 0], [3.6, -1.5, 0]]);
let SURF = null;
function surfBases() {
if (SURF) return SURF;
SURF = {};
for (const side of [1, -1]) {
const k = side > 0 ? "port" : "stbd";
SURF["stab." + k] = stabBase(side);
SURF["rudder." + k] = rudderBase(side);
SURF["door.aux." + k] = auxDoorBase(side);
SURF["gdoor.main." + k] = mainDoorBase(side);
SURF["gdoor.nose." + k] = noseDoorBase(side);
SURF["gdoor.leaf." + k] = mainLeafBase(side);
}
SURF["door.liftfan"] = liftDoorBase();
for (const m of Object.values(SURF)) { edgesOf(m); cornerGroups(m); }
return SURF;
}
const rotKeep = (m, o, a, ang) => { const r = rotMesh(m, o, a, ang); return r; };
function controlSurfaceParts(s, add) {
const B = surfBases();
for (const side of [1, -1]) {
const k = side > 0 ? "port" : "stbd", sfx = "." + k;
add("stab" + sfx, rotKeep(B["stab" + sfx], [STAB.pivot, 0, STAB.z], [0, 1, 0], (s.stab || 0) * D2R), { tone: "hi", smooth: true, bias: -0.5 });
const r = B["rudder" + sfx];
add("rudder" + sfx, rotKeep(r, r.hinge.o, r.hinge.a, -(s.rud || 0) * D2R), { tone: "hi", smooth: true, bias: 0.5, id: "rudder" + sfx });
}
}
const LIFT = { x0: 0.78, x1: 3.05, w: 0.6, thick: 0.07 };
const liftDoorSurf = (u, v) => { const x = lerp(LIFT.x0, LIFT.x1, u), y = lerp(LIFT.w, -LIFT.w, v); return [x, y, topAt(x) + (skinZ(1.9, y) - topAt(1.9)) + 0.014]; };
const liftHingeZ = () => skinZ(LIFT.x0, 0) + 0.014 - LIFT.thick / 2;
function liftDoorBase() {
const m = shellMesh(liftDoorSurf, [0, 0.045, 0.26, 0.5, 0.74, 0.955, 1], [0, 0.06, 0.3, 0.5, 0.7, 0.94, 1], LIFT.thick, [0, 0, 1]);
const inn = (u, v, d = 0) => { const p = liftDoorSurf(u, v), n = m.nrmAt(u, v); return V3.sub(p, V3.mul(n, LIFT.thick + 0.004 + d)); };
const webs = [];
const web = (pts) => webs.push([...pts.map((q) => inn(q[0], q[1])), ...pts.slice().reverse().map((q) => inn(q[0], q[1], 0.06))]);
for (const u of [0.26, 0.5, 0.74]) web([[u, 0.06], [u, 0.5], [u, 0.94]]);
for (const v of [0.3, 0.7]) web([[0.045, v], [0.26, v], [0.5, v], [0.74, v], [0.955, v]]);
m.innerWebs = webs;
m.innerN = [0, 0, -1];
return m;
}
function auxDoorBase(side) {
const surf = (u, v) => { const x = lerp(-0.35, 0.55, u), y = side * lerp(0.12, 0.5, v); return [x, y, skinZ(x, y) + 0.012]; };
const m = shellMesh(surf, [0, 0.08, 0.5, 0.92, 1], [0, 0.12, 0.5, 0.88, 1], 0.04, [0, 0, 1]);
m.hingeZ = skinZ(-0.35, side * 0.3) + 0.012 - 0.02;
return m;
}
function mainDoorBase(side) {
const surf = (u, v) => { const x = lerp(1.0, -0.75, u), y = side * lerp(1.6, 1.0, v); return [x, y, skinZ(x, y, false) - 0.004]; };
const m = shellMesh(surf, [0, 0.06, 0.5, 0.94, 1], [0, 0.08, 0.5, 0.92, 1], 0.03, [0, 0, -1]);
m.hinge = [0, side * 1.6, skinZ(0.1, side * 1.6, false)];
m.outline = [];
for (let i = 0; i <= 8; i++) m.outline.push(surf(i / 8, 1));
for (let i = 0; i <= 6; i++) m.outline.push(surf(1, 1 - i / 6));
for (let i = 8; i >= 0; i--) m.outline.push(surf(i / 8, 0));
return m;
}
function mainLeafBase(side) {
const surf = (u, v) => { const x = lerp(1.06, -0.6, u), y = side * lerp(1.0, 0.66, v); return [x, y, skinZ(x, y, false) - 0.004]; };
const m = shellMesh(surf, [0, 0.06, 0.5, 0.94, 1], [0, 0.1, 0.5, 0.9, 1], 0.03, [0, 0, -1]);
m.hinge = [0, side * 0.66, skinZ(0.2, side * 0.66, false)];
m.outline = [];
for (let i = 0; i <= 8; i++) m.outline.push(surf(i / 8, 0));
for (let i = 0; i <= 6; i++) m.outline.push(surf(1, i / 6));
for (let i = 8; i >= 0; i--) m.outline.push(surf(i / 8, 1));
return m;
}
function noseDoorBase(side) {
const surf = (u, v) => { const x = lerp(6.5, 4.4, u), y = side * lerp(0.24, 0.015, v); return [x, y, skinZ(x, y, false) - 0.004]; };
const m = shellMesh(surf, [0, 0.06, 0.5, 0.94, 1], [0, 0.15, 0.85, 1], 0.025, [0, 0, -1]);
m.hinge = [0, side * 0.24, skinZ(5.4, side * 0.24, false)];
return m;
}
function doorParts(s, add) {
const B = surfBases();
const hz = liftHingeZ();
const hinge = [LIFT.x0, 0, hz];
const dAng = -s.door * 68 * D2R;
const dRot = (p) => rot(p, hinge, [0, 1, 0], dAng);
const base = B["door.liftfan"];
const door = rotMesh(base, hinge, [0, 1, 0], dAng);
door.innerWebs = base.innerWebs.map((w) => w.map(dRot));
door.innerN = rot(base.innerN, [0, 0, 0], [0, 1, 0], dAng);
add("door.liftfan", door, { tone: "hi", bias: 9, smooth: true, id: "door.liftfan" });
const inSide = { to: ["door.liftfan"], d: 0.02, side: door.innerN };
add("door.hinge", rod([LIFT.x0 - 0.01, 0.5, hz], [LIFT.x0 - 0.01, -0.5, hz], 0.03, 10), { tone: "mid", bias: 8.9 });
if (s.door > 0.03) {
for (const y of [0.42, -0.42]) {
const foot = [1.15, y, hz - 0.2];
const lug = dRot(V3.sub(liftDoorSurf((1.5 - LIFT.x0) / (LIFT.x1 - LIFT.x0), (LIFT.w - y) / (2 * LIFT.w)), [0, 0, LIFT.thick + 0.004]));
const ax = V3.unit(V3.sub(lug, foot));
const cl = Math.min(0.28, 0.6 * V3.len(V3.sub(lug, foot)));
const mid = V3.add(foot, V3.mul(ax, cl));
add("door.ram", latheAlong(foot, mid, [[0, 0.05], [0.04, 0.05], [0.04, 0.042], [cl, 0.042]], 10), { tone: "mid", bias: 8.6, rel: inSide });
add("door.rod", rod(mid, lug, 0.02, 8), { tone: "mid", bias: 8.55, cls: "chrome", rel: { ...inSide, d: 0.03 } });
}
}
for (const side of [1, -1]) {
const m = B["door.aux." + (side > 0 ? "port" : "stbd")];
add("door.aux", rotMesh(m, [-0.35, 0, m.hingeZ], [0, 1, 0], -s.aux * 35 * D2R), { tone: "hi", bias: 8 + side * 0.5, smooth: true });
}
}
const GEAR = [
{ id: "ng", top: [5.05, 0, -0.5], wheel: [5.05, 0, -1.78], r: 0.3, wid: 0.2, brace: [5.6, 0, -0.55], side: 0, rs: 0.07, ro: 0.048 },
{ id: "mp", top: [-0.55, 1.22, -0.62], wheel: [-0.55, 1.4, -1.72], r: 0.38, wid: 0.28, brace: [0.25, 1.25, -0.66], side: 1, rs: 0.085, ro: 0.058, sideBrace: [0.1, 1.04, -0.5] },
{ id: "ms", top: [-0.55, -1.22, -0.62], wheel: [-0.55, -1.4, -1.72], r: 0.38, wid: 0.28, brace: [0.25, -1.25, -0.66], side: -1, rs: 0.085, ro: 0.058, sideBrace: [0.1, -1.04, -0.5] },
];
const GEAR_KIN = { mainFold: 90, mainInb: 7, mainTwist: 90, noseFold: 110 };
let GEAR_REST = null;
function gearRest() {
if (GEAR_REST) return GEAR_REST;
GEAR_REST = GEAR.map((g) => {
const up = [], low = [];
const P = (arr, name, mesh, opt) => { edgesOf(mesh); cornerGroups(mesh); arr.push({ name, mesh, ...opt }); };
const axleIn = g.side ? V3.add(g.wheel, [0, -g.side * (g.wid / 2 + 0.07), 0]) : V3.add(g.wheel, [0, 0, 0.36]);
const ax = V3.unit(V3.sub(axleIn, g.top));
const Ltot = V3.len(V3.sub(axleIn, g.top));
const kneeS = Ltot * 0.56;
const knee = V3.add(g.top, V3.mul(ax, kneeS));
const id = (n) => g.id + "." + n;
P(up, "gear.strut", latheAlong(g.top, knee, [[0, g.rs * 1.25], [0.06, g.rs * 1.25], [0.07, g.rs], [kneeS - 0.06, g.rs], [kneeS - 0.05, g.rs * 1.18], [kneeS, g.rs * 1.18]], 12), { tone: "mid", id: id("strut") });
const bot = axleIn;
if (g.side) { // axle stub out to the wheel
P(low, "gear.axle", rod(bot, g.wheel, 0.04, 8), { tone: "mid", id: id("axle") });
} else { // nose fork: two arms from the crown down either side of the wheel
for (const sd of [1, -1]) P(low, "gear.fork", rod(bot, V3.add(g.wheel, [0, sd * (g.wid / 2 + 0.035), 0]), 0.032, 8), { tone: "mid", id: id("fork" + sd), forkSide: sd });
}
const hw = g.wid / 2, rr = g.r * 0.3;
P(low, "gear.tyre", torus(g.wheel, [0, 1, 0], g.r - rr, rr, hw, 20, 8), { tone: "mid", cls: "tyre", sortFaces: true, smooth: true, id: id("tyre") });
for (const sd of [1, -1]) {
const hc = V3.add(g.wheel, [0, sd * hw * 0.62, 0]);
P(low, "gear.hub", latheAlong(hc, V3.add(hc, [0, sd * 0.05, 0]), [[0, g.r * 0.62], [0.025, g.r * 0.6], [0.03, g.r * 0.26], [0.05, g.r * 0.22]], 14), { tone: "hi", cls: "hub", id: id("hub" + sd), hubSide: sd, cull: [0, sd, 0] });
}
const f = [-1, 0, 0];
const ua = V3.add(V3.add(knee, V3.mul(ax, -0.05)), V3.mul(f, g.rs));
const la = V3.add(V3.add(bot, V3.mul(ax, -0.04)), V3.mul(f, g.ro * 1.3));
const lk = Math.hypot(V3.len(V3.sub(la, ua)) / 2, 0.22);
const S0 = V3.add(g.top, V3.mul(ax, kneeS * 0.78));
const out = { g, up, low, knee, bot, Lo0: Ltot - kneeS, S0, l: (V3.len(V3.sub(S0, g.brace)) / 2) * 1.015, kneeS, ax, ua, la, lk };
if (g.sideBrace) { // side brace from the bay roof (inboard edge of the open bay) to the strut, and the lock link that keeps its knee over centre
out.T0 = V3.add(g.top, V3.mul(ax, kneeS * 0.62));
out.sl = (V3.len(V3.sub(out.T0, g.sideBrace)) / 2) * 1.012;
const K0 = braceJoint3(g.sideBrace, out.T0, out.sl, [0, 0, 1]);
out.L0 = [-0.15, g.side * 1.08, -0.42]; // lock-link anchor on the bay roof, above and aft of the knee
out.ll = (V3.len(V3.sub(out.L0, K0)) / 2) * 1.02;
}
return out;
});
return GEAR_REST;
}
function braceJoint3(A, S, l, pref) {
const d = V3.sub(S, A), L = Math.max(1e-4, V3.len(d)), u = V3.mul(d, 1 / L);
const dd = Math.min(L, 2 * l - 1e-4);
const h = Math.sqrt(Math.max(0, l * l - (dd / 2) * (dd / 2)));
let n = V3.sub(pref, V3.mul(u, V3.dot(pref, u)));
n = V3.len(n) < 1e-6 ? [0, 0, -1] : V3.unit(n);
return V3.add(V3.add(A, V3.mul(u, dd / 2)), V3.mul(n, h));
}
const wellRel = (id) => ({ to: ["strut", "oleo", "tyre", "axle", "fork1", "fork-1", "hub1", "hub-1"].map((n) => id + "." + n), d: 0.02, side: [0, 0, 0] });
function gearSeq(gear) {
const r = 1 - gear;
const move = smoother((r - 0.1) / 0.72); // 0 down … 1 stowed
const close = smooth(0.85, 1.0, r);
const over = smooth(0.0, 0.1, r) * (1 - close);
return { r, move, close, over };
}
function gearXf(R, s, q) {
const g = R.g, top = g.top, f = q.move;
const steps = [];
if (g.side) {
const tw = g.side * GEAR_KIN.mainTwist * D2R * smoother((f - 0.12) / 0.7);
if (Math.abs(tw) > 1e-6) steps.push([top, R.ax, tw]);
steps.push([top, [1, 0, 0], -g.side * GEAR_KIN.mainInb * D2R * f]);
steps.push([top, [0, 1, 0], -GEAR_KIN.mainFold * D2R * f]);
} else steps.push([top, [0, 1, 0], -GEAR_KIN.noseFold * D2R * f]);
let Mx = [1, 0, 0, 0, 1, 0, 0, 0, 1];
for (const [, a, ang] of steps) if (ang) {
const c = Math.cos(ang), sn = Math.sin(ang), t1 = 1 - c, [x, y, z] = a;
const Rm = [c + x * x * t1, x * y * t1 - z * sn, x * z * t1 + y * sn, y * x * t1 + z * sn, c + y * y * t1, y * z * t1 - x * sn, z * x * t1 - y * sn, z * y * t1 + x * sn, c + z * z * t1];
const o = Mx; Mx = [];
for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) Mx.push(Rm[i * 3] * o[j] + Rm[i * 3 + 1] * o[3 + j] + Rm[i * 3 + 2] * o[6 + j]);
}
const U = (p) => { const x = p[0] - top[0], y = p[1] - top[1], z = p[2] - top[2]; return [top[0] + Mx[0] * x + Mx[1] * y + Mx[2] * z, top[1] + Mx[3] * x + Mx[4] * y + Mx[5] * z, top[2] + Mx[6] * x + Mx[7] * y + Mx[8] * z]; };
const e = OLEO * (g.side ? s.oleoM ?? 1 : s.oleoN ?? 1);
const st = g.side ? 0 : (s.steer || 0) * D2R;
const Lo = (p) => { p = V3.add(p, V3.mul(R.ax, e)); if (st) p = rot(p, top, R.ax, st); return U(p); };
const Ud = (v) => V3.sub(U(V3.add(top, v)), U(top));
const Ld = (v) => (st ? Ud(rot(v, [0, 0, 0], R.ax, st)) : Ud(v));
const mapM = (m, fn) => ({ ...m, v: m.v.map(fn) });
return { U, Lo, Ud, Ld, mapM, st };
}
let BAY_OPEN = null;
function bayOpen(id, leaf) {
if (!BAY_OPEN) {
BAY_OPEN = {};
for (const side of [1, -1]) for (const yi of [0.66, 1.0]) { // with the inboard leaf open, or only the main door
const o = [];
for (let i = 0; i <= 8; i++) { const x = lerp(1.06, -0.75, i / 8); o.push([x, side * 1.6, skinZ(x, side * 1.6, false)]); }
for (let i = 0; i <= 8; i++) { const x = lerp(-0.75, 1.06, i / 8); o.push([x, side * yi, skinZ(x, side * yi, false)]); }
BAY_OPEN[(side > 0 ? "mp" : "ms") + (yi < 0.8 ? "+" : "")] = o;
}
const n = [];
for (let i = 0; i <= 8; i++) { const x = lerp(6.5, 4.4, i / 8); n.push([x, 0.235, skinZ(x, 0.235, false)]); }
for (let i = 8; i >= 0; i--) { const x = lerp(6.5, 4.4, i / 8); n.push([x, -0.235, skinZ(x, -0.235, false)]); }
BAY_OPEN.ng = n;
}
return BAY_OPEN[id + (leaf && id !== "ng" ? "+" : "")] || BAY_OPEN[id];
}
const CROSS = new Map(); // memo: with the leg at rest the rods repeat frame after frame
function skinCross(a, b) {
const key = a[0] + "," + a[1] + "," + a[2] + "," + b[0] + "," + b[1] + "," + b[2];
let v = CROSS.get(key);
if (v === undefined) { if (CROSS.size > 400) CROSS.clear(); v = skinCross0(a, b); CROSS.set(key, v); }
return v;
}
function skinCross0(a, b) { // the gear rods are short and the lower skin is gently curved: one crossing at most
const f = (t) => { const p = lerp3(a, b, t); return p[2] - skinZ(p[0], p[1], false); };
const fa = f(0) > 0;
if (fa === f(1) > 0) return null;
let lo = 0, hi = 1;
for (let k = 0; k < 10; k++) { const m = (lo + hi) / 2; (f(m) > 0) === fa ? (lo = m) : (hi = m); }
return (lo + hi) / 2;
}
const ROD_T = {};
const grod = (a, b, r, n) => {
const T = ROD_T[n] || (ROD_T[n] = (() => { const t = rod([0, 0, 0], [1, 0, 0], 0.03, n); edgesOf(t); cornerGroups(t); return t; })());
return Object.assign(rod(a, b, r, n), { rod: [a, b, r, n], _edges: T._edges, _groups: T._groups, _gid: T._gid });
};
const insideFrac = (v) => { let k = 0, n = 0; for (let i = 0; i < v.length; i += 3, n++) { const p = v[i]; if (p[2] > skinZ(p[0], p[1], false) + 0.01) k++; } return n ? k / n : 0; };
function gearParts(s, add) {
const q = gearSeq(s.gear);
const B = surfBases();
if (q.close < 0.995) {
for (const R of gearRest()) {
const g = R.g, X = gearXf(R, s, q);
const add0 = add, leafOpen = q.r > 0.02 && q.close < 0.98;
const bayN = g.side ? [0, g.side * 0.45, -1] : [0, 0, -1]; // the same facing test as the bay's dark cavity
add = (name, mesh, opt = {}) => {
if (mesh.rod) {
const [a, b, r, n] = mesh.rod, tc = skinCross(a, b);
const inA = a[2] > skinZ(a[0], a[1], false);
if (tc === null) return add0(name, mesh, inA ? { ...opt, clipBay: bayOpen(g.id, leafOpen), bayN } : opt);
const c = lerp3(a, b, tc);
add0(name, grod(a, c, r, n), inA ? { ...opt, clipBay: bayOpen(g.id, leafOpen), bayN } : opt);
return add0(name, grod(c, b, r, n), inA ? opt : { ...opt, clipBay: bayOpen(g.id, leafOpen), bayN });
}
return add0(name, mesh, q.move > 0.3 && insideFrac(mesh.v) >= 0.9 ? { ...opt, clipBay: bayOpen(g.id, leafOpen), bayN } : opt);
};
const ids = [...R.up, ...R.low].filter((p) => !/tyre|hub/.test(p.name)).map((p) => p.id);
for (const p of R.up) add(p.name, X.mapM(p.mesh, X.U), { ...p, mesh: X.mapM(p.mesh, X.U), bias: -45 });
for (const p of R.low) {
const opt = { ...p, mesh: X.mapM(p.mesh, X.Lo), bias: -45 };
if (p.name === "gear.tyre") opt.rel = { to: ids, d: 0.05, side: X.Ld(g.side ? [0, g.side, 0] : [0, 0, -1]) };
if (p.name === "gear.hub") opt.rel = { to: [g.id + ".tyre"], d: 0.02, side: X.Ld([0, p.hubSide, 0]) };
if (p.name === "gear.fork") opt.rel = { to: [g.id + ".tyre"], d: 0.03, side: X.Ld([0, p.forkSide, 0]) };
add(p.name, opt.mesh, opt);
}
{
const e = OLEO * (g.side ? s.oleoM ?? 1 : s.oleoN ?? 1), L = R.Lo0 + e;
const T = R.oleoT || (R.oleoT = (() => { const t = latheAlong([0, 0, 0], [0, 0, -1], [[0, 1], [0.5, 1], [0.6, 1.3], [1, 1.3]], 12); edgesOf(t); cornerGroups(t); return t; })());
const m = latheAlong(X.U(R.knee), X.Lo(R.bot), [[0, g.ro], [L - 0.07, g.ro], [L - 0.06, g.ro * 1.35], [L, g.ro * 1.35]], 12);
m._edges = T._edges; m._groups = T._groups; m._gid = T._gid;
add("gear.oleo", m, { tone: "hi", cls: "chrome", id: g.id + ".oleo", bias: -45 });
}
const ua = X.Lo(V3.sub(R.ua, V3.mul(R.ax, OLEO * (g.side ? s.oleoM ?? 1 : s.oleoN ?? 1))));
const la = X.Lo(R.la);
const aft = X.Ld([-1, 0, 0]);
const mid = lerp3(ua, la, 0.5), half = V3.len(V3.sub(la, ua)) / 2;
const apex = V3.add(mid, V3.mul(aft, Math.sqrt(Math.max(0, R.lk * R.lk - half * half))));
const lrel = { to: [g.id + ".oleo", g.id + ".strut"], d: 0.01, side: aft };
add("gear.link", grod(ua, apex, 0.02, 6), { tone: "mid", bias: -45, rel: lrel });
add("gear.link", grod(apex, la, 0.02, 6), { tone: "mid", bias: -45, rel: lrel });
const S = X.U(R.S0);
const fwdSide = X.Ud([1, 0, 0]);
const J = braceJoint3(g.brace, S, R.l, [0, 0, 1]); // knee breaks upward, into the bay
add("gear.brace", grod(g.brace, J, 0.034, 8), { tone: "mid", bias: -45, rel: { to: [g.id + ".strut"], d: 0.02, side: fwdSide } });
add("gear.brace", grod(J, S, 0.03, 8), { tone: "mid", bias: -45, rel: { to: [g.id + ".strut"], d: 0.02, side: fwdSide } });
if (g.sideBrace) { // side brace breaks upward at its knee; the lock link folds first and leads it
const T = X.U(R.T0), K = braceJoint3(g.sideBrace, T, R.sl, [0, 0, 1]);
const inSide = [0, -g.side, 0];
add("gear.brace", grod(g.sideBrace, K, 0.03, 8), { tone: "mid", bias: -45, rel: { to: [g.id + ".strut"], d: 0.015, side: inSide } });
add("gear.brace", grod(K, T, 0.028, 8), { tone: "mid", bias: -45, rel: { to: [g.id + ".strut"], d: 0.015, side: inSide } });
const Lk = R.L0, LJ = braceJoint3(K, Lk, R.ll, [-1, 0, -0.3]);
add("gear.link", grod(K, LJ, 0.018, 6), { tone: "mid", bias: -45, rel: { to: [g.id + ".strut"], d: 0.012, side: inSide } });
add("gear.link", grod(LJ, Lk, 0.018, 6), { tone: "mid", bias: -45, rel: { to: [g.id + ".strut"], d: 0.012, side: inSide } });
}
add = add0;
}
}
const mAng = 62 * (1 - q.close), nAng = (84 + 6 * q.over) * (1 - q.close);
const lAng = 80 * smooth(0.0, 0.1, q.r) * (1 - q.close);
const open = Math.min(1, mAng / 62);
if (lAng > 0.1) for (const side of [1, -1]) {
const k = side > 0 ? "port" : "stbd", ld = B["gdoor.leaf." + k], m = side > 0 ? "mp" : "ms";
add("gear.door", rotMesh(ld, ld.hinge, [1, 0, 0], -side * lAng * D2R), { tone: "mid", bias: -45, smooth: true, rel: { to: [m + ".tyre", m + ".strut", m + ".oleo"], d: 0.06, side: [0, -side, 0] } });
const outline = ld.outline.map((p) => V3.add(p, [0, 0, 0.006]));
add("gear.well", { v: [], f: [], custom: (ctx) => {
if (V3.dot(V3.unit(ctx.dW([0, 0, -1])), ctx.V) <= 0.02) return "";
return `<g class="ac-part" opacity="${smooth(0, 30, lAng).toFixed(2)}"><path class="ac-cav" d="${ctx.path(outline.map(ctx.pr))}"/></g>`;
} }, { bias: -45.5, at: [0.2, side * 0.83, -0.7], rel: wellRel(m) });
}
if (open > 0.002) {
for (const side of [1, -1]) {
const k = side > 0 ? "port" : "stbd";
const md = B["gdoor.main." + k];
add("gear.door", rotMesh(md, md.hinge, [1, 0, 0], side * mAng * D2R), { tone: "mid", bias: -45, smooth: true, rel: { to: ["tyre", "strut", "oleo"].map((n) => (side > 0 ? "mp." : "ms.") + n), d: 0.06, side: [0, side, 0] } });
const nd = B["gdoor.nose." + k];
add("gear.door", rotMesh(nd, nd.hinge, [1, 0, 0], side * nAng * D2R), { tone: "mid", bias: -45, smooth: true, rel: { to: ["ng.tyre", "ng.strut", "ng.oleo"], d: 0.06, side: [0, side, 0] } });
const outline = md.outline.map((p) => V3.add(p, [0, 0, 0.006]));
add("gear.well", { v: [], f: [], custom: (ctx) => {
const nW = V3.unit(ctx.dW([0, side * 0.45, -1]));
if (V3.dot(nW, ctx.V) <= 0.02) return "";
return `<g class="ac-part" opacity="${smooth(0.0, 0.5, open).toFixed(2)}"><path class="ac-cav" d="${ctx.path(outline.map(ctx.pr))}"/></g>`;
} }, { bias: -45.5, at: [0.12, side * 1.3, -0.7], rel: wellRel(side > 0 ? "mp" : "ms") });
}
const nOut = [];
for (let i = 0; i <= 8; i++) { const x = lerp(6.5, 4.4, i / 8); nOut.push([x, 0.235, skinZ(x, 0.235, false) - 0.002]); }
for (let i = 8; i >= 0; i--) { const x = lerp(6.5, 4.4, i / 8); nOut.push([x, -0.235, skinZ(x, -0.235, false) - 0.002]); }
add("gear.well", { v: [], f: [], custom: (ctx) => {
if (V3.dot(V3.unit(ctx.dW([0, 0, -1])), ctx.V) <= 0.02) return "";
return `<g class="ac-part" opacity="${smooth(0.0, 0.5, open).toFixed(2)}"><path class="ac-cav" d="${ctx.path(nOut.map(ctx.pr))}"/></g>`;
} }, { bias: -45.5, at: [5.4, 0, -0.5], rel: wellRel("ng") });
}
if (lAng <= 0.1 && open > 0.002) for (const side of [1, -1]) {
const loops = [B["gdoor.leaf." + (side > 0 ? "port" : "stbd")].outline];
add("gear.seam", { v: [], f: [], custom: (ctx) => {
if (V3.dot(V3.unit(ctx.dW([0, 0, -1])), ctx.V) <= 0.02) return "";
const d = loops.map((o) => "M" + o.map((p) => { const q = ctx.pr(p); return q[0].toFixed(2) + " " + q[1].toFixed(2); }).join("L") + "Z").join("");
return `<path class="iso-line" data-tone="lo" d="${d}"/>`;
} }, { at: [0.15, side * 1.1, -0.7], rel: { to: ["fuselage"], d: 0.004, side: [0, 0, -1] } });
}
}
function orderParts(drawn, V, dW) {
const by = new Map();
for (const d of drawn) if (d.part.id) by.set(d.part.id, d);
for (let pass = 0; pass < 2; pass++) for (const d of drawn) {
const r = d.part.rel; if (!r) continue;
const vis = r.side ? V3.dot(dW(r.side), V) > 0 : true;
const pool = (vis || !r.hidTo ? r.to : r.hidTo).map((id) => by.get(id)).filter(Boolean);
if (!pool.length) continue;
d.key = vis ? Math.max(...pool.map((b) => b.key)) + r.d : Math.min(...pool.map((b) => b.key)) - r.d;
}
drawn.sort((a, b) => a.key - b.key);
return drawn;
}
function movingParts(s) {
const parts = [];
const add = (name, mesh, opt = {}) => parts.push({ name, mesh, ...opt });
doorParts(s, add);
const doorZ = topAt(1.9) + 0.02;
if (s.door > 0.02) add("fan.well", fanWell(s, doorZ - 0.03), { bias: 7, flat: true, alpha: smooth(0.02, 0.35, s.door) });
for (const side of [1, -1]) {
const z = -0.8;
const low = plate([[2.75, side * 0.12, z], [2.75, side * 0.62, z], [0.95, side * 0.62, z], [0.95, side * 0.12, z]], [0, 0, 1], 0.04);
add("door.lower", rotMesh(low, [0, side * 0.62, z], [1, 0, 0], side * s.door * 82 * D2R), { tone: "mid", bias: -40 });
}
for (const side of [1, -1]) {
const z = wingBottomZ(POST.x, POST.y) - 0.018;
if (s.posts > 0.02) add("post.nozzle", postNozzle(side, z), { tone: "mid", bias: -21, cls: "xr-keep" });
add("door.post", rotMesh(postDoor(side, z), [0, side * POST.hingeY, z], [1, 0, 0], side * s.posts * 70 * D2R), { tone: "mid", bias: -20 });
}
gearParts(s, add);
controlSurfaceParts(s, add);
const noz = nozzleGeometry(s.nozzle);
noz.segments.forEach((seg, i) => add(`nozzle.${i}`, seg, { tone: "hi", lit: true, bias: 3 + i * 0.01, seams: true, smooth: true, cls: "xr-keep" }));
return { parts, noz };
}
function nozzleGeometry(deg) {
const th = Math.max(1e-4, deg * D2R);
const base = [-6.42, 0, 0.04];
const L = [0, 0.42, 0.82, 1.22, 1.45];
const radius = [0.62, 0.6, 0.57, 0.54, 0.47];
const Ltot = L[3];
const R = Ltot / th;
const at = (s) => { const f = s / R; return [V3.add(base, [-R * Math.sin(f), 0, -R * (1 - Math.cos(f))]), [-Math.cos(f), 0, -Math.sin(f)]]; };
const rings = [];
for (let i = 0; i < 4; i++) { const [c, d] = at(L[i]); rings.push({ c, axis: d, r: radius[i] }); }
const exitDir = rings[3].axis;
const exitC = V3.add(rings[3].c, V3.mul(exitDir, L[4] - L[3]));
const segs = [];
const SIDES = 28;
for (let i = 0; i < 3; i++) segs.push(tube([rings[i], rings[i + 1]], SIDES));
const midC = V3.add(rings[3].c, V3.mul(exitDir, (L[4] - L[3]) * 0.55));
const petals = tube([rings[3], { c: midC, axis: exitDir, r: (radius[3] + radius[4]) / 2 + 0.01 }, { c: exitC, axis: exitDir, r: radius[4] }], SIDES, { capEnd: true });
for (let i = 0; i < SIDES; i++) if (i % 2) { const k = 2 * SIDES + i; petals.v[k] = V3.sub(petals.v[k], V3.mul(exitDir, 0.1)); }
segs.push(petals);
return { segments: segs, exit: exitC, dir: exitDir, r: radius[4] };
}
function fanWell(s, z) {
const c = [1.92, 0, z], r = 0.56;
const v = [], f = [[]];
const N = 28;
for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; v.push([c[0] + Math.cos(a) * r * 1.02, Math.sin(a) * r, z]); f[0].push(i); }
return { v, f, fan: { c, r, phase: s.fanPhase || 0 } };
}
const XRAY = {
fan: { x: 1.92, r: 0.6, top: 0.9, bot: -0.06, z1: 0.66, z2: 0.36 },
eng: { x0: -0.3, x1: -6.4, z0: 0.12, z1: 0.04 },
gear: { x0: 1.1, x1: 1.31 }, // bevel gearbox housing against the casing's aft face (x = 1.92 - 0.6)
clutch: { x0: 0.88, x1: 1.1, gap: 0.045 },
};
const engZ = (x) => lerp(XRAY.eng.z0, XRAY.eng.z1, (XRAY.eng.x0 - x) / (XRAY.eng.x0 - XRAY.eng.x1));
const SH_A = [XRAY.eng.x0, 0, XRAY.eng.z0];
const SH_G = [1.21, 0, 0.44];
const SH_D = V3.unit(V3.sub(SH_G, SH_A));
const onShaft = (x) => V3.add(SH_A, V3.mul(SH_D, (x - SH_A[0]) / SH_D[0]));
const shRing = (x, r) => ({ c: onShaft(x), axis: SH_D, r });
function ductLine(side) {
const zN = wingBottomZ(POST.x, POST.y) - 0.008;
return [[-1.42, side * 0.52, 0.16], [-1.48, side * 0.95, 0.165], [-1.58, side * 1.5, 0.162], [-1.68, side * 1.98, 0.158], [-1.74, side * 2.27, 0.15], [-1.75, side * 2.37, 0.125], [-1.75, side * POST.y, zN]];
}
const DUCT_R = [0.085, 0.08, 0.07, 0.052, 0.048, 0.05, 0.1];
const INLET = [[3.32, 1.27, -0.15, 0.17, 0.3], [2.95, 1.29, -0.14, 0.2, 0.3], [2.45, 1.21, -0.12, 0.23, 0.27], [1.92, 1.06, -0.06, 0.25, 0.28], [1.35, 0.9, -0.01, 0.26, 0.28], [0.8, 0.7, 0.05, 0.27, 0.29], [0.38, 0.48, 0.09, 0.28, 0.31], [0.16, 0.34, 0.105, 0.28, 0.32]];
const PLENUM = [[0.16, 0, 0.11, 0.6, 0.36], [-0.05, 0, 0.115, 0.58, 0.46], [-0.29, 0, 0.12, 0.55, 0.53]];
const AUXD = (side) => [[0.12, side * 0.31, skinZ(0.12, 0.31) - 0.02, 0.15, 0.3], [0.04, side * 0.3, 0.78, 0.14, 0.27], [-0.06, side * 0.28, 0.58, 0.13, 0.23], [-0.12, side * 0.26, 0.46, 0.12, 0.2]];
const BYPASS = [[-0.5, 0.64], [-1.2, 0.655], [-1.9, 0.655], [-2.6, 0.6], [-3.6, 0.6], [-4.3, 0.6]];
function ovalTube(rings, sides = 18) {
const v = [], f = [];
for (const ring of rings) {
const ax = V3.unit(ring.axis);
const u = V3.unit(Math.abs(ax[2]) > 0.9 ? V3.cross(ax, [1, 0, 0]) : V3.cross([0, 0, 1], ax));
const w = V3.unit(V3.cross(ax, u));
for (let i = 0; i < sides; i++) {
const g = (i / sides) * Math.PI * 2;
v.push(V3.add(ring.c, V3.add(V3.mul(u, Math.cos(g) * ring.a), V3.mul(w, Math.sin(g) * ring.b))));
}
}
for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < sides; i++) {
const j = (i + 1) % sides, a = r * sides, b = (r + 1) * sides;
f.push([a + i, b + i, b + j, a + j]);
}
const mesh = orient({ v, f }, (c) => {
let best = rings[0].c, dist = Infinity;
for (const ring of rings) { const d = V3.len(V3.sub(ring.c, c)); if (d < dist) { dist = d; best = ring.c; } }
return best;
});
mesh.caps = [];
return mesh;
}
function stationRings(keys, sub = 3) {
const P = keys.map((k) => k.slice(0, 3)), pts = [];
for (let i = 0; i < keys.length - 1; i++) {
const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
for (let k = 0; k < sub; k++) {
const t = k / sub, t2 = t * t, t3 = t2 * t;
const c = [0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3));
pts.push({ c, a: lerp(keys[i][3], keys[i + 1][3], t), b: lerp(keys[i][4], keys[i + 1][4], t) });
}
}
const L = keys[keys.length - 1];
pts.push({ c: L.slice(0, 3), a: L[3], b: L[4] });
return pts.map((r, i) => ({ ...r, axis: V3.sub(pts[Math.min(pts.length - 1, i + 1)].c, pts[Math.max(0, i - 1)].c) }));
}
const sideKeys = (keys, side) => keys.map(([x, y, z, a, b]) => [x, side * y, z, a, b]);
let XR_STATIC = null;
function xrayStatic() {
const parts = [];
const add = (name, mesh, opt = {}) => parts.push({ name, mesh, xr: true, ...opt, cls: "xr " + (opt.cls || "") });
const er = (x, r) => ({ c: [x, 0, engZ(x)], axis: [-1, 0, 0], r });
const fan = tube([er(-0.3, 0.55), er(-0.42, 0.6), er(-1.85, 0.6), er(-2.35, 0.5)], 26, { capStart: true });
add("xr.eng.fan", fan, { tone: "hi", smooth: true, cls: "xr-eng" });
add("xr.eng.core", tube([er(-2.35, 0.5), er(-3.45, 0.47), er(-3.7, 0.5)], 26), { tone: "hi", smooth: true, cls: "xr-core" });
add("xr.eng.turb", tube([er(-3.7, 0.52), er(-4.35, 0.54)], 26), { tone: "hi", smooth: true, cls: "xr-turb" });
add("xr.eng.aug", tube([er(-4.35, 0.55), er(-6.4, 0.615)], 26), { tone: "hi", smooth: true, cls: "xr-eng" });
const F = XRAY.fan;
const fr = (z, r) => ({ c: [F.x, 0, z], axis: [0, 0, 1], r });
const caseM = tube([fr(F.bot, F.r - 0.02), fr(F.bot + 0.12, F.r), fr(F.top - 0.06, F.r), fr(F.top, F.r - 0.03)], 32);
add("xr.fan.case", caseM, { tone: "hi", smooth: true, cls: "xr-case", at: [F.x, 0, (F.top + F.bot) / 2] });
const gb = tube([shRing(XRAY.gear.x0, 0.12), shRing(1.17, 0.19), shRing(XRAY.gear.x1, 0.21)], 20, { capStart: true, capEnd: true });
add("xr.gearbox", gb, { tone: "hi", smooth: true, cls: "xr-gear" });
const sx0 = XRAY.eng.x0 + 0.02, sx1 = XRAY.clutch.x0;
add("xr.shaft", tube([shRing(sx0, 0.062), shRing(sx1, 0.062)], 14), { tone: "hi", smooth: true, cls: "xr-shaft", shaft: [sx0, sx1, 0.062] });
for (const f of [0.24, 0.76]) {
const x = lerp(sx0, sx1, f);
add("xr.coupling", tube([shRing(x - 0.05, 0.07), shRing(x - 0.035, 0.1), shRing(x - 0.008, 0.1), shRing(x - 0.004, 0.08), shRing(x + 0.004, 0.08), shRing(x + 0.008, 0.1), shRing(x + 0.035, 0.1), shRing(x + 0.05, 0.07)], 16), { tone: "hi", smooth: true, cls: "xr-coup", shaft: [x - 0.035, x + 0.035, 0.1] });
}
for (const side of [1, -1]) {
const L = ductLine(side);
const rings = L.map((c, i) => {
const a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)];
return { c, axis: V3.unit(V3.sub(b, a)), r: DUCT_R[i] };
});
add("xr.duct", tube(rings, 14), { tone: "hi", smooth: true, cls: "xr-duct", duct: side, at: L[3] });
}
for (const side of [1, -1]) {
const R = stationRings(sideKeys(INLET, side), 2);
const cuts = [0, 5, 10, R.length - 1];
const arc = [0];
for (let i = 1; i < R.length; i++) arc.push(arc[i - 1] + V3.len(V3.sub(R[i].c, R[i - 1].c)));
for (let k = 0; k < 3; k++) {
const seg = R.slice(cuts[k], cuts[k + 1] + 1);
add("xr.inlet", ovalTube(seg, 16), { tone: "hi", smooth: true, cls: "xr-inlet", flow: { kind: "inlet", pts: seg.map((r) => r.c), s0: arc[cuts[k]] } });
}
const A = stationRings(AUXD(side), 2);
add("xr.aux", ovalTube(A, 14), { tone: "hi", smooth: true, cls: "xr-inlet xr-auxd", flow: { kind: "aux", pts: A.map((r) => r.c).concat([[-0.2, side * 0.18, 0.3]]), s0: 0 } });
}
const PL = stationRings(PLENUM, 2);
add("xr.plenum", ovalTube(PL, 22), { tone: "hi", smooth: true, cls: "xr-inlet", flow: { kind: "inlet", pts: [1, -1].map((sd) => [[0.16, sd * 0.34, 0.105], [-0.05, sd * 0.3, 0.115], [-0.29, sd * 0.28, 0.12]]), s0: 3.35 } });
add("xr.fairing", tube([shRing(-0.29, 0.125), shRing(0.1, 0.125), shRing(0.2, 0.075)], 16), { tone: "hi", smooth: true, cls: "xr-inlet xr-fair" });
add("xr.bypass", tube(BYPASS.map(([x, r], i) => ({ c: [x, 0, engZ(x)], axis: [-1, 0, 0], r })), 28), { tone: "hi", smooth: true, cls: "xr-byp", bias: 2 }); // drawn over the engine: a translucent outer wall
return parts;
}
function xrayParts(s, xo) {
if (!XR_STATIC) XR_STATIC = xrayStatic();
const ce = clutchAt(s);
const C = XRAY.clutch, gap = C.gap * (1 - ce);
const parts = XR_STATIC.slice();
const mid = (C.x0 + C.x1) / 2;
const inp = tube([shRing(C.x0, 0.1), shRing(C.x0 + 0.02, 0.17), shRing(mid - 0.004 - gap, 0.17)], 18, { capStart: true, capEnd: true });
const outp = tube([shRing(mid + 0.004, 0.17), shRing(C.x1 - 0.02, 0.17), shRing(C.x1, 0.12)], 18, { capStart: true, capEnd: true });
const cc = ce > 0.5 ? "xr-clutch on" : "xr-clutch";
parts.push({ name: "xr.clutch.in", mesh: inp, xr: true, tone: "hi", smooth: true, cls: "xr " + cc, shaft: [C.x0 + 0.02, mid - 0.004 - gap, 0.17] });
parts.push({ name: "xr.clutch.out", mesh: outp, xr: true, tone: "hi", smooth: true, cls: "xr " + cc });
parts.push({ name: "xr.rotors", mesh: { v: [], f: [], custom: (ctx) => rotorsSvg(s, xo, ctx) }, xr: true, at: [XRAY.fan.x, 0, (XRAY.fan.top + XRAY.fan.bot) / 2], bias: -0.02 });
return parts;
}
function clutchAt(s) { return smooth(0.0, 0.08, s.fan || 0); }
function rotorsSvg(s, xo, ctx) {
const { pr } = ctx, F = XRAY.fan;
const ph = s.fanPhase || 0;
const disc = (z, r, n = 36) => Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2; return pr([F.x + Math.cos(t) * r, Math.sin(t) * r, z]); });
const P = ctx.path;
const blades = (n, z, phase, sweep) => {
let d = "";
for (let i = 0; i < n; i++) {
const t = phase + (i / n) * Math.PI * 2;
const q = (r, tt) => pr([F.x + Math.cos(tt) * r, Math.sin(tt) * r, z]);
d += P([q(0.16, t), q(F.r - 0.05, t + sweep), q(F.r - 0.05, t + sweep + 0.17), q(0.16, t + 0.13)]);
}
return d;
};
const g = [];
g.push(`<path class="xr-disc" d="${P(disc(F.z2, F.r - 0.04))}"/>`);
g.push(`<path class="xr-blade b2" d="${blades(20, F.z2, -ph * 0.92, -0.3)}"/>`);
g.push(`<path class="xr-hub" d="${P(disc(F.z2, 0.16, 20))}"/>`);
const a = pr([F.x, 0, F.z2]), b = pr([F.x, 0, F.z1]);
g.push(`<path class="xr-col" d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}"/>`);
g.push(`<path class="xr-disc" d="${P(disc(F.z1, F.r - 0.04))}"/>`);
g.push(`<path class="xr-blade" d="${blades(16, F.z1, ph, 0.36)}"/>`);
g.push(`<path class="xr-hub" d="${P(disc(F.z1, 0.16, 20))}"/>`);
return `<g class="ac-part xr xr-rot">${g.join("")}</g>`;
}
function xrayExtra(part, s, xo, ctx) {
const { pr, dW, V } = ctx;
if (part.shaft) {
const [x0, x1, r] = part.shaft;
const u = V3.unit(V3.cross(SH_D, [0, 1, 0])), w = V3.cross(SH_D, u);
const ph = xo.shaft || 0;
let d = "";
for (let k = 0; k < 3; k++) {
const t = ph + (k / 3) * Math.PI * 2;
const n = V3.add(V3.mul(u, Math.cos(t)), V3.mul(w, Math.sin(t)));
if (V3.dot(V3.unit(dW(n)), V) < 0.2) continue; // only the stripes on the near side of the tube
const p = pr(V3.add(onShaft(x0), V3.mul(n, r * 1.01))), q = pr(V3.add(onShaft(x1), V3.mul(n, r * 1.01)));
d += `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
}
return d ? `<path class="xr-stripe" d="${d}"/>` : "";
}
if (part.flow) {
const F = part.flow, aux = F.kind === "aux";
const a = aux ? s.aux || 0 : 1;
if (a < 0.02) return "";
const unit = ctx.C.k * M, per = 0.3;
const ph = (aux ? xo.aux : xo.inlet) || 0;
const off = ((((F.s0 - ph) % per) + per) % per) * unit;
const lines = Array.isArray(F.pts[0][0]) ? F.pts : [F.pts];
const d = lines.map((L) => "M" + L.map((p) => { const q = pr(p); return q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("L")).join("");
return `<path class="xr-flow xr-iflow" opacity="${(0.75 * a).toFixed(2)}" stroke-dasharray="${(0.12 * unit).toFixed(1)} ${(0.18 * unit).toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" d="${d}"/>`;
}
if (part.duct && s.posts > 0.02) {
const L = ductLine(part.duct).concat([[POST.x, part.duct * POST.y, -0.05]]);
const pts = L.map(pr);
const unit = ctx.C.k * M; // svg units per metre
const dash = 0.16 * unit, gap = 0.12 * unit;
const off = -(((xo.clock || 0) * 1.1) % 0.28) * unit;
const a = Math.min(1, s.posts * Math.max(0.3, s.power || 0));
return `<path class="xr-flow" opacity="${a.toFixed(2)}" stroke-dasharray="${dash.toFixed(1)} ${gap.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" d="M${pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L")}"/>`;
}
return "";
}
function xrayAnchors(s, ctx) {
const { pr, dW, V } = ctx;
const side = V3.dot(dW([0, 1, 0]), V) > 0 ? 1 : -1;
const F = XRAY.fan;
return {
eng: pr([-2.9, 0, engZ(-2.9) + 0.49]),
shaft: pr(V3.add(onShaft(0.3), [0, 0, 0.06])),
clutch: pr(V3.add(onShaft((XRAY.clutch.x0 + XRAY.clutch.x1) / 2), [0, 0, 0.17])),
gear: pr(V3.add(onShaft(1.2), [0, 0, 0.2])),
fan: pr([F.x, 0, F.top]),
up: pr([F.x, 0, F.top + 1]),
duct: pr(ductLine(side)[3]),
engaged: clutchAt(s) > 0.5,
dsi: pr([3.32, side * 1.27, 0.12]),
sduct: pr([1.35, side * 0.9, 0.24]),
aux: pr([0.1, side * 0.31, skinZ(0.1, 0.31) + 0.02]),
};
}
function camera(P) {
const a = (P.azimuth ?? 45) * D2R, e = (P.elevation ?? 30) * D2R;
const k = P.scale * Math.sqrt(1.6); // the kit's UNIT
return { sinA: Math.sin(a), cosA: Math.cos(a), sinE: Math.sin(e), cosE: Math.cos(e), k, o: P.origin };
}
const project = (p, C) => [C.o[0] + (p[0] * C.sinA - p[1] * C.cosA) * C.k, C.o[1] + ((p[0] * C.cosA + p[1] * C.sinA) * C.sinE - p[2] * C.cosE) * C.k];
const viewDir = (C) => [C.cosA * C.cosE, C.sinA * C.cosE, C.sinE];
const lightDir = (C) => V3.unit([-C.sinA, C.cosA, 1.2]);
const BANDS = [0, 0.2, 0.42, 0.62];
const band = (score) => { let t = 0; while (t < BANDS.length && score >= BANDS[t]) t++; return t; };
function bodyToWorld(s) {
const th = s.pitch * D2R, c = Math.cos(th), sn = Math.sin(th);
if (!s.roll) return (p) => [s.x + (p[0] * c - p[2] * sn) * M, s.y + p[1] * M, s.z + (p[0] * sn + p[2] * c) * M];
const r = -s.roll * D2R, cr = Math.cos(r), sr = Math.sin(r);
return (p) => { const y = p[1] * cr - p[2] * sr, z = p[1] * sr + p[2] * cr; return [s.x + (p[0] * c - z * sn) * M, s.y + y * M, s.z + (p[0] * sn + z * c) * M]; };
}
function dirToWorld(s) {
const th = s.pitch * D2R, c = Math.cos(th), sn = Math.sin(th);
if (!s.roll) return (d) => [d[0] * c - d[2] * sn, d[1], d[0] * sn + d[2] * c];
const r = -s.roll * D2R, cr = Math.cos(r), sr = Math.sin(r);
return (d) => { const y = d[1] * cr - d[2] * sr, z = d[1] * sr + d[2] * cr; return [d[0] * c - z * sn, y, d[0] * sn + z * c]; };
}
const f1 = (v) => (Math.round(v * 10) / 10).toString();
const pf1 = (p) => p.t || (p.t = f1(p[0]) + " " + f1(p[1])); // format a projected point once per frame (loop 1)
const pathOf = (pts) => "M" + pts.map(pf1).join("L") + "Z";
const lineOf = (a, b) => "M" + pf1(a) + "L" + pf1(b);
function edgesOf(mesh) {
if (mesh._edges) return mesh._edges;
const map = new Map();
mesh.f.forEach((face, fi) => face.forEach((a, i) => {
const b = face[(i + 1) % face.length];
const key = a < b ? a + "," + b : b + "," + a;
const e = map.get(key);
if (e) e.faces.push(fi); else map.set(key, { a, b, faces: [fi] });
}));
mesh._edges = [...map.values()];
return mesh._edges;
}
function renderAircraft(s, P, opts = {}) {
const C = camera(P);
const xo = opts.xray && opts.xray.x > 0.001 ? opts.xray : null;
const V = viewDir(C), Lt = lightDir(C);
if (!STATIC) STATIC = staticParts();
const toW = bodyToWorld(s), dW = dirToWorld(s);
const { parts: moving, noz } = movingParts(s);
const all = [...STATIC, ...moving];
if (xo) all.push(...xrayParts(s, xo));
const drawn = [];
for (const part of all) {
const wv = part.mesh.v.map(toW);
const c = wv.length ? centroid(wv) : toW(part.at || [0, 0, 0]);
drawn.push({ part, wv, key: V3.dot(c, V) + (part.bias || 0) });
}
orderParts(drawn, V, dW);
const out = [];
const pr = (p) => project(toW(p), C);
const ctx = { pr, toW, dW, V, C, s, path: pathOf };
for (const { part, wv } of drawn) {
const mesh = part.mesh;
if (mesh.custom) { out.push(mesh.custom(ctx)); continue; }
const sv = wv.map((p) => project(p, C));
if (part.flat) { // the fan face: cavity ellipse + spinning blades
const g = [];
g.push(`<path class="ac-cav" d="${pathOf(mesh.f[0].map((i) => sv[i]))}"/>`);
const fan = mesh.fan;
const blades = [];
for (let i = 0; i < 9; i++) {
const a = fan.phase + (i / 9) * Math.PI * 2;
const p0 = toW([fan.c[0] + Math.cos(a) * 0.14, Math.sin(a) * 0.14, fan.c[2]]);
const p1 = toW([fan.c[0] + Math.cos(a + 0.35) * fan.r * 0.92, Math.sin(a + 0.35) * fan.r * 0.92, fan.c[2]]);
blades.push(lineOf(project(p0, C), project(p1, C)));
}
const hub = [];
for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; hub.push(project(toW([fan.c[0] + Math.cos(a) * 0.14, Math.sin(a) * 0.14, fan.c[2]]), C)); }
g.push(`<path class="iso-line ac-blade" data-tone="mid" d="${blades.join("")}"/>`);
g.push(`<path class="ac-hub" d="${pathOf(hub)}"/>`);
g.push(`<path class="iso-line" data-tone="hi" d="${pathOf(mesh.f[0].map((i) => sv[i]))}"/>`);
out.push(`<g class="ac-part" opacity="${(part.alpha ?? 1).toFixed(2)}">${g.join("")}</g>`);
continue;
}
const g = partSvg(part, wv, sv, V, Lt, pathOf, lineOf, { dW, pr, toW });
if (xo && part.xr) g.push(xrayExtra(part, s, xo, ctx));
out.push(`<g class="ac-part${part.cls ? " " + part.cls : ""}">${g.join("")}</g>`);
}
const exit = toW(noz.exit);
const exitDir = V3.unit(dW(noz.dir));
const vane = (s.vane || 0) * D2R;
const fanExit = toW([1.92, 0, -0.8]);
const fanDir = V3.unit(dW([-Math.sin(vane), 0, -Math.cos(vane)]));
const posts = [1, -1].map((side) => toW([POST.x, side * POST.y, -0.05]));
const planform = PLANFORM.map(toW);
return { svg: out.join(""), exit, exitDir, exitR: noz.r * M, fanExit, fanDir, posts, planform, xr: xo ? xrayAnchors(s, ctx) : null };
}
return { M, SPEC, DECK, RAMP, rampZ, groundAt, SPOT, LANE_Y, visZ, CYCLE, PHASES, TIMES, stateAt, OLEO, surfacesAt, topAt, skinZ, POST, wingBottomZ, wingTopZ, partSvg, nozzleGeometry, XRAY, xrayParts, clutchAt, xrayExtra, xrayAnchors, camera, project, viewDir, lightDir, bodyToWorld, dirToWorld, renderAircraft, V3 };
})();
