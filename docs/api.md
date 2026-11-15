# Backend to frontend contract

For whoever builds the screens. You should not need to read `js/model.js` or `js/sim/*`. Every number below was computed from the code; the fixtures in `fixtures/` hold real outputs you can load while you build. Regenerate them with `npm run fixtures`.

## How to load

Scripts, in this order, as in `index.html`:

```
js/data.js        -> window.SS_DATA
js/model.js       -> window.SS_MODEL
js/sim/kit.js     -> window.SS_SIMKIT
js/sim/p1.js ... p5.js
js/sim.js         -> window.SS_SIM
js/art.js
js/app.js
```

```js
const D = SS_DATA, M = SS_MODEL, SIM = SS_SIM;
let s = M.newState();                       // fresh state
const r = M.evaluate(s);                    // budget numbers, null until s.missionType is set
const run = SIM.simulate(s, 3, { seed: 42 }); // the Play button
```

All model functions are pure. They never change `s`. To change a choice, write the field and call again. Never save raw state from outside: pass it through `M.sanitizeState(raw)`, which drops unknown keys.

## Screen order

0, then 1A, 1B, 2, 3A, 4, 3B (launch), 5A, 5B.

The radio flies on the spacecraft, so comms is chosen before launch. `M.launchReadiness(s)` checks phases 0 to 4. Screen 2 is skipped for robotic missions.

| Screen | Name | Phase for `validatePhase` | Phase for `simulate` |
|---|---|---|---|
| 0 | Mission goal | 0 | 0 |
| 1A | Assembly building | 1 | none |
| 1B | Pick a rocket | 1 | 1 |
| 2 | Crew and life support | 2 | 2 |
| 3A | Flight plan | 3 | 3 |
| 4 | Communications | 4 | 4 |
| 3B | Launch pad summary | `launchReadiness` | 1 (the launch run) |
| 5A | Landing site | 5 | none |
| 5B | Powered descent | 5 | 5 |

## The sim result

`SIM.simulate(s, phase, opts)` returns one shape for every phase. Animate it, do not recompute it.

```
{ phase, title, ready: true, seed,
  ok, outcome: 'success'|'partial'|'fail', stars: 0..3,
  time:   { unit: 's'|'h'|'day', total },
  fields: [{ key, label, unit, max }],   // what every frame carries, max is a gauge ceiling
  frames: [{ t, ...numbers }],           // at most 200, first t = 0, last t = time.total
  events: [{ t, kind: 'info'|'warn'|'fail'|'success', text }],
  failure: null | { t, code, cause, fix },
  score:  { label, value, unit, thresholds, higherIsBetter },
  math:   null | { title, steps: [{ eq, num }], src } }
```

If the phase cannot run yet you get `{ phase, title, ready: false, blockers: [{ code, message, phase }] }`. Check `ready` first and show the blockers.

Playback: pick `t` from 0 to `time.total` at any speed, find the frame with the largest `frame.t <= t`, or interpolate between two frames. Show each event when `t >= event.t`. At the end show `failure.cause` and `failure.fix` when `ok` is false.

`outcome: 'partial'` happens only in phases 4 and 5. Phase 5 partial means a rough landing and the stars are capped at 1.

## Random seeds

Same state and same seed give the same run, frame for frame. Pass `{ seed: <integer> }`. If you pass none you get seed 1 every time, so pass a fresh integer on each Play and store the one you used to replay. The seed used is in `result.seed`.

`sanitizeState` drops unknown keys, so keep seeds next to the state, for example `save.seeds[phase]`. Two seeds do live in state: `state.landing.seed` (phase 5 uses it when you pass none) and `state.returnTrip.seed` (phase 7).

## HUD bar

`r = M.evaluate(s)` once per render. It returns `null` when `s.missionType` is not set, so show zeros on screen 0.

