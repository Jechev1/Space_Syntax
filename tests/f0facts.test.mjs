import assert from 'node:assert/strict'
import test from 'node:test'
import { lessonFor, speechFor } from '../src/screens/f0Facts.mjs'

const state = (patch) => ({ difficulty: 'cadet', question: '', measure: '', missionType: '', ...patch })

test('Cadet hints coach before the choice and point ahead after it', () => {
  assert.equal(speechFor('cadet', 2, false), 'Robots are cheaper, people can do more.')
  assert.match(speechFor('cadet', 2, true), /Phase 1/)
  assert.match(speechFor('cadet', 0, false), /chemistry/i)
  assert.equal(speechFor('engineer', 2, false), 'A scientist needs proof.')
  assert.match(speechFor('engineer', 1, true), /robots or people/i)
  assert.equal(speechFor('director', 0, false), 'A scientist needs proof.')
  assert.equal(speechFor('director', 2, true), 'A scientist needs proof.')
})

test('a lesson appears only after an answer and stays within four sourced lines', () => {
  assert.equal(lessonFor(0, state()), null)
  for (const question of ['made', 'water', 'age']) {
    const lesson = lessonFor(0, state({ question }))
    assert.ok(lesson.facts.length >= 1 && lesson.facts.length <= 4)
    assert.ok(lesson.why)
    for (const fact of lesson.facts) {
      assert.match(fact.label, /.+/)
      for (const bit of fact.bits) {
        assert.ok(bit.text)
        assert.ok(bit.source)
      }
    }
  }
})

test('mission lessons use the config budgets, descent band, and a documented mission', () => {
  const robotic = lessonFor(2, state({ missionType: 'robotic' }))
  const text = flat(robotic)
  assert.match(text, /\$650 million/)
  assert.match(text, /\$7,700 million/)
  assert.match(text, /1,000–2,500 kg/)
  assert.match(text, /354 h/)
  assert.match(text, /1,000 kg/)
  assert.match(text, /valor de juego/)
  assert.match(text, /nasa\.gov/)

  const crewed = lessonFor(2, state({ missionType: 'crewed', difficulty: 'engineer' }))
  const crewText = flat(crewed)
  assert.match(crewText, /\$500 million/)
  assert.match(crewText, /\$7,000 million/)
  assert.match(crewText, /15,000–17,000 kg/)
  assert.match(crewText, /4 per person/)
  assert.match(crewText, /16,456 kg/)
  assert.match(crewText, /oig\.nasa\.gov/)
})

test('water and age lessons do not invent an ice fraction or an EVA total', () => {
  const water = flat(lessonFor(0, state({ question: 'water' })))
  assert.doesNotMatch(water, /%|ice mass|concentration/i)
  assert.match(water, /22 kg/)
  assert.match(water, /100 h/)

  const age = flat(lessonFor(0, state({ question: 'age' })))
  assert.match(age, /3\.7 Ga/)
  assert.match(age, /3\.8–4\.2 Ga/)

  const sample = flat(lessonFor(1, state({ measure: 'sample' })))
  assert.match(sample, /0\.5 kg/)
  assert.match(sample, /100 kg/)
  assert.match(sample, /382 kg/)
})

function flat(lesson) {
  return lesson.facts.map((fact) => `${fact.label}: ${fact.bits.map((bit) => bit.text).join(', ')} ${fact.bits.map((bit) => bit.source).join(' ')}`).join('\n') + lesson.why
}
