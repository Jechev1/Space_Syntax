# Datos para revisar

Extracción de las cifras de Space Syntax. El motor no lee este documento ni `src/data/mission.config.mjs`: sigue usando `js/data.js`, `js/model.js` y `js/sim/p*.js`.

No hay un backend aparte. `tools/serve.py` solo sirve los archivos. Las cifras viven en el motor del navegador (`js/`) y, como ejemplos de interfaz, en `src/dev/DevUi.jsx`.

Hay **443** entradas. Compartido: 14. Fase 0: 4. Fase 1: 142. Fase 2: 38. Fase 3: 29. Fase 4: 54. Fase 5: 40. Fase 6: 30. Fase 7: 33. Citas: 30. Maquetas: 15. Sin clasificar: 14.

Cada entrada del config lleva `source: "pendiente"`. El código actual sí marca algunas como fuente NASA y otras como valor de juego; esa marca no se copió, para que la revisión la vuelva a decidir.

## Contradicciones

El mismo dato, o el mismo concepto, con valores distintos.

1. **Tiempo en la Luna.** Un robot trabaja 6 h en la fase 6 (`js/data.js:363`). Si ya hay sitio, el informe y la fase 4 usan las horas de luz y de noche del sitio: 354 h, o 600 h de luz en el polo (`js/model.js:371`, `js/sim/p4.js:85`). En tripulado, la fase 6 cuenta una sola caminata (4, 8 o 10 h). El informe del sitio multiplica esa duración por los días y por quienes bajan (`js/model.js:372`).
2. **Búfer de datos.** La superficie usa 5 Gb (`js/data.js:366`). La simulación de comunicaciones usa 150 Gb en robótico y 300 Gb en tripulado (`js/sim/p4.js:25`).
3. **Potencia del mismo instrumento.** En la fase 1 la cámara gasta 15 W, el espectrómetro 25 W y el detector de neutrones 15 W. En la fase 6 una medición gasta 10 W, 40 W y 30 W (`js/data.js:372-374`).
4. **Presupuesto de 450 millones.** Las guías de pantalla lo usan como tope (`docs/pantallas-fase-0-1.md:61`, `pantallas_fase_6_y_7.md:66`). Ninguna dificultad vale 450. El motor usa 650, 500 y 420 en robótico, y 7700, 6400 y 6300 en tripulado.
5. **Masa de retorno en la maqueta.** La guía de las fases 6 y 7 dibuja un tope de 6 kg (`pantallas_fase_6_y_7.md:65`). El motor usa 0.5 kg en robótico y 100 kg en tripulado.
6. **Enlaces de las maquetas.** La nota de la API recoge lo que las pantallas sumaban: radio +10 W y 1 Gb, Ka +25 W y 4 Gb, láser +40 W y 8 Gb (`docs/api.md:352-354`). El motor usa 40/150 W, 110/300 W y 130/250 W, y con la antena de 34 m manda 57.6, 900 y 2340 Gb al día.
7. **Paneles tripulados.** El texto dice 4 alas y 11.2 kW, como Orión. La opción genera 2500 W (`js/data.js:219`).
8. **Duración del viaje.** La ficha dice unas 76 h de ida (Apolo 11) y 75 h en la superficie (Apolo 17). El juego usa 3 días, es decir 72 h, en los dos tramos (`js/data.js:97-98` y `:266-267`).
9. **Muestras del Apolo 17.** La etiqueta dice unos 110 kg. El cupo es 100 kg (`js/data.js:172`).
10. **Batería.** La pantalla cita 245 Wh/kg de celda y el cálculo usa 150 Wh/kg de paquete (`js/data.js:136`, `js/app.js:354`). El texto lo explica; conviene confirmar cuál debe quedar.
11. **Gravedad de la Tierra.** El motor usa 9.80665 m/s² (`js/data.js:155`). La comparación de la fase 0 escribe 9.81 (`js/model.js:99`).
12. **“Cualquier noche”.** El chip lo dice a partir de 300 h (`js/app.js:302`). La noche ecuatorial del juego dura 354 h. Ninguna opción actual cae entre 300 y 353, así que hoy no se ve, pero el umbral no es la noche del juego.
13. **Consumibles en la pantalla.** El texto dice unos 0.9 kg de oxígeno y 3.2 kg de agua (`js/app.js:436`). El motor usa 0.895 y 3.217. La comida, 0.8 kg, sí coincide.
14. **Banda Ka.** El texto dice de 100 a 300 Mbps. El modelo solo usa 100 Mbps (`js/data.js:295-296`).
15. **Antena de 26 m.** La ficha de la DSN la menciona (`js/data.js:101`). El juego solo ofrece 34 m y 70 m.
16. **Apagón.** Todas las fichas dicen 41 minutos, y el valor de juego también. El efecto de “esperar la señal” en la fase 6 resta 1 hora, no 41 minutos (`js/data.js:439-441`).
17. **Frío del cráter.** Diviner y el sitio dicen unos 25 K (`js/data.js:107`). El texto del traje dice 48 K (`js/data.js:276`).
18. **Masa del aterrizaje.** La aproximación final usa siempre 15 000 kg (`js/sim/p5.js:21`), no la masa del vehículo diseñado.
19. **Aterrizaje brusco.** El contacto seguro llega hasta 2.1 m/s. Un aterrizaje brusco empieza en 2.4 m/s (`js/sim/p5.js:22-24`), así que siempre queda por encima del límite seguro.
20. **Reserva del regreso.** La ficha dice que los 1 450 m/s de vuelta ya incluyen 15 m/s de reserva (`js/data.js:99`). El juego añade encima el margen de la fase 3, de 0 a 20%.
21. **Dos por ciento escrito dos veces.** La reserva de navegación de la fase 3 es 0.02 (`js/sim/p3.js:29`) y la dispersión de Cadete en el regreso también (`js/data.js:455`). Están en archivos distintos.
22. **Margen de masa del 10%.** Avisa en `js/model.js:813` y es el umbral de dos estrellas en `js/sim/p1.js:28`.
23. **Noventa y nueve por ciento de los datos.** Las estrellas usan 99 (`js/sim/p4.js:32`) y el resultado “parcial” usa 0.99 en otra línea (`js/sim/p4.js:157`).
24. **Estrellas de la fase 2 robótica.** `[0, 0.5, 1]` está escrito en la función (`js/sim/p2.js:84`), no en el bloque de ajuste. Las de la misión tripulada son `[0, 0.5, 0.9]`.
25. **Día lunar.** Un comentario dice 24 h 50 min (`js/sim/p4.js:13`). El cálculo usa 24 h.
26. **Pantallas viejas de la misión tripulada.** La nota de la API guarda 18 400 kg, 412 millones y 2.1 kW, y delta-v de 6 620 y 5 357 m/s. Esa misma nota dice que el motor no usa esas cifras (`docs/api.md:348-351`).
27. **Cápsula robótica.** La etiqueta parte 40.5 kg en cápsula más 0.5 kg de muestras. El motor solo guarda 40.5 (`js/data.js:164`).

El presupuesto tripulado baja de 6 400 a 6 300 millones entre Ingeniero y Director. No es una cifra repetida: el salto es muy pequeño y conviene mirarlo.

La zona de recuperación es de 10 km. La ficha del Artemis I habla de 5.4 millas náuticas, que son unos 10.0 km. Puede ser la misma cifra en otra unidad (`js/data.js:468` y `:480`).

## No son contradicciones

- El Isp de 314 s es el motor de la nave. El de 462 s es la etapa superior del lanzamiento. No hay que igualarlos.
- 2 380 m/s de escape más unos 220 m/s de pérdidas suman los 2 600 m/s del regreso directo.
- 1 833 m/s de ascenso más 1 450 m/s de regreso suman 3 283 m/s. La guía de la fase 7 usa esa cuenta y coincide con el motor.
- Los Gb de una medición (fase 6) y los Gb por día (fase 4) no son la misma magnitud. Cámara: 1.2 Gb por foto y 300 Gb al día.
- El 80% del medidor de la fase 1 y el 80% del búfer de comunicaciones son umbrales distintos que coinciden en el número.
- Los 50 kg y los 450 W se repiten en las tres opciones de potencia robótica porque comparten los mismos paneles.
- El MMRTG del texto (45 kg, 110 W), el 98% del reciclador, las 354 h ecuatoriales, las 100 h del polo y las capacidades de 27, 38 y 46 t coinciden con el valor que el motor usa.
- Los ejemplos de 1 603 kg y 270 millones de la guía de las fases 0 y 1 coinciden con un diseño de prueba. El denominador de 450 millones de ese mismo medidor, no.

## Repetidos en más de un archivo

Misma cifra, mismo significado. Si se cambia una, la otra no se entera.

