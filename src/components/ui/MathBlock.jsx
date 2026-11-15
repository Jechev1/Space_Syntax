import styles from './MathBlock.module.css'

export function MathBlock({ math, children }) {
  if (!math) return null
  return (
    <div className={styles.block}>
      <p className={styles.title}>{math.title}</p>
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
