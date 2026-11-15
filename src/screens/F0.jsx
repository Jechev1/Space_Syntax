import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import { Stage } from '../components/stage/Stage.jsx'
import { missionConfig } from '../data/mission.config.mjs'
import { useGame } from '../engine/useGame.jsx'
import styles from './F0.module.css'

const MASS = missionConfig.fase1.cohetes.medio.capacidad
const BUDGET = missionConfig.maquetas.presupuestoDePantalla
const POWER = missionConfig.fase1.potencia.solarPequena.generacion

export function F0() {
  const navigate = useNavigate()
  const game = useGame()
  const { state, data, lockGoal, setNotice } = game
  const [step, setStep] = useState(() => openStep(state))
  const view = clampStep(step, state)
  const missing = !state.question ? 'Pick a question' : !state.measure ? 'Pick a measurement' : !state.missionType ? 'Pick a mission type' : ''

  useEffect(() => {
    document.title = 'Space Syntax — Phase 0: Mission goal'
  }, [])

  const choices = choicesFor(view, state, data, game, setStep)

  return (
    <Stage background="/bg/bg-observatorio.png" character="/char/nina-chaqueta-libreta.png">
      <div className={styles.screen}>
        <div className={styles.hud} aria-label="Mission status">
          <span>Earth</span>
          <span>Launch mass 0 / {amount(MASS)}</span>
          <span>Budget $0 / ${millions(BUDGET)}</span>
          <span>Power 0 / {amount(POWER)}</span>
        </div>
        <div className={styles.speech}>
          <Bubble tone="speech">A scientist needs proof.</Bubble>
        </div>
        <div className={styles.panel}>
          <GlassPanel>
            {view > 0 ? (
              <button type="button" className={styles.kicker} onClick={() => setStep(view - 1)}>Phase 0 · Mission goal</button>
            ) : (
              <p className={styles.kicker}>Phase 0 · Mission goal</p>
            )}
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
          </GlassPanel>
        </div>
        <div className={styles.home}>
          <Button variant="outline" onClick={() => navigate('/inicio')}>Back to start</Button>
        </div>
        <div className={styles.lock}>
          <Button
            variant="outline"
            disabled={Boolean(missing)}
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
    </Stage>
  )
}

function choicesFor(view, state, data, game, setStep) {
  if (view === 0) {
    return data.QUESTIONS.map((item, index) => ({
      id: item.id,
      number: index + 1,
      text: item.title,
      selected: state.question === item.id,
      onSelect: () => {
        game.pickQuestion(item.id)
        setStep(1)
      },
    }))
  }
  if (view === 1) {
    return data.MEASURES.map((item, index) => ({
      id: item.id,
      number: index + 1,
      text: item.title,
      selected: state.measure === item.id,
      onSelect: () => {
        game.pickMeasure(item.id)
        setStep(2)
      },
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
