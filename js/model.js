/* Space Syntax — pure game model (no DOM). Works in the browser and in Node.
 *
 * Mass model (simplified, documented for players in the "Why so heavy?" panel):
 *  - Rocket capacity is quoted as mass sent toward the Moon (after trans-lunar injection, TLI),
 *    so the spacecraft must carry fuel for every maneuver AFTER TLI.
 *  - Each burn multiplies the mass it pushes by a "fuel factor" from the rocket equation:
 *        R = e^(dv/ve);  tanks t = tankFraction × fuel, and tanks ride along to the end of the burn:
 *        fuel per kg of final payload = (R − 1) / (1 − t·(R − 1));  factor = 1 + (1 + t) × that
 *  - Crewed missions use Apollo-style lunar orbit rendezvous:
 *        orbiter (capsule + service module) stays in lunar orbit and flies home (TEI);
 *        lander descends (descent stage stays) and its cabin climbs back to the orbiter.
 *        TLI mass = f(LOI) × [ orbiter·f(TEI) + (descent + cabin·f(ascent))·f(descent) ]
 *  - Robotic one-way lander: TLI mass = lander · f(descent) · f(LOI)
 *  - Robotic sample return: a small capsule launches straight home from the surface (DV.direct).
 *  - Phase 2 (crewed): crew bodies, suits and BVAD consumables replace the Phase 1 allowance.
 *    Landing crew (max 2) + suits ride the ascent cabin; their surface supplies ride the descent stage;
 *    everyone else and the rest of the supplies ride the orbiter. Supplies are counted as carried the whole way
 *    (a conservative simplification).
 *  - Phase 3: a delta-v margin m scales every planned burn: dv_planned = dv × (1 + m).
 *
 * State shape (all optional until the phase is played):
 *  { difficulty, question, measure, missionType, design:{structure,shield,thermal,power,science[]}, rocket,
 *    crew:{ size, days, reserve, suit, recycler }, flight:{ margin }, events:{ massGrowth, extraCost, risk, extraDays, log[] } }
 */
