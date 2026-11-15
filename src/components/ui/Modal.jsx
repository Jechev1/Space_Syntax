import { useEffect, useId, useRef } from 'react'
import { Button } from './Button.jsx'
import styles from './Modal.module.css'

const KICKERS = {
  info: 'Info',
  warn: 'Warning',
  danger: 'Error',
}

/** hideClose: the window has its own buttons (a choice or a confirm), so no extra Close button. */
export function Modal({ open = false, variant = 'info', title, children, onClose, hideClose = false }) {
  const titleId = useId()
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const name = Object.prototype.hasOwnProperty.call(KICKERS, variant) ? variant : 'info'

  useEffect(() => {
    if (!open) return undefined
    const root = ref.current
    const previous = document.activeElement
    const focusable = () => [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    const items = focusable()
    if (items[0]) items[0].focus()

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const nodes = focusable()
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className={styles.back} onMouseDown={() => onCloseRef.current?.()}>
      <div
        ref={ref}
        className={`${styles.dialog} ${styles[name]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className={styles.kicker}>{KICKERS[name]}</p>
        <h2 className={styles.title} id={titleId}>{title}</h2>
        <div className={styles.body}>{children}</div>
        {hideClose ? null : (
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => onCloseRef.current?.()}>Close</Button>
          </div>
        )}
      </div>
    </div>
  )
}
