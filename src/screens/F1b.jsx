import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { descopeMode, useGame } from '../engine/useGame.jsx'
import { kgText, usdText } from './bits.jsx'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { MissionHud } from './f1Hud.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F1.module.css'
import shell from './shell.module.css'

const SHAPES = {
  small: { w: 22, h: 140, nose: 34, booster: 0 },
  medium: { w: 30, h: 176, nose: 40, booster: 0 },
  heavy: { w: 34, h: 210, nose: 44, booster: 130 },
  sls1: { w: 30, h: 190, nose: 30, booster: 150 },
  sls1b: { w: 30, h: 205, nose: 36, booster: 150 },
  sls2: { w: 30, h: 218, nose: 40, booster: 160 },
}

export function F1b() {
  const ready = usePhaseGuard('/f1b')
  if (!ready) return null
  return (
    <StageScene
      character={<img className={styles.girl} src="/char/nina-overol-llave.png" alt="" />}
      objects={(
        <>
          <div className={styles.moon} />
          <div className={styles.ground} />
        </>
      )}
      title="How far is upy — Phase 1"
    >
      <F1bBody />
    </StageScene>
  )
}

function confirmReason(state, report, data, model) {
  const list = data.ROCKETS[state.missionType] || []
  const fitsAny = list.some((item) => item.capacity >= report.tli)
  if (!state.rocket) return fitsAny ? 'Pick a rocket that can lift your spacecraft' : 'No rocket can lift this — make your spacecraft lighter'
  if (report.totalCost > report.budget) return `Over budget by ${usdText(model, report.totalCost - report.budget)}`
  return ''
}

function F1bBody() {
  const navigate = useNavigate()
  const { state, data, model, pickRocket, applyDescope, lockDesign, setNotice } = useGame()
  const { setModal } = usePlay()
  const report = model.evaluate(state)
  if (!report) return <p className={shell.note}>Pick a mission first.</p>
  const rockets = data.ROCKETS[state.missionType] || []
  const fitsAny = rockets.some((item) => item.capacity >= report.tli)
  const mode = descopeMode(state)
  const needDescope = !fitsAny || (state.rocket && report.totalCost > report.budget)
  const suggestions = needDescope ? model.descopeSuggestions(state, mode) : []
  const reason = confirmReason(state, report, data, model)

  return (
    <div className={`${styles.screen} ${styles.pad}`}>
      <MissionHud />
      <div className={styles.speech}>
        <Bubble tone="speech">Which one can lift us?</Bubble>
      </div>
      <div className={styles.pads} role="group" aria-label="Rockets">
        {rockets.map((rocket) => (
          <RocketStation
            key={rocket.id}
            rocket={rocket}
            report={report}
            selected={state.rocket === rocket.id}
            onPick={() => pickRocket(rocket.id)}
            onLocked={() => setNotice('Too heavy for this rocket. Make your spacecraft lighter or pick a bigger one.')}
          />
        ))}
      </div>
      <div className={styles.panel}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 1 · Launch pad</p>
          <h2 className={styles.question}>Pick your rocket</h2>
          <p className={styles.line}>Hardware + Fuel = Rocket must lift</p>
          <dl className={styles.stats}>
            <div><dt>Spacecraft</dt><dd>{usdText(model, report.cost)}</dd></div>
            <div><dt>Rocket</dt><dd>{report.rocket ? usdText(model, report.rocket.cost) : '—'}</dd></div>
            <div className={styles.total}>
              <dt>Total</dt>
              <dd>{usdText(model, report.totalCost)} / {usdText(model, report.budget)}</dd>
            </div>
          </dl>
          {needDescope ? (
            <div className={styles.trim}>
              <p className={styles.trimTitle}>{mode === 'cost' ? 'Over budget? Trim the design' : 'Too heavy? Trim the design'}</p>
              {suggestions.map((item, index) => (
                <button key={`${item.label}-${index}`} type="button" className={styles.trimRow} onClick={() => applyDescope(index)}>
                  <span>{item.label}</span>
                  <span className={styles.trimNote}>{trimNote(item, mode, report.budget, rockets, model)}</span>
                </button>
              ))}
            </div>
          ) : null}
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f1a')}>← Workshop</Button>
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
        <div className={styles.lock}>
          <Button
            variant="outline"
            disabledReason={reason}
            onClick={() => {
              flushSync(() => {
                lockDesign()
                setNotice('Spacecraft design locked ✓')
              })
              navigate('/f1done')
            }}
          >
            Confirm spacecraft
          </Button>
        </div>
      </div>
    </div>
  )
}

