import { useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bubble } from '../components/ui/Bubble.jsx'
import { Button } from '../components/ui/Button.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { useGame } from '../engine/useGame.jsx'
import { StageScene, usePhaseGuard } from './frame.jsx'
import { usePlay } from './playContext.jsx'
import styles from './F2.module.css'

const BACKGROUND = '/bg/bg-preparacion.png'
const CHARACTER = '/char/nina-chaqueta-portapapeles.png'
const SUIT_NAMES = { light: 'Light', lunar: 'Lunar', heavy: 'Heavy' }

export function F2() {
  const ready = usePhaseGuard('/f2')
  if (!ready) return null
  return (
    <StageScene
      background={BACKGROUND}
      character={<img className={styles.girl} src={CHARACTER} alt="" />}
      title="How far is upy — Phase 2"
    >
      <F2Body />
    </StageScene>
  )
}

function F2Body() {
  const navigate = useNavigate()
  const game = useGame()
  const { setModal } = usePlay()
  const { state, data, model, ensureCrew } = game
  const crewed = state.missionType === 'crewed'
  const life = crewed ? model.lifeSupport(state) : null

  useEffect(() => {
    if (crewed && !state.crew) ensureCrew()
  }, [crewed, state.crew, ensureCrew])

  if (crewed && !life) return null

  return (
    <div className={styles.screen}>
      <MissionHud state={state} model={model} life={life} />
      <div className={styles.speech}>
        <Bubble tone="speech">{crewed ? 'Every day adds mass.' : 'No crew, no groceries!'}</Bubble>
      </div>
      <div className={styles.panel}>
        <GlassPanel>
          <p className={styles.kicker}>Phase 2 · Crew and life support</p>
          {crewed ? <CrewPlan game={game} life={life} /> : <NoCrew data={data} model={model} />}
        </GlassPanel>
      </div>
      <div className={styles.dock}>
        <div className={styles.nav}>
          <Button variant="secondary" onClick={() => navigate('/f1done')}>← Phase 1</Button>
          <Button variant="secondary" onClick={() => setModal('howto')}>? Help</Button>
        </div>
        <div className={styles.lock}>
          <ConfirmButton game={game} crewed={crewed} />
        </div>
      </div>
    </div>
  )
}

function MissionHud({ state, model, life }) {
  const hud = model.hud(state)
  const fmt = model.fmt
  const days = life ? life.days : hud.days
  return (
    <div className={styles.hud} aria-label="Mission status">
      <span>Earth</span>
      <span>Mass {fmt(hud.launchMass)} kg</span>
      <span>Cost ${fmt(hud.cost)}M</span>
      <span>Energy {energy(hud.powerNeed, fmt)}</span>
      <span>Delta-v {fmt(hud.dvPlanned)} m/s</span>
      <span>Data {fmt(hud.dataSentGb)} Gb</span>
      <span>Days {days == null ? '—' : fmt(days)}</span>
    </div>
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
      <p className={styles.note}>{life.landingCrew} land on the Moon, {life.orbitCrew} wait in orbit</p>

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
        <p className={styles.note} id="f2-days-help">
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

      <p className={styles.source}>Source: NASA BVAD, Table 3-31</p>
    </>
  )
}

function NoCrew({ data, model }) {
  const pd = data.LIFE.perCrewDay
  const example = 4 * 10 * (pd.o2 + pd.food + pd.water)
  return (
    <>
      <h2 className={styles.title}>Robots do not eat</h2>
      <p className={styles.text}>
        Robots do not breathe, eat or drink. Your lander skips this phase and keeps all that mass for science.
      </p>
      <p className={styles.note}>
        A crew of 4 on a 10-day trip would need about {model.fmt(example)} kg of oxygen, food and water, before
        counting the astronauts, their suits and the fuel to carry it all.
      </p>
      <p className={styles.source}>Source: NASA BVAD, Table 3-31</p>
    </>
  )
}

function ConfirmButton({ game, crewed }) {
  const { state, model, lockCrew, setNotice } = game
  if (state.phase2Done) {
    return (
      <Button variant="outline" disabledReason="Phase 3 is being built">
        {crewed ? 'Crew plan locked ✓' : 'Phase 2 done ✓'}
      </Button>
    )
  }
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
      }}
    >
      {crewed ? 'Confirm crew' : 'Continue'}
    </Button>
  )
}

function energy(watts, fmt) {
  return watts >= 1000 ? `${fmt(watts / 1000, 1)} kW` : `${fmt(watts)} W`
}

function Icon({ children }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

function OxygenIcon() {
  return (
    <Icon>
      <path d="M10 2.5h4M12 2.5v2.5" />
      <rect x="7.5" y="5" width="9" height="16.5" rx="3.5" />
      <path d="M7.5 10.5h9" />
    </Icon>
  )
}

function FoodIcon() {
  return (
    <Icon>
      <path d="M6 2.5v6.5a2.5 2.5 0 0 0 5 0V2.5M8.5 2.5v19" />
      <path d="M17.5 21.5V2.5c-2 1.5-3 4-3 7.5v3h3" />
    </Icon>
  )
}

function WaterIcon() {
  return (
    <Icon>
      <path d="M12 2.8c3.4 4.4 6 7.7 6 11.2a6 6 0 0 1-12 0c0-3.5 2.6-6.8 6-11.2z" />
    </Icon>
  )
}
