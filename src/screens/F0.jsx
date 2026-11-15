import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import { Stage } from '../components/stage/Stage.jsx'
import { missionConfig } from '../data/mission.config.mjs'
import { useGame } from '../engine/useGame.jsx'
import { lessonFor, speechFor } from './f0Facts.mjs'
import styles from './F0.module.css'

const MASS = missionConfig.fase1.cohetes.medio.capacidad
const BUDGET = missionConfig.maquetas.presupuestoDePantalla
const POWER = missionConfig.fase1.potencia.solarPequena.generacion

export function F0() {
  const navigate = useNavigate()
  const game = useGame()
  const { state, data, lockGoal, setNotice } = game
  const [step, setStep] = useState(() => openStep(state))
  const [help, setHelp] = useState(false)
  const view = clampStep(step, state)
  const missing = !state.question ? 'Pick a question' : !state.measure ? 'Pick a measurement' : !state.missionType ? 'Pick a mission type' : ''
  const answered = Boolean(answerId(view, state))
  const lesson = lessonFor(view, state)

  useEffect(() => {
    document.title = 'Space Syntax — Phase 0: Mission Goal'
  }, [])

  const choices = choicesFor(view, state, data, game)

  return (
    <Stage
      background="/bg/bg-observatorio.png"
      character={<img className={styles.girl} src="/char/nina-chaqueta-libreta.png" alt="" />}
    >
      <div className={styles.screen}>
        <div className={styles.hud} aria-label="Mission status">
          <span>Earth</span>
          <span>Launch mass 0 / {amount(MASS)}</span>
          <span>Budget $0 / ${millions(BUDGET)}</span>
          <span>Power 0 / {amount(POWER)}</span>
        </div>
        <div className={styles.speech}>
          <Bubble tone="speech">{speechFor(state.difficulty, view, answered)}</Bubble>
        </div>
        <div className={styles.column}>
          <div className={styles.panel}>
            <GlassPanel>
              <p className={styles.kicker}>Phase 0: Mission Goal · NASA Pre-Phase A · Step {view + 1} of 3</p>
              <h2 className={styles.question}>{stepTitle(view)}</h2>
              <div className={styles.options}>
                {choices.map((item) => (
                  <OptionRow
                    key={item.id}
                    variant="line"
                    number={item.number}
                    text={item.text}
                    selected={item.selected}
                    onSelect={item.onSelect}
                  />
                ))}
              </div>
              <p className={styles.hypothesis}>Hypothesis: The Moon is made of cheese.</p>
              <div className={styles.stepNav}>
                {view > 0 ? (
                  <Button variant="secondary" onClick={() => setStep(view - 1)}>← Previous</Button>
                ) : null}
                {view < 2 ? (
                  <span className={answered ? styles.nextOn : undefined}>
                    <Button variant="secondary" disabled={!answered} onClick={() => setStep(view + 1)}>Next →</Button>
                  </span>
                ) : null}
              </div>
            </GlassPanel>
          </div>
          {lesson ? (
            <div key={`${view}-${answerId(view, state)}`} className={styles.learn}>
              <GlassPanel>
                <div className={styles.facts}>
                  {lesson.facts.map((fact) => (
                    <p key={fact.label}>
                      <span className={styles.factLabel}>{fact.label}:</span>{' '}
                      {fact.bits.map((item, index) => (
                        <span key={item.text}>{index > 0 ? ', ' : ''}{item.text}</span>
                      ))}
                    </p>
                  ))}
                </div>
                <p className={styles.why}><span className={styles.factLabel}>Why it matters:</span> {lesson.why}</p>
              </GlassPanel>
            </div>
          ) : null}
        </div>
        <div className={styles.dock}>
          <div className={styles.nav}>
            <Button variant="secondary" onClick={() => navigate('/inicio')}>← Back to start</Button>
            <Button variant="secondary" onClick={() => setHelp(true)}>? Help</Button>
          </div>
          <div className={styles.lock}>
            <Button
              variant="outline"
              disabledReason={missing}
              onClick={() => {
                flushSync(() => {
                  lockGoal()
                  setNotice('Mission goal locked in ✓')
                })
                navigate('/f1a')
              }}
            >
              Lock in goal
            </Button>
          </div>
        </div>
        <div className={styles.help}>
          <Modal open={help} variant="info" title="Phase 0: Mission Goal" onClose={() => setHelp(false)}>
            <p>Phase 0 locks the mission goal: what you want to learn, how you will measure it, and whether robots or people go.</p>
            <p>The question and the measurement decide which instruments Phase 1 lets you fly.</p>
            <p>Robotic or crewed sets the budget and the lander, and decides whether later phases must keep a crew alive and bring them home.</p>
          </Modal>
        </div>
      </div>
    </Stage>
  )
}

function choicesFor(view, state, data, game) {
  if (view === 0) {
    return data.QUESTIONS.map((item, index) => ({
      id: item.id,
      number: index + 1,
      text: item.title,
      selected: state.question === item.id,
      onSelect: () => game.pickQuestion(item.id),
    }))
  }
  if (view === 1) {
    return data.MEASURES.map((item, index) => ({
      id: item.id,
      number: index + 1,
      text: item.title,
      selected: state.measure === item.id,
      onSelect: () => game.pickMeasure(item.id),
    }))
  }
  return data.MISSION_TYPES.map((item, index) => ({
    id: item.id,
    number: index + 1,
    text: item.title,
    selected: state.missionType === item.id,
    onSelect: () => game.pickMission(item.id),
  }))
}

function answerId(view, state) {
  if (view === 0) return state.question || ''
  if (view === 1) return state.measure || ''
  return state.missionType || ''
}

function openStep(state) {
  if (!state.question) return 0
  if (!state.measure) return 1
  return 2
}

function clampStep(step, state) {
  if (!state.question) return 0
  if (step < 1) return 0
  if (!state.measure || step < 2) return 1
  return 2
}

function stepTitle(view) {
  if (view === 0) return 'What do you want to find out?'
  if (view === 1) return 'What measurement would prove it?'
  return 'Robots or people?'
}

function amount(entry) {
  return `${Number(entry.value).toLocaleString('en-US')} ${entry.unit}`
}

function millions(entry) {
  return `${Number(entry.value).toLocaleString('en-US')}M`
}
