import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import { HELP_F5A } from '../data/help.mjs'
import { useGame } from '../engine/useGame.jsx'
import { sampleMission } from '../engine/sampleMission.mjs'
import { f5aSpeech } from './f5Speech.mjs'
import { StageScene } from './frame.jsx'
import styles from './F5.module.css'
import scene from './scene.module.css'

const RISK = { 1: 'low', 2: 'medium', 3: 'high' }
const PINS = { tranquility: [39, 30], descartes: [47, 52], southPole: [39, 69] }
const PHASE_ROUTES = { 0: '/f0', 1: '/f1a', 2: '/f2', 3: '/f3a', 4: '/f4' }

/** Blocks left over from Phases 0 to 4, for players who reach this screen before finishing them. */
export function earlierGaps(state, model) {
  if (!model.evaluate(state)) return [{ code: 'noMission', message: 'Pick a mission first.' }]
  return model.launchReadiness(state).phases
    .filter((item) => !item.ok)
    .flatMap((item) => item.issues.filter((issue) => issue.severity === 'block'))
}

/*
 * Top bar for Phase 5, in the shared scene bar like Phases 2 to 4, with the four numbers that matter for a
 * landing: where we are, delta-v left after the lunar orbit burn, hover time the fuel margin buys, and the
 * lander's mass. Launch mass, days and data sent tell nothing at this point, so they stay out.
 */
export function F5Hud({ where }) {
  const { state, model } = useGame()
  const hud = model.hud(state, { flown: ['loi'] })
  const evaluated = Boolean(model.evaluate(state))
  const lander = evaluated ? model.approachMass(state) : null
  const dash = '—'
  return (
    <div className={`${scene.hud} ${styles.hud}`} aria-label="Mission status">
      <span>{where}</span>
      <span>Delta-v left {hud.dvRemaining ? `${model.fmt(hud.dvRemaining.planned)} m/s` : dash}</span>
      <span>Hover {evaluated ? `${model.fmt(model.hoverAvailable(state))} s` : dash}</span>
      <span>Lander {lander ? `${model.fmt(lander)} kg` : dash}</span>
    </div>
  )
}

/**
 * Loads a sample mission into the draft state, used by Phases 5 to 7. The samples are saved as Cadet, so
 * the player's difficulty is kept when the sample still passes its rules there. Flight Director rules are
 * stricter than any sample, so it falls back to Engineer and says so (the string becomes a notice).
 */
export function loadSample(next, model, type, stage) {
  const level = next.difficulty
  Object.assign(next, sampleMission(type, stage))
  next.difficulty = level
  if (model.evaluate(next) && model.launchReadiness(next).phases.every((item) => item.ok)) return null
  next.difficulty = 'engineer'
  return 'Sample missions follow Engineer rules, so the difficulty is now Engineer.'
}

export function NeedsEarlier({ stage, gaps }) {
  const navigate = useNavigate()
  const { state, model, update } = useGame()
  // Send the player to the first phase that still has a block, not always to Phase 2.
  const phases = gaps.map((gap) => gap.phase).filter((phase) => Number.isInteger(phase) && PHASE_ROUTES[phase])
  const first = phases.length ? Math.min(...phases) : 0
  return (
    <GlassPanel tone="warn" eyebrow="Before you go" title="Missing steps">
      <p className={styles.line}>This step needs the earlier phases. Finish them first, or load a sample mission to try it now.</p>
      <ul className={styles.warnList}>
        {gaps.slice(0, 3).map((gap, index) => <li key={`${gap.code}-${index}`}>{gap.message}</li>)}
      </ul>
      <Button variant="outline" onClick={() => navigate(PHASE_ROUTES[first])}>Go to Phase {first}</Button>
      <Button
        variant="outline"
        onClick={() => update((next) => loadSample(next, model, state.missionType || 'robotic', stage))}
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
      title="How far is up? · Phase 5: Landing Site"
    >
      <F5aBody />
    </StageScene>
  )
}

/* Warnings that a fact row or the site card already says; they are flagged there instead of listed twice. */
const SHOWN_IN_FACTS = ['siteMismatch', 'nightDeath', 'suitCold', 'earthHidden', 'lowHover']

/** [label, value, warn] rows for the picked site. A warning row says it in words too, not only in colour. */
function siteFacts(state, report, model) {
  const crewed = state.missionType === 'crewed'
  const short = report.hoverAvailable < report.hoverTypical
  const rows = [
    ['Hover you have', `${model.fmt(report.hoverAvailable)} s of ${model.fmt(report.hoverTypical)} s needed${short ? ', not enough' : ''}`, short],
    ['Earth in view', report.earthView === 'always' ? 'Always' : 'Comes and goes', report.earthView !== 'always'],
  ]
  if (!crewed) {
    rows.push(['Survives the night', report.survivesNight ? 'Yes' : `No, ${model.fmt(report.nightHours || 0)} h of ${report.site.darkHours} h`, !report.survivesNight])
    rows.push(['Daylight to work', `${model.fmt(report.opsHours)} h`, false])
  } else {
    rows.push(['Moonwalk hours', report.evaHours == null ? '—' : `${model.fmt(report.evaHours)} h`, false])
    if (report.site.coldShadow) rows.push(['Cold risk for your suit', report.coldRisk ? 'Yes' : 'No', Boolean(report.coldRisk)])
  }
  return rows
}

