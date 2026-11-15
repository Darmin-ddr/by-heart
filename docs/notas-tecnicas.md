# Notas técnicas (memoria de trabajo)

By Heart parte de una copia de Capitalia 1.3.2. Estas notas vienen de allí: lo que sigue valiendo está adaptado; lo que describe pantallas aún sin adaptar a los verbos lo dice.

## Estado (hito 0)
- La app abre con su nombre, su icono provisional y sus claves de guardado, pero **sin contenido**: `src/data/index.ts` exporta listas vacías y cada pestaña enseña un aviso de "en construcción" (`pintarSinContenido` en `src/ui/app.ts`).
- **No hay mapa.** Su sitio lo ocupa el contrato `Tablero` (`src/ui/tablero.ts`): lo que las pantallas necesitan del sitio donde se ve el progreso y se señala la pregunta. `crearTablero` devuelve null hasta que exista la cuadrícula de verbos (hito 1); con null, la app no monta ninguna pantalla de preguntas.
- Las pantallas heredadas (`hoy.ts`, `aprender.ts`, `examen.ts`, `explorar.ts`, `preguntas.ts`, `colocar.ts`, `ronda.ts`, `regiones.ts`, `panel.ts`, `guia.ts`, `bienvenida.ts`) compilan pero siguen hablando de países y capitales. Se adaptan en los hitos 1 a 5.
- La lógica (`src/logic/`) sigue con los tipos de Capitalia (`Pais`, `Region`, `Continente`). Sus tests usan los países de Capitalia como datos de prueba, en `tests/fixtures/`.
- Con la app vacía no se abren solas la bienvenida ni las guías, ni se ofrecen en ⋯.

## Estructura
- `src/logic/`: lógica pura con tests (`tests/`). Nada de DOM.
- `src/ui/`: interfaz sin framework. `comun.ts` tiene el feedback compartido.
- `src/data/index.ts`: el contenido (vacío por ahora).

## Comandos
- `npm test`, `npm run build`, `npm run dev`.
- En Windows el repositorio tiene saltos de línea CRLF: al editar ficheros con scripts, normalizar o usar el editor para no ensuciar el diff.
- Icono: `pwsh scripts/generar-iconos.ps1` escribe `public/icono.svg` y los PNG (provisional: tres filas de casillas que se van rellenando).
- GitHub: repositorio privado `Darmin-ddr/by-heart`. La publicación en Pages está solo a mano (`workflow_dispatch`) hasta el hito de publicación; para GitHub Pages en un plan gratuito el repositorio tendrá que ser público.

## Guardado
- Todas las claves llevan el prefijo `byheart-`. Capitalia se publica en el mismo sitio de GitHub Pages (mismo origen), así que comparte `localStorage` y cachés: con las claves heredadas, cada app pisaría los datos de la otra.
- Las copias de Capitalia se rechazan con un mensaje propio (`DE_CAPITALIA` en `src/logic/copia.ts`).

## FSRS
- `ts-fsrs` 5.4.2: `fsrs(generatorParameters())`, `createEmptyCard(fecha)`, `f.next(card, fecha, Rating.X).card`.
  Rating: Again 1, Hard 2, Good 3, Easy 4. State: New 0, Learning 1, Review 2, Relearning 3.
  Con pasos de aprendizaje cortos: un Good nuevo -> Learning con due a 10 min; otro Good -> Review a 2 días.

## Scripts de prueba en navegador (heredados, sin adaptar)
Los `scripts/prueba-*.cjs` son las pruebas de Capitalia con Playwright. **Ahora mismo no funcionan**: buscan países, mapa y las claves antiguas. Se quedan como punto de partida para rehacerlas cuando cada pantalla tenga verbos. Playwright no es dependencia del proyecto (se instala aparte, fuera del repo, y se ejecutan con `NODE_PATH` apuntando a su `node_modules`).

