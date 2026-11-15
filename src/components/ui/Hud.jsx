import styles from './Hud.module.css'

export function Hud({ children }) {
  return (
    <div className={styles.hud} role="region" aria-label="Mission status">
      {children}
    </div>
  )
}
