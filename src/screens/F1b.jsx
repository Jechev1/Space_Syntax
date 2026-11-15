import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Chip } from '../components/ui/Chip.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import { RocketGauge } from '../components/ui/RocketGauge.jsx'
import { StatLine } from '../components/ui/StatLine.jsx'
import { descopeMode, useGame } from '../engine/useGame.jsx'
import { FactLine, kgText, SourceButton, SpacecraftSummary, usdText } from './bits.jsx'
import { HelpFooter, MissionBubble, MissionFrame, usePhaseGuard } from './frame.jsx'
import { usePlay } from './playContext.jsx'
import shell from './shell.module.css'

export function F1b() {
  const ready = usePhaseGuard('/f1b')
  if (!ready) return null
  return (
    <MissionFrame phase={1} title="Space Syntax — Phase 1: Rocket" footer={<F1bFooter />}>
      <F1bBody />
    </MissionFrame>
  )
}

function F1bFooter() {
  const navigate = useNavigate()
  const { state, data, model, lockDesign, setNotice } = useGame()
  const report = model.evaluate(state)
  const reason = report ? confirmReason(state, report, data, model) : 'Pick a mission first'
  return (
    <HelpFooter
      backLabel="← Workshop"
      onBack={() => navigate('/f1a')}
      ctaLabel="Confirm spacecraft →"
      reason={reason}
      onCta={() => {
        flushSync(() => {
          lockDesign()
          setNotice('Spacecraft design locked ✓')
        })
        navigate('/f1done')
      }}
    />
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
  const { state, data, model, pickRocket, applyDescope, setNotice } = useGame()
  const report = model.evaluate(state)
  if (!report) return <p className={shell.note}>Pick a mission first.</p>
  const rockets = data.ROCKETS[state.missionType] || []
  const fitsAny = rockets.some((item) => item.capacity >= report.tli)
  const mode = descopeMode(state)
  const needDescope = !fitsAny || (state.rocket && report.totalCost > report.budget)
  const suggestions = needDescope ? model.descopeSuggestions(state, mode) : []

  return (
    <>
      <p className={shell.kicker}>Phase 1 · Launch pad, Earth</p>
      <h1 className={shell.h1}>Pick your rocket</h1>
      <MissionBubble id="f1b">
        The rocket's job: throw our spacecraft toward the Moon. The green gauge shows how full each rocket would be.
      </MissionBubble>
      <div className={shell.split}>
        <div className={shell.stack}>
          <GlassPanel eyebrow="Launch mass" title="What the rocket must lift">
            <StatLine items={[
              { label: 'Hardware', value: kgText(model, report.dry) },
              { label: 'Fuel for the Moon trip', value: `+ ${kgText(model, report.propellant)}` },
              { label: 'Rocket must lift', value: `= ${kgText(model, report.tli)}`, tone: 'accent' },
            ]} />
          </GlassPanel>
          <div className={shell.rockets}>
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
          </div>
          {needDescope ? (
            <GlassPanel tone="warn" eyebrow={mode === 'cost' ? 'Over budget?' : 'Too heavy?'} title="Trim the design">
              <p className={shell.lead}>
                Real NASA teams "descope" (cut back) when a design doesn't fit. Biggest {mode === 'cost' ? 'money' : 'launch-mass'} savings first:
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
            </GlassPanel>
          ) : null}
        </div>
        <div className={shell.stack}>
          <BudgetCard report={report} />
          <GlassPanel eyebrow="NASA" title="Launchers">
            <FactLine factKey={state.missionType === 'crewed' ? 'apolloStack' : 'lro'} />
            <FactLine factKey="slsCap" />
          </GlassPanel>
          <SpacecraftSummary report={report} />
        </div>
      </div>
    </>
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

function BudgetCard({ report }) {
  const { model } = useGame()
  const over = report.totalCost > report.budget
  return (
    <GlassPanel eyebrow="Budget" title={over ? 'Over budget' : 'Within budget'}>
      <p className={shell.note}>Spacecraft: {usdText(model, report.cost)}</p>
      <p className={shell.note}>Rocket: {report.rocket ? usdText(model, report.rocket.cost) : '—'}</p>
      <p className={over ? shell.bad : shell.good}>
        {usdText(model, report.totalCost)} / {usdText(model, report.budget)} {over ? 'Over budget' : 'Within budget'}
      </p>
      <p className={shell.note}>The SLS rocket alone costs about $2.2 billion per launch, according to NASA's Inspector General.</p>
      <SourceButton sourceKey="oig" />
    </GlassPanel>
  )
}
