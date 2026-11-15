import { createContext, useCallback, useContext, useState } from 'react'

const SAVE_KEY = 'ss-save-v1'
const DIFF_KEY = 'ss-difficulty'
const UI_DEFAULTS = {
  activeSub: 'structure',
  introStep: 0,
  closed: {},
  phase0Done: false,
  phase1Done: false,
  phase2Done: false,
  phase3Done: false,
  phase4Done: false,
  launched: false,
  showMath: {},
  showMel: false,
}

const GameContext = createContext(null)

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function engine() {
  return { D: window.SS_DATA, M: window.SS_MODEL }
}

function flags(raw, keys) {
  const out = {}
  if (raw && typeof raw === 'object') keys.forEach((key) => { if (raw[key] === true) out[key] = true })
  return out
}

function sanitizeUi(raw) {
  const { D } = engine()
  const ui = clone(UI_DEFAULTS)
  if (!raw || typeof raw !== 'object') return ui
  if (D.SUBSYSTEMS.some((item) => item.id === raw.activeSub)) ui.activeSub = raw.activeSub
  ui.introStep = Number.isInteger(raw.introStep) ? Math.max(0, Math.min(2, raw.introStep)) : 0
  ui.phase0Done = raw.phase0Done === true
  ui.phase1Done = raw.phase1Done === true
  ui.phase2Done = raw.phase2Done === true
  ui.phase3Done = raw.phase3Done === true
  ui.phase4Done = raw.phase4Done === true
  ui.launched = raw.launched === true
  ui.showMel = raw.showMel === true
  ui.closed = flags(raw.closed, ['f0', 'f1a', 'f1b', 'f1done', 'f2', 'f3a', 'f4', 'f3b'])
  ui.showMath = flags(raw.showMath, ['density', 'rocket', 'battery', 'life', 'comms'])
  return ui
}

function knownDifficulty(id) {
  return engine().D.DIFFICULTIES.some((item) => item.id === id)
}

function readDifficulty() {
  try {
    const id = localStorage.getItem(DIFF_KEY)
    return knownDifficulty(id) ? id : null
  } catch {
    return null
  }
}

function writeDifficulty(id) {
  try {
    if (knownDifficulty(id)) localStorage.setItem(DIFF_KEY, id)
  } catch {
    /* private mode */
  }
}

function fresh() {
  const state = Object.assign(engine().M.newState(), clone(UI_DEFAULTS))
  const chosen = readDifficulty()
  if (chosen) state.difficulty = chosen
  return state
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw || raw.length > 20000) return null
    const parsed = JSON.parse(raw)
    const { M } = engine()
    const state = Object.assign(M.sanitizeState(parsed), sanitizeUi(parsed))
    M.evaluate(state)
    writeDifficulty(state.difficulty)
    if (!missionInProgress(state)) {
      clearSave()
      return null
    }
    return state
  } catch {
    return null
  }
}

function save(state) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)) } catch { /* private mode */ }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY) } catch { /* private mode */ }
}

function saveExists() {
  try { return localStorage.getItem(SAVE_KEY) != null } catch { return false }
}

export function missionInProgress(state) {
  if (!state) return false
  if (state.phase0Done || state.phase1Done || state.phase2Done || state.phase3Done || state.phase4Done || state.launched) return true
  if (state.question || state.measure || state.missionType || state.rocket || state.site) return true
  if (state.introStep > 0 || state.showMel || state.crew || state.landing || state.surface || state.returnTrip) return true
  const design = state.design || {}
  if (design.structure || design.shield || design.thermal || design.power) return true
  if (Array.isArray(design.science) && design.science.length) return true
  if (state.comms && (state.comms.link || state.comms.dish)) return true
  if (state.flight && typeof state.flight.margin === 'number' && state.flight.margin !== 0) return true
  if (state.closed && Object.keys(state.closed).some((key) => state.closed[key])) return true
  if (state.showMath && Object.keys(state.showMath).some((key) => state.showMath[key])) return true
  const events = state.events
  if (events && (events.massGrowth || events.extraCost || events.risk || events.extraDays)) return true
  if (events && Array.isArray(events.log) && events.log.length) return true
  return false
}

