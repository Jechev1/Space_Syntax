/**
 * Cifras de Space Syntax, copiadas para revisarlas contra fuentes de la NASA.
 * Este archivo NO está conectado al motor: el juego sigue leyendo js/data.js,
 * js/model.js y js/sim/p*.js.
 *
 * Cada entrada tiene value, unit, description, file, line y source.
 * source queda en "pendiente" hasta que una revisión lo cambie.
 * `note` es opcional y solo sirve a la revisión.
 * Las rutas son relativas a la carpeta Space_Syntax.
 */

const NASA = {
  diaLunar: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
  caminatas: 'https://ntrs.nasa.gov/api/citations/20200001071/downloads/20200001071.pdf',
  bufer: 'https://science.nasa.gov/mission/lro/spacecraft-and-instruments/',
  espectrometro: 'https://ntrs.nasa.gov/api/citations/20205000864/downloads/2020-04-14%2C%20VIPER%20Mission%20Overview%20(Andrews).pdf',
  hidrogeno: 'https://ntrs.nasa.gov/api/citations/20210012662/downloads/viper-2021-03-29.pdf',
  contacto: 'https://www.lpi.usra.edu/lunar/documents/SP-2013-605.pdf',
  presupuesto: 'https://oig.nasa.gov/wp-content/uploads/2024/02/ig-22-003.pdf',
};
const JUEGO = 'valor de juego';

function e(value, unit, description, file, line, note, source) {
  const row = { value, unit, description, file, line, source: source || 'pendiente' };
  if (note) row.note = note;
  return row;
}