| HUD item | Expression | Notes |
|---|---|---|
| Location | none | Fixed text per screen: Earth for 0 to 4, "Earth to Ship" on 3B, "Moon orbit" on 5A, "Ship" on 5B. |
| Launch mass | `r.tli` kg | Mass the rocket must send to the Moon, fuel included. |
| Capacity | `r.rocket ? r.rocket.capacity : null` | Null until a rocket is picked. |
| Mass fits | `r.fitsRocket` | `null` without a rocket. |
| Hardware | `r.dry` kg | |
| Fuel | `r.propellant` kg | |
| Cost | `r.totalCost` $M | Spacecraft plus rocket plus ground time. |
| Budget | `r.budget` $M | Depends on mission type and difficulty. |
| Power | `r.powerNeed` / `r.powerGen` W | Energy in kW is `r.powerGen / 1000`. |
| Delta-v | `r.dvPlanned` m/s | Needed delta-v times (1 + margin). Without margin use `r.dvRequired`. |
| Delta-v remaining | `r.dvPlanned - (sum of dvPlanned for burns already flown)` | Burns from `M.flightPlan(s).burns`. After LOI subtract the `loi` entry. No helper exists. |
| Data | `0` before launch | After Phase 4 play use the last frame's `delivered`. On the surface use `M.surfaceStatus(s).dataSentGb`. |
| Days | Crewed: `M.lifeSupport(s).days` | Robotic has no day count. Use `Math.round(sim4.time.total / 24)` from the Phase 4 run. |
| Over budget | `r.overBudget` | |

`r.lines` is the itemised list: `{ label, where, mass, cost, power, gen, src, kind }`. Use it for a "Why so heavy" panel.

## Screen 0: Mission goal

[robotic](../fixtures/f0.robotic.json), [crewed](../fixtures/f0.crewed.json)

Player picks, and these fields are written:

| Choice | Field | List |
|---|---|---|
| Question | `s.question` | `D.QUESTIONS` ids `made`, `water`, `age` |
| Measurement | `s.measure` | `D.MEASURES` ids `image`, `chem`, `sample` |
| Robots or people | `s.missionType` | `D.MISSION_TYPES` ids `robotic`, `crewed` |
| Difficulty | `s.difficulty` | `D.DIFFICULTIES` ids `cadet`, `engineer`, `director` |

Lock in button: enabled when `M.validatePhase(s, 0).ok`. The hypothesis line is fixed text. The sim for phase 0 has no animation, only `math` (Moon density) and one success event. `M.unlockedInstruments(s)` says which instruments the measurement allows.

## Screen 1A: Assembly building

[robotic](../fixtures/f1a.robotic.json), [crewed](../fixtures/f1a.crewed.json)

Left tab list is `D.SUBSYSTEMS` (structure, shield, thermal, power, science). Options for a tab: `M.optionsFor(sub.id, s.missionType)`.

| Choice | Field |
|---|---|
| Structure, shield, thermal, power | `s.design[sub.id] = optionId` |
| Science payload (multi) | `s.design.science = [optionId, ...]` |

Check mark on a tab: `s.design[sub.id]` is set, or for science the array is not empty. `M.missingSubsystems(s)` returns the tabs still empty.

Panel rows:

| Row | Expression |
|---|---|
| Hardware | `r.dry` |
| Fuel | `r.propellant` |
| Launch mass | `r.tli` |
| Ghost value when hovering an option | `M.previewWith(s, sub.id, optionId).tli`, also `.totalCost`, `.powerNeed` |
| Why the fuel | `M.rocketMath(s)`: `burns[]` with `name, dv, ratio, mFinal, prop, mStart` |
| Cut suggestions | `M.descopeSuggestions(s, 'mass')` or `'cost'` |
| Go to rocket button | `M.validatePhase(s, 1)`; ignore `noRocket` here |

No sim on this screen.

## Screen 1B: Pick a rocket

[robotic](../fixtures/f1b.robotic.json), [crewed](../fixtures/f1b.crewed.json)

Choice: `s.rocket = id`. Cards from `D.ROCKETS[s.missionType]`. Per card:

