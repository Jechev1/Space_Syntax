import { LockIcon } from './LockIcon.jsx'
import styles from './HudMeter.module.css'

const STATUS_WORD = { warn: 'Near limit', over: 'Over limit' }

export function HudMeter({
  label,
  value = 0,
  max = 0,
  text,
  width,
  ghost = null,
  delta = '',
  status = '',
  note = '',
  locked = false,
  lockedReason = '',
  onOpen,
}) {
  const safeMax = Number(max) > 0 ? Number(max) : 0
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0
  const computed = safeMax > 0 ? Math.min(safeValue / safeMax, 1) * 100 : 0
  const bar = Number.isFinite(Number(width)) ? Number(width) : computed
  const shown = text != null ? text : `${safeValue} / ${safeMax}`
  const clickable = Boolean(onOpen) && !locked
  const Tag = clickable ? 'button' : 'div'
  const tone = status === 'warn' || status === 'over' ? status : ''

  return (
    <Tag
      type={clickable ? 'button' : undefined}
      className={`${styles.meter} ${locked ? styles.locked : ''} ${tone ? styles[tone] : ''}`}
      onClick={clickable ? onOpen : undefined}
    >
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {locked ? (
          <span className={styles.reason}><LockIcon /> {lockedReason}</span>
        ) : (
          <span className={styles.value}>{shown}</span>
        )}
      </div>
      {delta ? <span className={styles.delta}>{delta}</span> : null}
      {tone ? <span className={styles.status}>{STATUS_WORD[tone]}</span> : null}
      {note ? <span className={styles.note}>{note}</span> : null}
      <div
        className={styles.track}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={locked ? 0 : safeValue}
        aria-valuetext={locked ? 'Locked' : undefined}
      >
        <span className={styles.bar} style={{ width: locked ? '0%' : `${bar}%` }} />
        {ghost ? <span className={styles.ghost} style={{ left: `${ghost.left}%`, width: `${ghost.width}%` }} /> : null}
      </div>
    </Tag>
  )
}
