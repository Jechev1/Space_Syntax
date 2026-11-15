import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { descopeMode, useGame } from '../engine/useGame.jsx'
import { usePassed, usePlayRun } from '../engine/usePlayRun.jsx'
import { kgText, usdText } from './bits.jsx'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { MissionHud } from './f1Hud.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F1.module.css'
import shell from './shell.module.css'

const ROCKET_ART = {
  small: '/obj/cohete-pequeno.png',
  medium: '/obj/cohete-mediano.png',
  heavy: '/obj/cohete-grande.png',
  sls1: '/obj/cohete-mediano.png',
  sls1b: '/obj/cohete-grande.png',
  sls2: '/obj/cohete-grande.png',
}

export function rocketArt(id) {
  return ROCKET_ART[id] || ROCKET_ART.small
}

export function F1b() {
  const ready = usePhaseGuard('/f1b')
  if (!ready) return null
  return (
    <StageScene
      background="/bg/bg-plataforma.png"
      character={<img className={styles.girl} src="/char/nina-overol-llave.png" alt="" />}
      title="How far is up? — Phase 1"
    >
      <F1bBody />
    </StageScene>
  )
}

/* Compact verdict for a finished Play run: stars, cause, fix and the math. Also used by F3b. */
export function RunVerdict({ run }) {
  const [math, setMath] = useState(false)
  const box = useRef(null)
  const done = Boolean(run && run.status === 'done')
  useEffect(() => { if (done && box.current) box.current.scrollIntoView({ block: 'nearest' }) }, [done])
  if (!run || run.status !== 'done') return null
  const { res } = run
  return (
    <div ref={box} className={`${styles.verdictBox} ${res.ok ? styles.verdictOk : styles.verdictFail}`}>
      <p className={styles.verdictLine}>
        <b>{res.ok ? 'Test passed' : 'Test failed'}</b>
        {res.ok ? (
          <span aria-label={`${res.stars} of 3 stars`}>
            {[0, 1, 2].map((i) => <span key={i} className={i < res.stars ? styles.starOn : styles.starOff} aria-hidden="true">★</span>)}
          </span>
        ) : null}
      </p>
      {res.failure ? (
        <>
          <p className={styles.cause}>{res.failure.cause}</p>
          <p className={styles.fix}>Try this: {res.failure.fix}</p>
        </>
      ) : null}
      {res.math ? (
        <button type="button" className={styles.mathToggle} aria-expanded={math} onClick={() => setMath((v) => !v)}>
          {math ? 'Hide the math' : 'Show the math'}
        </button>
      ) : null}
      {math ? <MathBlock math={res.math} /> : null}
    </div>
  )
}

function confirmReason(state, report, data, model, passed) {
  const list = data.ROCKETS[state.missionType] || []
  const fitsAny = list.some((item) => item.capacity >= report.tli)
  if (!state.rocket) return fitsAny ? 'Pick a rocket that can lift your spacecraft' : 'No rocket can lift this — make your spacecraft lighter'
  if (report.totalCost > report.budget) return `Over budget by ${usdText(model, report.totalCost - report.budget)}`
  if (!passed) return 'Pass the launch test first'
  return ''
}

