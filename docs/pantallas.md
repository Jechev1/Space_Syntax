# Pantallas

Guía para diseñar las pantallas del juego. Los textos de la interfaz van en inglés, tal como aparecen en el juego. Las explicaciones van en español. La versión jugable está en `index.html` y las capturas actuales en `screenshots/`.

**Estado de los diseños**

- Las pantallas 0 a 5B ya tienen mockups en `assets/`: `fase0.jpeg`, `fase1A.jpeg`, `fase1B.jpeg`, `fase2.jpeg`, `fase3A.jpeg`, `fase3B.jpeg`, `fase4.jpeg`, `fase5A.jpeg` y `fase5B.jpeg`. Es la skin por defecto. Esta guía no repite lo que ya se ve en ellos.
- Los datos que muestra cada pantalla están especificados en [api.md](api.md).
- Las fases 6 y 7 todavía no tienen mockups. Su guía completa está más abajo.

**Historia**

El protagonista es un chico sin nombre todavía. Su misión es llegar a la Luna completando minimisiones. Al principio cree que la Luna es de queso, lo prueba allá y descubre que no. Cada fase se juega como Poly Bridge: construyes, pulsas Play, miras si la simulación pasa o falla, y vuelves a intentar.

**Decisiones de esta guía**

- Se adopta la paleta morada y verde de la versión jugable.
- Los personajes se llaman por su rol, no por nombre.
- Todo dato real lleva chip `NASA source`. Todo número inventado para balancear lleva `Game value`.

## Reglas generales

- Tamaño base de fondos: 1536 x 1024, pensado para laptop de 1280 x 720 o más.
- Estilo: ilustración granulada en morados y azules, contorno oscuro, verde brillante como único color de acento.
- El texto siempre se lee sobre paneles oscuros semitransparentes, nunca directo sobre la ilustración.
- Un solo botón principal por pantalla, en verde, abajo a la derecha.
- Ningún estado se comunica solo con color. Siempre hay icono y texto.
- Las fases 0 a 5 pasan en la Tierra y en el viaje. Las fases 6 y 7 pasan en la Luna y en el regreso, y la Tierra solo aparece como destino.

### Colores

| Uso | Color |
|---|---|
| Fondo | `#1B1931` |
| Panel | `#2E2948` al 86% |
| Borde | `#463F69` |
| Texto | `#EDE9F6` |
| Texto secundario | `#B3ABCB` |
| Acento verde | `#A6E05F` |
| Hipótesis del queso | `#F1C75F` |
| Advertencia | `#F0B45E` |
| Error | `#EF7B7B` |

Tipografías: Fredoka para títulos y Nunito para texto.

### Escenas

| Pantalla | Fondo | Archivo |
|---|---|---|
| Inicio | Espacio | `assets/bg-space.jpg` |
| Intro | Plataforma de lanzamiento | `assets/bg-launch.jpg` |
| Fase 0 | Control de misión en la Tierra | `assets/bg-mission-control.jpg` por hacer |
| Fase 1 taller | Hangar de ensamblaje | `assets/bg-assembly.jpg` por hacer |
| Fase 1 cohete y revisión final | Plataforma de lanzamiento | `assets/bg-launch.jpg` |
| F6 sitio de mar o tierras altas | Superficie lunar gris, con cráteres y rocas | `assets/bg-moon-surface.jpg` por hacer |
| F6 cráter polar | Cráter en sombra, con un resplandor azul tenue | `assets/bg-polar-crater.jpg` por hacer |
| F6 eventos | Mismo fondo de superficie con capa oscura | Reutiliza el fondo del sitio |
| F6 cierre | Superficie con el contenedor de muestra | `assets/bg-moon-surface.jpg` |
| F7 línea de tiempo y pasos 1 y 2 | Espacio entre la Luna y la Tierra | `assets/bg-space.jpg` (reutilizado) |
| F7 reentrada | Cápsula con resplandor naranja en la atmósfera | `assets/bg-reentry.jpg` por hacer |
| F7 amerizaje | Océano con paracaídas abiertos | `assets/bg-splashdown.jpg` por hacer |
| F7 fallo | Capa oscura sobre el fondo anterior | Reutiliza |

Para usar un fondo nuevo basta con guardarlo en `assets/` y cambiar `SCENE_ART` y `SCENES` en `js/data.js`.

### Personajes

