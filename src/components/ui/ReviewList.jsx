import styles from './ReviewList.module.css'

export function ReviewList({ items }) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.label} className={styles.item}>
          <span className={styles.copy}>
            <span className={styles.name}>{item.label}</span>
            <span className={styles.detail}>{item.detail}</span>
          </span>
          <span className={item.ok ? styles.go : styles.nogo}>{item.ok ? 'GO' : 'NO GO'}</span>
        </li>
      ))}
    </ul>
  )
}
