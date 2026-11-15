/**
 * The girl's speech bubble on the Phase 4 screen. Cadet coaches through every
 * step, Engineer only warns or says what comes next, and Flight Director gets no
 * hints (the bubble keeps the scene line).
 *
 * view: { need, gb } as text, plus booleans link, dish, laser, bottleneck,
 * weather, broken, passed, and run ('' | 'running' | 'failed' | 'passed').
 */

export const NEUTRAL = 'How will anyone know what I found?'

export function f4Speech(difficulty, view) {
  if (difficulty === 'director') return NEUTRAL
  return difficulty === 'cadet' ? cadet(view) : engineer(view)
}

function engineer(v) {
  if (v.broken) return 'Too heavy for our rocket now. Fix it in Phase 1.'
  if (v.link && v.dish && v.bottleneck) return 'Bottleneck! We make more data than we send.'
  if (v.run === 'failed') return 'Data was lost. Read the fix.'
  if (v.passed) return 'All our data gets home. Confirm the link.'
  if (v.link && v.dish && v.run !== 'running') return 'Next: run the mission timeline.'
  return NEUTRAL
}

function cadet(v) {
  if (v.broken) return 'That made us too heavy or too pricey for our rocket. Fix it in Phase 1.'
  if (!v.link) return `We make ${v.need} Gb of data a day. Pick a link that sends more.`
  if (!v.dish) {
    return v.laser
      ? 'A laser ignores the dish size, so the cheaper antenna works too.'
      : 'Now an antenna on Earth. Bigger hears more, but costs more.'
  }
  if (v.bottleneck) return `We only send ${v.gb} of our ${v.need} Gb a day. Try a faster link${v.laser ? '' : ' or a bigger dish'}.`
  if (v.run === 'running') return 'Watch the buffer. Data waits there until Earth can listen.'
  if (v.run === 'failed') return 'Data was lost. Read the fix, change the link and try again.'
  if (v.passed) return v.weather ? 'All our data gets home. Clouds can block a laser, though. Confirm!' : 'All our data gets home. Confirm the link!'
  return 'Now run the mission timeline to test the link.'
}
