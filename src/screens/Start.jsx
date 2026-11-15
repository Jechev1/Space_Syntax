import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from '../components/ui/Dialog.jsx'
import { useGame } from '../engine/useGame.jsx'
import { DifficultyPicker, GameTools } from './GameTools.jsx'
import styles from './Start.module.css'

const NAMES = ['Laura Angel', 'Jorge Flores', 'Kevin Luna', 'Violeta Jacobo']

const TITLES = {
  credits: 'Credits',
  difficulty: 'Difficulty',
}

export function Start() {
  const navigate = useNavigate()
  const { state, data } = useGame()
  const [open, setOpen] = useState(null)
  const level = data.DIFFICULTIES.find((item) => item.id === state.difficulty)

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
            <button type="button" className={`${styles.action} ${styles.primary}`} onClick={() => navigate('/f0')}>
              Start mission
            </button>
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
      {open ? (
        <Dialog title={TITLES[open]} onClose={() => setOpen(null)}>
          {open === 'credits' ? (
            <>
              <p className={styles.love}>Made with love in San Salvador, El Salvador 🇸🇻</p>
              <p className={styles.team}>Team Space Syntax</p>
              <ul className={styles.names}>
                {NAMES.map((name) => <li key={name}>{name}</li>)}
              </ul>
              <p className={styles.challenge}>NASA Space Apps Challenge 2026 · Space Mission Design Game</p>
            </>
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
