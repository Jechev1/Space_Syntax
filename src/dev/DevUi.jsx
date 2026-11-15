import { useEffect, useState } from 'react'
import { Stage } from '../components/stage/Stage.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Chip } from '../components/ui/Chip.jsx'
import { FooterBar } from '../components/ui/FooterBar.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { Hud } from '../components/ui/Hud.jsx'
import { HudMeter } from '../components/ui/HudMeter.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import styles from './DevUi.module.css'

const CHOICES = [
  { number: '1', text: 'Is the Moon made of cheese?' },
  { number: '2', text: 'Is there water at the south pole?' },
]

export function DevUi() {
  const [picked, setPicked] = useState('1')
  const [modal, setModal] = useState(null)
  const [ctaLocked, setCtaLocked] = useState(false)
  const [note, setNote] = useState('Sample only. This screen is not wired to the game.')

  useEffect(() => {
    document.title = 'How far is up? · UI kit'
  }, [])

  return (
    <Stage objects={<div className={styles.moon} aria-hidden="true" />} character={<div className={styles.cat} aria-hidden="true" />}>
      <div className={styles.screen}>
        <h1 className={styles.srOnly}>Space Syntax UI kit</h1>
        <Hud>
          <HudMeter label="Mass" value={420} max={2000} />
          <HudMeter label="Cost" value={80} max={150} />
          <HudMeter label="Power" value={5} max={5} />
        </Hud>
        <div className={styles.scroll}>
          <GlassPanel eyebrow="Dev / UI" title="Shared components">
            <p className={styles.note} role="status">{note}</p>
          </GlassPanel>

          <GlassPanel eyebrow="Button" title="Variants">
            <div className={styles.wrap}>
              <Button variant="primary" onClick={() => setNote('Primary pressed.')}>Primary</Button>
              <Button variant="secondary" onClick={() => setNote('Secondary pressed.')}>Secondary</Button>
              <Button variant="ghost" onClick={() => setNote('Ghost pressed.')}>Ghost</Button>
              <Button variant="danger" onClick={() => setNote('Danger pressed.')}>Danger</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="primary" disabledReason="Pick a goal first">Primary locked</Button>
              <Button variant="secondary" disabledReason="Crew only">Secondary locked</Button>
              <Button variant="ghost" disabledReason="Phase not open">Ghost locked</Button>
              <Button variant="danger" disabledReason="Nothing to reset">Danger locked</Button>
              <Button variant="ghost" onClick={() => setCtaLocked((value) => !value)}>
                {ctaLocked ? 'Unlock CTA' : 'Lock CTA'}
              </Button>
            </div>
          </GlassPanel>

          <GlassPanel eyebrow="OptionRow" title="States">
            {CHOICES.map((choice) => (
              <OptionRow
                key={choice.number}
                number={choice.number}
                text={choice.text}
                selected={picked === choice.number}
                onSelect={() => setPicked(choice.number)}
                chips={choice.number === '1' ? <Chip type="game">Hypothesis</Chip> : <Chip type="nasa">LCROSS</Chip>}
              />
            ))}
            <OptionRow
              number="3"
              text="Hover preview"
              preview="hover"
              chips={<Chip type="cost">$40M</Chip>}
            />
            <OptionRow
              number="4"
              text="Crewed return"
              locked
              lockedReason="Robotic missions skip the crew"
              chips={<Chip type="evidence">Sample</Chip>}
            />
          </GlassPanel>

          <GlassPanel eyebrow="Chip" title="Types">
            <div className={styles.wrap}>
              <Chip type="game">Tuned</Chip>
              <Chip type="nasa">NSSDC</Chip>
              <Chip type="cost">$120M</Chip>
              <Chip type="evidence">2/3</Chip>
            </div>
          </GlassPanel>

          <GlassPanel eyebrow="Modal" title="Info, warning, error">
            <div className={styles.wrap}>
              <Button variant="secondary" onClick={() => setModal('info')}>Open info</Button>
              <Button variant="secondary" onClick={() => setModal('warn')}>Open warning</Button>
              <Button variant="danger" onClick={() => setModal('danger')}>Open error</Button>
            </div>
          </GlassPanel>
        </div>
        <FooterBar
          onBack={() => setNote('Back stays on this sample.')}
          onHelp={() => setModal('info')}
          ctaLabel="Continue"
          onCta={() => setNote('Continue does not advance a phase.')}
          ctaDisabled={ctaLocked}
          ctaDisabledReason={ctaLocked ? 'Finish the sample first' : ''}
        />
        <Modal
          open={modal === 'info'}
          variant="info"
          title="Help is a sample"
          onClose={() => setModal(null)}
        >
          This dialog does not read or change the mission.
        </Modal>
        <Modal
          open={modal === 'warn'}
          variant="warn"
          title="Check the margin"
          onClose={() => setModal(null)}
        >
          Warning is a visual state. The bar below it is the word Warning, not color alone.
        </Modal>
        <Modal
          open={modal === 'danger'}
          variant="danger"
          title="This sample cannot launch"
          onClose={() => setModal(null)}
        >
          Error is a visual state. Nothing in the game engine was called.
        </Modal>
      </div>
    </Stage>
  )
}
