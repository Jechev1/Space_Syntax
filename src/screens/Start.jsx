import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage } from '../components/stage/Stage.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { OptionRow } from '../components/ui/OptionRow.jsx'
import { continuePath, useGame } from '../engine/useGame.jsx'
import { HowTo, SourceList } from './dialogs.jsx'
import shell from './shell.module.css'

export function Start() {
  const navigate = useNavigate()
  const { state, data, setDifficulty, startIntro } = useGame()
  const [modal, setModal] = useState(null)
  const name = data.CHARACTER.name

  useEffect(() => {
    document.title = 'Space Syntax — Is the Moon made of cheese?'
  }, [])

  return (
    <Stage>
      <div className={shell.screen}>
        <div className={shell.scroll}>
          <GlassPanel eyebrow="NASA Space Apps 2026 · Space Mission Design" title="Is the Moon made of cheese?">
            <p className={shell.lead}>{name} is sure it is. Design a real Moon mission, with NASA data and real math, and find out.</p>
            <p className={shell.kicker}>Difficulty</p>
            {data.DIFFICULTIES.map((item, index) => (
              <OptionRow
                key={item.id}
                number={index + 1}
                text={item.title}
                detail={item.blurb}
                selected={state.difficulty === item.id}
                onSelect={() => setDifficulty(item.id)}
              />
            ))}
            <div className={shell.actions}>
              <Button variant="primary" onClick={() => { startIntro(); navigate('/intro') }}>Start mission 🚀</Button>
              {state.phase0Done ? (
                <Button variant="secondary" onClick={() => navigate(continuePath(state))}>Continue</Button>
              ) : null}
              <Button variant="ghost" onClick={() => setModal('howto')}>How to play</Button>
              <Button variant="ghost" onClick={() => setModal('sources')}>Sources</Button>
            </div>
          </GlassPanel>
        </div>
        <Modal open={modal === 'howto'} variant="info" title="How to play" onClose={() => setModal(null)}>
          <HowTo />
        </Modal>
        <Modal open={modal === 'sources'} variant="info" title="Sources" onClose={() => setModal(null)}>
          <SourceList sources={Object.values(data.SOURCES)} />
        </Modal>
      </div>
    </Stage>
  )
}