El protagonista es un chico sin nombre. El arte del personaje y sus poses están pendientes del compañero de arte. Mientras tanto el diálogo funciona sin pose.

| Personaje | Estado | Archivo |
|---|---|---|
| Protagonista | Arte y poses pendientes | Por definir |
| Ingeniería de nave | Por crear | `assets/characters/engineer.png` |
| Dinámica de vuelo | Por crear | `assets/characters/flight.png` |
| Ciencia y comunicaciones | Por crear | `assets/characters/science.png` |
| Ship computer | Sin imagen. Solo texto, sin avatar | No aplica |

## Elementos que se repiten

### Barra superior

Panel redondeado fijo arriba de todo, también al hacer scroll. Contiene el logo, seis medidores y a la derecha el botón de menú ☰.

Fases 0 a 5:

| Medidor | Ejemplo | Estado |
|---|---|---|
| ⚖️ Launch mass | `1,603 kg / 4,000` | Activo |
| 💰 Budget | `$270M / $450M` | Activo |
| ⚡ Power | `140 / 450 W` | Activo |
| 🚀 Delta-v | `Phase 3` | Bloqueado hasta la fase 3 |
| 📅 Days | `Phase 2` o `No crew` | Bloqueado hasta la fase 2 |
| 📡 Data | `Phase 4` | Bloqueado hasta la fase 4 |

En las fases 6 y 7 los medidores cambian según el contexto:

| Medidor | Fase 6 | Fase 7 |
|---|---|---|
| ⚖️ Mass | `Return mass 4.2 / 6 kg` | `Return mass 4.2 / 6 kg` |
| 💰 Budget | `$450M` restante | `$450M` restante |
| ⚡ Power | `320 / 500 W` | `No power draw` |
| 🚀 Delta-v | `Return reserve 3,283 m/s` | `Remaining 3,283 m/s` |
| 🧑‍🚀 EVA hours | `2 / 5 h` | `Crew safe` o `No EVA` |
| 📡 Data | `4.2 / 5 Gb` | `Sent 4.2 Gb` |

Cada medidor tiene una barra: verde hasta 80%, ámbar entre 80% y 100%, roja si se pasa. Al pasar el cursor sobre una opción, la barra muestra en rayado cuánto cambiaría, con un número como `+120 kg`, `+1.2 kg` o `−1 h`.

Los valores de ejemplo de las fases 6 y 7 son `Game value`, salvo el delta-v, que sale de la fase 3 y de estudios de NASA.

### Barra de fases

Debajo de la barra superior: `0 Goal`, `1 Spacecraft`, `2 Crew`, `3 Flight`, `4 Comms`, `5 Landing`, `6 Surface`, `7 Return`. La fase actual va en verde, las terminadas con check y las futuras apagadas.

### Diálogo del protagonista

Panel con avatar circular a la izquierda, rol en verde y una línea de texto de máximo 120 caracteres. Lleva una × para cerrarlo. El texto de la voz de a bordo usa el rol `Ship computer` y no lleva avatar.

### Tarjeta de opción

Icono, título, una o dos líneas de descripción y chips abajo. Seleccionada: borde verde y check verde en la esquina. Bloqueada: apagada, con candado y motivo.

Chips posibles:

- Masa, energía, datos y costo, como `⚖️ 83 kg`, `⚡ makes 450 W`, `💾 0.2 Gb` y `💰 $30M`.
- Efecto en el lanzamiento, como `🚀 +60 kg at launch`.
- Efecto de evidencia, como `Evidence: Clue +1`.
- Fuente: chip azul `NASA source ↗`. Valor inventado para el juego: chip amarillo `Game value`.

### Tarjeta de resultado

Aparece después de cada medición en la fase 6. Tiene el resultado en una o dos líneas, el nivel de evidencia y un chip `NASA source ↗` que abre el documento. Si el resultado es un dato de juego, usa el chip `Game value`.

### Barra inferior

Fija abajo. A la izquierda `← Back` y `? Help`. A la derecha el motivo si el botón está deshabilitado y el botón principal verde.

### Ventanas

Ventana centrada con título, texto y botón `Got it`. Se usa para fuentes, ayuda, menú, desglose de medidores, eventos y confirmar reinicio.

### Panel de matemática

Panel con borde punteado. Primero una frase en lenguaje simple, después filas de fórmula en amarillo y la cuenta con números. Se abre con el botón `▸ Show the math`.

## Pantallas 0 y 1

