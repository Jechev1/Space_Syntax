'use strict';
/* Phase 5 simulator: powered descent. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const M = require(path.join(__dirname, '..', 'js', 'model.js'));
const D = require(path.join(__dirname, '..', 'js', 'data.js'));
const P = require(path.join(__dirname, '..', 'js', 'sim', 'p5.js'));
const { checkResult } = require('./sim-check.js');

function build(site, margin) {
  const s = M.newState();
  Object.assign(s, { question: 'made', measure: 'chem', missionType: 'robotic', rocket: 'medium', site, landing: { seed: 1 } });
  s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'solarBig', science: ['camera', 'spectrometer'] };
  s.flight = { margin };
  return s;
}
const SITES = D.SITES.map(x => x.id), MARGINS = [0, 0.1, 0.2];

/** Find a seed that gives the wanted verdict. */
function find(site, margin, outcome) {
  for (let seed = 1; seed < 500; seed++) if (M.landingSim(build(site, margin), seed).outcome === outcome) return { s: build(site, margin), seed };
  throw new Error('no seed for ' + outcome);
}

test('clean, rough and abort runs satisfy the contract', () => {
  const clean = find('tranquility', 0.1, 'clean'), rough = find('tranquility', 0, 'rough'), abort = find('descartes', 0, 'abort');
  const c = P.simulate(clean.s, { seed: clean.seed }), r = P.simulate(rough.s, { seed: rough.seed }), a = P.simulate(abort.s, { seed: abort.seed });
  for (const x of [c, r, a]) checkResult(x, 5);
  assert.equal(c.outcome, 'success'); assert.ok(c.ok);
  assert.equal(r.outcome, 'partial'); assert.ok(r.ok); assert.ok(r.stars <= 1);
  assert.equal(a.outcome, 'fail'); assert.ok(!a.ok); assert.equal(a.stars, 0);
  assert.match(a.failure.fix, /Phase 3/);
  assert.ok(c.events.some(e => /Contact light!/.test(e.text)));
  assert.ok(c.math.steps.length >= 4);
});

test('abort frames show the lander climbing back', () => {
  const { s, seed } = find('descartes', 0, 'abort');
  const f = P.simulate(s, { seed }).frames;
  assert.ok(f[f.length - 1].vz > 0 && f[f.length - 1].alt > 100);
});

test('deterministic for the same seed', () => {
  const s = build('descartes', 0.05);
  assert.deepEqual(P.simulate(s, { seed: 7 }), P.simulate(s, { seed: 7 }));
});

test('same verdict as M.landingSim across seeds, sites and margins', () => {
  const want = { clean: 'success', rough: 'partial', abort: 'fail' }, seen = new Set();
  for (const site of SITES) for (const mg of MARGINS) for (let seed = 1; seed <= 50; seed++) {
    const s = build(site, mg), expected = M.landingSim(s, seed).outcome, r = P.simulate(s, { seed });
    assert.equal(r.outcome, want[expected], `${site} ${mg} ${seed}`);
    checkResult(r, 5); seen.add(expected);
  }
  assert.equal(seen.size, 3, 'all three outcomes are covered');
});

test('clean runs touch down at or under 2.1 m/s with fuel left; rough runs are harder', () => {
  for (const site of SITES) for (const mg of [0.1, 0.2]) for (let seed = 1; seed <= 50; seed++) {
    const s = build(site, mg);
    const r = P.simulate(s, { seed }), last = r.frames[r.frames.length - 1];
    if (r.outcome === 'success') { assert.ok(Math.abs(last.vz) <= 2.1, `${site} ${mg} ${seed}`); assert.ok(last.fuel > 0); assert.equal(last.alt, 0); }
  }
  const { s, seed } = find('tranquility', 0, 'rough');
  const rr = P.simulate(s, { seed });
  assert.ok(rr.landing.touchSpeed > P.TUNING.touchLimit);
  assert.ok(rr.events.some(e => /over the safe limit.*damaged/.test(e.text)));
  assert.equal(rr.math.src, 'nssdc');
  assert.equal(rr.math.steps.find(x => /safe landing/.test(x.eq)).src, 'altair');
});

test('more margin leaves more fuel at touchdown', () => {
  const lo = P.simulate(build('descartes', 0.1), { seed: 3 }), hi = P.simulate(build('descartes', 0.2), { seed: 3 });
  assert.ok(hi.score.value > lo.score.value);
});

