import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import { HELP_F1A } from '../data/help.mjs'
import { useGame } from '../engine/useGame.jsx'
import { kgText, usdText } from './bits.jsx'
import { f1aSpeech } from './f1Speech.mjs'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { MissionHud } from './f1Hud.jsx'
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

const TAB_NAME = {
  structure: 'Structure',
  shield: 'Shield',
  thermal: 'Thermal',
  power: 'Power',
  science: 'Science payload',
}

const SUB_QUESTION = {
  structure: 'Every part rides on this frame. What should the skeleton be made of?',
  shield: 'Grains of rock hit the Moon at several kilometres per second. What stops them?',
  thermal: 'The Moon swings from very hot to very cold. How will you keep the lander safe?',
  power: 'A lunar night can last hundreds of hours. What keeps the lander alive?',
  science: 'Which instruments answer your Phase 0 question?',
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
  const [help, setHelp] = useState(false)
  const report = model.evaluate(state)
  const type = state.missionType
  const subs = data.SUBSYSTEMS
  const sub = model.findSub(state.activeSub) || subs[0]
  const index = subs.indexOf(sub)
  const last = index === subs.length - 1
  const missing = model.missingSubsystems(state)
  const reason = workshopReason(state, model)

  if (!report || !type) return <p className={shell.note}>Pick a mission first.</p>

  const answered = sub.multi ? Boolean((state.design.science || []).length) : Boolean(state.design[sub.id])
  const canNext = last ? !reason : answered
  const speech = f1aSpeech(state.difficulty, sub.id, answered)
  const helpSub = HELP_F1A.subsystems[sub.id]
  const helpSource = helpSub && helpSub.source ? data.SOURCES[helpSub.source] : null

  return (
    <div className={`${styles.screen} ${styles.workshop}`}>
      <MissionHud />
      <div className={styles.tabs} role="group" aria-label="Spacecraft parts">
        {subs.map((item) => {
          const done = !missing.includes(item.id)
          const selected = item.id === sub.id
          const cls = [styles.tab, selected ? styles.tabOn : '', !done && !selected ? styles.tabPending : ''].filter(Boolean).join(' ')
          return (
            <button
              key={item.id}
              type="button"
              className={cls}
              aria-pressed={selected}
              onClick={() => setSubsystem(item.id)}
            >
              {TAB_NAME[item.id] || item.title}{done ? ' ✓' : ''}
            </button>
          )
        })}
      </div>
      {speech ? (
        <div className={styles.speech}>
          <Bubble tone="speech">{speech}</Bubble>
        </div>
      ) : null}
      <div className={styles.panel}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 1: Build the Spacecraft · NASA Phases A–C · Step {index + 1} of {subs.length}</p>
          <h2 className={styles.question}>{SUB_QUESTION[sub.id] || sub.title}</h2>
          <div className={styles.options}>
            {model.optionsFor(sub.id, type).map((option, optionIndex) => (
              <PartChoice
                key={option.id}
                index={optionIndex}
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
          <div className={styles.stepNav}>
            {index > 0 ? (
              <Button variant="secondary" onClick={() => setSubsystem(subs[index - 1].id)}>← Previous</Button>
            ) : null}
            <span className={canNext ? styles.nextOn : undefined}>
              <Button
                variant="secondary"
                disabled={!canNext}
                onClick={() => (last ? navigate('/f1b') : setSubsystem(subs[index + 1].id))}
              >
                {last ? 'Done' : 'Next →'}
              </Button>
            </span>
          </div>
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f0')}>← Mission goal</Button>
          <Button variant="secondary" onClick={() => setHelp(true)}>? Help</Button>
        </div>
        <div className={styles.lock}>
          <Button variant="outline" disabledReason={reason} onClick={() => navigate('/f1b')}>Choose rocket</Button>
        </div>
      </div>
      <div className={styles.help}>
        <Modal open={help} variant="info" title={HELP_F1A.title} onClose={() => setHelp(false)}>
          <p>{HELP_F1A.intro}</p>
          {helpSub ? (
            <>
              <p><b>{sub.title}:</b> {helpSub.what}</p>
              <p>{helpSub.hazard}</p>
              <p><b>Real missions:</b> {helpSub.example}</p>
            </>
          ) : null}
          {helpSource ? (
            <p><a className={shell.link} href={helpSource.url} target="_blank" rel="noopener noreferrer">Source: {helpSource.title} ↗</a></p>
          ) : null}
        </Modal>
      </div>
    </div>
  )
}

function PartChoice({ index, sub, option, onPick, onLocked }) {
  const { state, model } = useGame()
  const [hover, setHover] = useState(false)
  const selected = sub.multi ? (state.design.science || []).includes(option.id) : state.design[sub.id] === option.id
  const unlocked = sub.id !== 'science' || model.unlockedInstruments(state).includes(option.id)
  const showStats = hover || selected

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <OptionRow
        variant="line"
        number={index + 1}
        text={option.title}
        detail={option.blurb}
        chips={showStats && unlocked ? <OptionStats sub={sub} option={option} /> : null}
        selected={selected}
        locked={!unlocked}
        lockedReason="Your Phase 0 measurement doesn't need this"
        onSelect={onPick}
        onLocked={onLocked}
      />
    </div>
  )
}

/* Exact mass, cost and power this option adds to the current design, computed by the engine. */
function OptionStats({ sub, option }) {
  const { state, model } = useGame()
  const without = optionStats(state, model, sub, option.id)
  if (!without) return null
  const parts = [kgText(model, without.mass), usdText(model, without.cost)]
  if (without.need > 0) parts.push(`uses ${model.fmt(without.need)} W`)
  else if (without.gen > 0) parts.push(`makes ${model.fmt(without.gen)} W`)
  else parts.push('no power')
  return <span className={styles.optStats}>{parts.join(' · ')}</span>
}

function optionStats(state, model, sub, optId) {
  const base = JSON.parse(JSON.stringify(state))
  base.design = base.design || {}
  if (sub.multi) base.design[sub.id] = (base.design[sub.id] || []).filter((id) => id !== optId)
  else base.design[sub.id] = null
  const before = model.evaluate(base)
  const after = model.previewWith(base, sub.id, optId)
  if (!before || !after) return null
  return {
    mass: after.dry - before.dry,
    cost: after.cost - before.cost,
    need: after.powerNeed - before.powerNeed,
    gen: after.powerGen - before.powerGen,
  }
}
