import { missionConfig as C } from '../data/mission.config.mjs'

const DIFF_KEY = {
  cadet: 'cadete',
  engineer: 'ingeniero',
  director: 'director',
}

const DIFF_LABEL = {
  cadet: 'Cadet',
  engineer: 'Engineer',
  director: 'Flight Director',
}

const NEUTRAL = 'A scientist needs proof.'

/** Cadet coaches before and after each step. Engineer only says what comes next. Flight Director gets none. */
const HINTS = {
  cadet: {
    0: {
      before: 'Cheese or rock is a chemistry question. Age needs a rock you can date.',
      after: 'Next: pick how strong the proof has to be.',
    },
    1: {
      before: 'Pictures are a clue. Chemistry is stronger. Samples are strongest.',
      after: 'Next: robots or people. That sets the budget.',
    },
    2: {
      before: 'Robots are cheaper, people can do more.',
      after: 'Phase 1 builds the lander around this choice.',
    },
  },
  engineer: {
    0: { after: 'Next: pick a measurement.' },
    1: { after: 'Next: robots or people.' },
    2: { after: 'Phase 1 builds the lander around this choice.' },
  },
}

export function speechFor(difficulty, view, answered) {
  const row = HINTS[difficulty] && HINTS[difficulty][view]
  if (!row) return NEUTRAL
  if (answered && row.after) return row.after
  if (!answered && row.before) return row.before
  return NEUTRAL
}

export function lessonFor(view, state) {
  const id = answerId(view, state)
  if (!id) return null
  if (view === 0) return questionLesson(id)
  if (view === 1) return measureLesson(id)
  return missionLesson(id, state.difficulty)
}

function answerId(view, state) {
  if (view === 0) return state.question || ''
  if (view === 1) return state.measure || ''
  return state.missionType || ''
}

function questionLesson(id) {
  if (id === 'made') {
    return pack(
      [
        line('Moon density', [bit(C.compartido.luna.densidad)]),
        line('Water density', [bit(C.compartido.constantes.densidadAgua)]),
        line('Chemistry proof', [bit(C.fase0.fuerzaDeLaMedicion.quimica)]),
      ],
      'Phase 1 has to fly an instrument that can tell rock from cheese.',
    )
  }
  if (id === 'water') {
    return pack(
      [
        line('Neutron detector', [bit(C.fase1.ciencia.neutrones.masaRobotica)]),
        line('Detector power', [bit(C.fase1.ciencia.neutrones.potenciaRobotica)]),
        line('South-pole night', [bit(C.fase5.sitios.poloSur.noche)]),
        line('Detector proof', [bit(C.fase1.ciencia.neutrones.fuerza)]),
      ],
      'Phase 5 has to reach a cold polar site, and Phase 1 has to fly a neutron detector.',
    )
  }
  if (id === 'age') {
    const lo = C.fase5.sitios.descartes.edadMinima
    const hi = C.fase5.sitios.descartes.edadMaxima
    return pack(
      [
        line('Apollo 11 basalts', [bit(C.fase0.edadCitada)]),
        line('Descartes breccia', [bit(lo, `${lo.value}–${hi.value} Ga`, hi)]),
        line('Sample proof', [bit(C.fase0.fuerzaDeLaMedicion.muestras)]),
        line('Apollo samples', [bit(C.citas.muestrasHistoricas.apolo)]),
      ],
      'Dating needs rocks on Earth, so later phases have to bring samples home.',
    )
  }
  return null
}

