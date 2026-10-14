// F-35B 跟拍页 · 合成发动机声音（示意，非真实录音）。
// Loaded lazily (lab/sound.html → ../shared/sound.js) the first time 「声音」 is turned on. Web Audio synthesis only:
// no audio files, no samples. Every number below is ILLUSTRATIVE, chosen to read clearly and stay comfortable on
// laptop speakers; none is a measured F135 / LiftFan frequency, RPM or blade count.
//
// F35Sound(ctx, stateAt, CYCLE) -> { frame(T, playing, zoom, vis), on(), off(), at(T, when, gain), table }
//   ctx      an AudioContext (live) or OfflineAudioContext (preview render)
//   stateAt  the page's own timeline (MODEL.stateAt): power, fan, nozzle, posts are read from it
//   frame()  called by the page every drawn frame: T = cycle time, playing = clock running, zoom = follow-camera
//            zoom (closer = louder), vis = the jet's on-screen fade (loop seam, phase jumps)
(function () {
  "use strict";
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  // ---- the timeline, sampled once at 60 Hz, with the lags a real machine has (illustrative time constants) ----
  // The page's model jumps where the animation cuts (10.44 s: the pass begins with the lift fan already stopped;
  // 17.94 s: the run-in begins with it already turning). The sound does not cut: the fan coasts down after the
  // clutch releases and spins up after it re-engages, the core spools between power settings.
  const HZ = 60;
  const TAU = { coreUp: 0.45, coreDown: 0.9, fanUp: 0.6, fanDown: 2.2, posts: 0.15, rate: 0.08 };
  function buildTable(stateAt, CYCLE) {
    const n = Math.ceil(CYCLE * HZ), dt = 1 / HZ;
    const core = new Float32Array(n), fan = new Float32Array(n), noz = new Float32Array(n), rate = new Float32Array(n), posts = new Float32Array(n);
    let c = 0.16, f = 0.25, p = 0, r = 0, prevN = stateAt(0).nozzle;
    for (let pass = 0; pass < 2; pass++) { // second pass = steady loop (the lags carry over the seam)
      for (let i = 0; i < n; i++) {
        const s = stateAt(i * dt);
        const tc = s.power > c ? TAU.coreUp : TAU.coreDown, tf = s.fan > f ? TAU.fanUp : TAU.fanDown;
        c += (s.power - c) * (1 - Math.exp(-dt / tc));
        f += (s.fan - f) * (1 - Math.exp(-dt / tf));
        p += (s.posts - p) * (1 - Math.exp(-dt / TAU.posts));
        let d = (s.nozzle - prevN) / dt; prevN = s.nozzle;
        if (Math.abs(d) > 60) d = 0; // a timeline cut, not a swivel (the 3BSM turns at most 95° in 2.5 s = 38°/s)
        r += (Math.abs(d) - r) * (1 - Math.exp(-dt / TAU.rate));
        if (pass) { core[i] = c; fan[i] = f; noz[i] = s.nozzle; rate[i] = r; posts[i] = p; }
      }
    }
    return { n, core, fan, noz, rate, posts };
  }
  function look(tab, T) {
    const x = (((T * HZ) % tab.n) + tab.n) % tab.n, i = Math.floor(x), j = (i + 1) % tab.n, u = x - i;
    const L = (a) => a[i] + (a[j] - a[i]) * u;
    return { core: L(tab.core), fan: L(tab.fan), noz: L(tab.noz), rate: L(tab.rate), posts: L(tab.posts) };
  }

  // ---- parameters (illustrative) -------------------------------------------------------------------------
  const P = {
    master: 0.2,            // modest: about -14 dBFS peak on the loudest moment (short take-off thrust, posts open)
    // F135 core: low rumble (filtered noise + a soft triangle "body") and broadband roar (noise, low-pass opens with power)
    roarLP: [260, 2400],    // Hz, low-pass cutoff at idle … full power
    roarGain: 0.9,          // × power^1.6
    rumbleLP: 110,          // Hz
    rumbleGain: 2.2,        // × power
    bodyHz: [30, 46],       // Hz, triangle under the rumble, idle … full
    bodyGain: 0.1,
    whineHz: [700, 1250],   // Hz, a faint compressor tone (illustrative, not an F135 blade-pass frequency)
    whineGain: 0.006,
    // lift fan: blade-pass tone + 2nd harmonic + a bandpassed buzz amplitude-modulated at "shaft rate".
    // Pitched for listening comfort; NOT the real LiftFan RPM or blade count.
    fanBP: 420,             // Hz, blade-pass tone at full fan speed (scales with fan speed)
    fanToneGain: 0.12,      // sawtooth, × speed^2
    fanH2Gain: 0.045,       // sine at 2 × blade-pass
    fanBuzzQ: 2.2, fanBuzzGain: 1.0,
    fanAM: 24,              // Hz at full speed, depth 0.35: the "buzz" texture
    // 3BSM swivel: a band of noise whose centre follows the nozzle angle, audible only while it turns
    swHz: [380, 1900],      // Hz at 0° … 95°
    swQ: 5, swGain: 1.5,    // × (rate / 38°/s)
    dirLP: [7000, 4200],    // Hz, a gentle low-pass on the core as the nozzle turns down (0° … 95°)
    // roll posts: faint high hiss while they are open
    postHP: 3200, postGain: 0.14,
    // follow camera: closer = louder, √zoom, clamped
    zoomRef: 3.0, zoomMin: 0.45, zoomMax: 1.05,
  };

  function F35Sound(ctx, stateAt, CYCLE) {
    const tab = buildTable(stateAt, CYCLE);
    const sr = ctx.sampleRate;
    // 4 s of white noise, looped; two sources read it at different offsets so the layers are decorrelated
    const buf = ctx.createBuffer(1, sr * 4, sr), ch = buf.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < ch.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; ch[i] = seed / 2147483648 - 1; }
    const noise = (off) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, off); return s; };
    const G = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    const F = (type, f, q) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; };
    const O = (type, f) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start(); return o; };

    const out = ctx.createDynamicsCompressor();
    out.threshold.value = -16; out.ratio.value = 3; out.attack.value = 0.02; out.release.value = 0.3;
    out.connect(ctx.destination);
    const master = G(0); master.connect(out); // play state × camera distance × master level
    const nA = noise(0), nB = noise(1.7);

    // F135 core
    const coreBus = G(1); coreBus.connect(master);
    const dir = F("lowpass", P.dirLP[0], 0.5); dir.connect(coreBus);
    const roarF = F("lowpass", P.roarLP[0], 0.5), roarG = G(0); nA.connect(roarF).connect(roarG).connect(dir);
    const rumF = F("lowpass", P.rumbleLP, 0.9), rumG = G(0); nA.connect(rumF).connect(rumG).connect(dir);
    const body = O("triangle", P.bodyHz[0]), bodyG = G(0); body.connect(bodyG).connect(dir);
    const whine = O("sine", P.whineHz[0]), whineG = G(0); whine.connect(whineG).connect(dir);
    // lift fan
    const fanBus = G(1); fanBus.connect(master);
    const fanT = O("sawtooth", P.fanBP), fanTF = F("lowpass", 1500, 0.7), fanTG = G(0); fanT.connect(fanTF).connect(fanTG).connect(fanBus);
    const fanH = O("sine", 2 * P.fanBP), fanHG = G(0); fanH.connect(fanHG).connect(fanBus);
    const buzzF = F("bandpass", 2 * P.fanBP, P.fanBuzzQ), buzzAM = G(0.65), buzzG = G(0);
    nB.connect(buzzF).connect(buzzAM).connect(buzzG).connect(fanBus);
    const lfo = O("sine", P.fanAM), lfoD = G(0.35); lfo.connect(lfoD).connect(buzzAM.gain);
    // 3BSM swivel
    const swBus = G(1); swBus.connect(master);
    const swF = F("bandpass", P.swHz[0], P.swQ), swG = G(0); nB.connect(swF).connect(swG).connect(swBus);
    // roll posts
    const poBus = G(1); poBus.connect(master);
    const poF = F("highpass", P.postHP, 0.7), poG = G(0); nB.connect(poF).connect(poG).connect(poBus);

    const lerp = (a, u) => a[0] + (a[1] - a[0]) * u;
    const set = (param, v, when, tc) => param.setTargetAtTime(v, when, tc);
    // the layers for cycle time T, ramped in from `when`; level = master gain for this moment (0 = silent)
    function at(T, when, level, tc = 0.04) {
      const L = look(tab, T), p = clamp(L.core, 0, 1), f = clamp(L.fan, 0, 1);
      set(roarF.frequency, lerp(P.roarLP, Math.pow(p, 1.2)), when, tc);
      set(roarG.gain, P.roarGain * Math.pow(p, 1.6), when, tc);
      set(rumG.gain, P.rumbleGain * p, when, tc);
      set(body.frequency, lerp(P.bodyHz, p), when, tc);
      set(bodyG.gain, P.bodyGain * p, when, tc);
      set(whine.frequency, lerp(P.whineHz, p), when, tc);
      set(whineG.gain, P.whineGain * p * p, when, tc);
      set(dir.frequency, lerp(P.dirLP, clamp(L.noz / 95, 0, 1)), when, tc);
      const bp = P.fanBP * Math.max(f, 0.02);
      set(fanT.frequency, bp, when, tc); set(fanH.frequency, 2 * bp, when, tc); set(buzzF.frequency, 2 * bp + 150, when, tc);
      set(lfo.frequency, P.fanAM * Math.max(f, 0.05), when, tc);
      set(fanTG.gain, P.fanToneGain * f * f, when, tc);
      set(fanHG.gain, P.fanH2Gain * f * f, when, tc);
      set(buzzG.gain, P.fanBuzzGain * f * f, when, tc);
      set(swF.frequency, lerp(P.swHz, clamp(L.noz / 95, 0, 1)), when, tc);
      set(swG.gain, P.swGain * clamp(L.rate / 38, 0, 1) * (0.4 + 0.6 * p), when, tc);
      set(poG.gain, P.postGain * clamp(L.posts, 0, 1) * p, when, tc);
      set(master.gain, level, when, level > 0 ? 0.1 : 0.2);
      return L;
    }
    const distGain = (zoom) => clamp(Math.sqrt((zoom || P.zoomRef) / P.zoomRef), P.zoomMin, P.zoomMax);

    // live: the page calls frame() every drawn frame. Paused = fade out; a scrub while paused sounds for a moment.
    let enabled = false, lastT = null, scrubUntil = 0, lastCall = 0, timer = 0;
    function frame(T, playing, zoom, vis) {
      if (!enabled) return;
      const now = ctx.currentTime;
      if (!playing && lastT !== null && Math.abs(T - lastT) > 1e-3) scrubUntil = now + 0.3;
      lastT = T; lastCall = now;
      const audible = playing || now < scrubUntil;
      at(T, now, audible ? P.master * distGain(zoom) * clamp(vis ?? 1, 0, 1) : 0);
    }
    // the page draws nothing while paused and settled (or off screen): no frame -> fade out
    function watch() { if (enabled && ctx.currentTime - lastCall > 0.25) set(master.gain, 0, ctx.currentTime, 0.2); }
    const onVis = () => { if (!enabled) return; document.hidden ? ctx.suspend() : ctx.resume(); };
    function on() {
      enabled = true; lastT = null; ctx.resume();
      if (!timer) timer = setInterval(watch, 150);
      document.addEventListener("visibilitychange", onVis);
    }
    function off() {
      enabled = false; set(master.gain, 0, ctx.currentTime, 0.06);
      clearInterval(timer); timer = 0;
      document.removeEventListener("visibilitychange", onVis);
      setTimeout(() => { if (!enabled) ctx.suspend(); }, 400);
    }
    const buses = { core: coreBus, fan: fanBus, swivel: swBus, posts: poBus };
    return { frame, on, off, at, distGain, buses, table: tab, P, level: () => master.gain.value };
  }

  // offline preview: render `dur` seconds of the timeline from t0, playing, at the follow camera's zoom (zoomAt(t))
  // solo: render one layer only (core | fan | swivel | posts), for checking each layer's timing on a spectrogram
  F35Sound.render = function (stateAt, CYCLE, t0, dur, zoomAt, rate = 44100, solo) {
    const oc = new OfflineAudioContext(1, Math.ceil(dur * rate), rate);
    const S = F35Sound(oc, stateAt, CYCLE);
    if (solo) for (const k in S.buses) S.buses[k].gain.value = k === solo ? 1 : 0;
    for (let i = 0; i <= dur * 60; i++) {
      const t = i / 60, z = zoomAt ? zoomAt(t0 + t) : P.zoomRef;
      const fadeIn = Math.min(1, t / 0.4);
      S.at(t0 + t, t, P.master * S.distGain(z) * fadeIn);
    }
    return oc.startRendering();
  };
  window.F35Sound = F35Sound;
})();
