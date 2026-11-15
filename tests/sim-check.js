'use strict';
/* SimResult contract check shared by the simulator tests (see js/sim/kit.js). */
const assert = require('node:assert/strict');
const path = require('node:path');
const K = require(path.join(__dirname, '..', 'js', 'sim', 'kit.js'));

const EM_DASH = /—/;

/** Throws if r does not match the SimResult contract. */
function checkResult(r, phase) {
  assert.equal(r.phase, phase);
  assert.equal(typeof r.title, 'string');
  if (r.ready === false) { assert.ok(Array.isArray(r.blockers) && r.blockers.length > 0, 'not ready needs blockers'); return; }
  assert.equal(r.ready, true);
  assert.equal(typeof r.ok, 'boolean');
  assert.ok(['success', 'partial', 'fail', 'pending'].includes(r.outcome));
  assert.equal(r.outcome === 'pending', !!r.decision, "'pending' needs a decision, and only then");
  if (r.decision) assert.ok(Array.isArray(r.decision.options) && r.decision.options.length >= 2 && typeof r.decision.prompt === 'string');
  assert.ok(Number.isInteger(r.stars) && r.stars >= 0 && r.stars <= 3);
  if (!r.ok) assert.equal(r.stars, 0);
  assert.ok(['s', 'min', 'h', 'day'].includes(r.time.unit));
  assert.ok(Number.isFinite(r.time.total) && r.time.total >= 0);
  assert.ok(Array.isArray(r.frames) && r.frames.length >= 1 && r.frames.length <= K.MAX_FRAMES);
  assert.equal(r.frames[0].t, 0);
  for (let i = 1; i < r.frames.length; i++) assert.ok(r.frames[i].t >= r.frames[i - 1].t, 'frames ordered by t');
  for (const f of r.frames) for (const fl of r.fields) assert.ok(Number.isFinite(f[fl.key]), `frame field ${fl.key} must be a finite number`);
  for (const e of r.events) {
    assert.ok(['info', 'warn', 'fail', 'success'].includes(e.kind));
    assert.ok(e.t >= 0 && e.t <= r.time.total + 1e-9, 'event inside the run');
    assert.ok(!EM_DASH.test(e.text), 'no em dashes in game copy');
  }
  if (r.summary !== undefined) {
    assert.ok(r.summary && typeof r.summary === 'object' && !Array.isArray(r.summary), 'summary is an object');
    for (const k in r.summary) assert.ok(Number.isFinite(r.summary[k]), `summary.${k} must be a finite number`);
  }
  if (r.ok || r.outcome === 'pending') assert.equal(r.failure, null);
  else {
    assert.ok(r.failure && typeof r.failure.cause === 'string' && typeof r.failure.fix === 'string', 'a failed run explains why and how to fix it');
    assert.ok(!EM_DASH.test(r.failure.cause + r.failure.fix));
  }
}

module.exports = { checkResult };