function RocketStation({ rocket, report, selected, onPick, onLocked }) {
  const { model } = useGame()
  const fits = rocket.capacity >= report.tli
  const margin = (rocket.capacity - report.tli) / rocket.capacity
  const over = fits && report.cost + rocket.cost > report.budget
  const tons = (rocket.capacity / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })
  let verdict = `Fits · ${model.fmt(margin * 100)}% margin`
  let tone = styles.good
  if (!fits) {
    verdict = `Too heavy by ${kgText(model, report.tli - rocket.capacity)}`
    tone = styles.bad
  } else if (over) {
    verdict = 'Fits · over budget'
    tone = styles.tight
  } else if (margin < 0.1) {
    verdict = `Fits, only ${model.fmt(margin * 100)}% margin`
    tone = styles.tight
  }
  const cls = [styles.station, tone, selected ? styles.stationOn : ''].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={cls}
      aria-pressed={selected}
      aria-disabled={!fits || undefined}
      onClick={() => (fits ? onPick() : onLocked())}
    >
      <PadRocket id={rocket.id} fill={report.tli / rocket.capacity} fits={fits} />
      <span className={styles.tag}>
        <span>{rocket.title} · {tons} t</span>
        <span>{usdText(model, rocket.cost)} · <b>{verdict}</b></span>
      </span>
    </button>
  )
}

function PadRocket({ id, fill, fits }) {
  const shape = SHAPES[id] || SHAPES.small
  const cx = 50
  const base = 276
  const left = cx - shape.w / 2
  const right = cx + shape.w / 2
  const top = base - shape.h
  const tube = 110
  const tubeBase = 262
  const ratio = Number.isFinite(fill) ? Math.max(0, Math.min(1, fill)) : 0
  const level = ratio * tube
  const sideW = 12
  const sides = shape.booster ? [left - sideW - 1, right + 1] : []

  return (
    <svg className={fits ? styles.rocket : `${styles.rocket} ${styles.rocketOver}`} viewBox="0 0 120 296" aria-hidden="true">
      <path className={styles.padBase} d="M12 294 L22 282 H78 L88 294 Z" />
      <rect className={styles.padLight} x="45" y="286" width="10" height="3" rx="1.5" />
      {sides.map((x) => (
        <g key={x}>
          <rect className={styles.side} x={x} y={base - shape.booster} width={sideW} height={shape.booster} />
          <path className={styles.side} d={`M${x} ${base - shape.booster} Q${x + sideW / 2} ${base - shape.booster - 22} ${x + sideW} ${base - shape.booster} Z`} />
        </g>
      ))}
      {sides.length ? null : (
        <path
          className={styles.fin}
          d={`M${left} ${base} L${left - 10} ${base} L${left} ${base - 32} Z M${right} ${base} L${right + 10} ${base} L${right} ${base - 32} Z`}
        />
      )}
      <rect className={styles.hull} x={left} y={top} width={shape.w} height={shape.h} />
      <path
        className={styles.hull}
        d={`M${left} ${top} Q${left} ${top - shape.nose * 0.7} ${cx} ${top - shape.nose} Q${right} ${top - shape.nose * 0.7} ${right} ${top} Z`}
      />
      <rect className={styles.band} x={left} y={top + 4} width={shape.w} height="5" />
      <rect className={styles.band} x={left} y={base - 46} width={shape.w} height="5" />
      <circle className={styles.patch} cx={cx} cy={top + 34} r={shape.w * 0.28} />
      <path className={styles.fin} d={`M${cx - 6} ${base} L${cx - 9} ${base + 6} H${cx + 9} L${cx + 6} ${base} Z`} />
      <rect className={styles.tube} x="96" y={tubeBase - tube} width="10" height={tube} rx="5" />
      {level > 0 ? <rect className={styles.level} x="96" y={tubeBase - level} width="10" height={level} rx="5" /> : null}
      {fits ? null : <path className={styles.alarm} d={`M101 ${tubeBase - tube - 6} v-7 M94 ${tubeBase - tube - 4} l-5 -5 M108 ${tubeBase - tube - 4} l5 -5`} />}
    </svg>
  )
}

function trimNote(item, mode, budget, rockets, model) {
  const parts = []
  if (item.saves > 0.5) parts.push(`−${kgText(model, item.saves)}`)
  if (item.costSaves > 0) parts.push(`−${usdText(model, item.costSaves)}`)
  if (item.costSaves < 0) parts.push(`+${usdText(model, -item.costSaves)}`)
  if (mode === 'cost') {
    const left = item.after.totalCost - budget
    parts.push(left <= 0 ? 'fixes the budget' : `still ${usdText(model, left)} over`)
  } else {
    const maxCap = Math.max(...rockets.map((rocket) => rocket.capacity))
    parts.push(item.after.tli <= maxCap ? 'fits a rocket' : `still ${kgText(model, item.after.tli - maxCap)} too heavy`)
  }
  return parts.join(' · ')
}
