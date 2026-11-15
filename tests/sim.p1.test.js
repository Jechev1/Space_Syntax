'use strict';
/* Phase 1 "Launch" simulator. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const M = require(path.join(__dirname, '..', 'js', 'model.js'));
const D = require(path.join(__dirname, '..', 'js', 'data.js'));
const P1 = require(path.join(__dirname, '..', 'js', 'sim', 'p1.js'));
const { checkResult } = require('./sim-check.js');

function robot(over = {}) {
  const s = M.newState();
  Object.assign(s, { question: 'made', measure: 'chem', missionType: 'robotic', rocket: 'medium', site: 'tranquility' });
  s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'solarBig', science: ['camera', 'spectrometer'] };
  s.comms = { link: 'sband', dish: 'dsn34' };
  return Object.assign(s, over);
}
function crew(over = {}) {
  const s = M.newState();
  Object.assign(s, { question: 'water', measure: 'sample', missionType: 'crewed', rocket: 'sls2', site: 'southPole' });
  s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'crewSolar', science: ['camera', 'spectrometer', 'neutron', 'sampler'] };
  s.crew = { size: 2, days: 10, reserve: 0.2, suit: 'lunar', recycler: false };
  s.comms = { link: 'sband', dish: 'dsn34' };
  return Object.assign(s, over);
}
const last = (r) => r.frames[r.frames.length - 1];
const close = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `expected ${b} +- ${tol}, got ${a}`);

test('p1: a light robot reaches the Moon, 3 stars', () => {
  const r = P1.simulate(robot());
  checkResult(r, 1);
  assert.equal(r.ok, true); assert.equal(r.stars, 3); assert.equal(r.failure, null);
  assert.ok(r.frames.length >= 40 && r.frames.length <= 200);
  close(last(r).dv, D.DV.tli.value, 0.01);
  assert.ok(last(r).prop > 0, 'engine cut with fuel left');
  assert.equal(r.time.unit, 's');
});

test('p1: crewed run works, a thin margin earns fewer stars', () => {
  const r = P1.simulate(crew());
  checkResult(r, 1);
  assert.equal(r.ok, true);
  assert.ok(r.score.value > 0 && r.score.value < 0.2, 'SLS Block 2 margin is small');
  assert.equal(r.stars, 2);
});

test('p1: too heavy fails short of 3,150 m/s with cause and fix', () => {
  const r = P1.simulate(robot({ rocket: 'small' }));
  checkResult(r, 1);
  assert.equal(r.ok, false); assert.equal(r.stars, 0);
  assert.equal(r.failure.code, 'tooHeavy');
  assert.match(r.failure.cause, /ran out of fuel at [\d,]+ m\/s, [\d,]+ m\/s short of the Moon/);
  assert.match(r.failure.fix, /Pick Medium launcher/);
  assert.ok(last(r).dv < D.DV.tli.value);
  close(last(r).prop, 0, 1e-6);
  const r2 = P1.simulate(crew({ rocket: 'sls1' }));
  checkResult(r2, 1);
  assert.match(r2.failure.fix, /Pick SLS Block 2/);
});

test('p1: real rocket equation, a payload equal to capacity gets exactly 3,150 m/s', () => {
  const s = robot();
  const e = M.evaluate(s);
  const rk = D.ROCKETS.robotic.find(x => x.id === 'medium');
  const old = rk.capacity;
  try {
    rk.capacity = e.tli; // payload == capacity
    const r = P1.simulate(s);
    checkResult(r, 1);
    assert.equal(r.ok, true);
    close(last(r).dv, 3150, 0.01);
    close(last(r).prop, 0, 0.05); // stage empties exactly at the target
    assert.equal(r.stars, 1);
    close(r.score.value, 0, 1e-6);
  } finally { rk.capacity = old; }
  const r = P1.simulate(s);
  const ve = P1.TUNING.upperStageIsp * D.ENGINE.g0;
  const f = r.frames[10];
  close(f.dv, ve * Math.log(r.frames[0].mass / f.mass), 0.05);
  assert.ok(r.math && r.math.steps.length >= 3 && r.math.src === 'cev');
});

test('p1: over budget runs and fails with the money cause', () => {
  const r = P1.simulate(robot({ rocket: 'heavy' }));
  checkResult(r, 1);
  assert.equal(r.ok, false);
  assert.equal(r.failure.code, 'overBudget');
  assert.match(r.failure.cause, /\$535M/);
  assert.match(r.failure.fix, /save \$35M/);
});

test('p1: deterministic', () => {
  for (const s of [robot(), robot({ rocket: 'small' }), crew()]) {
    assert.deepEqual(P1.simulate(s, { seed: 5 }), P1.simulate(s, { seed: 5 }));
  }
});

test('p1: reads mass growth from events, does not re-roll it', () => {
  const s = robot(); s.events.massGrowth = 0.05;
  const r = P1.simulate(s);
  checkResult(r, 1);
  assert.ok(r.events.some(e => /Mass growth/.test(e.text)));
  assert.ok(M.evaluate(s).tli > M.evaluate(robot()).tli);
});

test('p1: not ready without a mission, a rocket or enough design', () => {
  const r = P1.simulate(M.newState());
  checkResult(r, 1);
  assert.equal(r.ready, false);
  const r2 = P1.simulate(robot({ rocket: null }));
  checkResult(r2, 1);
  assert.equal(r2.ready, false);
  assert.ok(r2.blockers.some(b => b.code === 'noRocket'));
  const r3 = P1.simulate(robot({ design: { science: [] } }));
  assert.equal(r3.ready, false);
});

test('p1: no em dashes in the math block', () => {
  const r = P1.simulate(robot());
  assert.ok(!/—/.test(JSON.stringify(r.math)));
});

test('p1: upper stage uses the hydrogen Isp and the math block says so', () => {
  assert.equal(P1.TUNING.upperStageIsp, 462);
  const r = P1.simulate(crew());
  assert.ok(/462/.test(r.math.steps[0].num));
});

test('p1: whenever validatePhase(1) blocks, the run fails (sweep, seeds 1..30)', () => {
  let blocked = 0, n = 0;
  for (const rocket of ['sls1', 'sls2', 'medium', 'heavy'])
    for (const difficulty of ['explorer', 'engineer', 'director'])
      for (const size of [2, 4])
        for (const suit of ['light', 'heavy'])
          for (const seed of [1, 15, 30]) {
            const missionType = rocket === 'medium' || rocket === 'heavy' ? 'robotic' : 'crewed';
            const s = missionType === 'crewed' ? crew() : robot();
            Object.assign(s, { rocket, difficulty });
            if (!D.ROCKETS[missionType].some(x => x.id === rocket)) continue;
            if (missionType === 'crewed') Object.assign(s.crew, { size, suit, days: 6 + seed % 10, recycler: seed % 2 === 0 });
            n++;
            const r = P1.simulate(s, { seed });
            if (r.ready === false) continue;
            if (M.validatePhase(s, 1).issues.some(i => i.severity === 'block')) { blocked++; assert.equal(r.ok, false, `${rocket} ${difficulty} ${seed}`); }
          }
  assert.ok(n > 20);
});
