/*
 * Tutorial mode: a guided walk through Phases 1 to 3 with coach marks.
 *
 * The tutorial plays the real screens but on a separate save slot, so the
 * player's mission in ss-save-v1 is never touched. While the flag is set,
 * useGame writes saves to TUTORIAL_SAVE instead of SAVE_KEY.
 *
 * Step kinds:
 *   click — spotlight on the target; advances when the user clicks it (real action).
 *   wait  — spotlight; advances when done(state, model) turns true.
 *   next  — spotlight; explanation only; advances with the Next button.
 *   free  — no click blocking; user plays freely until done(state, model).
 * Test steps stay 'free' so a failed run never traps the player behind the shield.
 * delay (ms) — wait this long after the trigger before advancing.
 * enter(game, navigate) — runs once when the step activates (state patch, warp).
 * requireTarget — for wait/free steps: only start checking done() once the target
 * element has been seen at least once (covers targets that mount after a click).
 */

export const TUTORIAL_FLAG = 'ss-tutorial-on'
export const TUTORIAL_SAVE = 'ss-tutorial-v1'

/* A known-good Cadet build: light enough for SLS Block 2 (≈39.9t under 46t) and
   answered by the spectrometer. Screens mark these with a "Suggested" chip. */
export const TUTORIAL_PICKS = {
  structure: 'composite',
  shield: 'whipple',
  thermal: 'passive',
  power: 'crewSolar',
  science: ['spectrometer'],
  rocket: 'sls2',
}

/** Is this option the tutorial's suggested pick? Used to mark rows while the tutorial runs. */
export function tutorialSuggests(subId, optId) {
  if (!tutorialOn()) return false
  const pick = TUTORIAL_PICKS[subId]
  return Array.isArray(pick) ? pick.includes(optId) : pick === optId
}

export function tutorialOn() {
  try { return localStorage.getItem(TUTORIAL_FLAG) === '1' } catch { return false }
}

/** Begin a tutorial run: flag on, fresh crewed seed at Cadet, straight to Phase 1. */
export function startTutorial() {
  const M = window.SS_MODEL
  const seed = M ? M.newState() : {}
  Object.assign(seed, {
    difficulty: 'cadet',
    question: 'made',
    measure: 'chem',
    missionType: 'crewed',
    phase0Done: true,
  })
  try {
    localStorage.setItem(TUTORIAL_FLAG, '1')
    localStorage.setItem(TUTORIAL_SAVE, JSON.stringify(seed))
  } catch { /* private mode */ }
  window.location.assign('/f1a')
}

/** Leave tutorial mode: drop the tutorial save and flag, back to the menu. */
export function endTutorial(dest = '/inicio') {
  try {
    localStorage.removeItem(TUTORIAL_FLAG)
    localStorage.removeItem(TUTORIAL_SAVE)
  } catch { /* private mode */ }
  window.location.assign(dest)
}

