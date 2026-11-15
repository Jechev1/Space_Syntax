import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Dialog } from '../components/ui/Dialog.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { useGame } from '../engine/useGame.jsx'
import { usePassed, usePlayRun } from '../engine/usePlayRun.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { RunPanel } from './F2.jsx'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { f4Speech } from './f4Speech.mjs'
import styles from './F4.module.css'
import scene from './scene.module.css'

const BACKGROUND = '/bg/bg-antena.png'
const CHARACTER = '/char/nina-chaqueta-libreta.png'
/* NASA Deep Space Network sites, one every 120 degrees so one always faces the Moon. Positions are on the drawn globe. */
const STATIONS = [
  { name: 'Goldstone', x: 20, y: 48 },
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
      title="How far is up? · Phase 4: Communications"
    >
      <F4Body />
    </StageScene>
  )
}

function F4Body() {
  const navigate = useNavigate()
  const game = useGame()
  const { state, model } = game
  const plan = model.commsPlan(state)
  const [help, setHelp] = useState(false)
  const play = usePlayRun(4, state)
  const passed = usePassed(4, state)
  const runRes = play.run && play.run.res
  // The math opens in a popup, like Phase 1: 'link' for the comms math, 'run' for the timeline result.
  const [mathOpen, setMathOpen] = useState(null)
  useEffect(() => { setMathOpen((open) => (open === 'run' ? null : open)) }, [runRes])
  const linkMath = model.commsMath(state)
  const broken = designBroken(state, model)
  /*
   * After a run the link choices fold into a one-line summary, so the link panel and the run result fit the
   * column without scrolling. "Change link" opens the choices again and hides the result until the player
   * keeps the link or picks a new one (a new design clears the run, which ends the editing).
   */
  const [editing, setEditing] = useState(false)
  useEffect(() => { if (!play.run) setEditing(false) }, [play.run])
  const compact = Boolean(play.run) && !editing
  const speech = f4Speech(state.difficulty, {
    need: model.fmt(plan.needGbPerDay),
    gb: model.fmt(plan.gbPerDay),
    link: Boolean(plan.link),
    dish: Boolean(plan.dish),
    laser: Boolean(plan.link && plan.link.optical),
    bottleneck: plan.bottleneck,
    weather: plan.weatherRisk,
    broken: Boolean(broken),
    passed,
    run: runView(play.run),
  })

  return (
    <div className={scene.screen}>
      <F4Hud />
      <div className={styles.left}>
        <Globe frame={play.frame} />
        <Ping seconds={plan.roundTrip} />
      </div>
      <Beam frame={play.frame} />
      <div className={`${scene.speech} ${styles.speech}`}>
        <Bubble tone="speech">{speech}</Bubble>
      </div>
      <div className={styles.side}>
        <GlassPanel>
          <p className={scene.kicker}>Phase 4: Communications</p>
          <h2 className={scene.title}>{compact ? 'Your link' : 'Choose a link'}</h2>
          {compact ? <LinkSummary plan={plan} /> : (
            <>
              {/* Once a link is picked, the verdict line under the list repeats this need next to what it sends. */}
              {plan.link ? null : (
                <p className={scene.note}>
                  Your science makes <b>{model.fmt(model.dataNeedPerDay(state))} Gb a day</b>. Pick a link that sends at least that much.
                </p>
              )}
              <LinkChoices game={game} />
              <DishChoices game={game} laser={Boolean(plan.link && plan.link.optical)} />
            </>
          )}
          <LinkVerdict plan={plan} model={model} />
          {broken ? <BrokenDesign reason={broken} /> : null}
          <div className={styles.panelFoot}>
            <Button variant="outline" onClick={() => setMathOpen('link')}>Show the math</Button>
            {/* Shown only after a run: change the link, or keep it and go back to the result. */}
            {compact ? <button type="button" className={styles.pill} onClick={() => setEditing(true)}><span>Change link</span></button> : null}
            {editing ? <button type="button" className={styles.pill} onClick={() => setEditing(false)}><span>Keep this link</span></button> : null}
          </div>
        </GlassPanel>
        {editing ? null : (
          <RunPanel eyebrow="Play · Mission timeline" label="Run the mission timeline" unitName="Hour" play={play} showMath={false} onMath={() => setMathOpen('run')} />
        )}
      </div>
      {runRes && runRes.ready ? (
        <div className={styles.strip}>
          <p className={styles.stripTitle}>Play · Mission timeline</p>
          <BufferMeter res={runRes} frame={play.frame} />
        </div>
      ) : null}
      {mathOpen === 'link' ? (
        <Dialog title={linkMath.title || 'The math'} onClose={() => setMathOpen(null)}>
          <MathBlock math={{ ...linkMath, title: null }}>
            <p className={scene.source}>Source: NASA Deep Space Network</p>
          </MathBlock>
        </Dialog>
      ) : null}
      {mathOpen === 'run' && runRes && runRes.math ? (
        <Dialog title="Mission timeline: real math" onClose={() => setMathOpen(null)}>
          <MathBlock math={{ ...runRes.math, title: null }} />
        </Dialog>
      ) : null}
      <div className={scene.dock}>
        <div className={scene.nav}>
          <Button variant="secondary" onClick={() => navigate('/f3a')}>← Flight plan</Button>
          <Button variant="secondary" onClick={() => setHelp(true)}>? Help</Button>
        </div>
        <div className={scene.lock}>
          <ConfirmButton game={game} passed={passed} />
        </div>
      </div>
      <Modal open={help} variant="info" title="Phase 4: Communications" onClose={() => setHelp(false)}>
        <p>Phase 4 picks how your spacecraft talks to Earth: a radio link on board and an antenna of NASA's Deep Space Network on the ground.</p>
        <p>Your science makes data every day. The link has to send at least that much, or data piles up in the onboard buffer and is lost when it fills.</p>
        <p>A faster link or a bigger dish sends more, but adds power, mass and cost. Run the mission timeline to test it, then confirm the link before the launch.</p>
      </Modal>
    </div>
  )
}

