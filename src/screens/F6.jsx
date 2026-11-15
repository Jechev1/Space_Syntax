import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Chip } from '../components/ui/Chip.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import { sampleMission } from '../engine/sampleMission.mjs'
import { useGame } from '../engine/useGame.jsx'
import { StageScene } from './frame.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F6.module.css'
import shell from './shell.module.css'

const MARKS = [
  { x: 25, y: 62 },
  { x: 37, y: 73 },
  { x: 47, y: 64 },
  { x: 33, y: 54 },
]

function openStep(state) {
  const actions = (state.surface && state.surface.actions) || []
  if (state.surface && state.surface.finished) return 'd'
  return actions.length ? 'b' : 'a'
}

export function F6() {
  const { state, model } = useGame()
  const [step, setStep] = useState(() => openStep(state))
  const [poi, setPoi] = useState('')
  const ready = model.canExplore(state)
  const pois = ready ? model.surfacePois(state) : []
  const current = pois.find((item) => item.id === poi) || pois[0]
  const index = Math.max(0, pois.findIndex((item) => item.id === (current && current.id)))
  const walking = step === 'b' || step === 'd'
  const spot = walking && current ? MARKS[index % MARKS.length].x - 23 : 2.4
  const girl = (
    <>
      <img className={styles.girl} style={{ left: `${spot}%` }} src="/char/nina-traje-pie.png" alt="" />
    </>
  )
  const lander = ready ? <img className={styles.lander} src="/obj/lander-base.png" alt="" /> : null

  return (
    <StageScene background="/bg/bg-superficie.png" character={girl} objects={lander} title="How far is up? — Phase 6">
      {ready ? (
        <F6Body step={step} setStep={setStep} poi={current ? current.id : ''} setPoi={setPoi} />
      ) : (
        <NotLanded />
      )}
    </StageScene>
  )
}

