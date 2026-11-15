import { useGame } from '../engine/useGame.jsx'
import scene from './scene.module.css'

/**
 * Shared pieces for the illustrated phase screens (F2 onward): the top mission bar
 * and the line icons. Layout classes live in scene.module.css.
 */
export function SceneHud({ where = 'Earth', limits = false }) {
  const { state, model } = useGame()
  const hud = model.hud(state)
  const fmt = model.fmt
  if (limits) {
    return (
      <div className={`${scene.hud} ${scene.hudLimits}`} aria-label="Mission status">
        <span>{where}</span>
        <span>Launch mass {fmt(hud.launchMass)} / {hud.capacity == null ? '—' : fmt(hud.capacity)} kg</span>
        <span>Budget ${fmt(hud.cost)}M / ${fmt(hud.budget)}M</span>
        <span>Power {fmt(hud.powerNeed)} / {fmt(hud.powerGen)} W</span>
        <span>Data {fmt(hud.dataSentGb)} Gb</span>
      </div>
    )
  }
  return (
    <div className={scene.hud} aria-label="Mission status">
      <span>{where}</span>
      <span>Mass {fmt(hud.launchMass)} kg</span>
      <span>Cost ${fmt(hud.cost)}M</span>
      <span>Energy {energyText(hud.powerNeed, fmt)}</span>
      <span>Delta-v {fmt(hud.dvPlanned)} m/s</span>
      <span>Data {fmt(hud.dataSentGb)} Gb</span>
      <span>Days {hud.days == null ? '—' : fmt(hud.days)}</span>
    </div>
  )
}

export function energyText(watts, fmt) {
  return watts >= 1000 ? `${fmt(watts / 1000, 1)} kW` : `${fmt(watts)} W`
}

function Icon({ children }) {
  return (
    <svg className={scene.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

export function OxygenIcon() {
  return (
    <Icon>
      <path d="M10 2.5h4M12 2.5v2.5" />
      <rect x="7.5" y="5" width="9" height="16.5" rx="3.5" />
      <path d="M7.5 10.5h9" />
    </Icon>
  )
}

export function FoodIcon() {
  return (
    <Icon>
      <path d="M6 2.5v6.5a2.5 2.5 0 0 0 5 0V2.5M8.5 2.5v19" />
      <path d="M17.5 21.5V2.5c-2 1.5-3 4-3 7.5v3h3" />
    </Icon>
  )
}

export function WaterIcon() {
  return (
    <Icon>
      <path d="M12 2.8c3.4 4.4 6 7.7 6 11.2a6 6 0 0 1-12 0c0-3.5 2.6-6.8 6-11.2z" />
    </Icon>
  )
}
