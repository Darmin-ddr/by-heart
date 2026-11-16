# Notas técnicas (memoria de trabajo)

By Heart parte de una copia de Capitalia 1.3.2. Desde el 16/11/2026 el código ya no tiene nada de países, mapas ni continentes: todo trabaja con verbos y grupos.

## Estructura
- `src/data/`: el contenido. `verbs.json` y `groups.json` (modelo de SPEC 12) los genera `scripts/generar-verbos.cjs` a partir de su propia tabla, comprobando cada fila contra el texto del PDF del listado (`pdftotext -raw`). Para cambiar un verbo, un grupo o un truco, se cambia ahí y se regenera. Detalles del listado: `docs/listas/README.md`.
- `src/logic/`: lógica pura con tests (`tests/`). Nada de DOM.
  - `types.ts` (`Verbo`, `Grupo`), `verbos.ts` (formas para enseñar, verbos de un grupo, orden del curso).
  - `progreso.ts`: estado guardado, FSRS, escalones (`ESCALONES`: elegir, emparejar, completar, tablamuda), grupos superados, dominados y desbloqueados.
  - `formas.ts`: corrección de las formas escritas (ortografía exacta y "casi").
  - `hoy.ts` (sesión de Hoy por bloques de grupo, nuevos autorregulados, `ColaHoy`), `portada.ts` (cifras de la portada), `examen.ts` (filas, corrección y nota), `opciones.ts` (Elegir), `emparejar.ts` (Emparejar por tandas), `sesion.ts` (cola de una ronda), `adultos.ts` (PIN, estadísticas del panel, casillas de la lista de examen), `almacen.ts`, `copia.ts`, `perfiles.ts`, `nota.ts`, `config.ts`.
- `src/ui/`: interfaz sin framework.
  - `app.ts`: arranque (alumnos), estado, grupo actual, cuadrícula, pestañas y `Motor` (registrar respuesta en FSRS y en el escalón, trucos), avisos y celebraciones.
  - `tablero.ts` (contrato) y `cuadricula.ts`: la cuadrícula de verbos. Las pantallas solo conocen el contrato `Tablero`.
  - `hoy.ts`, `aprender.ts`, `examen.ts`, `explorar.ts`, `ronda.ts` (rondas de preguntas sueltas), `preguntas.ts` (Elegir, Completar, Tabla muda y Al revés), `emparejar.ts`, `grupos.ts` (selector), `panel.ts`, `guia.ts`, `bienvenida.ts`, `mas.ts`, `perfiles.ts`, `instalar.ts`, `actualizar.ts`, `tema.ts`, `acerca.ts`, `comun.ts` (feedback compartido).

## Decisiones de la interfaz
- **"Todos los verbos"** es un grupo más (`TODOS` en `app.ts`, id `todos`): la cuadrícula de la portada de Hoy y una opción del selector, que se abre cuando lo están todos los grupos.
- **Hoy**: la portada enseña todos los verbos; cada pregunta, la cuadrícula de su grupo (con un rótulo al cambiar). El tiempo de respuesta cuenta desde que la cuadrícula está quieta.
- **Examen**: sin cuadrícula (`#tablero` oculto, el panel a todo lo ancho). Es un formulario: Enter pasa a la casilla siguiente y solo el botón corrige. Las respuestas cuentan para FSRS (Completar o Tabla muda según la fila, con `examen: true`), no para los escalones.
- **Tabla muda**: la cuadrícula esconde los infinitivos (`setMudo`) y no señala ninguna casilla hasta responder.
- **Clases CSS**: `.cuadro` es una casilla de la cuadrícula; `.casilla` es una casilla de verificación (panel). Variables de color: `--casilla`, `--acierto-casilla`, `--fallo-casilla`, `--color-grupo`, `--grupo-base`.
- En modo oscuro, `--acierto-casilla` y `--fallo-casilla` son algo más oscuros que en Capitalia: el texto de las casillas no llegaba al contraste mínimo (lo comprueba `tests/contraste.test.ts`).
- Los atajos de teclado de las preguntas (`Teclado` en `comun.ts`) se ignoran mientras haya un `<dialog>` abierto.

