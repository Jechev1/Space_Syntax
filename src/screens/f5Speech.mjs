/**
 * The girl's speech bubble on the Phase 5 screens (landing site and powered
 * descent). Same difficulty contract as Phases 1 and 2: Cadet coaches every
 * step, Engineer only warns or celebrates, Flight Director gets no bubble
 * (null = render nothing).
 */

/**
 * site: null before a pick, else { have, need } hover seconds as text,
 * tight (less hover than the site needs) and fit (good for the question).
 */
export function f5aSpeech(difficulty, { ready, site }) {
  if (difficulty === 'director' || !ready) return null
  if (difficulty === 'engineer') {
    if (site && site.tight) return 'Tight landing: not much hover time here.'
    if (site && !site.fit) return 'This site will not answer our question well.'
    return null
  }
  if (!site) return 'Which site can answer our question? Lower risk is an easier landing.'
  if (site.tight) return `We can hover ${site.have} s, but this ground needs about ${site.need} s. A safer site is easier.`
  if (!site.fit) return 'We can land here, but it will not answer our question well.'
  return 'Good site! Press Choose this site.'
}

/**
 * status: '' (not flown) | 'running' | 'decision' | 'landed' | 'failed'.
 * choice (decision only): { label, cost, margin } as text plus fits.
 */
export function f5bSpeech(difficulty, { status, choice, safeMax }) {
  if (difficulty === 'director') return null
  if (difficulty === 'engineer') {
    if (status === 'landed') return 'Touchdown!'
    if (status === 'failed') return 'The landing failed. Read the fix.'
    return null
  }
  if (status === 'decision' && choice) {
    return `"${choice.label}" costs ${choice.cost} of our ${choice.margin} m/s. ${choice.fits ? 'We can afford it.' : 'That is more than we have.'}`
  }
  if (status === 'running') return 'Hovering burns fuel. Watch the fuel bar.'
  if (status === 'landed') return 'Touchdown! Step outside to explore.'
  if (status === 'failed') return 'The landing failed. Read the fix, then fly again.'
  return `Watch the fuel margin! Touch down below ${safeMax} m/s.`
}
