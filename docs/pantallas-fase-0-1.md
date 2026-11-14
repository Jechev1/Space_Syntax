# Pantallas fase 0 y 1

Guía para diseñar las pantallas del inicio, la intro, la fase 0 y la fase 1. Los textos de la interfaz van en inglés, tal como aparecen en el juego. La versión jugable está en `index.html` y las capturas actuales en `screenshots/`.

## Reglas generales

- Tamaño base: 1536 x 1024 para fondos, pensado para laptop de 1280 x 720 o más.
- Estilo: ilustración granulada en morados y azules, contorno oscuro, verde brillante como único color de acento.
- El texto siempre se lee sobre paneles oscuros semitransparentes, nunca directo sobre la ilustración.
- Toda la historia de estas fases pasa en la Tierra.
- Un solo botón principal por pantalla, en verde, abajo a la derecha.

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
| Inicio | Gato flotando en el espacio | `assets/bg-space.jpg` |
| Intro | Plataforma de lanzamiento | `assets/bg-launch.jpg` |
| Fase 0 | Control de misión en la Tierra | `assets/bg-mission-control.jpg` por hacer |
| Fase 1 taller | Hangar de ensamblaje | `assets/bg-assembly.jpg` por hacer |
| Fase 1 cohete y revisión final | Plataforma de lanzamiento | `assets/bg-launch.jpg` |

Para usar un fondo nuevo basta con guardarlo en `assets/` y cambiar `SCENE_ART` y `SCENES` en `js/data.js`.

### Personajes

| Personaje | Estado | Archivo |
|---|---|---|
| Milo, el gato | Listo | `assets/cat.png`, avatar circular de 320 x 320 |
| Ingeniería de nave | Por crear | `assets/characters/engineer.png` |
| Dinámica de vuelo | Por crear | `assets/characters/flight.png` |
| Ciencia y comunicaciones | Por crear | `assets/characters/science.png` |

Poses del gato que usa el juego: `happy`, `thinking` y `wow`. Si se dibujan, guardarlas como `assets/characters/cat-happy.png` y así.

## Elementos que se repiten

### Barra superior

Panel redondeado arriba de todo, fijo al hacer scroll. Contiene el logo y seis medidores.

| Medidor | Ejemplo | Estado |
|---|---|---|
| ⚖️ Launch mass | `1,603 kg / 4,000` | Activo |
| 💰 Budget | `$270M / $450M` | Activo |
| ⚡ Power | `140 / 450 W` | Activo |
| 🚀 Delta-v | `Phase 3` | Bloqueado |
| 📅 Days | `Phase 2` o `No crew` | Bloqueado |
| 📡 Data | `Phase 4` | Bloqueado |

Cada medidor tiene una barra: verde hasta 80%, ámbar entre 80% y 100%, roja si se pasa. Al pasar el cursor sobre una opción, la barra muestra en rayado cuánto cambiaría y un número como `+120 kg`. A la derecha va el botón de menú ☰.

### Barra de fases

Debajo de la barra superior: `0 Goal`, `1 Spacecraft`, `2 Crew`, `3 Flight`, `4 Comms`, `5 Landing`, `6 Science`, `7 Return`. La fase actual va en verde, las terminadas con check y las futuras apagadas.

### Diálogo de Milo

Panel con avatar circular a la izquierda, nombre en verde y una línea de texto. Lleva una × para cerrarlo.

### Tarjeta de opción

Icono, título, una o dos líneas de descripción y chips abajo. Seleccionada: borde verde y check verde en la esquina. Bloqueada: apagada con candado y motivo.

Chips posibles:

- Masa, energía y costo, como `⚖️ 83 kg`, `⚡ makes 450 W` y `💰 $30M`.
- Efecto en el lanzamiento, como `🚀 +60 kg at launch`.
- Fuente: chip azul `NASA source ↗`. Valor inventado para el juego: chip amarillo `Game value`.

### Barra inferior

Fija abajo. A la izquierda `← Back` y `? Help`. A la derecha el motivo si el botón está deshabilitado y el botón principal verde.

### Ventanas

Ventana centrada con título, texto y botón `Got it`. Se usa para fuentes, ayuda, menú, desglose de medidores y confirmar reinicio.

### Panel de matemática

Panel con borde punteado. Primero una frase en lenguaje simple, después filas de fórmula en amarillo y la cuenta con números. Se abre con el botón `▸ Show the math`.

## E1 Inicio

Fondo: gato en el espacio, con el gato a la izquierda y el texto a la derecha.

