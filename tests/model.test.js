'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const M = require(path.join(__dirname, '..', 'js', 'model.js'));
const D = require(path.join(__dirname, '..', 'js', 'data.js'));

/* ---------------- builders ---------------- */
const clone = (x) => JSON.parse(JSON.stringify(x));
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} expected ${b} ± ${tol}, got ${a}`);

function robotOneWay(over = {}) {
  const s = M.newState();
  Object.assign(s, { question: 'made', measure: 'chem', missionType: 'robotic', rocket: 'medium' });
  s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'solarBig', science: ['spectrometer'] };
  s.comms = { link: 'sband', dish: 'dsn34' };
  return Object.assign(s, over);
}
function robotSample(over = {}) {
  const s = robotOneWay({ question: 'age', measure: 'sample', rocket: 'medium' });
  s.design.science = ['sampler'];
  return Object.assign(s, over);
}
function crewed(over = {}) {
  const s = M.newState();
  Object.assign(s, { question: 'made', measure: 'chem', missionType: 'crewed', rocket: 'sls2' });
  s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'crewSolar', science: ['spectrometer'] };
  return Object.assign(s, over);
}
function crewedFull(over = {}) {
  const s = crewed({ crew: { size: 2, days: 10, reserve: 0.2, suit: 'lunar', recycler: false }, flight: { margin: 0.05 }, comms: { link: 'sband', dish: 'dsn34' } });
  return Object.assign(s, over);
}
const designs = () => ({
  'robotic one-way': robotOneWay(),
  'robotic sample return': robotSample(),
  'crewed (no crew plan)': crewed(),
  'crewed with crew + margin': crewedFull({ flight: { margin: 0.1 } }),
});
function allNumbers(o, out = []) {
  if (typeof o === 'number') out.push(o);
  else if (o && typeof o === 'object') Object.values(o).forEach(v => allNumbers(v, out));
  return out;
}

/* ================= 1. Physics invariants ================= */
test('physics invariants', async (t) => {
  for (const [name, s] of Object.entries(designs())) {
    await t.test(name, () => {
      const r = M.evaluate(s), rm = M.rocketMath(s);
      close(rm.burns[0].mStart, r.tli, 0.01, 'first burn mStart == tli');
      for (const b of rm.burns) {
        const dvCheck = M.ve * Math.log(b.mStart / (b.mFinal + b.tanks));
        close(dvCheck, b.dv, 1e-6, `burn ${b.name}`);
        const planned = b.dv; // already margin-scaled
        assert.ok(planned > 0);
      }
      assert.ok(r.tli > r.dry && r.dry > 0);
      assert.ok(r.propellant > 0);
      for (const n of allNumbers(r)) assert.ok(Number.isFinite(n), 'finite number');
      for (const n of allNumbers(rm)) assert.ok(Number.isFinite(n), 'finite rocketMath number');
    });
  }
  await t.test('burn dv equals DV table x (1+margin)', () => {
    const s = crewedFull({ flight: { margin: 0.15 } });
    const keys = ['loi', 'descent', 'ascent', 'tei'];
    M.rocketMath(s).burns.forEach((b, i) => close(b.dv, D.DV[keys[i]].value * 1.15, 1e-9));
  });
  await t.test('evaluate returns null with no mission type', () => {
    assert.equal(M.evaluate(M.newState()), null);
    assert.equal(M.rocketMath(M.newState()), null);
  });
  await t.test('fuelPerKg is Infinity for impossible stage', () => {
    assert.equal(M.fuelPerKg(1e6), Infinity);
  });
  await t.test('fuelFactor(0) == 1', () => close(M.fuelFactor(0), 1, 1e-12));
});

/* ================= 2. Monotonicity ================= */
test('monotonicity', async (t) => {
  await t.test('adding an instrument never lowers tli', () => {
    for (const make of [robotOneWay, robotSample, crewed, crewedFull]) {
      const s = make();
      const base = M.evaluate(s).tli;
      for (const id of ['camera', 'spectrometer', 'neutron', 'sampler']) {
        if (s.design.science.includes(id)) continue;
        const n = clone(s); n.design.science.push(id);
        assert.ok(M.evaluate(n).tli >= base, `${make.name} + ${id}`);
      }
    }
  });
  await t.test('heavier option never lowers tli (same-slot, higher mass)', () => {
    // pick heavier options by comparing evaluate().dry then asserting tli follows
    for (const make of [robotOneWay, crewed]) {
      const s = make();
      for (const sub of D.SUBSYSTEMS.filter(x => !x.multi)) {
        const opts = M.optionsFor(sub.id, s.missionType).map(o => {
          const n = clone(s); n.design[sub.id] = o.id; const r = M.evaluate(n); return { id: o.id, dry: r.dry, tli: r.tli };
        }).sort((a, b) => a.dry - b.dry);
        for (let i = 1; i < opts.length; i++) assert.ok(opts[i].tli >= opts[i - 1].tli, `${make.name} ${sub.id}`);
      }
    }
  });
  await t.test('bigger margin raises tli', () => {
    for (const make of [robotOneWay, robotSample, crewedFull]) {
      let prev = -1;
      for (const m of D.FLIGHT.marginOptions) {
        const s = make(); s.flight = { margin: m };
        const tli = M.evaluate(s).tli; assert.ok(tli > prev); prev = tli;
      }
    }
  });
  await t.test('more crew raises tli', () => {
    let prev = -1;
    for (let size = 1; size <= 4; size++) {
      const s = crewedFull(); s.crew.size = size; const tli = M.evaluate(s).tli;
      assert.ok(tli > prev, 'size ' + size); prev = tli;
    }
  });
  await t.test('more days raises tli', () => {
    let prev = -1;
    for (const days of [6, 8, 12, 20, 30]) {
      const s = crewedFull(); s.crew.days = days; const tli = M.evaluate(s).tli;
      assert.ok(tli > prev, 'days ' + days); prev = tli;
    }
  });
  await t.test('fuelFactor increases with dv', () => {
    let prev = 0;
    for (let dv = 0; dv <= 3000; dv += 250) { const f = M.fuelFactor(dv); assert.ok(f >= prev); prev = f; }
  });
  await t.test('margin 0 factors match module F table', () => {
    const f = M.factorsFor({ flight: { margin: 0 } });
    for (const k of Object.keys(f)) close(f[k], M.F[k], 1e-12);
  });
});

/* ================= 3. Real-math helpers ================= */
test('real-math helpers', async (t) => {
  await t.test('moon density ~3344', () => close(M.moonDensityMath().result, 3344, 1));
  await t.test('moon gravity ~1.62', () => close(M.moonGravityMath().result, 1.62, 0.01));
  await t.test('batteryMath(100)', () => {
    close(M.batteryMath(100).result, 50 * 100 / 150, 1e-9);
    close(M.batteryMass(100), 50 * 100 / 150, 1e-9);
  });
  await t.test('every math object has steps with eq and num', () => {
    for (const m of [M.moonDensityMath(), M.moonGravityMath(), M.batteryMath(8), M.lifeMath(crewedFull()), ...[1, 2, 3].map(() => null).slice(0, 0)]) {
      assert.ok(m.title && m.steps.length);
      m.steps.forEach(st => assert.ok(st.eq && st.num && !/NaN|Infinity|undefined/.test(st.num)));
    }
  });
  await t.test('sci formatting', () => {
    assert.equal(M.sci(7.346e22), '7.346×10²²');
    assert.equal(M.sci(6.674e-11), '6.674×10⁻¹¹');
    assert.equal(M.sci(1), '1.000×10⁰');
  });
  await t.test('powerMass for robotic rps', () => {
    close(M.powerMass({ arrayMass: 50, batteryHours: 8, rpsMass: 45 }), 50 + 8 * 50 / 150 + 45, 1e-9);
  });
});

/* ================= 4. Life support ================= */
test('life support', async (t) => {
  const pd = D.LIFE.perCrewDay;
  await t.test('O2/food/water = crew-days x BVAD x (1+reserve)', () => {
    for (const reserve of [0, 0.2]) for (const size of [1, 2, 3, 4]) for (const days of [6, 10, 25]) {
      const s = crewedFull(); s.crew = { size, days, reserve, suit: 'lunar', recycler: false };
      const l = M.lifeSupport(s), cd = size * days, k = 1 + reserve;
      assert.equal(l.crewDays, cd);
      close(l.o2, cd * pd.o2 * k, 1e-9); close(l.food, cd * pd.food * k, 1e-9); close(l.water, cd * pd.water * k, 1e-9);
      close(l.suppliesTotal, l.o2 + l.food + l.water, 1e-9);
      close(l.surfaceSupplies + l.orbiterSupplies, l.suppliesTotal, 1e-9);
    }
  });
  await t.test('recycler only reduces orbiter water, by recovery', () => {
    const base = crewedFull(); base.crew = { size: 4, days: 10, reserve: 0.2, suit: 'lunar', recycler: false };
    const rec = clone(base); rec.crew.recycler = true;
    const a = M.lifeSupport(base), b = M.lifeSupport(rec);
    close(b.o2, a.o2, 1e-9); close(b.food, a.food, 1e-9);
    close(b.surfaceSupplies, a.surfaceSupplies, 1e-9);
    const orbitCrewDays = a.crewDays - a.landingCrew * D.LIFE.surfaceDays;
    const orbitWater = orbitCrewDays * pd.water * 1.2;
    close(a.water - b.water, orbitWater * D.LIFE.recycler.recovery, 1e-9);
    close(b.waterSaved, a.water - b.water, 1e-9);
    close(a.orbiterSupplies - b.orbiterSupplies, orbitWater * D.LIFE.recycler.recovery, 1e-9);
    // recycler hardware appears in evaluate lines
    assert.ok(M.evaluate(rec).lines.some(l => l.label === D.LIFE.recycler.title));
    assert.ok(!M.evaluate(base).lines.some(l => l.label === D.LIFE.recycler.title));
  });
  await t.test('landingCrew <= 2 and split sums to size', () => {
    for (let size = 1; size <= 4; size++) {
      const s = crewedFull(); s.crew.size = size; const l = M.lifeSupport(s);
      assert.ok(l.landingCrew <= 2); assert.equal(l.landingCrew + l.orbitCrew, size);
    }
  });
  await t.test('size/days are clamped', () => {
    const s = crewedFull(); s.crew.size = 99; s.crew.days = 999;
    const l = M.lifeSupport(s); assert.equal(l.size, D.LIFE.crewMax); assert.equal(l.days, D.LIFE.daysMax);
  });
  await t.test('robotic / no crew -> null', () => {
    assert.equal(M.lifeSupport(robotOneWay()), null);
    assert.equal(M.lifeSupport(robotSample({ crew: { size: 2, days: 8 } })), null);
    assert.equal(M.lifeSupport(crewed()), null);
    assert.equal(M.lifeMath(robotOneWay()), null);
  });
  await t.test('daysOk false below minDays()', () => {
    assert.equal(M.minDays(), 2 * D.LIFE.transitDays + D.LIFE.surfaceDays);
    const s = crewedFull();
    s.crew.days = M.minDays() - 1; assert.equal(M.lifeSupport(s).daysOk, false);
    s.crew.days = M.minDays(); assert.equal(M.lifeSupport(s).daysOk, true);
  });
  await t.test('break-even logic is sensible', () => {
    const mk = (size, reserve) => { const s = crewedFull(); s.crew = { size, days: 10, reserve, suit: 'lunar', recycler: true }; return M.lifeSupport(s).recyclerBreakEvenDays; };
    for (const v of [mk(1, 0), mk(4, 0.2)]) assert.ok(Number.isFinite(v) && v > 0);
    assert.ok(mk(4, 0) < mk(2, 0), 'bigger crew breaks even sooner');
    assert.ok(mk(2, 0.2) < mk(2, 0), 'bigger reserve breaks even sooner');
  });
  await t.test('break-even days really recover the recycler mass', () => {
    const s = crewedFull(); s.crew = { size: 4, days: 10, reserve: 0.2, suit: 'lunar', recycler: true };
    const be = M.lifeSupport(s).recyclerBreakEvenDays;
    s.crew.days = Math.ceil(be);
    assert.ok(M.lifeSupport(s).waterSaved >= D.LIFE.recycler.mass, `saved ${M.lifeSupport(s).waterSaved} kg vs ${D.LIFE.recycler.mass} kg`);
  });
  await t.test('suits mass uses landing crew', () => {
    const s = crewedFull(); s.crew.size = 4; s.crew.suit = 'heavy';
    close(M.lifeSupport(s).suitsMass, 2 * D.LIFE.suits.find(x => x.id === 'heavy').mass, 1e-9);
  });
});

/* ================= 5. Flight plan ================= */
test('flight plan', async (t) => {
  await t.test('burn keys per mission type', () => {
    const keys = (s) => M.flightPlan(s).burns.map(b => b.key);
    assert.deepEqual(keys(robotOneWay()), ['loi', 'descent']);
    assert.deepEqual(keys(robotSample()), ['loi', 'descent', 'direct']);
    assert.deepEqual(keys(crewed()), ['loi', 'descent', 'ascent', 'tei']);
  });
  await t.test('dvPlanned = dvRequired x (1+margin)', () => {
    for (const m of D.FLIGHT.marginOptions) for (const s of [robotOneWay(), robotSample(), crewedFull()]) {
      s.flight = { margin: m };
      const p = M.flightPlan(s);
      close(p.dvPlanned, p.dvRequired * (1 + m), 1e-9);
      close(p.dvRequired, p.burns.reduce((a, b) => a + D.DV[b.key].value, 0), 1e-9);
      p.burns.forEach(b => close(b.dvPlanned, b.dv * (1 + m), 1e-9));
      const r = M.evaluate(s); close(r.dvPlanned, p.dvPlanned, 1e-9); close(r.dvRequired, p.dvRequired, 1e-9);
    }
  });
  await t.test('minMargin per difficulty', () => {
    assert.equal(M.minMargin({ difficulty: 'cadet' }), 0);
    assert.equal(M.minMargin({ difficulty: 'engineer' }), 0.05);
    assert.equal(M.minMargin({ difficulty: 'director' }), 0.10);
    assert.equal(M.minMargin({}), 0.05);
  });
  await t.test('marginOf default', () => {
    assert.equal(M.marginOf({}), D.FLIGHT.defaultMargin);
    assert.equal(M.marginOf({ flight: { margin: 0.1 } }), 0.1);
  });
});

/* ================= 6. Validation ================= */
test('validation', async (t) => {
  const codes = (s, n) => M.validatePhase(s, n).issues.map(i => i.code);
  const sev = (s, n, c) => (M.validatePhase(s, n).issues.find(i => i.code === c) || {}).severity;

  await t.test('phase 0', () => {
    assert.deepEqual(codes(M.newState(), 0), ['noQuestion', 'noMeasure', 'noMissionType']);
    assert.equal(sev(M.newState(), 0, 'noQuestion'), 'block');
    assert.equal(M.validatePhase(robotOneWay(), 0).ok, true);
  });
  await t.test('phase 1 before phase 0 -> noMission', () => {
    assert.ok(codes(M.newState(), 1).includes('noMission'));
  });
  await t.test('phase 1 blocking codes', () => {
    const empty = robotOneWay(); empty.design = { science: [] }; empty.rocket = null;
    const c = codes(empty, 1);
    for (const code of ['missingSubsystems', 'payloadMismatch', 'noRocket']) assert.ok(c.includes(code), code);
    // payload mismatch only
    const pm = robotOneWay(); pm.design.science = ['camera']; assert.ok(codes(pm, 1).includes('payloadMismatch'));
    // tooHeavy
    const th = robotOneWay({ rocket: 'small' }); th.design.science = ['spectrometer', 'neutron', 'camera']; th.design.structure = 'aluminum'; th.design.shield = 'solid'; th.design.power = 'rps';
    assert.ok(codes(th, 1).includes('tooHeavy'), JSON.stringify(codes(th, 1)));
    // overBudget
    const ob = crewed({ difficulty: 'director' }); ob.design.structure = 'composite'; ob.design.shield = 'stuffed'; ob.design.power = 'fuelCells'; ob.design.thermal = 'active'; ob.design.science = ['spectrometer', 'neutron', 'camera', 'sampler']; ob.rocket = 'sls2';
    assert.ok(codes(ob, 1).includes('overBudget'), JSON.stringify(codes(ob, 1)));
    ['missingSubsystems', 'payloadMismatch', 'noRocket', 'tooHeavy', 'overBudget'].forEach(code => assert.ok(!code || true));
  });
  await t.test('phase 1 power shortfall', () => {
    const s = robotOneWay(); s.design.power = 'solarSmall';
    s.design.science = ['spectrometer'];
    const r = M.evaluate(s);
    assert.equal(codes(s, 1).includes('noPower'), r.powerGen < r.powerNeed);
  });
  await t.test('valid robotic one-way and sample return pass phase 1', () => {
    for (const s of [robotOneWay(), robotSample()]) {
      const v = M.validatePhase(s, 1); assert.equal(v.ok, true, JSON.stringify(v.issues));
    }
  });
  await t.test('robotic phase 2 ok without crew', () => {
    assert.deepEqual(M.validatePhase(robotOneWay(), 2), { ok: true, issues: [] });
  });
  await t.test('phase 2 crewed codes', () => {
    assert.ok(codes(crewed(), 2).includes('noCrew'));
    const ns = crewedFull(); ns.crew.suit = null; assert.ok(codes(ns, 2).includes('noSuit'));
    const ts = crewedFull(); ts.crew.days = M.minDays() - 1; assert.ok(codes(ts, 2).includes('tooShort'));
    assert.equal(sev(ts, 2, 'tooShort'), 'block');
    const nr = crewedFull(); nr.crew.reserve = 0; assert.equal(sev(nr, 2, 'noReserve'), 'warn');
    assert.equal(M.validatePhase(nr, 2).ok, true);
    const sc = crewedFull({ question: 'water' }); sc.crew.suit = 'light'; assert.equal(sev(sc, 2, 'suitCold'), 'warn');
    const sc2 = crewedFull({ question: 'water' }); sc2.crew.suit = 'lunar'; assert.ok(!codes(sc2, 2).includes('suitCold'));
    const th = crewedFull({ rocket: 'sls1' }); th.crew = { size: 4, days: 30, reserve: 0.2, suit: 'heavy', recycler: false };
    th.design.power = 'fuelCells'; th.design.structure = 'aluminum'; th.design.shield = 'solid';
    const r = M.evaluate(th); assert.equal(codes(th, 2).includes('tooHeavy'), !r.fitsRocket);
    assert.ok(!r.fitsRocket, 'scenario should be too heavy for SLS Block 1');
  });
  await t.test('recyclerHeavy warning when days < break-even', () => {
    const s = crewedFull(); s.crew = { size: 4, days: 8, reserve: 0.2, suit: 'lunar', recycler: true };
    assert.equal(sev(s, 2, 'recyclerHeavy'), 'warn');
  });
  await t.test('phase 2 overBudget', () => {
    const s = crewedFull({ difficulty: 'director' }); s.rocket = 'sls2'; s.design.structure = 'composite'; s.design.shield = 'stuffed'; s.design.power = 'fuelCells';
    assert.equal(M.evaluate(s).overBudget, true);
    assert.ok(codes(s, 2).includes('overBudget'));
  });
  await t.test('phase 3 codes', () => {
    const low = crewedFull({ flight: { margin: 0 } });
    assert.ok(codes(low, 3).includes('lowDvMargin'));
    const cadet = crewedFull({ difficulty: 'cadet', flight: { margin: 0 } });
    assert.ok(!codes(cadet, 3).includes('lowDvMargin')); assert.equal(sev(cadet, 3, 'zeroDvMargin'), 'warn');
    assert.ok(!codes(crewedFull(), 3).includes('zeroDvMargin'));
    const nr = crewedFull({ rocket: null }); assert.ok(codes(nr, 3).includes('noRocket'));
    const risky = crewedFull(); risky.events.risk = 2; assert.equal(sev(risky, 3, 'highRisk'), 'warn');
    const th = crewedFull(); th.rocket = 'sls1'; th.flight.margin = 0.2; th.crew = { size: 4, days: 30, reserve: 0.2, suit: 'heavy', recycler: true };
    assert.equal(codes(th, 3).includes('tooHeavy'), !M.evaluate(th).fitsRocket);
  });
  await t.test('GO: fully valid robotic and crewed missions', () => {
    for (const s of [robotOneWay({ flight: { margin: 0.05 } }), robotSample({ flight: { margin: 0.05 } }), crewedFull()]) {
      const g = M.launchReadiness(s);
      assert.equal(g.go, true, JSON.stringify(g.issues.filter(i => i.severity === 'block')));
      assert.equal(g.phases.length, 5);
    }
  });
  await t.test('NO GO when any phase blocks', () => {
    assert.equal(M.launchReadiness(crewedFull({ flight: { margin: 0 } })).go, false);
    assert.equal(M.launchReadiness(crewed({ flight: { margin: 0.05 } })).go, false);
    assert.equal(M.launchReadiness(M.newState()).go, false);
  });
  await t.test('launchReadiness issues carry phase', () => {
    M.launchReadiness(crewedFull({ flight: { margin: 0 } })).issues.forEach(i => assert.ok([0, 1, 2, 3, 4].includes(i.phase)));
  });
  await t.test('launchReadiness blocks without comms (phase 4)', () => {
    const g = M.launchReadiness(robotOneWay({ flight: { margin: 0.05 }, comms: null }));
    assert.equal(g.go, false);
    assert.ok(g.issues.some(i => i.code === 'noLink' && i.phase === 4));
  });
});

/* ================= 7. Events ================= */
test('events', async (t) => {
  const findSeed = (s, phase, pred = () => true) => { for (let seed = 0; seed < 500; seed++) { const e = M.rollEvent(s, phase, seed); if (e && pred(e)) return seed; } return -1; };

  await t.test('deterministic for same seed and phase', () => {
    const s = robotOneWay({ difficulty: 'director' });
    for (let seed = 0; seed < 50; seed++) for (const ph of [1, 2, 3]) {
      assert.deepEqual(M.rollEvent(s, ph, seed), M.rollEvent(clone(s), ph, seed));
    }
  });
  await t.test('events are valid for their phase', () => {
    const s = crewedFull({ difficulty: 'director' });
    for (let seed = 0; seed < 200; seed++) for (const ph of [0, 1, 2, 3]) {
      const e = M.rollEvent(s, ph, seed); if (e) assert.ok(e.phases.includes(ph));
    }
  });
  await t.test('respects crewedOnly', () => {
    const r = robotOneWay({ difficulty: 'director' });
    for (let seed = 0; seed < 300; seed++) { const e = M.rollEvent(r, 3, seed); if (e) assert.notEqual(e.id, 'solarStorm'); }
    const c = crewedFull({ difficulty: 'director' });
    const ids = new Set(); for (let seed = 0; seed < 300; seed++) { const e = M.rollEvent(c, 3, seed); if (e) ids.add(e.id); }
    assert.ok(ids.has('solarStorm'), 'crewed can roll solarStorm');
  });
  await t.test('never repeats an event already in the log', () => {
    const s = crewedFull({ difficulty: 'director' });
    s.events.log = [{ id: 'massGrowth', choice: 'absorb' }, { id: 'launchSlip', choice: 'go' }];
    for (let seed = 0; seed < 300; seed++) {
      const e = M.rollEvent(s, 3, seed); if (e) assert.equal(e.id, 'solarStorm');
    }
    s.events.log.push({ id: 'solarStorm', choice: 'shelter' });
    for (let seed = 0; seed < 100; seed++) assert.equal(M.rollEvent(s, 3, seed), null);
  });
  await t.test('different seeds can differ; chance respects difficulty', () => {
    const rate = (d) => { let n = 0; const s = robotOneWay({ difficulty: d }); for (let seed = 0; seed < 1000; seed++) if (M.rollEvent(s, 1, seed)) n++; return n / 1000; };
    assert.ok(rate('cadet') < rate('director'));
  });
  await t.test('applyEventChoice is pure and logs', () => {
    const s = crewedFull(); const frozen = JSON.stringify(s);
    const n = M.applyEventChoice(s, 'massGrowth', 'absorb');
    assert.equal(JSON.stringify(s), frozen, 'input not mutated');
    assert.notEqual(n, s);
    assert.deepEqual(n.events.log.at(-1), { id: 'massGrowth', choice: 'absorb' });
    assert.equal(s.events.log.length, 0);
  });
  await t.test('unknown event/choice returns same state', () => {
    const s = crewedFull();
    assert.equal(M.applyEventChoice(s, 'nope', 'x'), s);
    assert.equal(M.applyEventChoice(s, 'massGrowth', 'nope'), s);
  });
  await t.test('massGrowth raises tli, hardware only', () => {
    for (const s of [robotOneWay(), crewedFull()]) {
      const n = M.applyEventChoice(s, 'massGrowth', 'absorb');
      assert.ok(M.evaluate(n).tli > M.evaluate(s).tli);
      close(n.events.massGrowth, 0.05, 1e-12);
      // crew/supplies/samples lines unchanged
      const a = M.evaluate(s).lines, b = M.evaluate(n).lines;
      a.forEach((l, i) => { if (l.kind !== 'hw') close(b[i].mass, l.mass, 1e-9, l.label); else close(b[i].mass, l.mass * 1.05, 1e-9, l.label); });
    }
  });
  await t.test('massGrowth compounds', () => {
    const s = M.applyEventChoice(M.applyEventChoice(crewedFull(), 'massGrowth', 'absorb'), 'massGrowth', 'absorb');
    close(s.events.massGrowth, 1.05 * 1.05 - 1, 1e-12);
  });
  await t.test('extraCost raises cost by type-specific amount', () => {
    const r = robotOneWay(), c = crewedFull();
    close(M.evaluate(M.applyEventChoice(r, 'massGrowth', 'redesign')).totalCost - M.evaluate(r).totalCost, 25, 1e-9);
    close(M.evaluate(M.applyEventChoice(c, 'massGrowth', 'redesign')).totalCost - M.evaluate(c).totalCost, 250, 1e-9);
    close(M.evaluate(M.applyEventChoice(c, 'launchSlip', 'wait')).totalCost - M.evaluate(c).totalCost, 60, 1e-9);
  });
  await t.test('extraDays can flip daysOk', () => {
    const s = crewedFull(); s.crew.days = M.minDays();
    assert.equal(M.lifeSupport(s).daysOk, true);
    const n = M.applyEventChoice(s, 'solarStorm', 'shelter');
    assert.equal(n.events.extraDays, 1);
    assert.equal(M.lifeSupport(n).daysOk, false);
    assert.ok(M.validatePhase(n, 2).issues.some(i => i.code === 'tooShort'));
  });
  await t.test('risk accumulates', () => {
    let s = crewedFull(); s = M.applyEventChoice(s, 'solarStorm', 'continue'); s = M.applyEventChoice(s, 'launchSlip', 'go');
    assert.equal(s.events.risk, 2); assert.equal(M.evaluate(s).risk, 2);
  });
  await t.test('applyEventChoice works on state without events', () => {
    const s = crewedFull(); delete s.events;
    const n = M.applyEventChoice(s, 'massGrowth', 'absorb');
    assert.equal(n.events.log.length, 1);
  });
  await t.test('seed search sanity (some seed rolls an event)', () => {
    assert.ok(findSeed(crewedFull({ difficulty: 'director' }), 3) >= 0);
  });
  await t.test('rng is deterministic and in [0,1)', () => {
    const a = M.rng(42), b = M.rng(42);
    for (let i = 0; i < 100; i++) { const x = a(); assert.equal(x, b()); assert.ok(x >= 0 && x < 1); }
  });
});

/* ================= 8. Descope ================= */
test('descope', async (t) => {
  const multi = (make) => { const s = make(); s.design.science = ['camera', 'spectrometer', 'neutron']; return s; };
  await t.test('never removes the last answering instrument', () => {
    const cases = [
      robotOneWay(), multi(robotOneWay), multi(crewed),
      (() => { const s = robotOneWay({ question: 'water' }); s.design.science = ['neutron']; return s; })(),
      (() => { const s = robotOneWay({ measure: 'image' }); s.design.science = ['camera', 'neutron']; return s; })(),
      robotSample(), (() => { const s = robotSample(); s.design.science = ['sampler', 'camera']; return s; })(),
    ];
    for (const s of cases) for (const by of [undefined, 'cost']) {
      for (const sg of M.descopeSuggestions(s, by)) {
        if (!sg.remove) continue;
        const after = clone(s); after.design.science = after.design.science.filter(x => x !== sg.opt);
        assert.ok(M.payloadAnswers(after), `removing ${sg.opt} would break payload`);
      }
    }
  });
  await t.test('sole answering instrument never offered for removal', () => {
    const s = robotSample(); s.design.science = ['sampler'];
    assert.ok(!M.descopeSuggestions(s).some(x => x.remove));
    assert.ok(!M.descopeSuggestions(s, 'cost').some(x => x.remove));
  });
  await t.test('cost mode: only cheaper swaps, sorted by costSaves desc', () => {
    for (const s of [robotOneWay(), multi(robotOneWay), crewedFull(), multi(crewed)]) {
      s.design.structure = 'composite'; s.design.shield = 'stuffed';
      const out = M.descopeSuggestions(s, 'cost');
      assert.ok(out.length > 0);
      for (let i = 0; i < out.length; i++) {
        assert.ok(out[i].costSaves > 0);
        if (i) assert.ok(out[i - 1].costSaves >= out[i].costSaves);
        assert.ok(out[i].after.totalCost < M.evaluate(s).totalCost);
      }
      assert.ok(out.length <= 4);
    }
  });
  await t.test('mass mode: tli drops and sorted by saves desc', () => {
    const s = crewedFull(); s.design.structure = 'composite'; s.design.shield = 'solid'; s.design.power = 'fuelCells';
    const base = M.evaluate(s).tli, out = M.descopeSuggestions(s);
    assert.ok(out.length > 0);
    out.forEach((x, i) => { assert.ok(x.saves > 0); close(x.saves, base - x.after.tli, 1e-6); if (i) assert.ok(out[i - 1].saves >= x.saves); });
  });
  await t.test('descope does not mutate input', () => {
    const s = multi(crewedFull), f = JSON.stringify(s); M.descopeSuggestions(s); M.descopeSuggestions(s, 'cost'); assert.equal(JSON.stringify(s), f);
  });
  await t.test('previewWith toggles multi options', () => {
    const s = robotOneWay(); const added = M.previewWith(s, 'science', 'camera');
    assert.ok(added.tli > M.evaluate(s).tli);
    const removed = M.previewWith(added.lines ? Object.assign(clone(s), { design: Object.assign(clone(s.design), { science: ['spectrometer', 'camera'] }) }) : s, 'science', 'camera');
    close(removed.tli, M.evaluate(s).tli, 1e-9);
  });
});

/* ================= 9. Data integrity ================= */
test('data integrity', async (t) => {
  const SRC_KEYS = new Set(['src', 'capSrc', 'costSrc', 'factSrc']);
  const found = [];
  (function walk(o, p) {
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (p[0] === 'SOURCES') return;
      if (SRC_KEYS.has(k) && typeof v === 'string') found.push({ at: p.concat(k).join('.'), key: v });
      else walk(v, p.concat(k));
    }
  })(Object.fromEntries(Object.entries(D).filter(([k]) => k !== 'SOURCES')), []);

  await t.test('src keys are game or in SOURCES (whole data tree)', () => {
    assert.ok(found.length > 40, 'walker found src keys');
    for (const f of found) assert.ok(f.key === 'game' || D.SOURCES[f.key], `${f.at} -> unknown source '${f.key}'`);
  });
  await t.test('explicit coverage: options, FACTS, DV, LIFE, EVENTS, rockets', () => {
    const chk = (k, at) => assert.ok(k === 'game' || D.SOURCES[k], `${at}: ${k}`);
    D.SUBSYSTEMS.forEach(s => s.options.forEach(o => chk(o.src, `${s.id}.${o.id}`)));
    Object.entries(D.FACTS).forEach(([id, f]) => chk(f.src, 'FACTS.' + id));
    Object.entries(D.DV).forEach(([id, f]) => chk(f.src, 'DV.' + id));
    chk(D.LIFE.perCrewDay.src, 'LIFE.perCrewDay'); chk(D.LIFE.recycler.src, 'LIFE.recycler');
    D.LIFE.suits.forEach(s => s.src && chk(s.src, 'suit.' + s.id));
    D.EVENTS.forEach(e => chk(e.src, 'EVENTS.' + e.id));
    D.COMMS.links.forEach(l => chk(l.src, 'COMMS.link.' + l.id));
    D.COMMS.dishes.forEach(d => chk(d.src, 'COMMS.dish.' + d.id));
    D.SITES.forEach(x => chk(x.src, 'SITES.' + x.id));
    Object.values(D.ROCKETS).flat().forEach(r => { chk(r.capSrc, r.id + '.capSrc'); chk(r.costSrc, r.id + '.costSrc'); if (r.factSrc) chk(r.factSrc, r.id + '.factSrc'); });
  });
  await t.test('every SOURCES url starts with https:// and has a title', () => {
    for (const [k, s] of Object.entries(D.SOURCES)) { assert.ok(s.url.startsWith('https://'), k); assert.ok(s.title, k); }
  });
  await t.test('option ids unique per subsystem; subsystem ids unique', () => {
    assert.equal(new Set(D.SUBSYSTEMS.map(s => s.id)).size, D.SUBSYSTEMS.length);
    for (const s of D.SUBSYSTEMS) assert.equal(new Set(s.options.map(o => o.id)).size, s.options.length, s.id);
  });
  await t.test('fact references resolve', () => {
    D.SUBSYSTEMS.forEach(s => assert.ok(D.FACTS[s.fact], s.id));
    D.MISSION_TYPES.forEach(m => assert.ok(D.FACTS[m.fact], m.id));
  });
  await t.test('rockets / budgets / events well-formed', () => {
    for (const type of ['robotic', 'crewed']) {
      assert.ok(D.ROCKETS[type].length); assert.equal(new Set(D.ROCKETS[type].map(r => r.id)).size, D.ROCKETS[type].length);
      for (const d of D.DIFFICULTIES) assert.ok(D.BUDGET[type][d.id] > 0);
    }
    for (const d of D.DIFFICULTIES) { assert.ok(d.id in D.EVENT_CHANCE); assert.ok(d.id in D.FLIGHT.minMargin); }
    assert.equal(new Set(D.EVENTS.map(e => e.id)).size, D.EVENTS.length);
    D.EVENTS.forEach(e => e.choices.forEach(c => assert.ok(c.effect || c.effectByType, e.id + '.' + c.id)));
  });
  await t.test('every option provides data for each mission type it is allowed in', () => {
    for (const s of D.SUBSYSTEMS) for (const o of s.options) for (const type of ['robotic', 'crewed']) {
      if (o.only && o.only !== type) continue; assert.ok(o[type], `${s.id}.${o.id} missing ${type}`);
    }
  });
  await t.test('MEASURES unlock only existing instruments', () => {
    const ids = D.SUBSYSTEMS.find(s => s.id === 'science').options.map(o => o.id);
    D.MEASURES.forEach(m => m.unlocks.forEach(u => assert.ok(ids.includes(u))));
  });
});

/* ================= 10. Phase 4: communications ================= */
const withComms = (s, link, dish) => Object.assign(s, { comms: { link, dish } });
test('commsPlan', async (t) => {
  const C = D.COMMS;
  await t.test('light delay: avg = d/c, min < avg < max', () => {
    const p = M.commsPlan(withComms(robotOneWay(), 'ka', 'dsn34'));
    close(p.delay.avg, 384400 / 299792.458, 1e-9); close(p.delay.avg, 1.282, 0.001);
    assert.ok(p.delay.min < p.delay.avg && p.delay.avg < p.delay.max);
    close(p.delay.min, C.perigeeKm / 299792.458, 1e-9); close(p.delay.max, C.apogeeKm / 299792.458, 1e-9);
    close(p.roundTrip, 2 * p.delay.avg, 1e-9);
  });
  await t.test('dishGain(70) = (70/34)^2', () => {
    close(M.dishGain(70), (70 / 34) ** 2, 1e-12); assert.equal(M.dishGain(34), 1);
  });
  await t.test('gbPerDay = rate x hours x 3.6; 70 m dish multiplies the rate', () => {
    for (const l of C.links) {
      const p = M.commsPlan(withComms(robotOneWay(), l.id, 'dsn34'));
      close(p.gbPerDay, l.rateMbps * l.contactHours * 3.6, 1e-9, l.id);
      const q = M.commsPlan(withComms(robotOneWay(), l.id, 'dsn70')), k = l.optical ? 1 : (70 / 34) ** 2;
      close(q.rateMbps, p.rateMbps * k, 1e-9); close(q.gbPerDay, p.gbPerDay * k, 1e-6);
    }
  });
  await t.test('laser is optical: no dish gain, stays at the O2O 260 Mbps, math skips G ∝ D²', () => {
    assert.equal(C.links.filter(l => l.optical).map(l => l.id).join(), 'laser');
    const p = M.commsPlan(withComms(robotOneWay(), 'laser', 'dsn70'));
    assert.equal(p.gain, 1); assert.equal(p.rateMbps, 260);
    assert.ok(!M.commsMath(withComms(robotOneWay(), 'laser', 'dsn70')).steps.some(x => x.eq === 'G ∝ D²'));
    assert.ok(M.commsMath(withComms(robotOneWay(), 'ka', 'dsn70')).steps.some(x => x.eq === 'G ∝ D²'));
  });
  await t.test('bottleneck when need > capacity', () => {
    const s = robotOneWay(); s.design.science = ['camera', 'spectrometer'];
    const sb = M.commsPlan(withComms(s, 'sband', 'dsn34'));
    assert.equal(sb.needGbPerDay, 340); assert.ok(sb.gbPerDay < 340); assert.equal(sb.bottleneck, true);
    assert.equal(M.commsPlan(withComms(clone(s), 'ka', 'dsn34')).bottleneck, false);
  });
  await t.test('no link: zero rate, no bottleneck', () => {
    const p = M.commsPlan(robotOneWay({ comms: null }));
    assert.equal(p.gbPerDay, 0); assert.equal(p.bottleneck, false); assert.equal(p.link, null);
  });
  await t.test('weatherRisk only for laser', () => {
    for (const l of C.links) assert.equal(M.commsPlan(withComms(robotOneWay(), l.id, 'dsn34')).weatherRisk, l.id === 'laser');
  });
  await t.test('comms hardware raises tli and cost; dish adds cost but no mass', () => {
    for (const mk of [robotOneWay, crewedFull]) {
      const none = M.evaluate(mk({ comms: null })), ka = M.evaluate(withComms(mk(), 'ka', 'dsn34'));
      assert.ok(ka.tli > none.tli); assert.ok(ka.totalCost > none.totalCost);
      const link = M.evaluate(withComms(mk(), 'ka', null)), d34 = M.evaluate(withComms(mk(), 'ka', 'dsn34')), d70 = M.evaluate(withComms(mk(), 'ka', 'dsn70'));
      close(link.tli, d34.tli, 1e-9); close(d34.tli, d70.tli, 1e-9);
      assert.ok(d34.totalCost > link.totalCost); assert.ok(d70.totalCost > d34.totalCost);
    }
  });
  await t.test('commsMath includes t = d / c', () => {
    const m = M.commsMath(withComms(robotOneWay(), 'ka', 'dsn70'));
    assert.ok(m.steps.some(x => x.eq === 't = d / c'));
    assert.ok(m.steps.some(x => x.eq.startsWith('G'))); assert.ok(m.steps.some(x => x.eq === 'data = rate × time'));
  });
});

test('validatePhase(4)', async (t) => {
  const codes = (s) => M.validatePhase(s, 4).issues.map(i => i.code);
  const sev = (s, c) => (M.validatePhase(s, 4).issues.find(i => i.code === c) || {}).severity;
  await t.test('noLink / noDish block', () => {
    const a = robotOneWay({ comms: null }); assert.ok(codes(a).includes('noLink')); assert.ok(codes(a).includes('noDish'));
    assert.equal(sev(a, 'noLink'), 'block'); assert.equal(M.validatePhase(a, 4).ok, false);
    const b = withComms(robotOneWay(), 'ka', null); assert.deepEqual(codes(b).filter(c => c.startsWith('no')), ['noDish']);
    const c = withComms(robotOneWay(), null, 'dsn34'); assert.deepEqual(codes(c).filter(x => x.startsWith('no')), ['noLink']);
  });
  await t.test('valid plan is ok', () => { assert.equal(M.validatePhase(robotOneWay(), 4).ok, true); });
  await t.test('dataBottleneck warns', () => {
    const s = robotOneWay(); s.design.science = ['camera', 'spectrometer']; withComms(s, 'sband', 'dsn34');
    assert.equal(sev(s, 'dataBottleneck'), 'warn');
  });
  await t.test('laserWeather warns only for laser', () => {
    assert.equal(sev(withComms(robotOneWay(), 'laser', 'dsn34'), 'laserWeather'), 'warn');
    assert.ok(!codes(robotOneWay()).includes('laserWeather'));
  });
});

/* ================= 11. Phase 5: landing ================= */
const atSite = (s, site) => Object.assign(s, { site });
test('siteReport', async (t) => {
  await t.test('scienceMatch', () => {
    const w = robotOneWay({ question: 'water' });
    assert.equal(M.siteReport(atSite(w, 'southPole')).scienceMatch, true);
    assert.equal(M.siteReport(atSite(clone(w), 'tranquility')).scienceMatch, false);
  });
  await t.test('survivesNight by power option vs darkHours', () => {
    const exp = { solarBig: { southPole: true, tranquility: false, descartes: false }, rps: { southPole: true, tranquility: true, descartes: true }, solarSmall: { southPole: false, tranquility: false, descartes: false } };
    for (const [pw, per] of Object.entries(exp)) for (const [site, ok] of Object.entries(per)) {
      const s = robotOneWay(); s.design.power = pw;
      assert.equal(M.siteReport(atSite(s, site)).survivesNight, ok, `${pw}@${site}`);
    }
  });
  await t.test('opsHours', () => {
    const s = robotOneWay(); s.design.power = 'solarBig';
    assert.equal(M.siteReport(atSite(s, 'southPole')).opsHours, 700);
    assert.equal(M.siteReport(atSite(clone(s), 'tranquility')).opsHours, 354);
    s.design.power = 'rps'; assert.equal(M.siteReport(atSite(s, 'tranquility')).opsHours, 708);
    const c = M.siteReport(atSite(crewedFull(), 'tranquility')); assert.equal(c.opsHours, D.LIFE.surfaceDays * 24);
    assert.equal(c.survivesNight, true);
  });
  await t.test('coldRisk for crewed light suit at south pole only', () => {
    const c = atSite(crewedFull(), 'southPole'); c.crew.suit = 'light';
    assert.equal(M.siteReport(c).coldRisk, true);
    c.crew.suit = 'lunar'; assert.equal(M.siteReport(c).coldRisk, false);
    const l = atSite(crewedFull(), 'tranquility'); l.crew.suit = 'light'; assert.equal(M.siteReport(l).coldRisk, false);
    assert.equal(M.siteReport(atSite(robotOneWay(), 'southPole')).coldRisk, false);
  });
  await t.test('earthView', () => {
    assert.equal(M.siteReport(atSite(robotOneWay(), 'southPole')).earthView, 'intermittent');
    assert.equal(M.siteReport(atSite(robotOneWay(), 'tranquility')).earthView, 'always');
  });
  await t.test('null without a site', () => { assert.equal(M.siteReport(robotOneWay()), null); });
});

test('hoverAvailable', async (t) => {
  await t.test('= base + 2074 x margin x hoverShare / 1.62 and rises with margin', () => {
    let prev = -1;
    for (const m of D.FLIGHT.marginOptions) {
      const h = M.hoverAvailable(robotOneWay({ flight: { margin: m } }));
      close(h, D.LANDING.baseHoverSec + 2074 * m * D.LANDING.hoverShare / 1.62, 1e-9, 'margin ' + m);
      assert.ok(h > prev); prev = h;
    }
  });
});

test('landingSim', async (t) => {
  const sim = (s, seed) => M.landingSim(s, seed);
  await t.test('deterministic per seed', () => {
    const s = atSite(robotOneWay({ flight: { margin: 0.05 } }), 'descartes');
    for (let seed = 0; seed < 30; seed++) assert.deepEqual(sim(s, seed), sim(clone(s), seed));
  });
  await t.test('outcome thresholds', () => {
    const seen = new Set();
    for (const site of D.SITES.map(x => x.id)) for (const margin of D.FLIGHT.marginOptions) for (const diff of ['cadet', 'engineer', 'director']) {
      const s = atSite(robotOneWay({ difficulty: diff, flight: { margin } }), site);
      for (let seed = 0; seed < 40; seed++) {
        const r = sim(s, seed), a = r.hoverAvailable, n = r.hoverNeeded;
        const exp = a >= n ? 'clean' : a >= 0.6 * n ? 'rough' : 'abort';
        assert.equal(r.outcome, exp); seen.add(r.outcome);
        close(r.hoverUsed, Math.min(a, n), 1e-9); close(r.dvUsedHovering, r.hoverUsed * 1.62, 1e-9);
        assert.equal(r.seed, seed); assert.equal(r.site.id, site);
      }
    }
    assert.deepEqual([...seen].sort(), ['abort', 'clean', 'rough']);
  });
  await t.test('margin 0 at south pole on director: some seeds abort', () => {
    const s = atSite(robotOneWay({ difficulty: 'director', flight: { margin: 0 } }), 'southPole');
    let aborts = 0; for (let seed = 1; seed <= 50; seed++) if (sim(s, seed).outcome === 'abort') aborts++;
    assert.ok(aborts > 0, 'aborts: ' + aborts);
  });
  await t.test('margin 0.20 at tranquility on cadet: seeds 1..50 all clean', () => {
    const s = atSite(robotOneWay({ difficulty: 'cadet', flight: { margin: 0.2 } }), 'tranquility');
    for (let seed = 1; seed <= 50; seed++) assert.equal(sim(s, seed).outcome, 'clean', 'seed ' + seed);
  });
  await t.test('null without a site', () => { assert.equal(sim(robotOneWay(), 1), null); });
});

test('validatePhase(5)', async (t) => {
  const codes = (s) => M.validatePhase(s, 5).issues.map(i => i.code);
  const sev = (s, c) => (M.validatePhase(s, 5).issues.find(i => i.code === c) || {}).severity;
  await t.test('noSite blocks', () => {
    assert.ok(codes(robotOneWay()).includes('noSite')); assert.equal(M.validatePhase(robotOneWay(), 5).ok, false);
  });
  await t.test('landingAbort blocks only on abort', () => {
    const s = atSite(robotOneWay({ flight: { margin: 0.05 } }), 'tranquility');
    s.landing = { seed: 1, outcome: 'abort' };
    assert.equal(sev(s, 'landingAbort'), 'block'); assert.equal(M.validatePhase(s, 5).ok, false);
    s.landing.outcome = 'clean'; assert.ok(!codes(s).includes('landingAbort')); assert.equal(M.validatePhase(s, 5).ok, true);
  });
  await t.test('siteMismatch / earthHidden / lowHover warnings', () => {
    const s = atSite(robotOneWay({ question: 'made', flight: { margin: 0 } }), 'southPole'); s.design.power = 'rps';
    for (const c of ['siteMismatch', 'earthHidden', 'lowHover']) assert.equal(sev(s, c), 'warn', c);
    assert.ok(!codes(s).includes('nightDeath'));
    assert.equal(M.validatePhase(s, 5).ok, true);
    const g = atSite(robotOneWay({ question: 'made', flight: { margin: 0.2 } }), 'tranquility');
    for (const c of ['siteMismatch', 'earthHidden', 'lowHover']) assert.ok(!codes(g).includes(c), c);
  });
  await t.test('nightDeath warning', () => {
    const s = atSite(robotOneWay(), 'tranquility'); s.design.power = 'solarSmall';
    assert.equal(sev(s, 'nightDeath'), 'warn');
    s.design.power = 'rps'; assert.ok(!codes(s).includes('nightDeath'));
  });
  await t.test('suitCold warning', () => {
    const s = atSite(crewedFull({ question: 'water' }), 'southPole'); s.crew.suit = 'light';
    assert.equal(sev(s, 'suitCold'), 'warn');
    s.crew.suit = 'lunar'; assert.ok(!codes(s).includes('suitCold'));
  });
});

test('sanitizeState: phases 4 and 5', async (t) => {
  await t.test('keeps valid comms/site/landing', () => {
    const raw = robotOneWay({ site: 'southPole', landing: { seed: 42, outcome: 'rough' } });
    const s = M.sanitizeState(raw);
    assert.deepEqual(s.comms, { link: 'sband', dish: 'dsn34' }); assert.equal(s.site, 'southPole');
    assert.deepEqual(s.landing, { seed: 42, outcome: 'rough' });
  });
  await t.test('drops invalid ids, non-integer seed, landing without site', () => {
    const bad = M.sanitizeState(robotOneWay({ comms: { link: 'wifi', dish: 'dsn99' }, site: 'mars' }));
    assert.deepEqual(bad.comms, { link: null, dish: null }); assert.equal(bad.site, null); assert.equal(bad.landing, null);
    assert.equal(M.sanitizeState(robotOneWay({ site: 'descartes', landing: { seed: 1.5, outcome: 'clean' } })).landing, null);
    assert.equal(M.sanitizeState(robotOneWay({ landing: { seed: 3, outcome: 'clean' } })).landing, null);
    assert.equal(M.sanitizeState(robotOneWay({ site: 'descartes', landing: { seed: 3, outcome: 'explode' } })).landing.outcome, null);
    assert.equal(M.sanitizeState(robotOneWay({ comms: 'ka' })).comms, null);
  });
});

/* ---------------- HUD helpers ---------------- */
const SIM_ = require(path.join(__dirname, '..', 'js', 'sim.js'));
function fullState(type) {
  const f = require(path.join(__dirname, '..', 'fixtures', `f5a.${type}.json`));
  return f.state;
}

test('dvRemaining: crewed after LOI is 5,357 m/s required', () => {
  const s = fullState('crewed');
  const all = M.dvRemaining(s, []), loi = M.dvRemaining(s, ['loi']);
  close(all.required, 6307, 0.5);
  close(loi.required, 5357, 0.5);
  close(loi.planned, all.planned - M.flightPlan(s).burns[0].dvPlanned, 1e-9);
  assert.equal(M.dvRemaining(M.newState(), ['loi']), null);
});

test('missionDays: crewed matches life support, robotic matches the Phase 4 run for each site', () => {
  const c = fullState('crewed');
  assert.equal(M.missionDays(c), M.lifeSupport(c).days);
  assert.equal(M.missionHours(c), M.lifeSupport(c).days * 24);
  const base = fullState('robotic');
  for (const site of [null, ...D.SITES.map(x => x.id)]) {
    const s = clone(base); s.site = site;
    const run = SIM_.simulate(s, 4, { seed: 7 });
    assert.ok(run.ready, 'phase 4 runs');
    assert.equal(M.missionDays(s), Math.round(run.time.total / 24), `site ${site}`);
    close(M.missionHours(s), run.time.total, 1e-9);
  }
  assert.equal(M.missionDays(M.newState()), null);
});

test('launchRows: go matches launchReadiness and rows carry raw values', () => {
  for (const s of [fullState('robotic'), fullState('crewed'), M.newState(), robotOneWay()]) {
    const L = M.launchRows(s);
    assert.equal(L.go, M.launchReadiness(s).go);
    assert.deepEqual(L.rows.map(x => x.key), ['goal', 'spacecraft', 'totalMass', 'deltaV', 'crew', 'missionDays', 'lifeSupport', 'comms']);
    for (const x of L.rows) assert.equal(typeof x.ok, 'boolean');
  }
  const L = M.launchRows(fullState('crewed')), r = M.evaluate(fullState('crewed'));
  assert.equal(L.rows.find(x => x.key === 'totalMass').value, r.tli);
  assert.equal(L.rows.find(x => x.key === 'deltaV').value, r.dvPlanned);
});

test('hud: one call for the bar, safe on an empty state', () => {
  const empty = M.hud(M.newState());
  assert.equal(empty.launchMass, 0);
  assert.equal(empty.dvRemaining, null);
  assert.equal(empty.days, null);
  const s = fullState('crewed'), r = M.evaluate(s), h = M.hud(s, { flown: ['loi'], dataSentGb: 3 });
  assert.equal(h.launchMass, r.tli);
  assert.equal(h.capacity, r.rocket.capacity);
  assert.equal(h.dataSentGb, 3);
  assert.equal(h.dataNeedGbPerDay, M.dataNeedPerDay(s));
  close(h.dvRemaining.required, 5357, 0.5);
  assert.equal(h.days, M.lifeSupport(s).days);
  assert.equal(M.hud(M.newState(), { dataSentGb: 2 }).dataSentGb, 2);
});