| Item | Expression |
|---|---|
| Capacity | `k.capacity` kg |
| Rocket cost | `k.cost` $M |
| Fits or too heavy | `r.tli <= k.capacity`; launch mass does not depend on the rocket |
| Fuel tube fill | `r.tli / k.capacity`, above 1 means overflow |
| Total with this rocket | `r.cost + k.cost`, compare to `r.budget` |

Right panel: Spacecraft `r.cost`, Rocket `r.rocket.cost`, Total `r.totalCost` over `r.budget`. Confirm button: `M.validatePhase(s, 1).ok`. The fixture has `engine.rockets[]` with these values already computed.

The launch animation is `simulate(s, 1)`, also used on screen 3B. Frame fields: `dv` m/s gained (max 3,150), `prop` kg left, `mass` kg, `accel` m/s². Use `prop` for the fuel gauge and `accel` for shake and flame size. Failure codes: `tooHeavy` (engine cuts early at `failure.t`), `noPower`, `overBudget`. Score is mass margin, stars at 0, 10 and 20 percent.

## Screen 2: Crew and life support

[crewed](../fixtures/f2.crewed.json), [robotic, skipped](../fixtures/f2.robotic.json)

Writes `s.crew = { size, days, reserve, suit, recycler }`. Start from `M.defaultCrew()`.

| Control | Field | Range |
|---|---|---|
| Crew size | `s.crew.size` | 1 to 4 |
| Mission days | `s.crew.days` | 1 to 30, minimum `L.minDays` |
| Safety reserve | `s.crew.reserve` | 0 or 0.2 |
| Suit | `s.crew.suit` | `D.LIFE.suits` ids `light`, `lunar`, `heavy` |
| Water recycler | `s.crew.recycler` | boolean |

`L = M.lifeSupport(s)`. Panel: oxygen `L.o2` kg, food `L.food` kg, water `L.water` kg, source `bvad`. Others: `L.landingCrew`, `L.orbitCrew`, `L.suitsMass`, `L.recyclerBreakEvenDays`, `L.daysOk`. Math panel: `M.lifeMath(s)`. Confirm: `M.validatePhase(s, 2).ok`.

Sim `simulate(s, 2)`, `time.unit` is `'day'`. Frame fields `o2`, `food`, `water` in kg left, `ashore` crew on the surface (0 to 2). Day 3 to 6 `ashore` is the landing crew. A solar storm event may appear. Failure codes `o2Out`, `foodOut`, `waterOut`, `noShelter`, `tooShort`, `tooHeavy`, `overBudget`. Robotic gets a one-line success with no frames of interest, so skip the screen.

## Screen 3A: Flight plan

[robotic](../fixtures/f3a.robotic.json), [crewed](../fixtures/f3a.crewed.json)

Choice: `s.flight.margin`, one of `D.FLIGHT.marginOptions` (0, 0.05, 0.10, 0.15, 0.20). Minimum for the difficulty: `M.minMargin(s)` (cadet 0, engineer 0.05, director 0.10).

`P = M.flightPlan(s)`. Left panel rows:

| Row | Expression |
|---|---|
| 1 Translunar injection | `P.tli.dv`, tagged "Rocket upper stage" |
| Other burns in order | `P.burns[]` with `label, dv, dvPlanned, vehicle` |
| Needs | `P.dvRequired`, with margin `P.dvPlanned` |

Robotic lists only `loi` and `descent`, plus `direct` when `s.measure === 'sample'`. Crewed lists `loi`, `descent`, `ascent`, `tei`.

Bottom bar: bar fill is `P.dvPlanned`, tick is `P.dvRequired`. Chip "Enough margin" is `M.validatePhase(s, 3).ok`. Every margin changes launch mass and cost, so refresh `r`. The fixture `engine.marginTable` shows launch mass, fit and GO for each margin. Go to the pad button: `M.validatePhase(s, 3).ok`.

