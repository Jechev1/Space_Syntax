import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from '../components/ui/Dialog.jsx'
import { continuePath, missionInProgress, useGame } from '../engine/useGame.jsx'
import { DifficultyPicker, GameTools, ResetConfirm } from './GameTools.jsx'
import { Credits } from './dialogs.jsx'
import styles from './Start.module.css'

const TITLES = {
  credits: 'Credits',
  difficulty: 'Difficulty',
}

export function Start() {
  const navigate = useNavigate()
  const { state, data } = useGame()
  const [open, setOpen] = useState(null)
  const level = data.DIFFICULTIES.find((item) => item.id === state.difficulty)
  const playing = missionInProgress(state)

  useEffect(() => {
    document.title = 'How far is up?'
  }, [])

  return (
    <div className={styles.viewport}>
      <div className={styles.frame}>
        <img className={styles.bg} src="/bg/inicio.png" alt="" />
        <GameTools cover />
        <main className={styles.hero}>
          <h1 className={styles.title}>How far is up?</h1>
          <p className={styles.subtitle}>A Space Mission Design Game</p>
          <div className={styles.menu}>
            {playing ? (
              <button type="button" className={`${styles.action} ${styles.primary}`} onClick={() => navigate(continuePath(state))}>
                Continue mission
              </button>
            ) : (
              <button type="button" className={`${styles.action} ${styles.primary}`} onClick={() => navigate('/f0')}>
                Start mission
              </button>
            )}
            {playing ? (
              <button type="button" className={`${styles.action} ${styles.quiet}`} onClick={() => setOpen('reset')}>
                New game
              </button>
            ) : null}
            <button type="button" className={`${styles.action} ${styles.quiet}`} onClick={() => setOpen('difficulty')}>
              Difficulty{level ? `: ${level.title}` : ''}
            </button>
            <button type="button" className={`${styles.action} ${styles.quiet}`} onClick={() => setOpen('credits')}>
              Credits
            </button>
          </div>
        </main>
        <footer className={styles.footer}>
          <p>NASA Space Apps 2026 · Space Syntax</p>
          <p>v1.0</p>
        </footer>
      </div>
      {open === 'reset' ? <ResetConfirm onClose={() => setOpen(null)} /> : null}
      {open && open !== 'reset' ? (
        <Dialog title={TITLES[open]} onClose={() => setOpen(null)}>
          {open === 'credits' ? (
            <Credits />
          ) : (
            <>
              <p className={styles.challenge}>Sets your budget and how forgiving the mission is. You can change it later from the gear.</p>
              <DifficultyPicker />
            </>
          )}
        </Dialog>
      ) : null}
    </div>
  )
}
