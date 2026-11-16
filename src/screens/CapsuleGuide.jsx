import { useEffect, useRef, useState } from 'react'
import styles from './CapsuleGuide.module.css'

/*
 * Guided reentry: the capsule (capsula.png) falls toward the ocean while the wind pushes it sideways.
 * The player steers with the arrow keys or A / D (or holds the on-screen buttons) to bring it over the
 * recovery ships. Orion really steers like this, by rolling its lift. When it reaches the water, onDone
 * gets the guidance (0 = far off, 1 = right on the ships), which shortens the splashdown miss.
 * Off course does not count as a landing: the player flies the fall again right away.
 * Plain DOM and SVG with the theme colours, no library.
 */
const FALL_MS = 7000
const TOP = 6
const BOTTOM = 60
const ACCEL = 70 // %/s² of steering
const DRAG = 2.2 // 1/s
const WIND = { cadet: 9, engineer: 16, director: 24 } // %/s² of gusts
const RANGE = 25 // % off the ships that still gives some guidance
const CLOSE = 12 // % off the ships: farther than this is off course and must be flown again
const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A'])
const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D'])

function seeded(seed) {
  let a = (seed >>> 0) + 0x9e3779b9
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function guidanceFrom(dx) {
  return Math.max(0, Math.min(1, 1 - Math.abs(dx) / RANGE))
}

export function CapsuleGuide({ difficulty, seed, glow, onDone }) {
  const [plan] = useState(() => {
    const r = seeded(seed || 0)
    return { target: 32 + r() * 22, start: 22 + r() * 34, p1: r() * 6.28, p2: r() * 6.28 }
  })
  const [view, setView] = useState({ x: plan.start, y: TOP, t: 0 })
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const input = useRef({ left: false, right: false })
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const wind = WIND[difficulty] || WIND.engineer
    let x = plan.start
    let vx = 0
    let last = performance.now()
    const begin = last
    let id = 0
    let over = false
    setView({ x, y: TOP, t: 0 })
    setResult(null)
    input.current = { left: false, right: false }
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = Math.min(1, (now - begin) / FALL_MS)
      const s = (now - begin) / 1000
      const gust = wind * (Math.sin(s * 0.9 + plan.p1) + 0.6 * Math.sin(s * 2.3 + plan.p2))
      const steer = (input.current.right ? 1 : 0) - (input.current.left ? 1 : 0)
      vx += (steer * ACCEL + gust - vx * DRAG) * dt
      x = Math.max(4, Math.min(80, x + vx * dt))
      // Ease out: fast in the high air, slower under the parachutes near the water.
      const y = TOP + (BOTTOM - TOP) * (1 - (1 - t) * (1 - t))
      setView({ x, y, t })
      if (t >= 1 && !over) {
        over = true
        const dx = x - plan.target
        const guide = guidanceFrom(dx)
        const failed = Math.abs(dx) > CLOSE
        setResult({ guide, dx, failed })
        if (!failed) setTimeout(() => onDoneRef.current(guide), 1100)
        return
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [difficulty, plan, attempt])

  useEffect(() => {
    const set = (event, on) => {
      if (on && event.key === 'Enter' && retryRef.current) {
        event.preventDefault()
        retryRef.current()
        return
      }
      if (LEFT_KEYS.has(event.key)) input.current.left = on
      else if (RIGHT_KEYS.has(event.key)) input.current.right = on
      else return
      event.preventDefault()
    }
    const down = (event) => set(event, true)
    const up = (event) => set(event, false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const hold = (side, on) => () => { input.current[side] = on }
  const retry = result && result.failed ? () => setAttempt((n) => n + 1) : null
  const retryRef = useRef(retry)
  retryRef.current = retry
  const retryButton = useRef(null)
  const failed = Boolean(result?.failed)
  useEffect(() => {
    if (failed) retryButton.current?.focus()
  }, [failed])
  const dx = Math.abs(view.x - plan.target)
  const tone = dx <= 5 ? styles.good : dx <= 12 ? styles.close : styles.far
  const verdict = result
    ? (Math.abs(result.dx) <= 5 ? 'Right over the ships!' : result.failed ? 'Off course! The capsule missed the ships.' : 'Close to the ships')
    : null

  return (
    <div className={styles.field} data-tutorial="f7-guide">
      <svg
        className={styles.zone}
        style={{ left: `${plan.target}%` }}
        viewBox="0 0 200 60"
        aria-hidden="true"
      >
        <ellipse cx="100" cy="30" rx="96" ry="26" className={styles.zoneOuter} />
        <ellipse cx="100" cy="30" rx="40" ry="11" className={styles.zoneInner} />
      </svg>
      <p className={styles.zoneLabel} style={{ left: `${plan.target}%` }}>Recovery ships</p>
      <div
        className={styles.capsule}
        style={{ left: `${view.x}%`, top: `${view.y}%`, '--glow': glow * (1 - view.t), '--scale': 0.6 + 0.4 * view.t }}
      >
        <span className={styles.plasma} aria-hidden="true" />
        <img src="/obj/capsula.png" alt="" />
      </div>
      <span className={`${styles.guideLine} ${tone}`} style={{ left: `${view.x}%`, top: `${view.y}%` }} aria-hidden="true" />
      {result && result.failed ? (
        <div className={styles.retry} role="alert">
          <p className={styles.retryTitle}>Off course</p>
          <p className={styles.retryLine}>
            The capsule came down {Math.round(Math.abs(result.dx))}% away from the recovery ships. Fly the reentry again.
          </p>
          <button ref={retryButton} type="button" className={styles.retryButton} onClick={retry}>Try again</button>
        </div>
      ) : null}
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.arrow}
          aria-label="Steer left"
          onPointerDown={hold('left', true)}
          onPointerUp={hold('left', false)}
          onPointerLeave={hold('left', false)}
        >
          ◀ A
        </button>
        <p className={`${styles.status} ${tone}`} role="status">
          {verdict || 'Steer with ← → or A / D to bring the capsule over the ships'}
        </p>
        <button
          type="button"
          className={styles.arrow}
          aria-label="Steer right"
          onPointerDown={hold('right', true)}
          onPointerUp={hold('right', false)}
          onPointerLeave={hold('right', false)}
        >
          D ▶
        </button>
      </div>
    </div>
  )
}
