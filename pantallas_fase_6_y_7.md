# Pantallas fase 6 y 7: superficie y regreso

Guía para diseñar las pantallas de la investigación en superficie (fase 6) y del regreso a la Tierra (fase 7). Sigue el mismo formato y la misma paleta que la guía de fases 0 y 1, para que todo el juego se vea como una sola pieza. Los textos de la interfaz van en inglés. Las explicaciones van en español.

**Decisiones de esta guía:**
- Se adopta la paleta morada y verde de la versión jugable. Con esto se cierra la decisión de paleta pendiente.
- Los personajes se llaman por su rol ("Astronaut cat", "Ship computer"), no por nombre, como se pidió para este documento.
- Todo dato real lleva chip "NASA source". Todo número inventado para balancear lleva "Game value".

## Reglas generales

- Tamaño base de fondos: 1536 x 1024, pensado para laptop de 1280 x 720 o más.
- Estilo: ilustración granulada en morados y azules, contorno oscuro, verde brillante como único color de acento.
- El texto siempre se lee sobre paneles oscuros semitransparentes, nunca directo sobre la ilustración.
- Toda la historia de estas fases ocurre en la Luna o en el viaje de regreso. La Tierra solo aparece como destino.
- Un solo botón principal por pantalla, en verde, abajo a la derecha.
- Ningún estado se comunica solo con color. Siempre hay icono y texto.

### Colores

| Uso | Color |
|---|---|
| Fondo | `#1B1931` |
| Panel | `#2E2948` al 86% |
| Borde | `#463F69` |
| Texto | `#EDE9F6` |
| Texto secundario | `#B3ABCB` |
| Acento verde | `#A6E05F` |
| Hipótesis | `#F1C75F` |
| Advertencia | `#F0B45E` |
| Error | `#EF7B7B` |

Tipografías: Fredoka para títulos y Nunito para texto.

### Escenas

| Pantalla | Fondo | Archivo |
|---|---|---|
| F6 superficie, sitio de mar o tierras altas | Superficie lunar gris, con cráteres y rocas | `assets/bg-moon-surface.jpg` por hacer |
| F6 cráter polar | Cráter en sombra, con un resplandor azul tenue | `assets/bg-polar-crater.jpg` por hacer |
| F6 eventos | Mismo fondo de superficie con capa oscura | Reutiliza el fondo del sitio |
| F6 cierre | Superficie con el contenedor de muestra | `assets/bg-moon-surface.jpg` |
| F7 línea de tiempo y pasos 1 y 2 | Espacio entre la Luna y la Tierra | `assets/bg-space.jpg` (reutilizado) |
| F7 reentrada | Cápsula con resplandor naranja en la atmósfera | `assets/bg-reentry.jpg` por hacer |
| F7 amerizaje | Océano con paracaídas abiertos | `assets/bg-splashdown.jpg` por hacer |
| F7 fallo | Capa oscura sobre el fondo anterior | Reutiliza |

### Personajes

| Personaje | Estado | Archivo |
|---|---|---|
| Astronaut cat | Listo | `assets/cat.png`, avatar circular de 320 x 320 |
| Ship computer | Sin imagen. Solo texto, sin avatar | No aplica |

Poses del gato: `happy`, `thinking` y `wow`. Se usan en las pantallas indicadas abajo.

## Elementos que se repiten

### Barra superior

Panel redondeado fijo arriba. Contiene el logo y seis medidores. En estas fases, dos medidores cambian de nombre según el contexto.

| Medidor | Fase 6 | Fase 7 |
|---|---|---|
| ⚖️ Mass | `Return mass 4.2 / 6 kg` | `Return mass 4.2 / 6 kg` |
| 💰 Budget | `$450M` restante | `$450M` restante |
| ⚡ Power | `320 / 500 W` | `No power draw` |
| 🚀 Delta-v | `Return reserve 3,283 m/s` | `Remaining 3,283 m/s` |
| 🧑‍🚀 EVA hours | `2 / 5 h` | `Crew safe` o `No EVA` |
| 📡 Data | `4.2 / 5 Gb` | `Sent 4.2 Gb` |

Cada medidor tiene barra: verde hasta 80%, ámbar entre 80% y 100%, rojo si se pasa. Al pasar el cursor sobre una opción, la barra muestra en rayado el cambio, con un número como `+1.2 kg` o `−1 h`.

Los valores de ejemplo son **Game value**, salvo el delta-v, que sale de la fase 3 y de estudios de NASA.

### Barra de fases

Debajo de la barra superior: `0 Goal`, `1 Spacecraft`, `2 Crew`, `3 Flight`, `4 Comms`, `5 Landing`, `6 Surface`, `7 Return`. La fase actual va en verde, las terminadas con check y las futuras apagadas.

