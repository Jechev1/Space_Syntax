import { useId } from 'react'
import { LockIcon } from './LockIcon.jsx'
import styles from './OptionRow.module.css'

export function OptionRow({
  number,
  text,
  detail = '',
  chips = null,
  selected = false,
  locked = false,
  lockedReason = '',
  preview = '',
  variant = 'card',
  onSelect,
  onLocked,
}) {
  const reasonId = useId()
  const hoverPreview = preview === 'hover' && !selected && !locked
  const line = variant === 'line'

  return (
    <button
      type="button"
      className={`${styles.row} ${line ? styles.line : ''} ${selected ? styles.selected : ''} ${hoverPreview ? styles.previewHover : ''}`}
      aria-pressed={selected}
      aria-disabled={locked || undefined}
      aria-describedby={lockedReason ? reasonId : undefined}
      onClick={(event) => {
        if (locked) {
          event.preventDefault()
          onLocked?.(event)
          return
        }
        onSelect?.(event)
      }}
    >
      <span className={styles.num}>{number}</span>
      <span className={styles.body}>
        <span className={styles.text}>{text}</span>
        {detail ? <span className={styles.detail}>{detail}</span> : null}
        {chips ? <span className={styles.chips}>{chips}</span> : null}
      </span>
      {selected && !line ? <span className={styles.state}>Selected</span> : null}
      {hoverPreview ? <span className={styles.state}>Hover</span> : null}
      {locked ? (
        <span className={styles.reason} id={reasonId}>
          <LockIcon />
          {lockedReason}
        </span>
      ) : null}
    </button>
  )
}
