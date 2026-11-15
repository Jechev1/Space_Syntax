/* Space Syntax: Phase 3 simulator, "Fly to the Moon".
 *
 * The player picks a delta-v margin. Every burn is fuelled for dv x (1 + margin). We fly the trip out and down:
 * the rocket does TLI, then mid-course corrections, LOI and the descent, ending at touchdown. The return home
 * (ascent, TEI or the direct burn) belongs to Phase 7, which draws from the same margin with the same navigation
 * dispersion (D.RETURN.dispersion, drawn as disp x random 0..1 like returnBurns in model.js).
 *
 * Mid-course corrections are paid from a small fixed allowance that is part of the plan (TUNING.tcmAllowance),
 * not from the margin. The plan also carries a small navigation allowance (TUNING.navAllowance of the needed dv)
 * on top of the pool, so the minimum margin of every difficulty flies reliably. LOI and the descent each cost their nominal dv plus a seeded dispersion. They are paid
 * from the planned pool (dv x (1 + margin)); if the pool hits zero the run stops there.
 *
 * Score: margin reserve left after the burns flown here, as a fraction of the dv the mission needs. Leftover
 * above TUNING.sweetSpot counts against you at half weight (extra fuel is extra mass).
 *
 * The run also fails, with the engine's own cause, whenever validatePhase(state, 3) blocks (too heavy, over
 * budget, margin under the flight rule), so the animation never contradicts the GO / NO GO check.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const D = isNode ? require('../data.js') : root.SS_DATA;
  const M = isNode ? require('../model.js') : root.SS_MODEL;
  const K = isNode ? require('./kit.js') : root.SS_SIMKIT;

  const TUNING = {
    burnHours: 0.5,        // game value: how long a burn lasts on the clock
    tcmMax: 5,             // m/s, game value: size of one mid-course correction (Apollo-era TCMs were a few m/s)
    navAllowance: 0.02,    // game value: the plan also carries 2% of the needed dv for burn errors (cadet dispersion is 2%)
    tcmAllowance: 10,      // m/s, game value: fixed plan allowance that pays the two corrections, not the margin
    pathBulgeKm: 70000,    // game value: how far the drawn path bows away from the straight line
    orbitRadiusKm: 9000,   // game value: drawn radius around the Moon (real Moon radius is 1,737 km)
    sweetSpot: 0.05,       // game value: reserve fraction that is worth the fuel mass
    thresholds: [0.0, 0.01, 0.025], // game values: 1, 2, 3 stars
    samples: 120,
  };

  const FIELDS = [
    { key: 'progress', label: 'Trip progress', unit: '', max: 1 },
    { key: 'x', label: 'Position x (Earth to Moon)', unit: 'km', max: D.MOON.distanceKm + TUNING.orbitRadiusKm },
    { key: 'y', label: 'Position y', unit: 'km', max: TUNING.pathBulgeKm + TUNING.orbitRadiusKm },
    { key: 'reserve', label: 'Delta-v reserve', unit: 'm/s', max: 12000 },
    { key: 'dvUsed', label: 'Delta-v used', unit: 'm/s', max: 12000 },
    { key: 'leg', label: 'Leg number', unit: '', max: 8 },
  ];

  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  const NOT_READY = ['noQuestion', 'noMeasure', 'noMissionType', 'noMission', 'noRocket'];
  function blockersFor(state) {
    const out = [];
    for (const n of [0, 3]) out.push(...M.validatePhase(state, n).issues.filter(i => i.severity === 'block' && NOT_READY.includes(i.code)));
    return out;
  }

  /** Engine verdict: every other blocking issue of validatePhase(3) fails the run, with a fix. */
  function verdictFailures(state) {
    const need = M.minMargin(state);
    return M.validatePhase(state, 3).issues.filter(i => i.severity === 'block' && !NOT_READY.includes(i.code)).map(i => {
      let fix = 'Fix this in Phase 1 or 3.';
      if (i.code === 'lowDvMargin') fix = `Raise your margin to ${Math.round(need * 100)}%.`;
      else if (i.code === 'tooHeavy') fix = 'Pick a bigger rocket, or lower the margin so you carry less fuel.';
      else if (i.code === 'overBudget') fix = 'Pick a cheaper rocket or lower the margin to save money.';
      return { code: i.code, cause: i.message + '.', fix };
    });
  }

  /** Ordered legs of the trip: coasts, burns and stays. s is the position along the Earth-Moon path (0 Earth, 1 Moon). */
  function legsFor(state, plan, rand) {
    const transitH = D.LIFE.transitDays * 24;
    const disp = D.RETURN.dispersion[state.difficulty || 'engineer'] || 0;
    const err = () => disp * rand(); // same distribution as returnBurns in model.js
    const tcm = () => Math.round(TUNING.tcmMax * rand() * 10) / 10;
    const legs = [];
    const add = (l) => legs.push(Object.assign({ hours: TUNING.burnHours, dv: 0 }, l));
    add({ id: 'tli', label: 'Rocket TLI burn', kind: 'burn', byRocket: true, where: 'path', s0: 0, s1: 0, side: 1 });
    add({ id: 'out1', label: 'Coast to the Moon', kind: 'coast', hours: transitH / 2, where: 'path', s0: 0, s1: 0.5, side: 1 });
    add({ id: 'tcm1', label: 'Course correction', kind: 'burn', mid: true, dv: tcm(), where: 'path', s0: 0.5, s1: 0.5, side: 1 });
    add({ id: 'out2', label: 'Coast to the Moon', kind: 'coast', hours: transitH / 2, where: 'path', s0: 0.5, s1: 1, side: 1 });
    add({ id: 'tcm2', label: 'Course correction', kind: 'burn', mid: true, dv: tcm(), where: 'path', s0: 1, s1: 1, side: 1 });
    for (const b of plan.burns) {
      if (b.key !== 'loi' && b.key !== 'descent') continue;
      add({ id: b.key, label: b.label, kind: 'burn', dv: b.dv * (1 + err()), nominal: b.dv, where: 'moon', s0: 1, s1: 1, side: -1 });
    }
    add({ id: 'settle', label: 'Touchdown', kind: 'coast', hours: 1, where: 'moon' });
    let t = 0;
    legs.forEach((l, i) => { l.index = i; l.t0 = t; t += l.hours; l.t1 = t; });
    const orbitT0 = (legs.find(l => l.where === 'moon') || { t0: 0 }).t0;
    legs.forEach(l => { l.orbitT0 = orbitT0; });
    return { legs, total: t };
  }

  /** Dot position in an Earth-Moon frame: Earth at x = 0, Moon at x = distance. */
  function position(leg, t) {
    const dist = D.MOON.distanceKm;
    if (leg.where === 'moon') {
      const a = (t - leg.orbitT0) / 6; // slow drawn orbit, starts where the path arrives
      return { x: dist - TUNING.orbitRadiusKm * (1 - Math.cos(a)), y: TUNING.orbitRadiusKm * Math.sin(a) };
    }
    const f = leg.hours > 0 ? Math.min(1, Math.max(0, (t - leg.t0) / leg.hours)) : 0;
    const s = leg.s0 + (leg.s1 - leg.s0) * f;
    return { x: dist * s, y: leg.side * TUNING.pathBulgeKm * Math.sin(Math.PI * s) };
  }

  function simulate(state, opts) {
    const title = 'Fly to the Moon';
    const blockers = blockersFor(state);
    if (blockers.length) return K.notReady(3, title, blockers);
    const seed = K.seedOf(opts, 1);
    const rand = M.rng(seed ^ 0x3a7);
    const plan = M.flightPlan(state);
    const margin = plan.margin, needMargin = M.minMargin(state);
    const pool = plan.dvPlanned;
    const cap = pool + TUNING.navAllowance * plan.dvRequired; // pool plus the fixed navigation allowance
    const { legs, total } = legsFor(state, plan, rand);
    const spenders = legs.filter(l => l.kind === 'burn' && !l.byRocket && !l.mid);
    const tcms = legs.filter(l => l.mid);
    const tcmTotal = tcms.reduce((a, l) => a + l.dv, 0);

    // First burn that empties the shared pool, if any.
    let running = 0, failure = null, endT = total, failLeg = null;
    for (const l of spenders) {
      if (running + l.dv > cap + 1e-6) {
        const short = running + l.dv - cap;
        endT = K.round(l.t0 + l.hours * (cap - running) / l.dv, 3);
        failLeg = l;
        const want = margin + short / plan.dvRequired;
        const fixMargin = D.FLIGHT.marginOptions.find(m => m >= want - 1e-9) || D.FLIGHT.marginOptions[D.FLIGHT.marginOptions.length - 1];
        failure = {
          t: endT, code: 'outOfFuel',
          cause: `The ${l.label.toLowerCase()} needed ${fmt(l.dv)} m/s but only ${fmt(Math.max(0, cap - running))} m/s was left. You were ${fmt(short)} m/s short.`,
          fix: `Raise your margin to ${Math.round(Math.max(fixMargin, needMargin) * 100)}%.`,
          burn: l.id, shortMs: Math.round(short),
        };
        break;
      }
      running += l.dv;
    }
    const finalUsed = failure ? cap : running;
    const extras = spenders.reduce((a, l) => a + (l.dv - l.nominal), 0);
    const marginLeft = cap - plan.dvRequired - extras; // what the margin still holds for Phases 5 and 7
    const verdicts = verdictFailures(state);
    if (!failure && verdicts.length) {
      failure = { t: total, code: verdicts[0].code, cause: verdicts[0].cause, fix: verdicts[0].fix };
    }

    const dvAt = (t) => {
      let u = 0;
      for (const l of spenders) { if (t >= l.t1) u += l.dv; else if (t > l.t0) u += l.dv * (t - l.t0) / l.hours; }
      return Math.min(cap, u);
    };

    // Frames: an even grid plus the edges of every burn, clipped at the end of the run.
    const times = new Set(K.grid(endT, TUNING.samples).map(x => K.round(x, 4)));
    for (const l of legs) for (const x of [l.t0, l.t1]) if (x <= endT) times.add(K.round(x, 4));
    times.add(endT);
    const frames = [...times].sort((a, b) => a - b).map(t => {
      const leg = (failLeg && t >= endT) ? failLeg : (legs.find(l => t >= l.t0 && t < l.t1) || legs[legs.length - 1]);
      const p = position(leg, t), u = dvAt(t);
      return { t, progress: total ? t / total : 0, x: p.x, y: p.y, reserve: Math.max(0, pool - u), dvUsed: u, leg: leg.index };
    });
    frames[0].t = 0;

    const events = [];
    events.push({ t: 0, kind: 'info', text: `Fuel is sized as delta-v x (1 + ${Math.round(margin * 100)}%). This margin also pays for hovering in Phase 5 and the trip home in Phase 7.` });
    events.push({ t: 0, kind: 'info', text: 'This run ends at touchdown. The fuel for the trip home is checked in Phase 7.' });
    events.push({ t: 0, kind: 'info', text: `The rocket upper stage does the ${fmt(D.DV.tli.value)} m/s trans-lunar burn. That fuel is not yours.` });
    for (const l of tcms) if (l.t1 <= endT) events.push({ t: l.t1, kind: 'info', text: `Course correction used ${l.dv} m/s from the ${TUNING.tcmAllowance} m/s allowance. Navigation is never perfect.` });
    for (const l of spenders) {
      if (l.t0 >= endT && !(failLeg === l)) break;
      if (failLeg === l) { events.push({ t: endT, kind: 'fail', text: `Out of fuel during the ${l.label.toLowerCase()}. ${failure.shortMs} m/s short.` }); break; }
      const left = Math.max(0, pool - dvAt(l.t1));
      events.push({ t: l.t1, kind: left < pool * 0.03 ? 'warn' : 'info', text: `${l.label} done: ${fmt(l.dv)} m/s used, plan was ${fmt(l.nominal)}. ${fmt(left)} m/s in the pool.` });
    }
    const left = pool - finalUsed, leftFrac = Math.max(0, marginLeft) / plan.dvRequired;
    if (failure && failure.code !== 'outOfFuel') {
      for (const v of verdicts) events.push({ t: total, kind: 'fail', text: v.cause });
    } else if (!failure) {
      events.push({ t: endT, kind: marginLeft < 0 ? 'warn' : 'success', text: marginLeft < 0 ? `Landed, but navigation errors used ${fmt(-marginLeft)} m/s more than your margin holds. Phase 7 may be tight.` : `Landed with ${fmt(marginLeft)} m/s of margin left for Phases 5 and 7.` });
    }

    const value = K.round(Math.min(leftFrac, TUNING.sweetSpot) - 0.5 * Math.max(0, leftFrac - TUNING.sweetSpot), 4);

    const worst = plan.burns.reduce((a, b) => (b.dvPlanned > a.dvPlanned ? b : a), plan.burns[0]);
    const math = {
      title: 'Delta-v budget: real math',
      steps: [
        { eq: 've = Isp x g0', num: `${D.ENGINE.isp} s x ${D.ENGINE.g0} m/s² = ${fmt(M.ve)} m/s` },
        { eq: 'planned dv = needed dv x (1 + margin)', num: `${fmt(plan.dvRequired)} m/s x ${(1 + margin).toFixed(2)} = ${fmt(pool)} m/s` },
        { eq: 'dv = ve x ln(m0 / m1)', num: `${worst.label}: ${fmt(worst.dvPlanned)} m/s needs ${M.fuelPerKg(worst.dvPlanned).toFixed(2)} kg of fuel for each kg that arrives` },
        { eq: 'navigation error = needed dv x dispersion', num: `LOI and descent cost ${fmt(extras)} m/s more than planned. Corrections used ${tcmTotal.toFixed(1)} of ${TUNING.tcmAllowance} m/s allowance` },
        { eq: 'margin left = planned + allowance - needed - errors', num: `${fmt(pool)} + ${fmt(cap - pool)} allowance - ${fmt(plan.dvRequired)} - ${fmt(extras)} = ${fmt(marginLeft)} m/s` },
      ],
      src: 'cev',
    };

    return K.result({
      phase: 3, title, seed, ok: !failure, time: { unit: 'h', total: endT },
      fields: FIELDS, frames, events, failure,
      score: { label: 'Reserve left, not too much', value, unit: 'of needed dv', thresholds: TUNING.thresholds, higherIsBetter: true },
      math,
    });
  }

  const P = { phase: 3, title: 'Fly to the Moon', simulate, TUNING };
  if (isNode) module.exports = P; else root.SS_SIM_P3 = P;
})(typeof window !== 'undefined' ? window : globalThis);
