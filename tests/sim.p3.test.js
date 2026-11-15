'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const M = require(path.join(__dirname, '..', 'js', 'model.js'));
const D = require(path.join(__dirname, '..', 'js', 'data.js'));
const P = require(path.join(__dirname, '..', 'js', 'sim', 'p3.js'));
const { checkResult } = require('./sim-check.js');

function robot(over = {}) {
  const s = M.newState();
  Object.assign(s, { question: 'made', measure: 'chem', missionType: 'robotic', rocket: 'medium', site: 'tranquility' });
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
  Object.assign(s, { question: 'water', measure: 'sample', missionType: 'crewed', rocket: 'sls2', site: 'southPole' });
  s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'crewSolar', science: ['camera', 'spectrometer', 'neutron', 'sampler'] };
  s.crew = { size: 2, days: 10, reserve: 0.2, suit: 'lunar', recycler: false };
  s.flight = { margin: 0.05 };
  s.comms = { link: 'sband', dish: 'dsn34' };
  return Object.assign(s, over);
}
function crewLight(over = {}) { // valid for every difficulty at 10% margin
  const s = crew();
  s.design.science = ['camera', 'sampler'];
  s.crew = { size: 2, days: 10, reserve: 0, suit: 'light', recycler: false };
  return Object.assign(s, over);
}
const sim = (s, seed = 1) => P.simulate(s, { seed });

test('p3: not ready on an empty state, or without a rocket', () => {
  const r = sim(M.newState());
  checkResult(r, 3);
  assert.equal(r.ready, false);
  const noRocket = sim(crew({ rocket: null }));
  checkResult(noRocket, 3);
  assert.equal(noRocket.ready, false);
});

test('p3: success run follows the contract, both mission types', () => {
  const c = sim(crew({ flight: { margin: 0.05 } }));
  checkResult(c, 3);
  assert.equal(c.ok, true);
  assert.equal(c.time.unit, 'h');
  assert.equal(c.failure, null);
  assert.ok(c.frames.length >= 40 && c.frames.length <= 200);
  const r = sim(robot({ flight: { margin: 0.1 } }));
  checkResult(r, 3);
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.time.total - c.time.total) < 1e-6, 'both fly out and land');
});

test('p3: crewed and robotic trips end at touchdown, a sample robot flies the same legs', () => {
  const c = sim(crew({ flight: { margin: 0.05 } }));
  const out = D.LIFE.transitDays * 24;
  assert.ok(c.time.total > out && c.time.total < out + 10, String(c.time.total));
  const oneWay = sim(robot({ flight: { margin: 0.1 } }));
  const back = sim(robotSample({ flight: { margin: 0.1 } }));
  checkResult(back, 3);
  assert.ok(Math.abs(back.time.total - oneWay.time.total) < 1e-6);
  assert.ok(c.events.some(e => /Phase 7/.test(e.text) && /touchdown/.test(e.text)));
});

test('p3: path runs Earth to the Moon and ends there, reserve never rises', () => {
  const r = sim(crew({ flight: { margin: 0.05 } }));
  const f = r.frames;
  assert.equal(f[0].x, 0);
  assert.ok(f.at(-1).x > D.MOON.distanceKm * 0.99);
  for (let i = 1; i < f.length; i++) assert.ok(f[i].reserve <= f[i - 1].reserve + 1e-6);
  assert.ok(f.every(p => p.progress >= 0 && p.progress <= 1));
});

test('p3: determinism, same seed identical, different seeds differ', () => {
  const s = crewLight({ flight: { margin: 0.1 }, difficulty: 'director' });
  assert.deepEqual(sim(s, 7), sim(s, 7));
  assert.notDeepEqual(sim(s, 7).frames.at(-1), sim(s, 8).frames.at(-1));
});

