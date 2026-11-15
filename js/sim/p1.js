/* Space Syntax: Phase 1 "Launch" run (no DOM, pure, deterministic).
 *
 * The rocket's upper stage pushes your spacecraft toward the Moon (trans-lunar injection, TLI).
 * A rocket's quoted capacity is "the mass it can push through TLI (3,150 m/s)", so we build an
 * upper stage that does exactly that when the payload equals the capacity:
 *
 *   R      = exp(dv_tli / ve)                     ve = Isp x g0, Isp = TUNING.upperStageIsp (hydrogen stage, not the
 *                                                 314 s capsule engine used for the later burns in model.js)
 *   prop   = C x (R-1) / (1 - tankFraction (R-1)) propellant (tanks ride to burnout), same formula as model.js fuelPerKg
 *   dry    = tankFraction x prop                  tanks and plumbing
 *   check  : (C + dry + prop) / (C + dry) = R     so a payload of exactly C gets exactly 3,150 m/s.
 *
 * A payload m then gets dv = ve ln((m + dry + prop) / (m + dry)). Heavier than C: the tanks run
 * dry short of 3,150 m/s. Lighter: we cut the engine as soon as 3,150 m/s is reached.
 * Constant thrust is set so the stage empties in TUNING.burnSeconds.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const D = isNode ? require('../data.js') : root.SS_DATA;
  const M = isNode ? require('../model.js') : root.SS_MODEL;
  const K = isNode ? require('./kit.js') : root.SS_SIMKIT;

  const TUNING = {
    upperStageIsp: 462,               // game value (RL10-class hydrogen upper stage)
    burnSeconds: 600,                 // game value: time for the upper stage to burn all its propellant
    frames: 100,                      // game value
    starThresholds: [0, 0.10, 0.20],  // game value: mass margin fraction. 10% matches the Phase 1 low-margin warning
  };
  const TITLE = 'Launch';
  const fmt = M.fmt;
  // Problems that do NOT stop the run: they make it fail on screen instead.
  const SOFT = new Set(['tooHeavy', 'overBudget', 'noPower']);

  const veUpper = () => TUNING.upperStageIsp * D.ENGINE.g0;
  function stageFor(capacity) {
    const R = Math.exp(D.DV.tli.value / veUpper()), tf = D.ENGINE.tankFraction;
    const prop = capacity * (R - 1) / (1 - tf * (R - 1));
    return { prop, dry: D.ENGINE.tankFraction * prop };
  }

  function fixTooHeavy(state, r, over) {
    const list = D.ROCKETS[state.missionType] || [];
    const bigger = list.filter(x => x.capacity >= r.tli).sort((a, b) => a.capacity - b.capacity)[0];
    const hw = r.lines.filter(l => l.kind === 'hw' && l.mass > 0 && l.label.includes(':')).sort((a, b) => b.mass - a.mass)[0];
    const cut = Math.ceil(over / r.fuelMultiplier);
    const a = bigger ? `Pick ${bigger.title}` : `Cut at least ${fmt(cut)} kg of hardware`;
    const b = hw ? `drop or swap "${hw.label.replace(/\s*\((orbiter|ascent|descent|lander)\)$/, '')}", your heaviest item` : null;
    return bigger && b ? `${a}, or ${b}.` : `${a}${b ? ', for example ' + b : ''}.`;
  }

  function simulate(state, opts) {
    const seed = K.seedOf(opts, 1);
    const blockers = [];
    for (const n of [0, 1]) {
      for (const i of M.validatePhase(state, n).issues) if (i.severity === 'block' && !SOFT.has(i.code)) blockers.push(i);
    }
    if (blockers.length) return K.notReady(1, TITLE, blockers);
    const r = M.evaluate(state);
    if (!r || !r.rocket) return K.notReady(1, TITLE, [{ severity: 'block', code: 'noRocket', message: 'Pick a rocket', phase: 1 }]);

    const C = r.rocket.capacity, m = r.tli;
    const { prop, dry } = stageFor(C);
    const ve = veUpper(), T = TUNING.burnSeconds, mdot = prop / T, thrust = mdot * ve;
    const dvTarget = D.DV.tli.value;
    const m0 = m + dry + prop;
    const dvAt = (t) => ve * Math.log(m0 / (m0 - mdot * t));
    const dvFull = dvAt(T);
    const fits = m <= C;
    const margin = (C - m) / C;

    // Total burn time: until the tanks are empty, or until 3,150 m/s if the payload is light enough.
    let total = T;
    if (fits) total = Math.min(T, (m0 - (m0 / Math.exp(dvTarget / ve))) / mdot);
    const times = K.grid(total, TUNING.frames);
    const frames = times.map(t => {
      const mass = m0 - mdot * t;
      return { t, dv: Math.min(fits ? dvTarget : Infinity, dvAt(t)), prop: Math.max(0, prop - mdot * t), mass, accel: thrust / mass };
    });
    const dvEnd = frames[frames.length - 1].dv;
    const accelMax = Math.max(...frames.map(f => f.accel));
    const fields = [
      { key: 'dv', label: 'Speed gained', unit: 'm/s', max: dvTarget },
      { key: 'prop', label: 'Fuel left', unit: 'kg', max: Math.ceil(prop) },
      { key: 'mass', label: 'Stack mass', unit: 'kg', max: Math.ceil(m0) },
      { key: 'accel', label: 'Acceleration', unit: 'm/s²', max: Math.ceil(accelMax * 10) / 10 },
    ];

    const events = [{ t: 0, kind: 'info', text: `Upper stage ignites with ${fmt(m)} kg of spacecraft on top.` }];
    if (r.massGrowth) events.push({ t: 0, kind: 'warn', text: `Mass growth: hardware came out ${fmt(r.massGrowth * 100)}% heavier than planned.` });
    events.push({ t: total * 0.5, kind: 'info', text: `Halfway: ${fmt(frames[Math.floor(frames.length / 2)].dv)} m/s gained, the stack keeps getting lighter.` });

    // Why it fails, in order of how early it would be noticed.
    let failure = null;
    const over = m - C;
    if (!fits) {
      failure = {
        t: total, code: 'tooHeavy',
        cause: `You ran out of fuel at ${fmt(dvEnd)} m/s, ${fmt(dvTarget - dvEnd)} m/s short of the Moon. Your ship is ${fmt(over)} kg too heavy for ${r.rocket.title}.`,
        fix: fixTooHeavy(state, r, over),
      };
    } else if (r.powerGen < r.powerNeed) {
      failure = {
        t: total, code: 'noPower',
        cause: `The ship reached the Moon, but it makes ${fmt(r.powerGen)} W and needs ${fmt(r.powerNeed)} W. It would go dark.`,
        fix: 'Pick a bigger power source in the Power tab, or drop a power hungry instrument.',
      };
    } else if (r.overBudget) {
      const by = r.totalCost - r.budget;
      failure = {
        t: total, code: 'overBudget',
        cause: `The launch works, but the mission costs $${fmt(r.totalCost)}M and your budget is $${fmt(r.budget)}M. Over by $${fmt(by)}M.`,
        fix: `Pick a cheaper rocket or drop an instrument. You need to save $${fmt(Math.ceil(by))}M.`,
      };
    }
    if (failure) {
      events.push({ t: total, kind: 'fail', text: failure.cause });
      if (!fits) { // also tell about the other problems
        if (r.overBudget) events.push({ t: 0, kind: 'warn', text: `Also over budget by $${fmt(r.totalCost - r.budget)}M.` });
      }
    } else {
      events.push({ t: total, kind: 'success', text: `Engine cut at ${fmt(dvTarget)} m/s. You are on your way to the Moon with ${fmt(margin * 100, 1)}% mass to spare.` });
    }

    const math = {
      title: 'Rocket equation for the upper stage',
      steps: [
        { eq: 've = Isp × g₀', num: `${TUNING.upperStageIsp} s (hydrogen upper stage) × ${D.ENGINE.g0} = ${fmt(ve)} m/s` },
        { eq: 'Stage sized so a full-capacity payload gets exactly Δv(TLI)', num: `${fmt(C)} kg → ${fmt(dvTarget)} m/s, so fuel = ${fmt(prop)} kg, tanks = ${fmt(dry)} kg` },
        { eq: 'Δv = ve × ln(m₀ / m_f)', num: `${fmt(ve)} × ln(${fmt(m0)} / ${fmt(m0 - prop)}) = ${fmt(dvFull)} m/s with your ${fmt(m)} kg` },
        { eq: 'Needed', num: `${fmt(dvTarget)} m/s, ${fits ? 'enough' : fmt(dvTarget - dvFull) + ' m/s short'}` },
      ],
      src: D.DV.tli.src,
    };

    return K.result({
      phase: 1, title: TITLE, seed, ok: !failure,
      time: { unit: 's', total }, fields, frames, events, failure,
      score: { label: 'Mass margin', value: K.round(margin, 4), unit: 'fraction of rocket capacity', thresholds: TUNING.starThresholds, higherIsBetter: true },
      math,
    });
  }

  const P = { phase: 1, title: TITLE, simulate, TUNING };
  if (isNode) module.exports = P; else root.SS_SIM_P1 = P;
})(typeof window !== 'undefined' ? window : globalThis);