function NotLanded() {
  const navigate = useNavigate()
  const { state, update } = useGame()
  return (
    <div className={`${styles.screen} ${styles.guard}`}>
      <div className={styles.panelGuard}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 6 · Surface</p>
          <h2 className={styles.title}>Land on the Moon first.</h2>
          <p className={styles.line}>Your instruments can only work after a landing.</p>
          <div className={styles.stack}>
            <Button variant="outline" onClick={() => navigate('/f5b')}>Go to the landing</Button>
            <Button
              variant="outline"
              onClick={() => update((next) => Object.assign(next, sampleMission(state.missionType || 'robotic', 'f6')))}
            >
              Load a sample mission
            </Button>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

function SurfaceHud({ st }) {
  const { model } = useGame()
  const hoursFill = st.hoursTotal > 0 ? st.hoursLeft / st.hoursTotal : 0
  const dataFill = st.bufferMax > 0 ? st.bufferGb / st.bufferMax : 0
  const power = st.power ? st.power.available : 0
  return (
    <div className={styles.hud} aria-label="Surface status">
      <span>Moon surface</span>
      <span className={styles.meterCell} style={{ '--fill': `${Math.min(1, hoursFill) * 100}%` }}>
        Hours left {model.fmt(st.hoursLeft, 1)} / {model.fmt(st.hoursTotal, 1)} h
      </span>
      <span>Spare power {model.fmt(power)} W</span>
      <span className={styles.meterCell} style={{ '--fill': `${Math.min(1, dataFill) * 100}%` }}>
        Data buffer {model.fmt(st.bufferGb, 1)} / {model.fmt(st.bufferMax)} GB
      </span>
      <span>{st.meter || 'Evidence: none yet'}</span>
    </div>
  )
}

function F6Body({ step, setStep, poi, setPoi }) {
  const navigate = useNavigate()
  const { state, model, update, setNotice } = useGame()
  const { setModal } = usePlay()
  const st = model.surfaceStatus(state)
  const [last, setLast] = useState(null)
  const [message, setMessage] = useState('')
  const [event, setEvent] = useState(null)
  const [confirm, setConfirm] = useState('')
  const [journal, setJournal] = useState(false)

  useEffect(() => {
    if (st.finished && step !== 'd') setStep('d')
  }, [st.finished, step, setStep])

  const apply = (next) => update((draft) => Object.assign(draft, next))

  const doMeasure = (id) => {
    const check = model.canMeasure(state, poi, id)
    if (!check.ok) {
      setMessage(check.reason)
      return
    }
    const res = model.measure(state, poi, id)
    if (!res.ok) {
      setMessage(res.reason)
      return
    }
    setMessage('')
    setLast(res.entry)
    apply(res.state)
    const actions = (res.state.surface && res.state.surface.actions) || []
    const seed = (state.landing && state.landing.seed) || 0
    const rolled = model.rollSurfaceEvent(res.state, seed + actions.length)
    if (rolled) setEvent(rolled)
  }

  const doSend = () => {
    const res = model.sendData(state)
    if (!res.ok) {
      setMessage(res.reason)
      return
    }
    setMessage('')
    apply(res.state)
    setNotice('Data sent to Earth')
  }

  const doFinish = (force) => {
    const res = model.finishSurface(state)
    if (!res.ok) {
      setMessage(res.reason)
      return
    }
    if (res.confirm && !force) {
      setConfirm(res.confirm)
      return
    }
    setConfirm('')
    apply(res.state)
    setStep('d')
  }

  const choose = (choiceId) => {
    apply(model.applySurfaceEventChoice(state, event.id, choiceId))
    setEvent(null)
  }

  const finishCheck = model.finishSurface(state)
  const sendCheck = model.canSendData(state)

  if (step === 'a') {
    return (
      <div className={styles.screen}>
        <SurfaceHud st={st} />
        <div className={styles.speech}>
          <Bubble tone="speech">Our question is still open. Let's test it with real instruments.</Bubble>
        </div>
        <div className={styles.panel}>
          <GlassPanel>
            <p className={styles.kicker}>Phase 6 · Surface</p>
            <h2 className={styles.title}>Touchdown confirmed</h2>
            <p className={styles.line}>You're on the Moon. Your instruments can now test the surface.</p>
            {state.landing && state.landing.outcome === 'rough' ? (
              <p className={styles.warn}>Rough landing: one hour went into checking the lander.</p>
            ) : null}
            <p className={styles.hypothesis}>Hypothesis: The Moon is made of cheese.</p>
          </GlassPanel>
        </div>
        <div className={styles.dock}>
          <div className={styles.nav}>
            <Button variant="secondary" onClick={() => navigate('/f5b')}>← Landing</Button>
            <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
          </div>
          <div className={styles.lock}>
            <Button variant="outline" onClick={() => setStep('b')}>Start investigation →</Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'd') {
    return <Verdict st={st} />
  }

  const pois = st.pois
  const bufferWarn = st.bufferFull ? 'Data buffer full. Send data before measuring again.' : ''
  const segments = [
    ['clue', 'Clue'],
    ['composition', 'Composition'],
    ['sample', 'Sample'],
  ]

  return (
    <div className={styles.screen}>
      <SurfaceHud st={st} />
      <div className={styles.marks} role="group" aria-label="Spots to study">
        {pois.map((item, i) => {
          const mark = MARKS[i % MARKS.length]
          const on = item.id === poi
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.mark} ${on ? styles.markOn : ''}`}
              style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
              aria-pressed={on}
              onClick={() => { setPoi(item.id); setMessage('') }}
            >
              <span className={styles.ring} aria-hidden="true">{i + 1}</span>
              <span className={styles.tag}>
                <span>{item.title}</span>
                <b>{item.status}</b>
              </span>
            </button>
          )
        })}
      </div>
      <div className={`${styles.panel} ${styles.tall}`}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 6 · Surface</p>
          <h2 className={styles.title}>Investigate the surface</h2>
          <p className={styles.line}>Pick a spot, pick an instrument, read the result. Every measurement costs power, time and data.</p>
          <div className={styles.options}>
            {st.instruments.length ? st.instruments.map((ins, i) => {
              const cost = model.measureCost(state, ins.id)
              const check = model.canMeasure(state, poi, ins.id)
              const reason = ins.locked ? ins.lockReason : (check.ok ? '' : check.reason)
              return (
                <OptionRow
                  key={ins.id}
                  variant="line"
                  number={i + 1}
                  text={ins.title}
                  detail={`Evidence: ${ins.chip}`}
                  chips={(
                    <>
                      <Chip type="game">
                        {[cost.power ? `${cost.power} W` : '', `${model.fmt(cost.hours, 1)} h`, cost.sampleKg ? `+${model.fmt(cost.sampleKg, 2)} kg` : ''].filter(Boolean).join(' · ')}
                      </Chip>
                    </>
                  )}
                  locked={Boolean(reason)}
                  lockedReason={reason}
                  onSelect={() => doMeasure(ins.id)}
                  onLocked={() => setMessage(reason)}
                />
              )
            }) : <p className={styles.line}>No instruments on board. Add some in Phase 1.</p>}
          </div>
          {bufferWarn ? <p className={styles.warn}>{bufferWarn}</p> : null}
          {message && message !== bufferWarn ? <p className={styles.warn} role="status">{message}</p> : null}
          {last ? <ResultCard entry={last} pois={pois} /> : null}
        </GlassPanel>
      </div>
      <div className={styles.dockB}>
        <div className={styles.evidence} aria-label={st.meter || 'Evidence: none yet'}>
          <div className={styles.segments}>
            {segments.map(([id, label]) => (
              <span key={id} className={`${styles.segment} ${st.segments[id] ? styles.segOn : ''}`}>
                <span className={styles.segBar} />
                <span>{label}</span>
              </span>
            ))}
          </div>
          <p className={styles.evText}>{st.meter || 'Evidence: none yet'}</p>
        </div>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => setJournal(true)}>Journal ({st.journal.length})</Button>
          <Button variant="secondary" disabledReason={sendCheck.ok ? '' : sendCheck.reason} onClick={doSend}>Send data</Button>
          <Button variant="outline" disabledReason={finishCheck.ok ? '' : finishCheck.reason} onClick={() => doFinish(false)}>Finish exploration</Button>
        </div>
      </div>

      <Modal open={journal} variant="info" title="Field journal" onClose={() => setJournal(false)}>
        {st.journal.length ? (
          <ol className={styles.journal}>
            {st.journal.map((entry, i) => (
              <li key={i}>
                <b>Hour {model.fmt(entry.missionHour, 1)} · {poiTitle(pois, entry.poi)}</b>
                <span>{entry.result ? entry.result.text : ''}</span>
              </li>
            ))}
          </ol>
        ) : <p>Nothing yet. Take a measurement first.</p>}
        <Button variant="outline" onClick={() => setJournal(false)}>Close</Button>
      </Modal>

      <Modal open={Boolean(confirm)} variant="warn" title="Finish exploration?" onClose={() => setConfirm('')}>
        <p>{confirm}</p>
        <div className={shell.actions}>
          <Button variant="secondary" onClick={() => setConfirm('')}>Keep exploring</Button>
          <Button variant="outline" onClick={() => doFinish(true)}>Finish</Button>
        </div>
      </Modal>

      <EventDialog event={event} onChoose={choose} />
    </div>
  )
}

function poiTitle(pois, id) {
  const found = pois.find((item) => item.id === id)
  return found ? found.title : id
}

function ResultCard({ entry, pois }) {
  const { data } = useGame()
  const ins = data.SURFACE.instruments[entry.instrument]
  const src = entry.result && data.SOURCES[entry.result.src]
  const noteSrc = entry.note && data.SOURCES[entry.note.src]
  return (
    <div className={styles.result} role="status">
      <p className={styles.resultHead}>{ins.title} · {poiTitle(pois, entry.poi)}</p>
      <p className={styles.resultText}>{entry.result ? entry.result.text : 'No reading.'}</p>
      {src ? <a className={shell.link} href={src.url} target="_blank" rel="noopener noreferrer">NASA source</a> : null}
      {entry.note ? (
        <p className={styles.note}>
          {entry.note.text}{' '}
          {noteSrc ? <a className={shell.link} href={noteSrc.url} target="_blank" rel="noopener noreferrer">NASA source</a> : null}
        </p>
      ) : null}
    </div>
  )
}

function effectChips(effect = {}, model) {
  const chips = []
  if (effect.hours) chips.push(`${model.fmt(Math.abs(effect.hours), 1)} h lost`)
  if (effect.risk) chips.push('Risk up')
  if (effect.noSignal) chips.push('Buffer may fill')
  if (!chips.length) chips.push('No cost')
  return chips
}

function EventDialog({ event, onChoose }) {
  // Closing the window counts as the first, safest choice.
  const { model, data } = useGame()
  const src = event && data.SOURCES[event.src]
  return (
    <Modal open={Boolean(event)} variant="warn" title={event ? event.title : ''} onClose={() => event && onChoose(event.choices[0].id)}>
      {event ? (
        <>
          <p>{event.text}</p>
          <div className={styles.options}>
            {event.choices.map((choice, i) => (
              <OptionRow
                key={choice.id}
                number={i + 1}
                text={choice.label}
                chips={effectChips(choice.effect, model).map((text) => (
                  <Chip key={text} type="game" tone={choice.effect && choice.effect.risk ? 'warn' : ''}>{text}</Chip>
                ))}
                onSelect={() => onChoose(choice.id)}
              />
            ))}
          </div>
          {src ? <a className={shell.link} href={src.url} target="_blank" rel="noopener noreferrer">NASA source</a> : null}
        </>
      ) : null}
    </Modal>
  )
}

function Verdict({ st }) {
  const navigate = useNavigate()
  const { state, model, data } = useGame()
  const { setModal } = usePlay()
  const outcome = model.surfaceOutcome(state)
  const home = model.returnApplies(state)
  const strong = outcome && outcome.evidence !== 'clue'
  const best = [...st.journal].filter((entry) => entry.evidence === (outcome && outcome.evidence) && entry.result)[0]
  const regolith = data.SURFACE.regolith
  const regSrc = data.SOURCES[regolith.src]
  const bestSrc = best && data.SOURCES[best.result.src]
  const crewed = state.missionType === 'crewed'

  return (
    <div className={styles.screen}>
      <SurfaceHud st={st} />
      <div className={styles.speech}>
        <Bubble tone="speech">{strong ? 'No cheese here.' : 'Not enough proof yet.'}</Bubble>
      </div>
      <div className={`${styles.panel} ${styles.tallEnd}`}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 6 · Surface</p>
          <h2 className={styles.title}>{outcome ? outcome.title : 'Exploration finished'}</h2>
          <p className={styles.line}>{outcome ? outcome.sub : ''}</p>
          <div className={`${styles.verdict} ${strong ? styles.rejected : styles.open}`}>
            <p className={styles.hypothesis}>Hypothesis: The Moon is made of cheese.</p>
            <p className={styles.verdictLine}>
              {strong ? 'Verdict: rejected' : 'Verdict: not settled yet'}
            </p>
            <p className={styles.line}>
              {strong
                ? `The ground is rock and dust, not cheese. ${best ? best.result.text : ''}`
                : 'A picture alone cannot tell what the ground is made of. Composition or a sample would settle it.'}
            </p>
            {bestSrc ? <a className={shell.link} href={bestSrc.url} target="_blank" rel="noopener noreferrer">NASA source</a> : null}
          </div>
          <p className={styles.line}><b>Regolith:</b> {regolith.text}{' '}
            {regSrc ? <a className={shell.link} href={regSrc.url} target="_blank" rel="noopener noreferrer">NASA source</a> : null}
          </p>
          <p className={styles.line}>
            {model.fmt(st.measurements)} measurements, {model.fmt(st.dataSentGb, 1)} GB sent to Earth
            {st.sampleKg > 0 ? `, ${model.fmt(st.sampleKg, 2)} kg of samples on board` : ''}.
          </p>
          {home ? (
            <div className={styles.stack}>
              <Button variant="outline" onClick={() => navigate('/f7')}>Head home →</Button>
            </div>
          ) : (
            <div className={styles.end}>
              <p className={styles.endTitle}>Mission complete</p>
              <p className={styles.line}>
                {crewed
                  ? 'Your surface work is done.'
                  : 'Your robotic one-way mission is complete. The lander stays on the Moon, and its data is on its way to Earth.'}
              </p>
              <div className={shell.actions}>
                <Button variant="outline" onClick={() => navigate('/lab')}>Go to lab →</Button>
                <Button variant="ghost" onClick={() => setModal('sources')}>See all NASA sources</Button>
                <Button variant="ghost" onClick={() => setModal('reset')}>Start a new mission</Button>
              </div>
            </div>
          )}
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
      </div>
    </div>
  )
}
