import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { ReviewList } from '../components/ui/ReviewList.jsx'
import { missionProfile, useGame } from '../engine/useGame.jsx'
import { EquipmentList, kgText, usdText } from './bits.jsx'
import { MissionBubble, MissionFrame, usePhaseGuard } from './frame.jsx'
import { usePlay } from './playContext.jsx'
import shell from './shell.module.css'

export function F1Done() {
  const ready = usePhaseGuard('/f1done')
  if (!ready) return null
  return (
    <MissionFrame phase={1} title="Space Syntax — Phase 1 complete">
      <F1DoneBody />
    </MissionFrame>
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
    <div className={shell.split}>
      <div className={shell.stack}>
        <p className={shell.kicker}>Phase 1 complete · Launch site, Earth</p>
        <h1 className={shell.h1}>Ready on the launch pad! 🚀</h1>
        <p className={shell.lead}>{missionProfile(state)} on {report.rocket ? report.rocket.title : ''}.</p>
        <MissionBubble id="f1done">
          Our spacecraft passed the design review. Next stop: {crewed ? 'feeding the crew' : 'the flight plan'}. The cheese truth is getting closer…
        </MissionBubble>
        <GlassPanel eyebrow="Design review: GO / NO GO" title="Checks">
          <ReviewList items={items.map(([label, ok, detail]) => ({ label, ok, detail }))} />
          <p className={shell.note}>🌙 {night}</p>
        </GlassPanel>
        <GlassPanel eyebrow="Master Equipment List" title="Parts">
          <EquipmentList report={report} />
        </GlassPanel>
      </div>
      <div className={shell.stack}>
        <GlassPanel eyebrow="Coming next" title={crewed ? 'Phase 2 · Crew & life support' : 'Phase 3 · Flight plan & delta-v'}>
          <p className={shell.note}>
            {crewed
              ? 'Each astronaut needs about 0.9 kg of oxygen, 0.8 kg of food and 3.2 kg of water per day (NASA BVAD).'
              : 'Spend your delta-v budget maneuver by maneuver.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/f2')}>Next phase →</Button>
        </GlassPanel>
        <GlassPanel eyebrow="Mission" title="Keep going">
          <div className={shell.stack}>
            <Button variant="secondary" onClick={() => navigate('/f1a')}>← Back to workshop</Button>
            <Button variant="ghost" onClick={() => setModal('sources')}>See all NASA sources</Button>
            <Button variant="ghost" onClick={() => setModal('reset')}>Start a new mission</Button>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
