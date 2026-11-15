# Space Syntax

Is the Moon made of cheese? A green alien cat thinks so. You design a real lunar mission to find out.

Browser game for teens, built for NASA Space Apps 2026, Space Mission Design Game challenge.

## Status

- Phases 0 and 1 are playable.
- The engine covers phases 0 to 7. Screens for phases 2 to 7 are next.
- Screen guides: [phases 0 and 1](docs/pantallas-fase-0-1.md), [phases 6 and 7](pantallas_fase_6_y_7.md).

## Run

```bash
python tools/serve.py
node --test
node tools/check.js
```

Open http://127.0.0.1:8080. No build step and no dependencies.

## Structure

| Path | Content |
|---|---|
| `js/data.js` | Game data and sources |
| `js/model.js` | Game engine, no DOM |
| `js/app.js` | Screens and HUD |
| `assets/` | Team artwork |
| `tests/` | Engine tests (`model.test.js` for phases 0 to 5, `phases67.test.js` for phases 6 and 7) |
| `tools/` | Dev server, checks, screenshots |

## Engine

- `evaluate(state)`: launch mass, fuel, cost, power
- `rocketMath(state)`: rocket equation, burn by burn
- `lifeSupport(state)`: crew supplies for phase 2
- `flightPlan(state)`: maneuvers and delta-v margin for phase 3
- `commsPlan(state)`: signal delay, data rate and daily volume for phase 4
- `siteReport(state)` and `landingSim(state, seed)`: landing site and descent for phase 5
- `surfaceStatus(state)`, `canMeasure`, `measure`, `sendData`, `finishSurface`, `surfaceOutcome`: surface science for phase 6 (hours, power, data buffer, sample box, evidence meter, field journal)
- `rollSurfaceEvent` and `applySurfaceEventChoice`: solar storm and blackout on the surface
- `returnBurns(state, seed)`, `thermalCheck`, `splashdown`, `returnSim(state)`, `returnMath`: return to Earth for phase 7, with a cause chain when the mission fails
- `validatePhase(state, n)` for phases 0 to 7 and `launchReadiness(state)`: GO / NO GO
- `rollEvent` and `applyEventChoice`: seeded random events
- `sanitizeState(raw)`: safe restore of a saved game. Phase 6 actions are replayed through the real rules, so a tampered save cannot skip them

### Phases 6 and 7

- Surface: only the instruments loaded in phase 1 can be used. Each measurement costs hours, spare power and data, and lights the evidence meter: camera = clue, spectrometer or hydrogen (water question) = composition, sample = strongest.
- Return: liftoff (1,833 m/s) and Earth return burn (1,450 m/s) come out of the fuel reserved in phase 3. The rocket equation gives the delta-v actually available, and each burn can need a few percent more, so the phase 3 margin matters.
- Reentry: direct entry runs cooler but lands less precisely; skip entry is precise but heats the shield more. Shield capacity against heat load gives the thermal margin, then a seeded splashdown has to land inside the recovery zone.
- Hours, power, data, sample masses, heat load, shield capacity and the recovery zone are game values.

## Science

Every number comes from a cited source or is marked as a game value in the UI.

- Moon density and gravity from the NSSDC fact sheet
- Delta-v per maneuver from NASA lunar studies
- Apollo engine Isp of 314 s
- Crew oxygen, food and water from NASA BVAD
- SLS capacity and cost from NASA and the NASA OIG
- Deep Space Network, LRO Ka-band and O2O laser rates from NASA
- Apollo 11 and 16 landing sites from NASA sample curation
- Water at the south pole from LCROSS (2009)
- Skip entry range, Artemis I entry speed and splashdown accuracy from NASA and NASA NTRS
- Avcoat heat shield and the Artemis II heat shield analysis from NASA
- Orion parachutes and the Artemis II splashdown from NASA

The full list is in `js/data.js` and in the Sources link inside the game.

## Security

No login, no accounts, no tracking. Details in [SECURITY.md](SECURITY.md).
