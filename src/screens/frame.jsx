import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage } from '../components/stage/Stage.jsx'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { FooterBar } from '../components/ui/FooterBar.jsx'
import { Hud } from '../components/ui/Hud.jsx'
import { HudMeter } from '../components/ui/HudMeter.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { PhaseBar } from '../components/ui/PhaseBar.jsx'
import { hudMeters, phaseItems, useGame } from '../engine/useGame.jsx'
import { EquipmentList, RocketMath } from './bits.jsx'
import { HowTo, SourceList } from './dialogs.jsx'
import { PlayProvider, usePlay } from './playContext.jsx'
import shell from './shell.module.css'

export function usePhaseGuard(path) {
  const { state, model } = useGame()
  const navigate = useNavigate()
  const target = screenTarget(path, state, model)
  useEffect(() => {
    if (target !== path) navigate(target, { replace: true })
  }, [target, path, navigate])
  return target === path
}

function screenTarget(path, state, model) {
  if ((path === '/f1a' || path === '/f1b') && !state.phase0Done) return '/f0'
  if (path === '/f1b' && (model.missingSubsystems(state).length || !model.payloadAnswers(state))) return '/f1a'
  if (path === '/f1done' && !state.phase1Done) return state.phase0Done ? '/f1a' : '/f0'
  return path
}

const METER_TITLES = {
  mass: '⚖️ Launch mass',
  cost: '💰 Budget',
  power: '⚡ Power',
}

export function MissionFrame({ phase, title, footer = null, children }) {
  const navigate = useNavigate()
  const game = useGame()
  const { state, model, notice, setNotice, data } = game
  const [modal, setModal] = useState(null)
  const [meterId, setMeterId] = useState('mass')
  const [source, setSource] = useState(null)
  const [previewKey, setPreviewKey] = useState(null)
  const preview = previewKey ? model.previewWith(state, previewKey.sub, previewKey.id) : null
  const meters = hudMeters(state, preview)
  const report = model.evaluate(state)

  useEffect(() => {
    document.title = title
  }, [title])

  const openSource = (key) => {
    if (!key || key === 'game') {
      setSource(null)
      setModal('game')
      return
    }
    setSource(data.SOURCES[key] || null)
    setModal('source')
  }

  const play = { openSource, setPreview: setPreviewKey, setModal, setNotice }

  return (
    <PlayProvider value={play}>
      <Stage>
        <div className={shell.screen}>
          <Hud>
            {meters.map((meter) => (
              <HudMeter
                key={meter.id}
                label={meter.label}
                value={meter.value}
                max={meter.max}
                width={meter.width}
                text={meter.text}
                note={meter.note}
                delta={meter.delta}
                ghost={meter.ghost}
                status={meter.status}
                locked={meter.locked}
                lockedReason={meter.lockedReason}
                onOpen={meter.clickable ? () => { setMeterId(meter.id); setModal('meter') } : undefined}
              />
            ))}
            <Button variant="secondary" onClick={() => setModal('menu')}>Menu</Button>
          </Hud>
          <PhaseBar
            items={phaseItems(state, phase)}
            onSelect={(id) => {
              if (id === '0') navigate('/f0')
              else if (id === '1') navigate('/f1a')
            }}
          />
          <div className={shell.scroll}>{children}</div>
          {notice ? <p className={shell.note} role="status">{notice}</p> : null}
          {footer}
          <Modal open={modal === 'howto'} variant="info" title="How to play" onClose={() => setModal(null)}><HowTo /></Modal>
          <Modal open={modal === 'sources'} variant="info" title="Sources" onClose={() => setModal(null)}>
            <SourceList sources={Object.values(data.SOURCES)} />
          </Modal>
          <Modal open={modal === 'game'} variant="info" title="Game value" onClose={() => setModal(null)}>
            This number is tuned for gameplay and scaled from real missions. It is not a measured fact. Numbers marked with a NASA chip come straight from NASA sources.
          </Modal>
          <Modal open={modal === 'source' && Boolean(source)} variant="info" title="Source" onClose={() => setModal(null)}>
            {source ? (
              <>
                <p><b>{source.title}</b></p>
                <p><a className={shell.link} href={source.url} target="_blank" rel="noopener noreferrer">{source.url}</a></p>
                <p className={shell.note}>Opened and checked by the Space Syntax team on Nov 14, 2026.</p>
              </>
            ) : null}
          </Modal>
          <Modal open={modal === 'menu'} variant="info" title="Menu" onClose={() => setModal(null)}>
            <div className={shell.actions}>
              <Button variant="secondary" onClick={() => navigate('/')}>Home</Button>
              <Button variant="secondary" onClick={() => setModal('sources')}>Sources</Button>
              <Button variant="secondary" onClick={() => setModal('howto')}>How to play</Button>
              <Button variant="danger" onClick={() => setModal('reset')}>Restart mission</Button>
            </div>
          </Modal>
          <Modal open={modal === 'reset'} variant="danger" title="Start a new mission?" onClose={() => setModal(null)}>
            <p>Your current design will be erased.</p>
            <Button variant="danger" onClick={() => { game.reset(); navigate('/') }}>Yes, start over</Button>
          </Modal>
          <Modal
            open={modal === 'meter'}
            variant="info"
            title={report ? METER_TITLES[meterId] : 'Pick a mission first'}
            onClose={() => setModal(null)}
          >
            {report ? <MeterAccount meterId={meterId} report={report} state={state} /> : <p>Finish Phase 0 to see your budget.</p>}
          </Modal>
        </div>
      </Stage>
    </PlayProvider>
  )
}

