/**
 * Help text for the "? Help" button on each screen. Plain language, one block per
 * topic. Every block can cite a key into the SOURCES table of js/data.js so the
 * screen can link the real document. The game does not read this file: the
 * screens do.
 */

export const HELP_F1A = {
  title: 'Phase 1: Build the Spacecraft',
  intro: 'A spacecraft is a stack of subsystems. Pick one option for each: the left list marks what is still open.',
  subsystems: {
    structure: {
      what: 'The skeleton that holds the tanks, engines and instruments together through launch shaking.',
      hazard: 'A heavier frame leaves less mass for fuel and science, so the launch can stop fitting the rocket.',
      example: 'The Space Station picked graphite-epoxy racks to save weight, but NASA reports the savings "evaporated" once every requirement was added.',
      source: 'finckenor',
    },
    shield: {
      what: 'A bumper that stops micrometeoroids: grains of rock and metal that hit at several kilometres per second.',
      hazard: 'Without it, a tiny impact can puncture a tank or a cable and end the mission.',
      example: 'NASA\'s Whipple shield flies on the Space Station and on Stardust: a thin sacrificial layer shatters the impactor before it reaches the wall.',
      source: 'hvit',
    },
    thermal: {
      what: 'Blankets, coatings, heaters and radiators that keep the electronics at working temperature.',
      hazard: 'The lunar surface swings from about 127 °C in sunlight to about −173 °C in the dark. Unprotected electronics cook or freeze.',
      example: 'NASA\'s Diviner instrument on LRO measured about 25 K (−250 °C) inside shadowed lunar craters, the coldest place ever measured.',
      source: 'diviner',
    },
    power: {
      what: 'Solar panels, batteries or a nuclear generator that make the electricity everything else needs.',
      hazard: 'A night at the lunar equator lasts about 354 hours (~14 Earth days). With no power left, the spacecraft dies in the dark.',
      example: 'NASA\'s MMRTG nuclear generator (about 110 W, about 45 kg) keeps working through any night; it powers the Mars rovers.',
      source: 'mmrtgSheet',
    },
    science: {
      what: 'The instruments that answer your Phase 0 question. Cameras see shape and colour, spectrometers read the elements, a neutron detector finds hydrogen — a sign of water ice — and the sampler brings soil home.',
      hazard: 'Fly an instrument that does not match your question and the mission comes home without an answer.',
      example: 'NASA\'s Lunar Reconnaissance Orbiter carries the LROC cameras and the LEND neutron detector; VIPER was designed to map water ice near the south pole.',
      source: 'lro',
    },
  },
}

export const HELP_F1B = {
  title: 'Phase 1: Pick your Rocket',
  blocks: [
    {
      heading: 'Launch mass',
      text: 'Your rocket has to lift the lander plus all the fuel it will burn on the way to the Moon and back. That total is the launch mass on the top meter.',
    },
    {
      heading: 'Margin',
      text: 'The spare room between what you load and what the rocket can lift. A thin margin (under about 10%) leaves no room for surprises; NASA keeps a reserve for the same reason.',
    },
    {
      heading: 'The launch test',
      text: 'To reach the Moon, the rocket\'s upper stage must push your spacecraft to 3,150 m/s — trans-lunar injection, the burn that leaves Earth\'s orbit. The test replays that burn with your real numbers.',
      source: 'cev',
    },
    {
      heading: 'What is delta-v?',
      text: 'Delta-v (Δv) is a budget of speed change, measured in metres per second. Every manoeuvre — braking into orbit, landing, coming home — spends from it, and fuel is what buys it.',
    },
  ],
}

