import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage } from '../components/stage/Stage.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { useGame } from '../engine/useGame.jsx'
import shell from './shell.module.css'

const INTRO = [
  { text: "I've always believed the Moon is made of cheese." },
  { text: "Nobody believes me. So I'm going to test it with a real mission, starting right here on Earth." },
  { text: "First we plan and build at the launch site. Every choice costs mass, money or power. Scientists call that a trade-off. Let's go!" },
]

export function Intro() {
  const navigate = useNavigate()
  const { state, data, setIntroStep } = useGame()
  const step = Math.min(state.introStep, INTRO.length - 1)
  const last = step >= INTRO.length - 1

  useEffect(() => {
    document.title = 'Space Syntax — Intro'
  }, [])

  return (
    <Stage>
      <div className={shell.screen}>
        <div className={shell.scroll}>
          <GlassPanel eyebrow={data.CHARACTER.name} title="Intro">
            <p className={shell.lead}>"{INTRO[step].text}"</p>
            <p className={shell.note}>Step {step + 1} of {INTRO.length}</p>
            <div className={shell.dots} aria-hidden="true">
              {INTRO.map((slide, index) => (
                <span key={slide.text} className={`${shell.dot} ${index === step ? shell.dotOn : ''}`} />
              ))}
            </div>
            <div className={shell.actions}>
              <Button
                variant="primary"
                onClick={() => {
                  if (last) navigate('/f0')
                  else setIntroStep(step + 1)
                }}
              >
                {last ? 'Define the mission →' : 'Next →'}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/f0')}>Skip intro</Button>
            </div>
          </GlassPanel>
        </div>
      </div>
    </Stage>
  )
}
