import styles from './GlassPanel.module.css'

export function GlassPanel({ eyebrow, title, tone = '', children }) {
  const toneName = tone === 'warn' || tone === 'danger' ? tone : ''
  return (
    <section className={`${styles.panel} ${toneName ? styles[toneName] : ''}`}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