export const HELP_F2 = {
  title: 'Phase 2: Crew and Life Support',
  blocks: [
    {
      heading: 'Why every day adds mass',
      text: 'NASA\'s BVAD baseline says each astronaut needs about 0.895 kg of oxygen, 0.800 kg of dry food and 3.217 kg of drinking water per day. Multiply that by the crew and the mission days — every extra day is real mass aboard the ship.',
      source: 'bvad',
    },
    {
      heading: 'Safety reserve',
      text: 'Extra supplies for delays and surprises, like a solar storm that keeps the crew aboard one more day. The +20% option is a game value, not a NASA figure.',
    },
    {
      heading: 'Water recycler',
      text: 'It cleans the crew\'s used water so they can drink it again — the Space Station already recovers 98% of its water this way. It adds 300 kg but cuts the water you must launch, so it pays off on longer missions.',
      source: 'issWater',
    },
    {
      heading: 'Moonwalk suits',
      text: 'The astronauts who land need a suit to step outside. The hours mean moonwalk time: Light is cheap for short walks, Lunar is built for freezing shadowed craters, and Heavy carries extra protection.',
      source: 'axemu',
    },
    {
      heading: 'Two down, two in orbit',
      text: 'NASA\'s Artemis plan works this way: two astronauts ride the lander down to the surface while two keep the ship in lunar orbit, ready to bring everyone home.',
      source: 'artemisFaq',
    },
  ],
}

export const HELP_F1DONE = {
  title: 'Phase 1: Design Review',
  blocks: [
    {
      heading: 'What is a design review?',
      text: 'At NASA a project cannot move forward until it passes a design review: engineers check every number and call each one GO or NO GO. A single NO GO sends the design back to the workshop.',
      source: 'seHandbook',
    },
    {
      heading: 'The four checks',
      text: 'Launch mass: lander plus fuel must fit the rocket. Budget: spacecraft plus rocket must fit the money. Power: generation must cover what the spacecraft needs. Science: at least one instrument must answer your Phase 0 question.',
    },
    {
      heading: 'What comes next',
      text: 'A crewed mission continues with crew and life support; a robotic one goes straight to the flight plan, where you spend your delta-v budget manoeuvre by manoeuvre.',
    },
  ],
}

export const HELP_F5A = {
  title: 'Phase 5: Landing Site',
  blocks: [
    {
      heading: 'Pick the place, then the proof',
      text: 'Each site fits some science questions better than others. A site marked "Good for your question" has the rock or the ice your instruments need to test the hypothesis.',
      source: 'sampleScience',
    },
    {
      heading: 'Three instruments from orbit',
      text: 'NASA\'s Lunar Reconnaissance Orbiter scouts every site before a landing: LOLA measures the slopes with a laser, LROC photographs boulders and craters, and Diviner reads the temperature.',
      source: 'lro',
    },
    {
      heading: 'Hover time',
      text: 'Rough ground makes the lander hang in the air while it looks for a flat spot, and hovering burns fuel. Compare "Hover needed" with "Hover you have": the fuel margin you set in Phase 3 pays for it.',
    },
    {
      heading: 'Cold and dark at the pole',
      text: 'Near the south pole the Sun stays low and some craters never see it. Diviner measured about 25 K (−250 °C) inside them, the coldest temperature measured in the solar system.',
      source: 'diviner',
    },
  ],
}

export const HELP_F5B = {
  title: 'Phase 5: Powered Descent',
  blocks: [
    {
      heading: 'The last braking burn',
      text: 'The descent burn spends about 2,074 m/s of delta-v to slow the lander from lunar orbit down to the surface. On the Moon there is no air to help, so the engine does all the braking.',
      source: 'altair',
    },
    {
      heading: 'Hovering costs fuel',
      text: 'Lunar gravity pulls at 1.62 m/s², so every second spent hovering burns about 1.62 m/s of delta-v. If rocks show up, a detour spends some of your margin; aborting is safe but you do not land.',
    },
    {
      heading: 'A gentle touchdown',
      text: 'NASA lander studies keep the touchdown speed below about 2 m/s for a clean landing. A little faster is a rough landing; much faster is a crash.',
      source: 'landingContact',
    },
    {
      heading: 'Apollo 11 did it too',
      text: 'Armstrong flew past a boulder field near West Crater and landed with about 45 seconds of fuel left, including about 20 seconds kept for an abort.',
      source: 'alsj11',
    },
  ],
}