Sim `simulate(s, 3)`, `time.unit` is `'h'`. The trip ends at touchdown. Frame fields:

| Field | Use |
|---|---|
| `x`, `y` | Ship dot in km. `x` runs 0 (Earth) to 384,400 (Moon). `y` bows up to 70,000 km. Near the Moon the dot circles it. Scale both to your diagram. |
| `progress` | 0 to 1, for a progress bar |
| `reserve` | m/s left in the shared pool, drains in burns |
| `dvUsed` | m/s used |
| `leg` | Index of the current leg: 0 TLI burn, 1 coast, 2 correction, 3 coast, 4 correction, 5 LOI, 6 descent, 7 touchdown |

Failure code `outOfFuel` stops the dot at `failure.t`. Others: `lowDvMargin`, `tooHeavy`, `overBudget`. The leftover margin for phases 5 and 7 appears only in `math` text and the last event.

## Screen 4: Communications

[robotic](../fixtures/f4.robotic.json), [crewed](../fixtures/f4.crewed.json)

Writes `s.comms = { link, dish }`. Both are needed. The mockup shows only the link, so add a dish toggle.

| Choice | Field | List |
|---|---|---|
| Link | `s.comms.link` | `D.COMMS.links` ids `sband`, `ka`, `laser` |
| Dish | `s.comms.dish` | `D.COMMS.dishes` ids `dsn34`, `dsn70` |

`C = M.commsPlan(s)`. Rows:

| Row | Expression |
|---|---|
| Ping, round trip | `C.roundTrip` s (2.56) |
| One way, closest / average / farthest | `C.delay.min`, `C.delay.avg`, `C.delay.max` |
| Data rate | `C.rateMbps` |
| Daily volume | `C.gbPerDay` Gb |
| Daily need | `C.needGbPerDay` Gb |
| Bottleneck warning | `C.bottleneck` |
| Laser cloud warning | `C.weatherRisk` |
| Per option cost | `link[type].power`, `.mass`, `.cost` where `type = s.missionType`, plus `dish.cost[type]` |
| Math panel | `M.commsMath(s)` |

`engine.linkDishTable` in the fixture lists all six combinations. Confirm: `M.validatePhase(s, 4).ok`.

Sim `simulate(s, 4)`, `time.unit` is `'h'`. Frame fields:

| Field | Use |
|---|---|
| `linkUp` | 1 when data flows. Light the dish beam and the "In contact" dot. |
| `station` | 0 Goldstone, 1 Madrid, 2 Canberra, -1 none. Highlight that dot on the globe. |
| `generated`, `delivered`, `lost` | Gb counters, cumulative |
| `buffer` | Gb onboard, max 150 robotic, 300 crewed. Full means data loss. |

Outcomes: `success`, `partial` (some data lost or still onboard), `fail` (under 60 percent delivered). Failure codes `dataLost`, `tooHeavy`, `noPower`, `overBudget`.

## Screen 3B: Launch pad

[robotic](../fixtures/f3b.robotic.json), [crewed](../fixtures/f3b.crewed.json)

No choice, one button. `G = M.launchReadiness(s)` returns `{ go, phases: [{ phase, ok, issues }], issues }` for phases 0 to 4. Launch enabled when `G.go`. The mockup says phases 0 to 3 are locked; the real rule is 0 to 4.

Summary rows have no direct helper. Map them like this:

| Row | Status from | Value |
|---|---|---|
| Total mass | phase 1 and 2 `tooHeavy` | `r.tli` |
| Delta-v | phase 3 | `r.dvPlanned` |
| Crew | phase 2 | `s.crew.size` |
| Mission days | phase 2 `tooShort` | `s.crew.days` |
| Life support | phase 2 | text "OK" when phase 2 has no block |
| Comms | phase 4 | `s.comms.link` |

A row is GO when no issue with `severity === 'block'` exists in that phase. Warnings are in `G.issues` with `severity: 'warn'`.