| Dato | Dónde |
|---|---|
| Margen de masa 10% | `js/model.js:813` y `js/sim/p1.js:28` |
| Datos entregados 99% | `js/sim/p4.js:32` y `js/sim/p4.js:157` |
| Reserva o dispersión 2% | `js/sim/p3.js:29` y `js/data.js:455` |
| Día extra de tormenta | `js/data.js:345` y `js/sim/p2.js:29` |
| Cupo de muestras 0.5 kg y 100 kg | `js/data.js:164`, `:172` y `:369` |
| Oxígeno 0.895, comida 0.800, agua 3.217 | `js/data.js:264` y los rótulos de `js/model.js:460-462` |
| Longitudes de la DSN | `js/sim/p4.js:36-38` y `tools/fixtures.js:195` |
| Aviso de combustible al 20% y altitud inicial de 300 m | `js/sim/p5.js:28`, `:14` y `demo/5b.js:130`, `:136` |
| Apagón de 41 min | `js/data.js:307`, `:102`, `:439` y `:482` |
| Fuerza 1, 2 y 3 | Fase 0 (`js/data.js:120-122`) y rangos de evidencia (`js/data.js:378-380`) |

## Dificultad

| | Cadete | Ingeniero | Director |
|---|---:|---:|---:|
| Presupuesto robótico, millones USD | 650 | 500 | 420 |
| Presupuesto tripulado, millones USD | 7700 | 6400 | 6300 |
| Reserva mínima de delta-v | 0 | 5% | 10% |
| Probabilidad de evento por fase | 0.3 | 0.6 | 0.9 |
| Probabilidad de evento en superficie | 0.1 | 0.2 | 0.3 |
| Factor del vuelo estacionario | 0.5 | 1 | 1.2 |
| Dispersión del regreso | 2% | 6% | 10% |
| Factor de carga térmica | 0.9 | 1 | 1.15 |
| Factor del error de amerizaje | 0.6 | 1 | 1.2 |

## Qué no entró como dato de misión

Quedó en **Sin clasificar**, porque no es una cifra para contrastar con la NASA: tope de cuadros de la animación, escalas de las gráficas y los números de ejemplo del kit de interfaz (`src/dev/DevUi.jsx`, masa 420/2000, costo 80/150, potencia 5/5).

No metí en el archivo:

- Semillas y máscaras del azar (`0x5eed`, `0xd35c`, `0x4d1`, `0x3a7`, `0x7e7`, `1664525`, `1013904223` y similares). Solo deciden el sorteo.
- Píxeles, colores y tamaños de layout (1280×720, 1536×1024, avatares).
- Los resultados de `tests/` y `fixtures/`, que comprueban estas mismas cifras y no añaden otras, salvo las longitudes de la DSN ya anotadas.

El radio dibujado de 9 000 km y la panza de 70 000 km están en la fase 3, marcados como dibujo. No son una órbita ni una altitud.

## Tabla

