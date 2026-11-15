import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { useGame } from '../engine/useGame.jsx'
import { usePassed, usePlayRun } from '../engine/usePlayRun.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { RunPanel } from './F2.jsx'
import runStyles from './F2.module.css'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F4.module.css'
import { SceneHud } from './scene.jsx'
import scene from './scene.module.css'

const BACKGROUND = '/bg/bg-antena.png'
const CHARACTER = '/char/nina-chaqueta-libreta.png'
/* NASA Deep Space Network sites, one every 120 degrees so one always faces the Moon. Positions are on the drawn globe. */
const STATIONS = [
  { name: 'Goldstone', x: 22, y: 38 },
  { name: 'Madrid', x: 66, y: 30 },
  { name: 'Canberra', x: 78, y: 78 },
]
const LINK_NAMES = { sband: 'Basic radio', ka: 'Ka-band', laser: 'Laser link' }

export function F4() {
  const ready = usePhaseGuard('/f4')
  if (!ready) return null
  return (
    <StageScene
      background={BACKGROUND}
      character={<img className={styles.portrait} src={CHARACTER} alt="" />}
      title="How far is up? — Phase 4"
    >
      <F4Body />
    </StageScene>
  )
}

function F4Body() {
  const navigate = useNavigate()
  const { setModal } = usePlay()
  const game = useGame()
  const { state, model } = game
  const plan = model.commsPlan(state)
  const [math, setMath] = useState(false)
  const play = usePlayRun(4, state)
  const passed = usePassed(4, state)
  const [runMath, setRunMath] = useState(false)
  const runRes = play.run && play.run.res
  useEffect(() => { setRunMath(false) }, [runRes])

  return (
    <div className={scene.screen}>
      <SceneHud limits />
      <div className={styles.left}>
        <Globe frame={play.frame} />
        <Ping seconds={plan.roundTrip} />
      </div>
      <Beam frame={play.frame} />
      {play.run ? null : (
        <div className={`${scene.speech} ${styles.speech}`}>
          <Bubble tone="speech">How will anyone know what I found?</Bubble>
        </div>
      )}
      <div className={scene.panel}>
        <GlassPanel>
          <p className={scene.kicker}>Phase 4 · Communications</p>
          <h2 className={scene.title}>Choose a link</h2>
          <LinkChoices game={game} />
          <DishChoices game={game} laser={Boolean(plan.link && plan.link.optical)} />
          <LinkVerdict plan={plan} model={model} />
          <div className={styles.panelFoot}>
            <button type="button" className={styles.mathLink} aria-pressed={math} onClick={() => setMath(!math)}>
              {math ? 'Hide the math' : 'Show the math'}
            </button>
            <span className={styles.tag}>Game value</span>
          </div>
        </GlassPanel>
      </div>
      {math ? <MathPanel game={game} /> : null}
      <RunPanel eyebrow="Play · Mission timeline" label="Run the mission timeline" strip unitName="Hour" play={play} showMath={runMath} onMath={() => setRunMath((open) => !open)}>
        <BufferMeter res={runRes} frame={play.frame} />
      </RunPanel>
      {runMath && runRes && runRes.math ? (
        <div className={`${runStyles.runMath} ${styles.runMathLeft}`}><MathBlock math={runRes.math} /></div>
      ) : null}
      <div className={scene.dock}>
        <div className={scene.nav}>
          <Button variant="secondary" onClick={() => navigate('/f3a')}>← Flight plan</Button>
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
        <div className={scene.lock}>
          <ConfirmButton game={game} passed={passed} />
        </div>
      </div>
    </div>
  )
}

function Globe({ frame }) {
  const [cycle, setCycle] = useState(0)
  const driven = Boolean(frame)
  const up = driven && frame.linkUp > 0.5
  const active = driven ? (frame.station >= 0 ? Math.round(frame.station) : -1) : cycle
  useEffect(() => {
    if (driven) return undefined
    const timer = setInterval(() => setCycle((index) => (index + 1) % STATIONS.length), 2500)
    return () => clearInterval(timer)
  }, [driven])
  return (
    <div className={styles.card}>
      <div className={styles.globe} role="img" aria-label={active >= 0 ? `Deep Space Network. ${STATIONS[active].name} ${driven && !up ? 'sees the Moon but the link is down' : 'is in contact'}.` : 'Deep Space Network. No station can reach the spacecraft.'}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="48" />
          <ellipse cx="50" cy="50" rx="22" ry="48" />
          <path d="M 50 2 V 98 M 2 50 H 98 M 9 27 H 91 M 9 73 H 91" />
        </svg>
        {STATIONS.map((station, index) => (
          <span
            key={station.name}
            className={`${styles.station} ${index === active ? styles.live : ''}`}
            style={{ left: `${station.x}%`, top: `${station.y}%` }}
          >
            <i />
            {station.name}
          </span>
        ))}
      </div>
      <span className={styles.legend}><i className={`${styles.liveDot} ${driven && !up ? styles.dim : ''}`} /> {driven && !up ? 'No link' : 'In contact'}</span>
    </div>
  )
}

