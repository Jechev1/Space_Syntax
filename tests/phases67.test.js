'use strict';
/* Engine tests for Phase 6 (surface science) and Phase 7 (return to Earth). */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const M = require(path.join(__dirname, '..', 'js', 'model.js'));
const D = require(path.join(__dirname, '..', 'js', 'data.js'));

const clone = (x) => JSON.parse(JSON.stringify(x));
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} expected ${b} ± ${tol}, got ${a}`);

/* ---------------- builders ---------------- */
function robot(over = {}) {
  const s = M.newState();
  Object.assign(s, { question: 'made', measure: 'chem', missionType: 'robotic', rocket: 'medium', site: 'tranquility', landing: { seed: 1, outcome: 'clean' } });
  s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'solarBig', science: ['camera', 'spectrometer'] };
  s.comms = { link: 'sband', dish: 'dsn34' };
  return Object.assign(s, over);
}
function robotSample(over = {}) {
  const s = robot({ question: 'age', measure: 'sample' });
  s.design.science = ['camera', 'sampler'];
  return Object.assign(s, over);
}
function crew(over = {}) {
  const s = M.newState();
  Object.assign(s, { question: 'water', measure: 'sample', missionType: 'crewed', rocket: 'sls2', site: 'southPole', landing: { seed: 1, outcome: 'clean' } });
  s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'crewSolar', science: ['camera', 'spectrometer', 'neutron', 'sampler'] };
  s.crew = { size: 2, days: 10, reserve: 0.2, suit: 'lunar', recycler: false };
  s.flight = { margin: 0.05 };
  s.comms = { link: 'sband', dish: 'dsn34' };
  return Object.assign(s, over);
}
/** Apply a list of [poi, instrument] measurements, asserting each one is allowed. */
function play(s, steps) {
  for (const [poi, ins] of steps) {
    const r = M.measure(s, poi, ins);
    assert.ok(r.ok, `${poi}/${ins}: ${r.reason}`);
    s = r.state;
  }
  return s;
}
const codes = (s, n) => M.validatePhase(s, n).issues.map(i => i.code);
const sev = (s, n, c) => (M.validatePhase(s, n).issues.find(i => i.code === c) || {}).severity;

/* ================= data ================= */
test('phase 6/7 data integrity', async (t) => {
  const srcOk = (k, at) => assert.ok(k === 'game' || D.SOURCES[k], `${at}: ${k}`);
  await t.test('every site has POIs and a result for every instrument, all sourced', () => {
    for (const site of D.SITES) {
      const pois = D.SURFACE.pois[site.id];
      assert.ok(pois && pois.length >= 3 && pois.length <= 4, site.id);
      assert.equal(new Set(pois.map(p => p.id)).size, pois.length);
      for (const id of Object.keys(D.SURFACE.instruments)) {
        const r = D.SURFACE.results[site.id][id];
        assert.ok(r && r.text && r.text.length <= 140, `${site.id}.${id}`); srcOk(r.src, `${site.id}.${id}`);
      }
    }
    srcOk(D.SURFACE.hydrogenNote.src, 'hydrogenNote'); srcOk(D.SURFACE.regolith.src, 'regolith');
  });
  await t.test('instruments match the Phase 1 science options', () => {
    const ids = D.SUBSYSTEMS.find(s => s.id === 'science').options.map(o => o.id).sort();
    assert.deepEqual(Object.keys(D.SURFACE.instruments).sort(), ids);
    const ev = D.SURFACE.evidence.map(e => e.id);
    for (const ins of Object.values(D.SURFACE.instruments)) { assert.ok(ev.includes(ins.evidence)); if (ins.evidenceOtherwise) assert.ok(ev.includes(ins.evidenceOtherwise)); }
    for (const id of ev) assert.ok(D.SURFACE.outcomes[id], 'outcome ' + id);
    for (const id of ['camera', 'spectrometer', 'neutron']) {
      const opt = D.SUBSYSTEMS.find(s => s.id === 'science').options.find(o => o.id === id);
      assert.equal(opt.robotic.power, D.SURFACE.instruments[id].power, id);
      assert.equal(opt.crewed.power, D.SURFACE.instruments[id].power, id + ' crewed');
    }
  });
  await t.test('events, entries, shields, difficulty tables', () => {
    assert.equal(new Set(D.SURFACE_EVENTS.map(e => e.id)).size, D.SURFACE_EVENTS.length);
    D.SURFACE_EVENTS.forEach(e => { srcOk(e.src, e.id); e.choices.forEach(c => assert.ok(c.effect, e.id + '.' + c.id)); });
    D.RETURN.entries.forEach(e => srcOk(e.src, e.id)); D.RETURN.shields.forEach(s => srcOk(s.src, s.id));
    for (const d of D.DIFFICULTIES) {
      for (const tbl of [D.SURFACE_EVENT_CHANCE, D.RETURN.dispersion, D.RETURN.thermal.loadFactor, D.RETURN.missFactor]) assert.ok(d.id in tbl, d.id);
    }
    for (const type of ['robotic', 'crewed']) D.RETURN.burns[type].forEach(k => assert.ok(D.DV[k], k));
    srcOk(D.RETURN.descope.src, 'descope');
  });
  await t.test('crew return burns add up to the guide value (1,833 + 1,450 = 3,283 m/s)', () => {
    assert.equal(D.RETURN.burns.crewed.reduce((a, k) => a + D.DV[k].value, 0), 3283);
  });
});

/* ================= Phase 6 ================= */
test('surface: access', async (t) => {
  await t.test('needs a landing that was not aborted', () => {
    const s = robot({ landing: null });
    assert.equal(M.canMeasure(s, 'plain', 'camera').code, 'notLanded');
    assert.deepEqual(codes(s, 6), ['noLanding']);
    s.landing = { seed: 1, outcome: 'abort' };
    assert.equal(M.canMeasure(s, 'plain', 'camera').code, 'notLanded');
    assert.equal(sev(s, 6, 'landingAbort'), 'block');
  });
  await t.test('crewed needs a crew plan', () => {
    assert.equal(M.canMeasure(crew({ crew: null }), 'rim', 'camera').code, 'noCrew');
  });
  await t.test('unknown POI / instrument not on board / not needed by the question', () => {
    const s = robot();
    assert.equal(M.canMeasure(s, 'shadow', 'camera').code, 'unknownPoi');
    assert.equal(M.canMeasure(s, 'plain', 'neutron').code, 'notLoaded');
    const img = robot({ measure: 'image' }); // spectrometer loaded but "take pictures" only needs the camera
    assert.equal(M.canMeasure(img, 'plain', 'spectrometer').code, 'notNeeded');
    const inst = M.surfaceStatus(img).instruments.find(i => i.id === 'spectrometer');
    assert.equal(inst.locked, true); assert.equal(inst.lockReason, 'Your Phase 0 question doesn\'t need this');
  });
});

test('surface: measurements', async (t) => {
  await t.test('measure is pure and returns the journal entry', () => {
    const s = robot(), before = clone(s);
    const r = M.measure(s, 'plain', 'camera');
    assert.deepEqual(s, before);
    assert.equal(r.ok, true); assert.equal(r.entry.missionHour, 0); assert.equal(r.entry.result.src, 'lro');
    assert.equal(M.measure(s, 'nowhere', 'camera').state, s);
  });
  await t.test('hours, data and power accounting', () => {
    const s = play(robot(), [['plain', 'camera'], ['plain', 'spectrometer'], ['crater', 'camera']]);
    const st = M.surfaceStatus(s), I = D.SURFACE.instruments;
    close(st.hoursUsed, I.camera.hours * 2 + I.spectrometer.hours, 1e-9);
    close(st.hoursLeft, M.surfaceHours(robot()) - st.hoursUsed, 1e-9);
    close(st.bufferGb, I.camera.dataGb * 2 + I.spectrometer.dataGb, 1e-9);
    assert.deepEqual(st.journal.map(j => j.missionHour), [0, I.camera.hours, I.camera.hours + I.spectrometer.hours]);
    assert.ok(st.power.available > 0 && st.power.capacity >= st.power.available);
  });
  await t.test('repeat on the same spot is blocked; POI status text', () => {
    const s = play(robot(), [['plain', 'camera']]);
    assert.equal(M.canMeasure(s, 'plain', 'camera').code, 'repeat');
    let st = M.surfaceStatus(s);
    assert.deepEqual(st.pois.map(p => p.status), ['Studied: camera', 'Not studied', 'Not studied']);
    st = M.surfaceStatus(play(s, [['plain', 'spectrometer']]));
    assert.equal(st.pois[0].status, 'Done');
  });
  await t.test('rough landing costs an hour; running out of time blocks', () => {
    const day = D.SITES.find(x => x.id === 'tranquility').lightHours;
    assert.equal(M.surfaceHours(robot()), day);
    assert.equal(M.surfaceHours(robot({ site: 'southPole' })), D.SITES.find(x => x.id === 'southPole').lightHours);
    assert.equal(M.surfaceHours(robot({ landing: { seed: 1, outcome: 'rough' } })), day - D.SURFACE.roughLandingPenalty);
    const life = M.lifeSupport(crew());
    assert.equal(M.surfaceHours(crew()), D.LIFE.evaPlan.count * life.suit.evaHours * life.landingCrew);
    assert.equal(M.siteReport(crew()).evaHours, M.surfaceHours(crew()));
    const site = D.SITES.find(x => x.id === 'tranquility'), saved = site.lightHours;
    try {
      site.lightHours = 0.5;
      const s = robot();
      s.surface = { actions: [{ type: 'event', id: 'noSignal', choice: 'wait' }], finished: false };
      assert.equal(M.canMeasure(s, 'plain', 'camera').code, 'noTime');
    } finally { site.lightHours = saved; }
  });
  await t.test('not enough spare power blocks', () => {
    const s = robot();
    const need = M.surfacePower(s).available;
    const orig = D.SURFACE.instruments.spectrometer.power;
    try { D.SURFACE.instruments.spectrometer.power = need + 1; assert.equal(M.canMeasure(s, 'plain', 'spectrometer').code, 'noPower'); }
    finally { D.SURFACE.instruments.spectrometer.power = orig; }
  });
  await t.test('data buffer is 150 Gb robotic and 300 Gb crewed; filling it blocks', () => {
    assert.equal(M.surfaceStatus(robot()).bufferMax, 150);
    assert.equal(M.surfaceStatus(crew()).bufferMax, 300);
    const s = robot({ site: 'descartes' });
    let open = play(s, [['ridge', 'camera'], ['craterRim', 'camera'], ['boulder', 'camera'], ['valley', 'camera']]);
    assert.ok(M.canMeasure(open, 'ridge', 'spectrometer').ok, '150 Gb is not filled by four pictures');
    const cap = D.SURFACE.bufferGb, saved = cap.robotic;
    try {
      cap.robotic = 5; // temporary, so four pictures fit and the next one does not
      let x = play(s, [['ridge', 'camera'], ['craterRim', 'camera'], ['boulder', 'camera'], ['valley', 'camera']]);
      assert.equal(M.canMeasure(x, 'ridge', 'spectrometer').code, 'bufferFull');
      assert.equal(M.canMeasure(x, 'ridge', 'spectrometer').reason, 'Data buffer full. Send data before measuring again.');
      const sent = M.sendData(x); assert.ok(sent.ok); x = sent.state;
      const st = M.surfaceStatus(x); assert.equal(st.bufferGb, 0); close(st.dataSentGb, 4.8, 1e-9);
      assert.ok(M.canMeasure(x, 'ridge', 'spectrometer').ok);
      assert.equal(M.canSendData(x).code, 'empty');
    } finally { cap.robotic = saved; }
  });
  await t.test('sample box capacity (robot: 2 × 0.25 kg)', () => {
    const s = play(robotSample(), [['plain', 'sampler'], ['crater', 'sampler']]);
    assert.equal(M.surfaceStatus(s).sampleKg, 0.5);
    assert.equal(M.canMeasure(s, 'boulder', 'sampler').code, 'boxFull');
    const c = play(crew({ site: 'descartes', question: 'made' }), [['ridge', 'sampler'], ['craterRim', 'sampler'], ['boulder', 'sampler'], ['valley', 'sampler']]);
    assert.equal(M.surfaceStatus(c).sampleKg, D.SURFACE.returnCapacityKg.crewed);
  });
  await t.test('one-way robots cannot hold samples', () => {
    assert.equal(M.surfaceStatus(robot()).sampleCapacityKg, 0);
  });
});

test('surface: evidence', async (t) => {
  await t.test('hydrogen is good proof only for the water question', () => {
    assert.equal(M.instrumentEvidence(crew(), 'neutron'), 'composition');
    assert.equal(M.instrumentEvidence(crew({ question: 'made' }), 'neutron'), 'clue');
    assert.equal(M.instrumentEvidence(crew(), 'camera'), 'clue');
    assert.equal(M.instrumentEvidence(crew(), 'sampler'), 'sample');
  });
  await t.test('polar hydrogen result carries the "clue, not proof" note', () => {
    const r = M.measure(crew(), 'shadow', 'neutron');
    assert.equal(r.entry.note.src, 'lcross'); assert.match(r.entry.note.text, /not proof/);
    const m = M.measure(crew({ site: 'tranquility' }), 'plain', 'neutron');
    assert.equal(m.entry.note, null);
  });
  await t.test('meter lights segments and keeps the strongest level', () => {
    let s = play(crew(), [['rim', 'camera']]);
    let st = M.surfaceStatus(s);
    assert.deepEqual(st.segments, { clue: true, composition: false, sample: false }); assert.equal(st.meter, 'Evidence: Weak');
    s = play(s, [['rim', 'spectrometer']]); assert.equal(M.surfaceStatus(s).meter, 'Evidence: Good');
    s = play(s, [['slope', 'sampler']]); st = M.surfaceStatus(s);
    assert.equal(st.meter, 'Evidence: Strong'); assert.deepEqual(st.segments, { clue: true, composition: true, sample: true });
    s = play(s, [['slope', 'camera']]); assert.equal(M.surfaceStatus(s).evidence, 'sample');
  });
  await t.test('closing screen by case', () => {
    assert.equal(M.surfaceOutcome(robot()), null);
    assert.equal(M.surfaceOutcome(play(robot(), [['plain', 'camera']])).title, 'Pictures are clues');
    assert.equal(M.surfaceOutcome(play(robot(), [['plain', 'spectrometer']])).title, 'Good clues, no sample');
    const o = M.surfaceOutcome(play(robotSample(), [['plain', 'sampler']]));
    assert.equal(o.title, 'Samples in hand'); assert.equal(o.pose, 'wow');
  });
});

test('surface: finish and validation', async (t) => {
  await t.test('finish needs a measurement and asks to confirm when hours are left', () => {
    const f0 = M.finishSurface(robot()); assert.equal(f0.ok, false); assert.equal(f0.reason, 'Take at least one measurement');
    assert.deepEqual(codes(robot(), 6), ['noMeasurement']);
    const s = play(robot(), [['plain', 'camera']]);
    const f = M.finishSurface(s);
    assert.equal(f.ok, true); assert.equal(f.confirm, 'You still have 353.5 hours. Finish anyway?');
    assert.equal(M.canMeasure(f.state, 'crater', 'camera').code, 'finished');
    assert.ok(!codes(f.state, 6).includes('hoursLeft'));
  });
  await t.test('warnings: hours left, weak evidence, no sample, unsent data', () => {
    const s = play(robotSample(), [['plain', 'camera']]);
    for (const c of ['hoursLeft', 'weakEvidence', 'noSample', 'unsentData']) assert.equal(sev(s, 6, c), 'warn', c);
    assert.equal(M.validatePhase(s, 6).ok, true);
    const g = M.sendData(play(robotSample(), [['plain', 'sampler']])).state;
    for (const c of ['weakEvidence', 'noSample', 'unsentData']) assert.ok(!codes(g, 6).includes(c), c);
  });
});

test('surface: events', async (t) => {
  await t.test('deterministic, only after a measurement, never repeats, storm is crew only', () => {
    const s = play(crew({ difficulty: 'director' }), [['rim', 'camera']]);
    assert.equal(M.rollSurfaceEvent(crew(), 1), null);
    let hits = 0;
    for (let seed = 0; seed < 200; seed++) {
      const e = M.rollSurfaceEvent(s, seed);
      assert.deepEqual(e, M.rollSurfaceEvent(clone(s), seed));
      if (e) hits++;
    }
    assert.ok(hits > 20 && hits < 120, 'hits ' + hits);
    const r = play(robot({ difficulty: 'director' }), [['plain', 'camera']]);
    for (let seed = 0; seed < 200; seed++) { const e = M.rollSurfaceEvent(r, seed); assert.ok(!e || e.id !== 'surfaceStorm'); }
    assert.equal(M.applySurfaceEventChoice(r, 'surfaceStorm', 'shelter'), r);
    const once = M.applySurfaceEventChoice(s, 'noSignal', 'wait');
    assert.equal(M.applySurfaceEventChoice(once, 'noSignal', 'store'), once);
    for (let seed = 0; seed < 200; seed++) { const e = M.rollSurfaceEvent(once, seed); assert.ok(!e || e.id !== 'noSignal'); }
  });
  await t.test('shelter costs 1 hour; the blackout wait costs 41 minutes; keep working adds risk', () => {
    const s = play(crew(), [['rim', 'camera']]), h = M.surfaceStatus(s).hoursLeft;
    assert.equal(M.surfaceStatus(M.applySurfaceEventChoice(s, 'surfaceStorm', 'shelter')).hoursLeft, h - 1);
    close(M.surfaceStatus(M.applySurfaceEventChoice(s, 'noSignal', 'wait')).hoursLeft, h - D.COMMS.blackoutMin / 60, 1e-9);
    const k = M.applySurfaceEventChoice(s, 'surfaceStorm', 'keepWorking');
    assert.equal(M.surfaceStatus(k).risk, 1); assert.equal(sev(k, 6, 'surfaceRisk'), 'warn');
  });
  await t.test('storing data during the blackout blocks sending for 2 measurements', () => {
    let s = M.applySurfaceEventChoice(play(robot(), [['plain', 'camera']]), 'noSignal', 'store');
    assert.equal(M.canSendData(s).reason, 'No signal: behind the Moon');
    s = play(s, [['plain', 'spectrometer']]); assert.equal(M.canSendData(s).code, 'noSignal');
    s = play(s, [['crater', 'camera']]); assert.ok(M.canSendData(s).ok);
  });
});

test('sanitizeState: phases 6 and 7', async (t) => {
  await t.test('newState has empty phase 6/7 fields', () => {
    const s = M.newState(); assert.equal(s.surface, null); assert.equal(s.returnTrip, null);
  });
  await t.test('valid save round-trips', () => {
    let s = M.sendData(play(crew(), [['rim', 'camera'], ['shadow', 'neutron'], ['slope', 'sampler']])).state;
    s = M.applySurfaceEventChoice(s, 'noSignal', 'store');
    s = M.finishSurface(s).state;
    s.returnTrip = { seed: 9, entry: 'skip', shield: 'standard' };
    const z = M.sanitizeState(clone(s));
    assert.deepEqual(z.surface, s.surface); assert.deepEqual(z.returnTrip, s.returnTrip);
  });
  await t.test('tampered actions are dropped by replaying the rules', () => {
    const raw = robot();
    raw.surface = { finished: true, actions: [
      { type: 'measure', poi: 'plain', instrument: 'sampler' },   // not on board
      { type: 'measure', poi: 'plain', instrument: 'camera' },
      { type: 'measure', poi: 'plain', instrument: 'camera' },    // repeat
      { type: 'measure', poi: '__proto__', instrument: 'camera' },
      { type: 'event', id: 'surfaceStorm', choice: 'keepWorking' }, // crew only
      { type: 'hack' }, null, 'x',
    ] };
    const z = M.sanitizeState(raw);
    assert.deepEqual(z.surface.actions, [{ type: 'measure', poi: 'plain', instrument: 'camera' }]);
    assert.equal(z.surface.finished, true);
  });
  await t.test('finished without any measurement is not kept; no surface without a landing', () => {
    const raw = robot(); raw.surface = { finished: true, actions: [] };
    assert.equal(M.sanitizeState(raw).surface.finished, false);
    const nl = robot({ landing: { seed: 1, outcome: 'abort' } }); nl.surface = { actions: [{ type: 'measure', poi: 'plain', instrument: 'camera' }] };
    assert.equal(M.sanitizeState(nl).surface, null);
  });
  await t.test('action list is capped', () => {
    const raw = robot(); raw.surface = { actions: Array.from({ length: 5000 }, () => ({ type: 'send' })) };
    assert.ok(M.sanitizeState(raw).surface.actions.length <= D.SURFACE.maxActions);
  });
  await t.test('returnTrip: invalid ids become null, dropped for one-way missions', () => {
    const z = M.sanitizeState(crew({ returnTrip: { seed: 1.5, entry: 'bounce', shield: 'thin' } }));
    assert.deepEqual(z.returnTrip, { seed: 0, entry: null, shield: 'thin' });
    assert.equal(M.sanitizeState(robot({ returnTrip: { seed: 1, entry: 'skip', shield: 'thin' } })).returnTrip, null);
  });
});

/* ================= Phase 7 ================= */
test('return: delta-v', async (t) => {
  await t.test('one-way robot: nothing to return, phase 7 has no issues', () => {
    assert.deepEqual(M.returnSim(robot()), { applicable: false });
    assert.equal(M.returnBurns(robot(), 1), null);
    assert.deepEqual(M.validatePhase(robot(), 7), { ok: true, issues: [] });
  });
  await t.test('burn order and labels', () => {
    assert.deepEqual(M.returnBurns(crew(), 1).burns.map(b => b.label), ['Liftoff from the Moon', 'Earth return burn']);
    assert.deepEqual(M.returnBurns(robotSample(), 1).burns.map(b => b.key), ['direct']);
  });
  await t.test('full sample box: available delta-v is exactly the Phase 3 plan', () => {
    for (const margin of D.FLIGHT.marginOptions) {
      const s = play(robotSample({ flight: { margin } }), [['plain', 'sampler'], ['crater', 'sampler']]);
      const f = M.returnBurns(s, 1);
      close(f.burns[0].available, D.DV.direct.value * (1 + margin), 1e-6, 'margin ' + margin);
    }
    const c = play(crew({ site: 'descartes', question: 'made', flight: { margin: 0 } }), [['ridge', 'sampler'], ['craterRim', 'sampler'], ['boulder', 'sampler'], ['valley', 'sampler']]);
    close(M.returnBurns(c, 1).pool, 3283, 1e-6);
  });
  await t.test('an empty sample box gives a little extra delta-v', () => {
    const empty = M.returnBurns(crew(), 1), plan = empty.burns.reduce((a, b) => a + b.planned, 0);
    assert.ok(empty.pool > plan && empty.pool < plan * 1.05);
  });
  await t.test('pool bookkeeping: before − need = after, needs within dispersion', () => {
    for (let seed = 0; seed < 30; seed++) {
      const f = M.returnBurns(crew({ difficulty: 'director' }), seed);
      close(f.burns[0].before, f.pool, 1e-9);
      for (const b of f.burns) {
        close(b.after, b.before - b.need, 1e-9);
        assert.ok(b.need >= b.dv && b.need <= b.dv * (1 + D.RETURN.dispersion.director) + 1e-9);
      }
      assert.deepEqual(f, M.returnBurns(crew({ difficulty: 'director' }), seed));
    }
  });
  await t.test('margin decides: 0% on director fails sometimes, 20% on engineer never', () => {
    let fails = 0;
    for (let seed = 0; seed < 60; seed++) if (!M.returnBurns(crew({ difficulty: 'director', flight: { margin: 0 } }), seed).ok) fails++;
    assert.ok(fails > 0, 'fails ' + fails);
    for (let seed = 0; seed < 60; seed++) assert.ok(M.returnBurns(crew({ flight: { margin: 0.2 } }), seed).ok);
  });
  await t.test('fuel failure: plain cause, chain from real numbers, back to phase 3', () => {
    let seed = 0, s;
    for (; seed < 200; seed++) { s = crew({ difficulty: 'director', flight: { margin: 0 }, returnTrip: { seed, entry: null, shield: null } }); if (!M.returnBurns(s, seed).ok) break; }
    const sim = M.returnSim(s);
    assert.equal(sim.outcome, 'fail'); assert.equal(sim.failure.code, 'fuelShort'); assert.equal(sim.failure.backTo, 3);
    assert.match(sim.failure.title, /^Not enough fuel for the /);
    assert.equal(sim.failure.chain.length, 3); assert.equal(sim.failure.chain[0].text, 'Decision: 0% delta-v reserve');
    assert.equal(sim.failure.descope.src, 'seHandbook');
    assert.equal(sev(s, 7, 'fuelShort'), 'block');
  });
  await t.test('show the math', () => {
    const m = M.returnMath(play(crew({ site: 'descartes', question: 'made', flight: { margin: 0 } }), [['ridge', 'sampler'], ['craterRim', 'sampler'], ['boulder', 'sampler'], ['valley', 'sampler']]));
    assert.equal(m.steps[0].num, '(1,833 + 1,450) m/s × 1.00 = 3,283 m/s');
    assert.equal(m.steps.length, 3);
  });
});

test('return: reentry and splashdown', async (t) => {
  await t.test('guide rule: thin + skip is amber, thin + direct is green (engineer)', () => {
    const s = crew();
    const a = M.thermalCheck(s, 'skip', 'thin');
    assert.equal(a.status, 'low'); assert.equal(a.label, 'Thermal margin: low');
    assert.equal(a.message, 'Thin shield with skip entry leaves little margin.');
    assert.equal(M.thermalCheck(s, 'direct', 'thin').status, 'ok');
    assert.equal(M.thermalCheck(s, 'skip', 'standard').status, 'ok');
    assert.equal(M.thermalCheck(s, null, null), null);
  });
  await t.test('too low is reachable (director, thin + skip) and blocks', () => {
    const s = crew({ difficulty: 'director', flight: { margin: 0.2 }, returnTrip: { seed: 1, entry: 'skip', shield: 'thin' } });
    assert.equal(M.thermalCheck(s).status, 'tooLow');
    const sim = M.returnSim(s);
    assert.equal(sim.failure.code, 'thermalTooLow'); assert.equal(sim.failure.backTo, 7);
    assert.equal(sev(s, 7, 'thermalTooLow'), 'block');
  });
  await t.test('thicker shields weigh more', () => {
    const m = D.RETURN.shields.map(sh => M.thermalCheck(crew(), 'direct', sh.id).addedMass);
    assert.deepEqual([...m].sort((a, b) => a - b), m); assert.ok(m[2] > m[0]);
  });
  await t.test('splashdown: deterministic, skip always in zone on engineer, direct misses sometimes on director', () => {
    for (let seed = 0; seed < 100; seed++) {
      const s = M.splashdown(crew(), seed, 'skip');
      assert.deepEqual(s, M.splashdown(crew(), seed, 'skip'));
      assert.ok(s.inZone && s.score > 0 && s.score <= 100);
      assert.ok(s.missKm >= D.RETURN.minMissKm);
    }
    let miss = 0;
    for (let seed = 0; seed < 100; seed++) if (!M.splashdown(crew({ difficulty: 'director' }), seed, 'direct').inZone) miss++;
    assert.ok(miss > 0 && miss < 100, 'miss ' + miss);
  });
  await t.test('returnSim: pending until both choices, then success or a zone failure', () => {
    const s = crew({ flight: { margin: 0.2 }, returnTrip: { seed: 1, entry: 'skip', shield: null } });
    assert.equal(M.returnSim(s).outcome, 'pending');
    assert.deepEqual(codes(s, 7), ['noShield']);
    s.returnTrip.shield = 'standard';
    assert.equal(M.returnSim(s).outcome, 'success'); assert.equal(M.validatePhase(s, 7).ok, true);
    let found = false;
    for (let seed = 0; seed < 100 && !found; seed++) {
      const d = crew({ difficulty: 'director', flight: { margin: 0.2 }, returnTrip: { seed, entry: 'direct', shield: 'thick' } });
      const sim = M.returnSim(d);
      if (sim.outcome === 'fail') {
        found = true; assert.equal(sim.failure.code, 'missedZone');
        assert.equal(sim.failure.chain[2].text, 'Result: outside the 10 km recovery zone');
        assert.equal(sev(d, 7, 'missedZone'), 'block');
      }
    }
    assert.ok(found);
  });
  await t.test('noEntry and noShield block', () => {
    assert.deepEqual(codes(crew({ flight: { margin: 0.2 } }), 7), ['noEntry', 'noShield']);
  });
});

test('phases 0 to 5 are untouched by phase 6/7 state', () => {
  const base = crew(), withNew = clone(base);
  withNew.surface = play(crew(), [['rim', 'camera'], ['slope', 'sampler']]).surface;
  withNew.returnTrip = { seed: 3, entry: 'skip', shield: 'thick' };
  assert.deepEqual(M.evaluate(withNew), M.evaluate(base));
  for (const n of [0, 1, 2, 3, 4, 5]) assert.deepEqual(M.validatePhase(withNew, n), M.validatePhase(base, n));
  assert.deepEqual(M.launchReadiness(withNew), M.launchReadiness(base));
});