| Fase | Dato | Valor | Unidad | Dónde se usa | Notas |
|---|---|---:|---|---|---|
| Compartido | luna · masa | 7.346×10^22 | kg | js/data.js:131 | — |
| Compartido | luna · radio | 1737.4 | km | js/data.js:131 | — |
| Compartido | luna · densidad | 3344 | kg/m³ | js/data.js:131 | — |
| Compartido | luna · gravedad | 1.62 | m/s² | js/data.js:131 | — |
| Compartido | luna · distancia | 384400 | km | js/data.js:131 | — |
| Compartido | constantes · G | 6.674×10^-11 | m³/kg·s² | js/data.js:132 | — |
| Compartido | constantes · c | 299792.458 | km/s | js/data.js:132 | — |
| Compartido | constantes · densidadAgua | 1000 | kg/m³ | js/data.js:133 | — |
| Compartido | constantes · gTierraTexto | 9.81 | m/s² | js/model.js:99 | No es el g0 del motor (9.80665 m/s² en js/data.js:155). |
| Compartido | motorNave · isp | 314 | s | js/data.js:154 | No es el Isp de la etapa superior del lanzamiento (462 s en js/sim/p1.js:25). Son motores distintos. |
| Compartido | motorNave · g0 | 9.80665 | m/s² | js/data.js:155 | El texto de la fase 0 usa 9.81 m/s² (js/model.js:99). |
| Compartido | motorNave · fraccionTanques | 0.08 | fracción | js/data.js:156 | — |
| Compartido | reloj · horasPorDia | 24 | h | js/model.js:371 | También en js/sim/p3.js y js/sim/p4.js. El comentario de p4.js:13 dice que el día lunar real es 24 h 50 min, y esa cifra no entra al cálculo. |
| Compartido | reloj · minutosExtraDelDiaLunar | 50 | min | js/sim/p4.js:13 | — |
| Fase 0 | fuerzaDeLaMedicion · fotos | 1 | puntos | js/data.js:120 | El mismo 1 es el rango de evidencia "clue" en la fase 6 (js/data.js:378). |
| Fase 0 | fuerzaDeLaMedicion · quimica | 2 | puntos | js/data.js:121 | El mismo 2 es el rango "composition" (js/data.js:379). |
| Fase 0 | fuerzaDeLaMedicion · muestras | 3 | puntos | js/data.js:122 | El mismo 3 es el rango "sample" (js/data.js:380). |
| Fase 0 | edadCitada | 3.7 | Ga | js/data.js:116 | Se repite en el sitio Sea of Tranquility (js/data.js:315). |
| Fase 1 | bateria · energiaEspecifica | 150 | Wh/kg | js/data.js:136 | La pantalla cita 245 Wh/kg de celda y luego usa 150 (js/app.js:354). |
| Fase 1 | bateria · potenciaDeSupervivencia | 50 | W | js/data.js:137 | — |
| Fase 1 | bateria · energiaDeCeldaCitada | 245 | Wh/kg | js/app.js:354 | — |
| Fase 1 | hardwareBase · robotico · aterrizador · masa | 250 | kg | js/data.js:163 | — |
| Fase 1 | hardwareBase · robotico · aterrizador · costo | 150 | millones USD | js/data.js:163 | — |
| Fase 1 | hardwareBase · robotico · aterrizador · potencia | 100 | W | js/data.js:163 | — |
| Fase 1 | hardwareBase · robotico · capsula · masa | 40.5 | kg | js/data.js:164 | El texto parte 40.5 kg en cápsula + 0.5 kg de muestras, pero el motor solo guarda 40.5. La capacidad de la fase 6 es 0.5 kg (js/data.js:369). |
| Fase 1 | hardwareBase · robotico · capsula · costo | 60 | millones USD | js/data.js:164 | — |
| Fase 1 | hardwareBase · robotico · capsula · muestrasIncluidas | 0.5 | kg | js/data.js:164 | — |
| Fase 1 | hardwareBase · tripulado · capsula · masa | 3800 | kg | js/data.js:167 | — |
| Fase 1 | hardwareBase · tripulado · capsula · costo | 1000 | millones USD | js/data.js:167 | — |
| Fase 1 | hardwareBase · tripulado · capsula · potencia | 0 | W | js/data.js:167 | — |
| Fase 1 | hardwareBase · tripulado · moduloDeServicio · masa | 3150 | kg | js/data.js:168 | — |
| Fase 1 | hardwareBase · tripulado · moduloDeServicio · costo | 300 | millones USD | js/data.js:168 | — |
| Fase 1 | hardwareBase · tripulado · cabinaDeAscenso · masa | 1500 | kg | js/data.js:169 | — |
| Fase 1 | hardwareBase · tripulado · cabinaDeAscenso · costo | 700 | millones USD | js/data.js:169 | — |
| Fase 1 | hardwareBase · tripulado · etapaDeDescenso · masa | 1300 | kg | js/data.js:170 | — |
| Fase 1 | hardwareBase · tripulado · etapaDeDescenso · costo | 800 | millones USD | js/data.js:170 | — |
| Fase 1 | hardwareBase · tripulado · margenDeTripulacion · masa | 600 | kg | js/data.js:171 | — |
| Fase 1 | hardwareBase · tripulado · margenDeTripulacion · costo | 0 | millones USD | js/data.js:171 | — |
| Fase 1 | hardwareBase · tripulado · muestras · masa | 100 | kg | js/data.js:172 | La etiqueta dice que el Apolo 17 trajo unos 110 kg. La fase 6 usa este mismo 100 kg como capacidad de retorno (js/data.js:369). |
| Fase 1 | hardwareBase · tripulado · muestras · costo | 0 | millones USD | js/data.js:172 | — |
| Fase 1 | hardwareBase · tripulado · potenciaBase | 900 | W | js/data.js:173 | — |
| Fase 1 | estructura · aluminio · masaRobotica | 120 | kg | js/data.js:191 | — |
| Fase 1 | estructura · aluminio · costoRobotico | 10 | millones USD | js/data.js:191 | — |
| Fase 1 | estructura · aluminio · fraccionTripulada | 0.18 | fracción | js/data.js:191 | El motor la aplica por separado al orbitador, al ascenso y al descenso (js/model.js). El costo se cobra una sola vez, en el orbitador. |
| Fase 1 | estructura · aluminio · costoTripulado | 150 | millones USD | js/data.js:191 | — |
| Fase 1 | estructura · compuesto · masaRobotica | 85 | kg | js/data.js:192 | — |
| Fase 1 | estructura · compuesto · costoRobotico | 30 | millones USD | js/data.js:192 | — |
| Fase 1 | estructura · compuesto · fraccionTripulada | 0.13 | fracción | js/data.js:192 | — |
| Fase 1 | estructura · compuesto · costoTripulado | 450 | millones USD | js/data.js:192 | — |
| Fase 1 | escudo · placa · proteccion | 2 | puntos | js/data.js:199 | — |
| Fase 1 | escudo · placa · masaRobotica | 60 | kg | js/data.js:199 | — |
| Fase 1 | escudo · placa · costoRobotico | 3 | millones USD | js/data.js:199 | — |
| Fase 1 | escudo · placa · masaTripulada | 700 | kg | js/data.js:199 | — |
| Fase 1 | escudo · placa · costoTripulado | 30 | millones USD | js/data.js:199 | — |
| Fase 1 | escudo · whipple · proteccion | 3 | puntos | js/data.js:200 | — |
| Fase 1 | escudo · whipple · masaRobotica | 30 | kg | js/data.js:200 | — |
| Fase 1 | escudo · whipple · costoRobotico | 10 | millones USD | js/data.js:200 | — |
| Fase 1 | escudo · whipple · masaTripulada | 350 | kg | js/data.js:200 | — |
| Fase 1 | escudo · whipple · costoTripulado | 90 | millones USD | js/data.js:200 | — |
| Fase 1 | escudo · whippleRelleno · proteccion | 4 | puntos | js/data.js:201 | — |
| Fase 1 | escudo · whippleRelleno · masaRobotica | 22 | kg | js/data.js:201 | — |
| Fase 1 | escudo · whippleRelleno · costoRobotico | 20 | millones USD | js/data.js:201 | — |
| Fase 1 | escudo · whippleRelleno · masaTripulada | 250 | kg | js/data.js:201 | — |
| Fase 1 | escudo · whippleRelleno · costoTripulado | 180 | millones USD | js/data.js:201 | — |
| Fase 1 | termico · repartoDeMasa | 0.5 | fracción | js/model.js:230 | — |
| Fase 1 | termico · pasivo · masaRobotica | 25 | kg | js/data.js:208 | — |
| Fase 1 | termico · pasivo · costoRobotico | 5 | millones USD | js/data.js:208 | — |
| Fase 1 | termico · pasivo · potenciaRobotica | 0 | W | js/data.js:208 | — |
| Fase 1 | termico · pasivo · masaTripulada | 300 | kg | js/data.js:208 | — |
| Fase 1 | termico · pasivo · costoTripulado | 40 | millones USD | js/data.js:208 | — |
| Fase 1 | termico · pasivo · potenciaTripulada | 0 | W | js/data.js:208 | — |
| Fase 1 | termico · activo · masaRobotica | 45 | kg | js/data.js:209 | — |
| Fase 1 | termico · activo · costoRobotico | 20 | millones USD | js/data.js:209 | — |
| Fase 1 | termico · activo · potenciaRobotica | 40 | W | js/data.js:209 | — |
| Fase 1 | termico · activo · masaTripulada | 450 | kg | js/data.js:209 | — |
| Fase 1 | termico · activo · costoTripulado | 120 | millones USD | js/data.js:209 | — |
| Fase 1 | termico · activo · potenciaTripulada | 600 | W | js/data.js:209 | — |
| Fase 1 | potencia · solarPequena · masaPaneles | 50 | kg | js/data.js:216 | Las tres opciones robóticas repiten estos 50 kg de paneles. |
| Fase 1 | potencia · solarPequena · horasBateria | 8 | h | js/data.js:216 | La opción nuclear robótica repite estas 8 h (js/data.js:218). |
| Fase 1 | potencia · solarPequena · costo | 15 | millones USD | js/data.js:216 | — |
| Fase 1 | potencia · solarPequena · generacion | 450 | W | js/data.js:216 | Las tres opciones robóticas generan 450 W. |
| Fase 1 | potencia · solarPequena · horasDeNoche | 0 | h | js/data.js:216 | — |
| Fase 1 | potencia · solarGrande · masaPaneles | 50 | kg | js/data.js:217 | — |
| Fase 1 | potencia · solarGrande · horasBateria | 100 | h | js/data.js:217 | La noche del sitio polo sur también es 100 h (js/data.js:321). |
| Fase 1 | potencia · solarGrande · costo | 30 | millones USD | js/data.js:217 | — |
| Fase 1 | potencia · solarGrande · generacion | 450 | W | js/data.js:217 | — |
| Fase 1 | potencia · solarGrande · horasDeNoche | 100 | h | js/data.js:217 | — |
| Fase 1 | potencia · radioisotopo · masaPaneles | 50 | kg | js/data.js:218 | — |
| Fase 1 | potencia · radioisotopo · horasBateria | 8 | h | js/data.js:218 | — |
| Fase 1 | potencia · radioisotopo · masaRps | 45 | kg | js/data.js:218 | El texto de la misma opción dice unos 45 kg. Coincide. |
| Fase 1 | potencia · radioisotopo · costo | 110 | millones USD | js/data.js:218 | — |
| Fase 1 | potencia · radioisotopo · generacion | 450 | W | js/data.js:218 | — |
| Fase 1 | potencia · radioisotopo · generacionNocturna | 110 | W | js/data.js:218 | El texto de la misma opción dice unos 110 W. Coincide. |
| Fase 1 | potencia · radioisotopo · horasDeNoche | 9999 | h | js/data.js:218 | — |
| Fase 1 | potencia · panelesTripulados · alasCitadas | 4 | alas | js/data.js:219 | — |
| Fase 1 | potencia · panelesTripulados · potenciaCitada | 11.2 | kW | js/data.js:219 | La opción solo genera 2500 W (2.5 kW), no 11.2 kW. |
| Fase 1 | potencia · panelesTripulados · masa | 500 | kg | js/data.js:219 | — |
| Fase 1 | potencia · panelesTripulados · costo | 80 | millones USD | js/data.js:219 | — |
| Fase 1 | potencia · panelesTripulados · generacion | 2500 | W | js/data.js:219 | El texto de la misma línea dice 11.2 kW. |
| Fase 1 | potencia · panelesConBaterias · masa | 900 | kg | js/data.js:220 | — |
| Fase 1 | potencia · panelesConBaterias · costo | 150 | millones USD | js/data.js:220 | — |
| Fase 1 | potencia · panelesConBaterias · generacion | 2500 | W | js/data.js:220 | — |
| Fase 1 | potencia · celdasDeCombustible · masa | 1100 | kg | js/data.js:221 | — |
| Fase 1 | potencia · celdasDeCombustible · costo | 200 | millones USD | js/data.js:221 | — |
| Fase 1 | potencia · celdasDeCombustible · generacion | 3000 | W | js/data.js:221 | — |
| Fase 1 | ciencia · camara · fuerza | 1 | puntos | js/data.js:228 | — |
| Fase 1 | ciencia · camara · masaRobotica | 12 | kg | js/data.js:228 | — |
| Fase 1 | ciencia · camara · potenciaRobotica | 15 | W | js/data.js:228 | — |
| Fase 1 | ciencia · camara · costoRobotico | 25 | millones USD | js/data.js:228 | — |
| Fase 1 | ciencia · camara · masaTripulada | 15 | kg | js/data.js:228 | — |
| Fase 1 | ciencia · camara · potenciaTripulada | 15 | W | js/data.js:228 | — |
| Fase 1 | ciencia · camara · costoTripulado | 25 | millones USD | js/data.js:228 | — |
| Fase 1 | ciencia · espectrometro · fuerza | 2 | puntos | js/data.js:229 | — |
| Fase 1 | ciencia · espectrometro · masaRobotica | 18 | kg | js/data.js:229 | — |
| Fase 1 | ciencia · espectrometro · potenciaRobotica | 25 | W | js/data.js:229 | — |
| Fase 1 | ciencia · espectrometro · costoRobotico | 40 | millones USD | js/data.js:229 | — |
| Fase 1 | ciencia · espectrometro · masaTripulada | 20 | kg | js/data.js:229 | — |
| Fase 1 | ciencia · espectrometro · potenciaTripulada | 25 | W | js/data.js:229 | — |
| Fase 1 | ciencia · espectrometro · costoTripulado | 40 | millones USD | js/data.js:229 | — |
| Fase 1 | ciencia · neutrones · fuerza | 2 | puntos | js/data.js:230 | — |
| Fase 1 | ciencia · neutrones · masaRobotica | 22 | kg | js/data.js:230 | — |
| Fase 1 | ciencia · neutrones · potenciaRobotica | 15 | W | js/data.js:230 | — |
| Fase 1 | ciencia · neutrones · costoRobotico | 30 | millones USD | js/data.js:230 | — |
| Fase 1 | ciencia · neutrones · masaTripulada | 25 | kg | js/data.js:230 | — |
| Fase 1 | ciencia · neutrones · potenciaTripulada | 15 | W | js/data.js:230 | — |
| Fase 1 | ciencia · neutrones · costoTripulado | 30 | millones USD | js/data.js:230 | — |
| Fase 1 | ciencia · recolector · fuerza | 3 | puntos | js/data.js:231 | — |
| Fase 1 | ciencia · recolector · masaRobotica | 30 | kg | js/data.js:231 | — |
| Fase 1 | ciencia · recolector · potenciaRobotica | 40 | W | js/data.js:231 | — |
| Fase 1 | ciencia · recolector · costoRobotico | 35 | millones USD | js/data.js:231 | — |
| Fase 1 | ciencia · recolector · masaTripulada | 40 | kg | js/data.js:231 | — |
| Fase 1 | ciencia · recolector · potenciaTripulada | 0 | W | js/data.js:231 | — |
| Fase 1 | ciencia · recolector · costoTripulado | 20 | millones USD | js/data.js:231 | — |
| Fase 1 | cohetes · pequeno · capacidad | 1500 | kg | js/data.js:239 | — |
| Fase 1 | cohetes · pequeno · costo | 60 | millones USD | js/data.js:239 | — |
| Fase 1 | cohetes · medio · capacidad | 4000 | kg | js/data.js:240 | — |
| Fase 1 | cohetes · medio · costo | 120 | millones USD | js/data.js:240 | — |
| Fase 1 | cohetes · pesado · capacidad | 12000 | kg | js/data.js:241 | — |
| Fase 1 | cohetes · pesado · costo | 250 | millones USD | js/data.js:241 | — |
| Fase 1 | cohetes · slsBloque1 · capacidad | 27000 | kg | js/data.js:244 | — |
| Fase 1 | cohetes · slsBloque1 · costo | 2200 | millones USD | js/data.js:244 | — |
| Fase 1 | cohetes · slsBloque1B · capacidad | 38000 | kg | js/data.js:245 | — |
| Fase 1 | cohetes · slsBloque1B · costo | 2500 | millones USD | js/data.js:245 | — |
| Fase 1 | cohetes · slsBloque2 · capacidad | 46000 | kg | js/data.js:246 | La ficha del Apolo 17 dice que el conjunto real pesaba unas 46.8 t (js/data.js:108), por encima de esta capacidad. |
| Fase 1 | cohetes · slsBloque2 · costo | 2800 | millones USD | js/data.js:246 | — |
| Fase 1 | presupuesto · robotico · cadete | 650 | millones USD | js/data.js:252 | — |
| Fase 1 | presupuesto · robotico · ingeniero | 500 | millones USD | js/data.js:252 | — |
| Fase 1 | presupuesto · robotico · director | 420 | millones USD | js/data.js:252 | Ninguna dificultad vale 450. Las maquetas usan 450 millones (docs/pantallas-fase-0-1.md:61). |
| Fase 1 | presupuesto · tripulado · cadete | 7700 | millones USD | js/data.js:253 | — |
| Fase 1 | presupuesto · tripulado · ingeniero | 6400 | millones USD | js/data.js:253 | El salto hasta Director es de solo 100 millones (6300). |
| Fase 1 | presupuesto · tripulado · director | 6300 | millones USD | js/data.js:253 | — |
| Fase 1 | deltaV · tli | 3150 | m/s | js/data.js:146 | — |
| Fase 1 | etapaSuperior · isp | 462 | s | js/sim/p1.js:25 | El motor de la nave, para el resto de quemas, es 314 s (js/data.js:154). |
| Fase 1 | etapaSuperior · duracionQuema | 600 | s | js/sim/p1.js:26 | — |
| Fase 1 | etapaSuperior · estrellas | 0, 0.1, 0.2 | fracción de capacidad | js/sim/p1.js:28 | El aviso de "menos del 10%" está otra vez, suelto, en js/model.js:813. |
| Fase 1 | umbrales · margenDeMasaBajo | 0.1 | fracción | js/model.js:813 | La primera estrella extra de la fase 1 usa el mismo 10% (js/sim/p1.js:28). |
| Fase 1 | umbrales · medidorEnAmbar | 0.8 | fracción | js/app.js:146 | La guía de pantallas dice lo mismo. No es el 80% del búfer de la fase 4. |
| Fase 1 | umbrales · techoDelMedidor | 1.2 | fracción | js/app.js:145 | — |
| Fase 1 | umbrales · nocheCualquiera | 300 | h | js/app.js:302 | La noche ecuatorial del juego es 354 h (js/data.js:315). Un valor entre 300 y 353 h se anunciaría mal. Ninguna opción actual cae ahí. |
| Fase 1 | umbrales · bandaMuertaDelMedidor | 0.5 | kg, millones USD o W | js/app.js:148 | — |
| Fase 2 | porPersonaDia · oxigeno | 0.895 | kg/persona·día | js/data.js:264 | El rótulo de la ecuación repite 0.895 en js/model.js:460. La pantalla lo redondea a 0.9 kg (js/app.js:436). |
| Fase 2 | porPersonaDia · comida | 0.8 | kg/persona·día | js/data.js:264 | El rótulo repite 0.800 en js/model.js:461. La pantalla dice unos 0.8 kg. |
| Fase 2 | porPersonaDia · agua | 3.217 | kg/persona·día | js/data.js:264 | El rótulo repite 3.217 en js/model.js:462. La pantalla lo redondea a 3.2 kg (js/app.js:436). |
| Fase 2 | pantallaRedondeada · oxigeno | 0.9 | kg/persona·día | js/app.js:436 | El motor usa 0.895. |
| Fase 2 | pantallaRedondeada · comida | 0.8 | kg/persona·día | js/app.js:436 | Coincide con 0.800 del motor. |
| Fase 2 | pantallaRedondeada · agua | 3.2 | kg/persona·día | js/app.js:436 | El motor usa 3.217. |
| Fase 2 | tripulacion · masaPorPersona | 82 | kg | js/data.js:265 | — |
| Fase 2 | tripulacion · diasDeTransito | 3 | días | js/data.js:266 | 3 días son 72 h. La ficha dice que el Apolo 11 tardó unas 76 h (js/data.js:97). |
| Fase 2 | tripulacion · diasEnSuperficie | 3 | días | js/data.js:267 | 3 días son 72 h. La ficha dice que el Apolo 17 estuvo 75 h (js/data.js:98). |
| Fase 2 | tripulacion · minimo | 1 | personas | js/data.js:268 | — |
| Fase 2 | tripulacion · maximo | 4 | personas | js/data.js:268 | — |
| Fase 2 | tripulacion · diasMaximos | 30 | días | js/data.js:269 | — |
| Fase 2 | tripulacion · bajanComoMaximo | 2 | personas | js/data.js:270 | — |
| Fase 2 | tripulacion · reservaOpciones | 0, 0.2 | fracción | js/data.js:271 | — |
| Fase 2 | reciclador · masa | 300 | kg | js/data.js:272 | — |
| Fase 2 | reciclador · potencia | 300 | W | js/data.js:272 | — |
| Fase 2 | reciclador · costo | 120 | millones USD | js/data.js:272 | — |
| Fase 2 | reciclador · recuperacion | 0.98 | fracción | js/data.js:272 | La ficha de la estación espacial dice 98% (js/data.js:96). Es la misma cifra. |
| Fase 2 | trajes · ligero · masa | 90 | kg | js/data.js:275 | — |
| Fase 2 | trajes · ligero · horasEva | 4 | h | js/data.js:275 | La fase 6 usa esta duración una sola vez. El informe del sitio la multiplica por días y por tripulantes (js/model.js:372). |
| Fase 2 | trajes · ligero · costo | 20 | millones USD | js/data.js:275 | — |
| Fase 2 | trajes · lunar · masa | 125 | kg | js/data.js:276 | — |
| Fase 2 | trajes · lunar · horasEva | 8 | h | js/data.js:276 | — |
| Fase 2 | trajes · lunar · costo | 50 | millones USD | js/data.js:276 | — |
| Fase 2 | trajes · lunar · horasEnSombraCitadas | 2 | h | js/data.js:276 | — |
| Fase 2 | trajes · lunar · temperaturaCitada | 48 | K | js/data.js:276 | El sitio del polo y la ficha Diviner dicen unos 25 K (js/data.js:107 y :322). |
| Fase 2 | trajes · pesado · masa | 150 | kg | js/data.js:277 | — |
| Fase 2 | trajes · pesado · horasEva | 10 | h | js/data.js:277 | — |
| Fase 2 | trajes · pesado · costo | 70 | millones USD | js/data.js:277 | — |
| Fase 2 | simulacion · paso | 0.25 | días | js/sim/p2.js:27 | — |
| Fase 2 | simulacion · probabilidadTormenta | 0.35 | probabilidad | js/sim/p2.js:28 | — |
| Fase 2 | simulacion · retrasoTormenta | 1 | día | js/sim/p2.js:29 | El evento de la fase 3 también cuesta 1 día (js/data.js:345). |
| Fase 2 | simulacion · refugioPorPersona | 10 | kg | js/sim/p2.js:30 | — |
| Fase 2 | simulacion · aguaEnCircuito | 3 | días | js/sim/p2.js:31 | — |
| Fase 2 | simulacion · sobranteSeguro | 0.1 | fracción | js/sim/p2.js:32 | — |
| Fase 2 | simulacion · sobranteGratis | 0.3 | fracción | js/sim/p2.js:33 | — |
| Fase 2 | simulacion · estrellas | 0, 0.5, 0.9 | puntaje | js/sim/p2.js:34 | — |
| Fase 2 | simulacion · estrellasRobot | 0, 0.5, 1 | puntaje | js/sim/p2.js:84 | No vive en el bloque TUNING. El umbral de 3 estrellas (1) no es el 0.9 de la misión tripulada. |
| Fase 3 | deltaV · loi | 950 | m/s | js/data.js:147 | — |
| Fase 3 | deltaV · descenso | 2074 | m/s | js/data.js:148 | La fase 5 gasta una parte del margen de este delta-v en vuelo estacionario. |
| Fase 3 | margen · opciones | 0, 0.05, 0.1, 0.15, 0.2 | fracción | js/data.js:283 | — |
| Fase 3 | margen · minimoCadete | 0 | fracción | js/data.js:284 | — |
| Fase 3 | margen · minimoIngeniero | 0.05 | fracción | js/data.js:284 | — |
| Fase 3 | margen · minimoDirector | 0.1 | fracción | js/data.js:284 | La ficha dice que el plan CEV guardaba 15 m/s, cerca del 1% de los 1450 m/s de regreso (js/data.js:99), no un 10%. |
| Fase 3 | margen · porDefecto | 0 | fracción | js/data.js:285 | — |
| Fase 3 | eventos · crecimientoDeMasa | 0.05 | fracción | js/data.js:339 | El evento puede salir en las fases 1 y 3. |
| Fase 3 | eventos · redisenoRobotico | 25 | millones USD | js/data.js:340 | — |
| Fase 3 | eventos · redisenoTripulado | 250 | millones USD | js/data.js:340 | — |
| Fase 3 | eventos · diaDeRefugio | 1 | día | js/data.js:345 | La simulación de la fase 2 usa el mismo día extra (js/sim/p2.js:29). |
| Fase 3 | eventos · riesgoPorSeguir | 1 | puntos | js/data.js:346 | El mismo +1 está en el lanzamiento con mal tiempo (js/data.js:352). |
| Fase 3 | eventos · esperaRobotica | 10 | millones USD | js/data.js:351 | — |
| Fase 3 | eventos · esperaTripulada | 60 | millones USD | js/data.js:351 | — |
| Fase 3 | eventos · probabilidad · cadete | 0.3 | probabilidad | js/data.js:355 | — |
| Fase 3 | eventos · probabilidad · ingeniero | 0.6 | probabilidad | js/data.js:355 | — |
| Fase 3 | eventos · probabilidad · director | 0.9 | probabilidad | js/data.js:355 | — |
| Fase 3 | umbralDeRiesgo | 2 | puntos | js/model.js:860 | — |
| Fase 3 | simulacion · horasDeQuema | 0.5 | h | js/sim/p3.js:27 | — |
| Fase 3 | simulacion · correccionMaxima | 5 | m/s | js/sim/p3.js:28 | Dos correcciones de 5 m/s caben en la reserva fija de 10 m/s. |
| Fase 3 | simulacion · reservaDeNavegacion | 0.02 | fracción | js/sim/p3.js:29 | Es igual a la dispersión de regreso de Cadete (js/data.js:455). Si una cambia, la otra no. |
| Fase 3 | simulacion · reservaDeCorrecciones | 10 | m/s | js/sim/p3.js:30 | — |
| Fase 3 | simulacion · puntoDulce | 0.05 | fracción | js/sim/p3.js:33 | — |
| Fase 3 | simulacion · pesoDelExceso | 0.5 | fracción | js/sim/p3.js:182 | — |
| Fase 3 | simulacion · estrellas | 0, 0.01, 0.025 | fracción del delta-v necesario | js/sim/p3.js:34 | — |
| Fase 3 | simulacion · horasDeToma | 1 | h | js/sim/p3.js:85 | — |
| Fase 3 | dibujo · panzaDeLaRuta | 70000 | km | js/sim/p3.js:31 | — |
| Fase 3 | dibujo · radioAlrededorDeLaLuna | 9000 | km | js/sim/p3.js:32 | El radio real de la Luna en el juego es 1737.4 km (js/data.js:131). |
| Fase 3 | dibujo · divisorDeOrbita | 6 | h/rad | js/sim/p3.js:97 | — |
| Fase 4 | enlaces · bandaS · tasa | 2 | Mbps | js/data.js:292 | — |
| Fase 4 | enlaces · bandaS · horasDeContacto | 8 | h/día | js/data.js:292 | — |
| Fase 4 | enlaces · bandaS · masaRobotica | 12 | kg | js/data.js:294 | — |
| Fase 4 | enlaces · bandaS · potenciaRobotica | 40 | W | js/data.js:294 | La guía de pantallas hablaba de +10 W y 1 Gb (docs/api.md:352). |
| Fase 4 | enlaces · bandaS · costoRobotico | 10 | millones USD | js/data.js:294 | — |
| Fase 4 | enlaces · bandaS · masaTripulada | 60 | kg | js/data.js:294 | — |
| Fase 4 | enlaces · bandaS · potenciaTripulada | 150 | W | js/data.js:294 | — |
| Fase 4 | enlaces · bandaS · costoTripulado | 30 | millones USD | js/data.js:294 | — |
| Fase 4 | enlaces · bandaKa · tasa | 100 | Mbps | js/data.js:295 | El texto dice "100 a 300 Mbps". El modelo solo usa 100. Con 2.5 h sale 900 Gb/día en la antena de 34 m, que es lo que el texto llama "unos 900 Gb". |
| Fase 4 | enlaces · bandaKa · tasaAltaCitada | 300 | Mbps | js/data.js:296 | — |
| Fase 4 | enlaces · bandaKa · horasDeContacto | 2.5 | h/día | js/data.js:295 | — |
| Fase 4 | enlaces · bandaKa · masaRobotica | 30 | kg | js/data.js:297 | — |
| Fase 4 | enlaces · bandaKa · potenciaRobotica | 110 | W | js/data.js:297 | La guía de pantallas hablaba de +25 W y 4 Gb (docs/api.md:353). |
| Fase 4 | enlaces · bandaKa · costoRobotico | 40 | millones USD | js/data.js:297 | — |
| Fase 4 | enlaces · bandaKa · masaTripulada | 120 | kg | js/data.js:297 | — |
| Fase 4 | enlaces · bandaKa · potenciaTripulada | 300 | W | js/data.js:297 | — |
| Fase 4 | enlaces · bandaKa · costoTripulado | 90 | millones USD | js/data.js:297 | — |
| Fase 4 | enlaces · laser · tasa | 260 | Mbps | js/data.js:298 | — |
| Fase 4 | enlaces · laser · horasDeContacto | 2.5 | h/día | js/data.js:298 | — |
| Fase 4 | enlaces · laser · masaRobotica | 28 | kg | js/data.js:300 | — |
| Fase 4 | enlaces · laser · potenciaRobotica | 130 | W | js/data.js:300 | La guía de pantallas hablaba de +40 W y 8 Gb (docs/api.md:354). |
| Fase 4 | enlaces · laser · costoRobotico | 80 | millones USD | js/data.js:300 | — |
| Fase 4 | enlaces · laser · masaTripulada | 90 | kg | js/data.js:300 | — |
| Fase 4 | enlaces · laser · potenciaTripulada | 250 | W | js/data.js:300 | — |
| Fase 4 | enlaces · laser · costoTripulado | 150 | millones USD | js/data.js:300 | — |
| Fase 4 | antenas · diametroBase | 34 | m | js/data.js:306 | Es el mismo 34 m de la antena dsn34. |
| Fase 4 | antenas · dsn34 · diametro | 34 | m | js/data.js:303 | — |
| Fase 4 | antenas · dsn34 · costoRobotico | 5 | millones USD | js/data.js:303 | — |
| Fase 4 | antenas · dsn34 · costoTripulado | 20 | millones USD | js/data.js:303 | — |
| Fase 4 | antenas · dsn70 · diametro | 70 | m | js/data.js:304 | — |
| Fase 4 | antenas · dsn70 · costoRobotico | 15 | millones USD | js/data.js:304 | — |
| Fase 4 | antenas · dsn70 · costoTripulado | 60 | millones USD | js/data.js:304 | — |
| Fase 4 | antenas · dsn26Citada | 26 | m | js/data.js:101 | — |
| Fase 4 | geometria · apagon | 41 | min | js/data.js:307 | El mismo 41 está en el texto del evento de la fase 6 (js/data.js:439) y en las fichas (js/data.js:102 y :482). |
| Fase 4 | geometria · perigeo | 363300 | km | js/data.js:308 | — |
| Fase 4 | geometria · apogeo | 405500 | km | js/data.js:308 | — |
| Fase 4 | datosPorDia · camara | 300 | Gb/día | js/data.js:309 | No es el 1.2 Gb de una foto en la fase 6. Una es el ritmo del día y la otra es una medición. |
| Fase 4 | datosPorDia · espectrometro | 40 | Gb/día | js/data.js:309 | La medición de la fase 6 cuesta 0.4 Gb (js/data.js:373). |
| Fase 4 | datosPorDia · neutrones | 5 | Gb/día | js/data.js:309 | La medición de la fase 6 cuesta 0.2 Gb (js/data.js:374). |
| Fase 4 | datosPorDia · recolector | 0 | Gb/día | js/data.js:309 | — |
| Fase 4 | datosPorDia · videoDeTripulacion | 50 | Gb/día | js/data.js:309 | — |
| Fase 4 | estaciones · goldstone | -116.9 | grados este | js/sim/p4.js:36 | Repetida en tools/fixtures.js:195. |
| Fase 4 | estaciones · madrid | -4.25 | grados este | js/sim/p4.js:37 | Repetida en tools/fixtures.js:195. |
| Fase 4 | estaciones · canberra | 148.98 | grados este | js/sim/p4.js:38 | Repetida en tools/fixtures.js:195. |
| Fase 4 | simulacion · buferRobotico | 150 | Gb | js/sim/p4.js:25 | La fase 6 usa otro búfer, de 5 Gb (js/data.js:366). |
| Fase 4 | simulacion · buferTripulado | 300 | Gb | js/sim/p4.js:25 | La fase 6 usa 5 Gb para las dos misiones. |
| Fase 4 | simulacion · fallo | 0.6 | fracción | js/sim/p4.js:26 | — |
| Fase 4 | simulacion · perdidaDespreciable | 0.001 | fracción | js/sim/p4.js:27 | — |
| Fase 4 | simulacion · probabilidadDeNubes | 0.3 | probabilidad | js/sim/p4.js:28 | — |
| Fase 4 | simulacion · colaRobotica | 24 | h | js/sim/p4.js:29 | — |
| Fase 4 | simulacion · paso | 1/12 | h | js/sim/p4.js:30 | — |
| Fase 4 | simulacion · avisoDeBufer | 0.8 | fracción | js/sim/p4.js:31 | No es el ámbar del medidor de la fase 1, aunque el número coincida. |
| Fase 4 | simulacion · estrellas | 60, 90, 99 | % entregado | js/sim/p4.js:32 | — |
| Fase 4 | simulacion · parcial | 0.99 | fracción | js/sim/p4.js:157 | Es el mismo 99% de la tercera estrella (js/sim/p4.js:32), escrito otra vez como 0.99. |
| Fase 5 | sitios · tranquilidad · noche | 354 | h | js/data.js:315 | La ficha de la noche ecuatorial dice las mismas 354 h (js/data.js:93). |
| Fase 5 | sitios · tranquilidad · dia | 354 | h | js/data.js:315 | — |
| Fase 5 | sitios · tranquilidad · peligro | 1 | puntos | js/data.js:315 | — |
| Fase 5 | sitios · tranquilidad · vueloEstacionario | 20 | s | js/data.js:315 | — |
| Fase 5 | sitios · descartes · noche | 354 | h | js/data.js:318 | — |
| Fase 5 | sitios · descartes · dia | 354 | h | js/data.js:318 | — |
| Fase 5 | sitios · descartes · peligro | 2 | puntos | js/data.js:318 | — |
| Fase 5 | sitios · descartes · vueloEstacionario | 35 | s | js/data.js:318 | — |
| Fase 5 | sitios · descartes · edadMinima | 3.8 | Ga | js/data.js:317 | — |
| Fase 5 | sitios · descartes · edadMaxima | 4.2 | Ga | js/data.js:317 | — |
| Fase 5 | sitios · poloSur · noche | 100 | h | js/data.js:321 | La batería grande también cubre 100 h (js/data.js:217). La ficha dice lo mismo (js/data.js:93). |
| Fase 5 | sitios · poloSur · dia | 600 | h | js/data.js:321 | — |
| Fase 5 | sitios · poloSur · peligro | 3 | puntos | js/data.js:321 | — |
| Fase 5 | sitios · poloSur · vueloEstacionario | 50 | s | js/data.js:321 | — |
| Fase 5 | descenso · reservaIncluida | 10 | s | js/data.js:325 | — |
| Fase 5 | descenso · parteDelMargen | 0.3 | fracción | js/data.js:326 | — |
| Fase 5 | descenso · dispersion | 0.6 | fracción | js/data.js:327 | — |
| Fase 5 | descenso · aterrizajeBrusco | 0.6 | fracción | js/data.js:328 | — |
| Fase 5 | descenso · factorCadete | 0.5 | fracción | js/data.js:329 | — |
| Fase 5 | descenso · factorIngeniero | 1 | fracción | js/data.js:329 | — |
| Fase 5 | descenso · factorDirector | 1.2 | fracción | js/data.js:329 | — |
| Fase 5 | aproximacion · paso | 0.1 | s | js/sim/p5.js:13 | — |
| Fase 5 | aproximacion · altitudInicial | 300 | m | js/sim/p5.js:14 | El demo la repite en demo/5b.js:136. |
| Fase 5 | aproximacion · velocidadVertical | -28 | m/s | js/sim/p5.js:15 | — |
| Fase 5 | aproximacion · velocidadLateral | 8 | m/s | js/sim/p5.js:16 | — |
| Fase 5 | aproximacion · desvioInicial | 60 | m | js/sim/p5.js:17 | — |
| Fase 5 | aproximacion · altitudDeEspera | 100 | m | js/sim/p5.js:18 | — |
| Fase 5 | aproximacion · frenado | 2 | m/s² | js/sim/p5.js:19 | — |
| Fase 5 | aproximacion · aceleracionMaxima | 3 | veces g lunar | js/sim/p5.js:20 | — |
| Fase 5 | aproximacion · masaFija | 15000 | kg | js/sim/p5.js:21 | No usa la masa del vehículo que el jugador diseñó. |
| Fase 5 | aproximacion · contactoSeguro | 2.1 | m/s | js/sim/p5.js:22 | — |
| Fase 5 | aproximacion · contactoLimpio | 1.2 | m/s | js/sim/p5.js:23 | — |
| Fase 5 | aproximacion · contactoBruscoMinimo | 2.4 | m/s | js/sim/p5.js:24 | Supera el límite seguro de 2.1 m/s, así que todo aterrizaje brusco queda por encima del límite. |
| Fase 5 | aproximacion · contactoBruscoExtra | 1.2 | m/s | js/sim/p5.js:25 | — |
| Fase 5 | aproximacion · caidaFinal | 0.25 | m/s² | js/sim/p5.js:26 | — |
| Fase 5 | aproximacion · segundosDeAborto | 14 | s | js/sim/p5.js:27 | — |
| Fase 5 | aproximacion · avisoDeCombustible | 20 | % | js/sim/p5.js:28 | El demo repite el 20 en demo/5b.js:130. |
| Fase 5 | aproximacion · estrellas | 0, 15, 30 | % de combustible | js/sim/p5.js:29 | — |
| Fase 5 | aproximacion · velocidadLateralBase | 0.8 | m/s | js/sim/p5.js:98 | — |
| Fase 5 | aproximacion · velocidadLateralPorPeligro | 0.4 | m/s | js/sim/p5.js:98 | — |
| Fase 6 | tiempo · horasRobot | 6 | h | js/data.js:363 | El informe del sitio, y con él la fase 4, usa las horas de luz y de noche del sitio (cientos de horas) si ya hay sitio elegido (js/model.js:371 y js/sim/p4.js:85). |
| Fase 6 | tiempo · penalizacionBrusca | 1 | h | js/data.js:364 | — |
| Fase 6 | datos · bufer | 5 | Gb | js/data.js:366 | La simulación de la fase 4 usa 150 Gb (robot) o 300 Gb (tripulación), en js/sim/p4.js:25. |
| Fase 6 | muestras · robot | 0.25 | kg | js/data.js:367 | Con 0.5 kg de capacidad caben dos. |
| Fase 6 | muestras · tripulacion | 25 | kg | js/data.js:367 | Con 100 kg de capacidad caben cuatro. |
| Fase 6 | muestras · capacidadRobot | 0.5 | kg | js/data.js:369 | La maqueta de la fase 6 dibuja un tope de 6 kg (pantallas_fase_6_y_7.md:65). |
| Fase 6 | muestras · capacidadTripulada | 100 | kg | js/data.js:369 | Es el mismo cupo de la fase 1 (js/data.js:172). |
| Fase 6 | topeDeAcciones | 60 | acciones | js/data.js:370 | — |
| Fase 6 | instrumentos · camara · potencia | 10 | W | js/data.js:372 | No es la potencia de 15 W del instrumento cargado en la fase 1. |
| Fase 6 | instrumentos · camara · horas | 0.5 | h | js/data.js:372 | — |
| Fase 6 | instrumentos · camara · datos | 1.2 | Gb | js/data.js:372 | — |
| Fase 6 | instrumentos · espectrometro · potencia | 40 | W | js/data.js:373 | El instrumento de la fase 1 consume 25 W. |
| Fase 6 | instrumentos · espectrometro · horas | 1 | h | js/data.js:373 | — |
| Fase 6 | instrumentos · espectrometro · datos | 0.4 | Gb | js/data.js:373 | — |
| Fase 6 | instrumentos · hidrogeno · potencia | 30 | W | js/data.js:374 | El detector de la fase 1 consume 15 W. |
| Fase 6 | instrumentos · hidrogeno · horas | 1 | h | js/data.js:374 | — |
| Fase 6 | instrumentos · hidrogeno · datos | 0.2 | Gb | js/data.js:374 | — |
| Fase 6 | instrumentos · muestra · potencia | 0 | W | js/data.js:375 | — |
| Fase 6 | instrumentos · muestra · horas | 1.5 | h | js/data.js:375 | — |
| Fase 6 | instrumentos · muestra · datos | 0 | Gb | js/data.js:375 | — |
| Fase 6 | evidencia · pista | 1 | rango | js/data.js:378 | — |
| Fase 6 | evidencia · composicion | 2 | rango | js/data.js:379 | — |
| Fase 6 | evidencia · muestra | 3 | rango | js/data.js:380 | — |
| Fase 6 | eventos · horasDeRefugio | -1 | h | js/data.js:435 | — |
| Fase 6 | eventos · riesgoPorSeguir | 1 | puntos | js/data.js:436 | — |
| Fase 6 | eventos · horasDeEspera | -1 | h | js/data.js:441 | El texto dice 41 minutos (js/data.js:439), pero el efecto resta 1 hora. |
| Fase 6 | eventos · medicionesSinSenal | 2 | mediciones | js/data.js:442 | — |
| Fase 6 | eventos · probabilidad · cadete | 0.1 | probabilidad | js/data.js:445 | — |
| Fase 6 | eventos · probabilidad · ingeniero | 0.2 | probabilidad | js/data.js:445 | — |
| Fase 6 | eventos · probabilidad · director | 0.3 | probabilidad | js/data.js:445 | — |
| Fase 7 | deltaV · ascenso | 1833 | m/s | js/data.js:149 | Con el regreso a la Tierra (1450) suma 3283 m/s. La guía de la fase 7 usa esa suma y coincide. |
| Fase 7 | deltaV · regreso | 1450 | m/s | js/data.js:150 | La ficha dice que esos 1450 m/s ya incluyen 15 m/s de reserva (js/data.js:99). El juego suma encima el margen de la fase 3. |
| Fase 7 | deltaV · directo | 2600 | m/s | js/data.js:151 | La etiqueta lo parte en 2380 m/s de escape y unos 220 m/s de pérdidas. |
| Fase 7 | deltaV · escapeCitado | 2380 | m/s | js/data.js:151 | — |
| Fase 7 | deltaV · perdidasCitadas | 220 | m/s | js/data.js:151 | 2380 + 220 = 2600, que es el valor que usa el motor. |
| Fase 7 | deltaV · reservaYaIncluida | 15 | m/s | js/data.js:99 | — |
| Fase 7 | dispersion · cadete | 0.02 | fracción | js/data.js:455 | Igual que la reserva de navegación de la fase 3 (js/sim/p3.js:29). |
| Fase 7 | dispersion · ingeniero | 0.06 | fracción | js/data.js:455 | — |
| Fase 7 | dispersion · director | 0.1 | fracción | js/data.js:455 | — |
| Fase 7 | entrada · directa · cargaTermica | 1 | unidades de carga | js/data.js:458 | — |
| Fase 7 | entrada · directa · error | 14 | km | js/data.js:458 | — |
| Fase 7 | entrada · skip · cargaTermica | 1.3 | unidades de carga | js/data.js:460 | — |
| Fase 7 | entrada · skip · error | 5 | km | js/data.js:460 | — |
| Fase 7 | entrada · skip · picos | 2 | picos | js/data.js:460 | — |
| Fase 7 | escudos · fino · capacidad | 1.5 | unidades de carga | js/data.js:463 | — |
| Fase 7 | escudos · fino · masaRobotica | 0 | kg | js/data.js:463 | — |
| Fase 7 | escudos · fino · masaTripulada | 0 | kg | js/data.js:463 | — |
| Fase 7 | escudos · estandar · capacidad | 1.9 | unidades de carga | js/data.js:464 | — |
| Fase 7 | escudos · estandar · masaRobotica | 2 | kg | js/data.js:464 | — |
| Fase 7 | escudos · estandar · masaTripulada | 150 | kg | js/data.js:464 | — |
| Fase 7 | escudos · grueso · capacidad | 2.3 | unidades de carga | js/data.js:465 | — |
| Fase 7 | escudos · grueso · masaRobotica | 4 | kg | js/data.js:465 | — |
| Fase 7 | escudos · grueso · masaTripulada | 300 | kg | js/data.js:465 | — |
| Fase 7 | termico · margenHolgado | 1.4 | veces la carga | js/data.js:467 | — |
| Fase 7 | termico · margenJusto | 1.15 | veces la carga | js/data.js:467 | — |
| Fase 7 | termico · factorCadete | 0.9 | fracción | js/data.js:467 | — |
| Fase 7 | termico · factorIngeniero | 1 | fracción | js/data.js:467 | — |
| Fase 7 | termico · factorDirector | 1.15 | fracción | js/data.js:467 | — |
| Fase 7 | amerizaje · zona | 10 | km | js/data.js:468 | 5.4 millas náuticas, la exigencia del Artemis I citada en js/data.js:480, son unos 10.0 km. Puede ser la misma cifra en otra unidad. |
| Fase 7 | amerizaje · errorMinimo | 0.5 | km | js/data.js:468 | — |
| Fase 7 | amerizaje · factorCadete | 0.6 | fracción | js/data.js:468 | — |
| Fase 7 | amerizaje · factorIngeniero | 1 | fracción | js/data.js:468 | — |
| Fase 7 | amerizaje · factorDirector | 1.2 | fracción | js/data.js:468 | — |
| Citas | temperaturas · dia | 127 | °C | js/data.js:85 | Los sitios la repiten, por ejemplo en js/data.js:316. |
| Citas | temperaturas · noche | -173 | °C | js/data.js:85 | Los sitios la repiten, por ejemplo en js/data.js:316. |
| Citas | temperaturas · crater | 25 | K | js/data.js:107 | El traje habla de 48 K (js/data.js:276). |
| Citas | muestrasHistoricas · apolo | 382 | kg | js/data.js:86 | — |
| Citas | muestrasHistoricas · numeroDeMuestrasApolo | 2200 | muestras | js/data.js:86 | — |
| Citas | muestrasHistoricas · luna | 300 | g | js/data.js:87 | La cápsula robótica del juego trae hasta 0.5 kg, más que estos 300 g. |
| Citas | muestrasHistoricas · apolo17Etiqueta | 110 | kg | js/data.js:172 | El cupo del juego es 100 kg. |
| Citas | lro · masa | 1000 | kg | js/data.js:88 | — |
| Citas | lro · potencia | 400 | W | js/data.js:88 | — |
| Citas | lro · carga | 100 | kg | js/data.js:88 | — |
| Citas | lro · potenciaDeCarga | 100 | W | js/data.js:88 | — |
| Citas | duracionesHistoricas · transitoApolo11 | 76 | h | js/data.js:97 | El juego usa 3 días, o sea 72 h (js/data.js:266). |
| Citas | duracionesHistoricas · estanciaApolo17 | 75 | h | js/data.js:98 | El juego usa 3 días, o sea 72 h (js/data.js:267). |
| Citas | apolo17 · moduloDeMando | 30320 | kg | js/data.js:108 | — |
| Citas | apolo17 · moduloLunar | 16456 | kg | js/data.js:108 | — |
| Citas | apolo17 · conjunto | 46.8 | t | js/data.js:108 | El cohete más capaz del juego levanta 46 t (js/data.js:246). |
| Citas | combustibleApolo11 · restante | 45 | s | js/data.js:106 | — |
| Citas | combustibleApolo11 · reservaDeAborto | 20 | s | js/data.js:106 | — |
| Citas | reentrada · alcanceSkip | 5524 | millas | js/data.js:475 | — |
| Citas | reentrada · alcanceApolo | 1725 | millas | js/data.js:475 | — |
| Citas | reentrada · velocidad | 24581 | mph | js/data.js:476 | — |
| Citas | reentrada · velocidadEnKmS | 11 | km/s | js/data.js:476 | — |
| Citas | reentrada · temperaturaEscudo | 2760 | °C | js/data.js:477 | — |
| Citas | reentrada · temperaturaEscudoF | 5000 | °F | js/data.js:477 | — |
| Citas | reentrada · zonasArtemis2 | 9 | zonas | js/data.js:478 | — |
| Citas | reentrada · zonasArtemis1 | 103 | zonas | js/data.js:478 | — |
| Citas | reentrada · paracaidasMph | 17 | mph | js/data.js:479 | — |
| Citas | reentrada · paracaidasKmH | 27 | km/h | js/data.js:479 | — |
| Citas | reentrada · exigenciaArtemis1 | 5.4 | millas náuticas | js/data.js:480 | Son unos 10.0 km, el radio de la zona de recuperación del juego (js/data.js:468). |
| Citas | reentrada · errorArtemis2 | 0.59 | millas | js/data.js:481 | — |
| Maquetas | presupuestoDePantalla | 450 | millones USD | docs/pantallas-fase-0-1.md:61 | Se repite en pantallas_fase_6_y_7.md:66 y en docs/api.md:344. El motor usa 420, 500 o 650 en robótico, y 6300, 6400 o 7700 en tripulado. Hay una copia idéntica de la guía de fases 6 y 7 en la raíz del repositorio. |
| Maquetas | masaDeRetorno | 6 | kg | pantallas_fase_6_y_7.md:65 | El motor usa 0.5 kg en robótico y 100 kg en tripulado. |
| Maquetas | potenciaDePantalla | 320 | W | pantallas_fase_6_y_7.md:67 | No coincide con la generación del motor: 450 W robótico, 2500 o 3000 W tripulado. |
| Maquetas | potenciaMaximaDePantalla | 500 | W | pantallas_fase_6_y_7.md:67 | — |
| Maquetas | masaTripuladaDePantalla | 18400 | kg | docs/api.md:348 | La propia nota dice que el fixture real sale en unos 44035 kg. |
| Maquetas | costoTripuladoDePantalla | 412 | millones USD | docs/api.md:348 | La nota dice que el fixture con SLS Bloque 2 cuesta 6125 millones. |
| Maquetas | potenciaTripuladaDePantalla | 2.1 | kW | docs/api.md:348 | La nota dice que el fixture necesita 940 W y genera 2500 W. |
| Maquetas | deltaVDePantalla | 6620 | m/s | docs/api.md:350 | La nota lo explica como 6307 m/s del plan tripulado por 1.05. El plan sin margen es 6307 m/s. |
| Maquetas | deltaVTrasLoi | 5357 | m/s | docs/api.md:351 | La nota dice que no existe en el motor: es 6307 menos los 950 m/s de la órbita lunar. |
| Maquetas | radioDePantallaW | 10 | W | docs/api.md:352 | El radio en banda S gasta 40 W robótico o 150 W tripulado. |
| Maquetas | radioDePantallaGb | 1 | Gb | docs/api.md:352 | Con la antena de 34 m el motor manda 57.6 Gb al día. |
| Maquetas | kaDePantallaW | 25 | W | docs/api.md:353 | La banda Ka gasta 110 W robótico o 300 W tripulado. |
| Maquetas | kaDePantallaGb | 4 | Gb | docs/api.md:353 | Con la antena de 34 m el motor manda 900 Gb al día. |
| Maquetas | laserDePantallaW | 40 | W | docs/api.md:354 | El láser gasta 130 W robótico o 250 W tripulado. |
| Maquetas | laserDePantallaGb | 8 | Gb | docs/api.md:354 | El motor manda 2340 Gb al día, y la antena no cambia esa cifra. |
| Sin clasificar | topeDeCuadros | 200 | cuadros | js/sim/kit.js:23 | — |
| Sin clasificar | cuadrosDelLanzamiento | 100 | cuadros | js/sim/p1.js:27 | — |
| Sin clasificar | muestrasDeLaRuta | 120 | muestras | js/sim/p3.js:35 | — |
| Sin clasificar | cuadrosDeComunicaciones | 180 | cuadros | js/sim/p4.js:33 | — |
| Sin clasificar | escalaDeAltitud | 700 | m | js/sim/p5.js:123 | — |
| Sin clasificar | escalaDeVelocidad | 35 | m/s | js/sim/p5.js:124 | — |
| Sin clasificar | escalaLateral | 100 | m | js/sim/p5.js:125 | — |
| Sin clasificar | escalaDeReserva | 12000 | m/s | js/sim/p3.js:42 | — |
| Sin clasificar | kitDeInterfaz · masa | 420 | kg | src/dev/DevUi.jsx:29 | — |
| Sin clasificar | kitDeInterfaz · masaMaxima | 2000 | kg | src/dev/DevUi.jsx:29 | — |
| Sin clasificar | kitDeInterfaz · costo | 80 | millones USD | src/dev/DevUi.jsx:30 | — |
| Sin clasificar | kitDeInterfaz · costoMaximo | 150 | millones USD | src/dev/DevUi.jsx:30 | — |
| Sin clasificar | kitDeInterfaz · potencia | 5 | W | src/dev/DevUi.jsx:31 | — |
| Sin clasificar | kitDeInterfaz · potenciaMaxima | 5 | W | src/dev/DevUi.jsx:31 | — |

