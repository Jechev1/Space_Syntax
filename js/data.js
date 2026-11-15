/* Space Syntax — game data for Phase 0 and Phase 1.
 * RULE: every number is either a NASA-sourced fact (src: key into SOURCES)
 * or a game value (src: 'game'). Game values are tuned for balance and are
 * shown to players with a "Game value" chip. Never present a game value as fact.
 */
(function (root) {
  'use strict';

  /* Cast. Add a character = add an entry + drop its image in assets/characters/<id>.png
   * (the lead also accepts assets/cat.png). Names are placeholders until the team decides. */
  const CHARACTERS = [
    { id: 'cat', name: 'Milo', role: 'Mission lead', img: 'assets/cat.png', alt: 'assets/characters/cat.png', lead: true },
    // { id: 'engineer', name: '???', role: 'Spacecraft engineer', img: 'assets/characters/engineer.png' },
    // { id: 'flight', name: '???', role: 'Flight dynamics', img: 'assets/characters/flight.png' },
    // { id: 'science', name: '???', role: 'Science & comms', img: 'assets/characters/science.png' },
  ];
  const CHARACTER = CHARACTERS.find(c => c.lead);
  /* Which scene (background art) each screen uses. The story starts on Earth at the launch site. */
  const SCENES = {
    start: 'space', intro: 'launch', f0: 'launch', f1a: 'launch', f1b: 'launch', f1done: 'launch', f2: 'fase2', f2done: 'crew', f3a: 'fase3A', f4: 'fase4', f3b: 'fase3B', f5a: 'fase5A', f5b: 'fase5B', f5done: 'space',
    // f2: 'ship' — spacecraft interior with oxygen, food and water (Phase 2)
    // f3: 'trajectory' — Earth-to-Moon path with maneuver nodes (Phase 3)
  };
  const SCENE_ART = { space: 'assets/bg-space.jpg', launch: 'assets/bg-launch.jpg', ship: 'assets/bg-ship.jpg', trajectory: 'assets/bg-trajectory.jpg', crew: 'assets/bg-crew.jpg',
    fase2: 'assets/fase2.jpeg', fase3A: 'assets/fase3A.jpeg', fase4: 'assets/fase4.jpeg', fase3B: 'assets/fase3B.jpeg', fase5A: 'assets/fase5A.jpeg', fase5B: 'assets/fase5B.jpeg' };

  const SOURCES = {
    nssdc: { title: 'NASA NSSDC — Moon Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' },
    moonfacts: { title: 'NASA Science — Moon Facts', url: 'https://science.nasa.gov/moon/facts/' },
    samples: { title: 'NASA JSC Curation — Lunar Samples', url: 'https://curator.jsc.nasa.gov/lunar/' },
    sampleScience: { title: 'NASA JSC — Lunar Sample Science Today', url: 'https://curator.jsc.nasa.gov/education/lpetss/sciencetoday.cfm' },
    lro: { title: 'NASA Science — LRO Spacecraft and Instruments', url: 'https://science.nasa.gov/mission/lro/spacecraft-and-instruments/' },
    webbGame: { title: 'NASA — Webb "Build It Yourself" game', url: 'https://science.nasa.gov/mission/webb/game-build-it-yourself/' },
    sciMissions: { title: 'NASA — Design and Develop Science Missions (PDF)', url: 'https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf' },
    seHandbook: { title: 'NASA Systems Engineering Handbook, 3.0 Life Cycle', url: 'https://www.nasa.gov/reference/3-0-nasa-program-project-life-cycle/' },
    hvit: { title: 'NASA JSC HVIT — Shield Development', url: 'https://hvit.jsc.nasa.gov/shield-development/' },
    finckenor: { title: 'NASA MSFC — Materials for Spacecraft (Finckenor, PDF)', url: 'https://ntrs.nasa.gov/api/citations/20160013391/downloads/20160013391.pdf' },
    rps: { title: 'NASA NTRS — Radioisotope Power Systems for Extended Lunar Science (PDF)', url: 'https://ntrs.nasa.gov/api/citations/20180004489/downloads/20180004489.pdf' },
    lunarPower: { title: 'NASA NTRS — Power and Energy for the Lunar Surface (PDF)', url: 'https://ntrs.nasa.gov/api/citations/20220005893/downloads/Power%20and%20Energy%20for%20the%20Lunar%20Surface.pdf' },
    mmrtg: { title: 'NASA RPS — Radioisotope Power Systems FAQ', url: 'https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/faq/' },
    mmrtgSheet: { title: 'NASA — MMRTG Fact Sheet (PDF)', url: 'https://mars.nasa.gov/files/mep/MMRTG_FactSheet_update_10-2-13.pdf' },
    esaEsm: { title: 'ESA — European Service Module power', url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Orion/European_Service_Module_Power' },
    nssdcCsm: { title: 'NASA NSSDC — Apollo 17 Command and Service Module', url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096A' },
    nssdcLm: { title: 'NASA NSSDC — Apollo 17 Lunar Module', url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096C' },
    apolloWater: { title: 'NASA NTRS — Apollo experience report: potable water system', url: 'https://ntrs.nasa.gov/citations/19730016147' },
    spsIsp: { title: 'NASA NTRS — Apollo Service Propulsion System (Isp 314.5 s)', url: 'https://ntrs.nasa.gov/citations/20100027319' },
    techport: { title: 'NASA TechPort — High-energy Li-ion cells', url: 'https://techport.nasa.gov/projects/16723' },
    nightPower: { title: 'NASA NTRS — Power beaming for small lunar landers (50 W night survival)', url: 'https://ntrs.nasa.gov/api/citations/20230018143/downloads/PowerBeamingFromLunarOrbitForSmallScienceLanders.pdf' },
    nist: { title: 'NIST — Newtonian constant of gravitation', url: 'https://physics.nist.gov/cgi-bin/cuu/Value?bg' },
    apollo11: { title: 'NASA — Apollo 11 Mission Report (PDF)', url: 'https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf' },
    apollo17: { title: 'NASA — Apollo 17 mission details', url: 'https://www.nasa.gov/missions/apollo/apollo-17-mission-details/' },
    artemisFaq: { title: 'NASA — FAQ: Artemis campaign (crew transfer to the lander)', url: 'https://www.nasa.gov/missions/artemis/faq-nasas-artemis-campaign-and-recent-updates/' },
    dsn: { title: 'NASA — Deep Space Network', url: 'https://www.nasa.gov/communicating-with-missions/dsn/' },
    jplArtemisNet: { title: 'NASA JPL — Networks keeping Artemis II connected', url: 'https://www.jpl.nasa.gov/news/networks-keeping-nasas-artemis-ii-mission-connected/' },
    o2o: { title: 'NASA — O2O laser communications (up to 260 Mbps)', url: 'https://www.nasa.gov/goddard/esc/exploration-and-space-communications-o2o' },
    lunarComms: { title: 'NASA NTRS — Lunar Communications and Navigation Architecture (PDF)', url: 'https://ntrs.nasa.gov/api/citations/20230016359/downloads/Lunar%20Communications%20and%20Navigation%20Architecture.pdf' },
    alsj11: { title: 'Apollo Lunar Surface Journal — Apollo 11 landing', url: 'https://apollojournals.org/alsj/a11/a11.landing.html' },
    diviner: { title: 'NASA — LRO Diviner: temperature variation on the Moon (PDF)', url: 'https://science.nasa.gov/wp-content/uploads/2024/01/lrolitho7temperaturevariation27may2014.pdf' },
    bvad: { title: 'NASA — Life Support Baseline Values and Assumptions (BVAD) Rev2, 2022 (PDF)', url: 'https://ntrs.nasa.gov/api/citations/20210024855/downloads/BVAD_2.15.22-final.pdf' },
    issWater: { title: 'NASA — Space Station water recovery milestone (98%)', url: 'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/' },
    axemu: { title: 'NASA — Commercial spacesuit providers (AxEMU)', url: 'https://www.nasa.gov/suits-and-rovers/commercial-spacesuit-providers/' },
    radiation: { title: 'NASA Science — Protecting astronauts from radiation at the Moon', url: 'https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/' },
    artemis2: { title: 'NASA — Artemis II crew returns (Apr 10, 2026)', url: 'https://www.nasa.gov/news-release/nasa-welcomes-record-setting-artemis-ii-moonfarers-back-to-earth/' },
    sls: { title: 'NASA — Space Launch System', url: 'https://www.nasa.gov/reference/space-launch-system/' },
    oig: { title: 'NASA OIG — Artemis program cost report IG-22-003 (PDF)', url: 'https://oig.nasa.gov/docs/IG-22-003.pdf' },
    esm: { title: 'NASA — European Service Module', url: 'https://www.nasa.gov/reference/european-service-module/' },
    cev: { title: 'NASA JSC — CEV Trajectory Design for Lunar Missions (PDF)', url: 'https://ntrs.nasa.gov/api/citations/20080015975/downloads/20080015975.pdf' },
    altair: { title: 'NASA MSFC — Altair Descent and Ascent Trajectory Design (PDF)', url: 'https://ntrs.nasa.gov/api/citations/20100035768/downloads/20100035768.pdf' },
    ascent: { title: 'NASA — Lunar Ascent and Rendezvous Trajectory Design (PDF)', url: 'https://ntrs.nasa.gov/api/citations/20080009584/downloads/20080009584.pdf' },
    mdl: { title: 'NASA Goddard — Mission Design Lab', url: 'https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/' },
    // Phases 6 and 7
    lcross: { title: 'NASA Science — LCROSS (water found in Cabeus crater, 2009)', url: 'https://science.nasa.gov/mission/lcross/' },
    skipEntry: { title: 'NASA — Orion to test new entry technique (skip entry) on Artemis I', url: 'https://www.nasa.gov/missions/orion-spacecraft-to-test-new-entry-technique-on-artemis-i-mission/' },
    artemis1Entry: { title: 'NASA NTRS — Orion Artemis I Entry Performance, AAS 24-174 (PDF)', url: 'https://ntrs.nasa.gov/api/citations/20240000024/downloads/AAS_24_174_Orion_Artemis_I_Entry_Performance.pdf' },
    artemis1Test: { title: 'NASA NTRS — Artemis I test flight buys down risk, IAC 2023 (PDF)', url: 'https://ntrs.nasa.gov/api/citations/20230012789/downloads/IAC%202023Artemis%20I%20paper-FINALSTRIVES.pdf' },
    avcoat: { title: 'NASA — Cause of the Artemis I Orion heat shield char loss', url: 'https://www.nasa.gov/missions/artemis/nasa-identifies-cause-of-artemis-i-orion-heat-shield-char-loss/' },
    artemis2Shield: { title: 'NASA — Analysis confirms Artemis II heat shield performance', url: 'https://www.nasa.gov/missions/artemis/artemis-2/rigorous-analysis-confirms-nasas-artemis-ii-heat-shield-performance/' },
    orionFacts: { title: 'NASA — Orion fun facts (parachutes, splashdown speed)', url: 'https://www.nasa.gov/reference/orion-fun-facts/' },
  };

  /* Short facts shown in "Did you know?" chips. */
  const FACTS = {
    density: { text: 'The Moon\'s average density is 3,344 kg/m³ — more than 3 times denser than water (1,000 kg/m³). That is rock-and-metal territory.', src: 'nssdc' },
    crust: { text: 'NASA says the lunar crust is mostly oxygen, silicon, magnesium, iron, calcium and aluminum, plus small amounts of titanium, uranium, thorium, potassium and hydrogen.', src: 'moonfacts' },
    distance: { text: 'The Moon is on average 384,400 km away. Do the math: 384,400 km ÷ 299,792 km/s ≈ 1.3 seconds for light to get there.', src: 'moonfacts' },
    temps: { text: 'The lunar surface hits about 127 °C in sunlight and drops to about −173 °C in the dark.', src: 'moonfacts' },
    apolloSamples: { text: 'Apollo astronauts brought back 382 kg of Moon rocks and soil — about 2,200 samples from six sites (1969–1972).', src: 'samples' },
    lunaSamples: { text: 'Three robotic Soviet Luna probes returned about 300 g of lunar soil in total, from three more sites.', src: 'samples' },
    lro: { text: 'NASA\'s Lunar Reconnaissance Orbiter weighs about 1,000 kg and uses about 400 W. Its science payload capacity is only about 100 kg and 100 W — every gram counts.', src: 'lro' },
    lifecycle: { text: 'NASA projects start in "Pre-Phase A": define what you want to learn before you design any hardware.', src: 'seHandbook' },
    requirements: { text: 'At NASA, science goals decide the design. Your question picks the instruments — not the other way around.', src: 'sciMissions' },
    whipple: { text: 'A Whipple shield puts a thin "sacrificial" bumper in front of the wall. A tiny impactor shatters on it, so the shield protects with less mass than a thick solid plate.', src: 'hvit' },
    composite: { text: 'Plot twist: the Space Station chose graphite-epoxy racks to save weight, but NASA reports the savings "evaporated" once all the requirements were added. Lighter on paper is not always lighter in real life.', src: 'finckenor' },
    night: { text: 'A night at the lunar equator lasts about 354 hours (around 14 Earth days). Near the south pole some sites have at most about 100 hours of darkness (NASA lunar power study).', src: 'rps' },
    slsCap: { text: 'NASA\'s SLS rocket can send more than 27 t to the Moon (Block 1), 38 t (Block 1B) and up to 46 t to deep space (Block 2).', src: 'sls' },
    bvadDaily: { text: 'NASA plans for each astronaut to use 0.895 kg of oxygen, 0.800 kg of dry food and 3.217 kg of drinking water every day.', src: 'bvad' },
    waterRecovery: { text: 'In 2023 the Space Station reached 98% water recovery: crews drink recycled sweat and urine — after serious cleaning.', src: 'issWater' },
    apolloTransit: { text: 'Apollo 11 took about 76 hours to reach lunar orbit — a little over 3 days.', src: 'apollo11' },
    apollo17Stay: { text: 'Apollo 17 astronauts spent 75 hours on the Moon, the longest Apollo surface stay.', src: 'apollo17' },
    dvReserve: { text: 'NASA\'s Orion-era plan budgeted 1,450 m/s to head home from the Moon, including a 15 m/s reserve for surprises.', src: 'cev' },
    signalDelay: { text: 'Radio travels at the speed of light, about 300,000 km per second. A message to the Moon takes about 1.3 seconds, and the answer another 1.3.', src: 'moonfacts' },
    dsnSites: { text: 'NASA\'s Deep Space Network has three sites spread around the world, in California, near Madrid and near Canberra. Each has a 70 m dish, a 26 m dish and several 34 m dishes.', src: 'dsn' },
    blackout: { text: 'On Artemis II the crew lost contact for about 41 minutes while Orion was behind the Moon.', src: 'jplArtemisNet' },
    hoverCost: { text: 'Hovering is expensive: every second you hover over the Moon costs 1.62 m/s of delta-v, just to fight gravity.', src: 'nssdc' },
    apolloSites: { text: 'Apollo 11 found basalts rich in iron and titanium on the dark lava plains. Apollo 16 showed the bright highlands are anorthositic.', src: 'sampleScience' },
    poleEarth: { text: 'From the lunar south pole, Earth is visible only about half of every month. NASA plans relay satellites to fill the gaps.', src: 'lunarComms' },
    apollo11Fuel: { text: 'Armstrong flew past a boulder field near West Crater and landed with about 45 seconds of fuel left, including about 20 seconds kept for an abort.', src: 'alsj11' },
    coldestCraters: { text: 'NASA\'s Diviner instrument measured about 25 K (−250 °C) inside shadowed lunar craters: the coldest temperature measured in the solar system.', src: 'diviner' },
    apolloStack: { text: 'Reality check: Apollo 17\'s Command/Service Module (30,320 kg) plus Lunar Module (16,456 kg) sent about 46.8 t toward the Moon.', src: 'nssdcLm' },
    rocketEq: { text: 'Every extra kilogram needs extra fuel — and that fuel needs fuel too. This is the rocket equation, and it is why mass is everything in spaceflight.', src: 'game' },
  };

  /* ---------------- PHASE 0 ---------------- */
  const QUESTIONS = [
    { id: 'made', icon: '🪨', title: 'What is the surface made of?', blurb: 'Cheese is made of fats and proteins (carbon-based). Rock is made of minerals. Chemistry can tell them apart.', bestMeasure: 'chem' },
    { id: 'water', icon: '💧', title: 'Is there water ice?', blurb: 'NASA has found signs of water ice in permanently shadowed craters near the poles.', bestMeasure: 'chem', src: 'moonfacts' },
    { id: 'age', icon: '⏳', title: 'How old is the surface?', blurb: 'Labs on Earth can date rocks. Apollo 11 basalts are about 3.7 billion years old.', bestMeasure: 'sample', src: 'sampleScience' },
  ];

  const MEASURES = [
    { id: 'image', icon: '📷', title: 'Take pictures', strength: 1, strengthLabel: 'Clue', blurb: 'Color and texture are a hint, but cheese and rock can look alike from far away.', unlocks: ['camera'] },
    { id: 'chem', icon: '🧪', title: 'Measure the chemistry', strength: 2, strengthLabel: 'Good proof', blurb: 'An instrument reads which elements are there. Cheese is full of carbon; lunar rock is full of oxygen and silicon.', unlocks: ['camera', 'spectrometer', 'neutron'] },
    { id: 'sample', icon: '📦', title: 'Bring samples home', strength: 3, strengthLabel: 'Strongest proof', blurb: 'Labs on Earth can run every test. But you must carry the samples back — and that costs a lot of fuel.', unlocks: ['camera', 'spectrometer', 'neutron', 'sampler'] },
  ];

  const MISSION_TYPES = [
    { id: 'robotic', icon: '🤖', title: 'Robotic mission', blurb: 'Cheaper and no risk to people. Robots carry fewer tools and bring back much smaller samples.', fact: 'lunaSamples' },
    { id: 'crewed', icon: '👩‍🚀', title: 'Crewed mission', blurb: 'Astronauts can explore and collect far more, but you must keep them alive and bring them home.', fact: 'apolloSamples' },
  ];

  /* ---------------- REAL MATH CONSTANTS ---------------- */
  const MOON = { mass: 7.346e22, radiusKm: 1737.4, density: 3344, gravity: 1.62, distanceKm: 384400, src: 'nssdc' };
  const CONST = { G: 6.674e-11, c: 299792.458 /* km/s, exact by definition */ };
  const WATER_DENSITY = 1000; // kg/m³ — by definition of the kilogram/litre, common knowledge
  /* Battery sizing: energy E = P × t, battery mass = E / specific energy */
  const BATTERY = {
    specificEnergy: 150, // Wh/kg pack level; NASA cites ~245 Wh/kg best cells (techport), packs ~150-196
    survivalPower: 50,   // W night survival for a small lander, NASA design study (nightPower)
    src: 'nightPower',
  };

  /* ---------------- PHYSICS (simplified) ----------------
   * Delta-v per maneuver (m/s). Values from NASA Constellation-era studies.
   * TLI is performed by the rocket's upper stage, so rocket capacity is quoted as "mass to TLI".
   */
  const DV = {
    tli: { value: 3150, src: 'cev', label: 'Trans-lunar injection (rocket upper stage)' },
    loi: { value: 950, src: 'altair', label: 'Lunar orbit insertion (NASA range 890–950)' },
    descent: { value: 2074, src: 'altair', label: 'Powered descent to the surface' },
    ascent: { value: 1833, src: 'ascent', label: 'Ascent from the surface to lunar orbit' },
    tei: { value: 1450, src: 'cev', label: 'Trans-Earth injection (head home)' },
    direct: { value: 2600, src: 'nssdc', label: 'Straight home from the surface: lunar escape speed 2,380 m/s (NSSDC) + ~220 m/s losses (game value)' },
  };
  const ENGINE = {
    isp: 314,          // s — Apollo Service Propulsion System, 314.5 s (src: spsIsp)
    g0: 9.80665,       // m/s² standard gravity (definition)
    tankFraction: 0.08 // tanks + plumbing as a fraction of propellant mass — game value
  };

  /* Base hardware that always flies (kg, $M). Game values, scaled so an
   * Apollo-style stack lands near the real Apollo 17 mass (46.8 t toward the Moon). */
  const BASE = {
    robotic: {
      lander: { label: 'Lander core (computer, radio, engines)', mass: 250, cost: 150, power: 100 },
      returnCapsule: { label: 'Sample return capsule + 0.5 kg samples', mass: 40.5, cost: 60 },
    },
    crewed: {
      capsule: { label: 'Crew capsule with heat shield', mass: 3800, cost: 1000, costSrc: 'oig', power: 0 },
      serviceModule: { label: 'Service module (engines, structure)', mass: 3150, cost: 300, power: 0 },
      ascentCabin: { label: 'Lander ascent cabin', mass: 1500, cost: 700 },
      descentStage: { label: 'Lander descent stage', mass: 1300, cost: 800 },
      crewAllowance: { label: 'Crew & supplies (sized in Phase 2)', mass: 600, cost: 0 },
      samples: { label: 'Sample allowance (Apollo 17 brought ~110 kg)', mass: 100, cost: 0 },
      power: 900, // W baseline for avionics + life support (game value)
    },
  };

  /* Phase 1 subsystems. Each option has values per mission type.
   * mass in kg, power in W (+ = consumes, gen = generates), cost in $M.
   * For crewed missions "where" says which vehicle carries it:
   *   orbiter = capsule + service module (stays in lunar orbit, goes home)
   *   ascent  = lander cabin (goes down AND back up)
   *   descent = lander base (stays on the Moon)
   *   split   = half orbiter, half ascent
   * structure options use "frac": structure mass as a fraction of base hardware.
   */
  const SUBSYSTEMS = [
    {
      id: 'structure', icon: '🏗️', title: 'Structure', why: 'The skeleton of your spacecraft. Lighter materials cost more.',
      fact: 'composite',
      options: [
        { id: 'aluminum', title: 'Aluminum alloy', blurb: 'Proven, cheap, a bit heavy.', robotic: { mass: 120, cost: 10 }, crewed: { frac: 0.18, cost: 150 }, src: 'finckenor' },
        { id: 'composite', title: 'Graphite-epoxy composite', blurb: 'Lighter and stiff on paper, pricey to build. Savings can shrink in real designs.', robotic: { mass: 85, cost: 30 }, crewed: { frac: 0.13, cost: 450 }, src: 'game' },
      ],
    },
    {
      id: 'shield', icon: '🛡️', title: 'Micrometeoroid shield', why: 'Tiny rocks hit at several km/s. A good shield keeps holes out of your hull.',
      fact: 'whipple',
      options: [
        { id: 'solid', title: 'Solid aluminum plate', blurb: 'The "brute force" approach: thick and heavy.', protection: 2, robotic: { mass: 60, cost: 3 }, crewed: { mass: 700, cost: 30, where: 'orbiter' }, src: 'hvit' },
        { id: 'whipple', title: 'Whipple shield', blurb: 'A thin bumper in front of the wall. Same protection, less mass.', protection: 3, robotic: { mass: 30, cost: 10 }, crewed: { mass: 350, cost: 90, where: 'orbiter' }, src: 'hvit' },
        { id: 'stuffed', title: 'Stuffed Whipple (Nextel + Kevlar)', blurb: 'Extra fabric layers inside. Best protection per kg, highest cost.', protection: 4, robotic: { mass: 22, cost: 20 }, crewed: { mass: 250, cost: 180, where: 'orbiter' }, src: 'hvit' },
      ],
    },
    {
      id: 'thermal', icon: '🌡️', title: 'Thermal control', why: 'From about 127 °C in sunlight to about −173 °C in the dark. Your electronics must survive both.',
      fact: 'temps',
      options: [
        { id: 'passive', title: 'Passive (blankets + coatings)', blurb: 'Multi-layer blankets and reflective paint. Light, no power.', robotic: { mass: 25, cost: 5, power: 0 }, crewed: { mass: 300, cost: 40, power: 0, where: 'split' }, src: 'moonfacts' },
        { id: 'active', title: 'Active (heaters + radiators)', blurb: 'Pumps heat around. Handles extremes better, but uses power.', robotic: { mass: 45, cost: 20, power: 40 }, crewed: { mass: 450, cost: 120, power: 600, where: 'split' }, nightBonus: true, src: 'moonfacts' },
      ],
    },
    {
      id: 'power', icon: '⚡', title: 'Power', why: 'Everything needs electricity. The Sun disappears during the long lunar night.',
      fact: 'night',
      options: [
        { id: 'solarSmall', only: 'robotic', title: 'Solar panels + small battery', blurb: 'Light and cheap. The battery covers only a few hours — your lander sleeps at night and may not wake up.', robotic: { arrayMass: 50, batteryHours: 8, cost: 15, gen: 450, nightHours: 0 }, src: 'lunarPower' },
        { id: 'solarBig', only: 'robotic', title: 'Solar panels + big battery', blurb: 'Can ride out about 100 hours of dark — enough for some polar sites.', robotic: { arrayMass: 50, batteryHours: 100, cost: 30, gen: 450, nightHours: 100 }, src: 'lunarPower' },
        { id: 'rps', only: 'robotic', title: 'Solar + radioisotope generator', blurb: 'A nuclear battery like NASA\'s MMRTG (about 110 W, about 45 kg) keeps you powered all night. Very expensive.', robotic: { arrayMass: 50, batteryHours: 8, rpsMass: 45, cost: 110, gen: 450, nightGen: 110, nightHours: 9999 }, src: 'mmrtgSheet' },
        { id: 'crewSolar', only: 'crewed', title: 'Solar arrays', blurb: 'Wings like Orion\'s service module (4 wings, 11.2 kW). Light, but no Sun = no power.', crewed: { mass: 500, cost: 80, gen: 2500, where: 'orbiter' }, src: 'esaEsm' },
        { id: 'crewSolarBat', only: 'crewed', title: 'Solar arrays + big batteries', blurb: 'Batteries keep the orbiter powered when it passes through the Moon\'s shadow.', crewed: { mass: 900, cost: 150, gen: 2500, where: 'orbiter' }, src: 'esaEsm' },
        { id: 'fuelCells', only: 'crewed', title: 'Fuel cells (Apollo-style)', blurb: 'Hydrogen + oxygen make power — and drinking water as a bonus. Heavy.', crewed: { mass: 1100, cost: 200, gen: 3000, where: 'orbiter' }, src: 'nssdcCsm' },
      ],
    },
    {
      id: 'science', icon: '🔬', title: 'Science payload', why: 'Your instruments answer your question. Pick at least one that matches your Phase 0 measurement.',
      fact: 'lro', multi: true,
      options: [
        { id: 'camera', title: 'High-res camera', blurb: 'Shape, color and texture. Inspired by LRO\'s LROC.', strength: 1, robotic: { mass: 12, power: 15, cost: 25 }, crewed: { mass: 15, power: 15, cost: 25, where: 'descent' }, src: 'lro' },
        { id: 'spectrometer', title: 'Composition spectrometer', blurb: 'Reads which elements are in the soil. Cheese vs. rock, settled.', strength: 2, robotic: { mass: 18, power: 25, cost: 40 }, crewed: { mass: 20, power: 25, cost: 40, where: 'descent' }, src: 'moonfacts' },
        { id: 'neutron', title: 'Neutron detector', blurb: 'Finds hydrogen, a sign of water ice. Inspired by LRO\'s LEND.', strength: 2, forWater: true, robotic: { mass: 22, power: 15, cost: 30 }, crewed: { mass: 25, power: 15, cost: 30, where: 'descent' }, src: 'lro' },
        { id: 'sampler', title: 'Sample collector', blurb: 'Scoop + sealed box to bring soil home. The strongest proof.', strength: 3, robotic: { mass: 30, power: 40, cost: 35 }, crewed: { mass: 40, power: 0, cost: 20, where: 'ascent' }, src: 'samples' },
      ],
    },
  ];

  /* Rockets. Capacity = mass the rocket can send toward the Moon (to TLI). */
  const ROCKETS = {
    robotic: [
      { id: 'small', title: 'Small launcher', capacity: 1500, cost: 60, capSrc: 'game', costSrc: 'game', blurb: 'Commercial-class rocket. Cheap, but tiny capacity.' },
      { id: 'medium', title: 'Medium launcher', capacity: 4000, cost: 120, capSrc: 'game', costSrc: 'game', blurb: 'Commercial-class workhorse.' },
      { id: 'heavy', title: 'Heavy launcher', capacity: 12000, cost: 250, capSrc: 'game', costSrc: 'game', blurb: 'Commercial heavy-lift class. Lots of room.' },
    ],
    crewed: [
      { id: 'sls1', title: 'SLS Block 1', capacity: 27000, cost: 2200, capSrc: 'sls', costSrc: 'oig', blurb: 'Flew Artemis I and Artemis II. More than 27 t to the Moon.', factSrc: 'artemis2' },
      { id: 'sls1b', title: 'SLS Block 1B', capacity: 38000, cost: 2500, capSrc: 'sls', costSrc: 'game', blurb: 'Upgraded upper stage. 38 t to the Moon.' },
      { id: 'sls2', title: 'SLS Block 2', capacity: 46000, cost: 2800, capSrc: 'sls', costSrc: 'game', blurb: 'Most powerful version. Up to 46 t to deep space.' },
    ],
  };

  /* Budget ($M) by mission type and difficulty — game values. */
  const BUDGET = {
    robotic: { cadet: 650, engineer: 500, director: 420 },
    crewed: { cadet: 7700, engineer: 6400, director: 6300 },
  };
  const DIFFICULTIES = [
    { id: 'cadet', title: 'Cadet', blurb: 'Bigger budget. Hints on.' },
    { id: 'engineer', title: 'Engineer', blurb: 'Tight budget. The real challenge.' },
    { id: 'director', title: 'Flight Director', blurb: 'Every dollar counts.' },
  ];

  /* ---------------- PHASE 2: crew & life support ---------------- */
  const LIFE = {
    // Daily need per crew member (crew-day), NASA BVAD Rev2, Table 3-31 (nominal values)
    perCrewDay: { o2: 0.895, food: 0.800, water: 3.217, src: 'bvad' },
    crewMass: 82,        // kg, NASA BVAD Table 3-31 "standard 82 kg crewmember" (src: bvad)
    transitDays: 3,      // days each way Earth→Moon: Apollo 11 entered lunar orbit ~76 h after launch (src: apollo11)
    surfaceDays: 3,      // days on the surface: Apollo 17 stayed 75 h (src: apollo17); Phase 5 may change it
    crewMin: 1, crewMax: 4,
    daysMax: 30,
    landingCrewMax: 2,   // NASA's planned split: 2 crew descend, the rest wait in Orion in lunar orbit (src: artemisFaq)
    reserveOptions: [0, 0.2],
    recycler: { title: 'Water recycler', mass: 300, power: 300, cost: 120, recovery: 0.98, src: 'issWater',
      blurb: 'Cleans used water so the crew can drink it again. The Space Station recovers about 98% of its water.' }, // mass/power/cost: game values
    suits: [
      { id: 'light', title: 'Light EVA suit', mass: 90, evaHours: 4, cost: 20, shadowOk: false, blurb: 'Light and cheap. Short moonwalks, no deep-cold craters.' },
      { id: 'lunar', title: 'Lunar suit (AxEMU-style)', mass: 125, evaHours: 8, cost: 50, shadowOk: true, src: 'axemu', blurb: 'Built for lunar dust and at least 2 h in shadowed craters as cold as 48 K.' },
      { id: 'heavy', title: 'Heavy-duty suit', mass: 150, evaHours: 10, cost: 70, shadowOk: true, blurb: 'Extra protection and longest moonwalks. The heaviest.' },
    ], // suit masses are game values: NASA has not published an official lunar-suit mass
  };

  /* ---------------- PHASE 3: flight plan ---------------- */
  const FLIGHT = {
    marginOptions: [0, 0.05, 0.10, 0.15, 0.20],         // extra delta-v carried as reserve
    minMargin: { cadet: 0, engineer: 0.05, director: 0.10 }, // game rule; NASA's CEV TEI budget held a 15 m/s (~1%) propulsive reserve (src: cev)
    defaultMargin: 0,
  };

  /* ---------------- PHASE 4: communications ---------------- */
  const COMMS = {
    // Data rates are with a 34 m DSN dish. A bigger dish scales the radio rate by (D / 34)², like antenna gain. Laser links ignore the dish.
    links: [
      { id: 'sband', title: 'S-band radio', rateMbps: 2, contactHours: 8, src: 'game',
        blurb: 'Simple and reliable. A trickle of data.',
        robotic: { mass: 12, power: 40, cost: 10 }, crewed: { mass: 60, power: 150, cost: 30, where: 'orbiter' } },
      { id: 'ka', title: 'Ka-band high-gain antenna', rateMbps: 100, contactHours: 2.5, src: 'lro',
        blurb: 'Like NASA\'s LRO: 100 to 300 Mbps, up to about 900 Gb a day.',
        robotic: { mass: 30, power: 110, cost: 40 }, crewed: { mass: 120, power: 300, cost: 90, where: 'orbiter' } },
      { id: 'laser', title: 'Laser communications', rateMbps: 260, contactHours: 2.5, weatherRisk: true, optical: true, src: 'o2o', // optical: no radio dish, so no DSN dish gain
        blurb: 'Light instead of radio, like NASA\'s O2O on Artemis II: up to 260 Mbps. Clouds over the ground station can block it.',
        robotic: { mass: 28, power: 130, cost: 80 }, crewed: { mass: 90, power: 250, cost: 150, where: 'orbiter' } },
    ], // masses, power, costs and contact hours are game values
    dishes: [
      { id: 'dsn34', title: '34 m DSN antenna', diameter: 34, cost: { robotic: 5, crewed: 20 }, src: 'dsn', blurb: 'The everyday workhorse of the Deep Space Network.' },
      { id: 'dsn70', title: '70 m DSN antenna', diameter: 70, cost: { robotic: 15, crewed: 60 }, src: 'dsn', blurb: 'The biggest dish: about 4× the signal, but its time is precious.' },
    ], // costs are game values
    baseDiameter: 34,
    blackoutMin: 41,               // minutes out of contact while Orion passed behind the Moon on Artemis II (src: jplArtemisNet)
    perigeeKm: 363300, apogeeKm: 405500, // NSSDC Moon fact sheet (src: nssdc)
    dataPerDay: { camera: 300, spectrometer: 40, neutron: 5, sampler: 0, crewVideo: 50 }, // Gb per day — game values
  };

  /* ---------------- PHASE 5: landing ---------------- */
  const SITES = [
    { id: 'tranquility', title: 'Sea of Tranquility (Apollo 11)', terrain: 'Mare (dark lava plain)', rock: 'Basalt rich in iron and titanium, about 3.7 billion years old',
      darkHours: 354, lightHours: 354, hazard: 1, hoverNeed: 20, bestFor: ['made', 'age'], earthView: 'always', src: 'sampleScience',
      lola: 'Flat, gentle slopes', lroc: 'Few boulders', diviner: 'About 127 °C at noon, −173 °C at night' },
    { id: 'descartes', title: 'Descartes Highlands (Apollo 16)', terrain: 'Highlands (bright, old crust)', rock: 'Impact breccias of the bright anorthositic crust, about 3.8 to 4.2 billion years old',
      darkHours: 354, lightHours: 354, hazard: 2, hoverNeed: 35, bestFor: ['made'], earthView: 'always', src: 'sampleScience',
      lola: 'Rolling hills, steeper slopes', lroc: 'Many boulders and craters', diviner: 'About 127 °C at noon, −173 °C at night' },
    { id: 'southPole', title: 'South Pole crater rim', terrain: 'Polar (near shadowed craters)', rock: 'Regolith, with water ice hidden in permanently shadowed craters nearby',
      darkHours: 100, lightHours: 600, hazard: 3, hoverNeed: 50, bestFor: ['water'], earthView: 'intermittent', coldShadow: true, src: 'moonfacts',
      lola: 'Steep crater rims, long shadows', lroc: 'Hard to see: the Sun is always low', diviner: 'Shadowed craters reach about 25 K (−250 °C), among the coldest places measured in the solar system' },
  ]; // hazard, hoverNeed (seconds of hovering to dodge hazards) and lightHours at the pole are game values
  const LANDING = {
    baseHoverSec: 10,            // hover time already built into the descent budget — game value
    hoverShare: 0.3,             // share of the extra descent margin that can be spent hovering; the rest covers dispersion and landing errors — game value
    needSpread: 0.6,             // needed hover time varies ±30% around the site value — game value
    roughFraction: 0.6,          // with at least 60% of the needed hover time you land, but rough — game value
    difficultyFactor: { cadet: 0.5, engineer: 1, director: 1.2 },
  };

  /* ---------------- Random events (seeded, data-driven) ----------------
   * effect ops understood by the model: massGrowth (fraction of hardware), extraCost ($M), risk (+n), extraDays (+n)
   */
  const EVENTS = [
    { id: 'massGrowth', phases: [1, 3], title: 'Mass growth!', src: 'seHandbook',
      text: 'Engineers finished the detailed design and the hardware came out 5% heavier. NASA tracks this "mass growth" in every project.',
      choices: [
        { id: 'absorb', label: 'Accept it (+5% hardware mass)', effect: { massGrowth: 0.05 } },
        { id: 'redesign', label: 'Pay engineers to slim it down', effectByType: { robotic: { extraCost: 25 }, crewed: { extraCost: 250 } } },
      ] },
    { id: 'solarStorm', phases: [3], crewedOnly: true, title: 'Solar storm warning', src: 'radiation',
      text: 'The Sun is throwing out energetic particles. NASA plans for crews to build a shelter with the supplies they carry.',
      choices: [
        { id: 'shelter', label: 'Shelter behind food and water (lose 1 day)', effect: { extraDays: 1 } },
        { id: 'continue', label: 'Keep working (higher risk)', effect: { risk: 1 } },
      ] },
    { id: 'launchSlip', phases: [3], title: 'Launch delay', src: 'game',
      text: 'Bad weather at the launch site. The rocket waits on the pad and the team works overtime.',
      choices: [
        { id: 'wait', label: 'Wait for good weather (extra cost)', effectByType: { robotic: { extraCost: 10 }, crewed: { extraCost: 60 } } },
        { id: 'go', label: 'Launch in marginal weather (higher risk)', effect: { risk: 1 } },
      ] },
  ];
  const EVENT_CHANCE = { cadet: 0.3, engineer: 0.6, director: 0.9 }; // per phase — game values

  /* ---------------- PHASE 6: surface science ----------------
   * Only the instruments loaded in Phase 1 can be used. Each measurement costs time, power and data
   * and adds evidence. Power, hours, data and sample masses are game values.
   * Evidence levels: clue (camera) < composition (spectrometer, or hydrogen for the water question) < sample.
   */
  const SURFACE = {
    roboticHours: 6,          // h of surface operations for a robot in this game — game value
    roughLandingPenalty: 1,   // h lost after a rough landing (checking the lander) — game value
    // crewed hours = one moonwalk with the Phase 2 suit (suit.evaHours) — game value
    bufferGb: 5,              // onboard data buffer before it must be sent to Earth — game value
    sampleKg: { robotic: 0.25, crewed: 25 }, // kg per sample — game values
    // return capacity: robotic = sample allowance in the return capsule (0.5 kg), crewed = BASE.crewed.samples (100 kg)
    returnCapacityKg: { robotic: 0.5, crewed: 100 },
    maxActions: 60,           // safety cap on the saved action list
    instruments: {
      camera: { title: 'Take a picture', short: 'camera', icon: '📷', power: 10, hours: 0.5, dataGb: 1.2, evidence: 'clue', src: 'game' },
      spectrometer: { title: 'Read the elements', short: 'spectrometer', icon: '🧪', power: 40, hours: 1, dataGb: 0.4, evidence: 'composition', src: 'game' },
      neutron: { title: 'Look for hydrogen', short: 'hydrogen', icon: '💧', power: 30, hours: 1, dataGb: 0.2, evidence: 'composition', evidenceOtherwise: 'clue', onlyFor: 'water', src: 'game' },
      sampler: { title: 'Collect a sample', short: 'sample', icon: '📦', power: 0, hours: 1.5, dataGb: 0, evidence: 'sample', src: 'game' },
    },
    evidence: [
      { id: 'clue', rank: 1, chip: 'Clue +1', segment: 'Clue', meter: 'Evidence: Weak' },
      { id: 'composition', rank: 2, chip: 'Good proof +2', segment: 'Composition', meter: 'Evidence: Good' },
      { id: 'sample', rank: 3, chip: 'Strongest +3', segment: 'Sample', meter: 'Evidence: Strong' },
    ],
    // Points of interest per landing site (ids match SITES)
    pois: {
      tranquility: [
        { id: 'plain', title: 'Flat lava plain' },
        { id: 'crater', title: 'Small fresh crater' },
        { id: 'boulder', title: 'Lonely boulder' },
      ],
      descartes: [
        { id: 'ridge', title: 'Bright ridge' },
        { id: 'craterRim', title: 'Crater rim' },
        { id: 'boulder', title: 'White boulder' },
        { id: 'valley', title: 'Smooth valley floor' },
      ],
      southPole: [
        { id: 'rim', title: 'Sunlit crater rim' },
        { id: 'shadow', title: 'Edge of a permanently shadowed crater' },
        { id: 'slope', title: 'Gentle inner slope' },
      ],
    },
    // What each instrument finds at each site (NASA-sourced)
    regolith: { text: 'Gray dust and broken rock, made by impacts over billions of years.', src: 'moonfacts' },
    results: {
      tranquility: {
        camera: { text: 'Dark, flat terrain with craters. A picture alone can\'t tell what it\'s made of.', src: 'lro' },
        spectrometer: { text: 'Oxygen, silicon, magnesium, iron, calcium and aluminum, with small amounts of titanium and others.', src: 'moonfacts' },
        neutron: { text: 'Very little hydrogen here. This lava plain is dry.', src: 'lro' },
        sampler: { text: 'Dark basalt, rich in iron and titanium, about 3.7 billion years old.', src: 'sampleScience' },
      },
      descartes: {
        camera: { text: 'Bright, hilly ground full of craters. A picture alone can\'t tell what it\'s made of.', src: 'lro' },
        spectrometer: { text: 'Light-colored rock, typical of the highlands.', src: 'sampleScience' },
        neutron: { text: 'Very little hydrogen here. The highlands near the equator are dry.', src: 'lro' },
        sampler: { text: 'Anorthosite: a light rock from the Moon\'s old crust.', src: 'sampleScience' },
      },
      southPole: {
        camera: { text: 'Long shadows and a crater floor that never sees the Sun. A picture alone can\'t tell what it\'s made of.', src: 'moonfacts' },
        spectrometer: { text: 'Oxygen, silicon, magnesium, iron, calcium and aluminum, the same elements as the rest of the crust.', src: 'moonfacts' },
        neutron: { text: 'Hydrogen signal in a permanently shadowed crater. Water ice is possible.', src: 'lcross' },
        sampler: { text: 'Cold regolith from the crater edge. Labs on Earth can test it for water.', src: 'lcross' },
      },
    },
    hydrogenNote: { text: 'Hydrogen is a clue of water, not proof. In 2009 NASA\'s LCROSS impact found water in Cabeus crater, near the south pole.', src: 'lcross' },
    outcomes: {
      sample: { pose: 'wow', title: 'Samples in hand', sub: 'Real rock from the surface. Time to take it home.' },
      composition: { pose: 'thinking', title: 'Good clues, no sample', sub: 'Composition data is strong, but a sample would be stronger.' },
      clue: { pose: 'thinking', title: 'Pictures are clues', sub: 'We need composition or samples for proof.' },
    },
  };
  /* Phase 6 events. Rolled after a measurement. effect ops: hours (−n), risk (+n), noSignal (n measurements). */
  const SURFACE_EVENTS = [
    { id: 'surfaceStorm', crewedOnly: true, title: 'Solar storm: radiation rising', src: 'radiation',
      text: 'A solar storm is raising radiation levels. The crew can shelter behind food and water, which block some radiation.',
      choices: [
        { id: 'shelter', label: 'Shelter behind supplies', effect: { hours: -1 } },
        { id: 'keepWorking', label: 'Keep working', effect: { risk: 1 } },
      ] },
    { id: 'noSignal', title: 'Behind the Moon: no signal', src: 'jplArtemisNet',
      text: 'The spacecraft will be out of contact for about 41 minutes, as during Artemis II.',
      choices: [
        { id: 'wait', label: 'Wait for signal', effect: { hours: -1 } },
        { id: 'store', label: 'Keep measuring, store data', effect: { noSignal: 2 } },
      ] },
  ];
  const SURFACE_EVENT_CHANCE = { cadet: 0.1, engineer: 0.2, director: 0.3 }; // per measurement — game values

  /* ---------------- PHASE 7: return to Earth ----------------
   * Return burns use DV (ascent 1,833 + TEI 1,450 = 3,283 m/s for crews; 'direct' for robot sample capsules).
   * Each burn may need a little more than planned (navigation dispersion, game value): the Phase 3 margin covers it.
   * Reentry: heat load (game value) vs shield capacity (game value). Splashdown: seeded miss distance vs recovery zone.
   */
  const RETURN = {
    burns: { crewed: ['ascent', 'tei'], robotic: ['direct'] },
    stepLabels: { ascent: 'Liftoff from the Moon', tei: 'Earth return burn', direct: 'Liftoff straight home', reentry: 'Reentry', splashdown: 'Splashdown' },
    dispersion: { cadet: 0.02, engineer: 0.06, director: 0.10 }, // max extra delta-v a burn may need — game values
    entries: [
      { id: 'direct', title: 'Direct entry', pro: 'Simple. One pass through the atmosphere.', con: 'Less control over the landing spot.',
        precision: 'Lower', heatLoad: 1.0, missKm: 14, src: 'game' },
      { id: 'skip', title: 'Skip entry', pro: 'Bounces out, then re-enters. More control over the landing spot.', con: 'Two load peaks of about 4 g each. More complex.',
        precision: 'Higher', heatLoad: 1.3, missKm: 5, peaks: 2, src: 'skipEntry' },
    ], // heatLoad and missKm are game values
    shields: [
      { id: 'thin', title: 'Thin', capacity: 1.5, mass: { robotic: 0, crewed: 0 }, src: 'game' },
      { id: 'standard', title: 'Standard', capacity: 1.9, mass: { robotic: 2, crewed: 150 }, src: 'game' },
      { id: 'thick', title: 'Thick', capacity: 2.3, mass: { robotic: 4, crewed: 300 }, src: 'game' },
    ], // capacity (in heat-load units) and added kg are game values
    thermal: { okRatio: 1.4, lowRatio: 1.15, loadFactor: { cadet: 0.9, engineer: 1, director: 1.15 } }, // game values
    recoveryZoneKm: 10, minMissKm: 0.5, missFactor: { cadet: 0.6, engineer: 1, director: 1.2 }, // game values
    descope: { text: 'Descope: plan fewer days or a smaller crew, or pick a bigger rocket.', src: 'seHandbook' },
  };

  /* Short facts for Phases 6 and 7 */
  Object.assign(FACTS, {
    lcross: { text: 'In 2009 NASA\'s LCROSS crashed a rocket stage into Cabeus crater near the south pole and found water in the plume.', src: 'lcross' },
    skipRange: { text: 'Skip entry can reach up to 5,524 miles (4,800 nautical miles), compared with 1,725 miles for Apollo.', src: 'skipEntry' },
    entrySpeed: { text: 'Artemis I entered the atmosphere at about 24,581 mph (about 11 km/s).', src: 'artemis1Test' },
    avcoatHeat: { text: 'Orion\'s Avcoat heat shield faces about 2,760 °C (about 5,000 °F) during reentry.', src: 'avcoat' },
    artemis2Shield: { text: 'The Artemis II heat shield had 9 spots of char loss, compared with 103 on Artemis I. A shorter entry path reduced the damage.', src: 'artemis2Shield' },
    parachutes: { text: 'Parachutes slow Orion to about 17 mph (about 27 km/h) for splashdown.', src: 'orionFacts' },
    artemis1Landing: { text: 'Artemis I had to splash down within 5.4 nautical miles of its target, and it did.', src: 'artemis1Entry' },
    artemis2Landing: { text: 'Artemis II splashed down about 0.59 miles from its predicted point, off San Diego.', src: 'artemis2Shield' },
    surfaceBlackout: { text: 'On Artemis II the crew lost contact for about 41 minutes while Orion was behind the Moon.', src: 'jplArtemisNet' },
  });

  const DATA = { SURFACE, SURFACE_EVENTS, SURFACE_EVENT_CHANCE, RETURN, COMMS, SITES, LANDING, LIFE, FLIGHT, EVENTS, EVENT_CHANCE, CHARACTERS, SCENES, SCENE_ART, MOON, CONST, WATER_DENSITY, BATTERY, CHARACTER, SOURCES, FACTS, QUESTIONS, MEASURES, MISSION_TYPES, DV, ENGINE, BASE, SUBSYSTEMS, ROCKETS, BUDGET, DIFFICULTIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.SS_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
