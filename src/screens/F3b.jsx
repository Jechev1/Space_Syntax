import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { useGame } from '../engine/useGame.jsx'
import { rocketArt } from './F1b.jsx'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F3b.module.css'
import { SceneHud } from './scene.jsx'
import scene from './scene.module.css'

const BACKGROUND = '/bg/bg-plataforma.png'
const CHARACTER = '/char/nina-traje-pie.png'
const ROWS = ['totalMass', 'deltaV', 'crew', 'missionDays', 'lifeSupport', 'comms']
/* Short link names, same as F4. launchRows gives the full title. */
const LINK_NAMES = { 'S-band radio': 'Basic radio', 'Ka-band high-gain antenna': 'Ka-band', 'Laser communications': 'Laser link' }

export function F3b() {
  const ready = usePhaseGuard('/f3b')
  const { state } = useGame()
  if (!ready) return null
  return (
    <StageScene
      background={BACKGROUND}
      character={<img className={scene.girl} src={CHARACTER} alt="" />}
      objects={state.rocket ? <img className={styles.rocket} src={rocketArt(state.rocket)} alt="" /> : null}
      title="How far is upy — Launch pad"
    >
      <F3bBody />
    </StageScene>
  )
}

function F3bBody() {
  const navigate = useNavigate()
  const { setModal } = usePlay()
  const game = useGame()
  const { state, model } = game
  const summary = model.launchRows(state)
  const rows = summary.rows.filter((row) => ROWS.includes(row.key))
  const blocker = summary.G.issues.find((issue) => issue.severity === 'block')

  return (
    <div className={scene.screen}>
      <SceneHud where="Earth → Ship" />
      <div className={`${scene.speech} ${styles.speech}`}>
        <Bubble tone="speech">{state.launched ? 'We are on our way!' : "Let's go to the Moon."}</Bubble>
      </div>
      <div className={scene.panel}>
        <GlassPanel>
          <p className={scene.kicker}>Launch pad</p>
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
      <p className={styles.warning}>After launch you cannot change Phases 0 to 4.</p>
      <div className={scene.dock}>
        <div className={scene.nav}>
          {state.launched ? null : (
            <Button variant="secondary" onClick={() => navigate('/f4')}>← Comms</Button>
          )}
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
        <div className={scene.lock}>
          <LaunchButton game={game} ready={summary.go} />
        </div>
      </div>
    </div>
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
  if (row.key === 'comms') return row.value ? (LINK_NAMES[row.value] || row.value) : 'Not chosen'
  return row.value == null ? '—' : String(row.value)
}
