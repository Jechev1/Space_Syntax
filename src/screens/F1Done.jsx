import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { ReviewList } from '../components/ui/ReviewList.jsx'
import { missionProfile, useGame } from '../engine/useGame.jsx'
import { kgText, usdText } from './bits.jsx'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { MissionHud } from './f1Hud.jsx'
import { usePlay } from './playContext.jsx'
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
      objects={state.rocket ? <img className={styles.reviewRocket} src={rocketArt(state.rocket)} alt="" /> : null}
      title="How far is upy — Phase 1"
    >
      <F1DoneBody />
    </StageScene>
  )
}

function F1DoneBody() {
  const navigate = useNavigate()
  const { state, model } = useGame()
  const { setModal } = usePlay()
  const report = model.evaluate(state)
  if (!report) return <p className={shell.note}>Pick a mission first.</p>
  const crewed = state.missionType === 'crewed'
  const items = [
    ['Launch mass', report.rocket && report.tli <= report.rocket.capacity, `${kgText(model, report.tli)} / ${model.fmt(report.rocket ? report.rocket.capacity : 0)}`],
    ['Budget', report.totalCost <= report.budget, `${usdText(model, report.totalCost)} / ${usdText(model, report.budget)}`],
    ['Power', report.powerGen >= report.powerNeed, `${model.fmt(report.powerNeed)} / ${model.fmt(report.powerGen)} W`],
    ['Science', model.payloadAnswers(state), 'answers your question'],
  ]
  let night = 'Crew lander power sized in later phases'
  if (!crewed) {
    if (report.nightHours > 300) night = 'Survives any lunar night'
    else if (report.nightHours > 0) night = `Survives about ${report.nightHours} h of darkness: pick a polar site in Phase 5`
    else night = 'Will not survive the lunar night: plan a short mission'
  }

  return (
    <div className={`${styles.screen} ${styles.review}`}>
      <MissionHud />
      <div className={styles.speech}>
        <Bubble tone="speech">Does it all fit?</Bubble>
      </div>
      <div className={styles.panel}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 1 · Design review</p>
          <h2 className={styles.question}>Ready on the launch pad</h2>
          <p className={styles.line}>{missionProfile(state)} on {report.rocket ? report.rocket.title : ''}.</p>
          <ReviewList items={items.map(([label, ok, detail]) => ({ label, ok, detail }))} />
          <p className={styles.line}>{night}</p>
          <p className={styles.line}>
            {crewed
              ? 'Next: crew and life support. Each astronaut needs about 0.9 kg of oxygen, 0.8 kg of food and 3.2 kg of water per day.'
              : 'Next: the flight plan. Spend your delta-v budget maneuver by maneuver.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/f2')}>Next phase →</Button>
          <div className={shell.actions}>
            <Button variant="ghost" onClick={() => setModal('sources')}>See all NASA sources</Button>
            <Button variant="ghost" onClick={() => setModal('reset')}>Start a new mission</Button>
          </div>
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f1a')}>← Workshop</Button>
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
      </div>
    </div>
  )
}
