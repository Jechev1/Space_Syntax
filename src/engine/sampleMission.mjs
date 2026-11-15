/*
 * Sample missions for screens whose earlier phases are not built in React yet (Phases 2 to 4).
 * They come from the backend fixtures (fixtures/f5b.*.json), so every number is a real engine result.
 * Screens offer them behind a "Load a sample mission" button when the player's state is missing a step.
 */
import robotic from '../../fixtures/f5b.robotic.json'
import crewed from '../../fixtures/f5b.crewed.json'

const BASE = { robotic: robotic.state, crewed: crewed.state }
const UI = { phase0Done: true, phase1Done: true }

/**
 * A full engine state ready for a screen.
 * type: 'robotic' | 'crewed' (Phase 7 needs a return trip, so it always uses crewed).
 * stage: 'f5a' (no site yet) | 'f5b' (site picked) | 'f6' (landed) | 'f7' (surface work finished).
 */
export function sampleMission(type, stage) {
  const M = window.SS_MODEL
  const t = stage === 'f7' ? 'crewed' : (type === 'crewed' ? 'crewed' : 'robotic')
  let s = Object.assign(JSON.parse(JSON.stringify(BASE[t])), UI)
  if (stage === 'f5a') { s.site = null; s.landing = null; return s }
  s.site = s.site || 'tranquility'
  if (stage === 'f5b') { s.landing = null; return s }
  s.landing = { seed: 7, outcome: 'clean' }
  s.surface = null
  if (stage === 'f6') return s
  // f7: one real measurement, then finish the surface work, all through the engine rules.
  const poi = M.surfacePois(s)[0]
  const ins = M.unlockedInstruments(s).find((id) => (s.design.science || []).includes(id) && M.canMeasure(s, poi.id, id).ok)
  if (poi && ins) s = M.measure(s, poi.id, ins).state
  s = M.finishSurface(s).state
  s.returnTrip = { seed: 7, entry: null, shield: null }
  return s
}
