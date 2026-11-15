import styles from './Chip.module.css'

const LABELS = {
  game: 'Game',
  nasa: 'NASA',
  cost: 'Cost',
  evidence: 'Evidence',
}

export function Chip({ type = 'game', tone = '', label, children }) {
  const name = Object.prototype.hasOwnProperty.call(LABELS, type) ? type : 'game'
  const toneName = tone === 'warn' || tone === 'danger' ? tone : ''
  return (
    <span className={`${styles.chip} ${styles[name]} ${toneName ? styles[toneName] : ''}`}>
      <span className={styles.kind}>{label || LABELS[name]}</span>
      {children ? <span>{children}</span> : null}
    </span>
  )
}
