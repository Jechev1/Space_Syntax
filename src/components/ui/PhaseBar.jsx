import { LockIcon } from './LockIcon.jsx'
import styles from './PhaseBar.module.css'

export function PhaseBar({ items, onSelect }) {
  return (
    <nav className={styles.bar} aria-label="Mission phases">
      {items.map((item) => {
        const locked = item.status === 'locked'
        const current = item.status === 'current'
        return (
          <button
            key={item.id}
            type="button"
            className={`${styles.phase} ${styles[item.status] || ''}`}
            aria-current={current ? 'step' : undefined}
            aria-disabled={locked || current || undefined}
            onClick={() => {
              if (locked || current) return
              onSelect?.(item.id)
            }}
          >
            <span className={styles.n}>{item.status === 'done' ? '✓' : item.index}</span>
            <span>{item.label}</span>
            {current ? <span className={styles.flag}>Now</span> : null}
            {item.status === 'done' ? <span className={styles.flag}>Done</span> : null}
            {locked ? (
              <span className={styles.reason}><LockIcon /> {item.reason}</span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
