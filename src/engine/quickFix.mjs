/*
 * Quick fixes for a spacecraft that is too heavy for its rocket or over budget, so the player can fix it
 * from the screen they are on instead of going back to the Phase 1 workshop.
 *
 * Pure: takes the engine (M, D) and the state, returns the problem and a short list of options. Each option
 * has apply(next), which edits a draft state in place, and before/after numbers to show what it does.
 * Options never break Phase 1 (power, payload and parts stay valid), so the design review stays passed.
 */

const KEEP_PHASE1 = ['missingSubsystems', 'payloadMismatch', 'noPower', 'noRocket']
const MAX_OPTIONS = 5

function clone(state) {
  return JSON.parse(JSON.stringify(state))
}

/** Kilograms over the rocket and millions over the budget (0 when fine). Cost counts even before a rocket is picked. */
export function problemOf(M, state) {
  const r = M.evaluate(state)
  if (!r) return { heavyKg: 0, overM: 0, report: r }
  return {
    heavyKg: r.rocket && r.fitsRocket === false ? r.tli - r.rocket.capacity : 0,
    overM: r.overBudget ? r.totalCost - r.budget : 0,
    report: r,
  }
}

function phase1Blocks(M, state) {
  return new Set(M.validatePhase(state, 1).issues.filter((issue) => issue.severity === 'block').map((issue) => issue.code))
}

/** A fix may not add a Phase 1 problem the design did not already have (a design still being built keeps its own). */
function breaksPhase1(M, before, next) {
  const after = phase1Blocks(M, next)
  return KEEP_PHASE1.some((code) => after.has(code) && !before.has(code))
}

function option(M, state, base, id, label, apply) {
  const next = clone(state)
  apply(next)
  if (breaksPhase1(M, base.blocks, next)) return null
  const after = problemOf(M, next)
  if (!after.report) return null
  return {
    id,
    label,
    apply,
    massChange: after.report.tli - base.report.tli,
    costChange: after.report.totalCost - base.report.totalCost,
    solved: after.heavyKg === 0 && after.overM === 0,
    after,
  }
}

function singleFixes(M, D, state) {
  const base = problemOf(M, state)
  if (!base.report || (!base.heavyKg && !base.overM)) return { problem: base, options: [] }
  base.blocks = phase1Blocks(M, state)
  const heavy = base.heavyKg > 0
  const out = []

  // 1. Another rocket: a bigger one carries more, a smaller one costs less.
  for (const rocket of state.rocket ? D.ROCKETS[state.missionType] || [] : []) {
    if (rocket.id === state.rocket) continue
    const o = option(M, state, base, `rocket:${rocket.id}`, `Rocket → ${rocket.title}`, (next) => { next.rocket = rocket.id })
    if (o && (o.after.heavyKg < base.heavyKg || o.after.overM < base.overM) && o.after.heavyKg <= base.heavyKg && o.after.overM <= base.overM) out.push(o)
  }

  // 2. Lighter or cheaper parts, from the engine's own descope list.
  for (const s of M.descopeSuggestions(state, heavy ? 'mass' : 'cost')) {
    const o = option(M, state, base, `part:${s.sub}:${s.opt}`, s.label, (next) => {
      next.design = next.design || {}
      if (s.remove) next.design.science = (next.design.science || []).filter((item) => item !== s.opt)
      else next.design[s.sub] = s.opt
    })
    if (o) out.push(o)
  }

  // 3. A smaller fuel margin: less fuel to launch (only down to the minimum the flight plan allows).
  const margin = state.flight && typeof state.flight.margin === 'number' ? state.flight.margin : null
  if (heavy && margin != null) {
    const lower = (D.FLIGHT.marginOptions || []).filter((m) => m < margin && m >= M.minMargin(state)).sort((a, b) => a - b)[0]
    if (lower != null) {
      const o = option(M, state, base, `margin:${lower}`, `Fuel margin → ${Math.round(lower * 100)}%`, (next) => {
        next.flight = Object.assign({}, next.flight, { margin: lower })
      })
      if (o) out.push(o)
    }
  }

  // A fix may not trade one problem for the other (cheaper but too heavy, or lighter but over budget):
  // that sends the player in circles. Then: fixes that solve everything first, then the biggest help.
  const fair = out.filter((o) => o.after.heavyKg <= base.heavyKg + 0.5 && o.after.overM <= base.overM + 0.05)
  const gain = (o) => (heavy ? base.heavyKg - o.after.heavyKg : base.overM - o.after.overM)
  fair.sort((a, b) => (Number(b.solved) - Number(a.solved)) || (gain(b) - gain(a)))
  return { problem: base, options: fair.filter((o) => o.solved || gain(o) > 0).slice(0, MAX_OPTIONS) }
}

/*
 * When no single change is enough, chain the best ones (up to six) into one "do all of these" option,
 * so a big overrun is fixed with one click too.
 */
function comboFix(M, D, state, base) {
  let current = clone(state)
  const steps = []
  for (let i = 0; i < 6; i++) {
    const { options } = singleFixes(M, D, current)
    if (!options.length) return null
    const pick = options[0]
    pick.apply(current)
    steps.push(pick)
    if (pick.solved) break
  }
  const after = problemOf(M, current)
  if (steps.length < 2 || after.heavyKg || after.overM) return null
  return {
    id: 'combo',
    label: steps.map((step) => step.label).join(' + '),
    apply: (next) => { for (const step of steps) step.apply(next) },
    massChange: after.report.tli - base.report.tli,
    costChange: after.report.totalCost - base.report.totalCost,
    solved: true,
    after,
    steps: steps.length,
  }
}

export function quickFixes(M, D, state) {
  const result = singleFixes(M, D, state)
  if (!result.options.length || result.options.some((o) => o.solved)) return result
  const combo = comboFix(M, D, state, result.problem)
  if (combo) result.options = [combo, ...result.options].slice(0, MAX_OPTIONS)
  return result
}