test('physics: with zero thrust one step changes vertical speed by g * dt', () => {
  const n = P.step({ alt: 100, vz: 0, x: 0, vx: 0 }, 0, 0.1);
  assert.ok(Math.abs(n.vz - (-D.MOON.gravity * 0.1)) < 1e-12);
  const h = P.step({ alt: 100, vz: -5, x: 0, vx: 0 }, D.MOON.gravity, 0.1);
  assert.equal(h.vz, -5); // hover thrust cancels gravity
});

test('not ready without a landing site', () => {
  const r = P.simulate(M.newState(), {});
  checkResult(r, 5);
  assert.equal(r.ready, false);
});

/* ---- balance: pass rates over seeds 1..200 at each difficulty's minimum margin ---- */
function rate(site, diff, margin, outcome) {
  let n = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const s = build(site, margin); s.difficulty = diff;
    if (M.landingSim(s, seed).outcome === outcome) n++;
  }
  return n / 200;
}
test('balance: clean-landing rate bands', () => {
  for (const diff of ['engineer', 'director']) {
    const min = D.FLIGHT.minMargin[diff];
    assert.ok(rate('tranquility', diff, min, 'clean') >= 0.95, 'tranquility at min margin ' + diff);
  }
  const dEng = rate('descartes', 'engineer', 0.05, 'clean');
  assert.ok(dEng >= 0.1 && dEng <= 0.6, 'descartes at 5%: ' + dEng);
  assert.ok(rate('descartes', 'engineer', 0.1, 'clean') >= 0.95);
  assert.ok(rate('southPole', 'engineer', 0.05, 'clean') <= 0.1);
  assert.ok(rate('southPole', 'engineer', 0.1, 'clean') <= 0.7);
  assert.ok(rate('southPole', 'engineer', 0.15, 'clean') >= 0.95);
  const pd = rate('southPole', 'director', 0.15, 'clean');
  assert.ok(pd >= 0.5 && pd < 0.95, 'pole director 15%: ' + pd);
  assert.ok(rate('southPole', 'director', 0.2, 'clean') >= 0.95);
});

test('whenever Phase 5 validation blocks, the run is not ok', () => {
  let blocked = 0;
  for (const site of SITES) for (const diff of ['cadet', 'engineer', 'director']) for (const mg of D.FLIGHT.marginOptions) for (let seed = 1; seed <= 30; seed++) {
    const s = build(site, mg); s.difficulty = diff;
    const r = P.simulate(s, { seed });
    if (r.ready === false) continue;
    s.landing = { seed, outcome: M.landingSim(s, seed).outcome }; // what the app stores after the run
    const v = M.validatePhase(s, 5);
    if (v.issues.some(i => i.severity === 'block')) { blocked++; assert.equal(r.ok, false, `${site} ${diff} ${mg} ${seed}`); }
  }
  assert.ok(blocked > 0);
});

test('interactive run pauses at the rocks and offers a choice', () => {
  const { s, seed } = find('descartes', 0.1, 'clean');
  const p = P.simulate(s, { seed, interactive: true });
  checkResult(p, 5);
  assert.equal(p.outcome, 'pending'); assert.equal(p.ok, false); assert.equal(p.stars, 0); assert.equal(p.failure, null);
  assert.equal(p.decision.code, 'rocksAhead');
  const need = M.landingSim(s, seed).hoverNeeded;
  assert.ok(Math.abs(p.decision.options[0].dvCost - need * 1.62) <= 1);
  assert.deepEqual(p.decision.options.map(o => o.id), ['detour', 'abort']);
  assert.equal(p.decision.options[1].dvCost, 0);
  assert.equal(p.decision.marginLeft, Math.round(M.hoverAvailable(s) * D.MOON.gravity));
  const full = P.simulate(s, { seed, choice: 'detour' });
  assert.deepEqual(full, P.simulate(s, { seed }));
  assert.equal(full.decision, undefined);
  // the full run is thinned to 200 frames, so compare every full frame inside the paused window
  const upto = full.frames.filter(f => f.t <= p.decision.t);
  assert.ok(upto.length > 10);
  for (const f of upto) { const q = p.frames.find(x => x.t === f.t); assert.ok(q, 't ' + f.t); assert.equal(q.alt, f.alt); }
  assert.ok(p.frames.length < full.frames.length);
});

test('choosing abort ends the run with playerAbort', () => {
  const { s, seed } = find('tranquility', 0.1, 'clean');
  const a = P.simulate(s, { seed, choice: 'abort' });
  checkResult(a, 5);
  assert.equal(a.outcome, 'fail'); assert.equal(a.failure.code, 'playerAbort');
  assert.match(a.failure.fix, /Phase 3/);
  assert.ok(a.frames[a.frames.length - 1].vz > 0);
});
