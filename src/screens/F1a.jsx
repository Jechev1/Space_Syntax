import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Chip } from '../components/ui/Chip.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import { sourceOrg, useGame } from '../engine/useGame.jsx'
import { EquipmentList, FactLine, kgText, SourceButton, SpacecraftSummary, usdText } from './bits.jsx'
import { HelpFooter, MissionBubble, MissionFrame, usePhaseGuard } from './frame.jsx'
import { usePlay } from './playContext.jsx'
import shell from './shell.module.css'

const WHERE = {
  all: 'the whole spacecraft (average)',
  orbiter: 'the orbiter',
  descent: 'the lander base',
  split: 'orbiter + lander',
  ascent: 'the lander cabin',
  lander: 'your lander',
}

export function F1a() {
  const ready = usePhaseGuard('/f1a')
  if (!ready) return null
  return (
    <MissionFrame phase={1} title="Space Syntax — Phase 1: Build" footer={<F1aFooter />}>
      <F1aBody />
    </MissionFrame>
  )
}

function F1aFooter() {
  const navigate = useNavigate()
  const { state, model } = useGame()
  const reason = workshopReason(state, model)
  return (
    <HelpFooter
      backLabel="← Phase 0"
      onBack={() => navigate('/f0')}
      ctaLabel="Choose rocket →"
      reason={reason}
      onCta={() => navigate('/f1b')}
    />
  )
}

function workshopReason(state, model) {
  const missing = model.missingSubsystems(state)
  if (missing.length) return `Still to choose: ${missing.map((id) => model.findSub(id).title).join(', ')}`
  if (!model.payloadAnswers(state)) return 'Add an instrument that answers your Phase 0 question'
  return ''
}

function F1aBody() {
  const { state, data, model, setSubsystem, pickPart, toggleMath, setNotice } = useGame()
  const { setPreview } = usePlay()
  const report = model.evaluate(state)
  const type = state.missionType
  const sub = model.findSub(state.activeSub) || data.SUBSYSTEMS[0]
  const missing = model.missingSubsystems(state)

  useEffect(() => { setPreview(null) }, [state.activeSub, setPreview])

  if (!report || !type) return <p className={shell.note}>Pick a mission first.</p>

  const selectedId = sub.multi ? null : state.design[sub.id]
  const where = type === 'crewed' ? WHERE[model.whereOf(type, sub.id, selectedId)] : 'your lander'
  const ratio = model.gearForSub(type, sub.id, selectedId).toFixed(1)

  return (
    <>
      <p className={shell.kicker}>Phase 1 · Assembly building, Earth</p>
      <h1 className={shell.h1}>Build your spacecraft</h1>
      <MissionBubble id="f1a">
        Heavier spacecraft need bigger rockets, and bigger rockets cost more. Watch the <b>Launch mass</b> meter!
      </MissionBubble>
      <div className={shell.split}>
        <div className={shell.stack}>
          <div className={shell.actions} role="group" aria-label="Spacecraft parts">
            {data.SUBSYSTEMS.map((item) => {
              const done = !missing.includes(item.id)
              const selected = item.id === sub.id
              const mark = selected ? 'Selected' : done ? 'Done' : 'To do'
              return (
                <Button
                  key={item.id}
                  variant={selected ? 'primary' : 'secondary'}
                  aria-pressed={selected}
                  onClick={() => setSubsystem(item.id)}
                >
                  {item.icon} {item.title} {mark}
                </Button>
              )
            })}
          </div>
          <GlassPanel eyebrow={sub.multi ? 'Pick one or more' : 'Pick one'} title={`${sub.icon} ${sub.title}`}>
            <p className={shell.lead}>{sub.why}</p>
            <p className={shell.note}>Every 1 kg added to {where} costs about <b>{ratio} kg</b> at launch (fuel to push it, plus fuel to push that fuel).</p>
            {model.optionsFor(sub.id, type).map((option, index) => (
              <PartChoice
                key={option.id}
                index={index}
                sub={sub}
                option={option}
                report={report}
                onPick={() => pickPart(sub.id, option.id)}
                onLocked={() => setNotice('Locked: your Phase 0 measurement doesn\'t need this instrument.')}
              />
            ))}
            <FactLine factKey={sub.fact} />
            {sub.id === 'power' && type === 'robotic' ? <BatteryMath /> : null}
            {sub.id === 'science' && type === 'crewed' ? (
              <p className={shell.note}>
                Samples ride in the lander cabin: every kg you bring back costs about <b>{model.gearRatio('crewed', 'ascent').toFixed(1)} kg</b> at launch, because it must land AND lift off again.
              </p>
            ) : null}
          </GlassPanel>
        </div>
        <div className={shell.stack}>
          <SpacecraftSummary report={report} />
          <EquipmentPanel report={report} />
        </div>
      </div>
    </>
  )
}

