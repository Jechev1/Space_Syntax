import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Chip } from '../components/ui/Chip.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import { RocketGauge } from '../components/ui/RocketGauge.jsx'
import { descopeMode, useGame } from '../engine/useGame.jsx'
import { FactLine, kgText, SourceButton, usdText } from './bits.jsx'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { MissionHud } from './f1Hud.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F1.module.css'
import shell from './shell.module.css'

export function F1b() {
  const ready = usePhaseGuard('/f1b')
  if (!ready) return null
  return (
    <StageScene
      background="/bg/bg-preparacion.png"
      character="/char/nina-chaqueta-portapapeles.png"
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
    <div className={styles.screen}>
      <MissionHud />
      <div className={styles.speech}>
        <Bubble tone="speech">Which one can lift us?</Bubble>
      </div>
      <div className={styles.panel}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 1 · Launch pad</p>
          <h2 className={styles.question}>Pick your rocket</h2>
          <p className={styles.line}>Hardware <b>{kgText(model, report.dry)}</b></p>
          <p className={styles.line}>Fuel <b>+ {kgText(model, report.propellant)}</b></p>
          <p className={styles.line}>Rocket must lift <b>{kgText(model, report.tli)}</b></p>
          {rockets.map((rocket, index) => (
            <RocketChoice
              key={rocket.id}
              index={index}
              rocket={rocket}
              report={report}
              selected={state.rocket === rocket.id}
              onPick={() => pickRocket(rocket.id)}
              onLocked={() => setNotice('Too heavy for this rocket. Make your spacecraft lighter or pick a bigger one.')}
            />
          ))}
          <p className={styles.line}>Spacecraft <b>{usdText(model, report.cost)}</b></p>
          <p className={styles.line}>Rocket <b>{report.rocket ? usdText(model, report.rocket.cost) : '—'}</b></p>
          <p className={styles.line}>
            Total budget <b>{usdText(model, report.totalCost)} / {usdText(model, report.budget)}</b>
          </p>
          <FactLine factKey={state.missionType === 'crewed' ? 'apolloStack' : 'lro'} />
          <FactLine factKey="slsCap" />
          {needDescope ? (
            <>
              <p className={styles.line}>
                Trim the design. Biggest {mode === 'cost' ? 'money' : 'launch-mass'} savings first.
              </p>
              <SourceButton sourceKey="seHandbook" />
              <ul className={shell.list}>
                {suggestions.map((item, index) => (
                  <li key={`${item.label}-${index}`}>
                    <span>{item.label} </span>
                    {item.saves > 0.5 ? <Chip type="evidence" label="Mass">−{kgText(model, item.saves)}</Chip> : null}
                    {item.costSaves > 0 ? <Chip type="evidence" label="Cost">−{usdText(model, item.costSaves)}</Chip> : null}
                    {item.costSaves < 0 ? <Chip type="cost" tone="warn" label="Cost">+{usdText(model, -item.costSaves)}</Chip> : null}
                    <DescopeVerdict suggestion={item} mode={mode} budget={report.budget} rockets={rockets} />
                    <Button variant="secondary" onClick={() => applyDescope(index)}>Apply</Button>
                  </li>
                ))}
              </ul>
            </>
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

function RocketChoice({ index, rocket, report, selected, onPick, onLocked }) {
  const { data, model } = useGame()
  const fits = rocket.capacity >= report.tli
  const margin = (rocket.capacity - report.tli) / rocket.capacity
  const over = report.cost + rocket.cost > report.budget
  const verdict = !fits
    ? `Too heavy by ${kgText(model, report.tli - rocket.capacity)}`
    : margin < 0.1
      ? `Fits, only ${model.fmt(margin * 100)}% margin`
      : `Fits with ${model.fmt(margin * 100)}% margin`
  return (
    <div className={shell.choice}>
      <RocketGauge fill={report.tli / rocket.capacity} fits={fits} />
      <OptionRow
        number={index + 1}
        text={`${rocket.title} · ${model.fmt(rocket.capacity / 1000)} t`}
        detail={`${rocket.blurb} ${verdict}`}
        selected={selected}
        locked={!fits}
        lockedReason={fits ? '' : verdict}
        onSelect={onPick}
        onLocked={onLocked}
        chips={(
          <>
            <Chip type="cost" tone={over ? 'danger' : ''} label="Cost">
              💰 {usdText(model, rocket.cost)}{over ? ' over budget' : ''}
            </Chip>
            <Chip type={rocket.capSrc === 'game' ? 'game' : 'nasa'} label={rocket.capSrc === 'game' ? 'Game' : 'Capacity'}>
              {rocket.capSrc === 'game' ? 'Tuned for gameplay' : 'NASA'}
            </Chip>
          </>
        )}
      />
      <SourceButton sourceKey={rocket.capSrc} label={rocket.capSrc === 'game' ? '' : 'Capacity: NASA'} />
      {rocket.costSrc !== rocket.capSrc ? (
        <SourceButton sourceKey={rocket.costSrc} label={rocket.costSrc === 'game' ? '' : 'Cost: NASA OIG'} />
      ) : null}
    </div>
  )
}

function DescopeVerdict({ suggestion, mode, budget, rockets }) {
  const { model } = useGame()
  if (mode === 'cost') {
    const left = suggestion.after.totalCost - budget
    if (left <= 0) return <Chip type="evidence" label="Budget">fixes the budget</Chip>
    return <Chip type="cost" tone="warn" label="Budget">still {usdText(model, left)} over</Chip>
  }
  const maxCap = Math.max(...rockets.map((item) => item.capacity))
  if (suggestion.after.tli <= maxCap) return <Chip type="evidence" label="Mass">fits a rocket</Chip>
  return <Chip type="cost" tone="warn" label="Mass">still {kgText(model, suggestion.after.tli - maxCap)} too heavy</Chip>
}