## Pantalla F0

La pantalla enseña tres topes en el HUD, todos leídos de `mission.config.mjs`: la capacidad del lanzador medio (`fase1.cohetes.medio.capacidad`), el presupuesto de las guías (`maquetas.presupuestoDePantalla`) y la generación de los paneles robóticos (`fase1.potencia.solarPequena.generacion`). Los valores actuales de esa barra se muestran en 0 porque en esta fase todavía no hay nave.

Después de cada respuesta, el panel de aprendizaje muestra como máximo cuatro líneas, solo el dato y el valor. Cada cifra sale de `src/data/mission.config.mjs`. La fuente sigue en esa entrada y no se escribe en el panel.

No se muestran, porque no están en el config:

- Cantidad, concentración o porcentaje de hielo de agua. La pregunta del agua solo enseña la masa, la potencia y la fuerza del detector de neutrones, y la noche de 100 h del polo sur.
- Un rango de masa del aterrizador publicado por la NASA. El config tiene el núcleo robótico (250 kg), el módulo lunar del Apolo 17 (16 456 kg) y las bandas de aviso de la masa de descenso (1 000–2 500 kg robótico y 15 000–17 000 kg tripulado), estas últimas como valor de juego. La pantalla enseña esas bandas y el módulo del Apolo 17. No fabrica otro rango.
- Un total de horas de superficie tripuladas o de horas de EVA. Están por separado la estancia de 72 h, las 4 caminatas por persona y las duraciones de traje de 4, 6 y 8 h. La pantalla no las multiplica. En la misión tripulada enseña las 4 caminatas; en la robótica, las 354 h de luz.
- La gravedad de la Luna (1.62 m/s²) sigue en `compartido.luna.gravedad` y no entra en el panel.
