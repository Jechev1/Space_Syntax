import { flushSync } from 'react-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { usePassed, usePlayRun } from '../engine/usePlayRun.jsx'
import { useGame } from '../engine/useGame.jsx'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F3a.module.css'
import { SceneHud } from './scene.jsx'
import scene from './scene.module.css'

const BACKGROUND = '/bg/bg-control.png'
const CHARACTER = '/char/nina-chaqueta-portapapeles.png'

export function F3a() {
  const ready = usePhaseGuard('/f3a')
  if (!ready) return null
  return (
    <StageScene
      background={BACKGROUND}
      character={<img className={scene.girl} src={CHARACTER} alt="" />}
      title="How far is up? · Phase 3"
    >
      <F3aBody />
    </StageScene>
  )
}

function F3aBody() {
  const navigate = useNavigate()
  const { setModal } = usePlay()
  const game = useGame()
  const { state, data, model } = game
  const plan = model.flightPlan(state)
  const steps = [{ label: 'Translunar injection', dv: plan.tli.dv, chip: 'Rocket upper stage', leg: LEG.tli }].concat(
    plan.burns.map((burn) => ({ label: shortLabel(burn.label), dv: burn.dv, chip: '', leg: LEG[burn.key] })),
  )
  const play = usePlayRun(3, state)
  const { run, frame } = play
  // A burn is lit while it fires and stays lit once done. The Phase 3 run only flies these burns.
  const stepState = (step) => {
    if (!run || !frame || step.leg == null) return ''
    if (frame.leg === step.leg && run.status === 'running') return 'firing'
    return frame.leg >= step.leg ? 'done' : ''
  }

  return (
    <div className={scene.screen}>
      <SceneHud />
      <Trajectory count={steps.length} distance={data.MOON.distanceKm} steps={steps} stepState={stepState} frame={frame} />
      <div className={`${scene.speech} ${styles.speech}`}>
        <Bubble tone="speech">
          {state.missionType === 'crewed' ? 'I need fuel for the trip home.' : 'Every burn costs fuel.'}
        </Bubble>
      </div>
      <div className={scene.panel}>
        <GlassPanel>
          <p className={scene.kicker}>Phase 3 · Flight plan</p>
          <h2 className={scene.title}>Flight plan</h2>
          <ol className={styles.burns}>
            {steps.map((step, index) => (
              <li key={step.label} className={`${styles.burn} ${styles[stepState(step)] || ''}`}>
                <span className={styles.num}>{index + 1}</span>
                <span className={styles.burnName}>
                  {step.label}
                  {step.chip ? <span className={styles.chip}>{step.chip}</span> : null}
                </span>
                <span className={styles.dv}>{model.fmt(step.dv)} m/s</span>
              </li>
            ))}
          </ol>
          <p className={styles.total}>Spacecraft needs {model.fmt(plan.dvRequired)} m/s + margin</p>
          <FlyPlan plan={plan} play={play} />
          {run && run.status === 'done' ? null : <p className={scene.source}>Source: NASA Constellation studies · Isp: Game value</p>}
        </GlassPanel>
      </div>
      <div className={scene.dock}>
        <div className={scene.nav}>
          <Button variant="secondary" onClick={() => navigate('/f2')}>← Crew</Button>
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
        <DeltaVDock game={game} plan={plan} />
        <div className={scene.lock}>
          <GoButton game={game} />
        </div>
      </div>
    </div>
  )
}

/* Index of each burn in the Phase 3 sim legs (docs/api.md, screen 3A). */
const LEG = { tli: 0, loi: 5, descent: 6 }

/** Spacecraft marker position on the drawn arc, from the frame's x (0 Earth, distance Moon). */
function markerAt(frame, distance) {
  const t = Math.max(0, Math.min(1, frame.x / distance))
  return { left: 15 + 70 * t, top: ((30 - 56 * t * (1 - t)) / 40) * 100 }
}

function Trajectory({ count, distance, steps, stepState, frame }) {
  const nodes = Array.from({ length: count }, (_, index) => {
    const t = (index + 1) / (count + 1)
    const x = 18 + t * 64
    const y = 30 - Math.sin(t * Math.PI) * 14
    return { x, y, n: index + 1 }
  })
  const km = distance ? Number(distance).toLocaleString('en-US') : '384,400'
  return (
    <div className={styles.wall} aria-hidden="true">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none">
        <path className={styles.arc} d="M 15 30 Q 50 2 85 30" />
      </svg>
      <span className={`${styles.body} ${styles.earth}`} />
      <span className={`${styles.body} ${styles.moon}`} />
      {nodes.map((node) => (
        <span key={node.n} className={`${styles.node} ${styles[`node_${stepState(steps[node.n - 1])}`] || ''}`} style={{ left: `${node.x}%`, top: `${(node.y / 40) * 100}%` }}>
          {node.n}
        </span>
      ))}
      {frame ? <span className={styles.ship} style={{ left: `${markerAt(frame, distance).left}%`, top: `${markerAt(frame, distance).top}%` }} /> : null}
      <span className={styles.distance}>{km} km (not to scale)</span>
    </div>
  )
}

