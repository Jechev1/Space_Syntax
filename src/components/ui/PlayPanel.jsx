import { useEffect, useRef, useState } from 'react'
import { Button } from './Button.jsx'
import { GlassPanel } from './GlassPanel.jsx'
import { MathBlock } from './MathBlock.jsx'
import styles from './PlayPanel.module.css'

/*
 * Generic "press Play" panel. It draws whatever a SimResult carries: one bar per field, the event log,
 * the verdict with stars, the cause and fix of a failure, and the real math. Screens can put their own
 * scene next to it using the same frame. Hook: src/engine/usePlayRun.jsx.
 */

const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const digits = (v) => (Math.abs(v) < 10 && v !== 0 ? 1 : 0)
const UNIT = { s: 's', min: 'min', h: 'h', day: 'days' }
const VERDICT = { success: 'Passed', partial: 'Passed, barely', fail: 'Failed' }

/** "Mass margin: 59.9%". Fractions show as percent; a bare 0 to 1 "score" is left to the stars. */
function scoreText(score) {
  if (!score || score.unit === 'score') return ''
  const u = score.unit || ''
  if (u === '%') return `${score.label}: ${fmt(score.value, 1)}%`
  if (u.startsWith('fraction') || u.startsWith('of ')) return `${score.label}: ${fmt(score.value * 100, 1)}%${u.startsWith('of ') ? ` ${u}` : ''}`
  return `${score.label}: ${fmt(score.value, digits(score.value))} ${u}`
}

function Stars({ n }) {
  return (
    <span className={styles.stars} aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map((i) => <span key={i} className={i < n ? styles.starOn : styles.starOff} aria-hidden="true">★</span>)}
    </span>
  )
}

function Bars({ fields, frame }) {
  return (
    <div className={styles.bars}>
      {fields.map((f) => {
        const v = frame ? frame[f.key] : 0
        const w = f.max ? Math.max(0, Math.min(1, v / f.max)) : 0
        return (
          <div className={styles.bar} key={f.key}>
            <span className={styles.barLabel}>{f.label}</span>
            <span className={styles.barValue}>{fmt(v, digits(v))} {f.unit}</span>
            <span className={styles.track} aria-hidden="true"><span className={styles.fill} style={{ width: `${w * 100}%` }} /></span>
          </div>
        )
      })}
    </div>
  )
}

export function PlayPanel({
  eyebrow = 'Play',
  title = 'Test run',
  intro = '',
  label = 'Play',
  disabledReason = '',
  hint = '',
  play,
}) {
  const [showMath, setShowMath] = useState(false)
  const { run, frame, events, choose } = play
  const res = run && run.res
  const running = run && run.status === 'running'
  const done = run && run.status === 'done'
  const resultRef = useRef(null)
  // Bring the verdict or the choice into view when the run stops.
  useEffect(() => {
    if (run && (run.status === 'done' || run.status === 'decision') && resultRef.current) resultRef.current.scrollIntoView({ block: 'nearest' })
  }, [run && run.status]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GlassPanel eyebrow={eyebrow} title={title}>
      {intro ? <p className={styles.note}>{intro}</p> : null}
      <Button
        variant="outline"
        disabledReason={running ? 'Running…' : disabledReason}
        onClick={() => { setShowMath(false); play.play() }}
      >
        {run && run.status !== 'blocked' ? `${label} again` : label}
      </Button>
      {hint && !(done && res.ok) ? <p className={styles.note}>{hint}</p> : null}

      {run && run.status === 'blocked' ? (
        <ul className={styles.blockers}>
          {res.blockers.map((b) => <li key={b.code}>{b.message}</li>)}
        </ul>
      ) : null}

      {res && res.ready ? (
        <>
          <p className={styles.clock}>t = {fmt(run.t, run.t < 10 ? 1 : 0)} {UNIT[res.time.unit] || res.time.unit}</p>
          <Bars fields={res.fields} frame={frame} />
          <ol className={styles.log} aria-live="polite">
            {events.slice(-4).map((e, i) => <li key={`${e.t}-${i}`} className={styles[e.kind]}>{e.text}</li>)}
          </ol>
        </>
      ) : null}

      {run && run.status === 'decision' ? (
        <div className={styles.decision} role="group" aria-label="Your call" ref={resultRef}>
          <p className={styles.prompt}>{res.decision.prompt}</p>
          <div className={styles.actions}>
            {res.decision.options.map((o) => (
              <Button key={o.id} variant="secondary" onClick={() => choose(o.id)}>
                {o.label}{o.dvCost ? ` (${fmt(o.dvCost)} m/s)` : ''}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {done ? (
        <div className={`${styles.verdict} ${res.ok ? styles.okBox : styles.failBox}`} ref={resultRef}>
          <p className={styles.verdictLine}>
            <b>{VERDICT[res.outcome] || res.outcome}</b>
            {res.ok ? <Stars n={res.stars} /> : null}
          </p>
          {res.ok && scoreText(res.score) ? <p className={styles.note}>{scoreText(res.score)}</p> : null}
          {res.failure ? (
            <>
              <p className={styles.cause}>{res.failure.cause}</p>
              <p className={styles.fix}>Try this: {res.failure.fix}</p>
            </>
          ) : null}
          {res.math ? (
            <Button variant="ghost" aria-expanded={showMath} onClick={() => setShowMath((v) => !v)}>
              {showMath ? 'Hide the math' : 'Show the math'}
            </Button>
          ) : null}
          {showMath ? <MathBlock math={res.math} /> : null}
        </div>
      ) : null}

    </GlassPanel>
  )
}
