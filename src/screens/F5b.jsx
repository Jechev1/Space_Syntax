import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Dialog } from '../components/ui/Dialog.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import pp from '../components/ui/PlayPanel.module.css'
import { HELP_F5B } from '../data/help.mjs'
import { usePlayRun } from '../engine/usePlayRun.jsx'
import { useGame } from '../engine/useGame.jsx'
import { f5bSpeech } from './f5Speech.mjs'
import { StageScene } from './frame.jsx'
import { fixPhase, useGoBack } from './goBack.jsx'
import { F5Hud, HelpWindow, NeedsEarlier, earlierGaps } from './F5a.jsx'
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
      title="How far is up? · Phase 5: Powered Descent"
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

/* Words for f5bSpeech: where the run is, and the paid choice when the computer asks. */
function speechView(run, landed, model) {
  const status = !run ? '' : run.status === 'running' ? 'running' : run.status === 'decision' ? 'decision' : run.status === 'done' ? (landed ? 'landed' : 'failed') : ''
  if (status !== 'decision') return { status }
  const margin = run.res.decision.marginLeft
  const paid = run.res.decision.options.find((option) => option.dvCost)
  return {
    status,
    choice: paid ? { label: paid.label, cost: model.fmt(paid.dvCost), margin: model.fmt(margin), fits: paid.dvCost <= margin } : null,
  }
}

/* The scene already shows altitude and vertical speed (gauge), throttle (flame) and the sideways drift (the lander moves), so the panel skips them. */
const SCENE_FIELDS = ['alt', 'vz', 'throttle', 'x']
const VERDICT = { success: 'Landed', partial: 'Landed, barely', fail: 'Failed' }
const fmtN = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const digits = (v) => (Math.abs(v) < 10 && v !== 0 ? 1 : 0)

/*
 * The descent run in the right panel: start button, live bars, the last events, the computer's question,
 * and the verdict. It reads the same SimResult as the shared PlayPanel, but keeps to what fits the panel
 * and opens the math in a popup like Phase 1.
 */