| Elemento | Texto |
|---|---|
| Antetítulo | `NASA SPACE APPS 2026 · SPACE MISSION DESIGN` |
| Título | `Is the Moon made of cheese?` con "cheese" en verde |
| Subtítulo | `Milo is sure it is. Design a real Moon mission, with NASA data and real math, and find out.` |
| Etiqueta | `DIFFICULTY` |

Tarjetas de dificultad:

| Título | Texto |
|---|---|
| Cadet | `Bigger budget. Hints on.` |
| Engineer | `Tight budget. The real challenge.` |
| Flight Director | `Every dollar counts.` |

Botones: `Start mission 🚀` principal, `Continue` solo si hay partida guardada y `How to play`. Abajo a la izquierda, pequeño, el enlace `Sources`.

## E2 Intro

Fondo: plataforma de lanzamiento. Tres viñetas con el gato grande al centro, una frase y puntos de paginación.

1. `I've always believed the Moon is made of cheese.`
2. `Nobody believes me. So I'm going to test it with a real mission, starting right here on Earth.`
3. `First we plan and build at the launch site. Every choice costs mass, money or power. Scientists call that a trade-off. Let's go!`

Botones: `Next →`, en la última `Define the mission →`, y `Skip intro`.

## F0 Objetivo de la misión

Fondo: control de misión en la Tierra. Layout de dos columnas: pasos a la izquierda y ficha de misión a la derecha.

| Elemento | Texto |
|---|---|
| Antetítulo | `PHASE 0 · MISSION CONTROL, EARTH` |
| Título | `Set your mission goal` |
| Bajada | `Real NASA missions start with a question, not a spacecraft. Your answers here decide which instruments you can fly.` |
| Milo | `I'm 100% sure the Moon is made of cheese. But a scientist needs proof. What would convince you?` |

### Paso 1: What do you want to find out?

| Icono | Título | Texto |
|---|---|---|
| 🪨 | What is the surface made of? | Cheese is made of fats and proteins (carbon-based). Rock is made of minerals. Chemistry can tell them apart. |
| 💧 | Is there water ice? | NASA has found signs of water ice in permanently shadowed craters near the poles. |
| ⏳ | How old is the surface? | Labs on Earth can date rocks. Apollo 11 basalts are about 3.7 billion years old. |

### Paso 2: What measurement would prove it?

Se activa al terminar el paso 1. Cada tarjeta muestra una barra de fuerza de prueba de 1 a 3.

| Icono | Título | Fuerza |
|---|---|---|
| 📷 | Take pictures | Clue |
| 🧪 | Measure the chemistry | Good proof |
| 📦 | Bring samples home | Strongest proof |

Si la medición elegida es débil para la pregunta, aparece un aviso `Tip` con la mejor opción.

### Paso 3: Robots or people?

| Icono | Título | Texto |
|---|---|---|
| 🤖 | Robotic mission | Cheaper and no risk to people. Robots carry fewer tools and bring back much smaller samples. |
| 👩‍🚀 | Crewed mission | Astronauts can explore and collect far more, but you must keep them alive and bring them home. |

### Panel de matemática

Título `🧮 Test the hypothesis before you even launch`. Muestra la densidad de la Luna, V = 4/3 · π · r³ y ρ = M / V, con resultado 3,344 kg/m³, y la gravedad, g = G · M / r², con resultado 1.62 m/s².

### Ficha de misión, columna derecha

- `Hypothesis: "The Moon is made of cheese."` en amarillo.
- Question, Measurement, Mission y Proof strength.
- Requisitos que se generan solos, por ejemplo `Carry: Composition spectrometer or Neutron detector`.
- Debajo, dos datos `Did you know?`.

Botones: `← Home` y `Lock in goal →`. Si falta algo, el motivo dice `Pick a question`, `Pick a measurement` o `Pick a mission type`.

## F1a Taller de la nave

Fondo: hangar de ensamblaje. Tres zonas: pestañas a la izquierda, nave y opciones al centro, resumen a la derecha.

| Elemento | Texto |
|---|---|
| Antetítulo | `PHASE 1 · ASSEMBLY BUILDING, EARTH` |
| Título | `Build your spacecraft` |
| Milo | `Heavier spacecraft need bigger rockets, and bigger rockets cost more. Watch the Launch mass meter!` |

### Pestañas

`🏗️ Structure`, `🛡️ Micrometeoroid shield`, `🌡️ Thermal control`, `⚡ Power` y `🔬 Science payload`. Cada una lleva check verde cuando está elegida o un punto ámbar si falta.

### Vista de la nave

Dibujo lateral en un panel de 640 x 360. Misión robótica: un módulo de aterrizaje. Misión tripulada: orbitador a la izquierda y módulo de aterrizaje a la derecha, con una línea punteada `docks in lunar orbit`. La parte de la pestaña activa se resalta en verde y el resto se apaga.

