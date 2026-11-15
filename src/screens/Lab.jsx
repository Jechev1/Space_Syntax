import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { Dialog } from '../components/ui/Dialog.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { HELP_LAB } from '../data/help.mjs'
import { useGame } from '../engine/useGame.jsx'
import { HelpWindow, loadSample } from './F5a.jsx'
import { StageScene } from './frame.jsx'
import { labSpeech } from './labSpeech.mjs'
import { usePlay } from './playContext.jsx'
import styles from './Lab.module.css'
import scene from './scene.module.css'

const TITLE = 'How far is up? · Lab'
const KICKER = 'Lab · Back on Earth'
const BG = '/bg/bg-control.png'
const GIRL = '/char/nina-chaqueta-portapapeles.png'

const COLUMNS = [
  { key: 'phase', label: 'Phase' },
  { key: 'what', label: 'What you chose' },
  { key: 'nums', label: 'Real numbers' },
]

function Girl() {
  return <img className={styles.girl} src={GIRL} alt="" />
}

/** The lab opens after a safe splashdown, or when a one-way robot has finished its surface work. */
function labStatus(state, model) {
  if (!state.missionType || !state.landing) return { open: false, back: '/f6', reason: 'Land on the Moon and do your surface work first.' }
  const finished = Boolean(state.surface && state.surface.finished)
  if (model.returnApplies(state)) {
    const sim = model.returnSim(state)
    if (!finished) return { open: false, back: '/f6', reason: 'Finish your work on the Moon, then fly home.' }
    if (sim.outcome === 'success') return { open: true, sim }
    return { open: false, back: '/f7', reason: 'The trip home is not finished. The lab opens after a safe splashdown.' }
  }
  if (!finished) return { open: false, back: '/f6', reason: 'End the exploration on the Moon first. The lab analyses the data your lander sent.' }
  return { open: true, sim: null }
}

/** Crewed sample at the lab that keeps the player's difficulty, with an entry and shield that splash down safely. */
function loadLabSample(next, model, data) {
  loadSample(next, model, 'crewed', 'f7')
  for (const entry of data.RETURN.entries) {
    for (const shield of data.RETURN.shields) {
      next.returnTrip = Object.assign({}, next.returnTrip, { entry: entry.id, shield: shield.id })
      if (model.returnSim(next).outcome === 'success') return
    }
  }
}

export function Lab() {
  const { state, model } = useGame()
  const status = labStatus(state, model)
  return (
    <StageScene background={BG} character={<Girl />} title={TITLE}>
      {status.open ? <LabBody status={status} /> : <Locked status={status} />}
    </StageScene>
  )
}

