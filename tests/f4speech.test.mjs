import assert from 'node:assert/strict'
import test from 'node:test'
import { NEUTRAL, f4Speech } from '../src/screens/f4Speech.mjs'

const view = (patch) => ({
  need: '390', gb: '0', link: false, dish: false, laser: false, bottleneck: false,
  weather: false, broken: false, passed: false, run: '', ...patch,
})

test('Cadet coaches every step, starting from the daily data need', () => {
  assert.match(f4Speech('cadet', view()), /390 Gb/)
  assert.match(f4Speech('cadet', view({ link: true })), /antenna/)
  assert.match(f4Speech('cadet', view({ link: true, laser: true })), /laser/i)
  assert.match(f4Speech('cadet', view({ link: true, dish: true, bottleneck: true, gb: '58' })), /58 of our 390/)
  assert.match(f4Speech('cadet', view({ link: true, dish: true })), /timeline/)
  assert.match(f4Speech('cadet', view({ link: true, dish: true, run: 'running' })), /buffer/)
  assert.match(f4Speech('cadet', view({ link: true, dish: true, run: 'failed' })), /fix/)
  assert.match(f4Speech('cadet', view({ link: true, dish: true, passed: true })), /Confirm/)
  assert.match(f4Speech('cadet', view({ link: true, dish: true, passed: true, weather: true })), /Clouds/)
})

test('Engineer only warns or says what comes next', () => {
  assert.equal(f4Speech('engineer', view()), NEUTRAL)
  assert.equal(f4Speech('engineer', view({ link: true })), NEUTRAL)
  assert.match(f4Speech('engineer', view({ link: true, dish: true })), /Next/)
  assert.equal(f4Speech('engineer', view({ link: true, dish: true, run: 'running' })), NEUTRAL)
  assert.match(f4Speech('engineer', view({ link: true, dish: true, bottleneck: true })), /Bottleneck/)
  assert.match(f4Speech('engineer', view({ link: true, dish: true, passed: true })), /Confirm/)
})

test('a broken Phase 1 points back to it before anything else', () => {
  for (const level of ['cadet', 'engineer']) {
    assert.match(f4Speech(level, view({ link: true, dish: true, broken: true, passed: true })), /Phase 1/)
  }
})

test('Flight Director gets no hints', () => {
  for (const patch of [{}, { link: true, dish: true, bottleneck: true }, { broken: true }, { passed: true, run: 'passed' }]) {
    assert.equal(f4Speech('director', view(patch)), NEUTRAL)
  }
})

test('every line fits the 120-character bubble', () => {
  const states = [{}, { link: true }, { link: true, laser: true }, { link: true, dish: true, bottleneck: true, gb: '2,340' },
    { link: true, dish: true, run: 'running' }, { link: true, dish: true, run: 'failed' }, { link: true, dish: true, passed: true, weather: true },
    { broken: true }]
  for (const level of ['cadet', 'engineer', 'director']) {
    for (const patch of states) assert.ok(f4Speech(level, view(patch)).length <= 120)
  }
})
