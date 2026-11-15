import assert from 'node:assert/strict'
import test from 'node:test'
import { f6Speech } from '../src/screens/f6Speech.mjs'

test('Cadet is coached from touchdown to the verdict', () => {
  assert.match(f6Speech('cadet', { step: 'a' }), /instruments/)
  assert.match(f6Speech('cadet', { step: 'b' }), /spot/)
  assert.match(f6Speech('cadet', { step: 'b', evidence: 'clue' }), /clue/)
  assert.match(f6Speech('cadet', { step: 'b', evidence: 'strong' }), /finish/)
  assert.match(f6Speech('cadet', { step: 'b', evidence: 'strong', bufferFull: true }), /Send data/)
  assert.match(f6Speech('cadet', { step: 'd', strong: true }), /No cheese/)
  assert.match(f6Speech('cadet', { step: 'd', strong: false }), /Not enough proof/)
})

test('Engineer only hears the full buffer, real proof and the verdict', () => {
  assert.equal(f6Speech('engineer', { step: 'a' }), null)
  assert.equal(f6Speech('engineer', { step: 'b' }), null)
  assert.equal(f6Speech('engineer', { step: 'b', evidence: 'clue' }), null)
  assert.match(f6Speech('engineer', { step: 'b', bufferFull: true }), /Buffer full/)
  assert.match(f6Speech('engineer', { step: 'b', evidence: 'strong' }), /Real proof/)
  assert.match(f6Speech('engineer', { step: 'd', strong: true }), /No cheese/)
})

test('Flight Director gets no bubble', () => {
  for (const view of [{ step: 'a' }, { step: 'b', bufferFull: true }, { step: 'b', evidence: 'strong' }, { step: 'd', strong: true }]) {
    assert.equal(f6Speech('director', view), null)
  }
})

test('every line fits the 120-character bubble', () => {
  for (const level of ['cadet', 'engineer']) {
    for (const view of [{ step: 'a' }, { step: 'b' }, { step: 'b', evidence: 'clue' }, { step: 'b', evidence: 'strong' }, { step: 'b', bufferFull: true }, { step: 'd', strong: true }, { step: 'd' }]) {
      const line = f6Speech(level, view)
      if (line) assert.ok(line.length <= 120, line)
    }
  }
})
