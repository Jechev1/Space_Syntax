import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { TUTORIAL_STEPS, TUTORIAL_FLAG, TUTORIAL_SAVE } from '../src/data/tutorialSteps.mjs'

const KINDS = new Set(['click', 'wait', 'next', 'free'])
const ROUTES = new Set(['/f1a', '/f1b', '/f1done', '/f2', '/f3a'])

/* Every data-tutorial="id" declared in the React screens. */
function declaredTargets(dir, found = new Set()) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name)
    if (name.isDirectory()) {
      declaredTargets(path, found)
    } else if (name.name.endsWith('.jsx')) {
      const text = readFileSync(path, 'utf8')
      for (const match of text.matchAll(/data-tutorial="([^"]+)"/g)) found.add(match[1])
    }
  }
  return found
}

const targets = declaredTargets(fileURLToPath(new URL('../src', import.meta.url)))

test('tutorial keeps its own save slot and flag, away from ss-save-v1', () => {
  assert.notEqual(TUTORIAL_SAVE, 'ss-save-v1')
  assert.notEqual(TUTORIAL_FLAG, TUTORIAL_SAVE)
})

test('every step has an id, a known route and two-line text with no links or emoji', () => {
  assert.ok(TUTORIAL_STEPS.length >= 10, 'the tutorial should cover all three phases')
  const ids = new Set()
  for (const step of TUTORIAL_STEPS) {
    assert.ok(step.id && typeof step.id === 'string', 'step needs an id')
    assert.ok(!ids.has(step.id), `duplicate step id ${step.id}`)
    ids.add(step.id)
    assert.ok(ROUTES.has(step.route), `${step.id}: unknown route ${step.route}`)
    assert.ok(KINDS.has(step.kind), `${step.id}: unknown kind ${step.kind}`)
    assert.ok(step.text && step.text.length <= 140, `${step.id}: text missing or too long`)
    assert.ok(!step.text.includes('\n'), `${step.id}: text must stay on two rendered lines`)
    assert.doesNotMatch(step.text, /https?:\/\/|www\./, `${step.id}: no links in coach marks`)
    assert.doesNotMatch(step.text, /[🌀-🫿☀-➿⬀-⯿️←-⇿]/u, `${step.id}: no emoji or pictographs`)
  }
})

test('interactive steps advance on a real target; every target exists in the screens', () => {
  for (const step of TUTORIAL_STEPS) {
    if (step.kind === 'click' || step.kind === 'wait' || step.kind === 'free') {
      assert.ok(step.target, `${step.id}: ${step.kind} step needs a target`)
    }
    if (step.target) {
      assert.ok(targets.has(step.target), `${step.id}: no element declares data-tutorial="${step.target}"`)
    } else {
      assert.equal(step.kind, 'next', `${step.id}: only Next steps may go targetless`)
    }
    if (step.kind === 'wait' || step.kind === 'free') {
      assert.equal(typeof step.done, 'function', `${step.id}: ${step.kind} step needs a done check`)
    }
  }
})

test('the walkthrough visits Phase 1, 2 and 3 in order and teaches a test in each', () => {
  const routes = TUTORIAL_STEPS.map((s) => s.route)
  const first = (r) => routes.indexOf(r)
  assert.ok(first('/f1a') === 0, 'the tutorial starts on the spacecraft screen')
  assert.ok(first('/f1b') > first('/f1a'))
  assert.ok(first('/f2') > first('/f1done') && first('/f1done') > first('/f1b'))
  assert.ok(first('/f3a') > first('/f2'))
  for (const id of ['f1b-test', 'f2-test', 'f3-fly']) {
    const step = TUTORIAL_STEPS.find((s) => s.id === id)
    assert.ok(step, `${id} step missing`)
    assert.equal(step.kind, 'free', `${id}: test steps must not block retries`)
  }
})
