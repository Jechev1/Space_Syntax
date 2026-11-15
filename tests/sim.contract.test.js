'use strict';
/* Contract every phase simulator must meet (see js/sim/kit.js). */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const SIM = require(path.join(__dirname, '..', 'js', 'sim.js'));
const K = require(path.join(__dirname, '..', 'js', 'sim', 'kit.js'));

const { checkResult } = require('./sim-check.js');

test('kit: stars', () => {
  assert.equal(K.starsFor(false, 99, [1, 2, 3]), 0);
  assert.equal(K.starsFor(true, 1, [1, 2, 3]), 1);
  assert.equal(K.starsFor(true, 3, [1, 2, 3]), 3);
  assert.equal(K.starsFor(true, 5, [10, 5, 1], false), 2);
});

test('kit: thin keeps first and last', () => {
  const fr = Array.from({ length: 1000 }, (_, i) => ({ t: i }));
  const out = K.thin(fr);
  assert.equal(out.length, K.MAX_FRAMES);
  assert.equal(out[0].t, 0);
  assert.equal(out.at(-1).t, 999);
});

test('phase 0: blocked without a goal, ready with one', () => {
  const M = require(path.join(__dirname, '..', 'js', 'model.js'));
  const s = M.newState();
  checkResult(SIM.simulate(s, 0), 0);
  assert.equal(SIM.simulate(s, 0).ready, false);
  Object.assign(s, { question: 'made', measure: 'chem', missionType: 'robotic' });
  const r = SIM.simulate(s, 0);
  checkResult(r, 0);
});