Los mockups `fase0.jpeg`, `fase1A.jpeg` y `fase1B.jpeg` ya muestran la composición, los títulos y los textos de estas pantallas. Aquí queda solo lo que los mockups no cubren: reglas, estados y contenido que cambia según las elecciones.

### Inicio e intro

- Inicio: el protagonista a la izquierda y el texto a la derecha. Título `Is the Moon made of cheese?` con "cheese" en verde.
- Dificultades: `Cadet` (bigger budget, hints on), `Engineer` (tight budget, the real challenge) y `Flight Director` (every dollar counts).
- Botones: `Start mission 🚀` principal, `Continue` solo si hay partida guardada, `How to play`, y abajo a la izquierda el enlace pequeño `Sources`.
- Intro: tres viñetas con el protagonista grande al centro, puntos de paginación, `Next →`, en la última `Define the mission →`, y `Skip intro`. El texto de las viñetas debe actualizarse a la historia nueva: cree que la Luna es de queso, nadie le cree, y va a probarlo con una misión real.

### Fase 0, objetivo de la misión

- El diálogo inicial plantea la hipótesis: está seguro de que la Luna es de queso, pero un científico necesita pruebas.
- Paso 1, `What do you want to find out?`: superficie (`What is the surface made of?`), hielo de agua (`Is there water ice?`) y edad (`How old is the surface?`).
- Paso 2, `What measurement would prove it?`: se activa al terminar el paso 1. Cada tarjeta muestra una barra de fuerza de prueba de 1 a 3: `Take pictures` es Clue, `Measure the chemistry` es Good proof y `Bring samples home` es Strongest proof. Si la medición elegida es débil para la pregunta, aparece un aviso `Tip` con la mejor opción.
- Paso 3, `Robots or people?`: `Robotic mission` es más barata y sin riesgo, pero lleva menos herramientas. `Crewed mission` recoge mucho más, pero hay que mantener vivos a los astronautas y traerlos de vuelta.
- Panel de matemática `🧮 Test the hypothesis before you even launch`: densidad de la Luna con V = 4/3 · π · r³ y ρ = M / V, resultado 3,344 kg/m³, y gravedad con g = G · M / r², resultado 1.62 m/s².
- Ficha de misión en la columna derecha: `Hypothesis: "The Moon is made of cheese."` en amarillo, Question, Measurement, Mission y Proof strength. Los requisitos se generan solos, por ejemplo `Carry: Composition spectrometer or Neutron detector`. Debajo, dos datos `Did you know?`.
- Botones: `← Home` y `Lock in goal →`. Si falta algo, el motivo dice `Pick a question`, `Pick a measurement` o `Pick a mission type`.

### Fase 1, taller de la nave

- Pestañas: `🏗️ Structure`, `🛡️ Micrometeoroid shield`, `🌡️ Thermal control`, `⚡ Power` y `🔬 Science payload`. Cada una lleva check verde si está elegida o un punto ámbar si falta.
- Vista de la nave: dibujo lateral en un panel de 640 x 360. Misión robótica: un módulo de aterrizaje. Misión tripulada: orbitador a la izquierda y módulo de aterrizaje a la derecha, con una línea punteada `docks in lunar orbit`. La parte de la pestaña activa se resalta en verde y el resto se apaga. Debajo va una línea que explica para qué sirve la pestaña y la frase `Every 1 kg added to your lander costs about 3.0 kg at launch`.

| Pestaña | Opciones |
|---|---|
| Structure | Aluminum alloy, Graphite-epoxy composite |
| Micrometeoroid shield | Solid aluminum plate, Whipple shield, Stuffed Whipple |
| Thermal control | Passive, Active |
| Power robótica | Solar panels + small battery, Solar panels + big battery, Solar + radioisotope generator |
| Power tripulada | Solar arrays, Solar arrays + big batteries, Fuel cells |
| Science payload | High-res camera, Composition spectrometer, Neutron detector, Sample collector |

- En Science payload se pueden elegir varias. Las que no sirven para la medición de la fase 0 aparecen bloqueadas con `🔒 Your Phase 0 measurement doesn't need this`. La que responde la pregunta lleva el chip `✓ answers your question`.
- En Power robótica aparece el panel `🔋 Batteries: real math`, con E = P · t para 100 h y para 354 h de noche lunar.
- Columna derecha: panel `YOUR SPACECRAFT` con hardware, combustible y masa de lanzamiento, la frase `Fuel is 198% of your hardware mass.`, el botón `Show the math: why so much fuel?` que abre la tabla de la ecuación del cohete maniobra por maniobra, y el panel `EQUIPMENT LIST` con `Show parts list (MEL)`.
- Botones: `← Phase 0` y `Choose rocket →`. Motivos posibles: `Still to choose: Power, Science payload` o `Add an instrument that answers your Phase 0 question`.

