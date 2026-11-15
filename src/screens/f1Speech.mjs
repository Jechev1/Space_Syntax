/**
 * The girl's speech bubble on the Phase 1 screens. Cadet coaches through every
 * step, Engineer only warns or celebrates, and Flight Director gets no hints at
 * all (null = render no bubble).
 */

const SUB_HINTS = {
  structure: 'This frame carries everything. Lighter means more fuel for the trip.',
  shield: 'Space pebbles hit like bullets. A thin bumper stops them.',
  thermal: 'From oven-hot to deep-freeze. Keep the electronics in between.',
  power: 'A lunar night can last 354 hours. Panels alone may not be enough.',
  science: 'Pick the tools that answer your Phase 0 question.',
}

const NEXT_SUB = {
  structure: 'Shield',
  shield: 'Thermal',
  thermal: 'Power',
  power: 'Science payload',
}

export function f1aSpeech(difficulty, subId, answered) {
  if (difficulty === 'director') return null
  if (difficulty === 'engineer') {
    if (subId === 'science') return 'Pick the tools that answer your question.'
    if (subId === 'power') return 'Mind the lunar night.'
    return null
  }
  if (answered && NEXT_SUB[subId]) return `Done here. Next: ${NEXT_SUB[subId]}.`
  if (answered && subId === 'science') return 'All set? Check the numbers and choose a rocket.'
  return SUB_HINTS[subId] || null
}

export function f1bSpeech(difficulty, rocket, run, fitsAny) {
  if (difficulty === 'director') return null
  const done = run && run.status === 'done'
  if (done && run.res.ok) return 'We can reach the Moon!'
  if (difficulty === 'engineer') return null
  if (done && run.res.failure) {
    if (run.res.failure.code === 'tooHeavy') return 'Too heavy! Try a bigger rocket.'
    return 'The test found a problem. Read the fix.'
  }
  if (!fitsAny) return 'Too heavy! Make the lander lighter.'
  if (!rocket) return 'Which one can lift us?'
  return null
}

export function f1doneSpeech(difficulty, nightNote, nextNote) {
  if (difficulty === 'director') return null
  if (difficulty === 'engineer') return nextNote
  return nightNote || nextNote
}
