'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const M = require(path.join(__dirname, '..', 'js', 'model.js'));
const P = require(path.join(__dirname, '..', 'js', 'sim', 'p4.js'));
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
  s.flight = { margin: 0.05 };
  s.comms = { link: 'sband', dish: 'dsn34' };
  return Object.assign(s, over);
}
const sim = (s, seed = 1) => P.simulate(s, { seed });
const laser = (o = {}) => robot({ comms: { link: 'laser', dish: 'dsn34' }, ...o });
const withScience = (list, o = {}) => { const s = robot(o); s.design.science = list; return s; };

test('p4: not ready on empty state, without a link, without a crew plan', () => {
  const r = sim(M.newState());
  checkResult(r, 4);
  assert.equal(r.ready, false);
  const noLink = sim(robot({ comms: null }));
  checkResult(noLink, 4);
  assert.ok(noLink.blockers.some(b => b.code === 'noLink'));
  assert.equal(sim(crew({ crew: null })).ready, false);
});

test('p4: contract on success, partial and failure; robotic and crewed', () => {
  const good = sim(withScience(['spectrometer']));
  checkResult(good, 4);
  assert.equal(good.ok, true);
  assert.equal(good.outcome, 'success');
  assert.ok(good.stars >= 1);
  const bad = sim(robot());
  checkResult(bad, 4);
  assert.equal(bad.ok, false);
  assert.equal(bad.stars, 0);
  const c = sim(crew({ comms: { link: 'ka', dish: 'dsn34' } }));
  checkResult(c, 4);
  assert.equal(c.ok, true);
  assert.equal(c.time.total, 240);
  assert.ok(c.frames.length >= 40 && c.frames.length <= 200);
  const partial = sim(laser(), 2);
  checkResult(partial, 4);
  assert.equal(partial.ok, true);
  assert.equal(partial.outcome, 'partial');
});

test('p4: determinism', () => {
  assert.deepEqual(sim(laser(), 5), sim(laser(), 5));
  assert.deepEqual(sim(crew(), 3), sim(crew(), 3));
});

test('p4: failure names the cause and a concrete fix', () => {
  const r = sim(robot());
  assert.equal(r.failure.code, 'dataLost');
  assert.match(r.failure.cause, /Only \d+% of your data reached Earth/);
  assert.match(r.failure.fix, /Ka-band/);
  assert.ok(r.events.some(e => e.kind === 'fail' && /Storage full/.test(e.text)));
});

test('p4: known numbers, light delay and S-band volume', () => {
  const plan = M.commsPlan(robot());
  assert.ok(Math.abs(plan.delay.avg - 384400 / 299792.458) < 1e-9);
  assert.equal(plan.delay.avg.toFixed(2), '1.28');
  assert.ok(Math.abs(plan.gbPerDay - 57.6) < 1e-9);
  const r = sim(robot());
  assert.ok(r.events.some(e => /1\.28 s/.test(e.text)));
  assert.ok(r.math.steps.some(s => /57\.6/.test(s.num)));
  assert.equal(r.math.src, 'dsn');
});

test('p4: data is conserved and the link never beats its daily limit', () => {
  const r = sim(robot());
  const last = r.frames.at(-1);
  assert.ok(Math.abs(last.generated - last.delivered - last.lost - last.buffer) < 0.05);
  assert.ok(last.delivered <= 57.6 * (r.time.total / 24) + 1e-6);
  for (let i = 1; i < r.frames.length; i++) {
    assert.ok(r.frames[i].delivered >= r.frames[i - 1].delivered);
    assert.ok(r.frames[i].buffer <= 150 + 1e-6);
  }
});

test('p4: three stations take turns and the link only runs with a station', () => {
  const r = sim(crew());
  assert.equal(new Set(r.frames.filter(f => f.station >= 0).map(f => f.station)).size, 3);
  assert.ok(r.frames.every(f => f.linkUp === 0 || f.station >= 0));
  assert.ok(r.frames.some(f => f.linkUp === 0));
});

test('p4: 41 minute blackout at lunar orbit insertion', () => {
  const r = sim(crew({ comms: { link: 'ka', dish: 'dsn34' } }));
  const ev = r.events.find(e => /Behind the Moon/.test(e.text));
  assert.ok(ev && /41 minutes/.test(ev.text));
  assert.ok(Math.abs(ev.t - 72) < 0.1);
});

test('p4: laser clouds block passes for some seeds, never for radio', () => {
  let cloudy = 0;
  for (let seed = 0; seed < 20; seed++) {
    const r = sim(laser(), seed);
    checkResult(r, 4);
    if (r.events.some(e => /Clouds over/.test(e.text))) cloudy++;
  }
  assert.ok(cloudy > 0);
  const radio = sim(robot({ comms: { link: 'ka', dish: 'dsn34' } }), 1);
  assert.ok(!radio.events.some(e => /Clouds/.test(e.text)));
});

test('p4: a faster link delivers more', () => {
  const sband = sim(withScience(['camera']));
  const ka = sim(withScience(['camera'], { comms: { link: 'ka', dish: 'dsn34' } }));
  assert.ok(ka.score.value > sband.score.value);
  assert.ok(ka.ok);
});

test('p4: no science data means a clean success', () => {
  const r = sim(withScience(['sampler']));
  checkResult(r, 4);
  assert.equal(r.ok, true);
});

test('p4: laser talks to the optical ground station, not DSN sites, and keeps its own rate', () => {
  for (const dish of ['dsn34', 'dsn70']) {
    const s = laser({ comms: { link: 'laser', dish } });
    const plan = M.commsPlan(s);
    assert.ok(plan.rateMbps <= 260 + 1e-9, 'laser rate ' + plan.rateMbps);
    let cloudy = false;
    for (let seed = 0; seed < 20; seed++) {
      const r = sim(s, seed);
      checkResult(r, 4);
      const text = r.events.map(e => e.text).join('\n');
      assert.ok(!/Goldstone|Madrid|Canberra|Deep Space Network/.test(text), 'no DSN names for the laser');
      assert.ok(r.events.some(e => /optical ground station/.test(e.text)));
      assert.ok(r.events.filter(e => /^Link up/.test(e.text)).every(e => e.text.includes(`${Math.round(plan.rateMbps).toLocaleString('en-US')} Mbps`)));
      if (r.events.some(e => /Clouds over the optical ground station/.test(e.text))) cloudy = true;
    }
    assert.ok(cloudy);
  }
  const radio = sim(robot({ comms: { link: 'ka', dish: 'dsn34' } }), 1);
  assert.ok(radio.events.some(e => /Deep Space Network/.test(e.text)));
});

test('p4: whenever the engine blocks Phase 4 the run fails (sweep)', () => {
  let blocked = 0;
  for (const d of ['cadet', 'engineer', 'director']) for (const margin of [0, 0.05, 0.1, 0.2]) for (const make of [robot, crew]) for (const link of ['sband', 'ka', 'laser']) for (const dish of ['dsn34', 'dsn70']) for (let seed = 1; seed <= 30; seed++) {
    const s = make({ difficulty: d, comms: { link, dish } });
    s.flight = { margin };
    const r = sim(s, seed);
    checkResult(r, 4);
    if (r.ready === false) continue;
    if (!M.validatePhase(s, 4).ok) { blocked++; assert.equal(r.ok, false, `${d} ${margin} ${make.name} ${link} ${dish} ${seed}`); }
  }
  assert.ok(blocked > 0, 'sweep reached a blocked case');
});