function Locked({ status }) {
  const navigate = useNavigate()
  const { model, data, update } = useGame()
  return (
    <div className={styles.screen}>
      <div className={styles.panelGuard}>
        <GlassPanel>
          <p className={styles.kicker}>{KICKER}</p>
          <h2 className={styles.title}>The lab is not open yet</h2>
          <p className={styles.line}>{status.reason}</p>
          <div className={styles.stack}>
            <Button variant="outline" onClick={() => navigate(status.back)}>
              {status.back === '/f7' ? 'Back to the trip home' : 'Back to the Moon surface'}
            </Button>
            <Button variant="outline" onClick={() => update((next) => loadLabSample(next, model, data))}>
              Load a sample mission
            </Button>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

/*
 * Top bar for the Lab, in the shared scene bar like Phases 2 to 6, with four cells: place, measurements,
 * data sent to Earth and samples brought home.
 */
function LabHud({ st }) {
  const { model } = useGame()
  return (
    <div className={`${scene.hud} ${styles.hud}`} aria-label="Lab status">
      <span>Lab · Earth</span>
      <span>{model.fmt(st.measurements)} {st.measurements === 1 ? 'measurement' : 'measurements'}</span>
      <span>Data sent {model.fmt(st.dataSentGb, 1)} GB</span>
      <span>{st.sampleKg > 0 ? `Samples ${model.fmt(st.sampleKg, 2)} kg` : 'No samples'}</span>
    </div>
  )
}

function Speech({ text }) {
  if (!text) return null
  return (
    <div className={styles.speech}>
      <Bubble tone="speech">{text}</Bubble>
    </div>
  )
}

function LabBody({ status }) {
  const navigate = useNavigate()
  const { state, model, data } = useGame()
  const { setModal } = usePlay()
  const [step, setStep] = useState('verdict')
  const [help, setHelp] = useState(false)
  const [math, setMath] = useState(false)

  const outcome = model.surfaceOutcome(state)
  const st = model.surfaceStatus(state)
  const evidence = outcome ? outcome.evidence : null
  const strong = evidence === 'sample' || evidence === 'composition'
  const home = model.returnApplies(state)
  const best = st.journal.find((entry) => entry.evidence === evidence && entry.result)
  const regolith = data.SURFACE.regolith
  const helpButton = <Button variant="secondary" onClick={() => setHelp(true)}>? Help</Button>
  const helpWindow = <HelpWindow help={HELP_LAB} open={help} onClose={() => setHelp(false)} />

  if (step === 'report') {
    return (
      <div className={styles.screen}>
        <LabHud st={st} />
        <Speech text={labSpeech(state.difficulty, { step: 'report' })} />
        <div className={`${styles.panel} ${styles.panelWide}`}>
          <GlassPanel>
            <p className={styles.kicker}>{KICKER}</p>
            <h2 className={styles.title}>Your mission, phase by phase</h2>
            <div className={styles.table}>
              <DataTable columns={COLUMNS} rows={reportRows(state, model, data, st, status.sim)} />
            </div>
            <p className={styles.line}>
              {strong
                ? 'You asked a question, built a way to test it, and let the evidence answer. That is how science works.'
                : 'You asked a question and built a way to test it. Next time, bring back stronger evidence.'}
            </p>
          </GlassPanel>
        </div>
        <div className={styles.dock}>
          <div className={styles.nav}>
            <Button variant="secondary" onClick={() => setStep('verdict')}>← Verdict</Button>
            {helpButton}
          </div>
          <div className={styles.lock}>
            {/* A mission that flew home ends on Phase 8; a one-way robot ends here in the lab. */}
            {home
              ? <Button variant="outline" onClick={() => navigate('/f8')}>Finish the mission →</Button>
              : <Button variant="outline" onClick={() => setModal('reset')}>Start a new mission</Button>}
          </div>
        </div>
        {helpWindow}
      </div>
    )
  }

  const analysed = evidence === 'sample'
    ? 'The lab opened the samples you brought home.'
    : home
      ? 'The lab studied the data from your instruments.'
      : 'The lab studied the data your lander sent from the Moon.'
  const density = model.moonDensityMath()

  return (
    <div className={styles.screen}>
      <LabHud st={st} />
      <Speech text={labSpeech(state.difficulty, { step: 'verdict', strong })} />
      <div className={styles.panel}>
        <GlassPanel>
          <p className={styles.kicker}>{KICKER}</p>
          <h2 className={styles.title}>Is the Moon made of cheese?</h2>
          <p className={styles.line}>{analysed}</p>
          <div className={`${styles.verdict} ${strong ? styles.rejected : styles.open}`}>
            <p className={styles.hypothesis}>Hypothesis: The Moon is made of cheese.</p>
            <p className={styles.verdictLine}>{strong ? 'Verdict: rejected' : 'Verdict: not proven yet'}</p>
            {strong ? (
              <p className={styles.line}>The ground is rock and dust, not cheese. {best ? best.result.text : ''}</p>
            ) : (
              <p className={styles.line}>
                Your evidence was only pictures, and a picture cannot tell rock from cheese. Next time bring a
                spectrometer to read the elements, or collect a sample to bring home.
              </p>
            )}
          </div>
          <p className={styles.line}><b>Density:</b> {data.FACTS.density.text}</p>
          <p className={styles.line}><b>Regolith:</b> {regolith.text}</p>
          <p className={styles.line}>{data.FACTS.crust.text}</p>
          <div className={styles.stack}>
            <Button variant="outline" onClick={() => setMath(true)}>Show the math</Button>
          </div>
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f7')}>{home ? '← Trip home' : '← Phase 7'}</Button>
          {helpButton}
        </div>
        <div className={styles.lock}>
          <Button variant="outline" onClick={() => setStep('report')}>Mission report →</Button>
        </div>
      </div>
      {math ? (
        <Dialog title={density.title || 'The math'} onClose={() => setMath(false)}>
          <MathBlock math={{ ...density, title: null }} />
        </Dialog>
      ) : null}
      {helpWindow}
    </div>
  )
}

function reportRows(state, model, data, st, sim) {
  const fmt = model.fmt
  const r = model.evaluate(state)
  const h = model.hud(state)
  const crewed = state.missionType === 'crewed'
  const q = data.QUESTIONS.find((x) => x.id === state.question)
  const measure = data.MEASURES.find((x) => x.id === state.measure)
  const type = data.MISSION_TYPES.find((x) => x.id === state.missionType)
  const link = data.COMMS.links.find((x) => x.id === (state.comms && state.comms.link))
  const dish = data.COMMS.dishes.find((x) => x.id === (state.comms && state.comms.dish))
  const site = data.SITES.find((x) => x.id === state.site)
  const comms = model.commsPlan(state)
  const margin = state.flight ? Math.round(state.flight.margin * 100) : 0
  const rows = []
  const add = (phase, what, nums) => rows.push({ key: phase, phase, what, nums })

  add('0 Goal', q ? q.title : 'Mission goal', `Hypothesis: the Moon is made of cheese. Plan: ${measure ? measure.title.toLowerCase() : 'measure'}.`)
  add('1 Spacecraft', type ? type.title : 'Spacecraft', `Hardware ${fmt(h.hardware)} kg, fuel ${fmt(h.fuel)} kg.`)
  if (crewed && state.crew) {
    add('2 Crew', `${state.crew.size} people, ${fmt(h.days)} days`, `Suit: ${(data.LIFE.suits.find((x) => x.id === state.crew.suit) || {}).title || 'none'}.`)
  } else {
    add('2 Crew', 'No crew on board', `Mission length ${fmt(h.days)} days.`)
  }
  add('3 Flight plan', r && r.rocket ? r.rocket.title : 'Rocket', `Launch mass ${fmt(h.launchMass)} kg of ${fmt(h.capacity || 0)} kg. Cost $${fmt(h.cost)}M of $${fmt(h.budget)}M. Delta-v ${fmt(h.dvPlanned)} m/s, ${margin}% margin.`)
  add('4 Comms', link ? link.title : 'Radio link', `${dish ? dish.title : 'No dish'}. Instruments make ${fmt(comms.needGbPerDay)} Gb a day, the link carries ${fmt(comms.gbPerDay || 0)} Gb.`)
  add('5 Landing', site ? site.title : 'Landing site', `Landing: ${state.landing ? state.landing.outcome : 'none'}.`)
  add('6 Surface', `${fmt(st.measurements)} ${st.measurements === 1 ? 'measurement' : 'measurements'}`, `${fmt(st.dataSentGb, 1)} GB sent to Earth${st.sampleKg > 0 ? `, ${fmt(st.sampleKg, 2)} kg of samples` : ''}. Best evidence: ${st.meter ? st.meter.replace('Evidence: ', '').toLowerCase() : 'none'}.`)
  if (sim && sim.applicable) {
    const entry = model.findEntry(state.returnTrip && state.returnTrip.entry)
    const shield = model.findShield(state.returnTrip && state.returnTrip.shield)
    const t = sim.thermal
    const s = sim.splash
    add('7 Return', `${entry ? entry.title : 'Reentry'}, ${shield ? shield.title.toLowerCase() : 'no'} shield`,
      `Shield margin ${t ? fmt(t.ratio, 2) : '0'}x. Splashdown ${s ? fmt(s.missKm, 1) : '0'} km from target, zone ${s ? fmt(s.zoneKm) : '0'} km, score ${s ? s.score : 0}.`)
  } else {
    add('7 Return', 'One way, no trip home', 'The lander stays on the Moon. Its data came home by radio.')
  }
  return rows
}
