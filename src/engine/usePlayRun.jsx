import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

/*
 * Play runs for the React screens. The backend (window.SS_SIM.simulate) does all the physics and returns
 * frames; this hook only plays them back over a few seconds. No game rule lives here.
 * Contract: js/sim/kit.js and docs/api.md.
 */

const PLAY_MS = 5000 // how long one run takes on screen, whatever the simulated time
// With reduced motion the run still plays, only faster: the numbers and bars are the game, not decoration.
// Decorative motion (flames, flicker, glows) is switched off in each screen's CSS.
const PLAY_MS_CALM = 1800
const SEED = 1 // same design, same run: players iterate like in Poly Bridge

/* Passed runs, kept in memory and keyed by the design that passed. Changing the design clears the pass. */
const passed = new Map()
const listeners = new Set()
function notify() { listeners.forEach((fn) => fn()) }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }

/** The design part of the state: sanitizeState drops the UI keys. */
export function designKey(state, ignore = []) {
  const clean = { ...window.SS_MODEL.sanitizeState(state) }
  ignore.forEach((k) => { delete clean[k] })
  return JSON.stringify(clean)
}

/** True when the current design already passed this phase's run. Re-renders when that changes. */
export function usePassed(phase, state) {
  const key = designKey(state)
  return useSyncExternalStore(subscribe, () => passed.get(phase) === key)
}

function reducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Frame at time t, linear between the two nearest frames. */
export function frameAt(res, t) {
  const fr = res.frames
  if (!fr.length) return null
  if (t <= fr[0].t) return fr[0]
  if (t >= fr[fr.length - 1].t) return fr[fr.length - 1]
  let lo = 0
  let hi = fr.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (fr[mid].t <= t) lo = mid
    else hi = mid
  }
  const a = fr[lo]
  const b = fr[hi]
  const k = b.t > a.t ? (t - a.t) / (b.t - a.t) : 0
  const out = {}
  for (const key of Object.keys(a)) out[key] = typeof a[key] === 'number' && typeof b[key] === 'number' ? a[key] + (b[key] - a[key]) * k : a[key]
  out.t = t
  return out
}

/**
 * run = null before Play, else { status, res, t }
 *   status: 'blocked' (res.blockers) | 'running' | 'decision' (paused, res.decision) | 'done'
 */
export function usePlayRun(phase, state, opts = {}) {
  const [run, setRun] = useState(null)
  const raf = useRef(0)
  // opts.ignore: state keys the run itself writes (like "landing"), so recording the result does not reset the run.
  const ignoreKeys = opts.ignore || []
  const key = designKey(state, ignoreKeys)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  // A new design needs a new run.
  useEffect(() => { cancelAnimationFrame(raf.current); setRun(null) }, [key])

  const animate = useCallback((res, fromT) => {
    const paused = res.outcome === 'pending' && res.decision
    const endT = paused ? res.decision.t : res.time.total
    const finish = () => {
      if (res.ok) { passed.set(phase, key); notify() }
      setRun({ status: paused ? 'decision' : 'done', res, t: endT })
    }
    cancelAnimationFrame(raf.current)
    if (endT <= fromT) { finish(); return }
    const ms = (reducedMotion() ? PLAY_MS_CALM : PLAY_MS) * (endT - fromT) / (res.time.total || 1)
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - start) / Math.max(400, ms))
      if (p >= 1) { finish(); return }
      setRun({ status: 'running', res, t: fromT + (endT - fromT) * p })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }, [phase, key])

  const play = useCallback((extra) => {
    const { ignore, ...simOpts } = opts // eslint-disable-line no-unused-vars
    const res = window.SS_SIM.simulate(stateRef.current, phase, { seed: SEED, ...simOpts, ...extra })
    if (!res.ready) { setRun({ status: 'blocked', res, t: 0 }); return }
    animate(res, 0)
  // opts is a plain literal from the screen; its content is what matters
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, animate, JSON.stringify(opts)])

  /** Resume a paused run with the player's choice, from where it stopped. */
  const choose = useCallback((choiceId) => {
    const from = run && run.res.decision ? run.res.decision.t : 0
    const rest = { ...opts }
    delete rest.interactive
    delete rest.ignore
    const res = window.SS_SIM.simulate(stateRef.current, phase, { seed: SEED, ...rest, choice: choiceId })
    animate(res, from)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, animate, run, JSON.stringify(opts)])

  const frame = run && run.res.ready ? frameAt(run.res, run.t) : null
  const events = run && run.res.ready ? run.res.events.filter((e) => e.t <= run.t + 1e-9) : []
  return { run, frame, events, play, choose }
}