function measureLesson(id) {
  if (id === 'image') {
    return pack(
      [
        line('Picture proof', [bit(C.fase0.fuerzaDeLaMedicion.fotos)]),
        line('Camera mass', [bit(C.fase1.ciencia.camara.masaRobotica)]),
        line('Camera power', [bit(C.fase1.ciencia.camara.potenciaRobotica)]),
        line('Camera data', [bit(C.fase4.datosPorDia.camara)]),
      ],
      'A camera is only a clue, so Phase 6 can still leave the question open.',
    )
  }
  if (id === 'chem') {
    return pack(
      [
        line('Chemistry proof', [bit(C.fase0.fuerzaDeLaMedicion.quimica)]),
        line('Spectrometer mass', [bit(C.fase1.ciencia.espectrometro.masaRobotica)]),
        line('Spectrometer power', [bit(C.fase1.ciencia.espectrometro.potenciaRobotica)]),
        line('Spectrometer data', [bit(C.fase4.datosPorDia.espectrometro)]),
      ],
      'Phase 1 has to carry a spectrometer, and Phase 6 uses it on the surface.',
    )
  }
  if (id === 'sample') {
    return pack(
      [
        line('Sample proof', [bit(C.fase0.fuerzaDeLaMedicion.muestras)]),
        line('Robotic return', [bit(C.fase6.muestras.capacidadRobot)]),
        line('Crewed return', [bit(C.fase6.muestras.capacidadTripulada)]),
        line('Apollo samples', [bit(C.citas.muestrasHistoricas.apolo)]),
      ],
      'Coming home costs fuel, so Phase 1 and Phase 7 have to plan the return.',
    )
  }
  return null
}

function missionLesson(id, difficulty) {
  const key = DIFF_KEY[difficulty] || DIFF_KEY.engineer
  const label = DIFF_LABEL[difficulty] || DIFF_LABEL.engineer
  const robotic = C.fase1.presupuesto.robotico[key]
  const crewed = C.fase1.presupuesto.tripulado[key]
  const budgets = line('Budgets', [
    bit(robotic, `robotic ${money(robotic)}`),
    bit(crewed, `crewed ${money(crewed)}`),
  ])
  if (id === 'robotic') {
    const lo = C.fase5.aproximacion.masaMinimaRobotica
    const hi = C.fase5.aproximacion.masaMaximaRobotica
    return pack(
      [
        budgets,
        line('Descent mass band', [bit(lo, `${group(lo.value)}–${group(hi.value)} kg`, hi)]),
        line('Surface daylight', [bit(C.fase6.tiempo.horasRobotEcuatoriales)]),
        line('LRO mass', [bit(C.citas.lro.masa)]),
      ],
      'Phase 1 sizes a small lander to the robotic budget. Phase 2 packs no crew.',
    )
  }
  if (id === 'crewed') {
    const lo = C.fase5.aproximacion.masaMinimaTripulada
    const hi = C.fase5.aproximacion.masaMaximaTripulada
    return pack(
      [
        budgets,
        line('Descent mass band', [bit(lo, `${group(lo.value)}–${group(hi.value)} kg`, hi)]),
        line('EVAs', [bit(C.fase2.tripulacion.caminatas, `${C.fase2.tripulacion.caminatas.value} per person on the surface`)]),
        line('Apollo 17 lunar module', [bit(C.citas.apolo17.moduloLunar)]),
      ],
      'Phase 2 has to keep that crew alive, and Phase 1 has to lift them.',
    )
  }
  return null
}

function pack(lines, why) {
  const facts = lines.filter(Boolean).slice(0, 4)
  if (!facts.length || !why) return null
  return { facts, why }
}

function line(label, bits) {
  const clean = bits.filter(Boolean)
  if (!clean.length) return null
  return { label, bits: clean }
}

function bit(entry, text, also) {
  if (!entry || entry.value == null || entry.source == null) return null
  return {
    text: text || shown(entry),
    source: entry.source,
    file: entry.file,
    line: entry.line,
    also: also && also.source != null ? { source: also.source, file: also.file, line: also.line } : null,
  }
}

function shown(entry) {
  return `${group(entry.value)} ${unitName(entry.unit)}`
}

function money(entry) {
  return `$${group(entry.value)} million`
}

function group(value) {
  const n = Number(value)
  if (Number.isInteger(n)) return n.toLocaleString('en-US')
  return String(value)
}

function unitName(unit) {
  if (unit === 'puntos') return 'points'
  if (unit === 'millones USD') return 'million USD'
  if (unit === 'Gb/día') return 'Gb/day'
  return unit
}