function F1bBody() {
  const navigate = useNavigate()
  const { state, data, model, pickRocket, applyDescope, lockDesign, setNotice } = useGame()
  const { setModal } = usePlay()
  const play = usePlayRun(1, state)
  const passed = usePassed(1, state)
  const { run, frame } = play
  const running = Boolean(run && run.status === 'running')
  const report = model.evaluate(state)
  if (!report) return <p className={shell.note}>Pick a mission first.</p>
  const rockets = data.ROCKETS[state.missionType] || []
  const fitsAny = rockets.some((item) => item.capacity >= report.tli)
  const mode = descopeMode(state)
  const needDescope = !fitsAny || (state.rocket && report.totalCost > report.budget)
  const suggestions = needDescope ? model.descopeSuggestions(state, mode) : []
  const reason = confirmReason(state, report, data, model, passed)

  return (
    <div className={`${styles.screen} ${styles.pad}`}>
      <MissionHud />
      <div className={styles.speech}>
        <Bubble tone="speech">Which one can lift us?</Bubble>
      </div>
      <div className={styles.pads} role="group" aria-label="Rockets">
        {rockets.map((rocket) => (
          <RocketStation
            key={rocket.id}
            rocket={rocket}
            report={report}
            selected={state.rocket === rocket.id}
            onPick={() => pickRocket(rocket.id)}
            frame={state.rocket === rocket.id ? frame : null}
            burning={state.rocket === rocket.id && running}
            onLocked={() => setNotice('Too heavy for this rocket. Make your spacecraft lighter or pick a bigger one.')}
          />
        ))}
      </div>
      <div className={styles.panel}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 1 · Launch pad</p>
          <h2 className={styles.question}>Pick your rocket</h2>
          <p className={styles.line}>Hardware + Fuel = Rocket must lift</p>
          <dl className={styles.stats}>
            <div><dt>Spacecraft</dt><dd>{usdText(model, report.cost)}</dd></div>
            <div><dt>Rocket</dt><dd>{report.rocket ? usdText(model, report.rocket.cost) : '—'}</dd></div>
            <div className={styles.total}>
              <dt>Total</dt>
              <dd>{usdText(model, report.totalCost)} / {usdText(model, report.budget)}</dd>
            </div>
          </dl>
          <div className={styles.test}>
            <p className={styles.line}>Launch test: the upper stage must add <b>3,150 m/s</b>.</p>
            <Button
              variant="outline"
              disabledReason={running ? 'Running…' : (state.rocket ? '' : 'Pick a rocket first')}
              onClick={() => play.play()}
            >
              {run && run.status !== 'blocked' ? 'Test again' : 'Launch test'}
            </Button>
            {run && run.status === 'blocked' ? (
              <ul className={styles.blockers}>{run.res.blockers.map((b) => <li key={b.code}>{b.message}</li>)}</ul>
            ) : null}
            {run && run.res.ready && run.status !== 'blocked' ? (
              <div className={styles.dvRow} role="img" aria-label={`Speed gained ${Math.round(frame ? frame.dv : 0)} of 3,150 metres per second`}>
                <span>Speed gained</span>
                <span>{Math.round(frame ? frame.dv : 0).toLocaleString('en-US')} m/s</span>
                <span className={styles.dvTrack} aria-hidden="true"><span className={styles.dvFill} style={{ width: `${Math.min(1, (frame ? frame.dv : 0) / 3150) * 100}%` }} /></span>
              </div>
            ) : null}
            <RunVerdict run={run} />
          </div>
          {needDescope ? (
            <div className={styles.trim}>
              <p className={styles.trimTitle}>{mode === 'cost' ? 'Over budget? Trim the design' : 'Too heavy? Trim the design'}</p>
              {suggestions.map((item, index) => (
                <button key={`${item.label}-${index}`} type="button" className={styles.trimRow} onClick={() => applyDescope(index)}>
                  <span>{item.label}</span>
                  <span className={styles.trimNote}>{trimNote(item, mode, report.budget, rockets, model)}</span>
                </button>
              ))}
            </div>
          ) : null}
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f1a')}>← Workshop</Button>
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
        <div className={styles.lock}>
          <Button
            variant="outline"
            disabledReason={reason}
            onClick={() => {
              flushSync(() => {
                lockDesign()
                setNotice('Spacecraft design locked ✓')
              })
              navigate('/f1done')
            }}
          >
            Confirm spacecraft
          </Button>
        </div>
      </div>
    </div>
  )
}

function RocketStation({ rocket, report, selected, onPick, onLocked, frame, burning }) {
  const { model } = useGame()
  const fits = rocket.capacity >= report.tli
  const fill = report.tli / rocket.capacity
  const margin = (rocket.capacity - report.tli) / rocket.capacity
  const over = fits && report.cost + rocket.cost > report.budget
  const tons = (rocket.capacity / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })
  let verdict = `Fits · ${model.fmt(margin * 100)}% margin`
  let tone = styles.good
  if (!fits) {
    verdict = `Too heavy by ${kgText(model, report.tli - rocket.capacity)}`
    tone = styles.bad
  } else if (over) {
    verdict = 'Fits · over budget'
    tone = styles.tight
  } else if (margin < 0.1) {
    verdict = `Fits, only ${model.fmt(margin * 100)}% margin`
    tone = styles.tight
  }
  const lift = frame ? Math.min(1, frame.dv / 3150) : 0
  const cls = [styles.station, tone, selected ? styles.stationOn : ''].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={cls}
      aria-pressed={selected}
      aria-disabled={!fits || undefined}
      onClick={() => (fits ? onPick() : onLocked())}
    >
      <span className={styles.rocketRow}>
        {burning ? <span className={styles.flame} style={{ '--k': lift }} aria-hidden="true" /> : null}
        <img className={fits ? styles.rocketArt : `${styles.rocketArt} ${styles.rocketOver}`} style={frame ? { '--k': lift } : undefined} data-lift={frame ? '' : undefined} src={rocketArt(rocket.id)} alt="" />
        <LoadGauge fill={fill} fits={fits} />
      </span>
      <span className={styles.tag}>
        <span>{rocket.title} · {tons} t</span>
        <span>{usdText(model, rocket.cost)} · <b>{verdict}</b></span>
      </span>
    </button>
  )
}

function LoadGauge({ fill, fits }) {
  const ratio = Number.isFinite(fill) ? Math.max(0, fill) : 0
  const height = Math.min(ratio, 1) * 100
  return (
    <span className={fits ? styles.gauge : `${styles.gauge} ${styles.gaugeOver}`} aria-hidden="true">
      <span className={styles.gaugeFill} style={{ height: `${height}%` }} />
      {fits ? null : <span className={styles.gaugeAlarm} />}
    </span>
  )
}

function trimNote(item, mode, budget, rockets, model) {
  const parts = []
  if (item.saves > 0.5) parts.push(`−${kgText(model, item.saves)}`)
  if (item.costSaves > 0) parts.push(`−${usdText(model, item.costSaves)}`)
  if (item.costSaves < 0) parts.push(`+${usdText(model, -item.costSaves)}`)
  if (mode === 'cost') {
    const left = item.after.totalCost - budget
    parts.push(left <= 0 ? 'fixes the budget' : `still ${usdText(model, left)} over`)
  } else {
    const maxCap = Math.max(...rockets.map((rocket) => rocket.capacity))
    parts.push(item.after.tli <= maxCap ? 'fits a rocket' : `still ${kgText(model, item.after.tli - maxCap)} too heavy`)
  }
  return parts.join(' · ')
}
