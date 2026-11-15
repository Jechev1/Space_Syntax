import styles from './StatLine.module.css'

export function StatLine({ items }) {
  return (
    <div className={styles.line}>
      {items.map((item) => (
        <div key={item.label} className={styles.item}>
          <p className={`${styles.value} ${item.tone === 'accent' ? styles.accent : ''}`}>{item.value}</p>
          <p className={styles.label}>{item.label}</p>
        </div>
      ))}
    </div>
  )
}
