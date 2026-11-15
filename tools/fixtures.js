// Builds one JSON file per screen (and mission type) in fixtures/, so screens can be wired without the engine.
// Run: node tools/fixtures.js. Output is deterministic: fixed seeds, no dates.
// Each file: { screen, title, missionType, note, state, engine: {...}, sim: { success, partial, fail } }
const fs = require('fs');
const path = require('path');
const D = require('../js/data.js');
const M = require('../js/model.js');
const SIM = require('../js/sim.js');

const OUT = path.join(__dirname, '..', 'fixtures');
fs.mkdirSync(OUT, { recursive: true });
const clone = (x) => JSON.parse(JSON.stringify(x));
const SEED = 7;

/* ---------- states ---------- */
function roboticBase() {
  const s = M.newState();
  Object.assign(s, { difficulty: 'cadet', question: 'made', measure: 'chem', missionType: 'robotic' });
  s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'solarBig', science: ['spectrometer', 'camera'] };
  return s;
}
function crewedBase() {
  const s = M.newState();
  Object.assign(s, { difficulty: 'cadet', question: 'made', measure: 'chem', missionType: 'crewed' });
  s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'crewSolar', science: ['spectrometer', 'camera'] };
  return s;
}
const withRocket = (s, id) => Object.assign(clone(s), { rocket: id });
const withCrew = (s, c) => Object.assign(clone(s), { crew: Object.assign(M.defaultCrew(), { suit: 'lunar' }, c) });
const withFlight = (s, margin) => Object.assign(clone(s), { flight: { margin } });
const withComms = (s, link, dish) => Object.assign(clone(s), { comms: { link, dish } });
const withSite = (s, site) => Object.assign(clone(s), { site });

/* A state that passed phases 0 to 4, ready for launch and landing. */
function full(type) {
  let s = type === 'robotic' ? withRocket(roboticBase(), 'medium') : withRocket(crewedBase(), 'sls2');
  if (type === 'crewed') s = withCrew(s, {});
  s = withFlight(s, type === 'robotic' ? 0.15 : 0.05);
  s = withComms(s, 'ka', 'dsn34');
  return withSite(s, 'tranquility');
}

/* ---------- helpers ---------- */
function run(state, phase, opts) { return SIM.simulate(state, phase, Object.assign({ seed: SEED }, opts)); }
/** Try candidate states until one gives the wanted outcome. Returns { state, seed, result } or null. */
function find(phase, outcome, candidates, seeds) {
  for (const c of candidates) for (const seed of (seeds || [SEED])) {
    const r = SIM.simulate(c.state, phase, { seed });
    if (r.ready && r.outcome === outcome) return { label: c.label, seed, state: c.state, result: r };
  }
  return null;
}
const entry = (hit) => hit ? { label: hit.label, seed: hit.seed, state: hit.state, result: hit.result } : null;
function write(name, obj) {
  fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(obj, null, 1) + '\n');
  console.log('wrote fixtures/' + name + '.json');
}
/** Rocket picker rows: what the rocket cards and tubes show. */
function rocketRows(state) {
  const base = clone(state); base.rocket = null;
  const r = M.evaluate(withRocket(base, D.ROCKETS[state.missionType][0].id));
  return D.ROCKETS[state.missionType].map(k => {
    const x = M.evaluate(withRocket(base, k.id));
    return { id: k.id, title: k.title, capacity: k.capacity, cost: k.cost, launchMass: x.tli, fits: x.fitsRocket,
      fillFraction: x.tli / k.capacity, totalCost: x.totalCost, overBudget: x.overBudget };
  }).map(row => Object.assign(row, { _hudTli: r.tli }));
}
const cleanRows = (rows) => rows.map(({ _hudTli, ...rest }) => rest);
const issues = (s, n) => M.validatePhase(s, n);

/* ---------- build ---------- */
const TYPES = ['robotic', 'crewed'];

