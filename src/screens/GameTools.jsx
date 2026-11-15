import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMusic } from '../audio/useMusic.jsx'
import { Dialog } from '../components/ui/Dialog.jsx'
import { continuePath, useGame } from '../engine/useGame.jsx'
import { HowTo, SourceList } from './dialogs.jsx'
import styles from './GameTools.module.css'

const TITLES = {
  settings: 'Settings',
  howto: 'How to play',
  sources: 'Sources',
}

export function GameTools({ cover = false }) {
  const navigate = useNavigate()
  const { state, data } = useGame()
  const music = useMusic()
  const [open, setOpen] = useState(null)

  const leave = (path) => {
    setOpen(null)
    navigate(path)
  }

  return (
    <div className={`${styles.tools} ${cover ? styles.cover : ''}`}>
      <button
        type="button"
        className={`${styles.icon} ${music.on ? styles.iconOn : ''}`}
        data-music="true"
        aria-pressed={music.on}
        aria-label={music.on ? 'Music on' : 'Music off'}
        onClick={music.toggle}
      >
        <SpeakerIcon muted={!music.on} />
      </button>
      <button type="button" className={styles.icon} aria-label="Settings" onClick={() => setOpen('settings')}>
        <GearIcon />
      </button>
      {open ? (
        <Dialog title={TITLES[open]} onClose={() => setOpen(null)}>
          {open === 'settings' ? (
            <>
              <p className={styles.kicker}>Difficulty</p>
              <DifficultyPicker />
              <div className={styles.links}>
                <button type="button" className={styles.link} onClick={() => setOpen('howto')}>How to play</button>
                <button type="button" className={styles.link} onClick={() => setOpen('sources')}>Sources</button>
              </div>
              <p className={styles.kicker}>Your mission saves automatically in this browser.</p>
              {cover && state.phase0Done ? (
                <button type="button" className={`${styles.wide} ${styles.go}`} onClick={() => leave(continuePath(state))}>
                  Continue mission
                </button>
              ) : null}
              {cover ? null : (
                <button type="button" className={styles.wide} onClick={() => leave('/inicio')}>
                  Back to start
                </button>
              )}
            </>
          ) : null}
          {open === 'howto' ? (
            <div className={styles.copy}>
              <button type="button" className={styles.back} onClick={() => setOpen('settings')}>Back</button>
              <HowTo />
            </div>
          ) : null}
          {open === 'sources' ? (
            <div className={styles.copy}>
              <button type="button" className={styles.back} onClick={() => setOpen('settings')}>Back</button>
              <SourceList sources={Object.values(data.SOURCES)} />
            </div>
          ) : null}
        </Dialog>
      ) : null}
    </div>
  )
}

export function DifficultyPicker() {
  const { state, data, setDifficulty } = useGame()
  return (
    <div className={styles.stack} role="group" aria-label="Difficulty">
      {data.DIFFICULTIES.map((item) => (
        <button
          key={item.id}
          type="button"
          className={styles.diff}
          aria-pressed={state.difficulty === item.id}
          onClick={() => setDifficulty(item.id)}
        >
          <strong>{item.title}</strong>
          <span>{item.blurb}</span>
        </button>
      ))}
    </div>
  )
}

function SpeakerIcon({ muted }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 9.5h3.2L11.5 6v12l-3.8-3.5H4.5v-5z" />
      {muted ? <path d="M15.5 10l4 4M19.5 10l-4 4" /> : (
        <>
          <path d="M15.2 9.2a3.6 3.6 0 0 1 0 5.6" />
          <path d="M17.4 7a6.4 6.4 0 0 1 0 10" />
        </>
      )}
    </svg>
  )
}

function GearIcon() {
  return (
    <svg className={styles.gear} viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7 7 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.59.22-1.14.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.74 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.49.4 1.04.73 1.63.94l.36 2.54c.05.24.25.42.49.42h3.84c.24 0 .44-.18.5-.42l.36-2.54c.59-.21 1.14-.54 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z" />
    </svg>
  )
}
