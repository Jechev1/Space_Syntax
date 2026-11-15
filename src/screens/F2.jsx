import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Dialog } from '../components/ui/Dialog.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { HELP_F2 } from '../data/help.mjs'
import { useGame } from '../engine/useGame.jsx'
import { usePlayRun } from '../engine/usePlayRun.jsx'
import { f2Speech } from './f2Speech.mjs'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { MissionHud } from './f1Hud.jsx'
import styles from './F1.module.css'
import f2 from './F2.module.css'
import { FoodIcon, OxygenIcon, WaterIcon } from './scene.jsx'

const BACKGROUND = '/bg/bg-preparacion.png'
const CHARACTER = '/char/nina-chaqueta-portapapeles.png'
const SUIT_NAMES = { light: 'Light', lunar: 'Lunar', heavy: 'Heavy' }

export function F2() {
  const ready = usePhaseGuard('/f2')
  if (!ready) return null
  return (
    <StageScene
      background={BACKGROUND}
      character={<img className={styles.girl} src={CHARACTER} alt="" />}
      title="How far is up? · Phase 2"
    >
      <F2Body />
    </StageScene>
  )
}

function F2Body() {
  const navigate = useNavigate()
  const game = useGame()
  const { state, model, ensureCrew } = game
  const crewed = state.missionType === 'crewed'
  const [help, setHelp] = useState(false)
  const play = usePlayRun(2, state)
  const life = crewed ? model.lifeSupport(state) : null

  useEffect(() => {
    if (crewed && !state.crew) ensureCrew()
  }, [crewed, state.crew, ensureCrew])

  if (crewed && !life) return null

  const speech = f2Speech(state.difficulty, {
    crewed,
    suitPicked: Boolean(state.crew && state.crew.suit),
    run: play.run,
  })

  return (
    <div className={styles.screen}>
      <MissionHud />
      {speech ? (
        <div className={styles.speech}>
          <Bubble tone="speech">{speech}</Bubble>
        </div>
      ) : null}
      {crewed ? <SupplyShelf play={play} /> : null}
      {crewed ? <SuppliesTest play={play} /> : null}
      <div className={f2.crewPanel}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 2: Crew and Life Support · NASA Phases A–B</p>
          {crewed ? <CrewPlan game={game} life={life} /> : <NoCrew game={game} />}
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f1done')}>← Design review</Button>
          <Button variant="secondary" onClick={() => setHelp(true)}>? Help</Button>
        </div>
        <div className={styles.lock}>
          <ConfirmButton game={game} crewed={crewed} />
        </div>
      </div>
      <div className={styles.help}>
        <Modal open={help} variant="info" title={HELP_F2.title} onClose={() => setHelp(false)}>
          {HELP_F2.blocks.map((block) => (
            <p key={block.heading}><b>{block.heading}:</b> {block.text}</p>
          ))}
        </Modal>
      </div>
    </div>
  )
}

/* The optional supplies test: a small glass card on the left, like the subsystem tabs in F1a. */
function SuppliesTest({ play }) {
  const { run, events } = play
  const [math, setMath] = useState(false)
  const res = run && run.res
  const running = Boolean(run && run.status === 'running')
  const done = Boolean(run && run.status === 'done')
  const ready = Boolean(res && res.ready)
  const last = events.length ? events[events.length - 1] : null
  const total = res && res.time ? res.time.total : 0
  useEffect(() => { if (!done) setMath(false) }, [done])

  return (
    <div className={f2.testPanel}>
      <GlassPanel eyebrow="Optional test" title="Test your supplies">
        <p className={f2.testLine}>Simulate the mission days and see if oxygen, food and water last.</p>
        <Button variant="outline" disabledReason={running ? 'Running…' : ''} onClick={() => play.play()}>
          {run && run.status !== 'blocked' ? 'Test again' : 'Run test'}
        </Button>
        {run && run.status === 'blocked' ? (
          <ul className={styles.blockers}>{res.blockers.map((b) => <li key={b.code}>{b.message}</li>)}</ul>
        ) : null}
        {ready && !done ? (
          <>
            <p className={f2.clock}>Day {fmtN(run.t, run.t < 10 ? 1 : 0)} of {fmtN(total)}</p>
            <p className={`${f2.event} ${last && f2[last.kind] ? f2[last.kind] : ''}`} aria-live="polite">{last ? last.text : ' '}</p>
          </>
        ) : null}
        {done ? (
          <div className={`${styles.verdictBox} ${res.ok ? styles.verdictOk : styles.verdictFail}`}>
            <p className={styles.verdictLine}>
              <b>{res.ok ? 'Test passed' : 'Test failed'}</b>
              {res.ok ? (
                <span aria-label={`${res.stars} of 3 stars`}>
                  {[0, 1, 2].map((i) => <span key={i} className={i < res.stars ? styles.starOn : styles.starOff} aria-hidden="true">★</span>)}
                </span>
              ) : null}
            </p>
            <p className={res.failure ? styles.cause : styles.line}>
              {res.failure ? res.failure.cause.replace(/\s*\([^)]*\)\s*$/, '.') : leftText(res)}
            </p>
            {res.math ? (
              <Button variant="outline" onClick={() => setMath(true)}>Show the math</Button>
            ) : null}
          </div>
        ) : null}
      </GlassPanel>
      {math && res && res.math ? (
        <Dialog title={res.math.title || 'The math'} onClose={() => setMath(false)}>
          <p className={f2.mathNote}>Each astronaut uses oxygen, food and water every day — crew × days sets the totals.</p>
          <MathBlock math={{ ...res.math, check: null }} />
        </Dialog>
      ) : null}
    </div>
  )
}

