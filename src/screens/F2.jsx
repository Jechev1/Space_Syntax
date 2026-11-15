import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { useGame } from '../engine/useGame.jsx'
import { usePassed, usePlayRun } from '../engine/usePlayRun.jsx'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F2.module.css'
import { FoodIcon, OxygenIcon, SceneHud, WaterIcon } from './scene.jsx'
import scene from './scene.module.css'

const BACKGROUND = '/bg/bg-preparacion.png'
const CHARACTER = '/char/nina-chaqueta-portapapeles.png'
const SUIT_NAMES = { light: 'Light', lunar: 'Lunar', heavy: 'Heavy' }

export function F2() {
  const ready = usePhaseGuard('/f2')
  if (!ready) return null
  return (
    <StageScene
      background={BACKGROUND}
      character={<img className={scene.girl} src={CHARACTER} alt="" />}
      title="How far is up? — Phase 2"
    >
      <F2Body />
    </StageScene>
  )
}

function F2Body() {
  const navigate = useNavigate()
  const game = useGame()
  const { setModal } = usePlay()
  const { state, data, model, ensureCrew } = game
  const crewed = state.missionType === 'crewed'
  const life = crewed ? model.lifeSupport(state) : null
  const play = usePlayRun(2, state)
  const passed = usePassed(2, state)
  const [showMath, setShowMath] = useState(false)
  const runRes = play.run && play.run.res
  useEffect(() => { setShowMath(false) }, [runRes])

  useEffect(() => {
    if (crewed && !state.crew) ensureCrew()
  }, [crewed, state.crew, ensureCrew])

  if (crewed && !life) return null

  return (
    <div className={scene.screen}>
      <SceneHud />
      {play.run ? null : (
        <div className={scene.speech}>
          <Bubble tone="speech">{crewed ? 'Every day adds mass.' : 'No crew, no groceries!'}</Bubble>
        </div>
      )}
      <SupplyShelf play={play} />
      <RunPanel
        title="Run the mission days"
        label="Play"
        play={play}
        showMath={showMath}
        onMath={() => setShowMath((open) => !open)}
        left
      />
      {showMath && runRes && runRes.math ? (
        <div className={styles.runMath}><MathBlock math={runRes.math} /></div>
      ) : null}
      <div className={scene.panel}>
        <GlassPanel>
          <p className={scene.kicker}>Phase 2 · Crew and life support</p>
          {crewed ? <CrewPlan game={game} life={life} /> : <NoCrew data={data} model={model} />}
        </GlassPanel>
      </div>
      <div className={scene.dock}>
        <div className={scene.nav}>
          <Button variant="secondary" onClick={() => navigate('/f1done')}>← Phase 1</Button>
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
        <div className={scene.lock}>
          <ConfirmButton game={game} crewed={crewed} passed={passed} />
        </div>
      </div>
    </div>
  )
}

