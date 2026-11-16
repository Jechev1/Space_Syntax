import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGame } from '../../engine/useGame.jsx'
import { TUTORIAL_STEPS, endTutorial, tutorialOn } from '../../data/tutorialSteps.mjs'
import { Button } from '../ui/Button.jsx'
import { GlassPanel } from '../ui/GlassPanel.jsx'
import styles from './Tutorial.module.css'

const TutorialContext = createContext(null)

/* Route order, to notice when the player navigates past the last tutorial screen. */
const ROUTE_ORDER = ['/inicio', '/', '/f0', '/f1a', '/f1b', '/f1done', '/f2', '/f3a', '/f3b', '/f4', '/f5a', '/f5b', '/f6', '/f7', '/f8']

export function useTutorial() {
  return useContext(TutorialContext)
}

export function TutorialProvider({ children }) {
  const game = useGame()
  const location = useLocation()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const active = tutorialOn()
  const step = active ? TUTORIAL_STEPS[index] : null
  const finished = active && !step

  useEffect(() => {
    if (active) document.body.dataset.tutorialActive = '1'
    else delete document.body.dataset.tutorialActive
    return () => delete document.body.dataset.tutorialActive
  }, [active])

  /* Keep the step counter in sync with the screen: jumping ahead skips to the
     first step of that screen, landing past the tutorial completes it. */
  useEffect(() => {
    if (!active || !step) return
    const path = location.pathname
    if (path === step.route) return
    const forward = TUTORIAL_STEPS.findIndex((s, i) => i > index && s.route === path)
    if (forward >= 0) {
      setIndex(forward)
      return
    }
    const lastRoute = TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].route
    if (ROUTE_ORDER.indexOf(path) > ROUTE_ORDER.indexOf(lastRoute)) setIndex(TUTORIAL_STEPS.length)
  }, [active, step, index, location.pathname])

  /* Steps may patch the tutorial save and warp ahead (the Phase 7 games).
     Only fires while off-route: an enter() that reloads the page must not loop. */
  useEffect(() => {
    if (active && step && step.enter && location.pathname !== step.route) step.enter(game, navigate)
  }, [active, step, index]) // eslint-disable-line react-hooks/exhaustive-deps

  const api = useMemo(() => ({ active, stepIndex: index, total: TUTORIAL_STEPS.length }), [active, index])

  const layer = !active ? null : createPortal(
    <>
      {step && location.pathname === step.route ? (
        <Coach
          key={step.id}
          step={step}
          index={index}
          total={TUTORIAL_STEPS.length}
          game={game}
          onAdvance={() => setIndex(index + 1)}
        />
      ) : null}
      {!finished ? (
        <div className={styles.bar}>
          <span className={styles.count}>Step {index + 1} of {TUTORIAL_STEPS.length}</span>
          <button type="button" className={styles.skip} onClick={() => endTutorial()}>Skip tutorial</button>
        </div>
      ) : (
        <TutorialComplete />
      )}
    </>,
    document.body,
  )

  return (
    <TutorialContext.Provider value={api}>
      {children}
      {layer}
    </TutorialContext.Provider>
  )
}

