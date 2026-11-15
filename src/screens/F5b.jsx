import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { PlayPanel } from '../components/ui/PlayPanel.jsx'
import { usePlayRun } from '../engine/usePlayRun.jsx'
import { useGame } from '../engine/useGame.jsx'
import { StageScene } from './frame.jsx'
import { F5Hud, NeedsEarlier, earlierGaps } from './F5a.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F5.module.css'

const START_ALT = 300
const GROUND = 24 // percent of the stage height where the feet touch
const SPAN = 33 // percent of the stage height between 300 m and the ground
const DRIFT = 0.25 // percent of the flight width per metre of sideways offset

export function F5b() {
  return (
    <StageScene
      background="/bg/bg-superficie.png"
      character={<img className={styles.girl} src="/char/nina-traje-sentada.png" alt="" />}
      title="How far is up? — Phase 5"
    >
      <F5bBody />
    </StageScene>
  )
}

function Lander({ frame }) {
  const alt = frame ? Math.max(0, Math.min(START_ALT, frame.alt)) : START_ALT
  const x = frame ? Math.max(-100, Math.min(100, frame.x)) : 0
  const throttle = frame ? Math.max(0, Math.min(1, frame.throttle)) : 0
  const bottom = GROUND + (alt / START_ALT) * SPAN
  const left = 50 + x * DRIFT
  const flame = throttle * 13
  const dust = alt < 70 ? Math.min(1, throttle * 1.4) * (1 - alt / 70) : 0
  return (
    <div className={styles.flight} aria-hidden="true">
      {dust > 0.02 ? <span className={styles.dust} style={{ left: `${left}%`, bottom: `${GROUND - 3}%`, opacity: dust }} /> : null}
      {flame > 0.3 ? <span className={styles.flame} style={{ left: `${left}%`, bottom: `${bottom - flame + 4}%`, height: `${flame}%` }} /> : null}
      <img className={styles.lander} style={{ left: `${left}%`, bottom: `${bottom}%` }} src="/obj/lander.png" alt="" />
    </div>
  )
}

function AltGauge({ frame }) {
  const alt = frame ? Math.max(0, Math.min(START_ALT, frame.alt)) : START_ALT
  const speed = frame ? Math.abs(frame.vz) : 0
  return (
    <div className={styles.gauge} role="img" aria-label={`Altitude ${Math.round(alt)} metres, speed ${speed.toFixed(1)} metres per second`}>
      <span>Altitude</span>
      <span className={styles.gaugeTrack}>
        <span className={styles.gaugeFill} style={{ height: `${(alt / START_ALT) * 100}%` }} />
      </span>
      <span>{Math.round(alt)} m</span>
      <span>{speed.toFixed(1)} m/s</span>
    </div>
  )
}

function F5bBody() {
  const navigate = useNavigate()
  const { state, data, model, update } = useGame()
  const { setModal } = usePlay()
  const gaps = earlierGaps(state, model)
  const play = usePlayRun(5, state, { interactive: true, ignore: ['landing'] })
  const { run, frame } = play
  const res = run && run.res
  const done = run && run.status === 'done'

  // No site yet: the player belongs on the previous screen.
  useEffect(() => {
    if (!state.site) navigate('/f5a', { replace: true })
  }, [state.site, navigate])

  // Record the finished run like the classic game does.
  useEffect(() => {
    if (!done) return
    const outcome = res.landing ? res.landing.outcome : 'abort'
    update((next) => { next.landing = { seed: res.seed, outcome } })
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  const site = data.SITES.find((item) => item.id === state.site)
  const landed = done
    ? Boolean(res.ok && res.landing && res.landing.outcome !== 'abort')
    : !run && Boolean(state.landing && state.landing.outcome !== 'abort')
  let stepReason = 'Land the lander first'
  if (done && !landed) stepReason = 'The landing failed. Fly it again or pick another site.'

  return (
    <div className={styles.screen}>
      <F5Hud where="Lander" />
      <AltGauge frame={frame} />
      <Lander frame={frame} />
      <div className={styles.speech}>
        <Bubble tone="speech">Watch the fuel margin!</Bubble>
      </div>
      {run && run.status === 'decision' ? (
        <div className={styles.banner} role="alert">
          <GlassPanel tone="warn" title={res.decision.prompt}>
            <p className={styles.line}>Margin left: {model.fmt(res.decision.marginLeft)} m/s. Choose in the panel.</p>
          </GlassPanel>
        </div>
      ) : null}
      <div className={`${styles.panel} ${styles.panelTall}`}>
        {gaps.length ? <NeedsEarlier stage="f5b" gaps={gaps} /> : (
          <PlayPanel
            eyebrow="Phase 5 · Powered descent"
            title={site ? site.title.split(' (')[0] : 'Powered descent'}
            intro={`The descent burn is ${model.fmt(data.DV.descent.value)} m/s. Gravity on the Moon is ${data.MOON.gravity} m/s². Hover to find safe ground, then touch down below ${data.LANDING.contact.safeMax} m/s.`}
            label="Start descent"
            play={play}
          />
        )}
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f5a')}>← Landing site</Button>
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
        <Button variant="outline" disabledReason={landed ? '' : stepReason} onClick={() => navigate('/f6')}>
          Step outside →
        </Button>
      </div>
    </div>
  )
}