/* What is left aboard when the test passes, read from the last frame. */
function leftText(res) {
  const fr = res.frames && res.frames[res.frames.length - 1]
  if (!fr) return 'Home safe.'
  return `Left aboard: O₂ ${fmtN(fr.o2)} kg · food ${fmtN(fr.food)} kg · water ${fmtN(fr.water)} kg`
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
      <h2 className={styles.question}>Plan the crew</h2>
      <div className={f2.row}>
        <span>Crew size</span>
        <span className={f2.stepper}>
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
      <p className={f2.note}>{life.landingCrew} land on the Moon · {life.orbitCrew} wait in orbit</p>

      <div className={f2.slider}>
        <div className={f2.row}>
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
        <p className={f2.note} id="f2-days-help">
          Artemis II: nearly 10 days · min {minDays}
        </p>
      </div>

      <button
        type="button"
        className={f2.toggle}
        aria-pressed={reserveOn}
        onClick={() => setCrew({ reserve: reserveOn ? 0 : 0.2 })}
      >
        <span>Safety reserve</span>
        <span>{reserveOn ? 'On (+20%)' : 'Off'} <i>(Game value)</i></span>
      </button>
      <button
        type="button"
        className={f2.toggle}
        aria-pressed={life.recycler}
        onClick={() => setCrew({ recycler: !life.recycler })}
      >
        <span>Water recycler</span>
        <span>{life.recycler ? 'On' : 'Off'} <i>({fmt(L.recycler.mass)} kg)</i></span>
      </button>

      <div className={f2.supplies}>
        <div className={f2.supply}><span><OxygenIcon />Oxygen</span><span>{fmt(life.o2)} kg</span></div>
        <div className={f2.supply}><span><FoodIcon />Dry food</span><span>{fmt(life.food)} kg</span></div>
        <div className={f2.supply}>
          <span><WaterIcon />Potable water</span>
          <span>{fmt(life.water)} kg{life.recycler ? ` (−${fmt(life.waterSaved)})` : ''}</span>
        </div>
      </div>

      <p className={f2.label}>Moonwalk suit · {life.landingCrew} needed</p>
      <div className={f2.suits}>
        {L.suits.map((suit) => (
          <button
            key={suit.id}
            type="button"
            className={f2.suit}
            aria-pressed={suitId === suit.id}
            title={suit.blurb}
            onClick={() => setCrew({ suit: suit.id })}
          >
            <b>{SUIT_NAMES[suit.id] || suit.title}</b>
            <span>{fmt(suit.mass)} kg · {suit.evaHours} h of moonwalk</span>
          </button>
        ))}
      </div>
    </>
  )
}

function NoCrew({ game }) {
  const { data, model } = game
  const pd = data.LIFE.perCrewDay
  const example = 4 * 10 * (pd.o2 + pd.food + pd.water)
  return (
    <>
      <h2 className={styles.question}>Robots do not eat</h2>
      <p className={f2.text}>
        Robots do not breathe, eat or drink. Your lander skips this phase and keeps all that mass for science.
      </p>
      <p className={f2.note}>
        A crew of 4 on a 10-day trip would need about {model.fmt(example)} kg of oxygen, food and water, before
        counting the astronauts, their suits and the fuel to carry it all.
      </p>
    </>
  )
}

