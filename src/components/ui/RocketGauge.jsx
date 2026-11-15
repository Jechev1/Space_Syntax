import styles from './RocketGauge.module.css'

export function RocketGauge({ fill = 0, fits = true }) {
  const ratio = Number.isFinite(Number(fill)) ? Math.max(0, Number(fill)) : 0
  const height = Math.min(ratio, 1) * 100
  const pct = Math.round(ratio * 100)

  return (
    <div className={styles.gauge}>
      <div className={styles.tank} aria-hidden="true">
        <span className={`${styles.fill} ${fits ? '' : styles.over}`} style={{ height: `${height}%` }} />
      </div>
      <p className={styles.caption}>{fits ? `${pct}% full` : `Too full, ${pct}%`}</p>
    </div>
  )
}