/** One coach mark: dim with a lit hole on the target, a short bubble and the blocking shield. */
function Coach({ step, index, total, game, onAdvance }) {
  const { state, model } = game
  const [rect, setRect] = useState(null)
  const [inDialog, setInDialog] = useState(false)
  const [fallback, setFallback] = useState(false)
  const seenTarget = useRef(false)
  const free = step.kind === 'free'

  useEffect(() => {
    const find = () => {
      const el = document.querySelector(`[data-tutorial="${step.target}"]`)
      if (el) seenTarget.current = true
      setRect(el ? el.getBoundingClientRect() : null)
      setInDialog(Boolean(el && el.closest('[role="dialog"]')))
    }
    find()
    const timer = setInterval(find, 250)
    window.addEventListener('resize', find)
    return () => { clearInterval(timer); window.removeEventListener('resize', find) }
  }, [step])

  // A step should never deadlock: if the target never shows or nothing happens, offer Next.
  useEffect(() => {
    setFallback(false)
    const timer = setTimeout(() => setFallback(true), 6000)
    return () => clearTimeout(timer)
  }, [step])

  // "click" steps advance when the real control gets used.
  useEffect(() => {
    if (step.kind !== 'click') return undefined
    const onClick = (event) => {
      const el = event.target.closest && event.target.closest(`[data-tutorial="${step.target}"]`)
      if (el) setTimeout(onAdvance, step.delay || 150)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [step, onAdvance])

  // "wait" and "free" steps advance when the goal is reached. Polling is needed
  // because run results live in component state, outside the game store.
  useEffect(() => {
    if ((step.kind !== 'wait' && step.kind !== 'free') || !step.done) return undefined
    let timer
    const check = () => {
      // requireTarget: the element must appear at least once before done() counts,
      // so "disappeared" predicates do not fire while the target is still unmounted.
      if (step.requireTarget && !seenTarget.current) return
      if (!timer && step.done(state, model)) timer = setTimeout(onAdvance, step.delay || 350)
    }
    check()
    const poll = setInterval(check, 300)
    return () => { clearInterval(poll); clearTimeout(timer) }
  }, [step, state, model, onAdvance])

  const bubble = rect ? bubblePos(rect, window.innerWidth, window.innerHeight) : null
  const showNext = step.kind === 'next' || fallback
  const blocks = !free ? shieldRects(rect) : null

  return (
    <>
      <div className={styles.root} aria-live="polite">
        {rect ? (
          <span
            className={styles.spot}
            style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }}
            aria-hidden="true"
          />
        ) : (
          <span className={styles.dim} aria-hidden="true" />
        )}
        {blocks && !inDialog ? <Shield rects={blocks} /> : null}
      </div>
      {/* When the target lives inside a Dialog the shield must sit above it so only the lit control works. */}
      {blocks && inDialog ? (
        <div className={styles.shieldTop}>
          <Shield rects={blocks} />
        </div>
      ) : null}
      <div className={styles.bubble} style={bubble || { top: '16%', left: '50%', transform: 'translateX(-50%)' }}>
        <p className={styles.bubbleText}>{step.text}</p>
        <div className={styles.bubbleFoot}>
          <span className={styles.stepTag}>{index + 1} / {total}</span>
          {showNext ? (
            <button type="button" className={styles.next} onClick={onAdvance}>Next →</button>
          ) : null}
        </div>
      </div>
    </>
  )
}

/* Four rectangles that cover the viewport except the spotlight hole. */
function shieldRects(rect) {
  const top = rect ? rect.top - 6 : 0
  const left = rect ? rect.left - 6 : 0
  const right = rect ? rect.right + 6 : 0
  const bottom = rect ? rect.bottom + 6 : 0
  if (!rect) return [{ top: 0, left: 0, right: 0, bottom: 0 }]
  return [
    { top: 0, left: 0, right: 0, height: Math.max(0, top) },
    { top, left: 0, width: Math.max(0, left), bottom: 0 },
    { top, left: right, right: 0, bottom: 0 },
    { top: bottom, left: 0, right: 0, bottom: 0 },
  ]
}

function Shield({ rects }) {
  return rects.map((style, i) => <span key={i} className={styles.block} style={style} />)
}

function bubblePos(rect, vw, vh) {
  const W = 272
  const H = 88
  const G = 14
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const centerX = rect.left + rect.width / 2 - W / 2
  if (rect.bottom + G + H < vh) return { top: rect.bottom + G, left: clamp(centerX, 8, vw - W - 8) }
  if (rect.top - G - H > 0) return { top: rect.top - G - H, left: clamp(centerX, 8, vw - W - 8) }
  if (rect.right + G + W < vw) return { left: rect.right + G, top: clamp(rect.top, 8, vh - H - 8) }
  return { left: Math.max(8, rect.left - G - W), top: clamp(rect.top, 8, vh - H - 8) }
}

function TutorialComplete() {
  return (
    <div className={styles.doneRoot}>
      <span className={styles.block} style={{ top: 0, left: 0, right: 0, bottom: 0 }} />
      <span className={styles.dim} aria-hidden="true" />
      <div className={styles.doneCard}>
        <GlassPanel eyebrow="Tutorial" title="Tutorial complete">
          <p className={styles.doneLine}>You built a spacecraft, fed a crew, flew the plan and brought everyone home. Ready for the real one.</p>
          <div className={styles.doneActions}>
            <Button variant="outline" onClick={() => endTutorial()}>Start the mission</Button>
            <Button variant="secondary" onClick={() => endTutorial()}>Back to menu</Button>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