function F5aBody() {
  const navigate = useNavigate()
  const { state, data, model, update } = useGame()
  const [help, setHelp] = useState(false)
  const gaps = earlierGaps(state, model)
  const ready = gaps.length === 0
  const picked = data.SITES.find((site) => site.id === state.site) || null
  const pick = (id) => update((next) => { next.site = id; next.landing = null })
  const issues = picked && ready
    ? model.validatePhase(state, 5).issues.filter((issue) => issue.severity === 'warn' && !SHOWN_IN_FACTS.includes(issue.code))
    : []
  const report = picked && ready ? model.siteReport(state, picked.id) : null
  const facts = report ? siteFacts(state, report, model) : []
  const flagged = facts.some(([, , warn]) => warn)
  const speech = f5aSpeech(state.difficulty, {
    ready,
    site: report ? {
      have: model.fmt(report.hoverAvailable),
      need: model.fmt(report.hoverTypical),
      tight: report.hoverAvailable < report.hoverTypical,
      fit: report.scienceMatch,
    } : null,
  })

  return (
    <div className={styles.screen}>
      <F5Hud where="Moon orbit" />
      {speech ? (
        <div className={`${styles.speech} ${styles.speechSite}`}>
          <Bubble tone="speech">{speech}</Bubble>
        </div>
      ) : null}
      {/* The three orbiter instruments; once a site is picked each one shows what it read there. */}
      <div className={styles.tools} aria-label={picked ? `Orbiter readings for ${picked.title}` : 'Orbiter instruments'}>
        <span className={styles.tool}><b>LOLA</b> · {picked ? picked.lola : 'Slopes'}</span>
        <span className={styles.tool}><b>LROC</b> · {picked ? picked.lroc : 'Photos'}</span>
        <span className={styles.tool}><b>Diviner</b> · {picked ? picked.diviner : 'Temperature'}</span>
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
          <GlassPanel eyebrow="Phase 5: Landing Site · NASA Phase E" title="Where do we land?">
            <div className={styles.sites} role="group" aria-label="Landing sites">
              {data.SITES.map((site, index) => {
                const r = model.siteReport(state, site.id)
                return (
                  <OptionRow
                    key={site.id}
                    variant="line"
                    number={index + 1}
                    text={site.title}
                    chips={(
                      <span className={styles.rowNote}>
                        Risk: {RISK[site.hazard]} · <span className={r.scienceMatch ? undefined : styles.factWarn}>{r.scienceMatch ? 'Good for your question' : 'Not the best for your question'}</span>
                      </span>
                    )}
                    selected={state.site === site.id}
                    onSelect={() => pick(site.id)}
                  />
                )
              })}
            </div>
            {picked && report ? (
              <>
                <dl className={styles.facts}>
                  {facts.map(([label, value, warn]) => (
                    <div key={label}><dt>{label}</dt><dd className={warn ? styles.factWarn : undefined}>{value}</dd></div>
                  ))}
                </dl>
                {issues.length ? (
                  <ul className={styles.warnList}>
                    {issues.map((issue) => <li key={issue.code}>{issue.message}</li>)}
                  </ul>
                ) : null}
                {issues.length || flagged || !report.scienceMatch ? null : <p className={`${styles.line} ${styles.good}`}>No warnings for this site.</p>}
              </>
            ) : <p className={styles.small}>Pick a card or a pin on the Moon.</p>}
          </GlassPanel>
        ) : <NeedsEarlier stage="f5a" gaps={gaps} />}
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f3b')}>← Launch</Button>
          <Button variant="secondary" onClick={() => setHelp(true)}>? Help</Button>
        </div>
        <div className={styles.lock}>
          <Button
            variant="outline"
            disabledReason={!ready ? 'Load a sample mission first' : picked ? '' : 'Pick a landing site'}
            onClick={() => navigate('/f5b')}
          >
            Choose this site
          </Button>
        </div>
      </div>
      <HelpWindow help={HELP_F5A} open={help} onClose={() => setHelp(false)} />
    </div>
  )
}

/** "? Help" window for both Phase 5 screens: one paragraph per block of help.mjs. */
export function HelpWindow({ help, open, onClose }) {
  return (
    <Modal open={open} variant="info" title={help.title} onClose={onClose}>
      {help.blocks.map((block) => (
        <p key={block.heading}><b>{block.heading}:</b> {block.text}</p>
      ))}
    </Modal>
  )
}
