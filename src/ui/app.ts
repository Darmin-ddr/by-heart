import { verbos } from '../data';
import { Almacen, CLAVE, almacenDelNavegador, type AlmacenTexto } from '../logic/almacen';
import {
  borrarPerfil, cargarIndice, claveProgreso, crearPerfil, faltaNombre, guardarIndice, perfilDe, type IndicePerfiles,
} from '../logic/perfiles';
import { editarAlumno, elegirAlumno, nuevoAlumno } from './perfiles';
import { dominados, empezado, estadoVacio, nivelesDe, registrarEscalon, registrarRespuesta, verbosEnCurso, type EstadoProgreso } from '../logic/progreso';
import { exportarCasa, importarCasa, nombreFicheroCasa } from '../logic/copia';
import { crearSesionHoy, modoHoy, nuevosDeHoy, repasoAdelantado, repasosPendientes } from '../logic/hoy';
import { resumenPortada } from '../logic/portada';
import { diasHastaExamen } from '../logic/adultos';
import type { Verbo } from '../logic/types';
import { crearTablero, type Tablero } from './tablero';
import { lanzarConfeti } from './confeti';
import { el } from './dom';
import type { Motor } from './comun';
import { iniciarExplorar, type Modo, type ServicioTrucos } from './explorar';
import { iniciarAprender } from './aprender';
import { iniciarHoy } from './hoy';
import { iniciarExamen } from './examen';
import { alCambiarInstalacion, avisoDescartado, crearInstalar, descartarAviso, formaInstalar } from './instalar';
import { prepararMas } from './mas';
import { crearGuia } from './guia';
import { crearAcercaDe } from './acerca';
import { crearBienvenida } from './bienvenida';
import { crearPanelAdultos } from './panel';

type Pestana = 'hoy' | 'aprender' | 'examen' | 'explorar';

/** Color de las casillas de los verbos que avanzan (el mismo para todos). */
const COLOR_CASILLA = '#c8b6e2';
/** Celebración grande cada vez que se llega a una decena más de verbos dominados (SPEC 5.1). */
const DECENA = 10;
/** Alumno elegido en esta visita (al abrir de nuevo la app, se vuelve a preguntar si hay varios). */
const CLAVE_ELEGIDO = 'byheart-perfil-elegido';

function leerElegido(): string | null {
  try {
    return sessionStorage.getItem(CLAVE_ELEGIDO);
  } catch {
    return null;
  }
}

function marcarElegido(id: string): void {
  try {
    sessionStorage.setItem(CLAVE_ELEGIDO, id);
  } catch {
    /* sin almacenamiento de sesión: se preguntará al recargar */
  }
}

/** PIN del progreso de antes de los perfiles (para que el índice nuevo lo herede). */
function pinDelPrimero(backend: AlmacenTexto | null): string | null {
  try {
    const d = JSON.parse(backend?.getItem(CLAVE) ?? 'null') as { ajustes?: { pinHash?: unknown } } | null;
    return typeof d?.ajustes?.pinHash === 'string' ? d.ajustes.pinHash : null;
  } catch {
    return null;
  }
}

/**
 * Arranque: con dos o más alumnos en el dispositivo, "¿Quién va a estudiar?"
 * cada vez que se abre la app (para no mezclar progresos); con uno, directo.
 */
export function iniciarApp(): void {
  const backend = almacenDelNavegador();
  const indice = cargarIndice(backend, pinDelPrimero(backend));
  guardarIndice(backend, indice);
  const elegido = leerElegido();
  if (elegido && perfilDe(indice, elegido)) {
    arrancarCon(backend, indice, elegido);
    return;
  }
  if (indice.perfiles.length < 2) {
    arrancarCon(backend, indice, indice.ultimo);
    return;
  }
  const preguntar = () =>
    elegirAlumno(indice, {
      obligatorio: true,
      alElegir(id) {
        indice.ultimo = id;
        guardarIndice(backend, indice);
        marcarElegido(id);
        arrancarCon(backend, indice, id);
      },
      alAnadir: () => anadirAlumno(backend, indice, preguntar),
    });
  preguntar();
}

