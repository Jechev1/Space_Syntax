import { useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { useGame } from '../engine/useGame.jsx'
import { usePlayRun } from '../engine/usePlayRun.jsx'
import { RunVerdict, rocketArt } from './F1b.jsx'
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
  const play = usePlayRun(1, state)
  if (!ready) return null
  const { run, frame } = play
  const burning = Boolean(run && run.status === 'running')
  // The rocket rises with the speed gained and leaves the scene; once launched the pad is empty.
  const k = frame ? Math.min(1, frame.dv / 3150) : 0
  const rocket = state.rocket && !state.launched ? (
    <div className={styles.rocket} style={{ '--k': k }} aria-hidden="true">
      <img className={styles.rocketImg} src={rocketArt(state.rocket)} alt="" />
      {burning ? <span className={styles.flame} /> : null}
    </div>
  ) : null
  return (
    <StageScene
      background={BACKGROUND}
      character={<img className={scene.girl} src={CHARACTER} alt="" />}
      objects={rocket}
      title="How far is up? — Launch pad"
    >
      <F3bBody play={play} />
    </StageScene>
  )
}

function F3bBody({ play }) {
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
          {play.run && play.run.status === 'running' && play.frame ? (
            <div className={styles.telemetry} role="img" aria-label={`Speed ${Math.round(play.frame.dv)} metres per second`}>
              <span>Speed</span><span>{Math.round(play.frame.dv).toLocaleString('en-US')} m/s</span>
              <span>Fuel left</span><span>{Math.round(play.frame.prop).toLocaleString('en-US')} kg</span>
              <span>Flight time</span><span>{Math.round(play.run.t)} s</span>
            </div>
          ) : null}
          {state.launched ? null : <RunVerdict run={play.run && play.run.res.ok ? null : play.run} />}
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
          <LaunchButton game={game} ready={summary.go} play={play} />
        </div>
      </div>
    </div>
  )
}

function LaunchButton({ game, ready, play }) {
  const navigate = useNavigate()
  const { state, launch, setNotice } = game
  const { run } = play
  const running = Boolean(run && run.status === 'running')
  // The run passed: the real launch happens once, when the animation ends.
  const done = run && run.status === 'done' && run.res.ok
  useEffect(() => {
    if (!done || state.launched) return
    flushSync(() => {
      launch()
      setNotice('Liftoff!')
    })
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps
  if (state.launched) {
    return <Button variant="outline" onClick={() => navigate('/f5a')}>Fly to the Moon →</Button>
  }
  return (
    <Button
      variant="outline"
      disabled={!ready}
      disabledReason={running ? 'Lifting off…' : (ready ? '' : 'Every item must be GO')}
      onClick={() => play.play()}
    >
      {run && run.status === 'done' ? 'Launch again' : 'Launch'}
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
