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
 */

export const TUTORIAL_FLAG = 'ss-tutorial-on'
export const TUTORIAL_SAVE = 'ss-tutorial-v1'

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
    text: 'Pick a structure. Every part adds mass, cost and power.',
  },
  {
    id: 'f1a-rest', route: '/f1a', target: 'f1a-tabs', kind: 'free',
    done: (s, model) => model.missingSubsystems(s).length === 0 && model.payloadAnswers(s),
    text: 'Same for the rest — science needs an instrument that answers your question.',
  },
  {
    id: 'f1a-help', route: '/f1a', target: 'f1a-help', kind: 'click',
    text: 'Stuck on a choice? Help explains every option with real numbers.',
  },
  {
    id: 'f1a-next', route: '/f1a', target: 'f1a-next', kind: 'click',
    text: 'All five picked. Choose rocket takes you to the launch pad.',
  },
  {
    id: 'f1b-rocket', route: '/f1b', target: 'f1b-rockets', kind: 'wait',
    done: (s) => Boolean(s.rocket),
    text: 'Pick a rocket. Its capacity must cover your launch mass.',
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
]