function revalidate(state) {
  const { D, M } = engine()
  const report = M.evaluate(state)
  if (!report) {
    state.rocket = null
    state.phase1Done = false
    state.phase2Done = false
    state.phase3Done = false
    state.phase4Done = false
    return null
  }
  if (state.rocket) {
    const rocket = (D.ROCKETS[state.missionType] || []).find((item) => item.id === state.rocket)
    if (!rocket) {
      state.rocket = null
      return 'Your spacecraft got too heavy for that rocket. Pick again.'
    }
    // Keep an overweight pick so phase validators can name the real problem
    // (supplies or fuel margin made the craft too heavy) instead of "Pick a rocket".
    if (rocket.capacity < report.tli) {
      return 'Your spacecraft got too heavy for that rocket. Pick a bigger one or lighten the load.'
    }
  }
  if (state.phase1Done) {
    const again = M.evaluate(state)
    const ok = state.rocket && !M.missingSubsystems(state).length && M.payloadAnswers(state) && again.totalCost <= again.budget
    if (!ok) {
      state.phase1Done = false
      return 'Design changed: your spacecraft needs a new check.'
    }
  }
  if (!state.phase1Done) state.phase2Done = false
  if (state.phase2Done && !M.validatePhase(state, 2).ok) {
    state.phase2Done = false
    state.phase3Done = false
    return 'Crew plan changed: confirm it again.'
  }
  if (!state.phase2Done) state.phase3Done = false
  if (state.phase3Done && !M.validatePhase(state, 3).ok) {
    state.phase3Done = false
    state.phase4Done = false
    return 'Flight plan changed: check it again.'
  }
  if (!state.phase3Done) state.phase4Done = false
  if (state.phase4Done && !M.validatePhase(state, 4).ok) {
    state.phase4Done = false
    return 'Radio plan changed: check it again.'
  }
  return null
}