function Ping({ seconds }) {
  const [phase, setPhase] = useState('idle')
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const send = () => {
    clearTimeout(timer.current)
    setPhase('flying')
    timer.current = setTimeout(() => setPhase('back'), seconds * 1000)
  }
  return (
    <div className={`${styles.card} ${styles.ping}`}>
      <span>Ping · {seconds.toFixed(2)} s round trip</span>
      <button type="button" className={styles.pingButton} disabled={phase === 'flying'} onClick={send}>
        {phase === 'flying' ? 'Waiting for the echo…' : 'Send ping'}
      </button>
      <span className={styles.track} aria-hidden="true">
        <i key={phase} className={phase === 'flying' ? styles.flying : ''} style={{ animationDuration: `${seconds}s` }} />
      </span>
      <span className={styles.pingNote} aria-live="polite">
        {phase === 'back' ? `Echo back after ${seconds.toFixed(2)} s: light needs time to reach the Moon.` : ' '}
      </span>
    </div>
  )
}

function LinkChoices({ game }) {
  const { state, data, model, setComms } = game
  const type = state.missionType
  const current = state.comms || {}
  return (
    <div className={styles.options}>
      {data.COMMS.links.map((link, index) => {
        const preview = model.commsPlan({ ...state, comms: { link: link.id, dish: current.dish || 'dsn34' } })
        return (
          <button
            key={link.id}
            type="button"
            className={styles.option}
            aria-pressed={current.link === link.id}
            title={link.blurb}
            onClick={() => setComms({ link: link.id })}
          >
            <span className={styles.num}>{index + 1}</span>
            <span>
              {LINK_NAMES[link.id] || link.title} · +{model.fmt(link[type].power)} W · {model.fmt(preview.gbPerDay)} Gb
            </span>
          </button>
        )
      })}
    </div>
  )
}

function DishChoices({ game, laser }) {
  const { state, data, model, setComms } = game
  const current = state.comms || {}
  return (
    <div className={styles.dishes}>
      <span className={styles.label}>Ground antenna</span>
      {data.COMMS.dishes.map((dish) => (
        <button
          key={dish.id}
          type="button"
          className={styles.dish}
          aria-pressed={current.dish === dish.id}
          title={dish.blurb}
          onClick={() => setComms({ dish: dish.id })}
        >
          {dish.diameter} m · ${model.fmt(dish.cost[state.missionType])}M
        </button>
      ))}
      {laser ? <span className={styles.label}>A laser does not need the dish size</span> : null}
    </div>
  )
}

function LinkVerdict({ plan, model }) {
  if (!plan.link) return <p className={scene.note}>Gb = data you can send to Earth per day.</p>
  let text = `Sends ${model.fmt(plan.gbPerDay)} Gb a day · your science makes ${model.fmt(plan.needGbPerDay)} Gb`
  if (plan.bottleneck) text = `Bottleneck: you make ${model.fmt(plan.needGbPerDay)} Gb a day but send only ${model.fmt(plan.gbPerDay)} Gb`
  return (
    <>
      <p className={`${scene.note} ${plan.bottleneck ? styles.warn : ''}`}>{text}</p>
      {plan.weatherRisk ? <p className={`${scene.note} ${styles.warn}`}>Clouds over the ground station can block a laser.</p> : null}
    </>
  )
}

function MathPanel({ game }) {
  const math = game.model.commsMath(game.state)
  return (
    <div className={styles.help}>
      <GlassPanel>
        <p className={scene.kicker}>{math.title}</p>
        {math.steps.map((step) => (
          <p key={step.eq} className={scene.note}><b>{step.eq}</b> · {step.num}</p>
        ))}
        {math.check ? <p className={scene.note}>{math.check}</p> : null}
        <p className={scene.source}>Source: NASA Deep Space Network</p>
      </GlassPanel>
    </div>
  )
}

function ConfirmButton({ game, passed }) {
  const navigate = useNavigate()
  const { state, model, lockComms, setNotice } = game
  const check = model.validatePhase(state, 4)
  const blocker = check.issues.find((issue) => issue.severity === 'block')
  return (
    <Button
      variant="outline"
      disabled={Boolean(blocker)}
      disabledReason={blocker ? blocker.message : (passed ? '' : 'Pass the timeline test first')}
      onClick={() => {
        flushSync(() => {
          lockComms()
          setNotice('Radio link locked ✓')
        })
        navigate('/f3b')
      }}
    >
      Confirm link
    </Button>
  )
}

/* Dish beam from the antenna to the Moon in the scene, lit while the link is up. */
function Beam({ frame }) {
  if (!frame) return null
  const up = frame.linkUp > 0.5
  return (
    <svg className={styles.beam} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line className={up ? styles.beamOn : styles.beamOff} x1="43" y1="19" x2="56" y2="11.5" />
    </svg>
  )
}

function BufferMeter({ res, frame }) {
  if (!res || !res.ready || !frame) return null
  const max = (key) => (res.fields.find((f) => f.key === key) || {}).max || 1
  const pct = Math.max(0, Math.min(1, frame.buffer / max('buffer')))
  const full = pct >= 0.98
  return (
    <div className={styles.meter}>
      <div className={styles.meterRow}>
        <span>Onboard buffer {model0(frame.buffer)} of {model0(max('buffer'))} Gb</span>
      </div>
      <span className={styles.meterTrack} role="img" aria-label={`Buffer ${Math.round(pct * 100)} percent full`}>
        <span className={`${styles.meterFill} ${full ? styles.full : ''}`} style={{ width: `${pct * 100}%` }} />
      </span>
      <div className={styles.meterRow}>
        <span>Sent {model0(frame.delivered)} Gb</span>
        <span className={frame.lost > 0.05 ? styles.warn : ''}>Lost {model0(frame.lost)} Gb</span>
        <span>{frame.linkUp > 0.5 ? 'Link up' : (frame.station >= 0 ? 'Link down' : 'No station')}</span>
      </div>
    </div>
  )
}

const model0 = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