function CrewPlan({ game, life }) {
  const { state, data, model, setCrew } = game
  const L = data.LIFE
  const fmt = model.fmt
  const minDays = model.minDays() + ((state.events && state.events.extraDays) || 0)
  const reserveOn = life.reserve > 0
  const suitId = state.crew && state.crew.suit

  return (
    <>
      <div className={styles.row}>
        <span>Crew size</span>
        <span className={styles.stepper}>
          <button
            type="button"
            aria-label="Fewer astronauts"
            disabled={life.size <= L.crewMin}
            onClick={() => setCrew({ size: life.size - 1 })}
          >
            −
          </button>
          <b>{life.size}</b>
          <button
            type="button"
            aria-label="More astronauts"
            disabled={life.size >= L.crewMax}
            onClick={() => setCrew({ size: life.size + 1 })}
          >
            +
          </button>
        </span>
      </div>
      <p className={scene.note}>{life.landingCrew} land on the Moon, {life.orbitCrew} wait in orbit</p>

      <div className={styles.slider}>
        <div className={styles.row}>
          <label htmlFor="f2-days">Mission days</label>
          <b>{life.days}</b>
        </div>
        <input
          id="f2-days"
          type="range"
          min={minDays}
          max={L.daysMax}
          value={Math.max(life.days, minDays)}
          aria-describedby="f2-days-help"
          onChange={(event) => setCrew({ days: Number(event.target.value) })}
        />
        <p className={scene.note} id="f2-days-help">
          Artemis II: nearly 10 days · min {minDays}
        </p>
      </div>

      <button
        type="button"
        className={styles.toggle}
        aria-pressed={reserveOn}
        onClick={() => setCrew({ reserve: reserveOn ? 0 : 0.2 })}
      >
        <span>Safety reserve</span>
        <span>{reserveOn ? 'On (+20%)' : 'Off'} <i>(Game value)</i></span>
      </button>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={life.recycler}
        onClick={() => setCrew({ recycler: !life.recycler })}
      >
        <span>Water recycler</span>
        <span>{life.recycler ? 'On' : 'Off'} <i>({fmt(L.recycler.mass)} kg)</i></span>
      </button>

      <div className={styles.supplies}>
        <div className={styles.supply}><span><OxygenIcon />Oxygen</span><span>{fmt(life.o2)} kg</span></div>
        <div className={styles.supply}><span><FoodIcon />Dry food</span><span>{fmt(life.food)} kg</span></div>
        <div className={styles.supply}>
          <span><WaterIcon />Potable water</span>
          <span>{fmt(life.water)} kg{life.recycler ? ` (−${fmt(life.waterSaved)})` : ''}</span>
        </div>
      </div>

      <p className={styles.label}>Moonwalk suit · {life.landingCrew} needed</p>
      <div className={styles.suits}>
        {L.suits.map((suit) => (
          <button
            key={suit.id}
            type="button"
            className={styles.suit}
            aria-pressed={suitId === suit.id}
            title={suit.blurb}
            onClick={() => setCrew({ suit: suit.id })}
          >
            <b>{SUIT_NAMES[suit.id] || suit.title}</b>
            <span>{fmt(suit.mass)} kg · {suit.evaHours} h</span>
          </button>
        ))}
      </div>

      <p className={scene.source}>Source: NASA BVAD, Table 3-31</p>
    </>
  )
}

function NoCrew({ data, model }) {
  const pd = data.LIFE.perCrewDay
  const example = 4 * 10 * (pd.o2 + pd.food + pd.water)
  return (
    <>
      <h2 className={scene.title}>Robots do not eat</h2>
      <p className={scene.text}>
        Robots do not breathe, eat or drink. Your lander skips this phase and keeps all that mass for science.
      </p>
      <p className={scene.note}>
        A crew of 4 on a 10-day trip would need about {model.fmt(example)} kg of oxygen, food and water, before
        counting the astronauts, their suits and the fuel to carry it all.
      </p>
      <p className={scene.source}>Source: NASA BVAD, Table 3-31</p>
    </>
  )
}

function ConfirmButton({ game, crewed, passed }) {
  const navigate = useNavigate()
  const { state, model, lockCrew, setNotice } = game
  const check = model.validatePhase(state, 2)
  const blocker = check.issues.find((issue) => issue.severity === 'block')
  return (
    <Button
      variant="outline"
      disabled={Boolean(blocker)}
      disabledReason={blocker ? blocker.message : (passed ? '' : 'Pass the mission days test first')}
      onClick={() => {
        flushSync(() => {
          lockCrew()
          setNotice(crewed ? 'Crew plan locked ✓' : 'Phase 2 done ✓')
        })
        navigate('/f3a')
      }}
    >
      {crewed ? 'Confirm crew' : 'Continue'}
    </Button>
  )
}

const fmtN = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const VERDICT = { success: 'Passed', partial: 'Passed, barely', fail: 'Failed' }

