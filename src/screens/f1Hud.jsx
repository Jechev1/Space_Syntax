import { useGame } from '../engine/useGame.jsx'
import styles from './F1.module.css'

export function MissionHud() {
  const { state, data, model } = useGame()
  const report = model.evaluate(state)
  const rockets = data.ROCKETS[state.missionType] || []
  const picked = rockets.find((item) => item.id === state.rocket)
  const reference = rockets.find((item) => item.id === 'medium' || item.id === 'sls1') || rockets[0]
  const capacity = picked ? picked.capacity : (reference ? reference.capacity : 0)
  const mass = report ? `${model.fmt(report.tli)} / ${model.fmt(capacity)} kg` : `0 / ${model.fmt(capacity)} kg`
  const budget = report ? `$${model.fmt(report.totalCost)}M / $${model.fmt(report.budget)}M` : '$0M'
  const power = report ? `${model.fmt(report.powerNeed)} / ${model.fmt(report.powerGen)} W` : '0 / 0 W'

  return (
    <div className={styles.hud} aria-label="Mission status">
      <span>Earth</span>
      <span>Launch mass {mass}</span>
      <span>Budget {budget}</span>
      <span>Power {power}</span>
    </div>
  )
}