function PartChoice({ index, sub, option, report, onPick, onLocked }) {
  const { state, data, model } = useGame()
  const { setPreview } = usePlay()
  const type = state.missionType
  const values = option[type] || {}
  const selected = sub.multi ? (state.design.science || []).includes(option.id) : state.design[sub.id] === option.id
  const unlocked = sub.id !== 'science' || model.unlockedInstruments(state).includes(option.id)
  const answers = sub.id === 'science' && model.requiredInstruments(state).includes(option.id)
  const preview = model.previewWith(state, sub.id, option.id)
  const deltaMass = selected || !preview ? 0 : preview.tli - report.tli
  const mass = values.frac != null
    ? `${Math.round(values.frac * 100)}% of hull`
    : kgText(model, sub.id === 'power' && type === 'robotic' ? model.powerMass(values) : values.mass)
  const watch = unlocked ? {
    onMouseEnter: () => setPreview({ sub: sub.id, id: option.id }),
    onMouseLeave: () => setPreview(null),
    onFocusCapture: () => setPreview({ sub: sub.id, id: option.id }),
    onBlurCapture: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setPreview(null)
    },
  } : {}

  return (
    <div className={shell.choice} {...watch}>
      <OptionRow
        number={index + 1}
        text={option.title}
        detail={option.blurb}
        selected={selected}
        locked={!unlocked}
        lockedReason="Your Phase 0 measurement doesn't need this"
        onSelect={onPick}
        onLocked={onLocked}
        chips={(
          <>
            <Chip type="game" label="Mass">⚖️ {mass}</Chip>
            {values.power ? <Chip type="game" label="Power">⚡ uses {model.fmt(values.power)} W</Chip> : null}
            {values.gen ? <Chip type="evidence" label="Power">⚡ makes {model.fmt(values.gen)} W</Chip> : null}
            <Chip type="cost" label="Cost">💰 {usdText(model, values.cost || 0)}</Chip>
            {option.protection ? <Chip type="game" label="Shield">🛡️ protection {option.protection} of 4</Chip> : null}
            <NightChip hours={values.nightHours} />
            {answers ? <Chip type="evidence" label="Science">✓ answers your question</Chip> : null}
            {!selected && Math.abs(deltaMass) > 0.5 ? (
              <Chip type={deltaMass > 0 ? 'cost' : 'evidence'} tone={deltaMass > 0 ? 'warn' : ''} label="Launch">
                🚀 {deltaMass > 0 ? '+' : '−'}{kgText(model, Math.abs(deltaMass))} at launch
              </Chip>
            ) : null}
            <Chip type={option.src && option.src !== 'game' ? 'nasa' : 'game'} label={option.src && option.src !== 'game' ? 'Source' : 'Game'}>
              {option.src && option.src !== 'game' ? `Based on ${sourceOrg(data, option.src)}` : 'Tuned for gameplay'}
            </Chip>
          </>
        )}
      />
      <SourceButton sourceKey={option.src} label={option.src && option.src !== 'game' ? `Based on ${sourceOrg(data, option.src)}` : ''} />
    </div>
  )
}

function NightChip({ hours }) {
  if (hours == null) return null
  if (hours > 300) return <Chip type="evidence" label="Night">🌙 survives any night</Chip>
  if (hours > 0) return <Chip type="cost" tone="warn" label="Night">🌙 survives {hours} h dark</Chip>
  return <Chip type="cost" tone="danger" label="Night">🌙 no night survival</Chip>
}

function BatteryMath() {
  const { state, data, model, toggleMath } = useGame()
  const open = Boolean(state.showMath.battery)
  return (
    <GlassPanel eyebrow="Batteries" title="Batteries: real math">
      <p className={shell.lead}>
        To survive darkness your lander needs about {data.BATTERY.survivalPower} W. NASA's best cells reach about 245 Wh per kg; full packs are heavier, so we use {data.BATTERY.specificEnergy} Wh/kg.
      </p>
      <div className={shell.actions}>
        <SourceButton sourceKey="nightPower" />
        <SourceButton sourceKey="techport" />
        <SourceButton sourceKey="game" />
      </div>
      <Button variant="ghost" aria-expanded={open} onClick={() => toggleMath('battery')}>
        {open ? '▾ Hide the math' : '▸ Show the math: how big a battery?'}
      </Button>
      {open ? (
        <>
          <MathBlock math={model.batteryMath(100)} />
          <MathBlock math={model.batteryMath(354)} />
          <p className={shell.note}>354 h is one night at the equator. Real batteries can't be drained to 0% and need margins, so NASA studies suggest a lot more mass than this ideal number.</p>
          <SourceButton sourceKey="rps" />
        </>
      ) : null}
    </GlassPanel>
  )
}

function EquipmentPanel({ report }) {
  const { state, toggleMel } = useGame()
  return (
    <GlassPanel eyebrow="Equipment list" title="Parts">
      <Button variant="ghost" onClick={() => toggleMel()}>{state.showMel ? 'Hide' : 'Show'} parts list (MEL)</Button>
      {state.showMel ? <EquipmentList report={report} /> : null}
    </GlassPanel>
  )
}