function DeltaVDock({ game, plan }) {
  const { state, data, model, setMargin } = game
  const options = data.FLIGHT.marginOptions
  const minimum = model.minMargin(state)
  const scale = plan.dvRequired * (1 + Math.max(...options))
  const fill = Math.min(100, (plan.dvPlanned / scale) * 100)
  const need = (plan.dvRequired / scale) * 100
  const check = model.validatePhase(state, 3)
  const marginOk = !check.issues.some((issue) => issue.code === 'lowDvMargin')

  return (
    <div className={styles.dock}>
      <span className={styles.dockLabel}>Delta-v</span>
      <div className={styles.meter}>
        <div className={styles.track}>
          <i style={{ width: `${fill}%` }} />
          <u style={{ left: `${need}%` }} />
        </div>
        <span className={styles.meterText}>
          {model.fmt(plan.dvPlanned)} m/s · need {model.fmt(plan.dvRequired)}
        </span>
      </div>
      <div className={styles.margins} role="group" aria-label="Delta-v margin">
        {options.map((margin) => (
          <button
            key={margin}
            type="button"
            className={styles.margin}
            aria-pressed={plan.margin === margin}
            disabled={margin < minimum}
            title={margin < minimum ? 'Too small for this difficulty' : 'Spare delta-v for mistakes'}
            onClick={() => setMargin(margin)}
          >
            {Math.round(margin * 100)}%
          </button>
        ))}
      </div>
      <span className={`${styles.status} ${marginOk ? styles.ok : styles.bad}`}>
        {marginOk ? 'Enough margin' : 'Not enough margin'}
      </span>
    </div>
  )
}

const VERDICT = { success: 'Passed', partial: 'Passed, barely', fail: 'Failed' }
const fmtDv = (n) => Math.round(n).toLocaleString('en-US')

function FlyPlan({ plan, play }) {
  const [showMath, setShowMath] = useState(false)
  const { run, frame, events } = play
  const res = run && run.res
  const running = run && run.status === 'running'
  const done = run && run.status === 'done'
  const left = frame ? frame.reserve : plan.dvPlanned
  const pct = plan.dvPlanned ? Math.max(0, Math.min(100, (left / plan.dvPlanned) * 100)) : 0
  const last = events.length ? events[events.length - 1] : null
  const margin = done && res.summary ? res.summary.marginLeft : null
  return (
    <div className={styles.play}>
      <div className={styles.playRow}>
        <Button
          variant="outline"
          disabledReason={running ? 'Flying…' : ''}
          onClick={() => { setShowMath(false); play.play() }}
        >
          {run && run.status !== 'blocked' ? 'Fly again' : 'Fly the plan'}
        </Button>
        <div className={styles.reserve}>
          <span className={styles.reserveText}>Reserve {fmtDv(left)} m/s</span>
          <span className={styles.reserveTrack} aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
        </div>
      </div>
      {!run ? <p className={styles.note}>Press Play to fly it burn by burn. Navigation errors are paid from your reserve.</p> : null}
      {run && run.status === 'blocked' ? (
        <ul className={styles.log}>{res.blockers.map((b) => <li key={b.code}>{b.message}</li>)}</ul>
      ) : null}
      {running && last ? <p className={styles.note} aria-live="polite">{last.text}</p> : null}
      {done ? (
        <div className={`${styles.verdict} ${res.ok ? styles.okBox : styles.failBox}`}>
          <p className={styles.verdictLine}>
            <b>{VERDICT[res.outcome] || res.outcome}</b>
            {res.ok ? (
              <span aria-label={`${res.stars} of 3 stars`}>
                {[0, 1, 2].map((i) => <span key={i} className={i < res.stars ? styles.starOn : styles.starOff} aria-hidden="true">★</span>)}
              </span>
            ) : null}
          </p>
          {margin != null && !res.failure ? (
            <p className={styles.note}>
              Margin left: {fmtDv(margin)} m/s. It pays for hovering (Phase 5) and the trip home (Phase 7).
            </p>
          ) : null}
          {res.failure ? (
            <>
              <p className={styles.note}>{res.failure.cause}</p>
              <p className={styles.fix}>Try this: {res.failure.fix}</p>
            </>
          ) : null}
          {res.math ? (
            <button type="button" className={styles.link} aria-expanded={showMath} onClick={() => setShowMath((v) => !v)}>
              {showMath ? 'Hide the math' : 'Show the math'}
            </button>
          ) : null}
          {showMath ? <MathBlock math={res.math} /> : null}
        </div>
      ) : null}
    </div>
  )
}

function GoButton({ game }) {
  const navigate = useNavigate()
  const { state, model, lockFlight, setNotice } = game
  const check = model.validatePhase(state, 3)
  const blocker = check.issues.find((issue) => issue.severity === 'block')
  const passed = usePassed(3, state)
  return (
    <Button
      variant="outline"
      disabled={Boolean(blocker) || !passed}
      disabledReason={blocker ? blocker.message : passed ? '' : 'Fly the plan and pass first'}
      onClick={() => {
        flushSync(() => {
          lockFlight()
          setNotice('Flight plan locked ✓')
        })
        navigate('/f4')
      }}
    >
      Choose a radio →
    </Button>
  )
}

/** "Lunar orbit insertion (NASA range 890–950)" → "Lunar orbit insertion". */
function shortLabel(label) {
  return label.replace(/\s*\(.*\)\s*$/, '').replace(/:.*$/, '')
}