export const missionConfig = {
  compartido: {
    luna: {
      masa: e(7.346e22, 'kg', 'Masa de la Luna, usada en densidad y gravedad.', 'js/data.js', 131),
      radio: e(1737.4, 'km', 'Radio medio de la Luna.', 'js/data.js', 131),
      densidad: e(3344, 'kg/m³', 'Densidad media de la Luna que muestra la fase 0.', 'js/data.js', 131),
      gravedad: e(1.62, 'm/s²', 'Gravedad lunar. Cada segundo de vuelo estacionario cuesta estos m/s de delta-v.', 'js/data.js', 131),
      distancia: e(384400, 'km', 'Distancia media Tierra-Luna. De aquí sale el retardo de la señal.', 'js/data.js', 131),
    },
    constantes: {
      G: e(6.674e-11, 'm³/kg·s²', 'Constante de gravitación, para comprobar g = GM/r².', 'js/data.js', 132),
      c: e(299792.458, 'km/s', 'Velocidad de la luz, para el retardo de ida a la Luna.', 'js/data.js', 132),
      densidadAgua: e(1000, 'kg/m³', 'Densidad del agua, solo para comparar con la Luna.', 'js/data.js', 133),
      gTierraTexto: e(9.81, 'm/s²', 'Gravedad de la Tierra escrita en la comparación de la fase 0.', 'js/model.js', 99, 'No es el g0 del motor (9.80665 m/s² en js/data.js:155).'),
    },
    motorNave: {
      isp: e(314, 's', 'Impulso específico del motor de la nave (Apolo SPS) en todas las maniobras después del TLI.', 'js/data.js', 154, 'No es el Isp de la etapa superior del lanzamiento (462 s en js/sim/p1.js:25). Son motores distintos.'),
      g0: e(9.80665, 'm/s²', 'Gravedad estándar de la ecuación del cohete, ve = Isp × g0.', 'js/data.js', 155, 'El texto de la fase 0 usa 9.81 m/s² (js/model.js:99).'),
      fraccionTanques: e(0.08, 'fracción', 'Masa de tanques y tuberías como fracción del propelente.', 'js/data.js', 156),
    },
    reloj: {
      horasPorDia: e(24, 'h', 'Día terrestre que usa el motor para pasar días de misión a horas.', 'js/model.js', 371, 'También en js/sim/p3.js y js/sim/p4.js. El comentario de p4.js:13 dice que el día lunar real es 24 h 50 min, y esa cifra no entra al cálculo.'),
      minutosExtraDelDiaLunar: e(50, 'min', 'Minutos extra del día lunar citado en un comentario: 24 h 50 min. El simulador no los usa y cuenta días de 24 h.', 'js/sim/p4.js', 13),
    },
  },

  fase0: {
    fuerzaDeLaMedicion: {
      fotos: e(1, 'puntos', 'Fuerza de "tomar fotos": pista.', 'js/data.js', 120, 'El mismo 1 es el rango de evidencia "clue" en la fase 6 (js/data.js:378).'),
      quimica: e(2, 'puntos', 'Fuerza de "medir la química": buena prueba.', 'js/data.js', 121, 'El mismo 2 es el rango "composition" (js/data.js:379).'),
      muestras: e(3, 'puntos', 'Fuerza de "traer muestras": prueba más fuerte.', 'js/data.js', 122, 'El mismo 3 es el rango "sample" (js/data.js:380).'),
    },
    edadCitada: e(3.7, 'Ga', 'Edad de los basaltos del Apolo 11, escrita en la pregunta de la fase 0. No entra al cálculo.', 'js/data.js', 116, 'Se repite en el sitio Sea of Tranquility (js/data.js:315).'),
  },

  fase1: {
    bateria: {
      energiaEspecifica: e(150, 'Wh/kg', 'Energía específica del paquete de baterías. Masa = potencia × horas / este valor. La ficha de la pantalla dice este mismo 150.', 'js/data.js', 140),
      potenciaDeSupervivencia: e(50, 'W', 'Potencia nocturna de un aterrizador pequeño, para dimensionar la batería.', 'js/data.js', 137),
    },
    hardwareBase: {
      robotico: {
        aterrizador: {
          masa: e(250, 'kg', 'Núcleo del aterrizador robótico: computadora, radio y motores.', 'js/data.js', 163),
          costo: e(150, 'millones USD', 'Costo del núcleo del aterrizador robótico.', 'js/data.js', 163),
          potencia: e(100, 'W', 'Potencia de aviónica del aterrizador robótico.', 'js/data.js', 163),
        },
        capsula: {
          masa: e(40.5, 'kg', 'Cápsula de retorno de muestras, muestras incluidas.', 'js/data.js', 164, 'El texto parte 40.5 kg en cápsula + 0.5 kg de muestras, pero el motor solo guarda 40.5. La capacidad de la fase 6 es 0.5 kg (js/data.js:369).'),
          costo: e(60, 'millones USD', 'Costo de la cápsula de retorno robótica.', 'js/data.js', 164),
          muestrasIncluidas: e(0.5, 'kg', 'Muestras incluidas en los 40.5 kg, según la etiqueta. No es un campo aparte.', 'js/data.js', 164),
        },
      },
      tripulado: {
        capsula: {
          masa: e(3800, 'kg', 'Cápsula de tripulación con escudo térmico.', 'js/data.js', 167),
          costo: e(1000, 'millones USD', 'Costo de la cápsula tripulada.', 'js/data.js', 167),
          potencia: e(0, 'W', 'La cápsula no suma potencia propia: la base tripulada va aparte.', 'js/data.js', 167),
        },
        moduloDeServicio: {
          masa: e(3150, 'kg', 'Módulo de servicio: motores y estructura.', 'js/data.js', 168),
          costo: e(300, 'millones USD', 'Costo del módulo de servicio.', 'js/data.js', 168),
        },
        cabinaDeAscenso: {
          masa: e(1500, 'kg', 'Cabina de ascenso del aterrizador.', 'js/data.js', 169),
          costo: e(700, 'millones USD', 'Costo de la cabina de ascenso.', 'js/data.js', 169),
        },
        etapaDeDescenso: {
          masa: e(1300, 'kg', 'Etapa de descenso del aterrizador. Se queda en la Luna.', 'js/data.js', 170),
          costo: e(800, 'millones USD', 'Costo de la etapa de descenso.', 'js/data.js', 170),
        },
        margenDeTripulacion: {
          masa: e(600, 'kg', 'Masa provisional de tripulación y víveres, hasta que la fase 2 la sustituye.', 'js/data.js', 171),
          costo: e(0, 'millones USD', 'El margen provisional de tripulación no cuesta.', 'js/data.js', 171),
        },
        muestras: {
          masa: e(100, 'kg', 'Cupo de muestras de la misión tripulada. La etiqueta dice este mismo 100 kg.', 'js/data.js', 176),
          costo: e(0, 'millones USD', 'El cupo de muestras no cuesta.', 'js/data.js', 172),
        },
        potenciaBase: e(900, 'W', 'Potencia base de aviónica y soporte vital en la misión tripulada.', 'js/data.js', 173),
      },
    },
    estructura: {
      aluminio: {
        masaRobotica: e(120, 'kg', 'Estructura de aluminio en la misión robótica.', 'js/data.js', 191),
        costoRobotico: e(10, 'millones USD', 'Costo de la estructura de aluminio robótica.', 'js/data.js', 191),
        fraccionTripulada: e(0.18, 'fracción', 'Estructura de aluminio como fracción de la masa base de cada vehículo tripulado.', 'js/data.js', 191, 'El motor la aplica por separado al orbitador, al ascenso y al descenso (js/model.js). El costo se cobra una sola vez, en el orbitador.'),
        costoTripulado: e(150, 'millones USD', 'Costo de la estructura de aluminio tripulada.', 'js/data.js', 191),
      },
      compuesto: {
        masaRobotica: e(85, 'kg', 'Estructura de grafito-epoxi en la misión robótica.', 'js/data.js', 192),
        costoRobotico: e(30, 'millones USD', 'Costo de la estructura compuesta robótica.', 'js/data.js', 192),
        fraccionTripulada: e(0.13, 'fracción', 'Estructura compuesta como fracción de la masa base tripulada.', 'js/data.js', 192),
        costoTripulado: e(450, 'millones USD', 'Costo de la estructura compuesta tripulada.', 'js/data.js', 192),
      },
    },
    escudo: {
      placa: {
        proteccion: e(2, 'puntos', 'Protección de la placa sólida de aluminio. No cambia el éxito de la misión.', 'js/data.js', 199),
        masaRobotica: e(60, 'kg', 'Masa del escudo de placa en la misión robótica.', 'js/data.js', 199),
        costoRobotico: e(3, 'millones USD', 'Costo del escudo de placa robótico.', 'js/data.js', 199),
        masaTripulada: e(700, 'kg', 'Masa del escudo de placa en el orbitador tripulado.', 'js/data.js', 199),
        costoTripulado: e(30, 'millones USD', 'Costo del escudo de placa tripulado.', 'js/data.js', 199),
      },
      whipple: {
        proteccion: e(3, 'puntos', 'Protección del escudo Whipple.', 'js/data.js', 200),
        masaRobotica: e(30, 'kg', 'Masa del Whipple robótico.', 'js/data.js', 200),
        costoRobotico: e(10, 'millones USD', 'Costo del Whipple robótico.', 'js/data.js', 200),
        masaTripulada: e(350, 'kg', 'Masa del Whipple tripulado.', 'js/data.js', 200),
        costoTripulado: e(90, 'millones USD', 'Costo del Whipple tripulado.', 'js/data.js', 200),
      },
      whippleRelleno: {
        proteccion: e(4, 'puntos', 'Protección del Whipple relleno. El medidor dibuja como máximo 4 puntos (js/app.js:301).', 'js/data.js', 201),
        masaRobotica: e(22, 'kg', 'Masa del Whipple relleno robótico.', 'js/data.js', 201),
        costoRobotico: e(20, 'millones USD', 'Costo del Whipple relleno robótico.', 'js/data.js', 201),
        masaTripulada: e(250, 'kg', 'Masa del Whipple relleno tripulado.', 'js/data.js', 201),
        costoTripulado: e(180, 'millones USD', 'Costo del Whipple relleno tripulado.', 'js/data.js', 201),
      },
    },
    termico: {
      repartoDeMasa: e(0.5, 'fracción', 'En control térmico "split", la mitad de la masa va al orbitador y la mitad al ascenso. Potencia y costo se quedan enteros en el orbitador.', 'js/model.js', 230),
      pasivo: {
        masaRobotica: e(25, 'kg', 'Mantas y recubrimientos, misión robótica.', 'js/data.js', 208),
        costoRobotico: e(5, 'millones USD', 'Costo del control térmico pasivo robótico.', 'js/data.js', 208),
        potenciaRobotica: e(0, 'W', 'El control pasivo robótico no consume potencia.', 'js/data.js', 208),
        masaTripulada: e(300, 'kg', 'Control térmico pasivo tripulado, antes de partirlo en dos.', 'js/data.js', 208),
        costoTripulado: e(40, 'millones USD', 'Costo del control térmico pasivo tripulado.', 'js/data.js', 208),
        potenciaTripulada: e(0, 'W', 'El control pasivo tripulado no consume potencia.', 'js/data.js', 208),
      },
      activo: {
        masaRobotica: e(45, 'kg', 'Calentadores y radiadores, misión robótica.', 'js/data.js', 209),
        costoRobotico: e(20, 'millones USD', 'Costo del control térmico activo robótico.', 'js/data.js', 209),
        potenciaRobotica: e(40, 'W', 'Potencia del control térmico activo robótico.', 'js/data.js', 209),
        masaTripulada: e(450, 'kg', 'Control térmico activo tripulado, antes de partirlo en dos.', 'js/data.js', 209),
        costoTripulado: e(120, 'millones USD', 'Costo del control térmico activo tripulado.', 'js/data.js', 209),
        potenciaTripulada: e(600, 'W', 'Potencia del control térmico activo tripulado. No se parte por la mitad.', 'js/data.js', 209),
      },
    },
    potencia: {
      solarPequena: {
        masaPaneles: e(50, 'kg', 'Paneles de la opción solar pequeña.', 'js/data.js', 216, 'Las tres opciones robóticas repiten estos 50 kg de paneles.'),
        horasBateria: e(8, 'h', 'Horas de batería de la opción solar pequeña.', 'js/data.js', 216, 'La opción nuclear robótica repite estas 8 h (js/data.js:218).'),
        costo: e(15, 'millones USD', 'Costo de paneles y batería pequeña.', 'js/data.js', 216),
        generacion: e(450, 'W', 'Potencia de los paneles en la opción solar pequeña.', 'js/data.js', 216, 'Las tres opciones robóticas generan 450 W.'),
        horasDeNoche: e(0, 'h', 'Esta opción no sobrevive la noche lunar.', 'js/data.js', 216),
      },
      solarGrande: {
        masaPaneles: e(50, 'kg', 'Paneles de la opción solar con batería grande.', 'js/data.js', 217),
        horasBateria: e(100, 'h', 'Horas de batería. Coincide con la noche del polo sur.', 'js/data.js', 217, 'La noche del sitio polo sur también es 100 h (js/data.js:321).'),
        costo: e(30, 'millones USD', 'Costo de paneles y batería grande.', 'js/data.js', 217),
        generacion: e(450, 'W', 'Potencia de los paneles en la opción de batería grande.', 'js/data.js', 217),
        horasDeNoche: e(100, 'h', 'Oscuridad que esta opción puede aguantar.', 'js/data.js', 217),
      },
      radioisotopo: {
        masaPaneles: e(50, 'kg', 'Paneles que acompañan al generador de radioisótopos.', 'js/data.js', 218),
        horasBateria: e(8, 'h', 'Batería de respaldo de la opción nuclear.', 'js/data.js', 218),
        masaRps: e(45, 'kg', 'Masa del generador tipo MMRTG.', 'js/data.js', 218, 'El texto de la misma opción dice unos 45 kg. Coincide.'),
        costo: e(110, 'millones USD', 'Costo de paneles más generador nuclear.', 'js/data.js', 218),
        generacion: e(450, 'W', 'Potencia de día, la de los paneles.', 'js/data.js', 218),
        generacionNocturna: e(110, 'W', 'Potencia del MMRTG durante la noche.', 'js/data.js', 218, 'El texto de la misma opción dice unos 110 W. Coincide.'),
        horasDeNoche: e(9999, 'h', 'Centinela de "sobrevive cualquier noche", no una duración real.', 'js/data.js', 218),
      },
      panelesTripulados: {
        alasCitadas: e(4, 'alas', 'Alas del módulo de servicio de Orión, citadas en el texto. No entran al cálculo.', 'js/data.js', 219),
        potenciaCitada: e(11.2, 'kW', 'Potencia de Orión citada en el texto de los paneles tripulados.', 'js/data.js', 219, 'La opción solo genera 2500 W (2.5 kW), no 11.2 kW.'),
        masa: e(500, 'kg', 'Masa de los paneles solares tripulados.', 'js/data.js', 219),
        costo: e(80, 'millones USD', 'Costo de los paneles tripulados.', 'js/data.js', 219),
        generacion: e(2500, 'W', 'Potencia que el juego asigna a los paneles tripulados.', 'js/data.js', 219, 'El texto de la misma línea dice 11.2 kW.'),
      },
      panelesConBaterias: {
        masa: e(900, 'kg', 'Paneles tripulados más baterías grandes.', 'js/data.js', 220),
        costo: e(150, 'millones USD', 'Costo de paneles y baterías tripuladas.', 'js/data.js', 220),
        generacion: e(2500, 'W', 'Potencia de paneles con baterías. Igual que los paneles solos.', 'js/data.js', 220),
      },
      celdasDeCombustible: {
        masa: e(1100, 'kg', 'Celdas de combustible al estilo Apolo.', 'js/data.js', 221),
        costo: e(200, 'millones USD', 'Costo de las celdas de combustible.', 'js/data.js', 221),
        generacion: e(3000, 'W', 'Potencia de las celdas de combustible.', 'js/data.js', 221),
      },
    },
    ciencia: {
      camara: {
        fuerza: e(1, 'puntos', 'Fuerza de la cámara de alta resolución.', 'js/data.js', 228),
        masaRobotica: e(12, 'kg', 'Masa de la cámara robótica.', 'js/data.js', 228),
        potenciaRobotica: e(10, 'W', 'Potencia de la cámara, igual al cargarla y al medir.', 'js/data.js', 232, null, JUEGO),
        costoRobotico: e(25, 'millones USD', 'Costo de la cámara robótica.', 'js/data.js', 228),
        masaTripulada: e(15, 'kg', 'Masa de la cámara tripulada.', 'js/data.js', 228),
        potenciaTripulada: e(10, 'W', 'Potencia de la cámara tripulada, igual al medir.', 'js/data.js', 232, null, JUEGO),
        costoTripulado: e(25, 'millones USD', 'Costo de la cámara tripulada.', 'js/data.js', 228),
      },
      espectrometro: {
        fuerza: e(2, 'puntos', 'Fuerza del espectrómetro de composición.', 'js/data.js', 229),
        masaRobotica: e(18, 'kg', 'Masa del espectrómetro robótico.', 'js/data.js', 229),
        potenciaRobotica: e(30, 'W', 'Potencia del espectrómetro, igual al cargarlo y al medir.', 'js/data.js', 233, null, NASA.espectrometro),
        costoRobotico: e(40, 'millones USD', 'Costo del espectrómetro robótico.', 'js/data.js', 229),
        masaTripulada: e(20, 'kg', 'Masa del espectrómetro tripulado.', 'js/data.js', 229),
        potenciaTripulada: e(30, 'W', 'Potencia del espectrómetro tripulado, igual al medir.', 'js/data.js', 233, null, NASA.espectrometro),
        costoTripulado: e(40, 'millones USD', 'Costo del espectrómetro tripulado.', 'js/data.js', 229),
      },
      neutrones: {
        fuerza: e(2, 'puntos', 'Fuerza del detector de neutrones. Sirve sobre todo a la pregunta del agua.', 'js/data.js', 230),
        masaRobotica: e(22, 'kg', 'Masa del detector de neutrones robótico.', 'js/data.js', 230),
        potenciaRobotica: e(2, 'W', 'Potencia del detector de hidrógeno, igual al cargarlo y al medir.', 'js/data.js', 234, null, NASA.hidrogeno),
        costoRobotico: e(30, 'millones USD', 'Costo del detector de neutrones robótico.', 'js/data.js', 230),
        masaTripulada: e(25, 'kg', 'Masa del detector de neutrones tripulado.', 'js/data.js', 230),
        potenciaTripulada: e(2, 'W', 'Potencia del detector de hidrógeno tripulado, igual al medir.', 'js/data.js', 234, null, NASA.hidrogeno),
        costoTripulado: e(30, 'millones USD', 'Costo del detector de neutrones tripulado.', 'js/data.js', 230),
      },
      recolector: {
        fuerza: e(3, 'puntos', 'Fuerza del recolector de muestras.', 'js/data.js', 231),
        masaRobotica: e(30, 'kg', 'Masa del recolector robótico.', 'js/data.js', 231),
        potenciaRobotica: e(40, 'W', 'Potencia del recolector robótico.', 'js/data.js', 231),
        costoRobotico: e(35, 'millones USD', 'Costo del recolector robótico.', 'js/data.js', 231),
        masaTripulada: e(40, 'kg', 'Masa del recolector tripulado. Viaja en la cabina de ascenso.', 'js/data.js', 231),
        potenciaTripulada: e(0, 'W', 'El recolector tripulado no consume potencia.', 'js/data.js', 231),
        costoTripulado: e(20, 'millones USD', 'Costo del recolector tripulado.', 'js/data.js', 231),
      },
    },
    cohetes: {
      pequeno: {
        capacidad: e(1500, 'kg', 'Masa que el lanzador pequeño puede enviar hacia la Luna (hasta TLI).', 'js/data.js', 239),
        costo: e(60, 'millones USD', 'Costo del lanzador pequeño.', 'js/data.js', 239),
      },
      medio: {
        capacidad: e(4000, 'kg', 'Capacidad del lanzador medio hacia la Luna.', 'js/data.js', 240),
        costo: e(120, 'millones USD', 'Costo del lanzador medio.', 'js/data.js', 240),
      },
      pesado: {
        capacidad: e(12000, 'kg', 'Capacidad del lanzador pesado hacia la Luna.', 'js/data.js', 241),
        costo: e(250, 'millones USD', 'Costo del lanzador pesado.', 'js/data.js', 241),
      },
      slsBloque1: {
        capacidad: e(27000, 'kg', 'Capacidad del SLS Bloque 1 hacia la Luna. El texto dice más de 27 t.', 'js/data.js', 244),
        costo: e(2200, 'millones USD', 'Costo del SLS Bloque 1.', 'js/data.js', 244),
      },
      slsBloque1B: {
        capacidad: e(38000, 'kg', 'Capacidad del SLS Bloque 1B. El texto dice 38 t.', 'js/data.js', 245),
        costo: e(2500, 'millones USD', 'Costo del SLS Bloque 1B.', 'js/data.js', 245),
      },
      slsBloque2: {
        capacidad: e(46000, 'kg', 'Capacidad del SLS Bloque 2. El texto dice hasta 46 t.', 'js/data.js', 246, 'La ficha del Apolo 17 dice que el conjunto real pesaba unas 46.8 t (js/data.js:108), por encima de esta capacidad.'),
        costo: e(2800, 'millones USD', 'Costo del SLS Bloque 2.', 'js/data.js', 246),
      },
    },
    presupuesto: {
      robotico: {
        cadete: e(650, 'millones USD', 'Presupuesto robótico en dificultad Cadete.', 'js/data.js', 252),
        ingeniero: e(500, 'millones USD', 'Presupuesto robótico en dificultad Ingeniero.', 'js/data.js', 252),
        director: e(420, 'millones USD', 'Presupuesto robótico en dificultad Director de vuelo.', 'js/data.js', 252, 'Ninguna dificultad vale 450. Las maquetas usan 450 millones (docs/pantallas-fase-0-1.md:61).'),
      },
      tripulado: {
        cadete: e(7700, 'millones USD', 'Presupuesto tripulado en dificultad Cadete.', 'js/data.js', 258, null, NASA.presupuesto),
        ingeniero: e(7000, 'millones USD', 'Presupuesto tripulado en dificultad Ingeniero.', 'js/data.js', 258, null, NASA.presupuesto),
        director: e(6300, 'millones USD', 'Presupuesto tripulado en dificultad Director de vuelo.', 'js/data.js', 258, null, NASA.presupuesto),
      },
    },
    deltaV: {
      tli: e(3150, 'm/s', 'Inyección translunar. La hace la etapa superior del cohete, no el motor de la nave.', 'js/data.js', 146),
    },
    etapaSuperior: {
      isp: e(462, 's', 'Isp de la etapa superior de hidrógeno en la simulación de lanzamiento.', 'js/sim/p1.js', 25, 'El motor de la nave, para el resto de quemas, es 314 s (js/data.js:154).'),
      duracionQuema: e(600, 's', 'Tiempo en que la etapa superior vacía sus tanques.', 'js/sim/p1.js', 26),
      estrellas: e([0, 0.1, 0.2], 'fracción de capacidad', 'Margen de masa para 1, 2 y 3 estrellas en el lanzamiento.', 'js/sim/p1.js', 28, 'El aviso de "menos del 10%" está otra vez, suelto, en js/model.js:813.'),
    },
    umbrales: {
      margenDeMasaBajo: e(0.1, 'fracción', 'Por debajo de este margen de masa el lanzamiento avisa, aunque todavía cabe.', 'js/model.js', 813, 'La primera estrella extra de la fase 1 usa el mismo 10% (js/sim/p1.js:28).'),
      medidorEnAmbar: e(0.8, 'fracción', 'El medidor pasa a ámbar al 80% del límite.', 'js/app.js', 146, 'La guía de pantallas dice lo mismo. No es el 80% del búfer de la fase 4.'),
      techoDelMedidor: e(1.2, 'fracción', 'La barra del medidor se dibuja como máximo al 120% del límite.', 'js/app.js', 145),
      nocheCualquiera: e(300, 'h', 'Por encima de estas horas de noche el chip dice "sobrevive cualquier noche".', 'js/app.js', 302, 'La noche ecuatorial del juego es 354 h (js/data.js:315). Un valor entre 300 y 353 h se anunciaría mal. Ninguna opción actual cae ahí.'),
      bandaMuertaDelMedidor: e(0.5, 'kg, millones USD o W', 'Cambio mínimo para dibujar la previsualización del medidor. La unidad depende del medidor.', 'js/app.js', 148),
    },
  },

  fase2: {
    porPersonaDia: {
      oxigeno: e(0.895, 'kg/persona·día', 'Oxígeno diario por tripulante, BVAD.', 'js/data.js', 264, 'El rótulo de la ecuación repite 0.895 en js/model.js:460. La pantalla lo redondea a 0.9 kg (js/app.js:436).'),
      comida: e(0.8, 'kg/persona·día', 'Comida seca diaria por tripulante, BVAD. En el código está escrita 0.800.', 'js/data.js', 264, 'El rótulo repite 0.800 en js/model.js:461. La pantalla dice unos 0.8 kg.'),
      agua: e(3.217, 'kg/persona·día', 'Agua de bebida diaria por tripulante, BVAD.', 'js/data.js', 264, 'El rótulo repite 3.217 en js/model.js:462. La pantalla lo redondea a 3.2 kg (js/app.js:436).'),
    },
    pantallaRedondeada: {
      oxigeno: e(0.9, 'kg/persona·día', 'Oxígeno que dice el texto de la pantalla, redondeado.', 'js/app.js', 436, 'El motor usa 0.895.'),
      comida: e(0.8, 'kg/persona·día', 'Comida que dice el texto de la pantalla.', 'js/app.js', 436, 'Coincide con 0.800 del motor.'),
      agua: e(3.2, 'kg/persona·día', 'Agua que dice el texto de la pantalla, redondeada.', 'js/app.js', 436, 'El motor usa 3.217.'),
    },
    tripulacion: {
      masaPorPersona: e(82, 'kg', 'Masa de un tripulante estándar.', 'js/data.js', 265),
      diasDeTransito: e(3, 'días', 'Días de ida y días de vuelta, cada tramo. La ficha dice estos mismos 3 días, 72 horas.', 'js/data.js', 271),
      diasEnSuperficie: e(3, 'días', 'Días previstos en la superficie. La ficha dice estos mismos 3 días, 72 horas.', 'js/data.js', 272),
      minimo: e(1, 'personas', 'Tripulación mínima.', 'js/data.js', 268),
      maximo: e(4, 'personas', 'Tripulación máxima.', 'js/data.js', 268),
      diasMaximos: e(30, 'días', 'Tope de días que el jugador puede planear.', 'js/data.js', 269),
      bajanComoMaximo: e(2, 'personas', 'Cuántos tripulantes bajan a la superficie. El resto espera en órbita.', 'js/data.js', 275),
      caminatas: e(4, 'caminatas', 'Caminatas por persona que baja. El total es caminatas × duración × quienes bajan.', 'js/data.js', 276, null, NASA.caminatas),
      reservaOpciones: e([0, 0.2], 'fracción', 'Reserva de víveres: nada, o 20% extra.', 'js/data.js', 271),
    },
    reciclador: {
      masa: e(300, 'kg', 'Masa del reciclador de agua.', 'js/data.js', 272),
      potencia: e(300, 'W', 'Potencia del reciclador de agua.', 'js/data.js', 272),
      costo: e(120, 'millones USD', 'Costo del reciclador de agua.', 'js/data.js', 272),
      recuperacion: e(0.98, 'fracción', 'Agua que el reciclador recupera. Solo actúa en el orbitador.', 'js/data.js', 272, 'La ficha de la estación espacial dice 98% (js/data.js:96). Es la misma cifra.'),
    },
    trajes: {
      ligero: {
        masa: e(90, 'kg', 'Masa del traje EVA ligero.', 'js/data.js', 275),
        horasEva: e(4, 'h', 'Duración de una caminata con el traje ligero.', 'js/data.js', 281, null, NASA.caminatas),
        costo: e(20, 'millones USD', 'Costo del traje ligero, por persona que baja.', 'js/data.js', 275),
      },
      lunar: {
        masa: e(125, 'kg', 'Masa del traje lunar tipo AxEMU.', 'js/data.js', 276),
        horasEva: e(8, 'h', 'Duración de una caminata con el traje lunar.', 'js/data.js', 282, null, NASA.caminatas),
        costo: e(50, 'millones USD', 'Costo del traje lunar, por persona que baja.', 'js/data.js', 276),
        horasEnSombraCitadas: e(2, 'h', 'Horas en cráter en sombra que promete el texto del traje. No limitan la caminata.', 'js/data.js', 276),
        temperaturaCitada: e(48, 'K', 'Frío del cráter en sombra según el texto del traje.', 'js/data.js', 276, 'El sitio del polo y la ficha Diviner dicen unos 25 K (js/data.js:107 y :322).'),
      },
      pesado: {
        masa: e(150, 'kg', 'Masa del traje de servicio pesado.', 'js/data.js', 277),
        horasEva: e(6, 'h', 'Duración de una caminata con el traje pesado.', 'js/data.js', 283, null, NASA.caminatas),
        costo: e(70, 'millones USD', 'Costo del traje pesado, por persona que baja.', 'js/data.js', 277),
      },
    },
    simulacion: {
      paso: e(0.25, 'días', 'Paso de la simulación de víveres. Cambia en qué momento del día se agota un suministro.', 'js/sim/p2.js', 27),
      probabilidadTormenta: e(0.35, 'probabilidad', 'Probabilidad de una tormenta solar no anunciada si la fase 3 no la jugó.', 'js/sim/p2.js', 28),
      retrasoTormenta: e(1, 'día', 'Día extra si la tormenta de la simulación no estaba anunciada.', 'js/sim/p2.js', 29, 'El evento de la fase 3 también cuesta 1 día (js/data.js:345).'),
      refugioPorPersona: e(10, 'kg', 'Comida más agua que hacen falta por persona para esconderse de la tormenta.', 'js/sim/p2.js', 30),
      aguaEnCircuito: e(3, 'días', 'Días de agua por persona que circulan en el reciclador y cuentan como masa de refugio.', 'js/sim/p2.js', 31),
      sobranteSeguro: e(0.1, 'fracción', 'Sobra a partir de la cual el puntaje de seguridad ya no sube.', 'js/sim/p2.js', 32),
      sobranteGratis: e(0.3, 'fracción', 'Sobra de víveres que todavía no cuenta como desperdicio.', 'js/sim/p2.js', 33),
      estrellas: e([0, 0.5, 0.9], 'puntaje', 'Puntaje de equilibrio de víveres para 1, 2 y 3 estrellas.', 'js/sim/p2.js', 34),
      estrellasRobot: e([0, 0.5, 1], 'puntaje', 'Estrellas de la fase 2 robótica, que no gasta víveres y siempre saca 1.', 'js/sim/p2.js', 84, 'No vive en el bloque TUNING. El umbral de 3 estrellas (1) no es el 0.9 de la misión tripulada.'),
    },
  },

  fase3: {
    deltaV: {
      loi: e(950, 'm/s', 'Inserción en órbita lunar. El comentario cita el rango NASA 890 a 950; el juego usa el extremo alto.', 'js/data.js', 147),
      descenso: e(2074, 'm/s', 'Descenso propulsado hasta la superficie.', 'js/data.js', 148, 'La fase 5 gasta una parte del margen de este delta-v en vuelo estacionario.'),
    },
    margen: {
      opciones: e([0, 0.05, 0.1, 0.15, 0.2], 'fracción', 'Reserva de delta-v que el jugador puede cargar. Multiplica todas las quemas planeadas.', 'js/data.js', 283),
      minimoCadete: e(0, 'fracción', 'Reserva mínima de delta-v en Cadete. Cero está permitido.', 'js/data.js', 284),
      minimoIngeniero: e(0.05, 'fracción', 'Reserva mínima de delta-v en Ingeniero.', 'js/data.js', 284),
      minimoDirector: e(0.1, 'fracción', 'Reserva mínima de delta-v en Director de vuelo.', 'js/data.js', 284, 'La ficha dice que el plan CEV guardaba 15 m/s, cerca del 1% de los 1450 m/s de regreso (js/data.js:99), no un 10%.'),
      porDefecto: e(0, 'fracción', 'Reserva de delta-v si el jugador no eligió otra.', 'js/data.js', 285),
    },
    eventos: {
      crecimientoDeMasa: e(0.05, 'fracción', 'La opción "aceptar" del evento de crecimiento de masa sube un 5% la masa del hardware.', 'js/data.js', 339, 'El evento puede salir en las fases 1 y 3.'),
      redisenoRobotico: e(25, 'millones USD', 'Costo de rediseñar para evitar el crecimiento de masa, misión robótica.', 'js/data.js', 340),
      redisenoTripulado: e(250, 'millones USD', 'Costo de rediseñar para evitar el crecimiento de masa, misión tripulada.', 'js/data.js', 340),
      diaDeRefugio: e(1, 'día', 'Día que se pierde al refugiarse de la tormenta solar.', 'js/data.js', 345, 'La simulación de la fase 2 usa el mismo día extra (js/sim/p2.js:29).'),
      riesgoPorSeguir: e(1, 'puntos', 'Riesgo que suma seguir trabajando durante la tormenta, o lanzar con mal tiempo.', 'js/data.js', 346, 'El mismo +1 está en el lanzamiento con mal tiempo (js/data.js:352).'),
      esperaRobotica: e(10, 'millones USD', 'Costo de esperar buen tiempo en el lanzamiento robótico.', 'js/data.js', 351),
      esperaTripulada: e(60, 'millones USD', 'Costo de esperar buen tiempo en el lanzamiento tripulado.', 'js/data.js', 351),
      probabilidad: {
        cadete: e(0.3, 'probabilidad', 'Probabilidad de evento por fase en Cadete.', 'js/data.js', 355),
        ingeniero: e(0.6, 'probabilidad', 'Probabilidad de evento por fase en Ingeniero.', 'js/data.js', 355),
        director: e(0.9, 'probabilidad', 'Probabilidad de evento por fase en Director de vuelo.', 'js/data.js', 355),
      },
    },
    umbralDeRiesgo: e(2, 'puntos', 'A partir de este riesgo acumulado la fase 3 avisa de que el éxito es menos probable.', 'js/model.js', 860),
    simulacion: {
      horasDeQuema: e(0.5, 'h', 'Cuánto dura cada quema en el reloj de la simulación.', 'js/sim/p3.js', 27),
      correccionMaxima: e(5, 'm/s', 'Tamaño máximo de una corrección de rumbo.', 'js/sim/p3.js', 28, 'Dos correcciones de 5 m/s caben en la reserva fija de 10 m/s.'),
      reservaDeNavegacion: e(0.02, 'fracción', 'Delta-v extra, un 2% de lo necesario, que el plan carga además del margen del jugador.', 'js/sim/p3.js', 29, 'Es igual a la dispersión de regreso de Cadete (js/data.js:455). Si una cambia, la otra no.'),
      reservaDeCorrecciones: e(10, 'm/s', 'Reserva fija que paga las dos correcciones de rumbo. No sale del margen del jugador.', 'js/sim/p3.js', 30),
      puntoDulce: e(0.05, 'fracción', 'Reserva que todavía suma al puntaje. Por encima, el sobrante pesa la mitad.', 'js/sim/p3.js', 33),
      pesoDelExceso: e(0.5, 'fracción', 'Peso con el que el exceso de reserva por encima del punto dulce resta puntaje.', 'js/sim/p3.js', 182),
      estrellas: e([0, 0.01, 0.025], 'fracción del delta-v necesario', 'Reserva útil para 1, 2 y 3 estrellas del vuelo.', 'js/sim/p3.js', 34),
      horasDeToma: e(1, 'h', 'Duración dibujada de la toma de contacto al final del vuelo.', 'js/sim/p3.js', 85),
    },
    dibujo: {
      panzaDeLaRuta: e(70000, 'km', 'Cuánto se arquea la ruta dibujada. No es una altitud de vuelo.', 'js/sim/p3.js', 31),
      radioAlrededorDeLaLuna: e(9000, 'km', 'Radio del círculo dibujado alrededor de la Luna. No es una órbita.', 'js/sim/p3.js', 32, 'El radio real de la Luna en el juego es 1737.4 km (js/data.js:131).'),
      divisorDeOrbita: e(6, 'h/rad', 'Ritmo al que el punto dibuja la órbita lunar. Solo es animación.', 'js/sim/p3.js', 97),
    },
  },

  fase4: {
    enlaces: {
      bandaS: {
        tasa: e(2, 'Mbps', 'Tasa del radio en banda S con una antena de 34 m.', 'js/data.js', 292),
        horasDeContacto: e(8, 'h/día', 'Horas de contacto al día del enlace en banda S.', 'js/data.js', 292),
        masaRobotica: e(12, 'kg', 'Masa del radio en banda S robótico.', 'js/data.js', 294),
        potenciaRobotica: e(40, 'W', 'Potencia del radio en banda S robótico.', 'js/data.js', 294, 'La guía de pantallas hablaba de +10 W y 1 Gb (docs/api.md:352).'),
        costoRobotico: e(10, 'millones USD', 'Costo del radio en banda S robótico.', 'js/data.js', 294),
        masaTripulada: e(60, 'kg', 'Masa del radio en banda S tripulado.', 'js/data.js', 294),
        potenciaTripulada: e(150, 'W', 'Potencia del radio en banda S tripulado.', 'js/data.js', 294),
        costoTripulado: e(30, 'millones USD', 'Costo del radio en banda S tripulado.', 'js/data.js', 294),
      },
      bandaKa: {
        tasa: e(100, 'Mbps', 'Tasa del enlace en banda Ka con una antena de 34 m. El texto dice este mismo 100 Mbps.', 'js/data.js', 301),
        tasaAltaCitada: e(300, 'Mbps', 'Tope de banda Ka escrito en el texto. El enlace no puede elegir 300.', 'js/data.js', 296),
        horasDeContacto: e(2.5, 'h/día', 'Horas de contacto al día de la banda Ka.', 'js/data.js', 295),
        masaRobotica: e(30, 'kg', 'Masa de la antena Ka robótica.', 'js/data.js', 297),
        potenciaRobotica: e(110, 'W', 'Potencia de la antena Ka robótica.', 'js/data.js', 297, 'La guía de pantallas hablaba de +25 W y 4 Gb (docs/api.md:353).'),
        costoRobotico: e(40, 'millones USD', 'Costo de la antena Ka robótica.', 'js/data.js', 297),
        masaTripulada: e(120, 'kg', 'Masa de la antena Ka tripulada.', 'js/data.js', 297),
        potenciaTripulada: e(300, 'W', 'Potencia de la antena Ka tripulada.', 'js/data.js', 297),
        costoTripulado: e(90, 'millones USD', 'Costo de la antena Ka tripulada.', 'js/data.js', 297),
      },
      laser: {
        tasa: e(260, 'Mbps', 'Tasa del enlace láser. No mejora con el plato de la DSN.', 'js/data.js', 298),
        horasDeContacto: e(2.5, 'h/día', 'Horas de contacto al día del láser.', 'js/data.js', 298),
        masaRobotica: e(28, 'kg', 'Masa del terminal láser robótico.', 'js/data.js', 300),
        potenciaRobotica: e(130, 'W', 'Potencia del láser robótico.', 'js/data.js', 300, 'La guía de pantallas hablaba de +40 W y 8 Gb (docs/api.md:354).'),
        costoRobotico: e(80, 'millones USD', 'Costo del láser robótico.', 'js/data.js', 300),
        masaTripulada: e(90, 'kg', 'Masa del terminal láser tripulado.', 'js/data.js', 300),
        potenciaTripulada: e(250, 'W', 'Potencia del láser tripulado.', 'js/data.js', 300),
        costoTripulado: e(150, 'millones USD', 'Costo del láser tripulado.', 'js/data.js', 300),
      },
    },
    antenas: {
      diametroBase: e(34, 'm', 'Diámetro de referencia. La ganancia de radio escala con (D / 34)². El láser no escala.', 'js/data.js', 306, 'Es el mismo 34 m de la antena dsn34.'),
      dsn34: {
        diametro: e(34, 'm', 'Antena cotidiana de la Deep Space Network.', 'js/data.js', 303),
        costoRobotico: e(5, 'millones USD', 'Costo del tiempo de la antena de 34 m, misión robótica.', 'js/data.js', 303),
        costoTripulado: e(20, 'millones USD', 'Costo del tiempo de la antena de 34 m, misión tripulada.', 'js/data.js', 303),
      },
      dsn70: {
        diametro: e(70, 'm', 'Antena grande de la DSN. La ganancia respecto a 34 m es (70/34)².', 'js/data.js', 304),
        costoRobotico: e(15, 'millones USD', 'Costo del tiempo de la antena de 70 m, misión robótica.', 'js/data.js', 304),
        costoTripulado: e(60, 'millones USD', 'Costo del tiempo de la antena de 70 m, misión tripulada.', 'js/data.js', 304),
      },
      dsn26Citada: e(26, 'm', 'Antena de 26 m que la ficha menciona y el juego no ofrece.', 'js/data.js', 101),
    },
    geometria: {
      apagon: e(41, 'min', 'Minutos sin contacto al pasar detrás de la Luna.', 'js/data.js', 307, 'El mismo 41 está en el texto del evento de la fase 6 (js/data.js:439) y en las fichas (js/data.js:102 y :482).'),
      perigeo: e(363300, 'km', 'Distancia mínima Tierra-Luna, para el retardo más corto.', 'js/data.js', 308),
      apogeo: e(405500, 'km', 'Distancia máxima Tierra-Luna, para el retardo más largo.', 'js/data.js', 308),
    },
    datosPorDia: {
      camara: e(300, 'Gb/día', 'Datos diarios de la cámara mientras hay ciencia.', 'js/data.js', 309, 'No es el 1.2 Gb de una foto en la fase 6. Una es el ritmo del día y la otra es una medición.'),
      espectrometro: e(40, 'Gb/día', 'Datos diarios del espectrómetro.', 'js/data.js', 309, 'La medición de la fase 6 cuesta 0.4 Gb (js/data.js:373).'),
      neutrones: e(5, 'Gb/día', 'Datos diarios del detector de neutrones.', 'js/data.js', 309, 'La medición de la fase 6 cuesta 0.2 Gb (js/data.js:374).'),
      recolector: e(0, 'Gb/día', 'El recolector no genera datos diarios.', 'js/data.js', 309),
      videoDeTripulacion: e(50, 'Gb/día', 'Video diario que se suma solo en la misión tripulada.', 'js/data.js', 309),
    },
    estaciones: {
      goldstone: e(-116.9, 'grados este', 'Longitud de Goldstone, para repartir los pases.', 'js/sim/p4.js', 36, 'Repetida en tools/fixtures.js:195.'),
      madrid: e(-4.25, 'grados este', 'Longitud de Madrid.', 'js/sim/p4.js', 37, 'Repetida en tools/fixtures.js:195.'),
      canberra: e(148.98, 'grados este', 'Longitud de Canberra.', 'js/sim/p4.js', 38, 'Repetida en tools/fixtures.js:195.'),
    },
    simulacion: {
      buferRobotico: e(150, 'Gb', 'Almacén de a bordo, misión robótica. La fase 6 usa este mismo valor.', 'js/data.js', 377, null, NASA.bufer),
      buferTripulado: e(300, 'Gb', 'Almacén de a bordo, misión tripulada. La fase 6 usa este mismo valor.', 'js/data.js', 377, null, NASA.bufer),
      fallo: e(0.6, 'fracción', 'Por debajo del 60% de datos entregados, la fase 4 falla.', 'js/sim/p4.js', 26),
      perdidaDespreciable: e(0.001, 'fracción', 'Perder menos del 0.1% cuenta como no haber perdido nada.', 'js/sim/p4.js', 27),
      probabilidadDeNubes: e(0.3, 'probabilidad', 'Probabilidad de que las nubes bloqueen un pase del láser.', 'js/sim/p4.js', 28),
      colaRobotica: e(24, 'h', 'Día extra, al final, para vaciar lo que al robot le quede por enviar.', 'js/sim/p4.js', 29),
      paso: e(1 / 12, 'h', 'Paso de la simulación: 1/12 h, es decir 5 minutos.', 'js/sim/p4.js', 30),
      avisoDeBufer: e(0.8, 'fracción', 'Aviso cuando el búfer de comunicaciones llega al 80%.', 'js/sim/p4.js', 31, 'No es el ámbar del medidor de la fase 1, aunque el número coincida.'),
      estrellas: e([60, 90, 99], '% entregado', 'Porcentaje de datos entregados para 1, 2 y 3 estrellas.', 'js/sim/p4.js', 32),
      parcial: e(0.99, 'fracción', 'Por debajo del 99% entregado el resultado es parcial, aunque no falle.', 'js/sim/p4.js', 157, 'Es el mismo 99% de la tercera estrella (js/sim/p4.js:32), escrito otra vez como 0.99.'),
    },
  },

  fase5: {
    sitios: {
      tranquilidad: {
        noche: e(354, 'h', 'Noche en el Mar de la Tranquilidad.', 'js/data.js', 315, 'La ficha de la noche ecuatorial dice las mismas 354 h (js/data.js:93).'),
        dia: e(354, 'h', 'Horas de luz en el Mar de la Tranquilidad. El robot trabaja estas horas.', 'js/data.js', 321, null, NASA.diaLunar),
        peligro: e(1, 'puntos', 'Peligro del terreno en el Mar de la Tranquilidad. Escala de juego, de 1 a 3.', 'js/data.js', 315),
        vueloEstacionario: e(20, 's', 'Segundos de vuelo estacionario que este terreno suele pedir.', 'js/data.js', 315),
      },
      descartes: {
        noche: e(354, 'h', 'Noche en las tierras altas de Descartes.', 'js/data.js', 318),
        dia: e(354, 'h', 'Horas de luz en Descartes. El robot trabaja estas horas.', 'js/data.js', 324, null, NASA.diaLunar),
        peligro: e(2, 'puntos', 'Peligro del terreno en Descartes.', 'js/data.js', 318),
        vueloEstacionario: e(35, 's', 'Segundos de vuelo estacionario que Descartes suele pedir.', 'js/data.js', 318),
        edadMinima: e(3.8, 'Ga', 'Edad mínima de las brechas de Descartes, solo en el texto.', 'js/data.js', 317),
        edadMaxima: e(4.2, 'Ga', 'Edad máxima de las brechas de Descartes, solo en el texto.', 'js/data.js', 317),
      },
      poloSur: {
        noche: e(100, 'h', 'Noche más larga que el juego asigna al borde del polo sur.', 'js/data.js', 321, 'La batería grande también cubre 100 h (js/data.js:217). La ficha dice lo mismo (js/data.js:93).'),
        dia: e(600, 'h', 'Horas de luz en el polo sur. El robot trabaja estas horas.', 'js/data.js', 327, null, JUEGO),
        peligro: e(3, 'puntos', 'Peligro del terreno en el polo sur.', 'js/data.js', 321),
        vueloEstacionario: e(50, 's', 'Segundos de vuelo estacionario que el polo sur suele pedir.', 'js/data.js', 321),
      },
    },
    descenso: {
      reservaIncluida: e(10, 's', 'Segundos de vuelo estacionario que el descenso ya trae, sin usar el margen.', 'js/data.js', 325),
      parteDelMargen: e(0.3, 'fracción', 'Parte del margen extra de descenso que se puede gastar en quedarse quieto. El resto cubre errores.', 'js/data.js', 326),
      dispersion: e(0.6, 'fracción', 'La necesidad de vuelo estacionario varía un ±30% alrededor del valor del sitio (el factor va de 0.7 a 1.3).', 'js/data.js', 327),
      aterrizajeBrusco: e(0.6, 'fracción', 'Con al menos el 60% del tiempo necesario se aterriza, pero mal. Por debajo, se aborta.', 'js/data.js', 328),
      factorCadete: e(0.5, 'fracción', 'El Cadete necesita la mitad del vuelo estacionario del sitio.', 'js/data.js', 329),
      factorIngeniero: e(1, 'fracción', 'El Ingeniero usa el vuelo estacionario del sitio tal cual.', 'js/data.js', 329),
      factorDirector: e(1.2, 'fracción', 'El Director necesita un 20% más de vuelo estacionario.', 'js/data.js', 329),
    },
    aproximacion: {
      paso: e(0.1, 's', 'Paso de integración del descenso final.', 'js/sim/p5.js', 13),
      altitudInicial: e(300, 'm', 'Altitud al empezar la aproximación final.', 'js/sim/p5.js', 14, 'El demo la repite en demo/5b.js:136.'),
      velocidadVertical: e(-28, 'm/s', 'Velocidad vertical al empezar. Negativa: está bajando.', 'js/sim/p5.js', 15),
      velocidadLateral: e(8, 'm/s', 'Velocidad de lado al empezar la aproximación.', 'js/sim/p5.js', 16),
      desvioInicial: e(60, 'm', 'Distancia horizontal al punto de puntería al empezar.', 'js/sim/p5.js', 17),
      altitudDeEspera: e(100, 'm', 'Altitud a la que el módulo se queda quieto para elegir sitio.', 'js/sim/p5.js', 18),
      frenado: e(2, 'm/s²', 'Frenado extra, por encima de la gravedad, en la aproximación.', 'js/sim/p5.js', 19),
      aceleracionMaxima: e(3, 'veces g lunar', 'Aceleración del motor a plena potencia, en gravedades lunares. Son 4.86 m/s² con g = 1.62.', 'js/sim/p5.js', 20),
      masaMinimaRobotica: e(1000, 'kg', 'Por debajo de esta masa de descenso, el aterrizaje robótico avisa y sigue.', 'js/data.js', 332, null, JUEGO),
      masaMaximaRobotica: e(2500, 'kg', 'Por encima de esta masa de descenso, el aterrizaje robótico avisa y sigue.', 'js/data.js', 332, null, JUEGO),
      masaMinimaTripulada: e(15000, 'kg', 'Por debajo de esta masa de descenso, el aterrizaje tripulado avisa y sigue.', 'js/data.js', 333, null, JUEGO),
      masaMaximaTripulada: e(17000, 'kg', 'Por encima de esta masa de descenso, el aterrizaje tripulado avisa y sigue.', 'js/data.js', 333, null, JUEGO),
      contactoSeguro: e(2, 'm/s', 'Contacto seguro hasta esta velocidad, inclusive.', 'js/data.js', 336, null, NASA.contacto),
      contactoChoque: e(3, 'm/s', 'Por encima de esta velocidad el aterrizaje es un choque. Entre 2 y 3 m/s es brusco.', 'js/data.js', 336, null, NASA.contacto),
      caidaFinal: e(0.25, 'm/s²', 'Cuánto se acelera la caída final.', 'js/sim/p5.js', 26),
      segundosDeAborto: e(14, 's', 'Segundos de subida que se muestran después de abortar.', 'js/sim/p5.js', 27),
      avisoDeCombustible: e(20, '%', 'Porcentaje de combustible de la aproximación que enciende el aviso.', 'js/sim/p5.js', 28, 'El demo repite el 20 en demo/5b.js:130.'),
      estrellas: e([0, 15, 30], '% de combustible', 'Combustible que queda al tocar suelo para 1, 2 y 3 estrellas.', 'js/sim/p5.js', 29),
      velocidadLateralBase: e(0.8, 'm/s', 'Velocidad lateral de base mientras esquiva obstáculos.', 'js/sim/p5.js', 98),
      velocidadLateralPorPeligro: e(0.4, 'm/s', 'Velocidad lateral extra por cada punto de peligro del sitio.', 'js/sim/p5.js', 98),
    },
  },

  fase6: {
    tiempo: {
      horasRobotEcuatoriales: e(354, 'h', 'Horas de luz que trabaja un robot en un sitio ecuatorial. Ya no hay un turno fijo de 6 h.', 'js/data.js', 321, null, NASA.diaLunar),
      horasRobotPolo: e(600, 'h', 'Horas de luz que trabaja un robot en el polo.', 'js/data.js', 327, null, JUEGO),
      penalizacionBrusca: e(1, 'h', 'Horas que se pierden después de un aterrizaje brusco.', 'js/data.js', 364),
    },
    datos: {
      buferRobotico: e(150, 'Gb', 'Búfer de la superficie en una misión robótica. Es el mismo de la fase 4.', 'js/data.js', 377, null, NASA.bufer),
      buferTripulado: e(300, 'Gb', 'Búfer de la superficie en una misión tripulada. Es el mismo de la fase 4.', 'js/data.js', 377, null, NASA.bufer),
    },
    muestras: {
      robot: e(0.25, 'kg', 'Masa de cada muestra robótica.', 'js/data.js', 367, 'Con 0.5 kg de capacidad caben dos.'),
      tripulacion: e(25, 'kg', 'Masa de cada muestra tripulada.', 'js/data.js', 367, 'Con 100 kg de capacidad caben cuatro.'),
      capacidadRobot: e(0.5, 'kg', 'Muestras que la cápsula robótica puede traer.', 'js/data.js', 369, 'La maqueta de la fase 6 dibuja un tope de 6 kg (pantallas_fase_6_y_7.md:65).'),
      capacidadTripulada: e(100, 'kg', 'Muestras que la misión tripulada puede traer.', 'js/data.js', 369, 'Es el mismo cupo de la fase 1 (js/data.js:172).'),
    },
    topeDeAcciones: e(60, 'acciones', 'Tope de seguridad de la lista de acciones guardada.', 'js/data.js', 370),
    instrumentos: {
      camara: {
        potencia: e(10, 'W', 'Potencia de una foto. Es la misma de la cámara cargada en la fase 1.', 'js/data.js', 383, null, JUEGO),
        horas: e(0.5, 'h', 'Tiempo de una foto.', 'js/data.js', 372),
        datos: e(1.2, 'Gb', 'Datos de una foto.', 'js/data.js', 372),
      },
      espectrometro: {
        potencia: e(30, 'W', 'Potencia de una lectura de elementos. Es la misma del instrumento cargado.', 'js/data.js', 384, null, NASA.espectrometro),
        horas: e(1, 'h', 'Tiempo de una lectura del espectrómetro.', 'js/data.js', 373),
        datos: e(0.4, 'Gb', 'Datos de una lectura del espectrómetro.', 'js/data.js', 373),
      },
      hidrogeno: {
        potencia: e(2, 'W', 'Potencia de una búsqueda de hidrógeno. Es la misma del detector cargado.', 'js/data.js', 385, null, NASA.hidrogeno),
        horas: e(1, 'h', 'Tiempo de una búsqueda de hidrógeno.', 'js/data.js', 374),
        datos: e(0.2, 'Gb', 'Datos de una búsqueda de hidrógeno.', 'js/data.js', 374),
      },
      muestra: {
        potencia: e(0, 'W', 'Recoger una muestra no gasta potencia.', 'js/data.js', 375),
        horas: e(1.5, 'h', 'Tiempo de recoger una muestra.', 'js/data.js', 375),
        datos: e(0, 'Gb', 'Recoger una muestra no genera datos.', 'js/data.js', 375),
      },
    },
    evidencia: {
      pista: e(1, 'rango', 'Rango de una pista. Lo da la cámara, o el hidrógeno si la pregunta no es el agua.', 'js/data.js', 378),
      composicion: e(2, 'rango', 'Rango de una prueba de composición.', 'js/data.js', 379),
      muestra: e(3, 'rango', 'Rango de una muestra. Es la prueba más fuerte.', 'js/data.js', 380),
    },
    eventos: {
      horasDeRefugio: e(-1, 'h', 'Horas que se pierden si la tripulación se refugia de la tormenta en la superficie.', 'js/data.js', 435),
      riesgoPorSeguir: e(1, 'puntos', 'Riesgo si la tripulación sigue midiendo durante la tormenta.', 'js/data.js', 436),
      horasDeEspera: e(-41 / 60, 'h', 'Tiempo que se pierde al esperar la señal: los mismos 41 minutos del apagón.', 'js/data.js', 452),
      medicionesSinSenal: e(2, 'mediciones', 'Mediciones que se pueden guardar mientras no hay señal.', 'js/data.js', 442),
      probabilidad: {
        cadete: e(0.1, 'probabilidad', 'Probabilidad de evento por medición en Cadete.', 'js/data.js', 445),
        ingeniero: e(0.2, 'probabilidad', 'Probabilidad de evento por medición en Ingeniero.', 'js/data.js', 445),
        director: e(0.3, 'probabilidad', 'Probabilidad de evento por medición en Director de vuelo.', 'js/data.js', 445),
      },
    },
  },

  fase7: {
    deltaV: {
      ascenso: e(1833, 'm/s', 'Ascenso de la superficie a órbita lunar.', 'js/data.js', 149, 'Con el regreso a la Tierra (1450) suma 3283 m/s. La guía de la fase 7 usa esa suma y coincide.'),
      regreso: e(1450, 'm/s', 'Inyección de vuelta a la Tierra desde órbita lunar.', 'js/data.js', 150, 'La ficha dice que esos 1450 m/s ya incluyen 15 m/s de reserva (js/data.js:99). El juego suma encima el margen de la fase 3.'),
      directo: e(2600, 'm/s', 'Vuelta directa desde la superficie, para la cápsula robótica.', 'js/data.js', 151, 'La etiqueta lo parte en 2380 m/s de escape y unos 220 m/s de pérdidas.'),
      escapeCitado: e(2380, 'm/s', 'Velocidad de escape lunar citada dentro de la etiqueta del regreso directo.', 'js/data.js', 151),
      perdidasCitadas: e(220, 'm/s', 'Pérdidas de juego citadas dentro de la etiqueta del regreso directo.', 'js/data.js', 151, '2380 + 220 = 2600, que es el valor que usa el motor.'),
      reservaYaIncluida: e(15, 'm/s', 'Reserva que, según la ficha, ya va dentro de los 1450 m/s de regreso.', 'js/data.js', 99),
    },
    dispersion: {
      cadete: e(0.02, 'fracción', 'Delta-v extra máximo que una quema de regreso puede pedir en Cadete.', 'js/data.js', 455, 'Igual que la reserva de navegación de la fase 3 (js/sim/p3.js:29).'),
      ingeniero: e(0.06, 'fracción', 'Delta-v extra máximo de una quema de regreso en Ingeniero.', 'js/data.js', 455),
      director: e(0.1, 'fracción', 'Delta-v extra máximo de una quema de regreso en Director de vuelo.', 'js/data.js', 455),
    },
    entrada: {
      directa: {
        cargaTermica: e(1, 'unidades de carga', 'Carga térmica de la entrada directa, antes del factor de dificultad.', 'js/data.js', 458),
        error: e(14, 'km', 'Error de amerizaje de la entrada directa, antes del factor de dificultad.', 'js/data.js', 458),
      },
      skip: {
        cargaTermica: e(1.3, 'unidades de carga', 'Carga térmica de la entrada con rebote.', 'js/data.js', 460),
        error: e(5, 'km', 'Error de amerizaje de la entrada con rebote.', 'js/data.js', 460),
        picos: e(2, 'picos', 'Picos de carga de la entrada con rebote. El texto de la línea anterior dice unos 4 g cada uno; esos 4 g no son un campo.', 'js/data.js', 460),
      },
    },
    escudos: {
      fino: {
        capacidad: e(1.5, 'unidades de carga', 'Capacidad del escudo fino.', 'js/data.js', 463),
        masaRobotica: e(0, 'kg', 'El escudo fino no añade masa a la cápsula robótica.', 'js/data.js', 463),
        masaTripulada: e(0, 'kg', 'El escudo fino no añade masa a la cápsula tripulada.', 'js/data.js', 463),
      },
      estandar: {
        capacidad: e(1.9, 'unidades de carga', 'Capacidad del escudo estándar.', 'js/data.js', 464),
        masaRobotica: e(2, 'kg', 'Masa que el escudo estándar añade a la cápsula robótica.', 'js/data.js', 464),
        masaTripulada: e(150, 'kg', 'Masa que el escudo estándar añade a la cápsula tripulada.', 'js/data.js', 464),
      },
      grueso: {
        capacidad: e(2.3, 'unidades de carga', 'Capacidad del escudo grueso.', 'js/data.js', 465),
        masaRobotica: e(4, 'kg', 'Masa que el escudo grueso añade a la cápsula robótica.', 'js/data.js', 465),
        masaTripulada: e(300, 'kg', 'Masa que el escudo grueso añade a la cápsula tripulada.', 'js/data.js', 465),
      },
    },
    termico: {
      margenHolgado: e(1.4, 'veces la carga', 'A partir de aquí el margen térmico es suficiente.', 'js/data.js', 467),
      margenJusto: e(1.15, 'veces la carga', 'Entre este valor y 1.4 el margen es bajo. Por debajo, la entrada falla.', 'js/data.js', 467),
      factorCadete: e(0.9, 'fracción', 'La carga térmica baja un 10% en Cadete.', 'js/data.js', 467),
      factorIngeniero: e(1, 'fracción', 'La carga térmica no se ajusta en Ingeniero.', 'js/data.js', 467),
      factorDirector: e(1.15, 'fracción', 'La carga térmica sube un 15% en Director de vuelo.', 'js/data.js', 467),
    },
    amerizaje: {
      zona: e(10, 'km', 'Radio de la zona de recuperación. Fuera de ella el amerizaje falla.', 'js/data.js', 468, '5.4 millas náuticas, la exigencia del Artemis I citada en js/data.js:480, son unos 10.0 km. Puede ser la misma cifra en otra unidad.'),
      errorMinimo: e(0.5, 'km', 'Lo más cerca del blanco que el sorteo puede caer.', 'js/data.js', 468),
      factorCadete: e(0.6, 'fracción', 'El error de amerizaje se reduce en Cadete.', 'js/data.js', 468),
      factorIngeniero: e(1, 'fracción', 'El error de amerizaje no se ajusta en Ingeniero.', 'js/data.js', 468),
      factorDirector: e(1.2, 'fracción', 'El error de amerizaje crece un 20% en Director de vuelo.', 'js/data.js', 468),
    },
  },

  citas: {
    temperaturas: {
      dia: e(127, '°C', 'Temperatura de la superficie al sol, en la ficha y en los sitios. No entra al cálculo térmico.', 'js/data.js', 85, 'Los sitios la repiten, por ejemplo en js/data.js:316.'),
      noche: e(-173, '°C', 'Temperatura de la superficie a la sombra, en la ficha y en los sitios.', 'js/data.js', 85, 'Los sitios la repiten, por ejemplo en js/data.js:316.'),
      crater: e(25, 'K', 'Temperatura más baja citada para un cráter en sombra permanente.', 'js/data.js', 107, 'El traje habla de 48 K (js/data.js:276).'),
    },
    muestrasHistoricas: {
      apolo: e(382, 'kg', 'Muestras que los Apolo trajeron en total, según la ficha. No es el cupo del juego.', 'js/data.js', 86),
      numeroDeMuestrasApolo: e(2200, 'muestras', 'Número de muestras del programa Apolo, según la ficha.', 'js/data.js', 86),
      luna: e(300, 'g', 'Suelo lunar que trajeron las sondas Luna, según la ficha.', 'js/data.js', 87, 'La cápsula robótica del juego trae hasta 0.5 kg, más que estos 300 g.'),
    },
    lro: {
      masa: e(1000, 'kg', 'Masa del Lunar Reconnaissance Orbiter, según la ficha. No limita el juego.', 'js/data.js', 88),
      potencia: e(400, 'W', 'Potencia del LRO, según la ficha.', 'js/data.js', 88),
      carga: e(100, 'kg', 'Carga científica del LRO, según la ficha.', 'js/data.js', 88),
      potenciaDeCarga: e(100, 'W', 'Potencia de la carga científica del LRO, según la ficha.', 'js/data.js', 88),
    },
    duracionesHistoricas: {
      transito: e(72, 'h', 'Horas de ida que dice la ficha. Son 3 días del motor.', 'js/data.js', 497),
      estancia: e(72, 'h', 'Horas en la superficie que dice la ficha. Son 3 días del motor.', 'js/data.js', 498),
    },
    apolo17: {
      moduloDeMando: e(30320, 'kg', 'Masa del módulo de mando y servicio del Apolo 17, según la ficha.', 'js/data.js', 108),
      moduloLunar: e(16456, 'kg', 'Masa del módulo lunar del Apolo 17, según la ficha.', 'js/data.js', 108),
      conjunto: e(46.8, 't', 'Masa conjunta hacia la Luna que la ficha redondea. 30320 + 16456 kg son 46.776 t.', 'js/data.js', 108, 'El cohete más capaz del juego levanta 46 t (js/data.js:246).'),
    },
    combustibleApolo11: {
      restante: e(45, 's', 'Combustible que le quedó al Apolo 11 al aterrizar, según la ficha. El juego no lo usa.', 'js/data.js', 106),
      reservaDeAborto: e(20, 's', 'Segundos de ese combustible que se guardaban para abortar, según la ficha.', 'js/data.js', 106),
    },
    reentrada: {
      alcanceSkip: e(5524, 'millas', 'Alcance citado de la entrada con rebote. No es el error de 5 km del juego.', 'js/data.js', 475),
      alcanceApolo: e(1725, 'millas', 'Alcance citado de la entrada del Apolo.', 'js/data.js', 475),
      velocidad: e(24581, 'mph', 'Velocidad de entrada del Artemis I, según la ficha.', 'js/data.js', 476),
      velocidadEnKmS: e(11, 'km/s', 'La misma velocidad de entrada, redondeada en la ficha.', 'js/data.js', 476),
      temperaturaEscudo: e(2760, '°C', 'Temperatura que la ficha atribuye al escudo Avcoat.', 'js/data.js', 477),
      temperaturaEscudoF: e(5000, '°F', 'La misma temperatura del escudo, en grados Fahrenheit.', 'js/data.js', 477),
      zonasArtemis2: e(9, 'zonas', 'Zonas de pérdida de material en el escudo del Artemis II, según la ficha.', 'js/data.js', 478),
      zonasArtemis1: e(103, 'zonas', 'Zonas de pérdida de material en el escudo del Artemis I, según la ficha.', 'js/data.js', 478),
      paracaidasMph: e(17, 'mph', 'Velocidad de amerizaje con paracaídas, según la ficha.', 'js/data.js', 479),
      paracaidasKmH: e(27, 'km/h', 'La misma velocidad de amerizaje, en km/h.', 'js/data.js', 479),
      exigenciaArtemis1: e(5.4, 'millas náuticas', 'Lo máximo que el Artemis I podía alejarse del blanco, según la ficha.', 'js/data.js', 480, 'Son unos 10.0 km, el radio de la zona de recuperación del juego (js/data.js:468).'),
      errorArtemis2: e(0.59, 'millas', 'A qué distancia del punto previsto amerizó el Artemis II, según la ficha.', 'js/data.js', 481),
    },
  },

  maquetas: {
    presupuestoDePantalla: e(450, 'millones USD', 'Presupuesto que dibujan las guías de pantalla. No es ninguna dificultad del motor.', 'docs/pantallas-fase-0-1.md', 61, 'Se repite en pantallas_fase_6_y_7.md:66. El motor usa 420, 500 o 650 en robótico, y 6300, 7000 o 7700 en tripulado.'),
    masaDeRetorno: e(6, 'kg', 'Tope de masa de retorno dibujado en la guía de las fases 6 y 7.', 'pantallas_fase_6_y_7.md', 65, 'El motor usa 0.5 kg en robótico y 100 kg en tripulado.'),
    potenciaDePantalla: e(320, 'W', 'Potencia usada en el ejemplo de medidor de la guía de fases 6 y 7.', 'pantallas_fase_6_y_7.md', 67, 'No coincide con la generación del motor: 450 W robótico, 2500 o 3000 W tripulado.'),
    potenciaMaximaDePantalla: e(500, 'W', 'Tope de potencia del mismo medidor de ejemplo.', 'pantallas_fase_6_y_7.md', 67),
    masaTripuladaDePantalla: e(18400, 'kg', 'Masa tripulada que una pantalla antigua enseñaba, según la nota de la API.', 'docs/api.md', 348, 'La propia nota dice que el fixture real sale en unos 44035 kg.'),
    costoTripuladoDePantalla: e(412, 'millones USD', 'Costo tripulado de esa pantalla antigua.', 'docs/api.md', 348, 'La nota dice que el fixture con SLS Bloque 2 cuesta 6125 millones.'),
    potenciaTripuladaDePantalla: e(2.1, 'kW', 'Potencia tripulada de esa pantalla antigua.', 'docs/api.md', 348, 'La nota dice que el fixture necesita 940 W y genera 2500 W.'),
    deltaVDePantalla: e(6620, 'm/s', 'Delta-v que una pantalla mostraba.', 'docs/api.md', 350, 'La nota lo explica como 6307 m/s del plan tripulado por 1.05. El plan sin margen es 6307 m/s.'),
    deltaVTrasLoi: e(5357, 'm/s', 'Delta-v que las pantallas 5A y 5B mostraban.', 'docs/api.md', 351, 'La nota dice que no existe en el motor: es 6307 menos los 950 m/s de la órbita lunar.'),
    radioDePantallaW: e(10, 'W', 'Potencia que la pantalla sumaba al radio básico.', 'docs/api.md', 352, 'El radio en banda S gasta 40 W robótico o 150 W tripulado.'),
    radioDePantallaGb: e(1, 'Gb', 'Datos que la pantalla atribuía al radio básico.', 'docs/api.md', 352, 'Con la antena de 34 m el motor manda 57.6 Gb al día.'),
    kaDePantallaW: e(25, 'W', 'Potencia que la pantalla sumaba a la banda Ka.', 'docs/api.md', 353, 'La banda Ka gasta 110 W robótico o 300 W tripulado.'),
    kaDePantallaGb: e(4, 'Gb', 'Datos que la pantalla atribuía a la banda Ka.', 'docs/api.md', 353, 'Con la antena de 34 m el motor manda 900 Gb al día.'),
    laserDePantallaW: e(40, 'W', 'Potencia que la pantalla sumaba al láser.', 'docs/api.md', 354, 'El láser gasta 130 W robótico o 250 W tripulado.'),
    laserDePantallaGb: e(8, 'Gb', 'Datos que la pantalla atribuía al láser.', 'docs/api.md', 354, 'El motor manda 2340 Gb al día, y la antena no cambia esa cifra.'),
  },

  sinClasificar: {
    topeDeCuadros: e(200, 'cuadros', 'Máximo de cuadros de una simulación. Es un límite de animación, no un dato de misión.', 'js/sim/kit.js', 23),
    cuadrosDelLanzamiento: e(100, 'cuadros', 'Cuadros que muestrea la quema de lanzamiento.', 'js/sim/p1.js', 27),
    muestrasDeLaRuta: e(120, 'muestras', 'Muestras de la ruta dibujada en la fase 3.', 'js/sim/p3.js', 35),
    cuadrosDeComunicaciones: e(180, 'cuadros', 'Tope de cuadros de la línea de tiempo de comunicaciones.', 'js/sim/p4.js', 33),
    escalaDeAltitud: e(700, 'm', 'Tope de la escala de altitud. El descenso empieza a 300 m.', 'js/sim/p5.js', 123),
    escalaDeVelocidad: e(35, 'm/s', 'Tope de la escala de velocidad vertical.', 'js/sim/p5.js', 124),
    escalaLateral: e(100, 'm', 'Tope de la escala de desvío lateral.', 'js/sim/p5.js', 125),
    escalaDeReserva: e(12000, 'm/s', 'Tope de la escala de delta-v en la fase 3. No es una capacidad.', 'js/sim/p3.js', 42),
    kitDeInterfaz: {
      masa: e(420, 'kg', 'Masa de ejemplo del kit de interfaz. No es una masa del juego.', 'src/dev/DevUi.jsx', 29),
      masaMaxima: e(2000, 'kg', 'Tope de ejemplo del medidor de masa.', 'src/dev/DevUi.jsx', 29),
      costo: e(80, 'millones USD', 'Costo de ejemplo del kit de interfaz.', 'src/dev/DevUi.jsx', 30),
      costoMaximo: e(150, 'millones USD', 'Tope de ejemplo del medidor de costo.', 'src/dev/DevUi.jsx', 30),
      potencia: e(5, 'W', 'Potencia de ejemplo del kit de interfaz.', 'src/dev/DevUi.jsx', 31),
      potenciaMaxima: e(5, 'W', 'Tope de ejemplo del medidor de potencia.', 'src/dev/DevUi.jsx', 31),
    },
  },
};

/** Recorre las entradas. No lo usa el juego. */
export function eachEntry(node, visit, path = []) {
  if (!node || typeof node !== 'object') return;
  if (Object.prototype.hasOwnProperty.call(node, 'value') && node.source === 'pendiente' && node.file) {
    visit(node, path);
    return;
  }
  for (const key of Object.keys(node)) eachEntry(node[key], visit, path.concat(key));
}
