import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Dialog } from '../components/ui/Dialog.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { missionProfile, useGame } from '../engine/useGame.jsx'
import { Credits } from './dialogs.jsx'
import { StageScene, usePhaseGuard } from './frame.jsx'
import f1 from './F1.module.css'
import styles from './F8.module.css'

const TITLE = 'How far is up? · Mission complete'

export function F8() {
  const ready = usePhaseGuard('/f8')
  const navigate = useNavigate()
  const { state, model } = useGame()
  const [credits, setCredits] = useState(false)

  if (!ready) return null

  const report = model.evaluate(state)
  const days = model.missionDays(state)
  const rows = [
    ['Mission', missionProfile(state)],
    ['Rocket', report && report.rocket ? report.rocket.title : '—'],
    ['Launch mass', report ? `${model.fmt(report.tli)} kg` : '—'],
    ['Budget used', report ? `$${model.fmt(report.totalCost)}M of $${model.fmt(report.budget)}M` : '—'],
    ['Mission length', days != null ? `${model.fmt(days)} days` : '—'],
  ]

  return (
    <StageScene background="/bg/bg-final.png" title={TITLE}>
      <div className={f1.screen}>
        <div className={styles.panel}>
          <GlassPanel
            eyebrow="Phase 8: Mission Complete · NASA Phase F"
            title="Mission complete"
          >
            <p className={styles.line}>
              {state.missionType === 'robotic'
                ? 'Your samples made it home.'
                : 'Your crew splashed down safely. You took a mission from an idea to the Moon and back.'}
            </p>
            <dl className={styles.rows}>
              {rows.map(([label, value]) => (
                <div key={label} className={styles.row}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </GlassPanel>
        </div>
        <div className={f1.dock}>
          <div className={f1.nav}>
            <Button variant="secondary" onClick={() => navigate('/f7')}>← Phase 7</Button>
            <Button variant="secondary" onClick={() => setCredits(true)}>Credits</Button>
          </div>
          <div className={f1.lock}>
            {/* The lab comes last: it analyses what the mission brought home. */}
            <Button variant="outline" onClick={() => navigate('/lab')}>Go to lab →</Button>
          </div>
        </div>
        {credits ? (
          <Dialog title="Credits" onClose={() => setCredits(false)}>
            <Credits />
          </Dialog>
        ) : null}
      </div>
    </StageScene>
  )
}
