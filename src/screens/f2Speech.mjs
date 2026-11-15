/**
 * The girl's speech bubble on Phase 2 (crew and life support). Same difficulty
 * contract as Phase 1: Cadet coaches every step, Engineer only warns or
 * celebrates, Flight Director gets no bubble (null = render nothing).
 */

export function f2Speech(difficulty, { crewed, suitPicked, run }) {
  if (difficulty === 'director') return null
  if (!crewed) return difficulty === 'cadet' ? 'No crew, no groceries!' : null
  const done = run && run.status === 'done'
  if (difficulty === 'engineer') {
    if (done && !run.res.ok) return 'Something runs out — read the fix.'
    if (done && run.res.ok) return 'Supplies covered.'
    return null
  }
  if (done && !run.res.ok) return 'A supply ran out — read the fix, then test again.'
  if (done && run.res.ok) return 'Your supplies last! Confirm the crew.'
  if (!suitPicked) return 'Pick a moonwalk suit for the two who land.'
  return 'Every day adds mass. Try the optional test.'
}