## Lo que sigue describe el código heredado de Capitalia
## Arquitectura de la interfaz (v2)
- `src/ui/app.ts`: estado (progreso), región actual, mapa, pestañas (Hoy, Aprender, Examen, Explorar), `Motor` (registrar respuesta en FSRS y en el escalón, trucos), avisos. Monta el mapa de la región, el de otra región cuando Hoy salta (con rótulo) y el mapa mudo del examen (sin colores ni selector de región).
- Regiones "continente entero": ids `continente-europa` y `continente-asia`, creadas en `app.ts` (no están en `regions.json`). `region` es la del mapa en cada momento y `regionElegida` la del selector.
- Lógica v2: `src/logic/portada.ts` (cifras de la portada, orden del curso), `src/logic/hoy.ts` (sesión de Hoy agrupada por regiones, nuevos autorregulados, `ColaHoy`), `progreso.ts` (escalones y migración desde la v1), `examen.ts` (ámbitos, corrección de mapa mudo con medio punto, nota), `texto.ts` (validación de capital y de país).
- `src/ui/hoy.ts`: bucle propio de preguntas (el mapa puede cambiar de región entre preguntas). `src/ui/aprender.ts`: escalera y tandas. `src/ui/examen.ts`: configuración, preguntas y nota.
- `src/ui/ronda.ts`: rondas de preguntas sueltas con mapa fijo (Aprender); `src/ui/preguntas.ts`: una función por tipo (elegir, escribir, al revés, mapa mudo).
- `src/ui/colocar.ts`: Colocar, aparte (va por tandas).
- `src/ui/explorar.ts`, `regiones.ts` (selector), `mas.ts` (copia y tema), `tema.ts` (Automático/Claro/Oscuro, guardado aparte del progreso), `panel.ts` (adultos).
- Medio punto en mapa mudo: "repasar" para FSRS y fallo para el escalón y la cola (`OpcionesRespuesta.escalon`).
- `src/ui/bienvenida.ts` (primer arranque y guía de adultos), `guia.ts` (guía del alumno), `acerca.ts` (versión y créditos; la autoría está en `AUTORIA`).
- Los atajos de teclado de las preguntas (`Teclado` en `comun.ts`) se ignoran mientras haya un `<dialog>` abierto.
- Cambios de ajustes que afectan a los datos (Kosovo, examen, importar) recargan la página.

## Alumnos (perfiles locales, versión 1.3.0)
- Lógica pura en `src/logic/perfiles.ts`; interfaz en `src/ui/perfiles.ts` (imagen, "¿Quién va a estudiar?", añadir y editar).
- Guardado: el índice de alumnos y el PIN común en `byheart-perfiles`. El progreso del primer alumno sigue en `byheart-progreso` (el de antes de los perfiles es suyo sin moverlo); el de los demás, en `byheart-progreso-<id>`.
- Arranque (`iniciarApp` en `app.ts`): con dos o más alumnos pregunta quién estudia; el elegido se recuerda en `sessionStorage` (`byheart-perfil-elegido`) para no preguntar al recargar en la misma visita. Cambiar de alumno guarda y recarga la página.
- `vigilarVueltas`: si la app ha estado oculta más de 10 minutos, al volver vuelve a preguntar (en iOS volver solo reanuda la app).
- El PIN vive en el índice y se copia al estado del alumno al cargarlo; al guardar, si cambió, se actualiza el índice.
- Copias (`src/logic/copia.ts`): la de un alumno (`formato: 'byheart-progreso'`, con `alumno`, `dispositivo` y `fecha`; código `BYHEART2:`, que también los lleva, y se siguen leyendo los `BYHEART1:`) y la de todos (`formato: 'byheart-casa'`, desde el panel).
- Preferencias del dispositivo, fuera del progreso: tema (`byheart-tema`), aviso de instalar descartado (`byheart-aviso-instalar`) y aviso de pausa plegado (`byheart-aviso-pausa-plegado`).

## Versión nueva (1.3.2)
- La página va "primero la red" (`vite.config.ts`, workbox): `runtimeCaching` con `NetworkFirst` para las navegaciones (3 s de espera; si no, la última guardada en `byheart-pagina`; si no hay, la de la copia sin conexión con `precacheFallback`). Para que funcione hay que quitar las dos reglas que sirven la página guardada: `directoryIndex: null` y `navigateFallback: null` (vite-plugin-pwa añade esta última por defecto). Los recursos de `/assets/` de una versión que aún no está en la copia se guardan al cargarlos (`byheart-recursos`).
- Cada compilación tiene un identificador (`__COMPILACION__`), que es una huella del contenido de la app (`src/`, `public/`, `index.html`, `vite.config.ts`, versión y dependencias; con los saltos de línea normalizados para que salga igual en Windows y en GitHub). Publicar solo cambios en el README, los documentos, las pruebas o los scripts no la cambia, así que no hace saltar el aviso. Se publica `version.json` con la de la última (no está en la copia sin conexión). `BYHEART_COMPILACION_EXTRA` fuerza una huella distinta (solo para pruebas). `src/ui/actualizar.ts` lo consulta al volver a la app (visibilidad o foco, como mucho una vez por minuto), cada 30 minutos y a los 5 s de arrancar; si no coincide, aviso en la portada de Hoy y franja al pie en el resto (`.app:has(.aviso-version)` la oculta en la portada).
- No hace falta subir a mano ningún "número de caché" (como en otros proyectos con el service worker escrito a mano): el `sw.js` lo genera la compilación con la huella de cada fichero.
- Pruebas: `scripts/prueba-actualizacion.cjs` (compilaciones reales: abre, recompila y comprueba que sale la nueva, el aviso y el modo sin conexión) y `scripts/prueba-version.cjs` (el aviso, simulando otro `version.json`).