## Comandos
- `npm test`, `npm run build`, `npm run dev`.
- En Windows el repositorio tiene saltos de línea CRLF: al editar ficheros con scripts, normalizar o usar el editor para no ensuciar el diff.
- Icono: `pwsh scripts/generar-iconos.ps1` escribe `public/icono.svg` y los PNG (provisional).
- GitHub: repositorio privado `Darmin-ddr/by-heart`. La publicación en Pages está solo a mano (`workflow_dispatch`) hasta el hito de publicación; para GitHub Pages en un plan gratuito el repositorio tendrá que ser público.
- **No hay pruebas automáticas en navegador.** Las de Capitalia (Playwright) se retiraron porque buscaban países y mapas; están en su historial si hace falta rehacerlas. Mientras, se prueba a mano en el navegador.

## Guardado
- Todas las claves llevan el prefijo `byheart-`. Capitalia se publica en el mismo sitio de GitHub Pages (mismo origen), así que comparte `localStorage` y cachés: con las claves heredadas, cada app pisaría los datos de la otra.
- `validarEstado` (`almacen.ts`) copia solo los ajustes que existen y descarta las respuestas del historial sin verbo: un progreso guardado con una versión anterior del prototipo se carga sin romperse.
- Las copias de Capitalia se rechazan con un mensaje propio (`DE_CAPITALIA` en `src/logic/copia.ts`).

## FSRS
- `ts-fsrs` 5.4.2: `fsrs(generatorParameters())`, `createEmptyCard(fecha)`, `f.next(card, fecha, Rating.X).card`.
  Rating: Again 1, Hard 2, Good 3, Easy 4. State: New 0, Learning 1, Review 2, Relearning 3.
  Con pasos de aprendizaje cortos: un Good nuevo -> Learning con due a 10 min; otro Good -> Review a 2 días.
- Por eso, tras la primera sesión de Hoy, los verbos nuevos ya cuentan como "en repaso" y el grupo siguiente se abre (`grupoSuperado`). Es el comportamiento heredado de Capitalia.

## Alumnos (perfiles locales)
- Lógica pura en `src/logic/perfiles.ts`; interfaz en `src/ui/perfiles.ts` (imagen, "¿Quién va a estudiar?", añadir y editar).
- Guardado: el índice de alumnos y el PIN común en `byheart-perfiles`. El progreso del primer alumno, en `byheart-progreso`; el de los demás, en `byheart-progreso-<id>`.
- Arranque (`iniciarApp` en `app.ts`): con dos o más alumnos pregunta quién estudia; el elegido se recuerda en `sessionStorage` (`byheart-perfil-elegido`) para no preguntar al recargar en la misma visita. Cambiar de alumno guarda y recarga la página.
- `vigilarVueltas`: si la app ha estado oculta más de 10 minutos, al volver vuelve a preguntar (en iOS volver solo reanuda la app).
- Copias (`src/logic/copia.ts`): la de un alumno (`formato: 'byheart-progreso'`, código `BYHEART2:`) y la de todos (`formato: 'byheart-casa'`, desde el panel).
- Preferencias del dispositivo, fuera del progreso: tema (`byheart-tema`) y aviso de instalar descartado (`byheart-aviso-instalar`).

## Versión nueva
- La página va "primero la red" (`vite.config.ts`, workbox): `NetworkFirst` para las navegaciones (3 s de espera; si no, la última guardada en `byheart-pagina`; si no hay, la de la copia sin conexión con `precacheFallback`). Para que funcione hay que quitar las dos reglas que sirven la página guardada: `directoryIndex: null` y `navigateFallback: null`. Los recursos de `/assets/` de una versión que aún no está en la copia se guardan al cargarlos (`byheart-recursos`).
- Cada compilación tiene un identificador (`__COMPILACION__`): una huella del contenido de la app, con los saltos de línea normalizados. Publicar solo cambios en documentos, pruebas o scripts no la cambia. Se publica `version.json` con la de la última; `src/ui/actualizar.ts` lo consulta al volver a la app, cada 30 minutos y a los 5 s de arrancar. `BYHEART_COMPILACION_EXTRA` fuerza una huella distinta (solo para pruebas).