### Fase 1, elegir cohete

- Arriba, una franja con `Hardware + Fuel for the Moon trip = Rocket must lift`.
- Tres tarjetas de cohete, cada una con dibujo vertical de 120 x 320 y un medidor al lado que se llena según la masa.

| Misión | Cohetes | Capacidad | Costo |
|---|---|---|---|
| Robótica | Small launcher, Medium launcher, Heavy launcher | 1.5 t, 4 t, 12 t | $60M, $120M, $250M |
| Tripulada | SLS Block 1, SLS Block 1B, SLS Block 2 | 27 t, 38 t, 46 t | $2,200M, $2,500M, $2,800M |

- Veredicto en cada tarjeta: `Fits with 12% margin` en verde, `Fits, only 4% margin` en ámbar o `Too heavy by 2,575 kg` en rojo con la tarjeta bloqueada.
- Si nada entra o se pasa del presupuesto, aparece el panel `✂️ Too heavy? Trim the design` u `Over budget? Trim the design` con hasta cuatro recortes y un botón `Apply` en cada uno.
- Columna derecha: presupuesto con nave, cohete y total, dos datos `Did you know?` y el resumen de la nave.
- Botones: `← Workshop` y `Confirm spacecraft →`. Motivos posibles: `Pick a rocket that can lift your spacecraft` u `Over budget by $128M`.

### Fase 1, revisión final en la plataforma

- Bajada con el perfil de la misión y el cohete, por ejemplo `Robotic lander, one-way on Medium launcher.`
- Checklist `Design review: GO / NO GO` con cuatro filas: Launch mass, Budget, Power y Science. Cada una muestra su valor y `GO` en verde o `NO GO` en rojo. Debajo, una línea sobre la noche lunar y la tabla completa `Master Equipment List`.
- Columna derecha: `Coming next` con la próxima fase y un botón deshabilitado `Next phase: coming soon`. Más abajo `← Back to workshop`, `See all NASA sources` y `Start a new mission`.

## Pantallas de la fase 6

### F6a Llegada a la superficie

Fondo: superficie lunar. Sin HUD completo: solo la barra superior y la barra de fases.

| Elemento | Texto |
|---|---|
| Antetítulo | `PHASE 6 · SURFACE, MOON` |
| Título | `Touchdown confirmed` |
| Bajada | `You're on the Moon. Your instruments can now test the surface.` |
| Protagonista | `Our question is still open. Let's test it with real instruments.` |

Botón: `Start investigation →`.

### F6b Exploración

Es la pantalla principal de la fase. Layout en tres zonas: sitio a la izquierda, bandeja de instrumentos a la derecha, medidor de evidencia abajo.

| Elemento | Texto |
|---|---|
| Antetítulo | `PHASE 6 · SURFACE, MOON` |
| Título | `Investigate the surface` |
| Bajada | `Pick a spot, pick an instrument, read the result. Every measurement costs power, time and data.` |

**Puntos de interés (POI):** cada sitio tiene 3 o 4 puntos marcados sobre la imagen. Estado de cada uno: `Not studied`, `Studied: camera` o `Done`.

**Bandeja de instrumentos:** solo muestra los instrumentos que el jugador cargó en la fase 1.

| Instrumento | Título | Chips | Efecto en la evidencia |
|---|---|---|---|
| Cámara | `Take a picture` | `⚡ 10 W · Game value` | `Clue +1` |
| Espectrómetro | `Read the elements` | `⚡ 40 W · Game value` | `Good proof +2` |
| Detector de hidrógeno | `Look for hydrogen` | `⚡ 30 W · Game value` | `Good proof +2` solo si la pregunta es agua. Si no, `Clue +1` |
| Recolector de muestras | `Collect a sample` | `⚖️ +X kg · Game value` | `Strongest +3` |

Si el instrumento está cargado pero no sirve para la pregunta, aparece bloqueado con el texto `🔒 Your Phase 0 question doesn't need this`.

**Tarjetas de resultado (ejemplos según el sitio):**

