# Space Syntax

Is the Moon made of cheese? A green alien cat thinks so. You design a real lunar mission to find out.

Browser game for teens, built for NASA Space Apps 2026, Space Mission Design Game challenge.

## Status

- Phases 0 and 1 are playable.
- The engine covers phases 0 to 5. Screens for phases 2 to 5 are next.

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
| `tests/` | Engine tests |
| `tools/` | Dev server, checks, screenshots |

## Engine

- `evaluate(state)`: launch mass, fuel, cost, power
- `rocketMath(state)`: rocket equation, burn by burn
- `lifeSupport(state)`: crew supplies for phase 2
- `flightPlan(state)`: maneuvers and delta-v margin for phase 3
- `commsPlan(state)`: signal delay, data rate and daily volume for phase 4
- `siteReport(state)` and `landingSim(state, seed)`: landing site and descent for phase 5
- `validatePhase(state, n)` and `launchReadiness(state)`: GO / NO GO
- `rollEvent` and `applyEventChoice`: seeded random events
- `sanitizeState(raw)`: safe restore of a saved game

## Science

Every number comes from a cited source or is marked as a game value in the UI.

- Moon density and gravity from the NSSDC fact sheet
- Delta-v per maneuver from NASA lunar studies
- Apollo engine Isp of 314 s
- Crew oxygen, food and water from NASA BVAD
- SLS capacity and cost from NASA and the NASA OIG
- Deep Space Network, LRO Ka-band and O2O laser rates from NASA
- Apollo 11 and 16 landing sites from NASA sample curation

The full list is in `js/data.js` and in the Sources link inside the game.

## Security

No login, no accounts, no tracking. Details in [SECURITY.md](SECURITY.md).