function ConfirmButton({ game, crewed }) {
  const navigate = useNavigate()
  const { state, model, lockCrew, setNotice } = game
  const check = model.validatePhase(state, 2)
  const blocker = check.issues.find((issue) => issue.severity === 'block')
  return (
    <Button
      variant="outline"
      disabledReason={blocker ? blocker.message : ''}
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
    <button type="button" className={f2.mathLink} aria-expanded={showMath} onClick={onMath}>
      {showMath ? 'Hide the math' : 'Show the math'}
    </button>
  )
  return (
    <div className={`${f2.verdict} ${res.ok ? f2.okBox : f2.failBox}`}>
      <p className={f2.verdictLine}>
        <b>{VERDICT[res.outcome] || res.outcome}</b>
        {res.math && !res.ok ? mathButton : null}
        {res.ok ? (
          <span aria-label={`${res.stars} of 3 stars`}>
            {[0, 1, 2].map((i) => <span key={i} className={i < res.stars ? f2.starOn : f2.starOff} aria-hidden="true">★</span>)}
          </span>
        ) : null}
      </p>
      {res.ok && res.score && res.score.unit === '%' ? <p className={f2.clock}>{res.score.label}: {fmtN(res.score.value, 1)}%</p> : null}
      {res.failure ? (
        <>
          <p className={f2.cause}>{res.failure.cause}</p>
          <p className={f2.fix}>Try this: {res.failure.fix}</p>
        </>
      ) : null}
      {res.math && res.ok ? mathButton : null}
    </div>
  )
}

/* Compact Play card: button, the latest event, then the verdict. The clock and live meters (children) sit in the panel,
   or in a strip over the scene when strip is set. Shared with F4. */
export function RunPanel({ title, eyebrow = 'Play', label, play, showMath, onMath, children, left = false, strip = false, unitName = 'Day' }) {
  const { run, events } = play
  const res = run && run.res
  const running = run && run.status === 'running'
  const done = run && run.status === 'done'
  const last = events.length ? events[events.length - 1] : null
  const total = res && res.time ? res.time.total : 0
  const ready = Boolean(res && res.ready)
  const clock = ready ? (
    <p className={f2.clock}>{unitName} {fmtN(run.t, run.t < 10 ? 1 : 0)} of {fmtN(total, total < 10 ? 1 : 0)}</p>
  ) : null
  return (
    <>
      {strip && ready ? <div className={f2.shelf}>{eyebrow ? <p className={f2.clock}>{eyebrow}</p> : null}{clock}{children}</div> : null}
      <div className={`${f2.runPanel} ${left ? f2.runLeft : f2.runRight}`}>
        <GlassPanel eyebrow={strip && ready ? '' : eyebrow} title={title}>
          <Button variant="outline" disabledReason={running ? 'Running...' : ''} onClick={() => play.play()}>
            {run && run.status !== 'blocked' ? 'Play again' : label}
          </Button>
          {run && run.status === 'blocked' ? (
            <ul className={f2.blockers}>{res.blockers.map((b) => <li key={b.code}>{b.message}</li>)}</ul>
          ) : null}
          {ready ? (
            <>
              {strip ? null : clock}
              {strip ? null : children}
              {done && res.failure ? null : <p className={`${f2.event} ${last && f2[last.kind] ? f2[last.kind] : ''}`} aria-live="polite">{last ? last.text : ' '}</p>}
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
    <div className={f2.shelf} role="group" aria-label="Supplies left">
      <div className={f2.tubes}>
        {items.map((item) => {
          const v = Math.max(0, frame[item.key])
          const pct = Math.max(0, Math.min(1, v / max(item.key)))
          return (
            <div className={f2.tube} key={item.key}>
              <span className={f2.tubeBody} aria-hidden="true">
                <span className={`${f2.tubeFill} ${pct < 0.15 ? f2.low : ''}`} style={{ width: `${pct * 100}%` }} />
              </span>
              <span className={f2.tubeLabel}>{item.icon}{item.label} {fmtN(v)} kg</span>
            </div>
          )
        })}
      </div>
      {ashore > 0 ? <p className={f2.ashore}>{ashore} on the Moon</p> : null}
    </div>
  )
}
