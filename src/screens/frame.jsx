import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage } from '../components/stage/Stage.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { continuePath, useGame } from '../engine/useGame.jsx'
import { HowTo, SourceList } from './dialogs.jsx'
import { PlayProvider } from './playContext.jsx'
import shell from './shell.module.css'

const NOTICE_MS = 8000

/** Keeps the player on screens they can reach. Opening a locked one sends them back and says why. */
export function usePhaseGuard(path) {
  const { state, model, setNotice } = useGame()
  const navigate = useNavigate()
  const target = screenTarget(path, state, model)
  // True only on the first render: the player opened this address. Later redirects come from an edit,
  // and those explain themselves with their own notice.
  const opened = useRef(true)
  useEffect(() => {
    if (target !== path) {
      if (opened.current) setNotice(lockedNote(path, state))
      navigate(target, { replace: true })
    }
    opened.current = false
  }, [target, path, navigate]) // eslint-disable-line react-hooks/exhaustive-deps
  return target === path
}

function lockedNote(path, state) {
  if (state.launched && LOCKED_AFTER_LAUNCH.includes(path)) return 'Your rocket already launched, so the design is locked.'
  return 'That part of the trip is still locked. Finish this step first.'
}

/** After liftoff the design phases cannot change any more. */
const LOCKED_AFTER_LAUNCH = ['/f0', '/f1a', '/f1b', '/f1done', '/f2', '/f3a', '/f4']

function screenTarget(path, state, model) {
  if ((path === '/f1a' || path === '/f1b') && !state.phase0Done) return '/f0'
  if (path === '/f1b' && (model.missingSubsystems(state).length || !model.payloadAnswers(state))) return '/f1a'
  if (path === '/f1done' && !state.phase1Done) return state.phase0Done ? '/f1a' : '/f0'
  if (path === '/f2' && !state.phase1Done) return state.phase0Done ? '/f1a' : '/f0'
  if (path === '/f3a' && !state.phase2Done) return state.phase1Done ? '/f2' : '/f1a'
  if (path === '/f4' && !state.phase3Done) return state.phase2Done ? '/f3a' : '/f2'
  if (path === '/f3b' && !state.phase4Done && !state.launched) return state.phase3Done ? '/f4' : '/f3a'
  if (state.launched && LOCKED_AFTER_LAUNCH.includes(path)) return '/f3b'
  if (path === '/f8' && !missionComplete(state, model)) return continuePath(state)
  return path
}

/** Mission fully flown home: launched, surface work finished and the return trip resolved as a success. */
function missionComplete(state, model) {
  if (!state.launched || !state.surface || !state.surface.finished) return false
  const sim = model.returnSim(state)
  return Boolean(sim && sim.applicable && sim.outcome === 'success')
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

  // Notices (a locked page, a plan that changed) fade after a few seconds or on Dismiss.
  useEffect(() => {
    if (!game.notice) return undefined
    const id = setTimeout(() => game.setNotice(''), NOTICE_MS)
    return () => clearTimeout(id)
  }, [game.notice]) // eslint-disable-line react-hooks/exhaustive-deps

  const play = { openSource, setPreview: setPreviewKey, setModal, setNotice: game.setNotice }
  void previewKey

  return (
    <PlayProvider value={play}>
      <Stage background={background} framed character={character} objects={objects}>
        {children}
        <div className={shell.toast} role="status">
          {game.notice ? (
            <>
              <span>{game.notice}</span>
              <button type="button" className={shell.toastClose} onClick={() => game.setNotice('')}>Dismiss</button>
            </>
          ) : null}
        </div>
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
