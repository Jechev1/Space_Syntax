import { Button } from './Button.jsx'
import styles from './FooterBar.module.css'

export function FooterBar({
  onBack,
  onHelp,
  backLabel = 'Back',
  helpLabel = 'Help',
  ctaLabel = 'Continue',
  onCta,
  ctaDisabled = false,
  ctaDisabledReason = '',
}) {
  return (
    <footer className={`${styles.bar} ${onBack || onHelp ? '' : styles.only}`}>
      {onBack || onHelp ? (
        <div className={styles.side}>
          {onBack ? <Button variant="ghost" onClick={onBack}>{backLabel}</Button> : null}
          {onHelp ? <Button variant="ghost" onClick={onHelp}>{helpLabel}</Button> : null}
        </div>
      ) : null}
      <Button
        variant="primary"
        onClick={onCta}
        disabled={ctaDisabled}
        disabledReason={ctaDisabledReason}
      >
        {ctaLabel}
      </Button>
    </footer>
  )
}