Debajo: título de la pestaña, una línea que explica para qué sirve y la frase `Every 1 kg added to your lander costs about 3.0 kg at launch`.

### Opciones por pestaña

| Pestaña | Opciones |
|---|---|
| Structure | Aluminum alloy, Graphite-epoxy composite |
| Micrometeoroid shield | Solid aluminum plate, Whipple shield, Stuffed Whipple |
| Thermal control | Passive, Active |
| Power robótica | Solar panels + small battery, Solar panels + big battery, Solar + radioisotope generator |
| Power tripulada | Solar arrays, Solar arrays + big batteries, Fuel cells |
| Science payload | High-res camera, Composition spectrometer, Neutron detector, Sample collector |

En Science payload se pueden elegir varias. Las que no sirven para la medición de la fase 0 aparecen bloqueadas con `🔒 Your Phase 0 measurement doesn't need this`. La que responde la pregunta lleva el chip `✓ answers your question`.

En Power robótica aparece el panel `🔋 Batteries: real math`, con E = P · t para 100 h y para 354 h de noche lunar.

### Columna derecha

- Panel `YOUR SPACECRAFT` con tres números grandes: hardware, combustible y masa de lanzamiento.
- Frase `Fuel is 198% of your hardware mass.`
- Botón `Show the math: why so much fuel?`, que abre la tabla de la ecuación del cohete maniobra por maniobra.
- Panel `EQUIPMENT LIST` con el botón `Show parts list (MEL)`.

Botones: `← Phase 0` y `Choose rocket →`. Motivos posibles: `Still to choose: Power, Science payload` o `Add an instrument that answers your Phase 0 question`.

## F1b Elegir cohete

Fondo: plataforma de lanzamiento.

| Elemento | Texto |
|---|---|
| Antetítulo | `PHASE 1 · LAUNCH PAD, EARTH` |
| Título | `Pick your rocket` |
| Milo | `The rocket's job: throw our spacecraft toward the Moon. The green gauge shows how full each rocket would be.` |

Arriba, una franja con `Hardware + Fuel for the Moon trip = Rocket must lift`.

Tres tarjetas de cohete, cada una con dibujo vertical de 120 x 320 y un medidor al lado que se llena según la masa.

| Misión | Cohetes | Capacidad | Costo |
|---|---|---|---|
| Robótica | Small launcher, Medium launcher, Heavy launcher | 1.5 t, 4 t, 12 t | $60M, $120M, $250M |
| Tripulada | SLS Block 1, SLS Block 1B, SLS Block 2 | 27 t, 38 t, 46 t | $2,200M, $2,500M, $2,800M |

Veredicto en cada tarjeta: `Fits with 12% margin` en verde, `Fits, only 4% margin` en ámbar o `Too heavy by 2,575 kg` en rojo con la tarjeta bloqueada.

Si nada entra o se pasa del presupuesto, aparece el panel `✂️ Too heavy? Trim the design` u `Over budget? Trim the design` con hasta cuatro recortes y un botón `Apply` en cada uno.

Columna derecha: presupuesto con nave, cohete y total, dos datos `Did you know?` y el resumen de la nave.

Botones: `← Workshop` y `Confirm spacecraft →`. Motivos posibles: `Pick a rocket that can lift your spacecraft` u `Over budget by $128M`.

## F1 Revisión final en la plataforma

Fondo: plataforma de lanzamiento, la misma escena del checklist con el botón Launch.

| Elemento | Texto |
|---|---|
| Antetítulo | `PHASE 1 COMPLETE · LAUNCH SITE, EARTH` |
| Título | `Ready on the launch pad! 🚀` |
| Bajada | Perfil de la misión y cohete, por ejemplo `Robotic lander, one-way on Medium launcher.` |

Checklist `Design review: GO / NO GO` con cuatro filas: Launch mass, Budget, Power y Science. Cada una muestra su valor y `GO` en verde o `NO GO` en rojo. Debajo, una línea sobre la noche lunar.

Debajo, la tabla completa `Master Equipment List`.

Columna derecha: `Coming next` con la próxima fase y un botón deshabilitado `Next phase: coming soon`. Más abajo `← Back to workshop`, `See all NASA sources` y `Start a new mission`.

## Lo que falta diseñar

- [ ] Fondo de control de misión para la fase 0
- [ ] Fondo de hangar de ensamblaje para la fase 1
- [ ] Poses del gato: happy, thinking y wow
- [ ] Dibujos propios de la nave robótica y tripulada en el estilo del equipo
- [ ] Dibujos propios de los seis cohetes
- [ ] Iconos de las pestañas y medidores en el estilo del equipo
