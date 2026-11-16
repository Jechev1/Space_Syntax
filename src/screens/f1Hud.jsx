import { useGame } from '../engine/useGame.jsx'
import styles from './F1.module.css'

export function MissionHud() {
  const { state, data, model } = useGame()
  const report = model.evaluate(state)
  const rockets = data.ROCKETS[state.missionType] || []
  const picked = rockets.find((item) => item.id === state.rocket)
  const mass = report ? `${model.fmt(report.tli)} kg` : '0 kg'
  const massText = picked ? `${mass} / ${model.fmt(picked.capacity)} kg` : mass
  const budget = report ? `$${model.fmt(report.totalCost)}M / $${model.fmt(report.budget)}M` : '$0M'
  const power = report ? `${model.fmt(report.powerNeed)} / ${model.fmt(report.powerGen)} W` : '0 / 0 W'

  return (
    <div className={styles.hud} aria-label="Mission status">
      <span>Earth</span>
      <span>Launch mass {massText}</span>
      <span>Budget {budget}</span>
      <span>Power {power}</span>
    </div>
  )
}
