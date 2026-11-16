import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Dialog } from '../components/ui/Dialog.jsx'
import { quickFixes } from '../engine/quickFix.mjs'
import { useGame } from '../engine/useGame.jsx'
import styles from './QuickFix.module.css'

/*
 * When the spacecraft becomes too heavy for its rocket or goes over budget (in the workshop, the rocket pad,
 * the design review, crew, flight plan, comms or launch screens), a window opens with fixes the player can apply right here, instead
 * of walking back to the Phase 1 workshop. Nothing here changes screen: every fix is applied in place and
 * the player stays where they were. A small button stays on screen to open it again.
 */
const ROUTES = new Set(['/f1a', '/f1b', '/f1done', '/f2', '/f3a', '/f4', '/f3b'])

function signed(value, unit, prefix = '') {
  const n = Math.round(value)
  if (!n) return `${prefix}0${unit}`
  return `${n > 0 ? '+' : '−'}${prefix}${Math.abs(n).toLocaleString('en-US')}${unit}`
}

export function QuickFix() {
  const { pathname } = useLocation()
  const { state, data, model, update } = useGame()
  const active = ROUTES.has(pathname) && !state.launched && Boolean(state.missionType)
  const fixes = active ? quickFixes(model, data, state) : null
  const heavy = fixes ? fixes.problem.heavyKg : 0
  const over = fixes ? fixes.problem.overM : 0
  const key = `${heavy > 0 ? 'heavy' : ''}${over > 0 ? 'over' : ''}`
  const [open, setOpen] = useState(false)
  const seen = useRef('')

  // Open on its own when a new problem shows up; close when it is gone.
  useEffect(() => {
    if (key && key !== seen.current) setOpen(true)
    if (!key) setOpen(false)
    seen.current = key
  }, [key])

  if (!key) return null
  const report = fixes.problem.report
  const title = heavy > 0 && over > 0 ? 'Too heavy and over budget' : heavy > 0 ? 'Too heavy for the rocket' : 'Over budget'

  const apply = (o) => {
    update((next) => {
      o.apply(next)
      return `Changed: ${o.label}`
    })
    if (o.solved) setOpen(false)
  }

  return (
    <>
      <button type="button" className={styles.pill} onClick={() => setOpen(true)}>
        <span aria-hidden="true">⚠</span> {title} · Quick fix
      </button>
      {open ? (
        <Dialog title={title} onClose={() => setOpen(false)}>
          {heavy > 0 ? (
            <p className={styles.line}>
              Your spacecraft is <b>{model.fmt(heavy)} kg</b> too heavy for the {report.rocket ? report.rocket.title : 'rocket'}.
            </p>
          ) : null}
          {over > 0 ? (
            <p className={styles.line}>
              The mission costs <b>${model.fmt(over)}M</b> more than the budget.
            </p>
          ) : null}
          <p className={styles.note}>Pick a fix: it changes your design right here, no need to go back.</p>
          {fixes.options.length ? (
            <ul className={styles.list}>
              {fixes.options.map((o) => (
                <li key={o.id}>
                  <button type="button" className={styles.option} onClick={() => apply(o)}>
                    <span className={styles.label}>{o.steps ? `Make ${o.steps} changes at once` : o.label}</span>
                    {o.steps ? <span className={styles.meta}>{o.label}</span> : null}
                    <span className={styles.meta}>
                      {signed(o.massChange, ' kg')} · {signed(o.costChange, 'M', '$')}
                      {o.id.startsWith('margin:') ? ' · less spare fuel for the landing' : ''}
                    </span>
                    <span className={o.solved ? styles.solved : styles.helps}>{o.solved ? 'Fixes it' : 'Helps'}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.note}>No single change fixes this here. Apply what helps, then try again.</p>
          )}
          <div className={styles.foot}>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </Dialog>
      ) : null}
    </>
  )
}
