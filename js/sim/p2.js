/* Space Syntax: Phase 2 "Mission days" run (no DOM, pure, deterministic).
 *
 * Walks the crew through the trip day by day and draws down oxygen, food and water at the real
 * NASA BVAD daily rates (D.LIFE.perCrewDay). Supplies are loaded exactly as M.lifeSupport sizes
 * them, in two piles: the orbiter pile and the surface pile (landing crew only, days on the Moon).
 *
 *   days 0-3   outbound, whole crew on the ship
 *   days 3-6   landing crew on the surface (surface pile), the rest in orbit (orbiter pile)
 *   days 6-9   whole crew home
 *   after that extra days (state.events.extraDays, plus a storm delay if one hits unannounced)
 *
 * Solar storm: if the Phase 3 storm event was already played, it hits on a seeded day. If not,
 * there is a TUNING.stormChance chance that one hits anyway and costs a day, spent on the ship.
 * The crew builds a shelter out of food and water bags (NASA plan, src: radiation). It needs
 * TUNING.shelterKgPerCrew of food plus water still on board when the storm hits.
 *
 * Score: see scoreOf below.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const D = isNode ? require('../data.js') : root.SS_DATA;
  const M = isNode ? require('../model.js') : root.SS_MODEL;
  const K = isNode ? require('./kit.js') : root.SS_SIMKIT;

  const TUNING = {
    dt: 0.25,                 // game value: days per frame
    stormChance: 0.35,        // game value: chance of an unannounced storm
    stormDelayDays: 1,        // game value: the Phase 3 storm event also costs 1 day
    shelterKgPerCrew: 10,     // game value: food plus water bags needed per person (NASA says "supplies", gives no number)
    loopWaterDays: 3,         // game value: days of full water per person circulating in the recycler loop and its tanks
    safeLeftover: 0.10,       // game value: leftover fraction counted as a safe margin
    wasteFree: 0.30,          // game value: leftover mass fraction allowed before it counts as waste
    starThresholds: [0, 0.5, 0.9], // game value
  };
  const TITLE = 'Mission days';
  const fmt = M.fmt;
  // Blocking issues that stop the run. Short trips and heavy or costly ships run and fail on screen.
  const HARD = new Set(['noMission', 'noQuestion', 'noMeasure', 'noMissionType', 'missingSubsystems', 'payloadMismatch', 'noRocket', 'noCrew', 'noSuit']);
  const KEYS = ['o2', 'food', 'water'];
  const NAMES = { o2: 'oxygen', food: 'food', water: 'water' };

  /** Day-by-day schedule: each entry says where the crew is. */
  function schedule(extra, stormDelay) {
    const L = D.LIFE, out = [];
    for (let i = 0; i < L.transitDays; i++) out.push('out');
    for (let i = 0; i < L.surfaceDays; i++) out.push('surface');
    for (let i = 0; i < L.transitDays; i++) out.push('home');
    for (let i = 0; i < extra + stormDelay; i++) out.push('loiter');
    return out;
  }

  /** Which storm, if any. Pure function of the seed and the state. */
  function stormPlan(state, seed, baseLen) {
    const ev = state.events || {};
    const entry = (ev.log || []).find(e => e.id === 'solarStorm');
    const extra = ev.extraDays || 0;
    const r = M.rng((seed >>> 0) * 131 + 17);
    const roll = r(), dayPick = Math.floor(r() * baseLen);
    if (entry) return { hit: true, day: dayPick, shelter: entry.choice === 'shelter', delay: 0, announced: true };
    if (extra > 0) return { hit: true, day: dayPick, shelter: true, delay: 0, announced: true };
    if (roll < TUNING.stormChance) return { hit: true, day: dayPick, shelter: true, delay: TUNING.stormDelayDays, announced: false };
    return { hit: false, day: -1, shelter: false, delay: 0, announced: false };
  }

  function scoreOf(loaded, left) {
    // Two halves. Safety: the thinnest leftover pile, 10% or more counts as fully safe.
    // Waste: leftover mass beyond 30% of everything loaded is mass you launched for nothing and
    // lowers the score. So a huge reserve cannot buy 3 stars: the sweet spot is a modest reserve.
    const fr = KEYS.map(k => left[k] / loaded[k]);
    const safety = Math.min(1, Math.min(...fr) / TUNING.safeLeftover);
    const L = KEYS.reduce((a, k) => a + loaded[k], 0), R = KEYS.reduce((a, k) => a + left[k], 0);
    const waste = Math.max(0, R / L - TUNING.wasteFree);
    return { value: K.round(safety * (1 - waste), 4), minLeft: Math.min(...fr), wasteFrac: R / L };
  }

  function robotic(seed) {
    const total = M.minDays();
    return K.result({
      phase: 2, title: TITLE, seed, ok: true, time: { unit: 'day', total },
      fields: [{ key: 'crew', label: 'People on board', unit: 'people', max: 1 }],
      frames: K.grid(total, 3).map(t => ({ t, crew: 0 })),
      events: [{ t: 0, kind: 'success', text: 'No crew, no groceries. Robots skip life support.' }],
      score: { label: 'Robots need no supplies', value: 1, unit: 'score', thresholds: [0, 0.5, 1], higherIsBetter: true },
      math: null,
    });
  }

  function simulate(state, opts) {
    const seed = K.seedOf(opts, 1);
    const blockers = [];
    const add = (n, hardOnly) => { for (const i of M.validatePhase(state, n).issues) if (i.severity === 'block' && (!hardOnly || HARD.has(i.code))) blockers.push(i); };
    add(0, false);
    if (!blockers.length && state.missionType === 'crewed') { add(1, true); add(2, true); }
    if (blockers.length) return K.notReady(2, TITLE, blockers);
    if (state.missionType !== 'crewed') return robotic(seed);

    const L = D.LIFE, pd = L.perCrewDay;
    const l = M.lifeSupport(state), r = M.evaluate(state);
    const k = 1 + l.reserve, wf = l.recycler ? 1 - L.recycler.recovery : 1;
    const surfCD = l.landingCrew * L.surfaceDays, orbCD = l.crewDays - surfCD;
    const rate = { o2: pd.o2, food: pd.food, water: pd.water };

    const loaded = { o2: l.o2, food: l.food, water: l.water };
    const pile = { // kg in each pile at the start
      orb: { o2: orbCD * pd.o2 * k, food: orbCD * pd.food * k, water: orbCD * pd.water * k * wf },
      surf: { o2: surfCD * pd.o2 * k, food: surfCD * pd.food * k, water: surfCD * pd.water * k },
    };

    const baseLen = 2 * L.transitDays + L.surfaceDays + (state.events && state.events.extraDays || 0);
    const storm = stormPlan(state, seed, baseLen);
    const sched = schedule((state.events && state.events.extraDays) || 0, storm.delay);
    const need = sched.length;
    const dt = TUNING.dt, perDay = Math.round(1 / dt);

    const events = [];
    const ev = (t, kind, text) => events.push({ t, kind, text });
    ev(0, 'info', `${l.size} crew, ${l.days} days of supplies, ${Math.round(l.reserve * 100)}% reserve. Trip needs ${need} days.`);
    if (l.days < need) ev(0, 'warn', `You planned ${l.days} days but the trip needs ${need}. You will eat into the reserve.`);
    if (r.fitsRocket === false) ev(0, 'warn', `Supplies make the ship ${fmt(r.tli - r.rocket.capacity)} kg too heavy for ${r.rocket.title}.`);
    if (r.overBudget) ev(0, 'warn', `Over budget by $${fmt(r.totalCost - r.budget)}M.`);

    const pile0 = { orb: { ...pile.orb } };
    const state0 = () => ({ o2: pile.orb.o2 + pile.surf.o2, food: pile.orb.food + pile.surf.food, water: pile.orb.water + pile.surf.water });
    const snap = (t, ashore) => { const s = state0(); return { t, o2: s.o2, food: s.food, water: s.water, ashore }; };
    const frames = [snap(0, 0)];
    let fail = null, stormChecked = false, ascended = false, surfLoaded = null;

    outer:
    for (let day = 0; day < need; day++) {
      const loc = sched[day];
      if ((loc === 'home' || loc === 'loiter') && !ascended) { ascended = true; surfLoaded = { ...pile.surf }; for (const key of KEYS) pile.surf[key] = 0; ev(day, 'info', `Day ${day}: the descent stage stays on the Moon with its leftover supplies.`); }
      const ashore = loc === 'surface' ? l.landingCrew : 0;
      const orbCrew = l.size - ashore;
      if (day === 0) ev(0, 'info', 'Launch day: the whole crew is on the ship.');
      if (loc === 'surface' && sched[day - 1] !== 'surface') ev(day, 'info', `Day ${day}: ${l.landingCrew} crew go down to the surface.`);
      if (loc === 'home' && sched[day - 1] !== 'home') ev(day, 'info', `Day ${day}: everyone is back on the ship and heading home.`);
      if (loc === 'loiter' && sched[day - 1] !== 'loiter') ev(day, 'warn', `Day ${day}: the trip takes longer than planned. Everyone eats the same.`);
      if (storm.hit && !stormChecked && day === storm.day) {
        stormChecked = true;
        const loop = l.recycler ? TUNING.loopWaterDays * pd.water * l.size : 0; // water circulating in the recycler counts as shelter mass
        const bags = pile.orb.food + pile.orb.water + loop + (ascended ? 0 : pile.surf.food + pile.surf.water), nd = TUNING.shelterKgPerCrew * l.size;
        if (!storm.shelter) ev(day, 'warn', `Day ${day}: solar storm! The crew kept working outside shelter. Safety score drops.`);
        else if (bags >= nd) ev(day, 'warn', `Day ${day}: solar storm! The crew hides behind ${fmt(bags)} kg of food and water bags.${storm.announced ? '' : ' It costs one extra day.'}`);
        else {
          fail = { t: day, code: 'noShelter', cause: `A solar storm hit on day ${day} and there was too little food and water left to hide behind (${fmt(bags)} kg of ${fmt(nd)} kg needed).`,
            fix: !l.reserve ? 'Add a 20% reserve so there is something left to build a shelter with.' : l.days < need ? `Plan at least ${need} days of supplies so the bags are not empty.` : 'Load more days of supplies, or add the water recycler, so there is enough to build a shelter with.' };
          break outer;
        }
      }
      for (let s = 0; s < perDay; s++) {
        const t0 = day + s * dt;
        // draw this step from each pile, find the earliest empty one
        let f = 1, hit = null;
        const use = { orb: {}, surf: {} };
        for (const key of KEYS) {
          const w = key === 'water' ? wf : 1;
          use.orb[key] = orbCrew * rate[key] * w * dt;
          use.surf[key] = ashore * rate[key] * dt;
          for (const p of ['orb', 'surf']) {
            if (use[p][key] > 1e-12 && pile[p][key] < use[p][key] - 1e-9) {
              const ff = pile[p][key] / use[p][key];
              if (ff < f) { f = ff; hit = { key, p }; }
            }
          }
        }
        for (const key of KEYS) for (const p of ['orb', 'surf']) pile[p][key] = Math.max(0, pile[p][key] - use[p][key] * f);
        if (hit) {
          const t = t0 + f * dt, dayNo = Math.floor(t + 1e-9) + 1;
          frames.push(snap(t, ashore));
          const name = NAMES[hit.key], where = hit.p === 'surf' ? 'on the surface' : 'on the ship';
          const short = l.days < need;
          let fix;
          if (short) fix = `Plan at least ${need} days of supplies.`;
          else if (!l.reserve) fix = 'Add a 20% reserve.';
          else if (hit.key === 'water' && !l.recycler) fix = 'Add the water recycler, it saves most of the water.';
          else fix = 'Plan 2 more days of supplies.';
          fail = { t, code: hit.key + 'Out', cause: `The ${name} ran out ${where} on day ${dayNo} of ${need}.`, fix };
          break outer;
        }
        frames.push(snap(t0 + dt, ashore));
      }
    }

    const total = fail ? Math.max(...frames.map(f => f.t)) : need;
    const left = state0();
    // A failure at a day boundary may have been triggered before any frame at that time exists.
    if (fail && fail.t > total) fail.t = total;

    let failure = fail;
    const short = M.validatePhase(state, 2).issues.find(i => i.severity === 'block' && i.code === 'tooShort');
    if (!failure && short) {
      failure = { t: total, code: 'tooShort', cause: `The crew would survive on the supplies, but ${short.message.toLowerCase()} and you planned ${l.days}.`, fix: `Plan at least ${l.minDays + ((state.events && state.events.extraDays) || 0)} days of supplies.` };
    }
    if (!failure && r.fitsRocket === false) {
      const list = D.ROCKETS.crewed.filter(x => x.capacity >= r.tli).sort((a, b) => a.capacity - b.capacity)[0];
      const opt = l.suit.id !== 'light' ? `Swap the ${l.suit.title} for a lighter suit` : l.reserve ? 'Cut the reserve' : 'Plan fewer days';
      failure = { t: total, code: 'tooHeavy', cause: `The crew would survive, but supplies make the ship ${fmt(r.tli - r.rocket.capacity)} kg too heavy for ${r.rocket.title}.`,
        fix: list ? `${opt} or pick ${list.title}.` : `${opt}.` };
    }
    if (!failure && r.overBudget) {
      const opt = l.recycler ? `Drop the ${L.recycler.title.toLowerCase()}` : l.suit.id !== 'light' ? `Swap the ${l.suit.title} for a cheaper suit` : 'Pick a cheaper rocket';
      failure = { t: total, code: 'overBudget', cause: `The crew would survive, but the mission costs $${fmt(r.totalCost)}M and your budget is $${fmt(r.budget)}M.`, fix: `${opt}. You need to save $${fmt(Math.ceil(r.totalCost - r.budget))}M.` };
    }

    // Supplies left on the descent stage do not come home: score only what the ship still carries.
    const loadedS = ascended ? { o2: pile0.orb.o2, food: pile0.orb.food, water: pile0.orb.water } : loaded;
    const sc = scoreOf(loadedS, left);
    if (failure) ev(failure.t, 'fail', failure.cause);
    else ev(total, 'success', `Home safe after ${need} days. ${fmt(sc.minLeft * 100)}% of the thinnest supply was left.`);

    const math = {
      title: 'Life support: real NASA numbers',
      steps: M.lifeMath(state).steps.concat([
        { eq: 'left = loaded − used' + (ascended ? ' − left on the descent stage' : ''), num: KEYS.map(key => {
        const drop = ascended ? surfLoaded[key] : 0;
        return `${NAMES[key]} ${fmt(loaded[key], 1)} − ${fmt(loaded[key] - left[key] - drop, 1)}${ascended ? ' − ' + fmt(drop, 1) : ''} = ${fmt(left[key], 1)} kg`;
      }).join(', ') },
      ]),
      src: 'bvad',
    };

    return K.result({
      phase: 2, title: TITLE, seed, ok: !failure,
      time: { unit: 'day', total },
      fields: [
        { key: 'o2', label: 'Oxygen left', unit: 'kg', max: Math.ceil(loaded.o2) },
        { key: 'food', label: 'Food left', unit: 'kg', max: Math.ceil(loaded.food) },
        { key: 'water', label: 'Water left', unit: 'kg', max: Math.ceil(loaded.water) },
        { key: 'ashore', label: 'Crew on the surface', unit: 'people', max: L.landingCrewMax },
      ],
      frames, events: events.filter(e => e.t <= total + 1e-9), failure,
      score: { label: 'Supply balance', value: sc.value, unit: 'score', thresholds: TUNING.starThresholds, higherIsBetter: true },
      math,
    });
  }

  const P = { phase: 2, title: TITLE, simulate, TUNING };
  if (isNode) module.exports = P; else root.SS_SIM_P2 = P;
})(typeof window !== 'undefined' ? window : globalThis);
