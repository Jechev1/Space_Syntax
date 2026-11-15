import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { sampleMission } from '../engine/sampleMission.mjs'
import { useGame } from '../engine/useGame.jsx'
import { StageScene } from './frame.jsx'
import { useGoBack } from './goBack.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F7.module.css'

const TITLE = 'How far is up? — Phase 7'
// Phase 3 (flight plan) has no React screen yet. Point this at its route when it exists.

const SCENES = {
  intro: { bg: '/bg/bg-orbita-lunar.png', girl: 'dish', place: 'Moon surface' },
  burn0: { bg: '/bg/bg-orbita-lunar.png', girl: 'dish', place: 'Moon surface' },
  burn1: { bg: '/bg/bg-orbita-lunar.png', girl: 'dish', place: 'Moon orbit' },
  entry: { bg: '/bg/bg-cabina.png', girl: 'seat', place: 'Earth return' },
  shield: { bg: '/bg/bg-cabina.png', girl: 'seat', place: 'Earth return' },
  reentry: { bg: '/bg/bg-oceano.png', girl: 'dish', place: 'Reentry' },
  splash: { bg: '/bg/bg-oceano.png', girl: 'dish', place: 'Pacific Ocean' },
}

function girlImage(kind) {
  return kind === 'seat' ? '/char/nina-traje-sentada.png' : '/char/nina-ventanilla.png'
}

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function useTimer(active, ms, onDone) {
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    if (!active) return undefined
    const wait = prefersReduced() ? Math.min(ms, 1500) : ms
    const id = setTimeout(() => done.current(), wait)
    return () => clearTimeout(id)
  }, [active, ms])
}

function intensityOf(thermal) {
  if (!thermal) return 0.5
  return Math.max(0.2, Math.min(1.2, 1 / thermal.ratio))
}

export function F7() {
  const navigate = useNavigate()
  const game = useGame()
  const { state, model, update } = game
  const applies = model.returnApplies(state)
  const finished = Boolean(state.surface && state.surface.finished)
  const ready = applies && finished
  const [step, setStep] = useState('intro')
  const [running, setRunning] = useState(false)
  const [failFrom, setFailFrom] = useState('intro')
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    if (!ready || seeded) return
    const rt = state.returnTrip
    if (!rt || !Number.isInteger(rt.seed)) {
      update((next) => {
        next.returnTrip = Object.assign({ entry: null, shield: null }, next.returnTrip, { seed: Math.floor(Math.random() * 1000000) })
      })
    }
    setSeeded(true)
  }, [ready, seeded, state.returnTrip, update])

  if (!ready) {
    return (
      <StageScene
        background="/bg/bg-orbita-lunar.png"
        character={<img className={styles.girl} src="/char/nina-ventanilla.png" alt="" />}
        title={TITLE}
      >
        <div className={styles.screen}>
          <div className={styles.panel}>
            <GlassPanel eyebrow="Phase 7 · Return" title="Not ready to fly home" tone="warn">
              <p className={styles.line}>
                {applies
                  ? 'Finish your work on the Moon first. Take at least one measurement, then end the exploration.'
                  : 'A robotic one-way lander never comes home, so there is no trip to plan. Only missions with a way back get this phase.'}
              </p>
              <div className={styles.actions}>
                <Button variant="outline" onClick={() => navigate('/f6')}>Back to the Moon surface</Button>
                <Button variant="secondary" onClick={() => update((next) => { Object.assign(next, sampleMission('crewed', 'f7')) })}>
                  Load a sample mission
                </Button>
              </div>
            </GlassPanel>
          </div>
        </div>
      </StageScene>
    )
  }

  const sim = model.returnSim(state)
  const scene = step === 'fail' ? SCENES[failFrom] : SCENES[step]
  const goto = (id) => { setRunning(false); setStep(id) }
  const fail = () => { setFailFrom(step === 'fail' ? failFrom : step); goto('fail') }
  const thermal = model.thermalCheck(state)
  const glow = intensityOf(thermal)

  return (
    <StageScene
      background={scene.bg}
      character={<img className={scene.girl === 'seat' ? styles.girlSeat : styles.girl} src={girlImage(scene.girl)} alt="" />}
      objects={<Objects step={step} running={running} sim={sim} glow={glow} />}
      title={TITLE}
    >
      <F7Body step={step} failFrom={failFrom} running={running} setRunning={setRunning} goto={goto} fail={fail} sim={sim} scene={scene} thermal={thermal} glow={glow} />
    </StageScene>
  )
}

