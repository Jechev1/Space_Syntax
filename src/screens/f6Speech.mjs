/**
 * The girl's speech bubble on Phase 6 (surface). Same difficulty contract as
 * Phases 1 to 5: Cadet coaches every step, Engineer only warns or celebrates,
 * Flight Director gets no bubble (null = render nothing).
 *
 * step: 'a' (touchdown) | 'b' (investigating) | 'd' (verdict).
 * evidence: 'none' | 'clue' | 'strong'. bufferFull and strong (verdict) are booleans.
 */

export function f6Speech(difficulty, { step, evidence = 'none', bufferFull = false, strong = false }) {
  if (difficulty === 'director') return null
  if (step === 'd') return strong ? 'No cheese here. The ground is rock and dust!' : 'Not enough proof yet.'
  if (difficulty === 'engineer') {
    if (step === 'b' && bufferFull) return 'Buffer full. Send the data.'
    if (step === 'b' && evidence === 'strong') return 'Real proof! Finish when you are ready.'
    return null
  }
  if (step === 'a') return 'Our question is still open. Let\'s test it with real instruments.'
  if (bufferFull) return 'The data buffer is full. Send data to Earth, then keep measuring.'
  if (evidence === 'strong') return 'Real proof! Send the data, then finish the exploration.'
  if (evidence === 'clue') return 'A picture is only a clue. Try a "Good proof" or "Strongest" instrument.'
  return 'Pick a spot on the ground, then an instrument.'
}