Launch animation: `simulate(s, 1)`, same fields as screen 1B.

## Screen 5A: Landing site

[robotic](../fixtures/f5a.robotic.json), [crewed](../fixtures/f5a.crewed.json)

Choice: `s.site`, one of `D.SITES` ids `tranquility`, `descartes`, `southPole`. Call `R = M.siteReport(s, site.id)` for each card.

| Item | Expression |
|---|---|
| Title | `site.title` |
| Risk: low, medium, high | `site.hazard` 1, 2, 3 |
| Good for your question | `R.scienceMatch` |
| Chips LOLA, LROC, Diviner | `site.lola`, `site.lroc`, `site.diviner` |
| Typical hover needed | `R.hoverTypical` s |
| Hover you have | `R.hoverAvailable` s |
| Night warning | `R.survivesNight` false, shows `R.nightHours` against `site.darkHours` |
| Earth view | `R.earthView` is `always` or `intermittent` |
| Cold risk | `R.coldRisk` |
| Surface hours | `R.opsHours` robotic, `R.evaHours` crewed |

Warnings from `M.validatePhase(s, 5).issues`. Codes: `siteMismatch`, `nightDeath`, `suitCold`, `earthHidden`, `lowHover`. None of them block. Choose button needs only `s.site` set. No sim on this screen.

## Screen 5B: Powered descent

[robotic](../fixtures/f5b.robotic.json), [crewed](../fixtures/f5b.crewed.json)

`simulate(s, 5, { seed })`, `time.unit` is `'s'`, about 45 s of flight. Frame fields:

| Field | Use |
|---|---|
| `alt` | Lander height in m. Starts at 300, 0 at touchdown. The field `max` of 700 is only a ceiling. Scale the altitude gauge to 300, or read `SIM.PHASES[5].TUNING.startAlt`. |
| `vz` | Vertical speed in m/s, negative is down |
| `x` | Sideways offset from the aim point in m, moves the lander left and right |
| `throttle` | 0 to 1, flame length and dust |
| `fuel` | Percent of final approach fuel |
| `hoverLeft` | Seconds of hover still in the tank |
| `needLeft` | Seconds of hover the terrain still needs |
| `dv` | Delta-v spent in this run |

Hover phase is the stretch with `alt` near 100. Boulder and crater events fire inside it.

Outcome mapping. `res.outcome` is `success`, `partial` or `fail`. `res.landing.outcome` is `clean`, `rough` or `abort`, the value the rest of the game stores:

```js
s.landing = { seed: res.seed, outcome: res.landing.outcome };
```

`res.landing` also has `touchSpeed` (m/s, safe limit 2.1), `hoverNeeded`, `hoverAvailable`. `abort` blocks Phase 6 (`landingAbort`). Score is percent fuel left, stars at 0, 15 and 30 percent. A rough landing gets at most 1 star.

Right panel: Descent delta-v `D.DV.descent.value` (2,074), Gravity `D.MOON.gravity` (1.62), Margin left `decision.marginLeft` in the interactive run. Math panel: `res.math`.

### Interactive detour

Being built now. This is the shape to code against.

```js
const a = SIM.simulate(s, 5, { seed, interactive: true });
// a.outcome === 'pending'
// a.decision = {
//   t,                         // seconds, the sim paused here
//   code: 'rocksAhead',
//   prompt,                    // text for the banner
//   marginLeft,                // m/s of descent margin left, for the panel
//   options: [
//     { id: 'detour', label, dvCost },   // dvCost in m/s, show on the button
//     { id: 'abort',  label, dvCost: 0 },
//   ],
// }
const b = SIM.simulate(s, 5, { seed, choice: 'detour' }); // or 'abort'
```

The pending result carries the normal fields and frames up to `decision.t`. Show the banner there and freeze the scene. Resume with the same `seed`, no `interactive`, and `choice`. The resumed result is a full run from `t = 0` of the shape above, so replay it from the start or continue from `decision.t`. In the current build the abort run fails with `failure.code === 'playerAbort'`. The fixture [f5b.robotic](../fixtures/f5b.robotic.json) has `sim.interactivePending`, `sim.interactiveDetour` and `sim.interactiveAbort` when the build supports it.

