import { useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { Stage } from '../components/stage/Stage.jsx'
import { useGame } from '../engine/useGame.jsx'
import { usePhaseGuard } from './frame.jsx'
import styles from './F3a.module.css'
import { SceneHud } from './scene.jsx'
import scene from './scene.module.css'

const BACKGROUND = '/bg/bg-control.png'
const CHARACTER = '/char/nina-chaqueta-portapapeles.png'

export function F3a() {
  const ready = usePhaseGuard('/f3a')
  if (!ready) return null
  return <F3aScreen />
}

function F3aScreen() {
  const navigate = useNavigate()
  const game = useGame()
  const { state, data, model } = game
  const plan = model.flightPlan(state)
  const steps = [{ label: 'Translunar injection', dv: plan.tli.dv, chip: 'Rocket upper stage' }].concat(
    plan.burns.map((burn) => ({ label: shortLabel(burn.label), dv: burn.dv, chip: '' })),
  )

  useEffect(() => {
    document.title = 'Space Syntax — Phase 3: Flight plan'
  }, [])

  return (
    <Stage background={BACKGROUND} character={<img className={styles.portrait} src={CHARACTER} alt="" />}>
      <div className={scene.screen}>
        <SceneHud />
        <Trajectory count={steps.length} distance={data.MOON.distanceKm} />
        <div className={`${scene.speech} ${styles.speech}`}>
          <Bubble tone="speech">
            {state.missionType === 'crewed' ? 'I need fuel for the trip home.' : 'Every burn costs fuel.'}
          </Bubble>
        </div>
        <div className={scene.panel}>
          <GlassPanel>
            <button type="button" className={scene.kicker} onClick={() => navigate('/f2')}>
              Phase 3 · Flight plan
            </button>
            <h2 className={scene.title}>Flight plan</h2>
            <ol className={styles.burns}>
              {steps.map((step, index) => (
                <li key={step.label} className={styles.burn}>
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
            <p className={scene.source}>Source: NASA Constellation studies</p>
          </GlassPanel>
        </div>
        <DeltaVDock game={game} plan={plan} />
        <div className={scene.lock}>
          <GoButton game={game} />
        </div>
      </div>
    </Stage>
  )
}

function Trajectory({ count, distance }) {
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
        <span key={node.n} className={styles.node} style={{ left: `${node.x}%`, top: `${(node.y / 40) * 100}%` }}>
          {node.n}
        </span>
      ))}
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
    <div className={`${scene.dock} ${styles.dock}`}>
      <span className={styles.dockLabel}>Delta-v</span>
      <div className={styles.meter}>
        <div className={styles.track}>
          <i style={{ width: `${fill}%` }} />
          <u style={{ left: `${need}%` }} />
        </div>
        <span className={styles.meterText}>
          Planned {model.fmt(plan.dvPlanned)} m/s · need {model.fmt(plan.dvRequired)}
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
      <span className={styles.tag}>Isp: Game value</span>
    </div>
  )
}

function GoButton({ game }) {
  const navigate = useNavigate()
  const { state, model, lockFlight, setNotice } = game
  const check = model.validatePhase(state, 3)
  const blocker = check.issues.find((issue) => issue.severity === 'block')
  return (
    <Button
      variant="outline"
      disabled={Boolean(blocker)}
      disabledReason={blocker ? blocker.message : ''}
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