| Sitio | Medición | Resultado | Fuente |
|---|---|---|---|
| Mar | Regolito | `Gray dust and broken rock, made by impacts over billions of years.` | NASA Science, Moon Facts |
| Mar | Cámara | `Dark, flat terrain with craters. A picture alone can't tell what it's made of.` | NASA Science, LRO |
| Mar | Espectrómetro | `Oxygen, silicon, magnesium, iron, calcium and aluminum, with small amounts of titanium and others.` | NASA Science, Moon Facts |
| Mar | Muestra | `Dark basalt, rich in iron and titanium, about 3.7 billion years old.` | NASA JSC Curation |
| Tierras altas | Espectrómetro | `Light-colored rock, typical of the highlands.` | NASA JSC Curation |
| Tierras altas | Muestra | `Anorthosite: a light rock from the Moon's old crust.` | NASA JSC Curation |
| Polo sur | Detector de hidrógeno | `Hydrogen signal in a permanently shadowed crater. Water ice is possible.` | NASA Science, Moon Facts; NASA LCROSS |

En el polo, el resultado debe decir siempre que el hidrógeno es una pista de agua, no una prueba. Ese mensaje aparece debajo de la tarjeta.

**Medidor de evidencia (abajo):** tres segmentos.

- `Clue`: se ilumina con una medición de cámara. Texto: `Evidence: Weak`.
- `Composition`: se ilumina con espectrómetro o hidrógeno útil. Texto: `Evidence: Good`.
- `Sample`: se ilumina con una muestra a bordo. Texto: `Evidence: Strong`.

**Diario de campo:** lista de hallazgos en orden. Cada entrada muestra la hora de misión, el POI y el resultado.

**Botones:**

- `Journal` (fantasma): abre el diario completo.
- `Finish exploration` (primario). Deshabilitado con el motivo `Take at least one measurement`. Si quedan horas, pide confirmación: `You still have 3 hours. Finish anyway?`

**Estados:**

- Inicio: medidor vacío, POI sin estudiar.
- Búfer lleno: aviso ámbar `Data buffer full. Send data before measuring again.` Bloquea mediciones.
- Sin contacto: botón `Send data` deshabilitado con `No signal: behind the Moon`.

### F6c Eventos

Se muestran en ventana centrada. Cada opción muestra su costo antes de elegir.

**Tormenta solar**

| Elemento | Texto |
|---|---|
| Título | `Solar storm: radiation rising` |
| Cuerpo | `A solar storm is raising radiation levels. The crew can shelter behind food and water, which block some radiation.` |
| Opción A | `Shelter behind supplies`. Chips: `⏱ −1 EVA hour · Game value`, `NASA source ↗` |
| Opción B | `Keep working`. Chips: `🛡 −safety score · Game value`, `Risk ↑` |
| Fuente | `NASA source ↗`: NASA, cómo protegerá NASA a los astronautas de la radiación en la Luna |

**Apagón**

| Elemento | Texto |
|---|---|
| Título | `Behind the Moon: no signal` |
| Cuerpo | `The spacecraft will be out of contact for about 41 minutes, as during Artemis II.` |
| Opción A | `Wait for signal`. Chips: `⏱ −1 hour · Game value` |
| Opción B | `Keep measuring, store data`. Chips: `💾 Risk: buffer may fill` |
| Fuente | `NASA source ↗`: NASA JPL, redes que conectan a Artemis II |

### F6d Cierre de la fase 6

El resultado depende de la evidencia reunida.

| Caso | Título | Bajada |
|---|---|---|
| Hay muestra | `Samples in hand` | `Real rock from the surface. Time to take it home.` |
| Sin muestra, con espectrómetro | `Good clues, no sample` | `Composition data is strong, but a sample would be stronger.` |
| Solo cámara | `Pictures are clues` | `We need composition or samples for proof.` |

Botón: `Continue to return →`.

## Pantallas de la fase 7

### F7a Línea de tiempo del regreso

Fondo: espacio entre la Luna y la Tierra.

| Elemento | Texto |
|---|---|
| Antetítulo | `PHASE 7 · RETURN, MOON TO EARTH` |
| Título | `Bring the results home` |
| Bajada | `The fuel for the trip home was reserved in Phase 3. Each burn uses real delta-v from NASA mission studies.` |

Línea de tiempo horizontal con 4 pasos. El paso activo se agranda; los pasados muestran check; los futuros se atenúan.

