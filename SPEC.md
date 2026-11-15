# By Heart: especificación

Verbos irregulares en inglés (y, más adelante, phrasal verbs). Versión 0.1 (15/11/2026). Documento vivo: actualizar cuando cambie una decisión.

Nombre: By Heart (repo `by-heart`), "de memoria" en inglés. El nombre no habla de verbos a propósito: cabe más contenido de la asignatura sin renombrar la app.

**Origen:** By Heart parte de una copia de Capitalia 1.3.2 (https://github.com/Darmin-ddr/capitalia). Hereda su forma de enseñar, su estilo visual y casi toda su lógica; cambia el contenido y desaparece el mapa. Lo marcado con **(por confirmar)** es una propuesta que el responsable aún no ha cerrado; la lista completa está en la sección 14.

## 1. Objetivo

Herramienta interactiva para que un alumno de secundaria se aprenda de memoria los verbos irregulares en inglés (infinitivo, pasado simple, participio y significado), con refuerzo positivo, trucos de memoria y repetición espaciada. Debe servir tanto para práctica diaria corta como para estudio intensivo antes de un examen.

## 2. Usuario y contexto

- Alumno de ESO (14 a 15 años; curso exacto **por confirmar**). Requisito clave: **que no parezca infantil**.
- Dispositivos: iPad, móvil y navegador de PC (Chrome). Todo debe funcionar con táctil y con ratón; en esta app se escribe mucho, así que el teclado del móvil tiene que resultar cómodo (sin autocorrector ni mayúscula automática en las casillas de respuesta).
- Un adulto (padre/madre) consulta el progreso y configura la lista de examen.
- **Varios alumnos en el mismo dispositivo**: igual que en Capitalia. Perfiles locales con un nombre y una imagen (inicial sobre un color o icono sobrio, sin fotos); cada alumno con su progreso, trucos y ajustes de examen; PIN del panel, tema e instalación comunes. Con dos o más alumnos, la app pregunta "¿Quién va a estudiar?" al abrirse.

## 3. Decisiones de producto

### 3.1 Estructura del contenido
- **Módulo 1: verbos irregulares.** Es lo único que entra en la primera versión.
- **Módulo 2: phrasal verbs.** Hito posterior, con su propio diseño (ver 3.4). No se adelanta nada.
- Los verbos se reparten en **grupos por patrón** de 6 a 10 verbos: las tres formas iguales (*cut, cut, cut*), pasado y participio iguales (*buy, bought, bought*), vocal que cambia i-a-u (*sing, sang, sung*), participio en -en (*break, broke, broken*), etc. El grupo hace el papel de la región de Capitalia y es, además, el primer truco de memoria. La división concreta se define en los datos.
- Los grupos se desbloquean progresivamente (en Aprender y Explorar): un grupo se abre cuando todos los verbos del anterior llegan al escalón Completar, o cuando Hoy ya ha empezado alguno de sus verbos. Siempre se puede volver a los anteriores.
- **Lista base: el listado de clase** (`docs/listas/`), **pendiente de recibir**. Será la **fuente de verdad**: qué verbos entran, con qué formas y con qué significado en español. No se añaden verbos que no estén en él.
- **Filtro "solo examen"**: el adulto marca qué verbos entran en un examen concreto.

### 3.2 Casos especiales
- **Verbos con dos formas válidas** (*learnt/learned*, *burnt/burned*, *dreamt/dreamed*, *got/gotten*): se muestra la del listado de clase; la otra se acepta como variante si es inglés estándar. Cada variante se verifica con un diccionario (Cambridge u Oxford) y se anota la fuente.
- ***be*:** el pasado se muestra como "was / were" y hay que escribir las dos formas, en cualquier orden **(por confirmar)**.
- **Británico o americano:** manda el listado de clase.
- **Significado:** el del listado. Si un verbo tiene varios sentidos, solo los que figuren en él.
- **Formas que se escriben igual y suenan distinto** (*read*): se avisa en una nota breve del verbo.

### 3.3 Escritura de las respuestas
- **En inglés, ortografía exacta.** A diferencia de Capitalia, no hay margen para erratas: la ortografía es justo lo que se examina (*taught*, no *tought*). Solo se ignoran mayúsculas y espacios sobrantes, y el "to" delante del infinitivo es opcional.
- **Casi acierto** (una sola letra de diferencia): cuenta como fallo para el progreso, pero el mensaje es más suave y señala la letra que cambia ("Casi: es *taught*, con **au**").
- **En español** (cuando se escribe el significado): tolerante como en Capitalia, sin exigir tildes ni mayúsculas, y con las variantes evidentes aceptadas.

### 3.4 Phrasal verbs (módulo 2, sin diseñar)
Solo lo ya decidido, para no perderlo:
- Una tarjeta por **significado**, no por verbo (*take off* despegar y *take off* quitarse son dos tarjetas).
- Se preguntan **siempre dentro de una frase**, no sueltos.
- Necesitan su listado de clase y su propia sección de esta SPEC antes de empezar.

## 4. Estructura de la app y tipos de pregunta

Se asume que el examen de clase es una **tabla de verbos con huecos** (dan una forma o el significado y hay que completar el resto) **(por confirmar)**. Todo se orienta a ese objetivo, separando **aprender** de **repasar**.

### 4.1 Pestañas
- **Hoy** (uso diario, un solo botón): repaso de lo aprendido mezclando grupos y tipos de pregunta, con **verbos nuevos intercalados**. Es la portada: lo que toca hoy (preguntas y minutos), un botón para empezar y unas cifras de logro (verbos aprendidos en total y esta semana, y cómo va la lista de examen; nunca rachas), con la cuadrícula de verbos coloreada (sección 10).
- **Aprender** (extra, a ritmo propio): por grupo; lleva a cada verbo por los escalones de 4.3.
- **Examen** (comprobar si estás listo): ver 4.4.
- **Explorar**: la tabla de verbos por grupos. Tocar un verbo muestra sus tres formas, el significado y su truco. Sin evaluación.

### 4.2 Tipos de pregunta
1. **Elegir:** se muestra el infinitivo y su significado; hay que elegir la pareja pasado/participio correcta entre cuatro. Los distractores son **formas reales de otros verbos** parecidos (*bought / brought / thought / caught*), nunca formas inventadas (*buyed*): no queremos enseñar errores.
2. **Emparejar:** tanda de 4 a 6 verbos; hay que unir cada infinitivo con sus formas. Sustituye a "Colocar".
3. **Completar:** se dan el infinitivo y el significado; hay que escribir el pasado y el participio.
4. **Tabla muda:** se da solo el significado en español; hay que escribir las tres formas. Sustituye al "Mapa mudo" y es lo más parecido al examen.
5. **Al revés:** se muestra un pasado o un participio y hay que dar el infinitivo. Solo en Hoy, para dar variedad.
6. **En frase** (hito posterior): una frase con hueco y el verbo entre paréntesis. Exige escribir frases de ejemplo para cada verbo, así que no entra en la primera versión.

### 4.3 Escalones de aprendizaje
Cada verbo pasa por: **Elegir → Emparejar → Completar → Tabla muda**. Mismas reglas que en Capitalia: sube de escalón al **acertar dos veces con otras preguntas por medio**; un fallo reinicia el contador del escalón sin bajar de escalón. Al superar la Tabla muda, el verbo queda **aprendido** y pasa al repaso espaciado de Hoy.

### 4.4 Examen
- Una **tabla con huecos**, como la de clase, sin colores de progreso.
- Se elige qué entra (todo, un grupo o la lista del examen del panel) y cuántos verbos (10, 20 o todos).
- Sin corrección en el momento: se responde todo y al final se ve la nota. Sin trucos ni repeticiones.
- **Nota sobre 10:** 1 punto por verbo con todo bien, **medio punto** si falla una sola casilla, 0 si fallan más **(por confirmar: ajustarlo a cómo puntúa el profesor)**. Al final, lista de fallos y opción de priorizarlos en Hoy.
- Los resultados cuentan para la planificación: acierto completo como acierto, medio punto como "repasar", fallo como fallo.

## 5. Pedagogía y feedback

### 5.1 Acierto
- Animación breve y discreta.
- Celebración mayor (confeti corto) solo al **dominar un grupo** o al **acertar un verbo que antes se había fallado**.

### 5.2 Fallo
- Decir con claridad que no es correcto, **sin castigo** y **sin rojo intenso**.
- Mostrar las formas correctas, marcar en qué casilla estaba el fallo y enseñar el truco.
- El verbo vuelve a salir pocos minutos después dentro de la misma sesión.

### 5.3 Trucos de memoria
- Tipos: **familia** (los que cambian igual: *sing, ring, drink*), **sonido o rima**, juego de palabras e historia breve.
- **Calidad antes que cantidad:** un verbo puede no tener truco.
- **Trucos propios:** botón "inventa tu truco"; el del alumno sustituye al predefinido.
- El adulto puede editar o desactivar trucos desde el panel.

### 5.4 Guía para aprender
- Primer arranque y guías de alumno y de adultos como en Capitalia, con los textos adaptados a verbos.
- "Acerca de": versión, autoría y créditos, incluido el origen en Capitalia.

### 5.5 Lo que NO incluimos
- Sin rachas de días ni ninguna mecánica que castigue no entrar.
- Sin mascota.
- **Voz: por decidir.** Capitalia no tiene síntesis de voz. En inglés la pronunciación forma parte de lo que se aprende, así que la propuesta es un botón "Escuchar" opcional (en Explorar y al ver la respuesta), que nunca haga falta para responder. Usaría la voz del propio dispositivo, sin red; su calidad en iPad, Android y PC está sin comprobar. Mientras no se decida, **sin voz**.

## 6. Repetición espaciada

Igual que en Capitalia:
- **Entre días:** FSRS (`ts-fsrs`, parámetros por defecto). **Una tarjeta por verbo**; "Al revés" comparte la tarjeta.
- **Dentro de la sesión:** cola corta de reaprendizaje; lo fallado reaparece a los pocos minutos.
- **Nota deducida, nunca preguntada:** fallo o casi acierto, Again; acierto lento o con ayuda, Hard; acierto normal, Good; acierto rápido escribiendo (Completar o Tabla muda), Easy. Los aciertos en Elegir cuentan como máximo Good.

## 7. Sesiones

- **Hoy:** corta (unos 10 minutos o unas 20 preguntas), con opción de seguir al terminar. Empieza con repasos y reparte los verbos nuevos entre ellos.
- Los verbos en aprendizaje salen en Hoy una vez al día.
- Los nuevos siguen el **orden de los grupos**; los de la lista de examen van antes.
- **Nuevos por día, autorregulados entre 5 y 10** según los aciertos recientes; el adulto puede ajustar el máximo.
- **Examen configurado por el adulto** (fecha y verbos): Hoy les da prioridad a medida que se acerca la fecha.

## 8. Panel de adultos

Como en Capitalia: protegido con PIN (cerradura de niños, no seguridad real). Muestra verbos aprendidos por grupo, los que más se atascan y la actividad reciente. Configura la lista y la fecha de examen, el máximo de nuevos al día, el desbloqueo de todos los grupos, los trucos, los alumnos y el reinicio de progreso. No hay verbos opcionales.

## 9. Persistencia y dispositivos

- Todo en local, sin cuentas ni servidor; un progreso por alumno. Copia de seguridad por alumno y de todos a la vez, como en Capitalia.
- **Claves de guardado propias** (prefijo `byheart-`). Capitalia y By Heart se publican en el mismo sitio de GitHub Pages y el navegador les da un almacén común: con las claves heredadas, cada app pisaría los datos de la otra. Lo mismo para las cachés del funcionamiento sin conexión.
- **Formato de copia propio.** Una copia de Capitalia no se puede restaurar en By Heart, ni al revés; el mensaje de error lo dice claro.
- Sincronización con backend: fuera de alcance.

## 10. Estilo visual

- **El de Capitalia**, tal cual: misma paleta, misma tipografía (Nunito), mismos botones, tarjetas y diálogos, mismo modo claro y oscuro. Lo divertido viene de los trucos y del progreso, no de la decoración.
- **La cuadrícula de verbos es el marcador de progreso** y ocupa el lugar del mapa: una casilla por verbo, agrupadas por patrón; en gris claro al empezar, se colorean (pastel por grupo) según suben de escalón, con color pleno al quedar aprendidas.
- Feedback: verde menta (acierto), coral/ámbar (fallo). Nunca rojo intenso.
- Distribución: en móvil, cuadrícula arriba y tarjeta de pregunta abajo; en iPad y PC, cuadrícula a la izquierda y panel a la derecha. Durante una pregunta, lo importante es la tarjeta; el detalle se decide con el prototipo.
- Objetivos táctiles de 44 px como mínimo.

## 11. Técnica

- La de Capitalia: **PWA estática** en **GitHub Pages**, Vite + TypeScript sin framework, instalable y funcional sin conexión, con aviso de versión nueva. Sin dependencias de red en tiempo de ejecución.
- **Se retira todo lo del mapa:** el dibujo del mapa, sus datos y las librerías que solo servían para él (d3-geo, topojson-client, world-atlas), además de los guiones que generaban países y coordenadas.
- Lógica pura (repaso espaciado, validación de respuestas, selección de preguntas) separada de la interfaz y con tests.

## 12. Modelo de datos (borrador)

`verbs.json`, una entrada por verbo:
- `id`: el infinitivo, sin "to".
- `infinitivo`, `pasado`, `participio`: las formas que se muestran (las del listado).
- `variantesPasado`, `variantesParticipio`: otras formas aceptadas.
- `significado`: en español, como en el listado. `variantesSignificado`: otras formas aceptadas.
- `grupo`: identificador del grupo.
- `nota`: texto breve opcional (p. ej. pronunciación de *read*).
- `trucos`: lista de { tipo, texto }.

`groups.json`: `id`, `nombre`, `orden`, `color`.

Progreso (local): como en Capitalia, por verbo en lugar de por país.

## 13. Hitos

**Estado:** hito 0 hecho (15/11/2026). Siguiente: hito 1, para el que hace falta el listado de clase o, al menos, un grupo de verbos de muestra.

0. **Puesta a punto:** nombre, textos, icono provisional y claves de guardado propias; retirar el mapa. La app compila, pasa los tests y abre, aunque esté vacía de contenido. Adaptar también `CLAUDE.md` y el README, que aún hablan de capitales.
1. **Prototipo de un grupo** (6 a 10 verbos): cuadrícula, Elegir y Emparejar, feedback. Probar en iPad y móvil.
2. Completar y Tabla muda, con la validación exacta y el "casi acierto".
3. Datos completos del listado de clase, grupos definitivos y trucos revisados.
4. Examen y panel de adultos adaptados.
5. Guías, icono definitivo y publicación en GitHub Pages.
6. Phrasal verbs (antes, su sección en esta SPEC).

## 14. Pendiente

- **Listado de clase** de verbos irregulares (y saber si habrá listas de examen más cortas).
- Curso exacto del alumno.
- Cómo es el examen de clase: qué dan, qué hay que escribir y cómo se puntúa (afecta a 4, 4.4 y a la nota).
- Voz: botón "Escuchar" sí o no (5.5).
- *be*: si se exigen "was" y "were" (3.2).
- División definitiva en grupos.
- Revisión de todos los trucos por un adulto antes de dárselos al alumno.