### Diálogo del gato

Panel con avatar circular a la izquierda, rol en verde (`Astronaut cat`) y una línea de texto de máximo 120 caracteres. Lleva una × para cerrarlo. El texto de la voz de a bordo usa el rol `Ship computer` y no lleva avatar.

### Tarjeta de opción

Icono, título, una o dos líneas de descripción y chips abajo. Seleccionada: borde verde y check verde en la esquina. Bloqueada: apagada, con candado y motivo.

Chips posibles:
- Masa, energía, datos y costo, como `⚖️ 0.5 kg`, `⚡ 10 W` o `💾 0.2 Gb`.
- Efecto de evidencia, como `Evidence: Clue +1`.
- Fuente: chip azul `NASA source ↗`. Valor de juego: chip amarillo `Game value`.

### Tarjeta de resultado

Aparece después de cada medición. Tiene el resultado en una o dos líneas, el nivel de evidencia y un chip `NASA source ↗` que abre el documento. Si el resultado es un dato de juego, usa el chip `Game value`.

### Barra inferior

Fija abajo. A la izquierda `← Back` y `? Help`. A la derecha, el motivo si el botón está deshabilitado y el botón principal verde.

### Ventanas

Ventana centrada con título, texto y botón `Got it`. Se usa para eventos, ayuda, menú, desglose de medidores y confirmar.

### Panel de matemática

Panel con borde punteado. Primero una frase en lenguaje simple, después filas de fórmula en amarillo y la cuenta con números. Se abre con el botón `▸ Show the math`.

## Pantallas de la fase 6

### F6a Llegada a la superficie

Fondo: superficie lunar. Sin HUD completo: solo la barra superior y la barra de fases.

| Elemento | Texto |
|---|---|
| Antetítulo | `PHASE 6 · SURFACE, MOON` |
| Título | `Touchdown confirmed` |
| Bajada | `You're on the Moon. Your instruments can now test the surface.` |
| Gato | `thinking`: `Our question is still open. Let's test it with real instruments.` |

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

| Caso | Gato | Título | Bajada |
|---|---|---|---|
| Hay muestra | `wow` | `Samples in hand` | `Real rock from the surface. Time to take it home.` |
| Sin muestra, con espectrómetro | `thinking` | `Good clues, no sample` | `Composition data is strong, but a sample would be stronger.` |
| Solo cámara | `thinking` | `Pictures are clues` | `We need composition or samples for proof.` |

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
| Gato | `happy`: `Fuel saved in Phase 3. Ignition!` |
| Fuente | `NASA source ↗`: NASA, Lunar Ascent and Rendezvous Trajectory Design |

Panel de matemática: `▸ Show the math`. Muestra: `Remaining delta-v 3,283 m/s − 1,833 m/s = 1,450 m/s` para el siguiente paso.

Botón: `Lift off` (primario). Deshabilitado con `Not enough fuel: needs 1,833 m/s`. Si está deshabilitado, lleva a la pantalla de fallo.

Animación: 5 segundos de despegue, con el módulo subiendo y la Luna alejándose.

### F7c Inyección de regreso a la Tierra

| Elemento | Texto |
|---|---|
| Título | `Head for Earth` |
| Bajada | `This burn sends the spacecraft toward home. Without it, the crew doesn't return.` |
| Gato | `wow`: `There's Earth. Hold steady.` |
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
| Gato | `thinking`: `Every kilogram we add here is taken from somewhere else.` |
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
| Gato | `thinking` |

Sin botón hasta que termina la animación. Luego pasa automáticamente al amerizaje.

### F7g Amerizaje

| Elemento | Texto |
|---|---|
| Título | `Splashdown` |
| Bajada | `Parachutes slow the capsule to about 17 mph (about 27 km/h).` |
| Gato | `wow`: `Splashdown confirmed. Welcome home.` |
| Precisión | `Artemis I landed 2.1 nautical miles from the target. Artemis II landed 0.59 miles from its predicted point.` Fuente: NASA NTRS, Artemis I; NASA, Artemis II |

**Puntaje:** barra de precisión, desde el punto previsto hasta el punto de recuperación. Dentro de la zona de recuperación suma puntos. Fuera de la zona, lleva a la pantalla de fallo.

Botón: `Go to lab →` (primario). Lleva a la pantalla de veredicto, que se diseña en la guía de cierre.

### F7h Fallo de misión

Nunca dice solo "you lost". Siempre muestra la causa con una cadena de tres pasos.

| Elemento | Texto |
|---|---|
| Título | Causa en lenguaje simple, por ejemplo `Not enough fuel for the Earth return burn` |
| Bajada | `The return burn needs 1,450 m/s. Remaining budget was short.` |
| Gato | `thinking` |

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
