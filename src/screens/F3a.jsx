import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Dialog } from '../components/ui/Dialog.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { HELP_F3 } from '../data/help.mjs'
import { useGame } from '../engine/useGame.jsx'
import { usePassed, usePlayRun } from '../engine/usePlayRun.jsx'
import { f3Speech } from './f3Speech.mjs'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { MissionHud } from './f1Hud.jsx'
import styles from './F1.module.css'
import f3 from './F3a.module.css'

const BACKGROUND = '/bg/bg-control.png'
const CHARACTER = '/char/nina-chaqueta-portapapeles.png'

/* One plain-language line per manoeuvre, shown on hover under the list. */
const BURN_HINT = {
  tli: 'The rocket\'s upper stage pushes you toward the Moon — it does not spend your fuel.',
  loi: 'Brake so the Moon\'s gravity can catch you.',
  descent: 'The lander burns to slow down and touch the surface.',
  ascent: 'Lift off the Moon and climb back to orbit.',
  tei: 'Leave lunar orbit and head home to Earth.',
  direct: 'Skip the orbit stop — burn and fly straight home.',
}

/* Short labels so each burn fits one line in the panel. */
const BURN_LABEL = {
  loi: 'Lunar orbit insertion',
  descent: 'Powered descent',
  ascent: 'Lunar ascent',
  tei: 'Trans-Earth injection',
  direct: 'Direct return burn',
}

export function F3a() {
  const ready = usePhaseGuard('/f3a')
  if (!ready) return null
  return (
    <StageScene
      background={BACKGROUND}
      character={<img className={styles.girl} src={CHARACTER} alt="" />}
      title="How far is up? · Phase 3"
    >
      <F3aBody />
    </StageScene>
  )
}

