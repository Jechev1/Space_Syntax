import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { HELP_F1DONE } from '../data/help.mjs'
import { missionProfile, useGame } from '../engine/useGame.jsx'
import { kgText, usdText } from './bits.jsx'
import { f1doneSpeech } from './f1Speech.mjs'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { MissionHud } from './f1Hud.jsx'
import { rocketArt } from './F1b.jsx'
import styles from './F1.module.css'
import shell from './shell.module.css'

export function F1Done() {
  const ready = usePhaseGuard('/f1done')
  const { state } = useGame()
  if (!ready) return null
  return (
    <StageScene
      background="/bg/bg-plataforma.png"
      character={<img className={styles.girl} src="/char/nina-overol-llave.png" alt="" />}
      objects={state.rocket ? (
        <div className={styles.reviewRocket}>
          <img src={rocketArt(state.rocket)} alt="" />
          <span className={styles.craftTag}>Your spacecraft</span>
        </div>
      ) : null}
      title="How far is up? · Phase 1"
    >
      <F1DoneBody />
    </StageScene>
  )
}

function F1DoneBody() {
  const navigate = useNavigate()
  const { state, model } = useGame()
  const [help, setHelp] = useState(false)
  const report = model.evaluate(state)
  if (!report) return <p className={shell.note}>Pick a mission first.</p>
  const crewed = state.missionType === 'crewed'
  const items = [
    { label: 'Launch mass', ok: Boolean(report.rocket) && report.tli <= report.rocket.capacity, detail: `${kgText(model, report.tli)} / ${model.fmt(report.rocket ? report.rocket.capacity : 0)} kg` },
    { label: 'Budget', ok: report.totalCost <= report.budget, detail: `${usdText(model, report.totalCost)} / ${usdText(model, report.budget)}` },
    { label: 'Power', ok: report.powerGen >= report.powerNeed, detail: `${model.fmt(report.powerNeed)} / ${model.fmt(report.powerGen)} W` },
    { label: 'Science', ok: model.payloadAnswers(state), detail: 'answers your question' },
  ]
  let nightNote = ''
  if (!crewed) {
    if (report.nightHours > 300) nightNote = 'Survives any lunar night.'
    else if (report.nightHours > 0) nightNote = `Survives about ${report.nightHours} h of darkness: pick a polar site in Phase 5.`
    else nightNote = 'Will not survive the lunar night: plan a short mission.'
  }
  const nextNote = crewed ? 'Next: crew and life support.' : 'Next: the flight plan.'
  const speech = f1doneSpeech(state.difficulty, nightNote, nextNote)

  return (
    <div className={`${styles.screen} ${styles.review}`}>
      <MissionHud />
      {speech ? (
        <div className={styles.speech}>
          <Bubble tone="speech">{speech}</Bubble>
        </div>
      ) : null}
      <div className={styles.checks} role="list" aria-label="Design review">
        {items.map((item) => (
          <div key={item.label} className={styles.check} role="listitem">
            <span className={styles.checkName}>{item.label}</span>
            <span className={styles.checkVal}>{item.detail}</span>
            <span className={item.ok ? styles.checkGo : styles.checkNo}>{item.ok ? 'GO' : 'NO GO'}</span>
          </div>
        ))}
      </div>
      <div className={styles.panel}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 1: Build the Spacecraft · NASA Phase D · Design review</p>
          <h2 className={styles.question}>Ready on the launch pad</h2>
          <p className={styles.line}>{missionProfile(state)} on {report.rocket ? report.rocket.title : ''}.</p>
          <Button variant="primary" onClick={() => navigate('/f2')}>Next phase →</Button>
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f1a')}>← Workshop</Button>
          <Button variant="secondary" onClick={() => setHelp(true)}>? Help</Button>
        </div>
      </div>
      <div className={styles.help}>
        <Modal open={help} variant="info" title={HELP_F1DONE.title} onClose={() => setHelp(false)}>
          {HELP_F1DONE.blocks.map((block) => (
            <p key={block.heading}><b>{block.heading}:</b> {block.text}</p>
          ))}
        </Modal>
      </div>
    </div>
  )
}
