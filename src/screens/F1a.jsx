import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Chip } from '../components/ui/Chip.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import { sourceOrg, useGame } from '../engine/useGame.jsx'
import { EquipmentList, FactLine, kgText, SourceButton, usdText } from './bits.jsx'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { MissionHud } from './f1Hud.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F1.module.css'
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
    <StageScene
      background="/bg/bg-preparacion.png"
      character="/char/nina-chaqueta-portapapeles.png"
      title="How far is upy — Phase 1"
    >
      <F1aBody />
    </StageScene>
  )
}

function workshopReason(state, model) {
  const missing = model.missingSubsystems(state)
  if (missing.length) return `Still to choose: ${missing.map((id) => model.findSub(id).title).join(', ')}`
  if (!model.payloadAnswers(state)) return 'Add an instrument that answers your Phase 0 question'
  return ''
}

function F1aBody() {
  const navigate = useNavigate()
  const { state, data, model, setSubsystem, pickPart, setNotice } = useGame()
  const { setPreview, setModal } = usePlay()
  const report = model.evaluate(state)
  const type = state.missionType
  const sub = model.findSub(state.activeSub) || data.SUBSYSTEMS[0]
  const missing = model.missingSubsystems(state)
  const reason = workshopReason(state, model)

  useEffect(() => { setPreview(null) }, [state.activeSub, setPreview])

  if (!report || !type) return <p className={shell.note}>Pick a mission first.</p>

  const selectedId = sub.multi ? null : state.design[sub.id]
  const where = type === 'crewed' ? WHERE[model.whereOf(type, sub.id, selectedId)] : 'your lander'
  const ratio = model.gearForSub(type, sub.id, selectedId).toFixed(1)
  const tabName = {
    structure: 'Structure',
    shield: 'Shield',
    thermal: 'Thermal',
    power: 'Power',
    science: 'Science payload',
  }

  return (
    <div className={styles.screen}>
      <MissionHud />
      <div className={styles.tabs} role="group" aria-label="Spacecraft parts">
        {data.SUBSYSTEMS.map((item) => {
          const done = !missing.includes(item.id)
          const selected = item.id === sub.id
          return (
            <button
              key={item.id}
              type="button"
              className={selected ? `${styles.tab} ${styles.tabOn}` : styles.tab}
              aria-pressed={selected}
              onClick={() => setSubsystem(item.id)}
            >
              {tabName[item.id] || item.title}{done ? ' ✓' : ''}
            </button>
          )
        })}
      </div>
      <div className={styles.speech}>
        <Bubble tone="speech">Watch the launch mass!</Bubble>
      </div>
      <div className={styles.panel}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 1 · Assembly building</p>
          <h2 className={styles.question}>{sub.title}</h2>
          <p className={styles.line}>{sub.why}</p>
          <p className={styles.line}>Every 1 kg added to {where} costs about <b>{ratio} kg</b> at launch.</p>
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
            <p className={styles.line}>
              Samples ride in the lander cabin: every kg you bring back costs about <b>{model.gearRatio('crewed', 'ascent').toFixed(1)} kg</b> at launch.
            </p>
          ) : null}
          <p className={styles.line}>Hardware <b>{kgText(model, report.dry)}</b></p>
          <p className={styles.line}>Fuel <b>{kgText(model, report.propellant)}</b></p>
          <p className={styles.line}>Launch mass <b>{kgText(model, report.tli)}</b></p>
          <EquipmentPanel report={report} />
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f0')}>← Phase 0</Button>
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
        <div className={styles.lock}>
          <Button variant="outline" disabledReason={reason} onClick={() => navigate('/f1b')}>Choose rocket</Button>
        </div>
      </div>
    </div>
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
