import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './Dialog.module.css'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function Dialog({ title, onClose, children }) {
  const titleId = useId()
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const panel = ref.current
    const previous = document.activeElement
    const app = document.getElementById('root')
    if (app) app.inert = true

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const nodes = [...panel.querySelectorAll(FOCUSABLE)]
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (app) app.inert = false
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [])

  useEffect(() => {
    ref.current.focus()
  }, [title])

  return createPortal(
    <div className={styles.backdrop} onMouseDown={() => onCloseRef.current?.()}>
      <div
        ref={ref}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.close} aria-label="Close" onClick={() => onCloseRef.current?.()}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7l10 10M17 7 7 17" />
          </svg>
        </button>
        <div className={styles.sheet}>
          <h2 className={styles.title} id={titleId}>{title}</h2>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