/** Añade un alumno (con progreso vacío y el PIN común) y entra con él. */
function anadirAlumno(backend: AlmacenTexto | null, indice: IndicePerfiles, alCancelar: () => void): void {
  nuevoAlumno(indice, {
    alCrear(nombre, imagen, nombrePrimero) {
      if (nombrePrimero) indice.perfiles[0].nombre = nombrePrimero;
      const p = crearPerfil(indice, nombre, imagen);
      const nuevo = estadoVacio();
      nuevo.ajustes.pinHash = indice.pinHash;
      // La bienvenida ("¿quién la abre?") ya se vio en este dispositivo; la guía del alumno, no.
      nuevo.bienvenidaVista = true;
      new Almacen(backend, claveProgreso(p.id)).guardar(nuevo);
      entrarComo(backend, indice, p.id);
    },
    alCancelar,
  });
}

/** Cambia de alumno: se recuerda y se vuelve a arrancar la app con su progreso. */
function entrarComo(backend: AlmacenTexto | null, indice: IndicePerfiles, id: string): void {
  indice.ultimo = id;
  guardarIndice(backend, indice);
  marcarElegido(id);
  window.location.reload();
}

/** Tras este tiempo con la app oculta, al volver se pregunta otra vez quién estudia. */
const PAUSA_PREGUNTAR_MS = 10 * 60 * 1000;

/**
 * Con dos o más alumnos, si la app ha estado oculta (en segundo plano, otra
 * pestaña) más de PAUSA_PREGUNTAR_MS, al volver pregunta "¿Quién va a estudiar?".
 * En iPhone y iPad volver a la app solo la reanuda: sin esto, un hermano podría
 * seguir en el perfil del otro. Si es el mismo alumno, sigue donde estaba (sin recargar).
 */
function vigilarVueltas(backend: AlmacenTexto | null, indice: IndicePerfiles, perfilId: string): void {
  let ocultaDesde: number | null = null;
  let preguntando = false;
  const preguntar = () => {
    preguntando = true;
    elegirAlumno(indice, {
      obligatorio: true,
      actual: perfilId,
      alElegir(id) {
        preguntando = false;
        if (id !== perfilId) entrarComo(backend, indice, id);
      },
      alAnadir: () => anadirAlumno(backend, indice, preguntar),
    });
  };
  document.addEventListener('visibilitychange', () => {
    if (indice.perfiles.length < 2) return;
    if (document.visibilityState === 'hidden') {
      ocultaDesde = Date.now();
      return;
    }
    const pausa = ocultaDesde === null ? 0 : Date.now() - ocultaDesde;
    ocultaDesde = null;
    if (pausa >= PAUSA_PREGUNTAR_MS && !preguntando) preguntar();
  });
}

