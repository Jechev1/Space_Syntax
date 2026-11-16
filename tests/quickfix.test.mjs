import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import { problemOf, quickFixes } from '../src/engine/quickFix.mjs'

const require = createRequire(import.meta.url)
const M = require('../js/model.js')
const D = require('../js/data.js')
const sample = (type) => JSON.parse(readFileSync(new URL(`../fixtures/f5b.${type}.json`, import.meta.url), 'utf8')).state

function applied(state, option) {
  const next = JSON.parse(JSON.stringify(state))
  option.apply(next)
  return next
}

test('a valid design has no problem and no options', () => {
  const q = quickFixes(M, D, sample('robotic'))
  assert.equal(q.problem.heavyKg, 0)
  assert.equal(q.problem.overM, 0)
  assert.deepEqual(q.options, [])
})

test('too heavy: a fix that says it solves it really fits the rocket and the budget', () => {
  const s = Object.assign(sample('robotic'), { rocket: 'small' })
  const q = quickFixes(M, D, s)
  assert.ok(q.problem.heavyKg > 0)
  assert.ok(q.options.length > 0 && q.options.length <= 5)
  assert.ok(q.options[0].solved, 'the first option solves it')
  for (const o of q.options) {
    const after = problemOf(M, applied(s, o))
    assert.equal(o.solved, after.heavyKg === 0 && after.overM === 0, o.label)
    assert.ok(after.heavyKg < q.problem.heavyKg || o.solved, o.label)
  }
})

test('over budget: options lower the cost and keep Phase 1 valid', () => {
  const s = Object.assign(sample('robotic'), { difficulty: 'director' })
  const q = quickFixes(M, D, s)
  assert.ok(q.problem.overM > 0)
  for (const o of q.options) {
    const next = applied(s, o)
    assert.ok(problemOf(M, next).overM < q.problem.overM || o.solved, o.label)
    const blocks = M.validatePhase(next, 1).issues.filter((i) => i.severity === 'block').map((i) => i.code)
    assert.ok(!blocks.some((c) => ['missingSubsystems', 'payloadMismatch', 'noPower', 'noRocket'].includes(c)), o.label)
  }
})

test('a crewed craft too heavy for SLS Block 1 is offered a bigger SLS', () => {
  const s = Object.assign(sample('crewed'), { rocket: 'sls1' })
  const q = quickFixes(M, D, s)
  assert.ok(q.problem.heavyKg > 0)
  assert.ok(q.options.some((o) => o.id.startsWith('rocket:') && o.solved))
})

test('a big overrun that no single change fixes gets one combined fix that does', () => {
  const s = sample('robotic')
  s.difficulty = 'engineer'
  for (const sub of D.SUBSYSTEMS) {
    const opts = M.optionsFor(sub.id, 'robotic')
    if (sub.multi) { s.design.science = M.unlockedInstruments(s).filter((id) => opts.some((o) => o.id === id)); continue }
    s.design[sub.id] = opts.map((o) => ({ id: o.id, cost: M.previewWith(s, sub.id, o.id).totalCost })).sort((a, b) => b.cost - a.cost)[0].id
  }
  s.rocket = D.ROCKETS.robotic.slice().sort((a, b) => b.cost - a.cost)[0].id
  const q = quickFixes(M, D, s)
  assert.ok(q.problem.overM > 0)
  const combo = q.options.find((o) => o.id === 'combo')
  assert.ok(combo && combo.solved && combo.steps >= 2)
  const after = problemOf(M, applied(s, combo))
  assert.equal(after.overM, 0)
  assert.equal(after.heavyKg, 0)
})

test('no fix trades one problem for the other', () => {
  const s = Object.assign(sample('crewed'), { difficulty: 'director' })
  for (const sub of D.SUBSYSTEMS) {
    const opts = M.optionsFor(sub.id, 'crewed')
    if (sub.multi) continue
    s.design[sub.id] = opts.map((o) => ({ id: o.id, cost: M.previewWith(s, sub.id, o.id).totalCost })).sort((a, b) => b.cost - a.cost)[0].id
  }
  const q = quickFixes(M, D, s)
  for (const o of q.options) {
    const after = problemOf(M, applied(s, o))
    assert.ok(after.heavyKg <= q.problem.heavyKg + 0.5, o.label)
    assert.ok(after.overM <= q.problem.overM + 0.05, o.label)
  }
})