for (const type of TYPES) {
  const base = type === 'robotic' ? roboticBase() : crewedBase();
  const F = full(type);
  const rocketId = type === 'robotic' ? 'medium' : 'sls2';
  const MG = type === 'robotic' ? 0.15 : 0.05;
  
  // ---- Phase 0
  {
    const s = { ...clone(M.newState()), difficulty: 'cadet', question: 'made', measure: 'chem', missionType: type };
    write(`f0.${type}`, {
      screen: 'f0', title: 'Mission goal', missionType: type,
      note: 'Choices write state.question, state.measure, state.missionType. Lists come from SS_DATA.QUESTIONS, MEASURES, MISSION_TYPES.',
      state: s,
      engine: { validate: issues(s, 0), unlockedInstruments: M.unlockedInstruments(s), requiredInstruments: M.requiredInstruments(s), density: M.moonDensityMath() },
      sim: { success: run(s, 0) },
    });
  }

  // ---- Phase 1A (assembly)
  {
    const s = clone(base);
    const subs = D.SUBSYSTEMS.map(sub => ({ id: sub.id, title: sub.title, multi: !!sub.multi, options: M.optionsFor(sub.id, type).map(o => ({ id: o.id, title: o.title, blurb: o.blurb, src: o.src })) }));
    const previews = {};
    for (const sub of D.SUBSYSTEMS) previews[sub.id] = M.optionsFor(sub.id, type).map(o => {
      const p = M.previewWith(s, sub.id, o.id);
      return { id: o.id, launchMass: p.tli, hardware: p.dry, cost: p.cost, powerNeed: p.powerNeed, powerGen: p.powerGen };
    });
    write(`f1a.${type}`, {
      screen: 'f1a', title: 'Assembly building', missionType: type,
      note: 'Choices write state.design[subsystemId] (single) or state.design.science (array). No rocket yet, so fitsRocket is null.',
      state: s,
      engine: { subsystems: subs, previewIfPicked: previews, evaluate: M.evaluate(s), rocketMath: M.rocketMath(s), validate: issues(s, 1), missing: M.missingSubsystems(s), descopeByMass: M.descopeSuggestions(s, 'mass') },
      sim: {},
    });
  }

  // ---- Phase 1B (rocket pick). The same sim also drives the launch screen (3B).
  {
    const s = withRocket(base, rocketId);
    const tooHeavy = withRocket(base, type === 'robotic' ? 'small' : 'sls1');
    const heavyRobotic = type === 'robotic' ? Object.assign(withRocket(base, 'small'), { design: Object.assign(clone(base.design), { science: ['spectrometer', 'camera', 'neutron', 'sampler'] }) }) : null;
    const failState = heavyRobotic || (() => { const t = withCrew(withRocket(base, 'sls2'), { size: 4, days: 30, reserve: 0.2, recycler: false, suit: 'heavy' }); t.design.structure = 'aluminum'; t.design.shield = 'solid'; t.design.power = 'fuelCells'; t.design.science = ['spectrometer', 'camera', 'neutron', 'sampler']; return t; })();
    const sim = { success: entry({ label: rocketId, seed: SEED, state: s, result: run(s, 1) }) };
    const fail = find(1, 'fail', [{ label: 'rocket too small', state: failState }, { label: 'small rocket', state: tooHeavy }]);
    sim.fail = entry(fail);
    sim.partial = null;
    write(`f1b.${type}`, {
      screen: 'f1b', title: 'Launch pad: pick your rocket', missionType: type,
      note: 'Choice writes state.rocket. rockets[] drives the three cards and fuel tubes. The sim here is the launch run, also used by screen 3B.',
      state: s,
      engine: { evaluate: M.evaluate(s), rockets: cleanRows(rocketRows(base)), validate: issues(s, 1) },
      sim,
    });
  }

  // ---- Phase 2 (crewed: crew screen. robotic: skipped screen, sim returns a trivial success)
  {
    const s = type === 'crewed' ? withCrew(withRocket(base, 'sls2'), {}) : withRocket(base, rocketId);
    const sim = { success: entry({ label: 'default plan', state: s, seed: SEED, result: run(s, 2) }) };
    let engine = { evaluate: M.evaluate(s), validate: issues(s, 2) };
    let note = 'Robotic missions skip this screen. Show the success run or go straight to 3A.';
    if (type === 'crewed') {
      const dry = withCrew(withRocket(base, 'sls2'), { days: M.minDays(), reserve: 0 });
      const shortWater = find(2, 'fail', [
        { label: 'no reserve, no recycler, 8 days', state: withCrew(withRocket(base, 'sls2'), { days: 8, reserve: 0, recycler: false }) },
        { label: 'minimum days, no reserve', state: dry },
      ], [1, 2, 3, 4, 5, 6, 7, 8]);
      sim.fail = entry(shortWater);
      sim.partial = null;
      engine = { evaluate: M.evaluate(s), life: M.lifeSupport(s), lifeMath: M.lifeMath(s), validate: issues(s, 2), minDays: M.minDays(),
        choices: { crewSize: [D.LIFE.crewMin, D.LIFE.crewMax], days: [1, D.LIFE.daysMax], reserve: D.LIFE.reserveOptions, suits: D.LIFE.suits, recycler: D.LIFE.recycler } };
      note = 'Writes state.crew = { size, days, reserve, suit, recycler }. Defaults from M.defaultCrew().';
    }
    write(`f2.${type}`, { screen: 'f2', title: 'Crew and life support', missionType: type, note, state: s, engine, sim });
  }

  // ---- Phase 3A (flight plan)
  {
    const s = withFlight(withRocket(type === 'crewed' ? withCrew(base, {}) : base, rocketId), MG);
    const margins = D.FLIGHT.marginOptions.map(m => {
      const t = withFlight(s, m), e = M.evaluate(t), v = M.validatePhase(t, 3);
      return { margin: m, dvPlanned: e.dvPlanned, launchMass: e.tli, fits: e.fitsRocket, totalCost: e.totalCost, go: v.ok, issues: v.issues.map(i => i.code) };
    });
    const low = withFlight(s, 0.0);
    const sim = { success: entry({ label: `margin ${MG * 100}%`, state: s, seed: SEED, result: run(s, 3) }) };
    const fail = find(3, 'fail', [
      { label: 'margin 0%', state: withFlight(s, 0) },
      { label: 'margin 0%, flight director', state: Object.assign(withFlight(s, 0), { difficulty: 'director' }) },
      { label: 'margin 5%', state: withFlight(s, 0.05) },
    ], [1, 2, 3, 4, 5, 6, 7, 8]);
    sim.fail = entry(fail);
    sim.partial = null;
    write(`f3a.${type}`, {
      screen: 'f3a', title: 'Flight plan', missionType: type,
      note: 'Choice writes state.flight.margin (one of FLIGHT.marginOptions). Sim path x,y move the ship dot on the Earth to Moon diagram.',
      state: s,
      engine: { flightPlan: M.flightPlan(s), rocketMath: M.rocketMath(s), evaluate: M.evaluate(s), marginTable: margins, minMargin: M.minMargin(s), validate: issues(s, 3) },
      sim,
    });
  }

  // ---- Phase 4 (comms), chosen before launch
  {
    const s = withComms(withFlight(withRocket(type === 'crewed' ? withCrew(base, {}) : base, rocketId), MG), 'ka', 'dsn34');
    const table = [];
    for (const l of D.COMMS.links) for (const d of D.COMMS.dishes) {
      const t = withComms(s, l.id, d.id), p = M.commsPlan(t), e = M.evaluate(t);
      table.push({ link: l.id, dish: d.id, rateMbps: p.rateMbps, contactHours: p.contactHours, gbPerDay: p.gbPerDay, needGbPerDay: p.needGbPerDay, bottleneck: p.bottleneck,
        addedPower: l[type].power, addedMass: l[type].mass, addedCost: l[type].cost + d.cost[type], launchMass: e.tli, powerNeed: e.powerNeed, totalCost: e.totalCost });
    }
    const sims = { success: null, partial: null, fail: null };
    const all = [];
    for (const l of D.COMMS.links) for (const d of D.COMMS.dishes) all.push({ label: `${l.id} + ${d.id}`, state: withComms(s, l.id, d.id) });
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    sims.success = entry(find(4, 'success', all, seeds));
    sims.partial = entry(find(4, 'partial', all, seeds));
    sims.fail = entry(find(4, 'fail', all, seeds));
    write(`f4.${type}`, {
      screen: 'f4', title: 'Communications', missionType: type,
      note: 'Writes state.comms = { link, dish }. Both are required. linkUp and station in sim frames light the beam and the globe dots.',
      state: s,
      engine: { commsPlan: M.commsPlan(s), commsMath: M.commsMath(s), linkDishTable: table, stations: [{ name: 'Goldstone', lon: -116.9 }, { name: 'Madrid', lon: -4.25 }, { name: 'Canberra', lon: 148.98 }], validate: issues(s, 4) },
      sim: sims,
    });
  }

  // ---- 3B Launch (summary and the phase 1 run)
  {
    const s = clone(F);
    write(`f3b.${type}`, {
      screen: 'f3b', title: 'Launch pad: mission summary', missionType: type,
      note: 'Needs phases 0 to 4 GO. Launch animation is simulate(state, 1). Rows come from launchReadiness().phases.',
      state: s,
      engine: { launchReadiness: M.launchReadiness(s), launchRows: (({ go, rows }) => ({ go, rows }))(M.launchRows(s)), hud: M.hud(s), evaluate: M.evaluate(s) },
      sim: { success: entry({ label: 'all GO', state: s, seed: SEED, result: run(s, 1) }) },
    });
  }

  // ---- 5A site pick
  {
    const s = clone(F); s.site = null; s.landing = null;
    write(`f5a.${type}`, {
      screen: 'f5a', title: 'Landing site', missionType: type,
      note: 'Choice writes state.site (tranquility, descartes, southPole). One siteReport per site fills the cards.',
      state: s,
      engine: { evaluate: M.evaluate(s), hud: M.hud(s), dvRemainingAfterLoi: M.dvRemaining(s, ['loi']), sites: D.SITES.map(x => ({ id: x.id, report: M.siteReport(s, x.id), validateIfPicked: issues(withSite(s, x.id), 5) })) },
      sim: {},
    });
  }

  // ---- 5B descent
  {
    const s = clone(F);
    const cands = [];
    for (const site of ['tranquility', 'descartes', 'southPole']) for (const m of (type === 'robotic' ? [0.15, 0.1, 0.05, 0] : [0.05, 0])) for (const diff of ['cadet', 'engineer', 'director']) {
      const t = withSite(withFlight(clone(F), m), site); t.difficulty = diff; cands.push({ label: `${site}, margin ${m * 100}%, ${diff}`, state: t });
    }
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const sims = { success: entry(find(5, 'success', cands, seeds)), partial: entry(find(5, 'partial', cands, seeds)), fail: entry(find(5, 'fail', cands, seeds)) };
    // interactive detour, only when the sim supports it
    try {
      const r = SIM.simulate(s, 5, { seed: SEED, interactive: true });
      if (r && r.outcome === 'pending') {
        sims.interactivePending = { label: 'interactive: first call', seed: SEED, state: s, result: r };
        sims.interactiveDetour = { label: "resume with choice 'detour'", seed: SEED, state: s, result: SIM.simulate(s, 5, { seed: SEED, choice: 'detour' }) };
        sims.interactiveAbort = { label: "resume with choice 'abort'", seed: SEED, state: s, result: SIM.simulate(s, 5, { seed: SEED, choice: 'abort' }) };
      }
    } catch (e) { /* interactive mode not available yet */ }
    const landing = M.landingSim(s, SEED);
    write(`f5b.${type}`, {
      screen: 'f5b', title: 'Powered descent', missionType: type,
      note: 'Writes state.landing = { seed, outcome } after the run. alt, x, throttle in frames move the lander and flame.',
      state: s,
      engine: { siteReport: M.siteReport(s), landingSim: landing, landingMath: M.landingMath(s, landing), hoverAvailable: M.hoverAvailable(s), descentDv: D.DV.descent.value, gravity: D.MOON.gravity, validate: issues(s, 5) },
      sim: sims,
    });
  }
}