/* Verdict, stars, failure cause and fix, and the math toggle. Shared with F4. Draws only what the SimResult carries. */
export function RunVerdict({ res, showMath, onMath }) {
  const mathButton = (
    <button type="button" className={styles.mathLink} aria-expanded={showMath} onClick={onMath}>
      {showMath ? 'Hide the math' : 'Show the math'}
    </button>
  )
  return (
    <div className={`${styles.verdict} ${res.ok ? styles.okBox : styles.failBox}`}>
      <p className={styles.verdictLine}>
        <b>{VERDICT[res.outcome] || res.outcome}</b>
        {res.math && !res.ok ? mathButton : null}
        {res.ok ? (
          <span aria-label={`${res.stars} of 3 stars`}>
            {[0, 1, 2].map((i) => <span key={i} className={i < res.stars ? styles.starOn : styles.starOff} aria-hidden="true">★</span>)}
          </span>
        ) : null}
      </p>
      {res.ok && res.score && res.score.unit === '%' ? <p className={styles.clock}>{res.score.label}: {fmtN(res.score.value, 1)}%</p> : null}
      {res.failure ? (
        <>
          <p className={styles.cause}>{res.failure.cause}</p>
          <p className={styles.fix}>Try this: {res.failure.fix}</p>
        </>
      ) : null}
      {res.math && res.ok ? mathButton : null}
    </div>
  )
}

/* Compact Play card: button, the latest event, then the verdict. The clock and live meters (children) sit in the panel,
   or in a strip over the scene when strip is set. */
export function RunPanel({ title, eyebrow = 'Play', label, play, showMath, onMath, children, left = false, strip = false, unitName = 'Day' }) {
  const { run, events } = play
  const res = run && run.res
  const running = run && run.status === 'running'
  const done = run && run.status === 'done'
  const last = events.length ? events[events.length - 1] : null
  const total = res && res.time ? res.time.total : 0
  const ready = Boolean(res && res.ready)
  const clock = ready ? (
    <p className={styles.clock}>{unitName} {fmtN(run.t, run.t < 10 ? 1 : 0)} of {fmtN(total, total < 10 ? 1 : 0)}</p>
  ) : null
  return (
    <>
      {strip && ready ? <div className={styles.shelf}>{eyebrow ? <p className={styles.clock}>{eyebrow}</p> : null}{clock}{children}</div> : null}
      <div className={`${styles.runPanel} ${left ? styles.runLeft : styles.runRight}`}>
        <GlassPanel eyebrow={strip && ready ? '' : eyebrow} title={title}>
          <Button variant="outline" disabledReason={running ? 'Running...' : ''} onClick={() => play.play()}>
            {run && run.status !== 'blocked' ? 'Play again' : label}
          </Button>
          {run && run.status === 'blocked' ? (
            <ul className={styles.blockers}>{res.blockers.map((b) => <li key={b.code}>{b.message}</li>)}</ul>
          ) : null}
          {ready ? (
            <>
              {strip ? null : clock}
              {strip ? null : children}
              {done && res.failure ? null : <p className={`${styles.event} ${last && styles[last.kind] ? styles[last.kind] : ''}`} aria-live="polite">{last ? last.text : ' '}</p>}
            </>
          ) : null}
          {done ? <RunVerdict res={res} showMath={showMath} onMath={onMath} /> : null}
        </GlassPanel>
      </div>
    </>
  )
}

/* Supply levels drawn over the shelf in the scene. */
function SupplyShelf({ play }) {
  const { run, frame } = play
  const res = run && run.res
  if (!res || !res.ready || !frame) return null
  const max = (key) => (res.fields.find((f) => f.key === key) || {}).max || 1
  const items = [
    { key: 'o2', label: 'Oxygen', icon: <OxygenIcon /> },
    { key: 'food', label: 'Food', icon: <FoodIcon /> },
    { key: 'water', label: 'Water', icon: <WaterIcon /> },
  ].filter((item) => res.fields.some((f) => f.key === item.key))
  if (!items.length) return null
  const ashore = Math.round(frame.ashore || 0)
  return (
    <div className={styles.shelf} role="group" aria-label="Supplies left">
      <div className={styles.tubes}>
        {items.map((item) => {
          const v = Math.max(0, frame[item.key])
          const pct = Math.max(0, Math.min(1, v / max(item.key)))
          return (
            <div className={styles.tube} key={item.key}>
              <span className={styles.tubeBody} aria-hidden="true">
                <span className={`${styles.tubeFill} ${pct < 0.15 ? styles.low : ''}`} style={{ width: `${pct * 100}%` }} />
              </span>
              <span className={styles.tubeLabel}>{item.icon}{item.label} {fmtN(v)} kg</span>
            </div>
          )
        })}
      </div>
      {ashore > 0 ? <p className={styles.ashore}>{ashore} on the Moon</p> : null}
    </div>
  )
}
