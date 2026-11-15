import { useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { Stage } from '../components/stage/Stage.jsx'
import { useGame } from '../engine/useGame.jsx'
import { usePhaseGuard } from './frame.jsx'
import styles from './F2.module.css'
import { FoodIcon, OxygenIcon, SceneHud, WaterIcon } from './scene.jsx'
import scene from './scene.module.css'

const BACKGROUND = '/bg/bg-preparacion.png'
const CHARACTER = '/char/nina-chaqueta-portapapeles.png'
const SUIT_NAMES = { light: 'Light', lunar: 'Lunar', heavy: 'Heavy' }

export function F2() {
  const ready = usePhaseGuard('/f2')
  if (!ready) return null
  return <F2Screen />
}

function F2Screen() {
  const navigate = useNavigate()
  const game = useGame()
  const { state, data, model, ensureCrew } = game
  const crewed = state.missionType === 'crewed'
  const life = crewed ? model.lifeSupport(state) : null

  useEffect(() => {
    document.title = 'Space Syntax — Phase 2: Crew'
  }, [])

  useEffect(() => {
    if (crewed && !state.crew) ensureCrew()
  }, [crewed, state.crew, ensureCrew])

  if (crewed && !life) return null

  return (
    <Stage background={BACKGROUND} character={CHARACTER}>
      <div className={scene.screen}>
        <SceneHud />
        <div className={scene.speech}>
          <Bubble tone="speech">{crewed ? 'Every day adds mass.' : 'No crew, no groceries!'}</Bubble>
        </div>
        <div className={scene.panel}>
          <GlassPanel>
            <button type="button" className={scene.kicker} onClick={() => navigate('/f1done')}>
              Phase 2 · Crew and life support
            </button>
            {crewed ? <CrewPlan game={game} life={life} /> : <NoCrew data={data} model={model} />}
          </GlassPanel>
        </div>
        <div className={scene.lock}>
          <ConfirmButton game={game} crewed={crewed} />
        </div>
      </div>
    </Stage>
  )
}

function CrewPlan({ game, life }) {
  const { state, data, model, setCrew } = game
  const L = data.LIFE
  const fmt = model.fmt
  const minDays = model.minDays() + ((state.events && state.events.extraDays) || 0)
  const reserveOn = life.reserve > 0
  const suitId = state.crew && state.crew.suit

  return (
    <>
      <div className={styles.row}>
        <span>Crew size</span>
        <span className={styles.stepper}>
          <button
            type="button"
            aria-label="Fewer astronauts"
            disabled={life.size <= L.crewMin}
            onClick={() => setCrew({ size: life.size - 1 })}
          >
            −
          </button>
          <b>{life.size}</b>
          <button
            type="button"
            aria-label="More astronauts"
            disabled={life.size >= L.crewMax}
            onClick={() => setCrew({ size: life.size + 1 })}
          >
            +
          </button>
        </span>
      </div>
      <p className={scene.note}>{life.landingCrew} land on the Moon, {life.orbitCrew} wait in orbit</p>

      <div className={styles.slider}>
        <div className={styles.row}>
          <label htmlFor="f2-days">Mission days</label>
          <b>{life.days}</b>
        </div>
        <input
          id="f2-days"
          type="range"
          min={minDays}
          max={L.daysMax}
          value={Math.max(life.days, minDays)}
          aria-describedby="f2-days-help"
          onChange={(event) => setCrew({ days: Number(event.target.value) })}
        />
        <p className={scene.note} id="f2-days-help">
          Artemis II: nearly 10 days · min {minDays}
        </p>
      </div>

      <button
        type="button"
        className={styles.toggle}
        aria-pressed={reserveOn}
        onClick={() => setCrew({ reserve: reserveOn ? 0 : 0.2 })}
      >
        <span>Safety reserve</span>
        <span>{reserveOn ? 'On (+20%)' : 'Off'} <i>(Game value)</i></span>
      </button>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={life.recycler}
        onClick={() => setCrew({ recycler: !life.recycler })}
      >
        <span>Water recycler</span>
        <span>{life.recycler ? 'On' : 'Off'} <i>({fmt(L.recycler.mass)} kg)</i></span>
      </button>

      <div className={styles.supplies}>
        <div className={styles.supply}><span><OxygenIcon />Oxygen</span><span>{fmt(life.o2)} kg</span></div>
        <div className={styles.supply}><span><FoodIcon />Dry food</span><span>{fmt(life.food)} kg</span></div>
        <div className={styles.supply}>
          <span><WaterIcon />Potable water</span>
          <span>{fmt(life.water)} kg{life.recycler ? ` (−${fmt(life.waterSaved)})` : ''}</span>
        </div>
      </div>

      <p className={styles.label}>Moonwalk suit · {life.landingCrew} needed</p>
      <div className={styles.suits}>
        {L.suits.map((suit) => (
          <button
            key={suit.id}
            type="button"
            className={styles.suit}
            aria-pressed={suitId === suit.id}
            title={suit.blurb}
            onClick={() => setCrew({ suit: suit.id })}
          >
            <b>{SUIT_NAMES[suit.id] || suit.title}</b>
            <span>{fmt(suit.mass)} kg · {suit.evaHours} h</span>
          </button>
        ))}
      </div>

      <p className={scene.source}>Source: NASA BVAD, Table 3-31</p>
    </>
  )
}

function NoCrew({ data, model }) {
  const pd = data.LIFE.perCrewDay
  const example = 4 * 10 * (pd.o2 + pd.food + pd.water)
  return (
    <>
      <h2 className={scene.title}>Robots do not eat</h2>
      <p className={scene.text}>
        Robots do not breathe, eat or drink. Your lander skips this phase and keeps all that mass for science.
      </p>
      <p className={scene.note}>
        A crew of 4 on a 10-day trip would need about {model.fmt(example)} kg of oxygen, food and water, before
        counting the astronauts, their suits and the fuel to carry it all.
      </p>
      <p className={scene.source}>Source: NASA BVAD, Table 3-31</p>
    </>
  )
}

function ConfirmButton({ game, crewed }) {
  const navigate = useNavigate()
  const { state, model, lockCrew, setNotice } = game
  const check = model.validatePhase(state, 2)
  const blocker = check.issues.find((issue) => issue.severity === 'block')
  return (
    <Button
      variant="outline"
      disabled={Boolean(blocker)}
      disabledReason={blocker ? blocker.message : ''}
      onClick={() => {
        flushSync(() => {
          lockCrew()
          setNotice(crewed ? 'Crew plan locked ✓' : 'Phase 2 done ✓')
        })
        navigate('/f3a')
      }}
    >
      {crewed ? 'Confirm crew' : 'Continue'}
    </Button>
  )
}
