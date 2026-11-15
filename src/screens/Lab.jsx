import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { sampleMission } from '../engine/sampleMission.mjs'
import { useGame } from '../engine/useGame.jsx'
import { StageScene } from './frame.jsx'
import { usePlay } from './playContext.jsx'
import styles from './Lab.module.css'

const TITLE = 'How far is up? — Lab'
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

function loadSample(update, model, data) {
  const s = sampleMission('crewed', 'f7')
  outer: for (const entry of data.RETURN.entries) {
    for (const shield of data.RETURN.shields) {
      s.returnTrip = Object.assign({}, s.returnTrip, { entry: entry.id, shield: shield.id })
      if (model.returnSim(s).outcome === 'success') break outer
    }
  }
  update((next) => { Object.assign(next, s) })
}

export function Lab() {
  const { state, model, data, update } = useGame()
  const status = labStatus(state, model)
  if (!status.open) return <Locked status={status} update={update} model={model} data={data} />
  return (
    <StageScene background={BG} character={<Girl />} title={TITLE}>
      <LabBody status={status} />
    </StageScene>
  )
}

function Locked({ status, update, model, data }) {
  const navigate = useNavigate()
  return (
    <StageScene background={BG} character={<Girl />} title={TITLE}>
      <div className={styles.screen}>
        <div className={styles.panelNarrow}>
          <GlassPanel eyebrow="Lab" title="The lab is not open yet" tone="warn">
            <p className={styles.line}>{status.reason}</p>
            <div className={styles.actions}>
              <Button variant="outline" onClick={() => navigate(status.back)}>
                {status.back === '/f7' ? 'Back to the trip home' : 'Back to the Moon surface'}
              </Button>
              <Button variant="secondary" onClick={() => loadSample(update, model, data)}>Load a sample mission</Button>
            </div>
          </GlassPanel>
        </div>
      </div>
    </StageScene>
  )
}

function LabBody({ status }) {
  const navigate = useNavigate()
  const { state, model, data } = useGame()
  const { setModal, openSource } = usePlay()
  const [step, setStep] = useState('verdict')

  const outcome = model.surfaceOutcome(state)
  const st = model.surfaceStatus(state)
  const evidence = outcome ? outcome.evidence : null
  const strong = evidence === 'sample' || evidence === 'composition'
  const home = model.returnApplies(state)
  const best = st.journal.find((entry) => entry.evidence === evidence && entry.result)
  const regolith = data.SURFACE.regolith
  const hud = (
    <div className={styles.hud} aria-label="Lab status">
      <span>Lab · Earth</span>
      <span>{st.sampleKg > 0 ? 'Samples and data analysed' : 'Data analysed'}</span>
      <span>{strong ? 'Hypothesis rejected' : 'Hypothesis not proven yet'}</span>
    </div>
  )
  const speech = (text) => <div className={styles.speech}><Bubble tone="speech">{text}</Bubble></div>

  if (step === 'report') {
    return (
      <div className={styles.screen}>
        {hud}
        {speech('One page for the whole trip.')}
        <div className={styles.panelWide}>
          <GlassPanel eyebrow="Lab · Mission report" title="Your mission, phase by phase">
            <DataTable columns={COLUMNS} rows={reportRows(state, model, data, st, status.sim)} />
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
            <Button variant="secondary" onClick={() => setModal('sources')}>See all NASA sources</Button>
          </div>
          <div className={styles.main}>
            <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
            <Button variant="outline" onClick={() => setModal('reset')}>Start a new mission</Button>
          </div>
        </div>
      </div>
    )
  }

  const analysed = evidence === 'sample'
    ? 'The lab opened the samples you brought home.'
    : home
      ? 'The lab studied the data from your instruments.'
      : 'The lab studied the data your lander sent from the Moon.'
  const tone = strong ? styles.rejected : styles.open

  return (
    <div className={styles.screen}>
      {hud}
      {speech(strong ? 'No cheese. Just rock.' : 'We need better proof.')}
      <div className={styles.panelWide}>
        <GlassPanel eyebrow="Lab · Final verdict" title="Is the Moon made of cheese?">
          <div className={`${styles.verdict} ${tone}`}>
            <p className={styles.hypothesis}>Hypothesis: The Moon is made of cheese.</p>
            <p className={styles.verdictLine}>{strong ? 'Verdict: rejected' : 'Verdict: not proven yet'}</p>
            <p className={styles.line}>{analysed}</p>
            {strong ? (
              <p className={styles.line}>The ground is rock and dust, not cheese. {best ? best.result.text : ''}</p>
            ) : (
              <>
                <p className={styles.line}>Your evidence was only pictures. A picture cannot tell rock from cheese.</p>
                <p className={styles.line}>Next time bring a spectrometer to read the elements, or collect a sample to bring home.</p>
              </>
            )}
          </div>
          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => openSource('nssdc')}>Moon fact sheet ↗</Button>
            <Button variant="ghost" onClick={() => openSource(regolith.src)}>Regolith ↗</Button>
            {best ? <Button variant="ghost" onClick={() => openSource(best.result.src)}>Your result ↗</Button> : null}
            {evidence === 'sample' ? <Button variant="ghost" onClick={() => openSource('samples')}>Lunar samples ↗</Button> : null}
            {evidence === 'sample' ? <Button variant="ghost" onClick={() => openSource('sampleScience')}>Sample science ↗</Button> : null}
          </div>
          <p className={styles.line}><b>Density:</b> {data.FACTS.density.text}</p>
          <MathBlock math={model.moonDensityMath()} />
          <p className={styles.line}><b>Regolith:</b> {regolith.text}</p>
          <p className={styles.line}>{data.FACTS.crust.text}</p>
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => setModal('sources')}>See all NASA sources</Button>
        </div>
        <div className={styles.main}>
          <Button variant="outline" onClick={() => setStep('report')}>Mission report →</Button>
        </div>
      </div>
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