function DescentPanel({ title, intro, play }) {
  const [math, setMath] = useState(false)
  const { run, frame, events, choose } = play
  const res = run && run.res
  const running = run && run.status === 'running'
  const done = run && run.status === 'done'
  const deciding = run && run.status === 'decision'
  useEffect(() => { setMath(false) }, [res])
  const fields = res && res.ready ? res.fields.filter((field) => !SCENE_FIELDS.includes(field.key)) : []
  return (
    <GlassPanel eyebrow="Phase 5: Powered Descent · NASA Phase E" title={title}>
      {run ? null : <p className={pp.note}>{intro}</p>}
      <Button variant="outline" disabledReason={running ? 'Running…' : ''} onClick={() => play.play()}>
        {run && run.status !== 'blocked' ? 'Start descent again' : 'Start descent'}
      </Button>
      {run && run.status === 'blocked' ? (
        <ul className={pp.blockers}>{res.blockers.map((b) => <li key={b.code}>{b.message}</li>)}</ul>
      ) : null}
      {/* While the computer asks, the panel shows only the question; once the run ends, the verdict replaces the log. */}
      {res && res.ready ? <p className={pp.clock}>t = {fmtN(run.t, run.t < 10 ? 1 : 0)} s</p> : null}
      {res && res.ready && !deciding ? (
        <>
          <div className={pp.bars}>
            {fields.map((f) => {
              const v = frame ? frame[f.key] : 0
              const w = f.max ? Math.max(0, Math.min(1, v / f.max)) : 0
              return (
                <div className={pp.bar} key={f.key}>
                  <span className={pp.barLabel}>{f.label}</span>
                  <span className={pp.barValue}>{fmtN(v, digits(v))} {f.unit}</span>
                  <span className={pp.track} aria-hidden="true"><span className={pp.fill} style={{ width: `${w * 100}%` }} /></span>
                </div>
              )
            })}
          </div>
          {done ? null : (
            <ol className={pp.log} aria-live="polite">
              {events.slice(-2).map((e, i) => <li key={`${e.t}-${i}`} className={pp[e.kind]}>{e.text}</li>)}
            </ol>
          )}
        </>
      ) : null}
      {deciding ? (
        <div className={pp.decision} role="group" aria-label="Your call">
          <p className={pp.prompt}>{res.decision.prompt}</p>
          <div className={pp.actions}>
            {res.decision.options.map((o) => (
              <Button key={o.id} variant="secondary" onClick={() => choose(o.id)}>
                {o.label}{o.dvCost ? ` (${fmtN(o.dvCost)} m/s)` : ''}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {done ? (
        <div className={`${pp.verdict} ${res.ok ? pp.okBox : pp.failBox}`}>
          <p className={pp.verdictLine}>
            <b>{VERDICT[res.outcome] || res.outcome}</b>
            {res.ok ? (
              <span className={pp.stars} aria-label={`${res.stars} of 3 stars`}>
                {[0, 1, 2].map((i) => <span key={i} className={i < res.stars ? pp.starOn : pp.starOff} aria-hidden="true">★</span>)}
              </span>
            ) : null}
          </p>
          {res.ok && res.score ? <p className={pp.note}>{res.score.label}: {fmtN(res.score.value, 1)}{res.score.unit === '%' ? '%' : ` ${res.score.unit}`}</p> : null}
          {res.failure ? (
            <>
              <p className={pp.cause}>{res.failure.cause}</p>
              <p className={pp.fix}>Try this: {res.failure.fix}</p>
            </>
          ) : null}
          {res.math ? <Button variant="outline" onClick={() => setMath(true)}>Show the math</Button> : null}
        </div>
      ) : null}
      {math && res && res.math ? (
        <Dialog title={res.math.title || 'The math'} onClose={() => setMath(false)}>
          <MathBlock math={{ ...res.math, title: null }} />
        </Dialog>
      ) : null}
    </GlassPanel>
  )
}

function F5bBody() {
  const navigate = useNavigate()
  const { state, data, model, update } = useGame()
  const [help, setHelp] = useState(false)
  const goBack = useGoBack()
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
  const deciding = Boolean(run && run.status === 'decision')
  const view = speechView(run, landed, model)
  const speech = f5bSpeech(state.difficulty, { ...view, safeMax: data.LANDING.contact.safeMax })

  return (
    <div className={styles.screen}>
      <F5Hud where="Lander" />
      <AltGauge frame={frame} />
      <Lander frame={frame} />
      {/* During the computer's question the bubble moves into the banner, where the player is looking. */}
      {speech && !deciding ? (
        <div className={styles.speech}>
          <Bubble tone="speech">{speech}</Bubble>
        </div>
      ) : null}
      {deciding ? (
        <div className={styles.banner} role="alert">
          <GlassPanel tone="warn" title={res.decision.prompt}>
            <p className={styles.line}>Margin left: {model.fmt(res.decision.marginLeft)} m/s. Choose in the panel.</p>
            {speech ? <p className={styles.line}>{speech}</p> : null}
          </GlassPanel>
        </div>
      ) : null}
      <div className={`${styles.panel} ${styles.panelTall}`}>
        {gaps.length ? <NeedsEarlier stage="f5b" gaps={gaps} /> : (
          <DescentPanel
            title={site ? site.title.split(' (')[0] : 'Powered descent'}
            intro={`The descent burn is ${model.fmt(data.DV.descent.value)} m/s. Gravity on the Moon is ${data.MOON.gravity} m/s². Hover to find safe ground, then touch down below ${data.LANDING.contact.safeMax} m/s.`}
            play={play}
          />
        )}
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f5a')}>← Landing site</Button>
          <Button variant="secondary" onClick={() => setHelp(true)}>? Help</Button>
          {done && !landed && fixPhase(res.failure) != null ? (
            <Button variant="secondary" onClick={() => goBack(fixPhase(res.failure))}>Go back to Phase {fixPhase(res.failure)}</Button>
          ) : null}
        </div>
        <div className={styles.lock}>
          <Button variant="outline" disabledReason={landed ? '' : stepReason} onClick={() => navigate('/f6')}>
            Step outside →
          </Button>
        </div>
      </div>
      <HelpWindow help={HELP_F5B} open={help} onClose={() => setHelp(false)} />
    </div>
  )
}