function useGameState() {
  const [state, setState] = useState(() => loadSaved() || fresh())
  const [notice, setNotice] = useState('')
  const { D, M } = engine()

  const update = useCallback((mutator) => {
    setState((prev) => {
      const next = clone(prev)
      const extra = mutator(next)
      const note = revalidate(next) || (typeof extra === 'string' ? extra : null)
      if (missionInProgress(next) || saveExists()) save(next)
      if (note) queueMicrotask(() => setNotice(note))
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setState((prev) => {
      writeDifficulty(prev.difficulty)
      clearSave()
      return fresh()
    })
    setNotice('')
  }, [])

  return {
    state,
    notice,
    setNotice,
    data: D,
    model: M,
    update,
    reset,
    setDifficulty: (id) => {
      writeDifficulty(id)
      update((next) => { next.difficulty = id })
    },
    startIntro: () => update((next) => { next.introStep = 0 }),
    setIntroStep: (step) => update((next) => { next.introStep = step }),
    closeBubble: (id) => update((next) => { next.closed[id] = true }),
    pickQuestion: (id) => update((next) => { next.question = id }),
    pickMeasure: (id) => update((next) => {
      next.measure = id
      const allowed = M.unlockedInstruments(next)
      next.design.science = (next.design.science || []).filter((item) => allowed.includes(item))
    }),
    pickMission: (id) => update((next) => {
      if (next.missionType !== id) {
        next.design.power = null
        next.rocket = null
        next.phase1Done = false
        next.crew = null
      }
      next.missionType = id
    }),
    toggleMath: (id) => update((next) => { next.showMath[id] = !next.showMath[id] }),
    lockGoal: () => update((next) => { next.phase0Done = true }),
    setSubsystem: (id) => update((next) => { next.activeSub = id }),
    pickPart: (subId, optId) => update((next) => {
      const sub = M.findSub(subId)
      if (!sub) return
      if (sub.multi) {
        const chosen = next.design.science || []
        next.design.science = chosen.includes(optId) ? chosen.filter((item) => item !== optId) : chosen.concat(optId)
      } else {
        next.design[sub.id] = optId
      }
      next.phase1Done = false
    }),
    pickRocket: (id) => update((next) => { next.rocket = id }),
    applyDescope: (index) => update((next) => {
      const suggestion = M.descopeSuggestions(next, descopeMode(next))[index]
      if (!suggestion) return
      if (suggestion.remove) next.design.science = (next.design.science || []).filter((item) => item !== suggestion.opt)
      else next.design[suggestion.sub] = suggestion.opt
      return `Descoped: ${suggestion.label}`
    }),
    toggleMel: () => update((next) => { next.showMel = !next.showMel }),
    lockDesign: () => update((next) => { next.phase1Done = true }),
    ensureCrew: () => update((next) => {
      if (next.missionType === 'crewed' && !next.crew) next.crew = M.defaultCrew()
    }),
    setCrew: (patch) => update((next) => {
      if (next.missionType !== 'crewed') return
      next.crew = Object.assign(next.crew || M.defaultCrew(), patch)
      next.phase2Done = false
    }),
    lockCrew: () => update((next) => { next.phase2Done = true }),
    setMargin: (margin) => update((next) => {
      if (!D.FLIGHT.marginOptions.includes(margin) || margin < M.minMargin(next)) return
      next.flight = Object.assign({}, next.flight, { margin })
      next.phase3Done = false
    }),
    lockFlight: () => update((next) => { next.phase3Done = true }),
    setComms: (patch) => update((next) => {
      next.comms = Object.assign({ link: null, dish: null }, next.comms, patch)
      next.phase4Done = false
    }),
    lockComms: () => update((next) => { next.phase4Done = true }),
    launch: () => update((next) => {
      if (!M.launchReadiness(next).go) return 'Every item must be GO first.'
      next.launched = true
      return 'Liftoff! 🚀'
    }),
  }
}

function GameReady({ children }) {
  const game = useGameState()
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>
}

export function GameProvider({ children }) {
  if (!window.SS_DATA || !window.SS_MODEL) {
    return <p role="alert">Game engine scripts did not load.</p>
  }
  return <GameReady>{children}</GameReady>
}

export function useGame() {
  const game = useContext(GameContext)
  if (!game) throw new Error('useGame must be used inside GameProvider')
  return game
}

export function sourceOrg(data, key) {
  const source = data.SOURCES[key]
  if (!source) return 'Game value'
  if (source.url.includes('esa.int')) return 'ESA'
  if (source.url.includes('nist.gov')) return 'NIST'
  return 'NASA'
}

export function missionProfile(state) {
  if (!state.missionType) return '—'
  if (state.missionType === 'crewed') return 'Crewed landing and return (Apollo-style)'
  return state.measure === 'sample' ? 'Robotic sample return (like the Luna probes)' : 'Robotic lander, one-way'
}

function meterTone(value, limit) {
  if (!limit) return ''
  if (value > limit) return 'over'
  if (value / limit >= 0.8) return 'warn'
  return ''
}

function barPercent(value, limit) {
  if (!limit) return 0
  return (Math.min(value / limit, 1.2) / 1.2) * 100
}

function meterDelta(preview, value, format) {
  if (preview == null || Math.abs(preview - value) <= 0.5) return ''
  const change = preview - value
  const sign = change > 0 ? '+' : '−'
  return `${change > 0 ? 'Up' : 'Down'} ${sign}${format(Math.abs(change))}`
}

function meterGhost(preview, value, limit) {
  if (preview == null || !limit || Math.abs(preview - value) <= 0.5) return null
  const current = barPercent(value, limit)
  const next = barPercent(preview, limit)
  return { left: Math.min(current, next), width: Math.abs(next - current) }
}

export function hudMeters(state, preview) {
  const { D, M } = engine()
  const report = M.evaluate(state)
  const type = state.missionType
  const rockets = type ? D.ROCKETS[type] || [] : []
  const rocket = report && report.rocket
  const capMax = rockets.length ? Math.max(...rockets.map((item) => item.capacity)) : 0
  const cap = rocket ? rocket.capacity : capMax
  const budget = type ? D.BUDGET[type][state.difficulty] : 0
  const fmt = M.fmt
  const hasPower = report && report.powerGen > 0
  const kg = (value) => `${fmt(value)} kg`
  const money = (value) => `$${fmt(value)}M`
  const watts = (value) => `${fmt(value)} W`
  const massValue = report ? report.tli : 0
  const costValue = report ? report.totalCost : 0
  const powerValue = report ? report.powerNeed : 0
  const massPreview = preview ? preview.tli : null
  const costPreview = preview ? preview.totalCost : null
  const powerPreview = preview && preview.powerGen > 0 ? preview.powerNeed : null
  return [
    {
      id: 'mass',
      label: '⚖️ Launch mass',
      value: massValue,
      max: report ? cap : 0,
      width: report ? barPercent(massValue, cap) : 0,
      text: report ? `${fmt(report.tli)} kg / ${fmt(cap)}` : 'Pick a mission',
      note: rocket ? `limit: ${rocket.title}` : (type ? 'compared with the biggest rocket' : ''),
      status: report ? meterTone(massValue, cap) : '',
      delta: report ? meterDelta(massPreview, massValue, kg) : '',
      ghost: report ? meterGhost(massPreview, massValue, cap) : null,
      clickable: true,
    },
    {
      id: 'cost',
      label: '💰 Budget',
      value: costValue,
      max: budget,
      width: report ? barPercent(costValue, budget) : 0,
      text: report ? `$${fmt(report.totalCost)}M / $${fmt(budget)}M` : '—',
      note: report && !rocket ? '+ rocket' : '',
      status: report ? meterTone(costValue, budget) : '',
      delta: report ? meterDelta(costPreview, costValue, money) : '',
      ghost: report ? meterGhost(costPreview, costValue, budget) : null,
      clickable: true,
    },
    {
      id: 'power',
      label: '⚡ Power',
      value: powerValue,
      max: hasPower ? report.powerGen : 0,
      width: hasPower ? barPercent(powerValue, report.powerGen) : 0,
      text: report ? (hasPower ? `${fmt(report.powerNeed)} / ${fmt(report.powerGen)} W` : `${fmt(report.powerNeed)} W needed`) : '—',
      note: report && !hasPower ? 'pick power' : '',
      status: hasPower ? meterTone(powerValue, report.powerGen) : '',
      delta: hasPower ? meterDelta(powerPreview, powerValue, watts) : '',
      ghost: hasPower ? meterGhost(powerPreview, powerValue, report.powerGen) : null,
      clickable: true,
    },
    { id: 'dv', label: '🚀 Delta-v', locked: true, lockedReason: 'Phase 3', clickable: false },
    { id: 'days', label: '📅 Days', locked: true, lockedReason: type === 'robotic' ? 'No crew' : 'Phase 2', clickable: false },
    { id: 'data', label: '📡 Data', locked: true, lockedReason: 'Phase 4', clickable: false },
  ]
}

export function descopeMode(state) {
  const { D, M } = engine()
  const report = M.evaluate(state)
  if (!report) return 'mass'
  const rockets = D.ROCKETS[state.missionType] || []
  return rockets.some((item) => item.capacity >= report.tli) ? 'cost' : 'mass'
}

export function continuePath(state) {
  if (state.launched) {
    const outcome = state.landing && state.landing.outcome
    const landed = outcome === 'clean' || outcome === 'rough'
    const finished = Boolean(state.surface && state.surface.finished)
    const returns = state.missionType === 'crewed' || state.measure === 'sample'
    if (landed && finished && returns) {
      const sim = engine().M.returnSim(state)
      return sim && sim.outcome === 'success' ? '/f8' : '/f7'
    }
    if (landed) return '/f6'
    if (state.site) return '/f5b'
    return '/f5a'
  }
  if (!state.phase0Done) return '/f0'
  if (!state.phase1Done) return '/f1a'
  if (!state.phase2Done) return '/f2'
  if (!state.phase3Done) return '/f3a'
  if (!state.phase4Done) return '/f4'
  return '/f3b'
}

const PHASES = ['Goal', 'Spacecraft', 'Crew', 'Flight', 'Comms', 'Landing', 'Science', 'Return']

export function phaseItems(state, current) {
  return PHASES.map((label, index) => {
    const done = (index === 0 && state.phase0Done) || (index === 1 && state.phase1Done) || (index === 2 && state.phase2Done) || (index === 3 && state.phase3Done) || (index === 4 && state.phase4Done)
    let status = 'locked'
    if (index === current) status = 'current'
    else if (done) status = 'done'
    else if (index === 1 && state.phase0Done) status = 'open'
    else if (index === 2 && state.phase1Done) status = 'open'
    else if (index === 3 && state.phase2Done) status = 'open'
    else if (index === 4 && state.phase3Done) status = 'open'
    let reason = ''
    if (status === 'locked') {
      if (index === 1 && !state.phase0Done) reason = 'Finish the goal first'
      else if (index === 2 && !state.phase1Done) reason = 'Finish the spacecraft first'
      else if (index === 3 && !state.phase2Done) reason = 'Finish the crew first'
      else if (index === 4 && !state.phase3Done) reason = 'Finish the flight plan first'
      else reason = 'Coming soon'
    }
    return { id: String(index), index, label, status, reason }
  })
}
