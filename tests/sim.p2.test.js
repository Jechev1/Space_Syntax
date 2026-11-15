'use strict';
/* Phase 2 "Mission days" simulator. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const M = require(path.join(__dirname, '..', 'js', 'model.js'));
const D = require(path.join(__dirname, '..', 'js', 'data.js'));
const P2 = require(path.join(__dirname, '..', 'js', 'sim', 'p2.js'));
const { checkResult } = require('./sim-check.js');

function robot(over = {}) {
  const s = M.newState();
  Object.assign(s, { question: 'made', measure: 'chem', missionType: 'robotic', rocket: 'medium', site: 'tranquility' });
  s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'solarBig', science: ['camera', 'spectrometer'] };
  s.comms = { link: 'sband', dish: 'dsn34' };
  return Object.assign(s, over);
}
function crew(c = {}, over = {}) {
  const s = M.newState();
  Object.assign(s, { question: 'water', measure: 'sample', missionType: 'crewed', rocket: 'sls2', site: 'southPole' });
  s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'crewSolar', science: ['camera', 'spectrometer', 'neutron', 'sampler'] };
  s.crew = Object.assign({ size: 2, days: 10, reserve: 0.2, suit: 'lunar', recycler: false }, c);
  s.comms = { link: 'sband', dish: 'dsn34' };
  return Object.assign(s, over);
}
const last = (r) => r.frames[r.frames.length - 1];
const close = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `expected ${b} +- ${tol}, got ${a}`);
// Seeds found by scanning: seed 1 has no storm, seed 10 an unannounced storm, 22 a late one.
const CALM = 1, STORM = 10, LATE_STORM = 22;

test('p2: a sensible crew plan succeeds with 3 stars', () => {
  const r = P2.simulate(crew(), { seed: CALM });
  checkResult(r, 2);
  assert.equal(r.ok, true); assert.equal(r.stars, 3);
  assert.equal(r.time.unit, 'day'); assert.equal(r.time.total, M.minDays());
  assert.ok(r.frames.length >= 4 && r.frames.length <= 200);
  assert.ok(last(r).o2 > 0 && last(r).food > 0 && last(r).water > 0);
});

test('p2: real BVAD numbers, 4 crew x 10 days O2 = 35.8 kg with no reserve', () => {
  const r = P2.simulate(crew({ size: 4, days: 10, reserve: 0 }), { seed: CALM });
  checkResult(r, 2);
  assert.equal(r.frames[0].o2, 35.8);
  assert.equal(r.frames[0].food, 32);
  close(r.frames[0].water, 128.68, 1e-9);
  close(last(r).o2, 4 * 0.895, 0.01); // 9 days used, 1 day left over
  assert.ok(r.math.steps.some(s => /35\.8/.test(s.num)));
  assert.equal(r.math.src, 'bvad');
});

test('p2: crew is on the surface only on surface days', () => {
  const r = P2.simulate(crew({ size: 4 }), { seed: CALM });
  const ashore = r.frames.filter(f => f.ashore > 0).map(f => f.t);
  assert.ok(ashore.length > 0);
  assert.ok(Math.min(...ashore) >= D.LIFE.transitDays && Math.max(...ashore) <= D.LIFE.transitDays + D.LIFE.surfaceDays);
  assert.equal(Math.max(...r.frames.map(f => f.ashore)), D.LIFE.landingCrewMax);
});

test('p2: too few days and no reserve runs out, says what and on which day', () => {
  const r = P2.simulate(crew({ days: 6, reserve: 0 }), { seed: CALM });
  checkResult(r, 2);
  assert.equal(r.ok, false); assert.equal(r.stars, 0);
  assert.match(r.failure.code, /^(o2|food|water)Out$/);
  assert.match(r.failure.cause, /ran out on the ship on day \d+ of 9/);
  assert.match(r.failure.fix, /Plan at least 9 days/);
  assert.ok(r.time.total < 9);
  close(last(r)[r.failure.code.replace('Out', '')], 0, 1e-6);
});

test('p2: reserve survives a storm delay, no reserve does not (seeded)', () => {
  const bad = P2.simulate(crew({ days: 9, reserve: 0 }), { seed: STORM });
  checkResult(bad, 2);
  assert.equal(bad.ok, false);
  assert.match(bad.failure.fix, /Plan at least 10 days/);
  const good = P2.simulate(crew({ days: 10, reserve: 0.2 }), { seed: STORM });
  checkResult(good, 2);
  assert.equal(good.ok, true);
  assert.equal(good.time.total, M.minDays() + 1);
  assert.ok(good.events.some(e => /solar storm/.test(e.text)));
});

test('p2: late storm with an empty larder has nothing to hide behind', () => {
  const r = P2.simulate(crew({ days: 9, reserve: 0 }), { seed: LATE_STORM });
  checkResult(r, 2);
  assert.equal(r.ok, false);
  assert.equal(r.failure.code, 'noShelter');
  assert.match(r.failure.cause, /hide behind/);
});

test('p2: an announced storm adds its day and is not rolled again', () => {
  const s = crew({ days: 10 });
  s.events.extraDays = 1; s.events.log = [{ id: 'solarStorm', choice: 'shelter' }];
  for (const seed of [1, 2, 3, 10]) {
    const r = P2.simulate(s, { seed });
    checkResult(r, 2);
    assert.equal(r.time.total, M.minDays() + 1, 'seed ' + seed);
  }
});

test('p2: too heavy still runs and fails on screen', () => {
  const r = P2.simulate(crew({ size: 4, days: 30, reserve: 0.2, suit: 'heavy' }, { rocket: 'sls1' }), { seed: CALM });
  checkResult(r, 2);
  assert.equal(r.ok, false);
  assert.equal(r.failure.code, 'tooHeavy');
  assert.match(r.failure.fix, /Swap the Heavy-duty suit for a lighter suit or pick SLS Block/);
});

test('p2: over budget runs and fails with the money cause', () => {
  const s = crew({ size: 4, recycler: true }, { difficulty: 'director' });
  assert.equal(M.evaluate(s).overBudget, true);
  const r = P2.simulate(s, { seed: CALM });
  checkResult(r, 2);
  assert.equal(r.ok, false);
  assert.equal(r.failure.code, 'overBudget');
  assert.match(r.failure.fix, /Drop the water recycler/);
});

test('p2: a huge reserve cannot buy 3 stars, zero margin is only 1 star', () => {
  const r = P2.simulate(crew({ days: 30, reserve: 0.2 }), { seed: CALM });
  checkResult(r, 2);
  assert.equal(r.ok, true);
  assert.ok(r.stars < 3);
  const none = P2.simulate(crew({ days: 9, reserve: 0 }), { seed: CALM });
  checkResult(none, 2);
  assert.equal(none.ok, true);
  assert.equal(none.stars, 1);
});

test('p2: recycler cuts the water that must be loaded', () => {
  const a = P2.simulate(crew({ size: 4, days: 12 }), { seed: CALM });
  const b = P2.simulate(crew({ size: 4, days: 12, recycler: true }), { seed: CALM });
  checkResult(b, 2);
  assert.ok(b.frames[0].water < a.frames[0].water / 2);
});

test('p2: robotic mission is a quick 3-star success', () => {
  const r = P2.simulate(robot());
  checkResult(r, 2);
  assert.equal(r.ok, true); assert.equal(r.stars, 3);
  assert.ok(r.frames.length >= 3 && r.frames.length <= 6);
  assert.match(r.events[0].text, /No crew, no groceries/);
});

test('p2: deterministic, deep equal', () => {
  for (const [c, seed] of [[{}, CALM], [{ days: 9, reserve: 0 }, STORM], [{ days: 6, reserve: 0 }, 7]]) {
    assert.deepEqual(P2.simulate(crew(c), { seed }), P2.simulate(crew(c), { seed }));
  }
  assert.deepEqual(P2.simulate(robot()), P2.simulate(robot()));
});

test('p2: not ready on an empty state or without crew or suit', () => {
  const r = P2.simulate(M.newState());
  checkResult(r, 2);
  assert.equal(r.ready, false);
  const r2 = P2.simulate(crew({ suit: null }));
  checkResult(r2, 2);
  assert.equal(r2.ready, false);
  assert.ok(r2.blockers.some(b => b.code === 'noSuit'));
  const r3 = P2.simulate(crew({}, { crew: null }));
  assert.equal(r3.ready, false);
  assert.ok(r3.blockers.some(b => b.code === 'noCrew'));
});

test('p2: no em dashes in the math block', () => {
  assert.ok(!/—/.test(JSON.stringify(P2.simulate(crew()).math)));
});

test('p2: whenever validatePhase(2) blocks, the run fails (sweep, seeds 1..30)', () => {
  let blocked = 0;
  for (const rocket of ['sls1', 'sls2'])
    for (const difficulty of ['explorer', 'engineer', 'director'])
      for (const size of [2, 4])
        for (const days of [8, 10])
          for (const reserve of [0, 0.2])
            for (const recycler of [false, true])
              for (const suit of ['light', 'heavy'])
                for (let seed = 1; seed <= 30; seed++) {
                  const s = crew({ size, days, reserve, recycler, suit }, { rocket, difficulty });
                  const r = P2.simulate(s, { seed });
                  if (r.ready === false) continue;
                  if (M.validatePhase(s, 2).issues.some(i => i.severity === 'block')) {
                    blocked++;
                    assert.equal(r.ok, false, `${rocket} ${difficulty} ${size} ${days} ${reserve} ${recycler} ${suit} ${seed}`);
                    assert.ok(r.frames.length > 1);
                  }
                }
  assert.ok(blocked > 0);
});

test('p2: 8 days with a 20% reserve fails with tooShort and a days fix', () => {
  const r = P2.simulate(crew({ days: 8 }), { seed: CALM });
  assert.equal(r.ok, false);
  assert.ok(r.failure.fix.includes(String(M.minDays())));
});

test('p2: recycler + 20% reserve + minDays+2 passes the shelter check (seeds 1..50)', () => {
  for (let seed = 1; seed <= 50; seed++) for (const size of [2, 4]) {
    const r = P2.simulate(crew({ size, days: M.minDays() + 2, reserve: 0.2, recycler: true }), { seed });
    assert.notEqual(r.failure && r.failure.code, 'noShelter', `seed ${seed} size ${size}`);
  }
});