export function StageScene({ background = '', character, objects = null, title, children }) {
  const navigate = useNavigate()
  const game = useGame()
  const { data } = game
  const [modal, setModal] = useState(null)
  const [source, setSource] = useState(null)
  const [previewKey, setPreviewKey] = useState(null)

  useEffect(() => {
    document.title = title
  }, [title])

  const openSource = (key) => {
    if (!key || key === 'game') {
      setSource(null)
      setModal('game')
      return
    }
    setSource(data.SOURCES[key] || null)
    setModal('source')
  }

  const play = { openSource, setPreview: setPreviewKey, setModal, setNotice: game.setNotice }
  void previewKey

  return (
    <PlayProvider value={play}>
      <Stage background={background} framed character={character} objects={objects}>
        {children}
        <Modal open={modal === 'howto'} variant="info" title="How to play" onClose={() => setModal(null)}><HowTo /></Modal>
        <Modal open={modal === 'sources'} variant="info" title="Sources" onClose={() => setModal(null)}>
          <SourceList sources={Object.values(data.SOURCES)} />
        </Modal>
        <Modal open={modal === 'game'} variant="info" title="Game value" onClose={() => setModal(null)}>
          This number is tuned for gameplay and scaled from real missions. It is not a measured fact. Numbers marked with a NASA chip come straight from NASA sources.
        </Modal>
        <Modal open={modal === 'source' && Boolean(source)} variant="info" title="Source" onClose={() => setModal(null)}>
          {source ? (
            <>
              <p><b>{source.title}</b></p>
              <p><a className={shell.link} href={source.url} target="_blank" rel="noopener noreferrer">{source.url}</a></p>
              <p className={shell.note}>Opened and checked by the Space Syntax team on Nov 14, 2026.</p>
            </>
          ) : null}
        </Modal>
        <Modal open={modal === 'reset'} variant="danger" title="Start a new mission?" onClose={() => setModal(null)}>
          <p>Your current design will be erased.</p>
          <Button variant="danger" onClick={() => { game.reset(); navigate('/') }}>Yes, start over</Button>
        </Modal>
      </Stage>
    </PlayProvider>
  )
}

function MeterAccount({ meterId, report, state }) {
  const { model } = useGame()
  if (meterId === 'mass') {
    return (
      <>
        <p>Your rocket must send your spacecraft <b>and all the fuel it will burn later</b> toward the Moon.</p>
        <RocketMath state={state} />
      </>
    )
  }
  if (meterId === 'power') {
    return (
      <>
        <p>In sunlight your power system makes {model.fmt(report.powerGen)} W; your spacecraft needs {model.fmt(report.powerNeed)} W.</p>
        <EquipmentList report={report} />
      </>
    )
  }
  return <EquipmentList report={report} />
}

export function MissionBubble({ id, children }) {
  const { state, data, closeBubble } = useGame()
  if (state.closed[id]) return null
  return (
    <Bubble name={data.CHARACTER.name} onClose={() => closeBubble(id)}>
      {children}
    </Bubble>
  )
}

export function HelpFooter({ backLabel, onBack, ctaLabel, onCta, reason = '' }) {
  const { setModal } = usePlay()
  return (
    <FooterBar
      backLabel={backLabel}
      helpLabel="? Help"
      onBack={onBack}
      onHelp={() => setModal('howto')}
      ctaLabel={ctaLabel}
      ctaDisabled={Boolean(reason)}
      ctaDisabledReason={reason}
      onCta={onCta}
    />
  )
}
