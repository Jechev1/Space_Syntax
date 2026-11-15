import { useId } from 'react'
import { LockIcon } from './LockIcon.jsx'
import styles from './Button.module.css'

const VARIANTS = ['primary', 'secondary', 'ghost', 'danger', 'outline']

export function Button({
  variant = 'primary',
  disabled = false,
  disabledReason = '',
  type = 'button',
  children,
  onClick,
  ...rest
}) {
  const reasonId = useId()
  const name = VARIANTS.includes(variant) ? variant : 'primary'
  const locked = disabled || Boolean(disabledReason)

  return (
    <button
      {...rest}
      type={type}
      className={`${styles.btn} ${styles[name]}`}
      aria-disabled={locked || undefined}
      aria-describedby={disabledReason ? reasonId : undefined}
      onClick={(event) => {
        if (locked) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
    >
      <span className={styles.face}>{children}</span>
      {disabledReason ? (
        <span className={styles.reason} id={reasonId}>
          <LockIcon />
          {disabledReason}
        </span>
      ) : null}
    </button>
  )
}
