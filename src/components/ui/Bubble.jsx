import { Button } from './Button.jsx'
import styles from './Bubble.module.css'

export function Bubble({ name, children, onClose, tone = 'glass' }) {
  if (tone === 'speech') {
    return <p className={styles.speech}>{children}</p>
  }

  return (
    <div className={styles.bubble}>
      <p className={styles.text}><b>{name}:</b> {children}</p>
      <Button variant="ghost" onClick={onClose}>Close</Button>
    </div>
  )
}