1. `Liftoff from the Moon`
2. `Earth return burn`
3. `Reentry`
4. `Splashdown`

Debajo de la línea, la barra de delta-v muestra el combustible restante después de cada paso.

### F7b Despegue desde la Luna

| Elemento | Texto |
|---|---|
| Título | `Liftoff from the Moon` |
| Bajada | `The ascent stage needs 1,833 m/s to reach lunar orbit.` |
| Protagonista | `Fuel saved in Phase 3. Ignition!` |
| Fuente | `NASA source ↗`: NASA, Lunar Ascent and Rendezvous Trajectory Design |

Panel de matemática: `▸ Show the math`. Muestra: `Remaining delta-v 3,283 m/s − 1,833 m/s = 1,450 m/s` para el siguiente paso.

Botón: `Lift off` (primario). Deshabilitado con `Not enough fuel: needs 1,833 m/s`. Si está deshabilitado, lleva a la pantalla de fallo.

Animación: 5 segundos de despegue, con el módulo subiendo y la Luna alejándose.

### F7c Inyección de regreso a la Tierra

| Elemento | Texto |
|---|---|
| Título | `Head for Earth` |
| Bajada | `This burn sends the spacecraft toward home. Without it, the crew doesn't return.` |
| Protagonista | `There's Earth. Hold steady.` |
| Fuente | `NASA source ↗`: NASA JSC, CEV Trajectory Design, AAS 07-075 |

Botón: `Start Earth return burn` (primario). Deshabilitado con `Not enough fuel to come home: needs 1,450 m/s`.

### F7d Tipo de reentrada

Dos tarjetas grandes lado a lado. Cada una con un diagrama simple de la trayectoria.

| Tarjeta | Título | Ventaja | Desventaja | Chips |
|---|---|---|---|---|
| A | `Direct entry` | `Simple. One pass through the atmosphere.` | `Less control over the landing spot.` | `Precision: Lower · Game value` |
| B | `Skip entry` | `Bounces out, then re-enters. More control over the landing spot.` | `Two load peaks of about 4 g each. More complex.` | `Precision: Higher · NASA source ↗` |

Dato de apoyo bajo las tarjetas: `Skip entry can reach up to 5,524 miles, compared with 1,725 miles for Apollo.` Fuente: NASA, Orion skip entry.

Dato adicional: `Artemis I entered the atmosphere at about 24,581 mph (about 11 km/s).` Fuente: NASA NTRS, Artemis I test flight.

Botón: `Choose heat shield →`. Deshabilitado con `Pick a reentry path`.

### F7e Escudo térmico

Un control deslizante de tres posiciones: `Thin`, `Standard`, `Thick`. Cada posición muestra en un panel lateral la masa añadida y el margen térmico.

| Elemento | Texto |
|---|---|
| Título | `Choose the heat shield` |
| Bajada | `The shield must survive the heat of reentry. Thicker means safer, but heavier.` |
| Protagonista | `Every kilogram we add here is taken from somewhere else.` |
| Referencia | `Avcoat faced about 2,760 °C (about 5,000 °F) on Artemis I.` Fuente: NASA, Avcoat heat shield |

Dato de Artemis II: `The shield analysis found 9 zones with material loss, compared with 103 on Artemis I. Changing the reentry path reduced the damage.` Fuente: NASA, análisis del escudo térmico de Artemis II.

**Regla de juego:** con escudo `Thin` y reentrada `Skip entry`, el margen térmico queda en ámbar. Con escudo `Thin` y reentrada `Direct entry`, el margen queda en verde. Estos valores son **Game value** y se deben ajustar al balancear.

**Estados del margen:**

- `Thermal margin: OK` en verde.
- `Thermal margin: low` en ámbar, con el texto `Thin shield with skip entry leaves little margin.`
- `Thermal margin: too low` en rojo. Bloquea el botón y lleva a la pantalla de fallo.

Botón: `Reenter` (primario). Deshabilitado con `Pick a shield thickness`.

### F7f Reentrada

Animación de 6 a 8 segundos: cápsula con resplandor naranja-rojo y un medidor de temperatura en la esquina.

| Elemento | Texto |
|---|---|
| Título | `Reentry` |
| Bajada | `The capsule is heating up. The shield does the work now.` |
| Protagonista | Sin línea fija |

Sin botón hasta que termina la animación. Luego pasa automáticamente al amerizaje.

### F7g Amerizaje

