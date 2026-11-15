import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { continuePath, missionInProgress, useGame } from '../engine/useGame.jsx'
import { StageScene } from './frame.jsx'
import f1 from './F1.module.css'
import styles from './OffCourse.module.css'

/** Any address that is not a screen, like /f9. The astronaut points the way back instead of a silent jump. */
export function OffCourse() {
  const navigate = useNavigate()
  const { state } = useGame()
  const playing = missionInProgress(state)

  return (
    <StageScene
      background="/bg/bg-orbita-lunar.png"
      character={<img className={f1.girl} src="/char/nina-traje-pie.png" alt="" />}
      title="How far is up? · Off course"
    >
      <div className={f1.screen}>
        <div className={styles.panel}>
          <GlassPanel eyebrow="Mission control" title="Off course!">
            <p className={styles.line}>Nothing out here but stars. Let's head back.</p>
            {playing ? <p className={styles.line}>Your mission is saved.</p> : null}
          </GlassPanel>
        </div>
        <div className={f1.dock}>
          <div className={f1.nav}>
            {playing ? <Button variant="secondary" onClick={() => navigate(continuePath(state))}>Continue my trip</Button> : null}
          </div>
          <div className={f1.lock}>
            <Button variant="outline" onClick={() => navigate('/inicio')}>Back to the start</Button>
          </div>
        </div>
      </div>
    </StageScene>
  )
}
