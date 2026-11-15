import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../engine/useGame.jsx'

const PHASE_ROUTES = { 0: '/f0', 1: '/f1a', 2: '/f2', 3: '/f3a', 4: '/f4' }

/**
 * Go back to Earth to fix a design phase after launch, like rebuilding a bridge in Poly Bridge.
 * Phases 0 to 4 unlock and the flight has to be flown again, so the landing is cleared.
 * The landing site, the surface measurements and the return choices are kept.
 */
export function useGoBack() {
  const navigate = useNavigate()
  const { update } = useGame()
  return (phase) => {
    flushSync(() => update((next) => {
      next.launched = false
      next.landing = null
      if (next.surface) next.surface = Object.assign({}, next.surface, { finished: false })
      return `Back on Earth. Fix Phase ${phase}, then launch again. Your landing site and surface work are kept.`
    }))
    navigate(PHASE_ROUTES[phase] || '/f1a')
  }
}

/** Phase a failure's fix text points to, if it is a design phase (0 to 4). */
export function fixPhase(failure) {
  const m = failure && typeof failure.fix === 'string' && failure.fix.match(/Phase ([0-4])\b/)
  return m ? Number(m[1]) : null
}