(function (root) {
  'use strict';
  const D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.SS_DATA;

  const ve = D.ENGINE.isp * D.ENGINE.g0;
  /** kg of fuel needed per kg of final mass (payload), with tanks that also ride to burnout. */
  function fuelPerKg(dv) {
    const R = Math.exp(dv / ve), t = D.ENGINE.tankFraction;
    const den = 1 - t * (R - 1);
    if (den <= 0) return Infinity; // impossible stage: tanks heavier than the fuel can push
    return (R - 1) / den;
  }
  function fuelFactor(dv) {
    return 1 + (1 + D.ENGINE.tankFraction) * fuelPerKg(dv);
  }
  /** Fuel factors for a state: every burn is planned with the Phase 3 delta-v margin. */
  function marginOf(state) { return state && state.flight && state.flight.margin != null ? state.flight.margin : D.FLIGHT.defaultMargin; }
  function factorsFor(state) {
    const k = 1 + marginOf(state);
    const f = (key) => fuelFactor(D.DV[key].value * k);
    return { loi: f('loi'), descent: f('descent'), ascent: f('ascent'), tei: f('tei'), direct: f('direct') };
  }
  const F = {
    loi: fuelFactor(D.DV.loi.value),
    descent: fuelFactor(D.DV.descent.value),
    ascent: fuelFactor(D.DV.ascent.value),
    tei: fuelFactor(D.DV.tei.value),
    direct: fuelFactor(D.DV.direct.value),
  };

  /** Battery mass from E = P × t and specific energy (Wh/kg). */
  function batteryMass(hours) {
    return D.BATTERY.survivalPower * hours / D.BATTERY.specificEnergy;
  }
  function powerMass(v) {
    return (v.arrayMass || 0) + batteryMass(v.batteryHours || 0) + (v.rpsMass || 0);
  }

  /* ---------- "Show the math" step lists (real formulas, real numbers) ---------- */
  const fmt = (x, d = 0) => Number(x).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  /** Scientific notation the way it is written in class: 7.346×10²² */
  const sci = (x, d = 3) => { const [m, e] = Number(x).toExponential(d).split('e'); return m + '×10' + String(+e).replace(/./g, c => SUP[c]); };

  function moonDensityMath() {
    const r = D.MOON.radiusKm * 1000;
    const V = 4 / 3 * Math.PI * r ** 3;
    const rho = D.MOON.mass / V;
    return {
      title: 'How dense is the Moon?',
      steps: [
        { eq: 'V = 4/3 · π · r³', num: `V = 4/3 · π · (${fmt(r)} m)³ = ${sci(V)} m³` },
        { eq: 'ρ = M / V', num: `ρ = ${sci(D.MOON.mass)} kg ÷ ${sci(V)} m³ = ${fmt(rho)} kg/m³` },
        { eq: 'compare', num: `Water is ${fmt(D.WATER_DENSITY)} kg/m³ → the Moon is ${fmt(rho / D.WATER_DENSITY, 1)}× denser than water` },
      ],
      result: rho, check: `NASA lists ${fmt(D.MOON.density)} kg/m³ ✔`, src: 'nssdc',
    };
  }
  function moonGravityMath() {
    const r = D.MOON.radiusKm * 1000;
    const g = D.CONST.G * D.MOON.mass / r ** 2;
    return {
      title: 'How strong is lunar gravity?',
      steps: [
        { eq: 'g = G · M / r²', num: `g = 6.674×10⁻¹¹ · ${sci(D.MOON.mass)} kg ÷ (${fmt(r)} m)² = ${fmt(g, 2)} m/s²` },
        { eq: 'compare', num: `Earth is 9.81 m/s² → you would weigh about 1/${fmt(9.81 / g, 0)} as much` },
      ],
      result: g, check: `NASA lists ${D.MOON.gravity} m/s² ✔`, src: 'nssdc',
    };
  }
  function batteryMath(hours) {
    const E = D.BATTERY.survivalPower * hours;
    return {
      title: `Battery for ${fmt(hours)} hours of darkness`,
      steps: [
        { eq: 'E = P · t', num: `E = ${D.BATTERY.survivalPower} W · ${fmt(hours)} h = ${fmt(E)} Wh` },
        { eq: 'm = E / e', num: `m = ${fmt(E)} Wh / ${D.BATTERY.specificEnergy} Wh/kg = ${fmt(E / D.BATTERY.specificEnergy, 1)} kg of battery` },
      ],
      result: E / D.BATTERY.specificEnergy,
    };
  }
  /** Rocket equation, burn by burn, for the current design (works backwards from the last burn). */
  function rocketMath(state) {
    const r = evaluate(state); if (!r) return null;
    const veS = fmt(ve);
    const k = 1 + marginOf(state);
    const burn = (name, dvKey, mFinal) => {
      const dv = D.DV[dvKey].value * k;
      const ratio = Math.exp(dv / ve);
      const prop = mFinal * fuelPerKg(dv);
      const tanks = prop * D.ENGINE.tankFraction;
      return { name, dv, ratio, mFinal, prop, tanks, mStart: mFinal + prop + tanks };
    };
    const burns = [];
    if (state.missionType === 'robotic') {
      let L = r.breakdown.lander;
      let cap = null;
      // (L already includes the dry return capsule; swap it for the fueled one)
      if (needsReturn(state)) {
        const rc = D.BASE.robotic.returnCapsule.mass;
        cap = burn('Blast off straight home (sample capsule)', 'direct', rc);
        L = L - rc + cap.mStart;
      }
      const b1 = burn('Land on the Moon', 'descent', L);
      const b0 = burn('Brake into lunar orbit', 'loi', b1.mStart);
      burns.push(b0, b1);
      if (cap) burns.push(cap);
    } else {
      const b = r.breakdown;
      const tei = burn('Fire engines toward Earth (orbiter)', 'tei', b.orbiter);
      const asc = burn('Lift off from the Moon (cabin)', 'ascent', b.ascent);
      const des = burn('Land on the Moon (whole lander)', 'descent', b.descent + asc.mStart);
      const loi = burn('Brake into lunar orbit (everything)', 'loi', tei.mStart + des.mStart);
      burns.push(loi, des, asc, tei);
    }
    return { ve, veS, isp: D.ENGINE.isp, burns, tli: r.tli, dry: r.dry, margin: marginOf(state) };
  }

  function findSub(id) { return D.SUBSYSTEMS.find(s => s.id === id); }
  function findOpt(subId, optId) {
    const s = findSub(subId); return s && s.options.find(o => o.id === optId);
  }
  function optionsFor(subId, type) {
    return findSub(subId).options.filter(o => !o.only || o.only === type);
  }

  /** Does this mission bring anything back to Earth? */
  function needsReturn(state) {
    return state.missionType === 'crewed' || state.measure === 'sample';
  }

  /** Instruments allowed by the Phase 0 measurement. */
  function unlockedInstruments(state) {
    const m = D.MEASURES.find(x => x.id === state.measure);
    return m ? m.unlocks : [];
  }

  /** Which instrument(s) answer the Phase 0 measurement? Returns ids. */
  function requiredInstruments(state) {
    if (state.measure === 'image') return ['camera'];
    if (state.measure === 'chem') return state.question === 'water' ? ['neutron', 'spectrometer'] : ['spectrometer', 'neutron'];
    if (state.measure === 'sample') return ['sampler'];
    return [];
  }
  /** True if the payload has at least one instrument that answers the measurement. */
  function payloadAnswers(state) {
    const req = requiredInstruments(state);
    const chosen = (state.design && state.design.science) || [];
    return req.some(id => chosen.includes(id));
  }

  /**
   * Compute every budget number for a design.
   * Returns { lines: [ {label, where, mass, cost, power, gen} ], dry, tli, cost, powerNeed, powerGen, ... }
   */
  function evaluate(state) {
    const type = state.missionType;
    const des = state.design || {};
    const lines = [];
    let kind = 'hw';
    const add = (label, where, mass, cost, power, gen, src) =>
      lines.push({ label, where, mass: mass || 0, cost: cost || 0, power: power || 0, gen: gen || 0, src: src || 'game', kind });
    const ev = state.events || {};

    if (type === 'robotic') {
      const b = D.BASE.robotic;
      add(b.lander.label, 'lander', b.lander.mass, b.lander.cost, b.lander.power);
    } else if (type === 'crewed') {
      const b = D.BASE.crewed;
      add(b.capsule.label, 'orbiter', b.capsule.mass, b.capsule.cost, 0, 0, 'game');
      add(b.serviceModule.label, 'orbiter', b.serviceModule.mass, b.serviceModule.cost);
      add(b.ascentCabin.label, 'ascent', b.ascentCabin.mass, b.ascentCabin.cost);
      add(b.descentStage.label, 'descent', b.descentStage.mass, b.descentStage.cost);
    } else {
      return null;
    }

    // Structure scales with the base hardware it holds together.
    const baseByWhere = {};
    lines.forEach(l => { baseByWhere[l.where] = (baseByWhere[l.where] || 0) + l.mass; });

    for (const sub of D.SUBSYSTEMS) {
      const picks = sub.multi ? (des[sub.id] || []) : (des[sub.id] ? [des[sub.id]] : []);
      for (const pid of picks) {
        const o = findOpt(sub.id, pid);
        if (!o || (o.only && o.only !== type)) continue;
        const v = o[type] ? Object.assign({}, o[type]) : null;
        if (!v) continue;
        if (sub.id === 'power' && type === 'robotic') v.mass = powerMass(v);
        const name = sub.title + ': ' + o.title;
        if (type === 'crewed' && v.frac != null) {
          ['orbiter', 'ascent', 'descent'].forEach(w => {
            const base = baseByWhere[w] || 0;
            add(name + ' (' + w + ')', w, base * v.frac, w === 'orbiter' ? v.cost : 0, 0, 0, o.src);
          });
        } else if (type === 'crewed' && v.where === 'split') {
          add(name + ' (orbiter)', 'orbiter', v.mass / 2, v.cost, v.power || 0, 0, o.src);
          add(name + ' (lander)', 'ascent', v.mass / 2, 0, 0, 0, o.src);
        } else {
          add(name, type === 'crewed' ? (v.where || 'orbiter') : 'lander', v.mass, v.cost, v.power || 0, v.gen || 0, o.src);
        }
      }
    }

    if (type === 'robotic' && needsReturn(state)) {
      const rc = D.BASE.robotic.returnCapsule;
      // capsule is launched straight home from the surface; its fuel is counted as propellant below
      add(rc.label, 'lander', rc.mass, rc.cost);
    }

    // Mass growth event: hardware only (not crew, supplies or samples)
    if (ev.massGrowth) lines.forEach(l => { if (l.kind === 'hw') l.mass *= 1 + ev.massGrowth; });

    // Crew, suits and supplies
    let life = null;
    if (type === 'crewed') {
      const b = D.BASE.crewed;
      life = lifeSupport(state);
      if (life) {
        kind = 'crew';
        add(`Crew staying in orbit (${life.orbitCrew})`, 'orbiter', life.orbitCrew * D.LIFE.crewMass, 0, 0, 0, 'game');
        add(`Landing crew (${life.landingCrew})`, 'ascent', life.landingCrew * D.LIFE.crewMass, 0, 0, 0, 'game');
        add(`Moonwalk suits ×${life.landingCrew}: ${life.suit.title}`, 'ascent', life.suitsMass, life.suit.cost * life.landingCrew, 0, 0, life.suit.src || 'game');
        kind = 'consumable';
        add('Supplies in orbit (O₂, food, water)', 'orbiter', life.orbiterSupplies, 0, b.power, 0, 'bvad');
        add('Surface supplies (O₂, food, water)', 'descent', life.surfaceSupplies, 0, 0, 0, 'bvad');
        if (life.recycler) { kind = 'hw'; add(D.LIFE.recycler.title, 'orbiter', D.LIFE.recycler.mass * (1 + (ev.massGrowth || 0)), D.LIFE.recycler.cost, D.LIFE.recycler.power, 0, D.LIFE.recycler.src); }
      } else {
        kind = 'consumable';
        add(b.crewAllowance.label, 'orbiter', b.crewAllowance.mass, 0, b.power);
      }
      kind = 'sample';
      add(b.samples.label, 'ascent', b.samples.mass, 0, 0, 0, 'samples');
    }

    const f = factorsFor(state);
    const sum = (w) => lines.filter(l => !w || l.where === w).reduce((a, l) => a + l.mass, 0);
    const dry = sum();
    let tli, breakdown;
    if (type === 'robotic') {
      const L = sum('lander');
      const returnFuel = needsReturn(state) ? D.BASE.robotic.returnCapsule.mass * (f.direct - 1) : 0;
      tli = (L + returnFuel) * f.descent * f.loi;
      breakdown = { lander: L, returnFuel };
    } else {
      const O = sum('orbiter'), A = sum('ascent'), Ds = sum('descent');
      const orbiterWet = O * f.tei;
      const landerWet = (Ds + A * f.ascent) * f.descent;
      tli = (orbiterWet + landerWet) * f.loi;
      breakdown = { orbiter: O, ascent: A, descent: Ds, orbiterWet, landerWet };
    }

    const cost = lines.reduce((a, l) => a + l.cost, 0) + (ev.extraCost || 0);
    const powerNeed = lines.reduce((a, l) => a + l.power, 0);
    const powerGen = lines.reduce((a, l) => a + l.gen, 0);

    const rocket = state.rocket ? (D.ROCKETS[type] || []).find(r => r.id === state.rocket) : null;
    const totalCost = cost + (rocket ? rocket.cost : 0);
    const budget = D.BUDGET[type] ? D.BUDGET[type][state.difficulty || 'engineer'] : 0;

    // Night survival (robotic only — crew landers are sized in later phases)
    let nightHours = null;
    if (type === 'robotic' && des.power) {
      const p = findOpt('power', des.power);
      nightHours = p && p.robotic ? p.robotic.nightHours : 0;
    }

    const protection = des.shield ? ((findOpt('shield', des.shield) || {}).protection || 0) : 0;
    const strength = Math.max(0, ...((des.science || []).map(id => (findOpt('science', id) || {}).strength || 0)));

    const plan = flightPlanFor(state);
    return {
      lines, dry, tli, propellant: tli - dry, breakdown, cost, totalCost, budget,
      powerNeed, powerGen, rocket, nightHours, protection, strength,
      fuelMultiplier: tli / dry, life, margin: marginOf(state), dvRequired: plan.dvRequired, dvPlanned: plan.dvPlanned,
      risk: ev.risk || 0, extraCost: ev.extraCost || 0, massGrowth: ev.massGrowth || 0,
      fitsRocket: rocket ? tli <= rocket.capacity : null, overBudget: totalCost > budget,
    };
  }

  /* ======================= PHASE 2: crew & life support ======================= */
  /** Minimum mission length: there and back, plus the surface stay. */
  function minDays() { return 2 * D.LIFE.transitDays + D.LIFE.surfaceDays; }
  /** BVAD consumables for the crew plan. Returns null for robotic missions or before Phase 2 is started. */
  function lifeSupport(state) {
    if (state.missionType !== 'crewed' || !state.crew || !state.crew.size) return null;
    const L = D.LIFE, c = state.crew;
    const size = clamp(Math.round(c.size), L.crewMin, L.crewMax);
    const days = clamp(Math.round(c.days || minDays()), 1, L.daysMax);
    const reserve = c.reserve || 0;
    const landingCrew = Math.min(L.landingCrewMax, size);
    const orbitCrew = size - landingCrew;
    const suit = L.suits.find(x => x.id === c.suit) || L.suits[0];
    const pd = L.perCrewDay;
    const daily = pd.o2 + pd.food + pd.water;
    const surfaceCrewDays = landingCrew * L.surfaceDays;
    const crewDays = size * days;
    const orbitCrewDays = crewDays - surfaceCrewDays;
    const k = 1 + reserve;
    const recycler = !!c.recycler;
    const waterFactor = recycler ? (1 - L.recycler.recovery) : 1; // only the orbiter has the recycler
    const o2 = crewDays * pd.o2 * k, food = crewDays * pd.food * k;
    const waterOrbit = orbitCrewDays * pd.water * k * waterFactor;
    const waterSurface = surfaceCrewDays * pd.water * k;
    const water = waterOrbit + waterSurface;
    const waterSaved = recycler ? orbitCrewDays * pd.water * k * (1 - waterFactor) : 0;
    const surfaceSupplies = surfaceCrewDays * daily * k - 0; // surface water is never recycled
    const orbiterSupplies = (o2 + food + water) - surfaceSupplies;
    // break-even: recycler pays off when the water it saves outweighs its own mass
    // saved(d) = (size·d − landingCrew·surfaceDays) · water · k · recovery  →  solve saved(d) = recycler mass
    const recyclerBreakEvenDays = (L.recycler.mass / (pd.water * k * L.recycler.recovery) + surfaceCrewDays) / size;
    return {
      size, days, reserve, landingCrew, orbitCrew, suit, recycler,
      crewDays, perDay: pd, daily, o2, food, water, waterSaved, recyclerBreakEvenDays,
      surfaceSupplies, orbiterSupplies, suppliesTotal: o2 + food + water,
      suitsMass: landingCrew * suit.mass, crewMass: size * L.crewMass,
      minDays: minDays(), daysOk: days >= minDays() + extraDays(state),
    };
  }
  function extraDays(state) { return (state.events && state.events.extraDays) || 0; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  /** "Show the math" for consumables (E = n × days × per-day). */
  function lifeMath(state) {
    const l = lifeSupport(state); if (!l) return null;
    const pd = l.perDay, k = 1 + l.reserve;
    const steps = [
      { eq: 'crew-days = crew × days', num: `${l.size} × ${l.days} = ${l.crewDays} crew-days` },
      { eq: 'O₂ = crew-days × 0.895', num: `${l.crewDays} × ${pd.o2} kg${l.reserve ? ' × ' + k : ''} = ${fmt(l.o2)} kg` },
      { eq: 'food = crew-days × 0.800', num: `${l.crewDays} × ${pd.food} kg${l.reserve ? ' × ' + k : ''} = ${fmt(l.food)} kg` },
      { eq: 'water = crew-days × 3.217', num: `${l.crewDays} × ${pd.water} kg${l.reserve ? ' × ' + k : ''}${l.recycler ? ' − recycled' : ''} = ${fmt(l.water)} kg` },
    ];
    if (l.recycler) steps.push({ eq: 'recycler pays off', num: `after about ${fmt(l.recyclerBreakEvenDays, 1)} days (it weighs ${D.LIFE.recycler.mass} kg)` });
    return { title: 'Life support: real NASA numbers', steps, check: 'Daily values from NASA BVAD Table 3-31', src: 'bvad' };
  }

  /* ======================= PHASE 3: flight plan ======================= */
  /** Ordered list of burns after TLI, with required and planned delta-v. */
  function flightPlanFor(state) {
    const m = marginOf(state), k = 1 + m;
    const type = state.missionType;
    const keys = type === 'robotic' ? (needsReturn(state) ? ['loi', 'descent', 'direct'] : ['loi', 'descent'])
      : type === 'crewed' ? ['loi', 'descent', 'ascent', 'tei'] : [];
    const vehicle = { loi: type === 'crewed' ? 'orbiter + lander' : 'lander', descent: 'lander', ascent: 'lander cabin', tei: 'orbiter', direct: 'sample capsule' };
    const burns = keys.map(key => ({ key, label: D.DV[key].label, src: D.DV[key].src, dv: D.DV[key].value, dvPlanned: D.DV[key].value * k, vehicle: vehicle[key] }));
    const dvRequired = burns.reduce((a, b) => a + b.dv, 0);
    return { tli: { dv: D.DV.tli.value, by: 'rocket upper stage', src: D.DV.tli.src }, burns, margin: m, dvRequired, dvPlanned: dvRequired * k };
  }
  function minMargin(state) { return D.FLIGHT.minMargin[state.difficulty || 'engineer'] || 0; }

  /* ======================= Validation (GO / NO GO) ======================= */
  /** issues: { code, severity:'block'|'warn', message, phase } */
  function validatePhase(state, n) {
    const issues = [];
    const block = (code, message, phase) => issues.push({ code, severity: 'block', message, phase: phase == null ? n : phase });
    const warn = (code, message, phase) => issues.push({ code, severity: 'warn', message, phase: phase == null ? n : phase });
    if (n === 0) {
      if (!state.question) block('noQuestion', 'Pick a science question');
      if (!state.measure) block('noMeasure', 'Pick a measurement');
      if (!state.missionType) block('noMissionType', 'Pick robots or people');
      return result(issues);
    }
    const r = evaluate(state);
    if (!r) { block('noMission', 'Finish Phase 0 first', 0); return result(issues); }
    if (n === 1) {
      const miss = missingSubsystems(state);
      if (miss.length) block('missingSubsystems', 'Still to choose: ' + miss.map(id => findSub(id).title).join(', '));
      if (!payloadAnswers(state)) block('payloadMismatch', 'Add an instrument that answers your Phase 0 question');
      if (!state.rocket) block('noRocket', 'Pick a rocket');
      else if (!r.fitsRocket) block('tooHeavy', `Too heavy for ${r.rocket.title} by ${fmt(r.tli - r.rocket.capacity)} kg`);
      else if ((r.rocket.capacity - r.tli) / r.rocket.capacity < 0.1) warn('lowMassMargin', 'Less than 10% mass margin: later phases may push you over');
      if (r.overBudget) block('overBudget', `Over budget by $${fmt(r.totalCost - r.budget)}M`);
      if (r.powerGen < r.powerNeed) block('noPower', `Power short by ${fmt(r.powerNeed - r.powerGen)} W`);
      return result(issues);
    }
    if (n === 2) {
      if (state.missionType !== 'crewed') return result(issues); // robots need no life support
      const l = lifeSupport(state);
      if (!l) { block('noCrew', 'Choose your crew'); return result(issues); }
      if (!state.crew.suit) block('noSuit', 'Pick a moonwalk suit');
      if (!l.daysOk) block('tooShort', `A round trip needs at least ${l.minDays + extraDays(state)} days`);
      if (state.rocket && r.fitsRocket === false) block('tooHeavy', `Supplies made you too heavy for ${r.rocket.title} by ${fmt(r.tli - r.rocket.capacity)} kg`);
      if (r.overBudget) block('overBudget', `Over budget by $${fmt(r.totalCost - r.budget)}M`);
      if (!l.reserve) warn('noReserve', 'No reserve supplies: any delay becomes dangerous');
      if (state.question === 'water' && !l.suit.shadowOk) warn('suitCold', 'This suit cannot enter the freezing shadowed craters where ice hides');
      if (l.recycler && l.days < l.recyclerBreakEvenDays) warn('recyclerHeavy', `The recycler only pays off after ~${fmt(l.recyclerBreakEvenDays)} days`);
      return result(issues);
    }
    if (n === 3) {
      const m = marginOf(state), need = minMargin(state);
      if (m < need - 1e-9) block('lowDvMargin', `Flight rules require at least ${Math.round(need * 100)}% delta-v reserve`);
      else if (m === 0) warn('zeroDvMargin', 'Zero reserve: any navigation error means you cannot get home');
      if (!state.rocket) block('noRocket', 'Pick a rocket', 1);
      else if (!r.fitsRocket) block('tooHeavy', `With your fuel plan you are ${fmt(r.tli - r.rocket.capacity)} kg too heavy for ${r.rocket.title}`);
      if (r.overBudget) block('overBudget', `Over budget by $${fmt(r.totalCost - r.budget)}M`);
      if (r.risk >= 2) warn('highRisk', 'You took several risky choices: mission success odds are lower');
      return result(issues);
    }
    return result(issues);
  }
  function result(issues) { return { ok: !issues.some(i => i.severity === 'block'), issues }; }
  /** Everything from Phase 0 to 3 must be GO before launch. */
  function launchReadiness(state) {
    const all = [0, 1, 2, 3].map(n => ({ phase: n, ...validatePhase(state, n) }));
    return { go: all.every(x => x.ok), phases: all, issues: all.flatMap(x => x.issues) };
  }

  /* ======================= Seeded random events ======================= */
  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  /** Maybe one event for this phase. Deterministic for (seed, phase). Already-seen events never repeat. */
  function rollEvent(state, phase, seed) {
    const r = rng((seed >>> 0) * 31 + phase * 7919);
    const chance = D.EVENT_CHANCE[state.difficulty || 'engineer'] || 0;
    if (r() >= chance) return null;
    const seen = ((state.events && state.events.log) || []).map(e => e.id);
    const pool = D.EVENTS.filter(e => e.phases.includes(phase) && !seen.includes(e.id) && (!e.crewedOnly || state.missionType === 'crewed'));
    if (!pool.length) return null;
    return pool[Math.floor(r() * pool.length)];
  }
  /** Pure: returns a new state with the event choice applied. */
  function applyEventChoice(state, eventId, choiceId) {
    const ev = D.EVENTS.find(e => e.id === eventId); if (!ev) return state;
    const ch = ev.choices.find(c => c.id === choiceId); if (!ch) return state;
    const eff = ch.effect || (ch.effectByType && ch.effectByType[state.missionType]) || {};
    const next = JSON.parse(JSON.stringify(state));
    const e = next.events = Object.assign({ massGrowth: 0, extraCost: 0, risk: 0, extraDays: 0, log: [] }, next.events || {});
    if (eff.massGrowth) e.massGrowth = (1 + e.massGrowth) * (1 + eff.massGrowth) - 1;
    if (eff.extraCost) e.extraCost += eff.extraCost;
    if (eff.risk) e.risk += eff.risk;
    if (eff.extraDays) e.extraDays += eff.extraDays;
    e.log.push({ id: eventId, choice: choiceId });
    return next;
  }

  /**
   * SECURITY: rebuild a state from untrusted input (localStorage, a shared link, a future save file).
   * Whitelist only: unknown keys are dropped, ids must exist in the data tables, numbers are clamped.
   * Never trust anything that came from outside the code.
   */
  function sanitizeState(raw) {
    const s = newState();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return s;
    const oneOf = (v, list) => (typeof v === 'string' && list.includes(v)) ? v : null;
    const num = (v, a, b, d) => (typeof v === 'number' && isFinite(v)) ? clamp(v, a, b) : d;
    const bool = (v) => v === true;
    s.difficulty = oneOf(raw.difficulty, D.DIFFICULTIES.map(d => d.id)) || 'engineer';
    s.question = oneOf(raw.question, D.QUESTIONS.map(q => q.id));
    s.measure = oneOf(raw.measure, D.MEASURES.map(m => m.id));
    s.missionType = oneOf(raw.missionType, D.MISSION_TYPES.map(t => t.id));
    const des = raw.design && typeof raw.design === 'object' ? raw.design : {};
    for (const sub of D.SUBSYSTEMS) {
      const ids = optionsFor(sub.id, s.missionType || 'robotic').map(o => o.id);
      if (sub.multi) s.design[sub.id] = Array.isArray(des[sub.id]) ? [...new Set(des[sub.id].filter(x => ids.includes(x)))] : [];
      else s.design[sub.id] = oneOf(des[sub.id], ids);
    }
    s.design.science = s.design.science.filter(x => unlockedInstruments(s).includes(x));
    s.rocket = oneOf(raw.rocket, (D.ROCKETS[s.missionType] || []).map(r => r.id));
    if (s.missionType === 'crewed' && raw.crew && typeof raw.crew === 'object') {
      const c = raw.crew, L = D.LIFE;
      s.crew = {
        size: Math.round(num(c.size, L.crewMin, L.crewMax, L.crewMax)),
        days: Math.round(num(c.days, 1, L.daysMax, minDays())),
        reserve: L.reserveOptions.includes(c.reserve) ? c.reserve : 0,
        suit: oneOf(c.suit, L.suits.map(x => x.id)),
        recycler: bool(c.recycler),
      };
    }
    s.flight.margin = D.FLIGHT.marginOptions.includes(raw.flight && raw.flight.margin) ? raw.flight.margin : D.FLIGHT.defaultMargin;
    const e = raw.events && typeof raw.events === 'object' ? raw.events : {};
    s.events.massGrowth = num(e.massGrowth, 0, 0.5, 0);
    s.events.extraCost = num(e.extraCost, 0, 5000, 0);
    s.events.risk = Math.round(num(e.risk, 0, 10, 0));
    s.events.extraDays = Math.round(num(e.extraDays, 0, 10, 0));
    s.events.log = Array.isArray(e.log) ? e.log.filter(x => x && D.EVENTS.some(ev => ev.id === x.id && ev.choices.some(c => c.id === x.choice))).map(x => ({ id: x.id, choice: x.choice })).slice(0, 20) : [];
    return s;
  }

  /** A fresh game state. */
  function newState() {
    return { difficulty: 'engineer', question: null, measure: null, missionType: null, design: { science: [] }, rocket: null,
      crew: null, flight: { margin: D.FLIGHT.defaultMargin }, events: { massGrowth: 0, extraCost: 0, risk: 0, extraDays: 0, log: [] } };
  }
  /** Sensible starting crew plan for Phase 2. */
  function defaultCrew() { return { size: 4, days: minDays() + 1, reserve: 0.2, suit: null, recycler: false }; }

  /** Teaching ratio for a whole subsystem tab, using where its mass actually rides. */
  function gearForSub(type, subId, optId) {
    if (type !== 'crewed') return gearRatio(type, 'lander');
    if (subId === 'structure') {
      const b = D.BASE.crewed, o = b.capsule.mass + b.serviceModule.mass, a = b.ascentCabin.mass, d = b.descentStage.mass;
      return (o * gearRatio(type, 'orbiter') + a * gearRatio(type, 'ascent') + d * gearRatio(type, 'descent')) / (o + a + d);
    }
    const opt = optId && findOpt(subId, optId);
    const where = opt && opt.crewed && opt.crewed.where ? opt.crewed.where : (subId === 'science' ? 'descent' : 'orbiter');
    return gearRatio(type, where);
  }
  function whereOf(type, subId, optId) {
    if (type !== 'crewed') return 'lander';
    if (subId === 'structure') return 'all';
    const opt = optId && findOpt(subId, optId);
    return opt && opt.crewed && opt.crewed.where ? opt.crewed.where : (subId === 'science' ? 'descent' : 'orbiter');
  }

  /** How many kg at launch does 1 kg added to a given vehicle cost? (teaching number) */
  function gearRatio(type, where) {
    if (type === 'robotic') return F.descent * F.loi;
    if (where === 'orbiter') return F.tei * F.loi;
    if (where === 'ascent') return F.ascent * F.descent * F.loi;
    if (where === 'descent') return F.descent * F.loi;
    if (where === 'split') return (F.tei * F.loi + F.ascent * F.descent * F.loi) / 2;
    return F.loi;
  }

  /** Preview: evaluate with one option swapped in, so the HUD can show a ghost delta. */
  function previewWith(state, subId, optId) {
    const sub = findSub(subId);
    const next = JSON.parse(JSON.stringify(state));
    next.design = next.design || {};
    if (sub.multi) {
      const arr = next.design[subId] || [];
      next.design[subId] = arr.includes(optId) ? arr.filter(x => x !== optId) : arr.concat(optId);
    } else {
      next.design[subId] = optId;
    }
    return evaluate(next);
  }

  /** Which single-choice subsystems are still missing? */
  function missingSubsystems(state) {
    const des = state.design || {};
    return D.SUBSYSTEMS.filter(s => s.multi ? !(des[s.id] && des[s.id].length) : !des[s.id]).map(s => s.id);
  }

  /** Descope suggestions. by = 'mass' (default) or 'cost'. Never removes the last instrument that answers the question. */
  function descopeSuggestions(state, by) {
    const base = evaluate(state);
    const des = state.design || {};
    const out = [];
    for (const sub of D.SUBSYSTEMS) {
      if (sub.multi) {
        for (const id of (des.science || [])) {
          const after = JSON.parse(JSON.stringify(state)); after.design.science = after.design.science.filter(x => x !== id);
          if (!payloadAnswers(after)) continue;
          const r = previewWith(state, sub.id, id);
          out.push({ sub: sub.id, opt: id, remove: true, label: 'Remove ' + findOpt(sub.id, id).title, saves: base.tli - r.tli, costSaves: base.totalCost - r.totalCost, after: r });
        }
        continue;
      }
      for (const o of optionsFor(sub.id, state.missionType)) {
        if (o.id === des[sub.id]) continue;
        const r = previewWith(state, sub.id, o.id);
        const good = by === 'cost' ? r.totalCost < base.totalCost - 0.5 : r.tli < base.tli - 1;
        if (good) out.push({ sub: sub.id, opt: o.id, label: sub.title + ' → ' + o.title, saves: base.tli - r.tli, costSaves: base.totalCost - r.totalCost, after: r });
      }
    }
    const key = by === 'cost' ? 'costSaves' : 'saves';
    return out.filter(x => x[key] > 0).sort((a, b) => b[key] - a[key]).slice(0, 4);
  }

  const MODEL = { sanitizeState, marginOf, factorsFor, minDays, lifeSupport, lifeMath, flightPlan: flightPlanFor, minMargin, validatePhase, launchReadiness, rng, rollEvent, applyEventChoice, newState, defaultCrew, sci, fuelPerKg, gearForSub, whereOf, fmt, ve, batteryMass, powerMass, moonDensityMath, moonGravityMath, batteryMath, rocketMath, fuelFactor, F, evaluate, previewWith, gearRatio, needsReturn, unlockedInstruments, requiredInstruments, payloadAnswers, missingSubsystems, descopeSuggestions, optionsFor, findOpt, findSub };
  if (typeof module !== 'undefined' && module.exports) module.exports = MODEL;
  else root.SS_MODEL = MODEL;
})(typeof window !== 'undefined' ? window : globalThis);
