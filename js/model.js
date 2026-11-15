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
 *  - Phase 4: onboard link hardware adds mass/power/cost; data rate scales with (DSN dish diameter / 34 m)².
 *    The spacecraft must be complete before launch, so launch readiness covers Phases 0 to 4.
 *  - Phase 5: hovering to dodge hazards costs g_moon (1.62 m/s) of delta-v per second. The descent margin
 *    from Phase 3 buys hover seconds: t = (descent dv × margin) / g + built-in reserve.
 *  - Phase 6: each measurement spends hours, spare power and data buffer, and adds evidence (clue < composition < sample).
 *  - Phase 7: return burns were fueled in Phase 3; the rocket equation gives the delta-v actually available (an empty
 *    sample box gives a little extra). Heat shield capacity vs heat load, then a seeded splashdown vs the recovery zone.
 *
 * State shape (all optional until the phase is played):
 *  { difficulty, question, measure, missionType, design:{structure,shield,thermal,power,science[]}, rocket,
 *    crew:{ size, days, reserve, suit, recycler }, flight:{ margin }, comms:{ link, dish }, site, landing:{ seed, outcome },
 *    events:{ massGrowth, extraCost, risk, extraDays, log[] },
 *    surface:{ actions[], finished }, returnTrip:{ seed, entry, shield } }
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

    // Phase 4: onboard link and ground antenna time
    const link = commsLink(state), dish = commsDish(state);
    if (link) {
      const v = link[type];
      add('Comms: ' + link.title, type === 'crewed' ? (v.where || 'orbiter') : 'lander', v.mass, v.cost, v.power, 0, link.src);
    }
    if (dish) add('Ground: ' + dish.title + ' time', 'ground', 0, dish.cost[type], 0, 0, dish.src);

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
  /** Lander mass at the start of powered descent, including the fuel this design carries. */
  function approachMass(state) {
    const r = evaluate(state);
    if (!r) return null;
    const f = factorsFor(state);
    if (state.missionType === 'robotic') return (r.breakdown.lander + (r.breakdown.returnFuel || 0)) * f.descent;
    return r.breakdown.landerWet || null;
  }

  /* ======================= PHASE 4: communications ======================= */
  function commsLink(state) { return state.comms ? D.COMMS.links.find(l => l.id === state.comms.link) || null : null; }
  function commsDish(state) { return state.comms ? D.COMMS.dishes.find(d => d.id === state.comms.dish) || null : null; }
  /** Light-time delay in seconds for a distance in km. */
  function lightDelay(km) { return km / D.CONST.c; }
  /** Antenna gain ratio between two dish diameters: G ∝ D². */
  function dishGain(diameter) { return (diameter / D.COMMS.baseDiameter) ** 2; }
  /** Data the science payload (and crew) want to send per day, in Gb. */
  function dataNeedPerDay(state) {
    const per = D.COMMS.dataPerDay;
    const sci = ((state.design && state.design.science) || []).reduce((a, id) => a + (per[id] || 0), 0);
    return sci + (state.missionType === 'crewed' ? per.crewVideo : 0);
  }
  /** Everything Phase 4 needs: delays, data rate, daily volume, bottleneck. */
  function commsPlan(state) {
    const C = D.COMMS, link = commsLink(state), dish = commsDish(state);
    const gain = dish && !(link && link.optical) ? dishGain(dish.diameter) : 1; // lasers do not use radio dishes
    const rateMbps = link ? link.rateMbps * gain : 0;
    const gbPerDay = link ? rateMbps * link.contactHours * 3.6 : 0; // Mbps × h × 3600 s / 1000 Mb per Gb
    const need = dataNeedPerDay(state);
    return {
      link, dish, gain, rateMbps, contactHours: link ? link.contactHours : 0, gbPerDay, needGbPerDay: need,
      bottleneck: !!link && gbPerDay < need, daysToSendOneDay: link && gbPerDay > 0 ? need / gbPerDay : null,
      delay: { min: lightDelay(C.perigeeKm), avg: lightDelay(D.MOON.distanceKm), max: lightDelay(C.apogeeKm) },
      roundTrip: 2 * lightDelay(D.MOON.distanceKm), blackoutMin: C.blackoutMin, weatherRisk: !!(link && link.weatherRisk),
    };
  }
  function commsMath(state) {
    const c = commsPlan(state);
    const steps = [
      { eq: 't = d / c', num: `t = ${fmt(D.MOON.distanceKm)} km ÷ ${fmt(D.CONST.c)} km/s = ${c.delay.avg.toFixed(2)} s one way` },
      { eq: 'range', num: `${c.delay.min.toFixed(2)} s at the closest point, ${c.delay.max.toFixed(2)} s at the farthest` },
    ];
    if (c.dish && !(c.link && c.link.optical)) steps.push({ eq: 'G ∝ D²', num: `(${c.dish.diameter} m ÷ ${D.COMMS.baseDiameter} m)² = ${c.gain.toFixed(2)}× signal` });
    if (c.link) steps.push({ eq: 'data = rate × time', num: `${fmt(c.rateMbps, 1)} Mbps × ${c.contactHours} h × 3,600 s ÷ 1,000 = ${fmt(c.gbPerDay)} Gb per day` });
    return { title: 'Talking to Earth: real math', steps, check: c.link ? (c.bottleneck ? `You need ${fmt(c.needGbPerDay)} Gb a day: data will pile up` : `Enough for your ${fmt(c.needGbPerDay)} Gb a day ✔`) : null, src: 'dsn' };
  }

  /* ======================= PHASE 5: landing ======================= */
  function findSite(id) { return D.SITES.find(x => x.id === id) || null; }
  /** How a site fits this mission: science match, darkness, cold, Earth visibility. */
  function siteReport(state, siteId) {
    const site = findSite(siteId || state.site); if (!site) return null;
    const r = evaluate(state);
    const robotic = state.missionType === 'robotic';
    const nightHours = robotic && r ? (r.nightHours || 0) : null;
    const survivesNight = robotic ? nightHours >= site.darkHours : true;
    const life = state.missionType === 'crewed' ? lifeSupport(state) : null;
    // Daylight is the robotic science window. Crewed moonwalks use the same product as Phase 6.
    const opsHours = robotic ? site.lightHours : D.LIFE.surfaceDays * 24;
    const evaHours = life ? crewEvaHours(life) : null;
    return {
      site, scienceMatch: site.bestFor.includes(state.question), survivesNight, nightHours, opsHours, evaHours,
      coldRisk: !!site.coldShadow && !!life && !life.suit.shadowOk, earthView: site.earthView,
      hoverAvailable: hoverAvailable(state), hoverTypical: site.hoverNeed * (D.LANDING.difficultyFactor[state.difficulty || 'engineer'] || 1),
    };
  }
  /** Seconds the lander can hover: built-in reserve + the usable share of the descent margin ÷ lunar gravity. */
  function hoverAvailable(state) {
    const extraDv = D.DV.descent.value * marginOf(state) * D.LANDING.hoverShare;
    return D.LANDING.baseHoverSec + extraDv / D.MOON.gravity;
  }
  /** Seeded descent: compares hover seconds available with what the terrain demands. Pure. */
  function landingSim(state, seed) {
    const site = findSite(state.site); if (!site) return null;
    const L = D.LANDING, r = rng(((seed >>> 0) ^ 0x5eed) + site.id.length * 101);
    const factor = L.difficultyFactor[state.difficulty || 'engineer'] || 1;
    const need = site.hoverNeed * factor * (1 - L.needSpread / 2 + L.needSpread * r());
    const avail = hoverAvailable(state);
    const outcome = avail >= need ? 'clean' : avail >= need * L.roughFraction ? 'rough' : 'abort';
    const used = Math.min(avail, need);
    return {
      site, seed: seed >>> 0, hoverNeeded: need, hoverAvailable: avail, hoverUsed: used,
      dvUsedHovering: used * D.MOON.gravity, outcome,
      message: outcome === 'clean' ? `Touchdown! You hovered ${fmt(used)} s to find a safe spot and had fuel to spare.`
        : outcome === 'rough' ? `Rough landing: you ran low on fuel after ${fmt(used)} s and set down on uneven ground.`
          : `Abort! The terrain needed about ${fmt(need)} s of hovering but you only had ${fmt(avail)} s of fuel. The lander climbs back to orbit.`,
    };
  }
  function landingMath(state, sim) {
    const m = marginOf(state), extra = D.DV.descent.value * m;
    const steps = [
      { eq: 'Δv = g · t', num: `hovering costs ${D.MOON.gravity} m/s of delta-v every second` },
      { eq: 'extra Δv = Δv · margin', num: `${fmt(D.DV.descent.value)} m/s × ${Math.round(m * 100)}% = ${fmt(extra)} m/s` },
      { eq: 'usable = extra Δv × share', num: `${fmt(extra)} m/s × ${Math.round(D.LANDING.hoverShare * 100)}% = ${fmt(extra * D.LANDING.hoverShare)} m/s (the rest covers drift and landing errors)` },
      { eq: 't = usable Δv / g', num: `${fmt(extra * D.LANDING.hoverShare)} ÷ ${D.MOON.gravity} = ${fmt(extra * D.LANDING.hoverShare / D.MOON.gravity)} s + ${D.LANDING.baseHoverSec} s built in = ${fmt(hoverAvailable(state))} s` },
    ];
    if (sim) steps.push({ eq: 'needed here', num: `about ${fmt(sim.hoverNeeded)} s to dodge the hazards` });
    return { title: 'Landing: why your Phase 3 margin matters', steps, src: 'nssdc' };
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

  /* ======================= PHASE 6: surface science =======================
   * state.surface = { actions: [ {type:'measure', poi, instrument} | {type:'send'} | {type:'event', id, choice} ], finished }
   * Everything else (hours, buffer, samples, evidence, journal) is rebuilt by replaying the actions, so a saved
   * game can be re-checked step by step (see sanitizeState).
   */
  const fmtH = (h) => fmt(h, Math.abs(h % 1) > 1e-9 ? 1 : 0);
  const EVIDENCE = Object.fromEntries(D.SURFACE.evidence.map(e => [e.id, e]));
  function surfacePois(state) { return (state.site && D.SURFACE.pois[state.site]) || []; }
  /** Landed (not aborted) with a mission defined. */
  function canExplore(state) {
    return !!findSite(state.site) && !!state.landing && state.landing.outcome !== 'abort' && !!evaluate(state);
  }
  /** Moonwalk hours: walks × duration × crew who go down. The site report uses this same product. */
  function crewEvaHours(life) {
    return D.LIFE.evaPlan.count * life.suit.evaHours * life.landingCrew;
  }
  /** Daylight at the chosen site. With no site yet, the equatorial day. */
  function daylightHours(state) {
    const site = findSite(state && state.site);
    return site ? site.lightHours : D.SITES[0].lightHours;
  }
  /** Hours for surface work. A rough landing costs time. */
  function surfaceHours(state) {
    let h = 0;
    if (state.missionType === 'crewed') { const l = lifeSupport(state); h = l ? crewEvaHours(l) : 0; }
    else if (state.missionType === 'robotic') h = daylightHours(state);
    if (state.landing && state.landing.outcome === 'rough') h -= D.SURFACE.roughLandingPenalty;
    return Math.max(0, h);
  }
  /** Spare power for instruments: generation minus everything else that is switched on. */
  function surfacePower(state) {
    const r = evaluate(state); if (!r) return null;
    const sciPower = ((state.design && state.design.science) || []).reduce((a, id) => {
      const o = findOpt('science', id); return a + ((o && o[state.missionType] && o[state.missionType].power) || 0);
    }, 0);
    const idle = r.powerNeed - sciPower;
    return { capacity: r.powerGen, idle, available: Math.max(0, r.powerGen - idle) };
  }
  /** Evidence an instrument gives for this question: the hydrogen detector is only good proof for the water question. */
  function instrumentEvidence(state, id) {
    const ins = D.SURFACE.instruments[id]; if (!ins) return null;
    return ins.onlyFor && ins.onlyFor !== state.question ? ins.evidenceOtherwise : ins.evidence;
  }
  function surfaceResult(state, id) { const site = D.SURFACE.results[state.site]; return (site && site[id]) || null; }
  /** Cost of one measurement, for chips and HUD ghost bars. */
  function measureCost(state, id) {
    const ins = D.SURFACE.instruments[id]; if (!ins) return null;
    return { hours: ins.hours, power: ins.power, dataGb: ins.dataGb, sampleKg: id === 'sampler' ? (D.SURFACE.sampleKg[state.missionType] || 0) : 0, evidence: instrumentEvidence(state, id) };
  }
  /** Replay the action list. Pure: never mutates state. */
  function surfaceStatus(state) {
    const S = D.SURFACE, type = state.missionType;
    const actions = (state.surface && state.surface.actions) || [];
    const loaded = (state.design && state.design.science) || [];
    const usable = loaded.filter(id => unlockedInstruments(state).includes(id) && S.instruments[id]);
    const st = {
      hoursTotal: surfaceHours(state), hoursUsed: 0, hoursLeft: 0, power: surfacePower(state),
      bufferGb: 0, bufferMax: (S.bufferGb[type] || S.bufferGb.robotic), dataSentGb: 0,
      sampleKg: 0, sampleCapacityKg: needsReturn(state) ? (S.returnCapacityKg[type] || 0) : 0,
      noSignal: 0, risk: 0, measurements: 0, journal: [], events: [],
      segments: { clue: false, composition: false, sample: false }, evidence: null,
      finished: !!(state.surface && state.surface.finished),
    };
    const used = {}; // poi -> [instrument]
    for (const a of actions) {
      if (a.type === 'measure') {
        const ins = S.instruments[a.instrument]; if (!ins) continue;
        const ev = instrumentEvidence(state, a.instrument), res = surfaceResult(state, a.instrument);
        st.journal.push({
          missionHour: st.hoursUsed, poi: a.poi, instrument: a.instrument, evidence: ev, result: res,
          note: a.instrument === 'neutron' && state.site === 'southPole' ? S.hydrogenNote : null,
        });
        st.hoursUsed += ins.hours; st.bufferGb += ins.dataGb;
        if (a.instrument === 'sampler') st.sampleKg += S.sampleKg[type] || 0;
        st.segments[ev] = true;
        if (!st.evidence || EVIDENCE[ev].rank > EVIDENCE[st.evidence].rank) st.evidence = ev;
        if (st.noSignal > 0) st.noSignal--;
        (used[a.poi] = used[a.poi] || []).push(a.instrument);
        st.measurements++;
      } else if (a.type === 'send') {
        st.dataSentGb += st.bufferGb; st.bufferGb = 0;
      } else if (a.type === 'event') {
        const ev = D.SURFACE_EVENTS.find(e => e.id === a.id), ch = ev && ev.choices.find(c => c.id === a.choice);
        if (!ch) continue;
        const eff = ch.effect || {};
        if (eff.hours) st.hoursUsed -= eff.hours; // hours are negative in the data: time lost
        if (eff.risk) st.risk += eff.risk;
        if (eff.noSignal) st.noSignal = Math.max(st.noSignal, eff.noSignal);
        st.events.push({ id: a.id, choice: a.choice });
      }
    }
    st.hoursLeft = Math.max(0, st.hoursTotal - st.hoursUsed);
    st.bufferFull = st.bufferGb >= st.bufferMax - 1e-9;
    st.meter = st.evidence ? EVIDENCE[st.evidence].meter : null;
    st.pois = surfacePois(state).map(p => {
      const u = used[p.id] || [];
      const done = u.length > 0 && (u.includes('sampler') || usable.every(id => u.includes(id)));
      return { id: p.id, title: p.title, used: u, status: !u.length ? 'Not studied' : done ? 'Done' : 'Studied: ' + u.map(id => S.instruments[id].short).join(', ') };
    });
    st.instruments = loaded.filter(id => S.instruments[id]).map(id => Object.assign({ id }, S.instruments[id], {
      locked: !usable.includes(id), lockReason: usable.includes(id) ? null : 'Your Phase 0 question doesn\'t need this',
      evidenceNow: instrumentEvidence(state, id), chip: EVIDENCE[instrumentEvidence(state, id)].chip,
    }));
    return st;
  }
  /** Can this instrument be used on this spot right now? { ok, code, reason } */
  function canMeasure(state, poiId, instrumentId) {
    const no = (code, reason) => ({ ok: false, code, reason });
    if (!canExplore(state)) return no('notLanded', 'Land on the Moon first');
    if (state.missionType === 'crewed' && !lifeSupport(state)) return no('noCrew', 'Choose your crew in Phase 2 first');
    if (!surfacePois(state).some(p => p.id === poiId)) return no('unknownPoi', 'Pick a spot on the map');
    const ins = D.SURFACE.instruments[instrumentId];
    if (!ins || !((state.design && state.design.science) || []).includes(instrumentId)) return no('notLoaded', 'This instrument is not on board');
    if (!unlockedInstruments(state).includes(instrumentId)) return no('notNeeded', 'Your Phase 0 question doesn\'t need this');
    const st = surfaceStatus(state);
    if (st.finished) return no('finished', 'Exploration is finished');
    if (((state.surface && state.surface.actions) || []).length >= D.SURFACE.maxActions) return no('tooMany', 'Logbook full');
    if (st.pois.find(p => p.id === poiId).used.includes(instrumentId)) return no('repeat', 'Already measured here with this instrument');
    if (ins.hours > st.hoursLeft + 1e-9) return no('noTime', `Not enough time: needs ${fmtH(ins.hours)} h`);
    if (st.power && ins.power > st.power.available) return no('noPower', `Not enough power: needs ${fmt(ins.power)} W`);
    if (st.bufferGb + ins.dataGb > st.bufferMax + 1e-9) return no('bufferFull', 'Data buffer full. Send data before measuring again.');
    if (instrumentId === 'sampler' && st.sampleKg + (D.SURFACE.sampleKg[state.missionType] || 0) > st.sampleCapacityKg + 1e-9) return no('boxFull', 'No room left for samples');
    return { ok: true, code: null, reason: null };
  }
  function withAction(state, action) {
    const next = JSON.parse(JSON.stringify(state));
    next.surface = Object.assign({ actions: [], finished: false }, next.surface || {});
    next.surface.actions = (next.surface.actions || []).concat(action);
    return next;
  }
  /** Pure: take a measurement. Returns { ok, reason, state, entry } (state unchanged when not ok). */
  function measure(state, poiId, instrumentId) {
    const c = canMeasure(state, poiId, instrumentId);
    if (!c.ok) return { ok: false, code: c.code, reason: c.reason, state };
    const next = withAction(state, { type: 'measure', poi: poiId, instrument: instrumentId });
    const st = surfaceStatus(next);
    return { ok: true, state: next, entry: st.journal[st.journal.length - 1] };
  }
  function canSendData(state) {
    if (!canExplore(state)) return { ok: false, code: 'notLanded', reason: 'Land on the Moon first' };
    const st = surfaceStatus(state);
    if (st.noSignal > 0) return { ok: false, code: 'noSignal', reason: 'No signal: behind the Moon' };
    if (st.bufferGb <= 0) return { ok: false, code: 'empty', reason: 'Nothing to send yet' };
    if (((state.surface && state.surface.actions) || []).length >= D.SURFACE.maxActions) return { ok: false, code: 'tooMany', reason: 'Logbook full' };
    return { ok: true };
  }
  /** Pure: send the data buffer to Earth. */
  function sendData(state) {
    const c = canSendData(state);
    return c.ok ? { ok: true, state: withAction(state, { type: 'send' }) } : Object.assign({ state }, c);
  }
  /** Maybe one surface event after the latest measurement. Deterministic for (seed, measurement count). Never repeats. */
  function rollSurfaceEvent(state, seed) {
    const st = surfaceStatus(state);
    if (st.finished || !st.measurements) return null;
    const r = rng((seed >>> 0) * 31 + st.measurements * 104729 + 6);
    if (r() >= (D.SURFACE_EVENT_CHANCE[state.difficulty || 'engineer'] || 0)) return null;
    const seen = st.events.map(e => e.id);
    const pool = D.SURFACE_EVENTS.filter(e => !seen.includes(e.id) && (!e.crewedOnly || state.missionType === 'crewed'));
    return pool.length ? pool[Math.floor(r() * pool.length)] : null;
  }
  /** Pure: apply a surface event choice (each event at most once). */
  function applySurfaceEventChoice(state, eventId, choiceId) {
    const ev = D.SURFACE_EVENTS.find(e => e.id === eventId);
    if (!ev || !ev.choices.some(c => c.id === choiceId)) return state;
    if (ev.crewedOnly && state.missionType !== 'crewed') return state;
    const st = surfaceStatus(state);
    if (st.finished || st.events.some(e => e.id === eventId)) return state;
    if (((state.surface && state.surface.actions) || []).length >= D.SURFACE.maxActions) return state;
    return withAction(state, { type: 'event', id: eventId, choice: choiceId });
  }
  /** Pure: end the exploration. confirm is the question to ask when hours are left. */
  function finishSurface(state) {
    const st = surfaceStatus(state);
    if (!st.measurements) return { ok: false, code: 'noMeasurement', reason: 'Take at least one measurement', state };
    const next = JSON.parse(JSON.stringify(state));
    next.surface = Object.assign({ actions: [] }, next.surface || {}, { finished: true });
    return { ok: true, state: next, confirm: st.hoursLeft > 1e-9 ? `You still have ${fmtH(st.hoursLeft)} hours. Finish anyway?` : null };
  }
  /** Closing screen of Phase 6, chosen by the strongest evidence. */
  function surfaceOutcome(state) {
    const st = surfaceStatus(state);
    if (!st.evidence) return null;
    return Object.assign({ evidence: st.evidence, meter: st.meter, sampleKg: st.sampleKg }, D.SURFACE.outcomes[st.evidence]);
  }

  /* ======================= PHASE 7: return to Earth =======================
   * state.returnTrip = { seed, entry, shield }
   * Delta-v: the return burns were fueled in Phase 3 (dv × (1 + margin)). Samples lighter than the allowance give
   * a little extra (rocket equation). Shown to players as one pool, as in the screen guide: 3,283 − 1,833 = 1,450.
   * Each burn may need up to a few % more than the textbook value (navigation dispersion, game value).
   */
  function returnApplies(state) { return needsReturn(state) && !!evaluate(state); }
  function findEntry(id) { return D.RETURN.entries.find(e => e.id === id) || null; }
  function findShield(id) { return D.RETURN.shields.find(s => s.id === id) || null; }
  /** Final mass each return burn pushes and how much of it is the sample allowance. */
  function returnBurnMasses(state) {
    const r = evaluate(state); if (!r) return null;
    if (state.missionType === 'crewed') {
      return { ascent: { mFinal: r.breakdown.ascent, allowance: D.BASE.crewed.samples.mass }, tei: { mFinal: r.breakdown.orbiter, allowance: 0 } };
    }
    return { direct: { mFinal: D.BASE.robotic.returnCapsule.mass, allowance: D.SURFACE.returnCapacityKg.robotic } };
  }
  /** The two fuel steps (or one for a robot capsule): needed vs available delta-v, in order. Pure and seeded. */
  function returnBurns(state, seed) {
    if (!returnApplies(state)) return null;
    const keys = D.RETURN.burns[state.missionType], k = 1 + marginOf(state);
    const masses = returnBurnMasses(state);
    const collected = surfaceStatus(state).sampleKg;
    const disp = D.RETURN.dispersion[state.difficulty || 'engineer'] || 0;
    const r = rng(((seed >>> 0) ^ 0x7e7) + 7);
    const burns = keys.map(key => {
      const dv = D.DV[key].value, planned = dv * k, m = masses[key];
      const prop = m.mFinal * fuelPerKg(planned), tanks = prop * D.ENGINE.tankFraction;
      const mActual = m.mFinal - Math.max(0, m.allowance - collected); // empty sample box = lighter cabin
      const available = ve * Math.log((mActual + prop + tanks) / (mActual + tanks));
      const extra = disp * r();
      return { key, label: D.RETURN.stepLabels[key], src: D.DV[key].src, dv, planned, available, dispersion: extra, need: dv * (1 + extra) };
    });
    const pool = burns.reduce((a, b) => a + b.available, 0);
    let remaining = pool, failAt = null;
    for (const b of burns) {
      b.before = remaining; b.ok = remaining >= b.need - 1e-9;
      remaining -= b.need; b.after = remaining;
      if (!b.ok && !failAt) failAt = b.key;
    }
    return { burns, pool, remaining, ok: !failAt, failAt, margin: marginOf(state) };
  }
  /** Heat shield check. entryId / shieldId override the saved choice (for previewing the slider). */
  function thermalCheck(state, entryId, shieldId) {
    const rt = state.returnTrip || {};
    const entry = findEntry(entryId || rt.entry), shield = findShield(shieldId || rt.shield);
    if (!entry || !shield) return null;
    const T = D.RETURN.thermal;
    const load = entry.heatLoad * (T.loadFactor[state.difficulty || 'engineer'] || 1);
    const ratio = shield.capacity / load;
    const status = ratio >= T.okRatio ? 'ok' : ratio >= T.lowRatio ? 'low' : 'tooLow';
    return {
      entry, shield, load, ratio, status, addedMass: shield.mass[state.missionType] || 0,
      label: status === 'ok' ? 'Thermal margin: OK' : status === 'low' ? 'Thermal margin: low' : 'Thermal margin: too low',
      message: status === 'ok' ? null : `${shield.title} shield with ${entry.title.toLowerCase()} leaves ${status === 'low' ? 'little' : 'no'} margin.`,
    };
  }
  /** Seeded splashdown: miss distance from the target vs the recovery zone. */
  function splashdown(state, seed, entryId) {
    const entry = findEntry(entryId || (state.returnTrip && state.returnTrip.entry)); if (!entry) return null;
    const R = D.RETURN, r = rng(((seed >>> 0) ^ 0x5a1) + 13);
    const maxMiss = entry.missKm * (R.missFactor[state.difficulty || 'engineer'] || 1);
    const missKm = R.minMissKm + Math.max(0, maxMiss - R.minMissKm) * r();
    const inZone = missKm <= R.recoveryZoneKm + 1e-9;
    return { entry, missKm, zoneKm: R.recoveryZoneKm, inZone, score: inZone ? Math.round(100 * (1 - missKm / R.recoveryZoneKm)) : 0 };
  }
  /** Whole return, step by step, with the first failure and its cause chain. Pure. */
  function returnSim(state) {
    if (!returnApplies(state)) return { applicable: false };
    const rt = state.returnTrip || {}, seed = Number.isInteger(rt.seed) ? rt.seed : 0;
    const fuel = returnBurns(state, seed);
    const out = { applicable: true, seed, fuel, thermal: null, splash: null, outcome: 'pending', failure: null };
    if (!fuel.ok) { out.outcome = 'fail'; out.failure = failureReport(state, 'fuel', out); return out; }
    out.thermal = thermalCheck(state);
    if (!out.thermal) return out;
    if (out.thermal.status === 'tooLow') { out.outcome = 'fail'; out.failure = failureReport(state, 'thermal', out); return out; }
    out.splash = splashdown(state, seed);
    if (!out.splash.inZone) { out.outcome = 'fail'; out.failure = failureReport(state, 'zone', out); return out; }
    out.outcome = 'success';
    return out;
  }
  /** "Not just you lost": cause in plain words + a 3-step chain built from the real game state. */
  function failureReport(state, kind, sim) {
    const descope = D.RETURN.descope;
    if (kind === 'fuel') {
      const b = sim.fuel.burns.find(x => x.key === sim.fuel.failAt);
      const pct = Math.round(marginOf(state) * 100);
      return {
        code: 'fuelShort', step: b.key, backTo: 3, descope,
        title: `Not enough fuel for the ${b.label.toLowerCase()}`,
        sub: `The ${b.label.toLowerCase()} needs ${fmt(b.need)} m/s. Remaining budget was ${fmt(Math.max(0, b.before))} m/s.`,
        chain: [
          { text: `Decision: ${pct}% delta-v reserve`, phase: 3 },
          { text: `Effect: ${fmt(sim.fuel.pool)} m/s for the trip home`, phase: 3 },
          { text: `Result: ${fmt(b.need - Math.max(0, b.before))} m/s short at "${b.label}"`, phase: 7 },
        ],
      };
    }
    if (kind === 'thermal') {
      const t = sim.thermal;
      return {
        code: 'thermalTooLow', step: 'reentry', backTo: 7,
        descope: { text: 'Pick a thicker heat shield, or a direct entry, which heats the shield less.', src: 'avcoat' },
        title: 'The heat shield could not take the heat',
        sub: t.message,
        chain: [
          { text: `Decision: ${t.shield.title.toLowerCase()} heat shield`, phase: 7 },
          { text: `Effect: ${t.entry.title.toLowerCase()} heat load ${fmt(t.load, 2)}`, phase: 7 },
          { text: `Result: thermal margin ${fmt(t.ratio, 2)}×, needs ${fmt(D.RETURN.thermal.lowRatio, 2)}×`, phase: 7 },
        ],
      };
    }
    const s = sim.splash;
    return {
      code: 'missedZone', step: 'splashdown', backTo: 7,
      descope: { text: 'Pick skip entry: it steers the capsule and lands closer to the ships.', src: 'skipEntry' },
      title: 'Splashdown outside the recovery zone',
      sub: `The capsule came down ${fmt(s.missKm, 1)} km from the target. Recovery ships cover ${fmt(s.zoneKm)} km.`,
      chain: [
        { text: `Decision: ${s.entry.title.toLowerCase()}`, phase: 7 },
        { text: `Effect: landed ${fmt(s.missKm, 1)} km from the target`, phase: 7 },
        { text: `Result: outside the ${fmt(s.zoneKm)} km recovery zone`, phase: 7 },
      ],
    };
  }
  /** "Show the math" for the return burns: remaining − needed = what is left for the next step. */
  function returnMath(state) {
    const rt = state.returnTrip || {};
    const f = returnBurns(state, Number.isInteger(rt.seed) ? rt.seed : 0); if (!f) return null;
    const planned = f.burns.reduce((a, b) => a + b.planned, 0);
    const steps = [{ eq: 'budget = Σ Δv × (1 + margin)', num: `(${f.burns.map(b => fmt(b.dv)).join(' + ')}) m/s × ${fmt(1 + f.margin, 2)} = ${fmt(planned)} m/s` }];
    if (f.pool - planned >= 0.5) steps.push({ eq: 'lighter = more Δv', num: `+ ${fmt(f.pool - planned)} m/s because the sample box is not full = ${fmt(f.pool)} m/s` });
    f.burns.forEach(b => steps.push({ eq: 'left = remaining − needed', num: `${fmt(b.before)} m/s − ${fmt(b.need)} m/s = ${fmt(b.after)} m/s after "${b.label}"` }));
    return { title: 'Fuel for the trip home', steps, check: f.ok ? 'Enough fuel to come home ✔' : `Short at "${D.RETURN.stepLabels[f.failAt]}"`, src: 'cev' };
  }

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
    if (n === 4) {
      const c = commsPlan(state);
      if (!c.link) block('noLink', 'Pick how your spacecraft talks to Earth');
      if (!c.dish) block('noDish', 'Pick a Deep Space Network antenna');
      if (state.rocket && r.fitsRocket === false) block('tooHeavy', `The radio made you too heavy for ${r.rocket.title} by ${fmt(r.tli - r.rocket.capacity)} kg`);
      if (r.powerGen < r.powerNeed) block('noPower', `Power short by ${fmt(r.powerNeed - r.powerGen)} W`);
      if (r.overBudget) block('overBudget', `Over budget by $${fmt(r.totalCost - r.budget)}M`);
      if (c.bottleneck) warn('dataBottleneck', `Your instruments make ${fmt(c.needGbPerDay)} Gb a day but you can send only ${fmt(c.gbPerDay)} Gb`);
      if (c.weatherRisk) warn('laserWeather', 'Clouds over the ground station can block the laser');
      return result(issues);
    }
    if (n === 5) {
      const sr = siteReport(state);
      if (!sr) { block('noSite', 'Pick a landing site'); return result(issues); }
      if (!sr.scienceMatch) warn('siteMismatch', 'This site is not the best place to answer your question');
      if (!sr.survivesNight) warn('nightDeath', `Your lander survives ${fmt(sr.nightHours || 0)} h of darkness; nights here last ${sr.site.darkHours} h`);
      if (sr.coldRisk) warn('suitCold', 'Your suit cannot enter the freezing shadowed craters here');
      if (sr.earthView === 'intermittent') warn('earthHidden', 'Earth is low on the horizon here: contact comes and goes');
      if (sr.hoverAvailable < sr.hoverTypical) warn('lowHover', `This terrain usually needs ~${fmt(sr.hoverTypical)} s of hovering; you have ${fmt(sr.hoverAvailable)} s`);
      const landerKg = approachMass(state), band = D.LANDING.massRange[state.missionType];
      if (landerKg && band && (landerKg < band.min || landerKg > band.max)) warn('landerMass', `Lander mass is ${fmt(landerKg)} kg. A ${state.missionType} landing is sized for ${fmt(band.min)}–${fmt(band.max)} kg. You can still fly.`);
      if (state.landing && state.landing.outcome === 'abort') block('landingAbort', 'The landing was aborted: no surface science this time');
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
    if (n === 6) {
      if (!findSite(state.site) || !state.landing) { block('noLanding', 'Land on the Moon first', 5); return result(issues); }
      if (state.landing.outcome === 'abort') { block('landingAbort', 'The landing was aborted: no surface science this time', 5); return result(issues); }
      const st = surfaceStatus(state);
      if (!st.measurements) block('noMeasurement', 'Take at least one measurement');
      else {
        if (!st.finished && st.hoursLeft > 1e-9) warn('hoursLeft', `You still have ${fmtH(st.hoursLeft)} hours. Finish anyway?`);
        if (st.evidence === 'clue') warn('weakEvidence', 'Pictures are clues: you need composition or samples for proof');
        if (state.measure === 'sample' && st.sampleKg === 0) warn('noSample', 'Your plan was to bring samples home, but none were collected');
      }
      if (st.bufferGb > 0) warn('unsentData', `${fmt(st.bufferGb, 1)} Gb of data not sent yet`);
      if (st.risk > 0) warn('surfaceRisk', 'The crew kept working during a solar storm: safety score is lower');
      return result(issues);
    }
    if (n === 7) {
      if (!returnApplies(state)) return result(issues); // one-way robots stay on the Moon
      const rt = state.returnTrip || {};
      const fuel = returnBurns(state, Number.isInteger(rt.seed) ? rt.seed : 0);
      if (!fuel.ok) { block('fuelShort', `Not enough fuel to come home: needs ${fmt(fuel.burns.find(b => b.key === fuel.failAt).need)} m/s`, 3); return result(issues); }
      if (!findEntry(rt.entry)) block('noEntry', 'Pick a reentry path');
      if (!findShield(rt.shield)) block('noShield', 'Pick a shield thickness');
      const t = thermalCheck(state);
      if (t && t.status === 'tooLow') block('thermalTooLow', 'Thermal margin: too low');
      else if (t && t.status === 'low') warn('thermalLow', t.message);
      if (t && t.status !== 'tooLow') {
        const s = splashdown(state, Number.isInteger(rt.seed) ? rt.seed : 0);
        if (!s.inZone) block('missedZone', `Splashdown ${fmt(s.missKm, 1)} km from the target, outside the ${fmt(s.zoneKm)} km recovery zone`);
      }
      return result(issues);
    }
    return result(issues);
  }
  function result(issues) { return { ok: !issues.some(i => i.severity === 'block'), issues }; }
  /** Everything from Phase 0 to 4 must be GO before launch (the radio flies with the spacecraft). */
  function launchReadiness(state) {
    const all = [0, 1, 2, 3, 4].map(n => ({ phase: n, ...validatePhase(state, n) }));
    return { go: all.every(x => x.ok), phases: all, issues: all.flatMap(x => x.issues) };
  }

  /** Delta-v still to fly. flown = burn keys already done (loi, descent, ascent, tei, direct). Null without a mission type. */
  function dvRemaining(state, flown) {
    if (!state.missionType) return null;
    const done = new Set(flown || []);
    const plan = flightPlanFor(state);
    let planned = plan.dvPlanned, required = plan.dvRequired;
    for (const b of plan.burns) if (done.has(b.key)) { planned -= b.dvPlanned; required -= b.dv; }
    return { planned, required };
  }
  /** Mission length in hours. Crewed: the Phase 2 crew days. Robotic: transit, site daylight, then one downlink day. Null without a mission. */
  function missionHours(state) {
    if (state.missionType === 'crewed') { const l = lifeSupport(state); return l ? l.days * 24 : null; }
    if (state.missionType !== 'robotic') return null;
    return D.LIFE.transitDays * 24 + daylightHours(state) + 24;
  }
  /** Mission length in days, rounded the way the HUD shows it. */
  function missionDays(state) {
    const h = missionHours(state);
    return h == null ? null : state.missionType === 'crewed' ? h / 24 : Math.round(h / 24);
  }
  /** Rows for the launch pad summary, raw values. Row ok is true when no block is left for that row. */
  function launchRows(state) {
    const G = launchReadiness(state), r = evaluate(state), crewed = state.missionType === 'crewed';
    const bl = (ns, skip) => G.phases.filter(p => ns.includes(p.phase)).every(p => !p.issues.some(i => i.severity === 'block' && !(skip || []).includes(i.code)));
    const heavy = G.phases.every(p => !p.issues.some(i => i.code === 'tooHeavy'));
    const days = missionDays(state);
    const q = D.QUESTIONS.find(x => x.id === state.question);
    const link = state.comms && D.COMMS.links.find(x => x.id === state.comms.link);
    const row = (key, label, ok, value, unit) => ({ key, label, ok, value, unit });
    const rows = [
      row('goal', 'Mission goal', bl([0]), q ? q.title : null, null),
      row('spacecraft', 'Spacecraft', bl([1], ['tooHeavy']), r && r.rocket ? r.rocket.title : null, null),
      row('totalMass', 'Total mass', heavy, r ? r.tli : null, 'kg'),
      row('deltaV', 'Delta-v', bl([3], ['tooHeavy']), r ? r.dvPlanned : null, 'm/s'),
      row('crew', 'Crew', bl([2], ['tooShort', 'tooHeavy']), crewed && state.crew ? state.crew.size : null, 'people'),
      row('missionDays', 'Mission days', bl([2], ['noCrew', 'noSuit', 'tooHeavy']) && (!crewed || !G.phases[2].issues.some(i => i.code === 'tooShort')), days, 'days'),
      row('lifeSupport', 'Life support', bl([2]), crewed ? 'ok' : 'notNeeded', null),
      row('comms', 'Comms', bl([4]), link ? link.title : null, null),
    ];
    return { go: G.go, rows, G };
  }
  /** Everything the HUD bar shows, in one call. opts = { flown, dataSentGb }. Zeros or null before a mission type is set. */
  function hud(state, opts) {
    const o = opts || {}, r = evaluate(state);
    const onSurface = !!(r && state.landing && state.site);
    const dataSent = Number.isFinite(o.dataSentGb) ? o.dataSentGb : onSurface ? surfaceStatus(state).dataSentGb : 0;
    return {
      launchMass: r ? r.tli : 0, capacity: r && r.rocket ? r.rocket.capacity : null,
      hardware: r ? r.dry : 0, fuel: r ? r.propellant : 0,
      cost: r ? r.totalCost : 0, budget: r ? r.budget : 0, overBudget: r ? r.overBudget : false,
      powerNeed: r ? r.powerNeed : 0, powerGen: r ? r.powerGen : 0,
      dvPlanned: r ? r.dvPlanned : 0, dvRemaining: r ? dvRemaining(state, o.flown) : null,
      dataNeedGbPerDay: r ? dataNeedPerDay(state) : 0, dataSentGb: dataSent,
      days: missionDays(state),
    };
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
    if (raw.comms && typeof raw.comms === 'object') {
      s.comms = { link: oneOf(raw.comms.link, D.COMMS.links.map(l => l.id)), dish: oneOf(raw.comms.dish, D.COMMS.dishes.map(d => d.id)) };
    }
    s.site = oneOf(raw.site, D.SITES.map(x => x.id));
    if (s.site && raw.landing && typeof raw.landing === 'object' && Number.isInteger(raw.landing.seed)) {
      s.landing = { seed: raw.landing.seed >>> 0, outcome: oneOf(raw.landing.outcome, ['clean', 'rough', 'abort']) };
    }
    s.flight.margin = D.FLIGHT.marginOptions.includes(raw.flight && raw.flight.margin) ? raw.flight.margin : D.FLIGHT.defaultMargin;
    const e = raw.events && typeof raw.events === 'object' ? raw.events : {};
    s.events.massGrowth = num(e.massGrowth, 0, 0.5, 0);
    s.events.extraCost = num(e.extraCost, 0, 5000, 0);
    s.events.risk = Math.round(num(e.risk, 0, 10, 0));
    s.events.extraDays = Math.round(num(e.extraDays, 0, 10, 0));
    s.events.log = Array.isArray(e.log) ? e.log.filter(x => x && D.EVENTS.some(ev => ev.id === x.id && ev.choices.some(c => c.id === x.choice))).map(x => ({ id: x.id, choice: x.choice })).slice(0, 20) : [];
    // Phase 6: replay every saved action through the real rules; anything that would not be allowed is dropped.
    if (raw.surface && typeof raw.surface === 'object' && Array.isArray(raw.surface.actions) && canExplore(s)) {
      let t = Object.assign({}, s, { surface: { actions: [], finished: false } });
      for (const a of raw.surface.actions.slice(0, D.SURFACE.maxActions)) {
        if (!a || typeof a !== 'object') continue;
        if (a.type === 'measure' && typeof a.poi === 'string' && typeof a.instrument === 'string') t = measure(t, a.poi, a.instrument).state;
        else if (a.type === 'send') t = sendData(t).state;
        else if (a.type === 'event' && typeof a.id === 'string' && typeof a.choice === 'string') t = applySurfaceEventChoice(t, a.id, a.choice);
      }
      if (raw.surface.finished === true) t = finishSurface(t).state;
      s.surface = t.surface;
    }
    // Phase 7
    if (raw.returnTrip && typeof raw.returnTrip === 'object' && needsReturn(s)) {
      const rt = raw.returnTrip;
      s.returnTrip = {
        seed: Number.isInteger(rt.seed) ? rt.seed >>> 0 : 0,
        entry: oneOf(rt.entry, D.RETURN.entries.map(x => x.id)),
        shield: oneOf(rt.shield, D.RETURN.shields.map(x => x.id)),
      };
    }
    return s;
  }

  /** A fresh game state. */
  function newState() {
    return { difficulty: 'engineer', question: null, measure: null, missionType: null, design: { science: [] }, rocket: null,
      crew: null, flight: { margin: D.FLIGHT.defaultMargin }, comms: null, site: null, landing: null, events: { massGrowth: 0, extraCost: 0, risk: 0, extraDays: 0, log: [] },
      surface: null, returnTrip: null };
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

  const MODEL = {
    // Phase 6
    surfacePois, canExplore, surfaceHours, surfacePower, instrumentEvidence, surfaceResult, measureCost, surfaceStatus,
    canMeasure, measure, canSendData, sendData, rollSurfaceEvent, applySurfaceEventChoice, finishSurface, surfaceOutcome,
    // Phase 7
    returnApplies, findEntry, findShield, returnBurns, thermalCheck, splashdown, returnSim, returnMath,
    commsPlan, commsMath, lightDelay, dishGain, dataNeedPerDay, siteReport, hoverAvailable, landingSim, landingMath, approachMass, daylightHours, findSite, sanitizeState, marginOf, factorsFor, minDays, lifeSupport, lifeMath, flightPlan: flightPlanFor, minMargin, validatePhase, launchReadiness, dvRemaining, missionHours, missionDays, launchRows, hud, rng, rollEvent, applyEventChoice, newState, defaultCrew, sci, fuelPerKg, gearForSub, whereOf, fmt, ve, batteryMass, powerMass, moonDensityMath, moonGravityMath, batteryMath, rocketMath, fuelFactor, F, evaluate, previewWith, gearRatio, needsReturn, unlockedInstruments, requiredInstruments, payloadAnswers, missingSubsystems, descopeSuggestions, optionsFor, findOpt, findSub };
  if (typeof module !== 'undefined' && module.exports) module.exports = MODEL;
  else root.SS_MODEL = MODEL;
})(typeof window !== 'undefined' ? window : globalThis);