function F3aBody() {
  const navigate = useNavigate()
  const game = useGame()
  const { state, data, model } = game
  const [help, setHelp] = useState(false)
  const plan = model.flightPlan(state)
  const steps = [{ label: 'Translunar injection', dv: plan.tli.dv, chip: 'paid by the rocket', leg: LEG.tli, hint: BURN_HINT.tli, tli: true }].concat(
    plan.burns.map((burn) => ({ label: BURN_LABEL[burn.key] || shortLabel(burn.label), dv: burn.dv, chip: '', leg: LEG[burn.key], hint: BURN_HINT[burn.key] })),
  )
  const play = usePlayRun(3, state)
  const { run, frame } = play
  const [hover, setHover] = useState(null)
  // A burn is lit while it fires and stays lit once done. The Phase 3 run only flies these burns.
  const stepState = (step) => {
    if (!run || !frame || step.leg == null) return ''
    if (frame.leg === step.leg && run.status === 'running') return 'firing'
    return frame.leg >= step.leg ? 'done' : ''
  }
  const speech = f3Speech(state.difficulty, { crewed: state.missionType === 'crewed', margin: plan.margin, run })

  return (
    <div className={styles.screen}>
      <MissionHud />
      {speech ? (
        <div className={styles.speech}>
          <Bubble tone="speech">{speech}</Bubble>
        </div>
      ) : null}
      <Trajectory count={steps.length} distance={data.MOON.distanceKm} steps={steps} stepState={stepState} frame={frame} />
      <div className={f3.panel}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 3: Navigation and Delta-v · NASA Phases A, B, E</p>
          <h2 className={styles.question}>Flight plan</h2>
          <p className={f3.line}>Each burn changes your speed. Add them up: that is how much fuel the spacecraft needs.</p>
          <ol className={f3.burns}>
            {steps.map((step, index) => (
              <li
                key={step.label}
                className={`${f3.burn} ${step.tli ? f3.tliStep : ''} ${f3[stepState(step)] || ''}`}
                tabIndex={0}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(index)}
                onBlur={() => setHover(null)}
              >
                <span className={f3.num}>{index + 1}</span>
                <span className={f3.burnName}>
                  {step.label}
                  {step.chip ? <span className={f3.chip}>{step.chip}</span> : null}
                </span>
                <span className={f3.dv}>{model.fmt(step.dv)} m/s</span>
              </li>
            ))}
          </ol>
          <p className={f3.burnHint} aria-live="polite">{hover != null ? steps[hover].hint : 'Hover a burn to see what it does.'}</p>
          <p className={f3.total}>Spacecraft needs {model.fmt(plan.dvRequired)} m/s + margin</p>
          <FlyPlan plan={plan} play={play} />
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f2')}>← Crew</Button>
          <Button variant="secondary" onClick={() => setHelp(true)}>? Help</Button>
        </div>
        <DeltaVDock game={game} plan={plan} />
        <div className={`${styles.lock} ${f3.goLock}`}>
          <GoButton game={game} />
        </div>
      </div>
      <div className={styles.help}>
        <Modal open={help} variant="info" title={HELP_F3.title} onClose={() => setHelp(false)}>
          {HELP_F3.blocks.map((block) => (
            <p key={block.heading}><b>{block.heading}:</b> {block.text}</p>
          ))}
        </Modal>
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
    <div className={f3.wall} aria-hidden="true">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none">
        <path className={f3.arc} d="M 15 30 Q 50 2 85 30" />
      </svg>
      <span className={`${f3.body} ${f3.earth}`} />
      <span className={`${f3.body} ${f3.moon}`} />
      {nodes.map((node) => (
        <span key={node.n} className={`${f3.node} ${f3[`node_${stepState(steps[node.n - 1])}`] || ''}`} style={{ left: `${node.x}%`, top: `${(node.y / 40) * 100}%` }}>
          {node.n}
        </span>
      ))}
      {frame ? <span className={f3.ship} style={{ left: `${markerAt(frame, distance).left}%`, top: `${markerAt(frame, distance).top}%` }} /> : null}
      <span className={f3.distance}>{km} km (not to scale)</span>
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
    <div className={f3.dock} title="Delta-v: how much speed change your fuel buys">
      <div className={f3.meter}>
        <div className={f3.track}>
          <i style={{ width: `${fill}%` }} />
          <u style={{ left: `${need}%` }} />
        </div>
        <span className={f3.meterText}>
          {model.fmt(plan.dvPlanned)} / {model.fmt(plan.dvRequired)} m/s
        </span>
      </div>
      <div className={f3.marginsWrap} role="group" aria-label="Delta-v margin">
        <span className={f3.marginNote} title="Spare delta-v for navigation mistakes, hovering and the trip home — a little reserve is safer.">Margin (0–20%)</span>
        <div className={f3.margins}>
          {options.map((margin) => (
            <button
              key={margin}
              type="button"
              className={f3.margin}
              aria-pressed={plan.margin === margin}
              disabled={margin < minimum}
              title={margin < minimum ? 'Too small for this difficulty' : 'Spare delta-v for mistakes'}
              onClick={() => setMargin(margin)}
            >
              {Math.round(margin * 100)}%
            </button>
          ))}
        </div>
        <span className={`${f3.status} ${marginOk ? f3.ok : f3.bad}`}>
          {marginOk ? 'Enough margin' : 'Not enough margin'}
        </span>
      </div>
    </div>
  )
}

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
    <div className={f3.play}>
      <div className={f3.playRow}>
        <Button
          variant="outline"
          disabledReason={running ? 'Flying…' : ''}
          onClick={() => { setShowMath(false); play.play() }}
        >
          {run && run.status !== 'blocked' ? 'Fly again' : 'Fly the plan'}
        </Button>
        <div className={f3.reserve}>
          <span className={f3.reserveText}>Reserve {fmtDv(left)} m/s</span>
          <span className={f3.reserveTrack} aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
        </div>
      </div>
      {!run ? <p className={f3.note}>Fly each burn and see if your fuel is enough.</p> : null}
      {run && run.status === 'blocked' ? (
        <ul className={f3.log}>{res.blockers.map((b) => <li key={b.code}>{b.message}</li>)}</ul>
      ) : null}
      {running && last ? <p className={f3.note} aria-live="polite">{last.text}</p> : null}
      {done ? (
        <div className={`${styles.verdictBox} ${f3.verdictTight} ${res.ok ? styles.verdictOk : styles.verdictFail}`}>
          <p className={styles.verdictLine}>
            <b>{res.ok ? 'Test passed' : 'Test failed'}</b>
            <span className={f3.verdictAside}>
              {res.ok ? (
                <span aria-label={`${res.stars} of 3 stars`}>
                  {[0, 1, 2].map((i) => <span key={i} className={i < res.stars ? styles.starOn : styles.starOff} aria-hidden="true">★</span>)}
                </span>
              ) : null}
              {res.math ? (
                <button type="button" className={f3.link} onClick={() => setShowMath(true)}>Show the math</button>
              ) : null}
            </span>
          </p>
          <p className={res.failure ? styles.cause : styles.line}>
            {res.failure
              ? res.failure.cause
              : margin != null
                ? `Margin left: ${fmtDv(margin)} m/s — for hovering and the trip home.`
                : `Reserve left: ${fmtDv(left)} m/s.`}
          </p>
        </div>
      ) : null}
      {showMath && done && res.math ? (
        <Dialog title={res.math.title || 'The math'} onClose={() => setShowMath(false)}>
          <p className={f3.mathNote}>
            Isp is the engine's efficiency rating; exhaust velocity is how fast the exhaust shoots out.
            The rocket equation turns those and your total delta-v into the fuel you must load.
          </p>
          <MathBlock math={res.math} hideTitle />
        </Dialog>
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
