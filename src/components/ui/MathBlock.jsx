import styles from './MathBlock.module.css'

export function MathBlock({ math, children, hideTitle = false }) {
  if (!math) return null
  return (
    <div className={styles.block}>
      {!hideTitle && math.title ? <p className={styles.title}>{math.title}</p> : null}
      {math.steps.map((step) => (
        <p className={styles.step} key={step.eq}>
          <span>{step.eq}</span>
          <span>{step.num}</span>
        </p>
      ))}
      {math.check ? <p className={styles.check}>{math.check}</p> : null}
      {children}
    </div>
  )
}