Without `interactive` the same call runs straight through, as before.

## Where the mockups differ from the backend

The backend wins. Real values:

| Mockup | Backend |
|---|---|
| Robotic budget $450M | `D.BUDGET.robotic`: cadet 650, engineer 500, director 420 ($M). Crewed: cadet 7,700, engineer 6,400, director 6,300. |
| Capacity 4,000 kg on screen 0 | Capacity exists only after `s.rocket` is set. Show 0 or hide it. |
| Launch mass 1,603 kg, hardware 540, fuel 1,063 | Same robotic design gives hardware 538 kg, fuel 1,065 kg, launch mass 1,603 kg at 0 percent margin. At 15 percent margin it is 1,902 kg. |
| Spacecraft $270M, total $390M | Matches the robotic fixture design. |
| Crewed mass 18,400 kg, cost $412M, energy 2.1 kW | Real crewed fixture: launch mass 44,035 kg, cost $6,125M with SLS Block 2, power 940 W needed of 2,500 W. The crewed design only fits SLS Block 2. |
| Crew supplies 36, 32, 129 kg | Matches at 4 crew, 10 days, no reserve. With the 20 percent reserve: oxygen 43, food 38, water 154 kg. |
| Delta-v 6,620 m/s | Crewed `dvRequired` is 6,307; 6,620 is 6,307 times 1.05, which is `dvPlanned` at 5 percent margin (6,622). |
| Delta-v 5,357 m/s on screens 5A and 5B | No backend value. 6,307 minus 950 is 5,357, so it is the delta-v left after the lunar orbit burn without margin. Compute it as in the HUD table. |
| Basic radio +10 W, 1 Gb | S-band: 40 W robotic, 150 W crewed. 57.6 Gb a day with the 34 m dish, 244.2 with the 70 m dish. |
| Ka band +25 W, 4 Gb | Ka: 110 W robotic, 300 W crewed. 900 Gb a day with 34 m, 3,814.9 with 70 m. |
| Laser +40 W, 8 Gb | Laser: 130 W robotic, 250 W crewed. 2,340 Gb a day, the dish is ignored. |
| Link list without a dish | The dish is required (`noDish` blocks). Add a 34 m or 70 m choice. |
| Ping 2.56 s | Matches `commsPlan.roundTrip`. |
| Data need | Robotic fixture needs 340 Gb a day (camera 300 plus spectrometer 40). Crewed adds 50 for video, 390. Only Ka and laser clear it. |
| Detour 120 m/s, margin left 120 m/s | The interactive run reports its own `dvCost` and `marginLeft`. The robotic fixture gives 17 and 110, crewed gives 17 and 47. |
| Launch lock "Phases 0 to 3" | Phases 0 to 4 are locked. |
| Altitude gauge | `alt` runs 300 to 0, not 0 to 700. |

## Gaps

Needs that the backend does not cover:

1. No `dvRemaining` helper for the HUD on screens 5A and 5B.
2. No robotic mission day count. Derive it from the Phase 4 run.
3. No per-row GO status for the 3B summary. Derive it from `launchReadiness`.
4. Phase 3 does not return the leftover margin as a field, only in text.
5. No `data` HUD value before the Phase 4 run.

## Fixtures

`npm run fixtures` writes `fixtures/<screen>.<type>.json`. Each file: `{ screen, title, missionType, note, state, engine, sim }`. `engine` has the model outputs for the screen. `sim` holds `success`, `partial` and `fail` as `{ label, seed, state, result }`, `null` when the phase has no such outcome. Each sim entry carries the state it was run with, which can differ from `state` when a failure needed a worse design. Seed for the base runs is 7. Files are deterministic, so a diff means the backend changed.