| Elemento | Texto |
|---|---|
| Título | `Splashdown` |
| Bajada | `Parachutes slow the capsule to about 17 mph (about 27 km/h).` |
| Protagonista | `Splashdown confirmed. Welcome home.` |
| Precisión | `Artemis I landed 2.1 nautical miles from the target. Artemis II landed 0.59 miles from its predicted point.` Fuente: NASA NTRS, Artemis I; NASA, Artemis II |

**Puntaje:** barra de precisión, desde el punto previsto hasta el punto de recuperación. Dentro de la zona de recuperación suma puntos. Fuera de la zona, lleva a la pantalla de fallo.

Botón: `Go to lab →` (primario). Lleva a la pantalla de veredicto, que se diseña en la guía de cierre.

### F7h Fallo de misión

Nunca dice solo "you lost". Siempre muestra la causa con una cadena de tres pasos.

| Elemento | Texto |
|---|---|
| Título | Causa en lenguaje simple, por ejemplo `Not enough fuel for the Earth return burn` |
| Bajada | `The return burn needs 1,450 m/s. Remaining budget was short.` |
| Protagonista | Sin línea fija |

**Cadena de causas:** tres tarjetas conectadas con flechas. Ejemplo:

1. `Decision: 4 crew for 20 days` (Phase 2)
2. `Effect: +300 kg of supplies` (Phase 2)
3. `Result: fuel short for return` (Phase 3, paso 2)

Los números deben salir del estado real del juego, no de texto fijo.

**Recomendación de NASA:** un cuadro con una línea sobre recortes (descope): menos días o tripulación, o un cohete más grande. Fuente: NASA Systems Engineering Handbook 3.0, fase Pre-A.

**Botones:**

- `Back to Phase X` (primario): lleva a la fase donde está la causa, con el diseño cargado.
- `View partial report` (fantasma).
- `Home` (fantasma).

## Flujo de decisiones (para desarrollo)

Se resume el orden. El detalle de cada evento está en el documento de diseño de fases 6 y 7.

```
Fase 6
  Llegada → Exploración (POI + instrumento + medición)
    ├─ Eventos: tormenta solar, apagón (aleatorios)
    └─ Terminar → Cierre según evidencia (muestra / espectrómetro / cámara)

Fase 7
  Línea de tiempo
    ├─ Despegue: ¿delta-v ≥ 1,833 m/s? No → Fallo
    ├─ Regreso: ¿delta-v restante ≥ 1,450 m/s? No → Fallo
    ├─ Reentrada: directa o con rebote (decisión)
    ├─ Escudo: delgado, estándar o grueso (decisión)
    │    └─ ¿Margen térmico ≥ carga? No → Fallo
    └─ Amerizaje: ¿dentro de la zona de recuperación? No → Fallo → Veredicto
```

## Notas para el equipo

1. **Verificar en nasa.gov antes de la demo:**
   - Cifras de Artemis II: precisión de amerizaje, análisis del escudo (9 frente a 103 zonas) y apagón de 41 minutos.
   - Qué misión probó la reentrada con rebote. El archivo de investigación sugiere Artemis I, pero no lo confirma.
   - Los 4 g por pico y el alcance de 5,524 millas.
   - Basalto de unos 3.7 mil millones de años.
   - Hielo confirmado por LCROSS en 2009.
   - Hasta 48 K (unos −225 °C) en sombra permanente.
2. **Valores de juego:** masas de instrumentos, horas, costos, margen térmico y efectos de la evidencia. Deben marcarse como `Game value` en la interfaz.
3. **Nombre del archivo de referencia:** el archivo que compartieron se llama `Phases_4_and_5` pero su contenido corresponde a las fases 0 y 1. Si hay una versión de las fases 4 y 5, conviene revisarla también.
4. **Veredicto y reporte final:** esta guía llega hasta el amerizaje. El veredicto de laboratorio y el reporte tipo Apolo se diseñan en la siguiente guía.

## Lo que falta diseñar

- [ ] Arte y poses del protagonista (compañero de arte)
- [ ] Fondo de control de misión para la fase 0
- [ ] Fondo de hangar de ensamblaje para la fase 1
- [ ] Fondos de la Luna, cráter polar, reentrada y amerizaje para las fases 6 y 7
- [ ] Dibujos propios de la nave robótica y tripulada en el estilo del equipo
- [ ] Dibujos propios de los seis cohetes
- [ ] Iconos de las pestañas y medidores en el estilo del equipo