/*
 * Top bar for Phase 4: place, launch mass, budget and power. It is the shared HUD without the Data cell,
 * which stays at 0 Gb until the spacecraft flies and tells nothing here.
 */
function F4Hud() {
  const { state, model } = useGame()
  const hud = model.hud(state)
  const fmt = model.fmt
  return (
    <div className={`${scene.hud} ${styles.hud}`} aria-label="Mission status">
      <span>Earth</span>
      <span>Launch mass {fmt(hud.launchMass)} / {hud.capacity == null ? '—' : fmt(hud.capacity)} kg</span>
      <span>Budget ${fmt(hud.cost)}M / ${fmt(hud.budget)}M</span>
      <span>Power {fmt(hud.powerNeed)} / {fmt(hud.powerGen)} W</span>
    </div>
  )
}

/** Run state in the words f4Speech uses. */
function runView(run) {
  if (!run) return ''
  if (run.status === 'running') return 'running'
  if (run.status === 'done') return run.res.ok ? 'passed' : 'failed'
  return ''
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
  const need = model.dataNeedPerDay(state)
  return (
    <div className={styles.options}>
      {data.COMMS.links.map((link, index) => {
        const preview = model.commsPlan({ ...state, comms: { link: link.id, dish: current.dish || 'dsn34' } })
        const enough = preview.gbPerDay >= need
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
            <span className={styles.optionText}>
              <span>{LINK_NAMES[link.id] || link.title} · {model.fmt(preview.gbPerDay)} Gb a day</span>
              <span className={styles.optionRow}>
                <span className={styles.optionMeta}>
                  +{model.fmt(link[type].power)} W · +{model.fmt(link[type].mass)} kg · ${model.fmt(link[type].cost)}M
                </span>
                <span className={`${styles.fit} ${enough ? styles.fitOk : styles.fitShort}`}>{enough ? 'Enough' : 'Too slow'}</span>
              </span>
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
      <span className={styles.label}>Antenna</span>
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

/* The chosen link and antenna on one row, shown after a run instead of the full lists. */
function LinkSummary({ plan }) {
  const { state, model } = useGame()
  const type = state.missionType
  const link = plan.link
  if (!link) return null
  const name = LINK_NAMES[link.id] || link.title
  return (
    <p className={styles.summary}>
      <span className={styles.summaryName}>{name}{plan.dish ? ` · ${plan.dish.diameter} m antenna` : ''}</span>
      <span className={styles.optionMeta}>
        +{model.fmt(link[type].power)} W · +{model.fmt(link[type].mass)} kg · ${model.fmt(link[type].cost + (plan.dish ? plan.dish.cost[type] : 0))}M
      </span>
    </p>
  )
}

function LinkVerdict({ plan, model }) {
  // Before a pick, the note above the list already says how much data the science makes.
  if (!plan.link) return null
  let text = `Sends ${model.fmt(plan.gbPerDay)} Gb a day · your science makes ${model.fmt(plan.needGbPerDay)} Gb`
  if (plan.bottleneck) text = `Bottleneck: you make ${model.fmt(plan.needGbPerDay)} Gb a day but send only ${model.fmt(plan.gbPerDay)} Gb`
  return (
    <>
      <p className={`${scene.note} ${plan.bottleneck ? styles.warn : ''}`}>{text}</p>
      {plan.weatherRisk ? <p className={`${scene.note} ${styles.warn}`}>Clouds over the ground station can block a laser.</p> : null}
    </>
  )
}

/**
 * A heavier or pricier link can break Phase 1 (the engine drops the rocket). The Phase 4 check alone does
 * not see that, so the screen asks Phase 1 too and sends the player there instead of a silent jump.
 */
function designBroken(state, model) {
  if (state.rocket && state.phase1Done) return null
  const issue = model.validatePhase(state, 1).issues.find((item) => item.severity === 'block')
  return issue ? issue.message : 'Your spacecraft needs a new check in Phase 1'
}

function BrokenDesign({ reason }) {
  const navigate = useNavigate()
  return (
    <div className={styles.broken} role="alert">
      <p className={`${scene.note} ${styles.warn}`}>This link changed your spacecraft: {reason}.</p>
      <Button variant="outline" onClick={() => navigate('/f1b')}>Fix it in Phase 1</Button>
    </div>
  )
}

function ConfirmButton({ game, passed }) {
  const navigate = useNavigate()
  const { state, model, lockComms, setNotice } = game
  const check = model.validatePhase(state, 4)
  const blocker = check.issues.find((issue) => issue.severity === 'block')
  const broken = designBroken(state, model)
  let reason = ''
  if (blocker) reason = blocker.message
  else if (broken) reason = 'Fix your spacecraft in Phase 1 first'
  else if (!passed) reason = 'Pass the timeline test first'
  return (
    <Button
      variant="outline"
      disabled={Boolean(blocker || broken)}
      disabledReason={reason}
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
