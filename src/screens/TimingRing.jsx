import { useEffect, useRef, useState } from 'react'
import styles from './TimingRing.module.css'

/*
 * Lift-off countdown as a rhythm game, drawn as plain SVG with the theme colours (no library, no images).
 * Five seconds of "Preparing the ship": rings pop up one after another (3 on Cadet, 4 on Engineer,
 * 5 on Flight Director) and each one closes on its target circle. The player presses any key, or taps
 * the ring, when the two circles meet. A missed ring holds the countdown and comes back; once every
 * ring is hit, onDone gets the grades and the burn starts.
 */
const TOTAL_MS = 5000
const RINGS = { cadet: 3, engineer: 4, director: 5 }
const TARGET = 40
const START = 95
const END = 12
const PERFECT = 4
const GOOD = 10
// Where each ring appears inside the field, in percent, so the player has to follow them.
const SPOTS = [
  { x: 50, y: 52 },
  { x: 26, y: 40 },
  { x: 74, y: 44 },
  { x: 34, y: 76 },
  { x: 66, y: 76 },
]
const IGNORED = new Set(['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape', 'CapsLock'])

export function TimingRing({ difficulty, onDone }) {
  const count = RINGS[difficulty] || RINGS.engineer
  const period = TOTAL_MS / count
  const [view, setView] = useState({ index: 0, r: START, t: 0 })
  const [grades, setGrades] = useState([])
  const [msg, setMsg] = useState({ text: '', tone: '' })
  const live = useRef({ index: 0, r: START, start: 0, done: false, grades: [] })
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const miss = (text) => {
    // Countdown on hold: the same ring starts again.
    live.current.start = performance.now()
    setMsg({ text, tone: 'miss' })
  }

  useEffect(() => {
    let id = 0
    live.current.start = performance.now()
    const tick = (now) => {
      const s = live.current
      if (!s.done) {
        const t = (now - s.start) / period
        if (t >= 1) {
          miss('Missed! Countdown on hold, try again')
        } else {
          s.r = START - (START - END) * t
          setView({ index: s.index, r: s.r, t })
        }
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [period])

  const hit = () => {
    const s = live.current
    if (s.done) return
    const d = Math.abs(s.r - TARGET)
    if (d > GOOD) {
      miss(s.r > TARGET ? 'Too early! Countdown on hold' : 'Too late! Countdown on hold')
      return
    }
    const grade = d <= PERFECT ? 'perfect' : 'good'
    s.grades = [...s.grades, grade]
    setGrades(s.grades)
    if (s.grades.length >= count) {
      s.done = true
      const all = s.grades
      setTimeout(() => onDoneRef.current(all), 600)
    }
    setMsg({ text: grade === 'perfect' ? 'Perfect!' : 'Good', tone: grade })
    s.index += 1
    s.start = performance.now()
  }
  const hitRef = useRef(hit)
  hitRef.current = hit

  useEffect(() => {
    const onKey = (event) => {
      if (event.repeat || IGNORED.has(event.key)) return
      event.preventDefault()
      hitRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const finished = grades.length >= count
  const left = finished ? 0 : Math.max(1, Math.ceil(5 - ((view.index + view.t) * 5) / count))
  const spot = SPOTS[view.index % SPOTS.length]
  const near = Math.abs(view.r - TARGET) <= GOOD

  return (
    <div className={styles.field}>
      <div className={styles.head} role="status">
        <p className={styles.count}>{finished ? 'Lift off!' : `T-minus ${left}`}</p>
        <p className={styles.note}>
          {finished ? 'All systems go.' : 'Preparing the ship... press any key when the circles meet for a successful lift off.'}
        </p>
        <p className={styles.dots} aria-label={`${grades.length} of ${count} rings hit`}>
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className={`${styles.dot} ${grades[i] ? styles[grades[i]] : ''}`} />
          ))}
        </p>
        {msg.text ? <p className={`${styles.msg} ${styles[msg.tone] || ''}`}>{msg.text}</p> : null}
      </div>
      {finished ? null : (
        <button
          key={view.index}
          type="button"
          className={styles.ring}
          style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          onClick={hit}
          aria-label={`Ring ${view.index + 1} of ${count}: tap when the circles meet`}
        >
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r={TARGET + GOOD} className={styles.zone} />
            <circle cx="100" cy="100" r={TARGET} className={styles.target} />
            <circle cx="100" cy="100" r={view.r} className={`${styles.closing} ${near ? styles.near : ''}`} />
            <text x="100" y="108" textAnchor="middle" className={styles.word}>{view.index + 1}</text>
          </svg>
        </button>
      )}
    </div>
  )
}