export const TUTORIAL_STEPS = [
  /* Phase 1 — build the spacecraft, pick the rocket */
  {
    id: 'f1a-options', route: '/f1a', target: 'f1a-options', kind: 'wait',
    done: (s) => Boolean(s.design && s.design.structure),
    text: 'Pick a structure — the Suggested one keeps the spacecraft light.',
  },
  {
    id: 'f1a-rest', route: '/f1a', target: 'f1a-tabs', kind: 'free',
    done: (s, model) => model.missingSubsystems(s).length === 0 && model.payloadAnswers(s),
    text: 'Do the same on every tab. Suggested picks fit the rocket and answer your question.',
  },
  {
    id: 'f1a-help', route: '/f1a', target: 'f1a-help', kind: 'click',
    text: 'Stuck on a choice? Help explains every option with real numbers.',
  },
  {
    id: 'f1a-close', route: '/f1a', target: 'modal-close', kind: 'wait',
    done: () => !document.querySelector('[data-tutorial="modal-close"]'),
    text: 'Read what matters, then close the help to keep going.',
  },
  {
    id: 'f1a-next', route: '/f1a', target: 'f1a-next', kind: 'click',
    text: 'All five picked. Choose rocket takes you to the launch pad.',
  },
  {
    id: 'f1b-rocket', route: '/f1b', target: 'f1b-rockets', kind: 'wait',
    done: (s) => Boolean(s.rocket),
    text: 'Pick a rocket. Its capacity must cover your launch mass — the Suggested one fits.',
  },
  {
    id: 'f1b-test', route: '/f1b', target: 'f1b-test', kind: 'free',
    done: () => Boolean(document.querySelector('[data-tut-verdict="ok"]')),
    text: 'Run the launch test — the upper stage must add 3,150 m/s.',
  },
  {
    id: 'f1b-next', route: '/f1b', target: 'f1b-next', kind: 'click',
    text: 'Test passed and mass fits? Confirm the spacecraft.',
  },
  {
    id: 'f1done-go', route: '/f1done', target: 'f1done-go', kind: 'click',
    text: 'All green means GO. Confirm the design review.',
  },
  /* Phase 2 — crew and life support */
  {
    id: 'f2-size', route: '/f2', target: 'f2-size', kind: 'click',
    text: 'Crew size: every astronaut needs oxygen, food and water each day.',
  },
  {
    id: 'f2-reserve', route: '/f2', target: 'f2-reserve', kind: 'click',
    text: 'Safety reserve packs 20% extra supplies for delays.',
  },
  {
    id: 'f2-suit', route: '/f2', target: 'f2-suits', kind: 'wait',
    done: (s) => Boolean(s.crew && s.crew.suit),
    text: 'Moonwalk suits: the hours say how long they can stay outside. Pick one.',
  },
  {
    id: 'f2-test', route: '/f2', target: 'f2-test', kind: 'free',
    done: () => Boolean(document.querySelector('[data-tut-verdict="ok"]')),
    text: 'Run the test — it simulates every mission day.',
  },
  {
    id: 'f2-math', route: '/f2', target: 'f2-math', kind: 'click', delay: 400,
    text: 'Show the math: 0.895 O2 + 0.800 food + 3.217 water kg per astronaut-day.',
  },
  {
    id: 'f2-close', route: '/f2', target: 'dialog-close', kind: 'click',
    text: 'Crew x days x per-day amounts set the totals. Close it when done.',
  },
  {
    id: 'f2-confirm', route: '/f2', target: 'f2-confirm', kind: 'click',
    text: 'Supplies last the whole trip? Confirm the crew.',
  },
  /* Phase 3 — navigation and delta-v */
  {
    id: 'f3-burns', route: '/f3a', target: 'f3a-burns', kind: 'next',
    text: 'Each burn changes your speed. TLI is paid by the rocket, not the spacecraft.',
  },
  {
    id: 'f3-margin', route: '/f3a', target: 'f3a-margin', kind: 'click',
    text: 'Margin is spare fuel for navigation mistakes. Pick one.',
  },
  {
    id: 'f3-fly', route: '/f3a', target: 'f3a-fly', kind: 'free',
    done: () => Boolean(document.querySelector('[data-tut-verdict="ok"]')),
    text: 'Fly each burn and see if your fuel is enough.',
  },
  /* Phase 7 — the fun part: liftoff timing and steering the splashdown.
     f7-start's enter() fast-forwards the tutorial save to a return-ready state
     (launched, landed, surface finished) so /f7 is playable; that route has no guard. */
  {
    id: 'f7-lead', route: '/f3a', target: 'f3a-fly', kind: 'next',
    text: 'Plan approved. Now the fun part: fly the ship home yourself.',
  },
  {
    id: 'f7-start', route: '/f7', target: 'f7-start', kind: 'click',
    // The warp writes the tutorial save directly and reloads into /f7: patching
    // launched via update() would make the F3a guard redirect to /f3b and win the race.
    // The overlay only runs enter() while off-route, so the reload lands exactly once.
    // sanitizeState replays surface.actions through the real rules, so the patch
    // must be a state the engine itself accepts: site + landing seed + one real
    // measurement (checked with canMeasure) or surface.finished would be dropped.
    enter: () => {
      const M = window.SS_MODEL, D = window.SS_DATA
      const next = JSON.parse(localStorage.getItem(TUTORIAL_SAVE) || '{}')
      next.launched = true
      next.phase3Done = true
      next.phase4Done = true
      if (!next.site) next.site = ((D.SITES.find((s) => (D.SURFACE.pois[s.id] || []).length)) || {}).id || null
      next.landing = { seed: 42, outcome: 'clean' }
      const margin = (next.flight && next.flight.margin) || 0
      // 0.05 covers the worst Cadet dispersion (0.02) without pushing launch mass over the rocket.
      next.flight = Object.assign({}, next.flight, { margin: Math.max(0.05, margin) })
      next.surface = { actions: [], finished: false }
      let action = null
      const pois = (D.SURFACE.pois[next.site] || []).map((p) => p.id)
      const aboard = ((next.design && next.design.science) || []).filter((id) => M.unlockedInstruments(next).includes(id))
      for (const poi of pois) for (const ins of aboard) {
        if (!action && M.canMeasure(next, poi, ins).ok) action = { type: 'measure', poi, instrument: ins }
      }
      next.surface = { actions: action ? [action] : [], finished: true }
      localStorage.setItem(TUTORIAL_SAVE, JSON.stringify(next))
      window.location.assign('/f7')
    },
    text: 'Skip ahead: the Moon work is done. Start the return trip.',
  },
  {
    id: 'f7-liftoff', route: '/f7', target: 'f7-liftoff', kind: 'click',
    text: 'Ignition is a timing game: Lift off starts the countdown.',
  },
  {
    id: 'f7-rings', route: '/f7', target: 'f7-rings', kind: 'free', requireTarget: true,
    done: () => !document.querySelector('[data-tutorial="f7-rings"]'),
    text: 'Tap the ring — or press any key — when the circles meet.',
  },
  {
    id: 'f7-burn2', route: '/f7', target: 'f7-burn2', kind: 'click',
    text: 'One more burn aims the ship at Earth.',
  },
  {
    id: 'f7-entry', route: '/f7', target: 'f7-entry', kind: 'free',
    done: () => Boolean(document.querySelector('[data-tutorial="f7-shield"]')),
    text: 'Pick a reentry path, then Choose heat shield.',
  },
  {
    id: 'f7-shield', route: '/f7', target: 'f7-shield', kind: 'free',
    done: () => Boolean(document.querySelector('[data-tutorial="f7-guide"]')),
    text: 'Thicker shield means more margin. Pick one and Reenter.',
  },
  {
    id: 'f7-guide', route: '/f7', target: 'f7-guide', kind: 'free', requireTarget: true,
    done: () => !document.querySelector('[data-tutorial="f7-guide"]'),
    text: 'Steer with the arrow keys or A / D and land on the recovery ships.',
  },
  {
    id: 'f7-splash', route: '/f7', target: 'f7-finish', kind: 'free',
    done: () => window.location.pathname === '/f8',
    text: 'Inside the zone means a clean splashdown. Finish the mission.',
  },
]
