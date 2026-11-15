import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { Stage } from '../components/stage/Stage.jsx'
import { useGame } from '../engine/useGame.jsx'
import { usePhaseGuard } from './frame.jsx'
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
  return <F4Screen />
}

function F4Screen() {
  const navigate = useNavigate()
  const game = useGame()
  const { state, model } = game
  const plan = model.commsPlan(state)
  const [help, setHelp] = useState(false)

  useEffect(() => {
    document.title = 'Space Syntax — Phase 4: Communications'
  }, [])

  return (
    <Stage background={BACKGROUND} character={<img className={styles.portrait} src={CHARACTER} alt="" />}>
      <div className={scene.screen}>
        <SceneHud limits />
        <div className={styles.left}>
          <Globe />
          <Ping seconds={plan.roundTrip} />
        </div>
        <div className={`${scene.speech} ${styles.speech}`}>
          <Bubble tone="speech">How will anyone know what I found?</Bubble>
        </div>
        <div className={scene.panel}>
          <GlassPanel>
            <p className={scene.kicker}>Phase 4 · Communications</p>
            <h2 className={scene.title}>Choose a link</h2>
            <LinkChoices game={game} />
            <DishChoices game={game} laser={Boolean(plan.link && plan.link.optical)} />
            <LinkVerdict plan={plan} model={model} />
            <span className={styles.tag}>Game value</span>
          </GlassPanel>
        </div>
        {help ? <HelpPanel game={game} /> : null}
        <div className={styles.footer}>
          <Button variant="outline" onClick={() => navigate('/f3a')}>Back</Button>
          <Button variant="outline" aria-pressed={help} onClick={() => setHelp(!help)}>Help</Button>
        </div>
        <div className={scene.lock}>
          <ConfirmButton game={game} />
        </div>
      </div>
    </Stage>
  )
}

function Globe() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setActive((index) => (index + 1) % STATIONS.length), 2500)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className={styles.card}>
      <div className={styles.globe} role="img" aria-label={`Deep Space Network. ${STATIONS[active].name} is in contact.`}>
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
      <span className={styles.legend}><i className={styles.liveDot} /> In contact</span>
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

function HelpPanel({ game }) {
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

function ConfirmButton({ game }) {
  const navigate = useNavigate()
  const { state, model, lockComms, setNotice } = game
  const check = model.validatePhase(state, 4)
  const blocker = check.issues.find((issue) => issue.severity === 'block')
  return (
    <Button
      variant="outline"
      disabled={Boolean(blocker)}
      disabledReason={blocker ? blocker.message : ''}
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