test('p3: known numbers, planned dv and the math block match model.js', () => {
  const s = crewLight({ flight: { margin: 0.1 } });
  const plan = M.flightPlan(s);
  assert.equal(plan.dvRequired, 950 + 2074 + 1833 + 1450);
  assert.equal(M.validatePhase(s, 3).ok, true);
  const r = sim(s);
  assert.ok(Math.abs(r.frames[0].reserve - plan.dvRequired * 1.1) < 0.01);
  assert.ok(r.math && r.math.steps.length >= 3 && r.math.src === 'cev');
  assert.ok(r.math.steps[1].num.includes('6,938'));
  assert.ok(r.events.some(e => /Phase 5/.test(e.text) && /Phase 7/.test(e.text)));
});

test('p3: below the flight rule the run fails with the engine cause and a fix', () => {
  const s = crew({ difficulty: 'director', flight: { margin: 0 } });
  assert.equal(M.validatePhase(s, 3).issues.some(i => i.code === 'lowDvMargin'), true);
  for (let seed = 1; seed <= 10; seed++) {
    const r = sim(s, seed);
    checkResult(r, 3);
    assert.equal(r.ok, false);
    assert.equal(r.failure.code, 'lowDvMargin');
    assert.match(r.failure.fix, /^Raise your margin to 10%\.$/);
    assert.ok(r.frames.length > 10, 'still animates');
  }
});

test('p3: too heavy fails the run with the engine cause', () => {
  const heavy = crew({ difficulty: 'engineer', flight: { margin: 0.2 } });
  const v = M.validatePhase(heavy, 3).issues.find(i => i.code === 'tooHeavy');
  assert.ok(v, 'fixture is too heavy at 20%');
  const r = sim(heavy);
  checkResult(r, 3);
  assert.equal(r.ok, false);
  assert.equal(r.failure.code, 'tooHeavy');
  assert.ok(r.failure.cause.includes(v.message));
});

test('p3: at each difficulty minimum margin, at least 95% of seeds 1..200 pass, robotic and crewed', () => {
  for (const d of ['cadet', 'engineer', 'director']) {
    const margin = M.minMargin({ difficulty: d });
    for (const [name, make] of [['robotic', robot], ['crewed', crewLight]]) {
      const s = make({ difficulty: d, flight: { margin } });
      assert.equal(M.validatePhase(s, 3).ok, true, `${d} ${name} fixture valid`);
      let ok = 0;
      for (let seed = 1; seed <= 200; seed++) if (sim(s, seed).ok) ok++;
      assert.ok(ok >= 190, `${d} ${name} ${ok}/200`);
    }
  }
});

test('p3: whenever the engine blocks Phase 3 the run fails (sweep)', () => {
  let blocked = 0;
  for (const d of ['cadet', 'engineer', 'director']) for (const margin of D.FLIGHT.marginOptions) for (const make of [robot, robotSample, crew, crewLight]) for (let seed = 1; seed <= 30; seed++) {
    const s = make({ difficulty: d, flight: { margin } });
    const r = sim(s, seed);
    checkResult(r, 3);
    if (r.ready === false) continue;
    if (!M.validatePhase(s, 3).ok) { blocked++; assert.equal(r.ok, false, `${d} ${margin} ${make.name} ${seed}`); }
  }
  assert.ok(blocked > 0);
});

test('p3: a careful margin scores better than a bloated one', () => {
  const careful = sim(robot({ flight: { margin: 0.05 } }));
  const bloated = sim(robot({ flight: { margin: 0.2 } }));
  assert.ok(careful.ok && bloated.ok);
  assert.ok(careful.score.value > bloated.score.value);
  assert.ok(careful.stars >= bloated.stars);
});

test('summary.marginLeft matches the margin event text', () => {
  const M = require('../js/model.js'), SIM = require('../js/sim.js');
  const f = require('../fixtures/f5a.robotic.json');
  const r = SIM.simulate(f.state, 3, { seed: 7 });
  assert.ok(r.ready && r.summary);
  for (const k of ['pool', 'dvUsed', 'tcmUsed', 'marginLeft', 'marginLeftFrac']) assert.ok(Number.isFinite(r.summary[k]), k);
  const ev = r.events.find(e => /of margin left/.test(e.text));
  assert.ok(ev, 'margin event');
  assert.ok(ev.text.includes(M.fmt(r.summary.marginLeft)), ev.text);
});
