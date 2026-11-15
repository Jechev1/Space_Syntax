import assert from 'node:assert/strict'
import test from 'node:test'
import { labSpeech } from '../src/screens/labSpeech.mjs'

test('Cadet is coached on the verdict and the report', () => {
  assert.match(labSpeech('cadet', { step: 'verdict', strong: true }), /no cheese/)
  assert.match(labSpeech('cadet', { step: 'verdict', strong: false }), /spectrometer/)
  assert.match(labSpeech('cadet', { step: 'report' }), /one page/)
})

test('Engineer only hears the verdict', () => {
  assert.match(labSpeech('engineer', { step: 'verdict', strong: true }), /No cheese/)
  assert.match(labSpeech('engineer', { step: 'verdict', strong: false }), /better proof/)
  assert.equal(labSpeech('engineer', { step: 'report' }), null)
})

test('Flight Director gets no bubble', () => {
  for (const view of [{ step: 'verdict', strong: true }, { step: 'verdict' }, { step: 'report' }]) {
    assert.equal(labSpeech('director', view), null)
  }
})

test('every line fits the 120-character bubble', () => {
  for (const level of ['cadet', 'engineer']) {
    for (const view of [{ step: 'verdict', strong: true }, { step: 'verdict' }, { step: 'report' }]) {
      const line = labSpeech(level, view)
      if (line) assert.ok(line.length <= 120, line)
    }
  }
})