/* ---------- scene art ---------- */

function Objects({ step, running, sim, glow }) {
  if (step === 'intro' || step === 'burn0') {
    return (
      <div className={`${styles.ascent} ${running ? styles.lifting : ''}`}>
        <img src="/obj/etapa-ascenso.png" alt="" />
        <span className={styles.flame} aria-hidden="true" />
      </div>
    )
  }
  if (step === 'burn1') {
    return (
      <div className={`${styles.cruiser} ${running ? styles.cruising : ''}`}>
        <img src="/obj/etapa-ascenso.png" alt="" />
        <span className={styles.flame} aria-hidden="true" />
      </div>
    )
  }
  if (step === 'shield') {
    return <img className={styles.shieldCapsule} style={{ '--glow': glow }} src="/obj/capsula.png" alt="" />
  }
  if (step === 'reentry') {
    return (
      <div className={styles.fall} style={{ '--glow': glow }}>
        <span className={styles.plasma} aria-hidden="true" />
        <img src="/obj/capsula.png" alt="" />
      </div>
    )
  }
  if (step === 'splash') {
    return <Splash splash={sim.splash} />
  }
  return null
}

function missAngle(km) {
  return ((km * 97) % 360) * (Math.PI / 180)
}

function Splash({ splash }) {
  if (!splash) return null
  const zone = 100 // zone radius in stage width units (x1/10 %)
  const ratio = Math.min(2.4, splash.missKm / splash.zoneKm)
  const a = missAngle(splash.missKm)
  const dx = Math.cos(a) * ratio * zone
  const dy = Math.sin(a) * ratio * zone * 0.32
  return (
    <div className={styles.splashArea} style={{ '--dx': `${dx / 10}%`, '--dy': `${dy / 10}%` }}>
      <span className={styles.zone} aria-hidden="true" />
      <span className={styles.target} aria-hidden="true" />
      <div className={`${styles.chute} ${splash.inZone ? '' : styles.chuteFar}`}>
        <img src="/obj/capsula-paracaidas.png" alt="" />
      </div>
    </div>
  )
}

/* ---------- HUD ---------- */

function ReturnHud({ place, sim, step }) {
  const { model } = useGame()
  const fuel = sim.fuel
  let left = fuel.pool
  if (['burn1', 'entry', 'shield', 'reentry', 'splash'].includes(step)) left = fuel.burns[0].after
  if (['entry', 'shield', 'reentry', 'splash'].includes(step) && fuel.burns[1]) left = fuel.burns[1].after
  if (['entry', 'shield', 'reentry', 'splash'].includes(step) && !fuel.burns[1]) left = fuel.burns[0].after
  const t = sim.thermal
  return (
    <div className={styles.hud} aria-label="Mission status">
      <span>{place}</span>
      <span>Delta-v left {model.fmt(Math.max(0, left))} m/s</span>
      <span>Shield margin {t ? `${model.fmt(t.ratio, 2)}x, ${t.status === 'ok' ? 'OK' : t.status === 'low' ? 'low' : 'too low'}` : 'not chosen'}</span>
    </div>
  )
}

/* ---------- body ---------- */

function Source({ id }) {
  const { openSource } = usePlay()
  return <Button variant="ghost" onClick={() => openSource(id)}>NASA source ↗</Button>
}

function Kicker({ children }) {
  return <p className={styles.kicker}>{children}</p>
}

