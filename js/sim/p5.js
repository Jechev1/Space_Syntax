/* Space Syntax: Phase 5 simulator. "Powered descent" run (final approach to touchdown).
 * The verdict (clean, rough, abort) comes from M.landingSim, so the run always agrees with the
 * static model. This file only turns that verdict into a physical 1D descent plus lateral drift.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const D = isNode ? require('../data.js') : root.SS_DATA;
  const M = isNode ? require('../model.js') : root.SS_MODEL;
  const K = isNode ? require('./kit.js') : root.SS_SIMKIT;

  const TUNING = {
    dt: 0.1,                 // s, fixed integration step: game value
    startAlt: 300,           // m, start of final approach: game value
    startVz: -28,            // m/s, descending: game value
    startVx: 8,              // m/s, sideways speed at the start: game value
    startOffset: 60,         // m, distance from the aim point at the start: game value
    hoverAlt: 100,           // m, where the lander hovers to pick a spot: game value
    brakeDecel: 2.0,         // m/s2 of braking beyond gravity: game value
    maxAccel: 3 * D.MOON.gravity, // m/s2 the engine can deliver at throttle 1: game value
    touchLimit: D.LANDING.contact.safeMax, // m/s, safe at or under this (src: landingContact)
    crashAbove: D.LANDING.contact.roughMax, // m/s, a landing faster than this is a crash
    cleanAtLight: 0.4,       // m/s at the light end of the allowed mass range
    cleanAtHeavy: 2.0,       // m/s at the heavy end of the allowed mass range
    roughFloor: 2.15,        // m/s, a rough landing stays over the safe limit after integration error
    roughSpanShort: 0.60,    // m/s added when hover time was only 60% of what the terrain needed
    roughSpanMass: 0.25,     // m/s added from the light end of the mass range to the heavy end
    terminalDecel: 0.25,     // m/s2, how fast the final fall speeds up: game value
    abortMaxSec: 14,         // s of climbing shown after an abort: game value
    lowFuelPct: 20,          // % fuel that triggers the low fuel warning: game value
    stars: [0, 15, 30],      // % fuel left at touchdown for 1, 2, 3 stars: game value
  };
  const G = D.MOON.gravity; // m/s2, src nssdc
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  /** One semi-implicit Euler step. thrustAcc is the engine acceleration along up (m/s2). */
  function step(s, thrustAcc, dt, sideAcc) {
    const az = thrustAcc - G, ax = sideAcc || 0;
    const vz = s.vz + az * dt, vx = s.vx + ax * dt;
    return { alt: s.alt + vz * dt, vz, x: s.x + vx * dt, vx };
  }

  /** Fly one descent: braking, hover for hoverSec, then terminal descent or abort climb. */
  function fly(mode, hoverSec, touchSpeed, lateral, stopAtHover) {
    const T = TUNING, dt = T.dt, rows = [];
    let s = { alt: T.startAlt, vz: T.startVz, x: T.startOffset, vx: T.startVx };
    let t = 0, dv = 0, phase = 'brake', hoverT = 0, abortT = 0, thr = 0, touch = null;
    const marks = {};
    const log = () => rows.push({ t, alt: s.alt, vz: s.vz, x: s.x, dv, thr, hover: hoverT });
    log();
    for (let n = 0; n < 40000; n++) {
      let a = 0, side = 0;
      if (phase === 'brake') {
        const vt = -Math.sqrt(3 * 3 + 2 * T.brakeDecel * Math.max(0, s.alt - T.hoverAlt));
        a = clamp(G + T.brakeDecel + 1.5 * (vt - s.vz), 0, T.maxAccel);
        side = clamp(-s.vx / 3, -1, 1);
        if (s.alt <= T.hoverAlt) { phase = 'hover'; marks.hoverStart = t; }
      } else if (phase === 'hover') {
        a = clamp(G + 0.5 * (T.hoverAlt - s.alt) - 1.2 * s.vz, 0, T.maxAccel);
        side = clamp((lateral(hoverT) - s.vx) / 2, -1.5, 1.5);
        hoverT += dt;
        if (hoverT >= hoverSec) { phase = mode === 'abort' ? 'abort' : 'terminal'; marks.hoverEnd = t + dt; }
      } else if (phase === 'terminal') {
        const vt = -Math.sqrt(touchSpeed * touchSpeed + 2 * T.terminalDecel * Math.max(0, s.alt));
        a = clamp(G + 1.5 * (vt - s.vz), 0, T.maxAccel);
        side = clamp(-s.vx / 2, -1, 1);
      } else { // abort: full throttle, climb away
        a = T.maxAccel; side = 0; abortT += dt;
        if (abortT >= T.abortMaxSec) { t += dt; s = step(s, a, dt, side); dv += a * dt; thr = 1; log(); break; }
      }
      thr = clamp(Math.hypot(a, side) / T.maxAccel, 0, 1);
      const prev = s;
      s = step(s, a, dt, side);
      dv += Math.hypot(a, side) * dt; // delta-v = integral of thrust / mass dt = integral of acceleration dt
      t += dt;
      if (phase === 'terminal' && s.alt <= 0) {
        const f = prev.alt / (prev.alt - s.alt); // fraction of the step before contact
        const sp = Math.abs(prev.vz + (s.vz - prev.vz) * f);
        touch = { speed: sp, t: t - dt + dt * f };
        t = touch.t; s = { alt: 0, vz: -sp, x: s.x, vx: s.vx }; thr = 0; log(); break;
      }
      log();
      if (stopAtHover && phase === 'hover') break;
    }
    return { rows, dv, touch, marks };
  }

  function simulate(state, opts) {
    const title = 'Powered descent';
    const v = M.validatePhase(state, 5);
    if (!v.ok) return K.notReady(5, title, v.issues);
    const seed = K.seedOf(opts, state.landing && state.landing.seed);
    const T = TUNING, L = D.LANDING;
    const sim = M.landingSim(state, seed), site = sim.site;
    const choice = opts && opts.choice, interactive = !!(opts && opts.interactive) && choice !== 'detour' && choice !== 'abort';
    const pAbort = choice === 'abort';
    const hoverOutcome = pAbort ? 'abort' : sim.outcome;
    const need = sim.hoverNeeded, avail = sim.hoverAvailable;
    const r = M.rng((seed ^ 0xd35c) >>> 0);
    const dir0 = r() < 0.5 ? -1 : 1, sideSpeed = 0.8 + 0.4 * site.hazard;
    const flip = 4 + Math.floor(r() * 3);
    const lateral = (ht) => dir0 * sideSpeed * (Math.floor(ht / flip) % 2 === 0 ? 1 : -1);

    const range = L.massRange[state.missionType];
    const mass = M.approachMass(state);
    const tMass = (mass - range.min) / (range.max - range.min);
    const frac = clamp((avail / need - L.roughFraction) / (1 - L.roughFraction), 0, 1);
    const cleanSpeed = T.cleanAtLight + (T.cleanAtHeavy - T.cleanAtLight) * tMass;
    let touchSpeed = hoverOutcome === 'rough'
      ? Math.max(T.roughFloor, T.roughFloor + T.roughSpanShort * (1 - frac) + T.roughSpanMass * tMass)
      : cleanSpeed;
    let outcome = hoverOutcome;
    if (outcome !== 'abort' && touchSpeed > T.crashAbove) outcome = 'crash';
    else if (outcome === 'clean' && touchSpeed > T.touchLimit) outcome = 'rough';
    const hoverSec = pAbort ? 0 : hoverOutcome === 'clean' ? need : avail;

    // Fuel budget: a reference run that hovers for every second the margin pays for, sideways thrust included.
    const budget = fly('clean', avail, Math.min(cleanSpeed, T.touchLimit), lateral).dv;
    const run = fly(outcome === 'abort' ? 'abort' : 'land', hoverSec, touchSpeed, lateral, interactive);
    const ve = M.ve, m0 = mass;
    const mDry = m0 * Math.exp(-budget / ve), fuelMass = m0 - mDry;
    const fuelPct = (dv) => clamp((m0 * Math.exp(-dv / ve) - mDry) / fuelMass * 100, 0, 100);

    const frames = run.rows.map(w => ({
      t: w.t, alt: w.alt, vz: w.vz, x: w.x,
      fuel: fuelPct(w.dv),
      hoverLeft: Math.max(0, avail - w.hover),
      needLeft: Math.max(0, need - w.hover),
      throttle: w.thr, dv: w.dv,
    }));
    const end = run.rows[run.rows.length - 1];
    const total = end.t;
    const fieldList = [
      { key: 'alt', label: 'Altitude', unit: 'm', max: 700 },
      { key: 'vz', label: 'Vertical speed', unit: 'm/s', max: 35 },
      { key: 'x', label: 'Sideways offset', unit: 'm', max: 100 },
      { key: 'fuel', label: 'Final approach fuel', unit: '%', max: 100 },
      { key: 'hoverLeft', label: 'Hover time left in the tank', unit: 's', max: Math.max(60, Math.ceil(avail)) },
      { key: 'needLeft', label: 'Hover time the terrain needs', unit: 's', max: Math.max(60, Math.ceil(need)) },
      { key: 'throttle', label: 'Throttle', unit: '', max: 1 },
      { key: 'dv', label: 'Delta-v spent', unit: 'm/s', max: Math.max(100, Math.ceil(budget)) },
    ];
    if (interactive) {
      const pause = K.result({
        phase: 5, title, seed, ok: false, outcome: 'pending', time: { unit: 's', total }, fields: fieldList, frames,
        events: [{ t: 0, kind: 'info', text: `Final approach over ${site.title.split(' (')[0]}. Braking burn started.` },
          { t: total, kind: 'warn', text: 'Rocks ahead.' }],
        score: null, math: null,
      });
      pause.decision = {
        t: total, code: 'rocksAhead', prompt: 'Rocks ahead.', marginLeft: Math.round(avail * G),
        options: [{ id: 'detour', label: 'Take the detour', dvCost: Math.round(need * G) }, { id: 'abort', label: 'Abort descent', dvCost: 0 }],
      };
      return pause;
    }
    const events = [];
    const hs = run.marks.hoverStart, he = run.marks.hoverEnd;
    events.push({ t: 0, kind: 'info', text: `Final approach over ${site.title.split(' (')[0]}. Braking burn started.` });
    if (hs != null) {
      events.push({ t: hs, kind: 'info', text: `Hover at ${T.hoverAlt} m. Scan: ${site.lroc.toLowerCase()}.` });
      events.push({ t: Math.min(total, hs + 2), kind: site.hazard > 1 ? 'warn' : 'info', text: `Ground: ${site.lola.toLowerCase()}.` });
      const hz = Math.min(site.hazard + 1, 3);
      for (let i = 1; i <= hz; i++) {
        const th = hs + (hoverSec * i) / (hz + 1);
        events.push({ t: th, kind: 'warn', text: i % 2 ? 'Boulder ahead! Sliding sideways.' : 'Crater edge below. Moving over.' });
      }
    }
    const lowIdx = frames.findIndex(f => f.fuel <= T.lowFuelPct);
    if (lowIdx > 0) events.push({ t: frames[lowIdx].t, kind: 'warn', text: `Fuel low: ${T.lowFuelPct}% left.` });
    const fixMargin = Math.ceil(Math.max(0, (need - L.baseHoverSec) * G / D.DV.descent.value) * 100 / 5) * 5;
    let failure = null, ok = true, out = 'success';
    const touchTxt = run.touch ? run.touch.speed : 0;
    if (outcome === 'clean') {
      events.push({ t: he, kind: 'success', text: 'Safe spot found. Starting the final descent.' });
      events.push({ t: total, kind: 'success', text: `Contact light! Touchdown at ${K.round(touchTxt, 1)} m/s.` });
    } else if (outcome === 'rough') {
      out = 'partial';
      events.push({ t: he, kind: 'warn', text: 'Hover fuel is gone. Settling for the nearest ground.' });
      events.push({ t: total, kind: 'warn', text: `Contact light! Hard landing at ${K.round(touchTxt, 1)} m/s, over the safe limit of ${T.touchLimit} m/s. The lander is damaged.` });
    } else if (outcome === 'crash') {
      ok = false; out = 'fail';
      events.push({ t: he, kind: 'fail', text: `Contact light! Impact at ${K.round(touchTxt, 1)} m/s, above ${T.crashAbove} m/s. The lander is wrecked.` });
      failure = {
        t: total, code: 'hardImpact',
        cause: `The lander hit at ${K.round(touchTxt, 1)} m/s. Anything above ${T.crashAbove} m/s wrecks it.`,
        fix: `Lighten the lander into the ${K.round(range.min, 0)}–${K.round(range.max, 0)} kg range, or keep more hover fuel.`,
      };
    } else if (pAbort) {
      ok = false; out = 'fail';
      events.push({ t: he, kind: 'fail', text: 'You aborted the descent. Climbing back to orbit.' });
      failure = {
        t: he, code: 'playerAbort',
        cause: 'You chose to abort when rocks showed up, so the lander climbed back to orbit.',
        fix: `Raise your Phase 3 margin to about ${fixMargin}% or pick an easier site, so you can afford the detour.`,
      };
    } else {
      ok = false; out = 'fail';
      events.push({ t: he, kind: 'fail', text: 'Abort! Fuel for hovering is gone. Climbing back to orbit.' });
      failure = {
        t: he, code: 'noHoverFuel',
        cause: `This site needed about ${K.round(need, 0)} s of hovering but your fuel gave only ${K.round(avail, 0)} s.`,
        fix: `Raise your Phase 3 margin to about ${fixMargin}% or pick an easier site.`,
      };
    }
    const finalFuel = fuelPct(end.dv);
    const score = { label: 'Fuel left at touchdown', value: K.round(ok ? finalFuel : 0, 1), unit: '%', thresholds: T.stars.slice(), higherIsBetter: true };
    const math = M.landingMath(state, sim);
    math.steps.push(
      { eq: 'v = v0 + (a - g) · dt', num: `a = engine acceleration, g = ${G} m/s², dt = ${T.dt} s each step` },
      { eq: 'Δv = ∫ a dt', num: `${K.round(end.dv, 0)} m/s spent in this run` },
      { eq: 'm = m0 · e^(−Δv / ve)', num: `m0 = ${K.round(m0, 0)} kg, the lander you designed. ve = ${K.round(ve, 0)} m/s, so ${K.round(finalFuel, 0)}% of the final approach fuel is left (sideways thrust included)` },
      { eq: `safe landing: v ≤ ${T.touchLimit} m/s`, src: 'landingContact', num: `Safe at ${T.touchLimit} m/s or under, rough up to ${T.crashAbove} m/s, and a crash above that. ` + (!ok && outcome !== 'crash' ? 'You never reached the ground.' : touchTxt <= T.touchLimit ? `You touched down at ${K.round(touchTxt, 1)} m/s: safe.` : touchTxt <= T.crashAbove ? `You touched down at ${K.round(touchTxt, 1)} m/s: over the safe limit, the lander is damaged.` : `You touched down at ${K.round(touchTxt, 1)} m/s: above ${T.crashAbove} m/s, the lander is wrecked.`) },
    );
    const res = K.result({
      phase: 5, title, seed, ok, outcome: out, time: { unit: 's', total },
      fields: fieldList,
      frames, events, failure, score, math,
    });
    if (out === 'partial') res.stars = Math.min(res.stars, 1);
    res.landing = { outcome, touchSpeed: K.round(touchTxt, 3), mass: K.round(m0, 1), hoverNeeded: sim.hoverNeeded, hoverAvailable: sim.hoverAvailable };
    return res;
  }

  const P = { phase: 5, title: 'Powered descent', simulate, step, TUNING };
  if (isNode) module.exports = P; else root.SS_SIM_P5 = P;
})(typeof window !== 'undefined' ? window : globalThis);
