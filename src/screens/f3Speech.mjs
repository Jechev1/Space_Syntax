/**
 * The girl's speech bubble on Phase 3 (flight plan and delta-v). Same
 * difficulty contract as Phases 1 and 2: Cadet coaches every step, Engineer
 * only warns or celebrates, Flight Director gets no bubble (null = render
 * nothing).
 */

export function f3Speech(difficulty, { crewed, margin, run }) {
  if (difficulty === 'director') return null
  const done = run && run.status === 'done'
  if (difficulty === 'engineer') {
    if (done && !run.res.ok) return 'Not enough delta-v — check the fix.'
    if (done && run.res.ok) return 'Plan verified.'
    return null
  }
  if (done && !run.res.ok) return 'Out of fuel — raise the margin or lighten the ship.'
  if (done && run.res.ok) return 'Your fuel lasts the whole plan!'
  if (!margin) {
    return crewed ? 'No spare fuel for the trip home means staying on the Moon.' : 'Add some margin — it is spare fuel for mistakes.'
  }
  return 'Fly the plan to see if your fuel lasts.'
}