function F7Body({ step, failFrom, running, setRunning, goto, fail, sim, scene, thermal, glow }) {
  const navigate = useNavigate()
  const goBack = useGoBack()
  const game = useGame()
  const { state, model, data, update } = game
  const { setModal } = usePlay()
  const fuel = sim.fuel
  const rt = state.returnTrip || {}
  const burnSteps = fuel.burns.map((b, i) => `burn${i}`)
  const afterBurns = 'entry'
  const burnIndex = step.startsWith('burn') ? Number(step.slice(4)) : -1
  const burn = burnIndex >= 0 ? fuel.burns[burnIndex] : null
  const isLast = burnIndex === fuel.burns.length - 1
  const math = model.returnMath(state)

  const setRt = (patch) => update((next) => {
    next.returnTrip = Object.assign({ seed: rt.seed, entry: null, shield: null }, next.returnTrip, patch)
  })

  useTimer(running && step === 'burn0' || running && step === 'burn1', 5000, () => {
    const nextStep = isLast ? afterBurns : burnSteps[burnIndex + 1]
    goto(nextStep)
  })
  useTimer(running && step === 'reentry', 7000, () => goto('splash'))

  const dock = (nav, main) => (
    <div className={styles.dock}>
      <div className={styles.nav}>{nav}</div>
      <div className={styles.main}>{main}</div>
    </div>
  )
  const helpBtn = <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
  const hud = <ReturnHud place={scene.place} sim={sim} step={step === 'fail' ? failFrom : step} />
  const speech = (text) => <div className={styles.speech}><Bubble tone="speech">{text}</Bubble></div>

  if (step === 'intro') {
    const labels = [...fuel.burns.map((b) => b.label), 'Reentry', 'Splashdown']
    return (
      <div className={styles.screen}>
        {hud}
        {speech('Everything we learned has to come home too.')}
        <div className={styles.timeline}>
          <ol className={styles.steps}>
            {labels.map((label, i) => {
              const b = fuel.burns[i]
              return (
                <li key={label} className={`${styles.stepItem} ${i === 0 ? styles.stepOn : ''}`}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <span className={styles.stepName}>{label}</span>
                  <span className={styles.stepDv}>{b ? `needs ${model.fmt(b.need)} m/s` : 'no fuel needed'}</span>
                </li>
              )
            })}
          </ol>
          <DvBar fuel={fuel} />
        </div>
        <div className={styles.panel}>
          <GlassPanel>
            <Kicker>Phase 7 · Return, Moon to Earth</Kicker>
            <h2 className={styles.title}>Bring the results home</h2>
            <p className={styles.line}>The fuel for the trip home was set aside in Phase 3. Each burn uses real delta-v from NASA mission studies.</p>
            <p className={styles.line}>You have <b>{model.fmt(fuel.pool)} m/s</b> in total for {fuel.burns.length === 1 ? 'one burn' : 'two burns'}.</p>
          </GlassPanel>
        </div>
        {dock(
          <>
            <Button variant="secondary" onClick={() => navigate('/f6')}>← Moon surface</Button>
            {helpBtn}
          </>,
          <Button variant="outline" onClick={() => goto('burn0')}>Start the return</Button>,
        )}
      </div>
    )
  }

  if (burn) {
    const first = burnIndex === 0
    const blocked = !burn.ok
    const reason = blocked ? `Not enough fuel: needs ${model.fmt(burn.need)} m/s` : ''
    const needed = model.fmt(burn.need)
    const say = first ? 'Fuel saved in Phase 3. Ignition!' : "There's Earth. Hold steady."
    return (
      <div className={styles.screen}>
        {hud}
        {speech(running ? (first ? 'Here we go!' : 'Steady, steady.') : say)}
        <div className={styles.panel}>
          <GlassPanel>
            <Kicker>Phase 7 · Return</Kicker>
            <h2 className={styles.title}>{first ? burn.label : 'Head for Earth'}</h2>
            <p className={styles.line}>
              {fuel.burns.length === 1
                ? `The capsule needs ${needed} m/s to climb off the Moon and head straight home.`
                : first
                  ? `The ascent stage needs about ${needed} m/s to reach lunar orbit.`
                  : 'This burn sends the spacecraft toward home. Without it, the crew does not return.'}
            </p>
            <dl className={styles.stats}>
              <div><dt>Delta-v before</dt><dd>{model.fmt(Math.max(0, burn.before))} m/s</dd></div>
              <div><dt>This burn needs</dt><dd>{needed} m/s</dd></div>
              <div className={styles.total}><dt>Left after</dt><dd>{model.fmt(Math.max(0, burn.after))} m/s</dd></div>
            </dl>
            <ShowMath math={math} />
            <Source id={burn.src} />
          </GlassPanel>
        </div>
        {dock(
          <>
            <Button variant="secondary" disabled={running} onClick={() => goto(first ? 'intro' : 'burn0')}>← Back</Button>
            {helpBtn}
          </>,
          <>
            {blocked ? <Button variant="ghost" onClick={fail}>See what went wrong</Button> : null}
            <Button
              variant="outline"
              disabled={running}
              disabledReason={reason}
              onClick={() => setRunning(true)}
            >
              {running ? 'Burning...' : first ? 'Lift off' : 'Start Earth return burn'}
            </Button>
          </>,
        )}
      </div>
    )
  }

  if (step === 'entry') {
    const entries = data.RETURN.entries
    const facts = data.FACTS
    return (
      <div className={styles.screen}>
        {hud}
        {speech('How should we come in?')}
        <div className={styles.cards} role="radiogroup" aria-label="Reentry path">
          {entries.map((entry) => {
            const on = rt.entry === entry.id
            return (
              <button
                key={entry.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={`${styles.card} ${on ? styles.cardOn : ''}`}
                onClick={() => setRt({ entry: entry.id })}
              >
                <EntryDiagram skip={entry.id === 'skip'} />
                <span className={styles.cardTitle}>{entry.title}</span>
                <span className={styles.cardLine}><b>Good:</b> {entry.pro}</span>
                <span className={styles.cardLine}><b>Trade-off:</b> {entry.con}</span>
                <span className={styles.chips}>
                  <span className={styles.chip}>Precision: {entry.precision}</span>
                  <span className={styles.chip}>{entry.src === 'game' ? 'Game value' : 'NASA source'}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div className={styles.panel}>
          <GlassPanel>
            <Kicker>Phase 7 · Return</Kicker>
            <h2 className={styles.title}>Pick the reentry path</h2>
            <p className={styles.line}>{facts.skipRange.text}</p>
            <p className={styles.line}>{facts.entrySpeed.text}</p>
            <div className={styles.actions}>
              <Source id="skipEntry" />
              <Button variant="ghost" onClick={() => setModal('game')}>What is a game value?</Button>
            </div>
          </GlassPanel>
        </div>
        {dock(
          <>
            <Button variant="secondary" onClick={() => goto(burnSteps[burnSteps.length - 1])}>← Back</Button>
            {helpBtn}
          </>,
          <Button variant="outline" disabledReason={rt.entry ? '' : 'Pick a reentry path'} onClick={() => goto('shield')}>
            Choose heat shield →
          </Button>,
        )}
      </div>
    )
  }

  if (step === 'shield') {
    const shields = data.RETURN.shields
    const chosen = rt.shield
    const view = chosen ? model.thermalCheck(state, rt.entry, chosen) : null
    const tone = view ? (view.status === 'ok' ? styles.ok : view.status === 'low' ? styles.low : styles.bad) : ''
    const blocked = view && view.status === 'tooLow'
    const fill = view ? Math.min(100, (view.shield.capacity / (view.load * 2)) * 100) : 0
    return (
      <div className={styles.screen}>
        {hud}
        {speech('Every kilogram we add here is taken from somewhere else.')}
        <div className={styles.slider} role="radiogroup" aria-label="Heat shield thickness">
          {shields.map((shield) => {
            const on = chosen === shield.id
            return (
              <button
                key={shield.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={`${styles.seg} ${on ? styles.segOn : ''}`}
                onClick={() => setRt({ shield: shield.id })}
              >
                <span>{shield.title}</span>
                <span className={styles.segNote}>+{model.fmt(shield.mass[state.missionType] || 0)} kg</span>
              </button>
            )
          })}
        </div>
        <div className={styles.panel}>
          <GlassPanel>
            <Kicker>Phase 7 · Return</Kicker>
            <h2 className={styles.title}>Choose the heat shield</h2>
            <p className={styles.line}>The shield must survive the heat of reentry. Thicker means safer, but heavier.</p>
            {view ? (
              <div className={`${styles.margin} ${tone}`}>
                <p className={styles.marginLabel}>{view.label}</p>
                <span className={styles.meter} aria-hidden="true"><span style={{ width: `${fill}%` }} /></span>
                <p className={styles.marginNote}>
                  Added mass {model.fmt(view.addedMass)} kg. Shield holds {model.fmt(view.shield.capacity, 2)}, the heat is {model.fmt(view.load, 2)}.
                </p>
                {view.message ? <p className={styles.marginNote}>{view.message}</p> : null}
              </div>
            ) : <p className={styles.line}>Pick a thickness to see its margin.</p>}
            <p className={styles.line}>{data.FACTS.avcoatHeat.text}</p>
            <p className={styles.line}>{data.FACTS.artemis2Shield.text}</p>
            <Source id="avcoat" />
          </GlassPanel>
        </div>
        {dock(
          <>
            <Button variant="secondary" onClick={() => goto('entry')}>← Back</Button>
            {helpBtn}
          </>,
          <>
            {blocked ? <Button variant="ghost" onClick={fail}>See what went wrong</Button> : null}
            <Button
              variant="outline"
              disabledReason={!chosen ? 'Pick a shield thickness' : blocked ? 'Thermal margin too low' : ''}
              onClick={() => { goto('reentry'); setRunning(true) }}
            >
              Reenter
            </Button>
          </>,
        )}
      </div>
    )
  }

  if (step === 'reentry') {
    const pct = thermal ? Math.round(Math.min(120, 100 * thermal.load / thermal.shield.capacity)) : 60
    return (
      <div className={styles.screen}>
        {hud}
        <div className={styles.gauge} style={{ '--to': `${Math.min(100, pct)}%` }}>
          <p className={styles.gaugeTitle}>Shield load</p>
          <span className={styles.meter} aria-hidden="true"><span className={styles.gaugeFill} /></span>
          <p className={styles.gaugeNote}>{pct}% of what the shield can take</p>
        </div>
        <div className={styles.panel}>
          <GlassPanel>
            <Kicker>Phase 7 · Return</Kicker>
            <h2 className={styles.title}>Reentry</h2>
            <p className={styles.line}>The capsule is heating up. The shield does the work now.</p>
            <p className={styles.line} role="status">{running ? 'Hold on...' : 'Through the heat.'}</p>
          </GlassPanel>
        </div>
      </div>
    )
  }

  if (step === 'splash') {
    const s = sim.splash
    const ok = s && s.inZone
    const scale = s ? Math.max(s.missKm, s.zoneKm) * 1.25 : 1
    return (
      <div className={styles.screen}>
        {hud}
        {speech(ok ? 'Splashdown confirmed. Welcome home.' : 'We are far from the ships.')}
        <div className={styles.panel}>
          <GlassPanel>
            <Kicker>Phase 7 · Return</Kicker>
            <h2 className={styles.title}>Splashdown</h2>
            <p className={styles.line}>Parachutes slow the capsule to about 17 mph (about 27 km/h).</p>
            {s ? (
              <div className={`${styles.margin} ${ok ? styles.ok : styles.bad}`}>
                <p className={styles.marginLabel}>{ok ? `Inside the recovery zone, score ${s.score}` : 'Outside the recovery zone'}</p>
                <span className={styles.track} aria-hidden="true">
                  <span className={styles.trackZone} style={{ width: `${(s.zoneKm / scale) * 100}%` }} />
                  <span className={styles.trackMark} style={{ left: `${(s.missKm / scale) * 100}%` }} />
                </span>
                <p className={styles.marginNote}>
                  {model.fmt(s.missKm, 1)} km from the target. Recovery ships cover {model.fmt(s.zoneKm)} km.
                </p>
              </div>
            ) : null}
            <p className={styles.line}>{data.FACTS.artemis1Landing.text}</p>
            <p className={styles.line}>{data.FACTS.artemis2Landing.text}</p>
            <Source id="artemis1Entry" />
          </GlassPanel>
        </div>
        {dock(
          <>{helpBtn}</>,
          ok
            ? <Button variant="outline" onClick={() => navigate('/lab')}>Go to lab →</Button>
            : <Button variant="outline" onClick={fail}>See what happened →</Button>,
        )}
      </div>
    )
  }

  /* fail */
  const f = sim.failure
  const backTo = f ? f.backTo : 7
  const toPhase = () => {
    if (backTo === 7) {
      goto(f && f.code === 'thermalTooLow' ? 'shield' : 'entry')
    } else {
      goBack(backTo)
    }
  }
  return (
    <div className={`${styles.screen} ${styles.failScreen}`}>
      <div className={styles.dim} aria-hidden="true" />
      {hud}
      <div className={styles.failPanel}>
        <GlassPanel eyebrow="Phase 7 · Mission failed" title={f ? f.title : 'The trip home did not work'} tone="danger">
          <p className={styles.line}>{f ? f.sub : 'Something in the return plan did not hold up.'}</p>
          {f ? (
            <ol className={styles.chain} aria-label="What led to this">
              {f.chain.map((item) => (
                <li key={item.text} className={styles.link}>
                  <span className={styles.linkText}>{item.text}</span>
                  <span className={styles.linkPhase}>Phase {item.phase}</span>
                </li>
              ))}
            </ol>
          ) : null}
          {f ? (
            <div className={styles.nasa}>
              <p className={styles.nasaTitle}>NASA recommendation</p>
              <p className={styles.line}>{f.descope.text}</p>
              <Source id={f.descope.src} />
            </div>
          ) : null}
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
        </div>
        <div className={styles.main}>
          <Button variant="outline" onClick={toPhase}>
            {backTo === 7 ? 'Back to Phase 7' : `Go back to Phase ${backTo}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ---------- small pieces ---------- */

function ShowMath({ math }) {
  const { state, update } = useGame()
  const open = Boolean(state.showMath && state.showMath.returnTrip)
  if (!math) return null
  return (
    <div className={styles.mathWrap}>
      <Button
        variant="ghost"
        aria-expanded={open}
        onClick={() => update((next) => { next.showMath = Object.assign({}, next.showMath, { returnTrip: !open }) })}
      >
        {open ? '▾ Hide the math' : '▸ Show the math'}
      </Button>
      {open ? <MathBlock math={math} /> : null}
    </div>
  )
}

function DvBar({ fuel }) {
  const { model } = useGame()
  const pool = fuel.pool || 1
  const marks = fuel.burns.map((b) => ({ key: b.key, left: Math.max(0, b.after), label: b.label }))
  return (
    <div className={styles.dv}>
      <p className={styles.dvTitle}>Delta-v left after each step</p>
      <span className={styles.dvTrack} aria-hidden="true">
        {fuel.burns.map((b, i) => (
          <span key={b.key} className={i % 2 ? styles.dvUsedB : styles.dvUsedA} style={{ width: `${(b.need / pool) * 100}%` }} />
        ))}
        <span className={styles.dvFill} />
      </span>
      <p className={styles.dvNote}>
        Start {model.fmt(pool)} m/s{marks.map((m) => `, then ${model.fmt(Math.max(0, m.left))} m/s`).join('')}
      </p>
    </div>
  )
}

function EntryDiagram({ skip }) {
  return (
    <svg className={styles.diagram} viewBox="0 0 200 90" aria-hidden="true">
      <circle cx="100" cy="135" r="62" className={styles.earth} />
      <circle cx="100" cy="135" r="72" className={styles.air} />
      {skip ? (
        <path d="M6 10 Q 50 30 82 58 Q 100 68 118 58 Q 150 30 190 10" className={styles.pathLine} />
      ) : (
        <path d="M6 10 Q 60 30 100 66" className={styles.pathLine} />
      )}
    </svg>
  )
}
