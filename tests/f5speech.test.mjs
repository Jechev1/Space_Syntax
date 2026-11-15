import assert from 'node:assert/strict'
import test from 'node:test'
import { f5aSpeech, f5bSpeech } from '../src/screens/f5Speech.mjs'

const site = (patch) => ({ have: '29', need: '50', tight: false, fit: true, ...patch })
const choice = (patch) => ({ label: 'Take the detour', cost: '11', margin: '47', fits: true, ...patch })

test('Cadet is coached through the site choice', () => {
  assert.match(f5aSpeech('cadet', { ready: true, site: null }), /question/)
  assert.match(f5aSpeech('cadet', { ready: true, site: site({ tight: true }) }), /29 s.*50 s/)
  assert.match(f5aSpeech('cadet', { ready: true, site: site({ fit: false }) }), /answer our question/)
  assert.match(f5aSpeech('cadet', { ready: true, site: site() }), /Choose this site/)
})

test('Engineer only hears warnings on the site choice', () => {
  assert.equal(f5aSpeech('engineer', { ready: true, site: null }), null)
  assert.equal(f5aSpeech('engineer', { ready: true, site: site() }), null)
  assert.match(f5aSpeech('engineer', { ready: true, site: site({ tight: true }) }), /Tight/)
  assert.match(f5aSpeech('engineer', { ready: true, site: site({ fit: false }) }), /question/)
})

test('Cadet is coached through the descent, including the detour math', () => {
  assert.match(f5bSpeech('cadet', { status: '', safeMax: 2 }), /below 2 m\/s/)
  assert.match(f5bSpeech('cadet', { status: 'running', safeMax: 2 }), /fuel/)
  assert.match(f5bSpeech('cadet', { status: 'decision', choice: choice(), safeMax: 2 }), /11 of our 47 m\/s\. We can afford it/)
  assert.match(f5bSpeech('cadet', { status: 'decision', choice: choice({ fits: false }), safeMax: 2 }), /more than we have/)
  assert.match(f5bSpeech('cadet', { status: 'landed', safeMax: 2 }), /Step outside/)
  assert.match(f5bSpeech('cadet', { status: 'failed', safeMax: 2 }), /fix/)
})

test('Engineer only hears the outcome of the descent', () => {
  for (const status of ['', 'running', 'decision']) assert.equal(f5bSpeech('engineer', { status, choice: choice(), safeMax: 2 }), null)
  assert.match(f5bSpeech('engineer', { status: 'landed', safeMax: 2 }), /Touchdown/)
  assert.match(f5bSpeech('engineer', { status: 'failed', safeMax: 2 }), /fix/)
})

test('Flight Director gets no bubble, and nothing shows before the earlier phases are done', () => {
  assert.equal(f5aSpeech('director', { ready: true, site: site({ tight: true }) }), null)
  assert.equal(f5aSpeech('cadet', { ready: false, site: null }), null)
  for (const status of ['', 'running', 'decision', 'landed', 'failed']) {
    assert.equal(f5bSpeech('director', { status, choice: choice(), safeMax: 2 }), null)
  }
})

test('every line fits the 120-character bubble', () => {
  const lines = [
    f5aSpeech('cadet', { ready: true, site: null }),
    f5aSpeech('cadet', { ready: true, site: site({ tight: true, have: '1,234', need: '5,678' }) }),
    f5aSpeech('cadet', { ready: true, site: site({ fit: false }) }),
    f5bSpeech('cadet', { status: 'decision', choice: choice({ cost: '1,234', margin: '5,678', fits: false }), safeMax: 2 }),
    f5bSpeech('cadet', { status: '', safeMax: 2 }),
  ]
  for (const line of lines) assert.ok(line.length <= 120, line)
})