function arrancarCon(backend: AlmacenTexto | null, indice: IndicePerfiles, perfilId: string): void {
  const almacen = new Almacen(backend, claveProgreso(perfilId));
  let estado = almacen.cargar();
  // El PIN del panel es común a todos los alumnos.
  if (indice.pinHash) estado.ajustes.pinHash = indice.pinHash;
  const perfil = perfilDe(indice, perfilId)!;
  const variosAlumnos = () => indice.perfiles.length >= 2;
  const cambiarAlumno = () =>
    elegirAlumno(indice, {
      obligatorio: false,
      actual: perfilId,
      alElegir: (id) => {
        if (id !== perfilId) entrarComo(backend, indice, id);
      },
      alAnadir: () => anadirAlumno(backend, indice, () => undefined),
    });
  vigilarVueltas(backend, indice, perfilId);
  /** Editar nombre, imagen y color (desde ⋯), o ponerle nombre la primera vez. */
  const editarPerfil = (primeraVez = false, despues?: () => void) =>
    editarAlumno(indice, perfil, {
      primeraVez,
      alGuardar(nombre, imagen) {
        perfil.nombre = nombre;
        perfil.imagen = imagen;
        indice.nombrePedido = true;
        guardarIndice(backend, indice);
        despues?.();
      },
      alCerrar() {
        if (primeraVez) {
          indice.nombrePedido = true;
          guardarIndice(backend, indice);
        }
        despues?.();
      },
    });
  const panel = document.getElementById('panel')!;
  const contenedorTablero = document.getElementById('tablero')!;
  const avisos = document.getElementById('avisos')!;
  const botonesPestana = document.querySelectorAll<HTMLButtonElement>('.modo');

  /** Verbos que enseña la cuadrícula en este momento (todos, los que están en curso o los de la sesión de Hoy). */
  let verbosTablero: readonly Verbo[] = verbos;
  let tablero: Tablero | null = null;
  let modo: Modo | null = null;

  /** Verbos de la lista de examen o fallados en un examen: Hoy y Aprender los sacan antes. */
  const prioridad = () => new Set([...estado.prioridad, ...(estado.ajustes.listaExamen ?? [])]);
  const enCurso = () => verbosEnCurso(estado, verbos, prioridad());

  function guardar(): void {
    if (!almacen.guardar(estado)) mostrarAvisoAlmacen();
    if (estado.ajustes.pinHash !== indice.pinHash) {
      indice.pinHash = estado.ajustes.pinHash;
      guardarIndice(backend, indice);
    }
  }

  function mostrarAvisoAlmacen(): void {
    if (document.getElementById('aviso-almacen')) return;
    const aviso = el('p', 'aviso-almacen', 'Este navegador no deja guardar el progreso: lo que hagas se perderá al cerrar.');
    aviso.id = 'aviso-almacen';
    document.querySelector('.app')!.append(aviso);
  }

  function avisar(texto: string): void {
    const t = el('div', 'aviso', texto);
    avisos.append(t);
    window.setTimeout(() => t.classList.add('saliendo'), 3500);
    window.setTimeout(() => t.remove(), 4000);
  }

  function actualizarNiveles(): void {
    tablero?.setNiveles(nivelesDe(estado, verbosTablero));
  }

  const trucos: ServicioTrucos = {
    predefinido(id) {
      if (estado.ajustes.trucosDesactivados.includes(id)) return null;
      return estado.ajustes.trucosEditados[id] ?? verbos.find((v) => v.id === id)?.trucos[0]?.texto ?? null;
    },
    propio: (id) => estado.trucosPropios[id] ?? null,
    guardarPropio(id, texto) {
      if (texto) estado.trucosPropios[id] = texto;
      else delete estado.trucosPropios[id];
      guardar();
    },
  };

  const motor: Motor = {
    registrar(verboId, modoId, resultado, tiempoMs, opciones) {
      registrarRespuesta(estado, verboId, modoId, resultado, tiempoMs, new Date(), opciones);
      // Un verbo priorizado (fallado en un examen) deja de serlo al acertarlo fuera del examen.
      if (resultado === 'acierto' && !opciones?.examen) estado.prioridad = estado.prioridad.filter((x) => x !== verboId);
      // El examen mide; no hace subir de escalón (SPEC 4.4).
      const cambio = opciones?.examen ? { subio: false, aprendido: false } : registrarEscalon(estado, verboId, modoId, resultado);
      guardar();
      actualizarNiveles();
      comprobarHitos();
      return cambio;
    },
    truco: (id) => trucos.propio(id) ?? trucos.predefinido(id),
  };

  /** Celebración grande cada decena de verbos dominados (SPEC 5.1). */
  function comprobarHitos(): void {
    const decenas = Math.floor(dominados(estado, verbos) / DECENA);
    if (decenas > estado.decenasCelebradas) {
      estado.decenasCelebradas = decenas;
      guardar();
      lanzarConfeti();
      avisar(`¡Ya dominas ${decenas * DECENA} verbos!`);
    }
  }

  /** Monta la cuadrícula con estos verbos (o la quita, con `null`: el examen no la usa). */
  function montarTablero(lista: readonly Verbo[] | null): void {
    tablero?.destruir();
    verbosTablero = lista ?? [];
    tablero = lista ? crearTablero({ contenedor: contenedorTablero, verbos: lista, colorDe: () => COLOR_CASILLA, alTocar: (id) => modo?.alTocarVerbo(id) }) : null;
    contenedorTablero.hidden = !tablero;
    actualizarNiveles();
  }

  function cambiarPestana(nueva: Pestana, empezarYa = false): void {
    modo?.salir();
    for (const b of botonesPestana) b.setAttribute('aria-pressed', String(b.dataset.modo === nueva));
    if (nueva === 'examen') {
      // Una tabla con huecos a todo lo ancho: sin cuadrícula, que delataría las respuestas.
      montarTablero(null);
      modo = iniciarExamen(panel, {
        motor,
        verbos,
        rng: Math.random,
        listaExamen: () => estado.ajustes.listaExamen,
        empezados: () => new Set(verbos.filter((v) => empezado(estado, v.id)).map((v) => v.id)),
        priorizar(ids: readonly string[]) {
          estado.prioridad = [...new Set([...estado.prioridad, ...ids])];
          guardar();
        },
      });
      return;
    }
    if (nueva === 'aprender') {
      // Aprender: los verbos en curso (si se aprende uno, en la siguiente tanda entra otro).
      const lista = enCurso();
      montarTablero(lista);
      modo = iniciarAprender(
        panel,
        { tablero: tablero!, verbos: lista, candidatos: verbos, rng: Math.random, alExplorar: () => cambiarPestana('explorar'), motor },
        () => estado,
        (empezar) => cambiarPestana('aprender', empezar),
        empezarYa,
      );
      return;
    }
    // Explorar y la portada de Hoy: todos los verbos.
    montarTablero(verbos);
    modo = nueva === 'explorar' ? iniciarExplorar(panel, tablero!, verbos, trucos) : iniciarHoy(panel, serviciosHoy());
  }

  const abrirInstalar = crearInstalar();
  /** Aviso de instalar en la portada: desde el segundo día de uso, si no está instalada ni se ha descartado. */
  const tocaAvisoInstalar = () => {
    if (formaInstalar() === 'instalada' || avisoDescartado()) return false;
    const hoy = new Date().toDateString();
    return estado.historial.some((r) => new Date(r.t).toDateString() !== hoy);
  };

  function serviciosHoy() {
    return {
      motor,
      candidatos: verbos,
      rng: Math.random,
      sesion() {
        const ahora = new Date();
        const pendientes = repasosPendientes(estado, verbos, ahora).length;
        return crearSesionHoy({ estado, disponibles: verbos, prioridad: prioridad(), nuevos: nuevosDeHoy(estado, pendientes, ahora), ahora, rng: Math.random });
      },
      adelantado: () => repasoAdelantado(estado, verbos),
      resumen: () => resumenPortada(estado, verbos, new Date()),
      diasExamen: () => (estado.ajustes.listaExamen?.length ? diasHastaExamen(estado.ajustes.fechaExamen, new Date()) : null),
      alumno: () => (variosAlumnos() ? perfil : null),
      cambiarAlumno,
      avisoInstalar: tocaAvisoInstalar,
      instalar: abrirInstalar,
      descartarInstalar: descartarAviso,
      instalada: () => formaInstalar() === 'instalada',
      alCambiarInstalacion,
      modoPara: (id: string) => modoHoy(estado, id, Math.random),
      tableroSesion(ids: readonly string[]) {
        // Durante la sesión, la cuadrícula enseña solo sus verbos (en el orden del listado).
        const enSesion = new Set(ids);
        montarTablero(verbos.filter((v) => enSesion.has(v.id)));
        return tablero!;
      },
      tableroActual: () => tablero,
      verTodos: () => montarTablero(verbos),
      irAAprender: () => cambiarPestana('aprender'),
      alExplorar: () => cambiarPestana('explorar'),
    };
  }

  // --- Arranque ---
  if (!almacen.disponible) mostrarAvisoAlmacen();
  // Pedir almacenamiento persistente (Safari puede borrar datos de webs poco visitadas).
  void navigator.storage?.persist?.().catch(() => undefined);

  for (const b of botonesPestana) b.addEventListener('click', () => cambiarPestana(b.dataset.modo as Pestana));  const abrirPanel = crearPanelAdultos({
    estado: () => estado,
    guardar,
    verbos,
    recargar: () => window.location.reload(),
    alumnos: () => ({ perfiles: indice.perfiles, actual: perfilId }),
    copiaCasa() {
      guardar();
      const progresos: Record<string, EstadoProgreso> = {};
      for (const p of indice.perfiles) progresos[p.id] = p.id === perfilId ? estado : new Almacen(backend, claveProgreso(p.id)).cargar();
      return { texto: exportarCasa(indice.perfiles, progresos), nombre: nombreFicheroCasa() };
    },
    restaurarCasa(texto: string, confirmar: (n: number) => boolean) {
      const r = importarCasa(texto);
      if (!r.ok) return r.error;
      if (!confirmar(r.perfiles.length)) return null;
      // Fuera los alumnos de ahora; dentro los de la copia (con el PIN de este dispositivo).
      for (const p of indice.perfiles) {
        try {
          backend?.removeItem(claveProgreso(p.id));
        } catch {
          /* nada */
        }
      }
      for (const p of r.perfiles) {
        const e = r.progresos[p.id];
        e.ajustes.pinHash = indice.pinHash;
        new Almacen(backend, claveProgreso(p.id)).guardar(e);
      }
      indice.perfiles = r.perfiles;
      indice.ultimo = r.perfiles[0].id;
      indice.nombrePedido = true;
      guardarIndice(backend, indice);
      // Al recargar, si hay varios, se pregunta quién estudia.
      try {
        sessionStorage.removeItem(CLAVE_ELEGIDO);
      } catch {
        /* nada */
      }
      window.location.reload();
      return null;
    },
    borrarAlumno(id: string) {
      if (id === perfilId || !borrarPerfil(indice, id)) return false;
      try {
        backend?.removeItem(claveProgreso(id));
      } catch {
        /* sin almacenamiento: no queda nada que borrar */
      }
      guardarIndice(backend, indice);
      return true;
    },
  });
  const abrirGuia = crearGuia({
    verboParaTaller() {
      const sinTruco = enCurso().filter((v) => !estado.trucosPropios[v.id]);
      if (!sinTruco.length) return null;
      // Primero, el que más ha fallado: es donde un truco propio sirve de verdad.
      const fallos = new Map<string, number>();
      for (const r of estado.historial) if (r.res === 'fallo') fallos.set(r.verbo, (fallos.get(r.verbo) ?? 0) + 1);
      const masFallado = [...sinTruco].sort((a, b) => (fallos.get(b.id) ?? 0) - (fallos.get(a.id) ?? 0))[0];
      if ((fallos.get(masFallado.id) ?? 0) > 0) return masFallado;
      // Si aún no ha fallado nada, uno al azar.
      return sinTruco[Math.floor(Math.random() * sinTruco.length)];
    },
    guardarTruco: (id, texto) => trucos.guardarPropio(id, texto),
    alCerrar() {
      if (!estado.guiaVista) {
        estado.guiaVista = true;
        guardar();
      }
    },
    alEmpezar: () => cambiarPestana('hoy'),
  });
  const { abrirBienvenida, abrirGuiaAdultos } = crearBienvenida({
    // Quien estrena la app como alumno: primero su nombre, luego su guía.
    abrirGuiaAlumno: () => (faltaNombre(indice) ? editarPerfil(true, abrirGuia) : abrirGuia()),
    abrirPanel,
    alElegir() {
      if (!estado.bienvenidaVista) {
        estado.bienvenidaVista = true;
        guardar();
      }
    },
  });
  prepararMas(document.getElementById('boton-mas') as HTMLButtonElement, {
    alumno: () => ({ perfil, varios: variosAlumnos() }),
    cambiarAlumno,
    editarPerfil: () => editarPerfil(),
    anadirAlumno: () => anadirAlumno(backend, indice, () => undefined),
    abrirGuia,
    abrirInstalar: () => (formaInstalar() === 'instalada' ? null : abrirInstalar),
    abrirGuiaAdultos,
    abrirAcercaDe: crearAcercaDe(),
    abrirPanelAdultos: abrirPanel,
    estado: () => estado,
    reemplazar(nuevo) {
      estado = nuevo;
      guardar();
      // Lo más sencillo y seguro: volver a arrancar con el progreso importado.
      window.location.reload();
    },
  });
  cambiarPestana('hoy');
  // Primer arranque: "¿quién eres?". Después, si el alumno aún no ha visto su guía, se le abre sola.
  if (!estado.bienvenidaVista) abrirBienvenida();
  // Primera vez con la versión de los alumnos: ponerle nombre al perfil (una sola vez).
  else if (faltaNombre(indice)) editarPerfil(true, () => (estado.guiaVista ? undefined : abrirGuia()));
  else if (!estado.guiaVista) abrirGuia();
}
