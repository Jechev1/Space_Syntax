import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import { useGame } from '../engine/useGame.jsx'
import { kgText } from './bits.jsx'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { MissionHud } from './f1Hud.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F1.module.css'
import shell from './shell.module.css'

export function F1a() {
  const ready = usePhaseGuard('/f1a')
  if (!ready) return null
  return (
    <StageScene
      background="/bg/bg-hangar.png"
      character={<img className={styles.girl} src="/char/nina-overol-llave.png" alt="" />}
      objects={<img className={styles.lander} src="/obj/lander.png" alt="" />}
      title="How far is up? — Phase 1"
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
  const { setModal } = usePlay()
  const report = model.evaluate(state)
  const type = state.missionType
  const sub = model.findSub(state.activeSub) || data.SUBSYSTEMS[0]
  const missing = model.missingSubsystems(state)
  const reason = workshopReason(state, model)

  if (!report || !type) return <p className={shell.note}>Pick a mission first.</p>

  const tabName = {
    structure: 'Structure',
    shield: 'Shield',
    thermal: 'Thermal',
    power: 'Power',
    science: 'Science payload',
  }

  return (
    <div className={`${styles.screen} ${styles.workshop}`}>
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
          <div className={styles.options}>
            {model.optionsFor(sub.id, type).map((option, index) => (
              <PartChoice
                key={option.id}
                index={index}
                sub={sub}
                option={option}
                onPick={() => pickPart(sub.id, option.id)}
                onLocked={() => setNotice('Locked: your Phase 0 measurement doesn\'t need this instrument.')}
              />
            ))}
          </div>
          <dl className={styles.stats}>
            <div><dt>Hardware</dt><dd>{kgText(model, report.dry)}</dd></div>
            <div><dt>Fuel</dt><dd>{kgText(model, report.propellant)}</dd></div>
            <div><dt>Launch mass</dt><dd>{kgText(model, report.tli)}</dd></div>
          </dl>
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f0')}>← Mission goal</Button>
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
        <div className={styles.lock}>
          <Button variant="outline" disabledReason={reason} onClick={() => navigate('/f1b')}>Choose rocket</Button>
        </div>
      </div>
    </div>
  )
}

function PartChoice({ index, sub, option, onPick, onLocked }) {
  const { state, model } = useGame()
  const selected = sub.multi ? (state.design.science || []).includes(option.id) : state.design[sub.id] === option.id
  const unlocked = sub.id !== 'science' || model.unlockedInstruments(state).includes(option.id)

  return (
    <OptionRow
      variant="line"
      number={index + 1}
      text={option.title}
      selected={selected}
      locked={!unlocked}
      lockedReason="Your Phase 0 measurement doesn't need this"
      onSelect={onPick}
      onLocked={onLocked}
    />
  )
}
