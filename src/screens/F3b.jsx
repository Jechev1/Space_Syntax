import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { Stage } from '../components/stage/Stage.jsx'
import { useGame } from '../engine/useGame.jsx'
import { usePhaseGuard } from './frame.jsx'
import styles from './F3b.module.css'
import { SceneHud } from './scene.jsx'
import scene from './scene.module.css'

/* bg-plataforma is not drawn yet: until it lands in public/bg the stage falls back to the starry sky. */
const BACKGROUND = '/bg/bg-plataforma.png'
const CHARACTER = '/char/nina-traje-pie.png'
const ROWS = ['totalMass', 'deltaV', 'crew', 'missionDays', 'lifeSupport', 'comms']

export function F3b() {
  const ready = usePhaseGuard('/f3b')
  if (!ready) return null
  return <F3bScreen />
}

function F3bScreen() {
  const navigate = useNavigate()
  const game = useGame()
  const { state, model } = game
  const background = useImageOrNothing(BACKGROUND)
  const summary = model.launchRows(state)
  const rows = summary.rows.filter((row) => ROWS.includes(row.key))
  const blocker = summary.G.issues.find((issue) => issue.severity === 'block')

  useEffect(() => {
    document.title = 'Space Syntax — Launch pad'
  }, [])

  return (
    <Stage background={background} character={CHARACTER}>
      <div className={scene.screen}>
        <SceneHud where="Earth → Ship" />
        <div className={`${scene.speech} ${styles.speech}`}>
          <Bubble tone="speech">{state.launched ? 'We are on our way!' : "Let's go to the Moon."}</Bubble>
        </div>
        <div className={scene.panel}>
          <GlassPanel>
            {state.launched ? (
              <p className={scene.kicker}>Launch pad</p>
            ) : (
              <button type="button" className={scene.kicker} onClick={() => navigate('/f3a')}>
                Launch pad · Back to the flight plan
              </button>
            )}
            <h2 className={scene.title}>Mission summary</h2>
            <div className={styles.rows}>
              {rows.map((row) => (
                <div key={row.key} className={styles.row}>
                  <span>{row.label}</span>
                  <span className={styles.value}>{valueText(row, model.fmt)}</span>
                  <span className={`${styles.go} ${row.ok ? styles.ok : styles.no}`}>{row.ok ? 'GO' : 'NO GO'}</span>
                </div>
              ))}
            </div>
            <p className={`${styles.verdict} ${summary.go ? '' : styles.notReady}`}>
              {summary.go ? 'All systems GO' : `Not ready: ${blocker ? blocker.message : 'fix the NO GO items'}`}
            </p>
          </GlassPanel>
        </div>
        <p className={styles.warning}>After launch you cannot change Phases 0 to 3.</p>
        <div className={scene.lock}>
          <LaunchButton game={game} ready={summary.go} />
        </div>
      </div>
    </Stage>
  )
}

function LaunchButton({ game, ready }) {
  const { state, launch, setNotice } = game
  if (state.launched) {
    return <Button variant="outline" disabledReason="Phase 5 is being built">Launched ✓</Button>
  }
  return (
    <Button
      variant="outline"
      disabled={!ready}
      disabledReason={ready ? '' : 'Every item must be GO'}
      onClick={() => {
        flushSync(() => {
          launch()
          setNotice('Liftoff! 🚀')
        })
      }}
    >
      Launch
    </Button>
  )
}

function valueText(row, fmt) {
  if (row.key === 'totalMass') return row.value == null ? '—' : `${fmt(row.value)} kg`
  if (row.key === 'deltaV') return row.value == null ? '—' : `${fmt(row.value)} m/s`
  if (row.key === 'crew') return row.value == null ? 'Robots only' : String(row.value)
  if (row.key === 'missionDays') return row.value == null ? '—' : fmt(row.value)
  if (row.key === 'lifeSupport') return row.value === 'ok' ? 'OK' : 'Not needed'
  if (row.key === 'comms') return row.value || 'Phase 4'
  return row.value == null ? '—' : String(row.value)
}

/** Returns src once the image loads, or '' when it is missing, so the stage can fall back. */
function useImageOrNothing(src) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let alive = true
    const img = new Image()
    img.onload = () => { if (alive) setOk(true) }
    img.onerror = () => { if (alive) setOk(false) }
    img.src = src
    return () => { alive = false }
  }, [src])
  return ok ? src : ''
}
