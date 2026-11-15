import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import { useGame } from '../engine/useGame.jsx'
import { sampleMission } from '../engine/sampleMission.mjs'
import { StageScene } from './frame.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F5.module.css'

const RISK = { 1: 'low', 2: 'medium', 3: 'high' }
const PINS = { tranquility: [39, 30], descartes: [47, 52], southPole: [39, 69] }

/** Blocks left over from Phases 0 to 4. Those phases are not in React yet, so a fresh save has some. */
export function earlierGaps(state, model) {
  if (!model.evaluate(state)) return [{ code: 'noMission', message: 'Pick a mission first.' }]
  return model.launchReadiness(state).phases
    .filter((item) => !item.ok)
    .flatMap((item) => item.issues.filter((issue) => issue.severity === 'block'))
}

export function F5Hud({ where }) {
  const { state, model } = useGame()
  const hud = model.hud(state, { flown: ['loi'] })
  const dv = hud.dvRemaining ? `${model.fmt(hud.dvRemaining.planned)} m/s` : '—'
  const days = hud.days == null ? '—' : model.fmt(hud.days)
  return (
    <div className={styles.hud} aria-label="Mission status">
      <span>{where}</span>
      <span>Delta-v left {dv}</span>
      <span>Mass {model.fmt(hud.launchMass)} kg</span>
      <span>Days {days}</span>
      <span>Data {model.fmt(hud.dataSentGb)} Gb sent</span>
    </div>
  )
}

export function NeedsEarlier({ stage, gaps }) {
  const { state, update } = useGame()
  return (
    <GlassPanel tone="warn" eyebrow="Before you go" title="Missing steps">
      <p className={styles.line}>This step needs Phases 2 to 4, which are not in this version yet.</p>
      <ul className={styles.warnList}>
        {gaps.slice(0, 3).map((gap) => <li key={gap.code}>{gap.message}</li>)}
      </ul>
      <Button
        variant="outline"
        onClick={() => update((next) => { Object.assign(next, sampleMission(state.missionType || 'robotic', stage)) })}
      >
        Load a sample mission
      </Button>
    </GlassPanel>
  )
}

export function F5a() {
  return (
    <StageScene
      background="/bg/bg-portilla-luna.png"
      character={<img className={styles.girl} src="/char/nina-ventanilla.png" alt="" />}
      title="How far is up? — Phase 5"
    >
      <F5aBody />
    </StageScene>
  )
}

function siteFacts(state, report, model) {
  const crewed = state.missionType === 'crewed'
  const rows = [
    ['Hover needed', `${model.fmt(report.hoverTypical)} s typical`],
    ['Hover you have', `${model.fmt(report.hoverAvailable)} s`],
    ['Earth in view', report.earthView === 'always' ? 'Always' : 'Comes and goes'],
  ]
  if (!crewed) {
    rows.push(['Survives the night', report.survivesNight ? 'Yes' : `No, ${model.fmt(report.nightHours || 0)} h of ${report.site.darkHours} h`])
    rows.push(['Daylight to work', `${model.fmt(report.opsHours)} h`])
  } else {
    rows.push(['Moonwalk hours', report.evaHours == null ? '—' : `${model.fmt(report.evaHours)} h`])
    if (report.site.coldShadow) rows.push(['Cold risk for your suit', report.coldRisk ? 'Yes' : 'No'])
  }
  return rows
}

function F5aBody() {
  const navigate = useNavigate()
  const { state, data, model, update } = useGame()
  const { setModal } = usePlay()
  const gaps = earlierGaps(state, model)
  const ready = gaps.length === 0
  const picked = data.SITES.find((site) => site.id === state.site) || null
  const pick = (id) => update((next) => { next.site = id; next.landing = null })
  const issues = picked && ready ? model.validatePhase(state, 5).issues.filter((issue) => issue.severity === 'warn') : []
  const report = picked && ready ? model.siteReport(state, picked.id) : null

  return (
    <div className={styles.screen}>
      <F5Hud where="Moon orbit" />
      <div className={styles.speech}>
        <Bubble tone="speech">Which site can answer our question?</Bubble>
      </div>
      <div className={styles.tools} aria-hidden="true">
        <span className={styles.tool}>LOLA · Slopes</span>
        <span className={styles.tool}>LROC · Photos</span>
        <span className={styles.tool}>Diviner · Temperature</span>
      </div>
      {ready ? data.SITES.map((site, index) => (
        <button
          key={site.id}
          type="button"
          className={`${styles.pin} ${state.site === site.id ? styles.pinOn : ''}`}
          style={{ left: `${PINS[site.id][0]}%`, top: `${PINS[site.id][1]}%` }}
          aria-pressed={state.site === site.id}
          onClick={() => pick(site.id)}
        >
          <span className={styles.pinNum}>{index + 1}</span>
          {site.title.split(' (')[0].replace(' crater rim', '')}
        </button>
      )) : null}
      <div className={styles.panel}>
        {ready ? (
          <GlassPanel eyebrow="Phase 5 · Landing site" title="Where should we land?">
            <div className={styles.sites} role="group" aria-label="Landing sites">
              {data.SITES.map((site, index) => {
                const r = model.siteReport(state, site.id)
                return (
                  <OptionRow
                    key={site.id}
                    variant="line"
                    number={index + 1}
                    text={site.title}
                    chips={<span className={styles.rowNote}>{`Risk: ${RISK[site.hazard]} · ${r.scienceMatch ? 'Good for your question' : 'Not the best for your question'}`}</span>}
                    selected={state.site === site.id}
                    onSelect={() => pick(site.id)}
                  />
                )
              })}
            </div>
            {picked && report ? (
              <>
                <dl className={styles.facts}>
                  {siteFacts(state, report, model).map(([label, value]) => (
                    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
                {issues.length ? (
                  <ul className={styles.warnList}>
                    {issues.map((issue) => <li key={issue.code}>{issue.message}</li>)}
                  </ul>
                ) : <p className={`${styles.line} ${styles.good}`}>No warnings for this site.</p>}
                <dl className={styles.facts}>
                  <div><dt>LOLA, slopes</dt><dd>{picked.lola}</dd></div>
                  <div><dt>LROC, photos</dt><dd>{picked.lroc}</dd></div>
                  <div><dt>Diviner, heat</dt><dd>{picked.diviner}</dd></div>
                </dl>
              </>
            ) : <p className={styles.small}>Pick a card or a pin on the Moon.</p>}
          </GlassPanel>
        ) : <NeedsEarlier stage="f5a" gaps={gaps} />}
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f1done')}>← Back</Button>
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
        <Button
          variant="outline"
          disabledReason={!ready ? 'Load a sample mission first' : picked ? '' : 'Pick a landing site'}
          onClick={() => navigate('/f5b')}
        >
          Choose this site
        </Button>
      </div>
    </div>
  )
}
