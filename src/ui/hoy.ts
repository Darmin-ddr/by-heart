import type { ModoId } from '../logic/config';
import { ColaHoy, type ItemHoy } from '../logic/hoy';
import { mensajeResumen } from '../logic/mensajes';
import type { Rng } from '../logic/rng';
import type { Resultado } from '../logic/sesion';
import type { Verbo } from '../logic/types';
import type { ResumenPortada } from '../logic/portada';
import type { Perfil } from '../logic/perfiles';
import { avatar, nombreVisible } from './perfiles';
import { actualizarAhora, alHaberVersionNueva, hayVersionNueva } from './actualizar';
import type { Tablero } from './tablero';
import { boton, el, rellenar } from './dom';
import { PAUSA_TRAS_ACIERTO_MS, Teclado, progreso, type Motor } from './comun';
import type { Modo } from './explorar';
import { preguntaElegir, RENDERIZADORES, type ControlPregunta } from './preguntas';

/** Lo que Hoy necesita de la app. */
export interface ServiciosHoy {
  motor: Motor;
  /** Todos los verbos (distractores de Elegir). */
  candidatos: readonly Verbo[];
  rng: Rng;
  /** Sesión de hoy (vacía si no queda nada) y repaso adelantado. */
  sesion: () => ItemHoy[];
  adelantado: () => ItemHoy[];
  /** Tipo de pregunta de un verbo en este momento (según su escalón o, si está aprendido, variado). */
  modoPara: (verboId: string) => ModoId;
  /** Cuadrícula del grupo del verbo (la cambia si hace falta) y cuánto dura el rótulo del grupo nuevo (0 si no cambia). */
  tableroPara: (verbo: Verbo) => { tablero: Tablero; transicionMs: number };
  /** Cuadrícula actual (para limpiarla al salir). */
  tableroActual: () => Tablero | null;
  /** Vuelve a la cuadrícula de todos los verbos (la de la portada). */
  verTodos: () => void;
  /** Cifras de la portada. */
  resumen: () => ResumenPortada;
  /** Días hasta el examen del panel (null si no hay lista de examen o fecha). */
  diasExamen: () => number | null;
  /** Alumno actual si hay varios en el dispositivo (null si solo hay uno) y cómo cambiarlo. */
  alumno: () => Perfil | null;
  cambiarAlumno: () => void;
  /** Aviso de instalar (una vez): si toca, abrir la instalación, descartarlo para siempre y saber si ya está instalada. */
  avisoInstalar: () => boolean;
  instalar: () => void;
  descartarInstalar: () => void;
  instalada: () => boolean;
  alCambiarInstalacion: (f: () => void) => () => void;
  irAAprender: () => void;
  alExplorar: () => void;
}

const TIPOS: Record<ItemHoy['tipo'], string> = { repaso: 'repasos', aprendiendo: 'en aprendizaje', nuevo: 'nuevos' };
/** Segundos por pregunta para estimar la duración de la sesión. */
const SEGUNDOS_PREGUNTA = 25;

function textoDiasExamen(dias: number): string {
  if (dias > 1) return `faltan ${dias} días`;
  if (dias === 1) return 'es mañana';
  if (dias === 0) return 'es hoy';
  return 'ya pasó';
}

/**
 * Pestaña "Hoy" (SPEC 4.1 y 7): la rutina diaria. Repasos de lo aprendido,
 * verbos en aprendizaje y nuevos intercalados (cada nuevo sale dos veces).
 * Las preguntas pueden ser de cualquier grupo: la cuadrícula cambia al grupo
 * del verbo con un rótulo, y el tiempo cuenta desde que está quieta.
 */
export function iniciarHoy(panel: HTMLElement, s: ServiciosHoy): Modo {
  const contenedor = el('div', 'contenido-modo');
  panel.replaceChildren(contenedor);
  const teclado = new Teclado();
  let cola: ColaHoy | null = null;
  let control: ControlPregunta = {};
  let temporizador: number | undefined;
  let nuevosVistos = new Set<string>();
  let tiposPorVerbo = new Map<string, ItemHoy['tipo']>();
  let adelantando = false;

  function limpiarTablero(): void {
    const tablero = s.tableroActual();
    tablero?.limpiarEstados();
    tablero?.mostrarFormas(null);
    tablero?.setMudo(false);
  }

  function nombre(id: string): string {
    return s.candidatos.find((v) => v.id === id)?.infinitivo ?? id;
  }

  let dejarDeEscuchar: (() => void) | null = null;
  /** Se está en la portada (o en el resumen final), no a mitad de preguntas. */
  let enPortada = false;

  /** Versión nueva lista: aviso en la portada (nunca a mitad de una pregunta). */
  function avisoVersion(): HTMLElement | null {
    if (!hayVersionNueva()) return null;
    const a = el(
      'div',
      'aviso-version',
      el('p', '', el('strong', '', 'Hay una versión nueva de By Heart.'), ' Tu progreso no cambia.'),
      boton('Actualizar', 'boton-principal', actualizarAhora),
    );
    a.setAttribute('role', 'status');
    return a;
  }
  // Si queda lista mientras se mira la portada, aparece sin esperar.
  const dejarDeEscucharVersion = alHaberVersionNueva(() => {
    if (!enPortada || contenedor.querySelector('.aviso-version')) return;
    const a = avisoVersion();
    if (!a) return;
    const arriba = contenedor.querySelector('.cabecera-hoy, .resumen-titulo');
    if (arriba) arriba.after(a);
    else contenedor.prepend(a);
  });

  /** Con varios alumnos, quién está estudiando (tocarlo deja cambiar). */
  function chipAlumno(): HTMLElement | null {
    const p = s.alumno();
    if (!p) return null;
    const b = boton('', 'chip-alumno', s.cambiarAlumno);
    b.append(avatar(p), el('span', 'perfil-nombre', nombreVisible(p)), el('span', 'chip-alumno-cambiar', 'Cambiar'));
    b.setAttribute('aria-label', `Estudia ${nombreVisible(p)}. Cambiar de alumno`);
    return b;
  }

  /** Aviso de instalar, una sola vez: "Ahora no" lo descarta para siempre (queda la entrada en ⋯). */
  function avisoInstalar(): HTMLElement | null {
    if (!s.avisoInstalar()) return null;
    const aviso = el(
      'div',
      'aviso-instalar',
      el('p', '', el('strong', '', 'Instálala en este dispositivo.'), ' Se abre como una app y funciona también sin conexión.'),
      el(
        'div',
        'acciones',
        boton('Instalar', 'boton-secundario', () => s.instalar()),
        boton('Ahora no', 'boton-enlace', () => {
          s.descartarInstalar();
          aviso.remove();
        }),
      ),
    );
    // Si se instala desde aquí (o el navegador avisa de que ya lo está), el aviso sobra.
    dejarDeEscuchar?.();
    dejarDeEscuchar = s.alCambiarInstalacion(() => {
      if (s.instalada()) aviso.remove();
    });
    return aviso;
  }

  /** Portada: cifras de lo aprendido (logros, sin rachas). La cuadrícula de al lado los enseña coloreados. */
  function bloqueProgreso(): HTMLElement {
    const r = s.resumen();
    const dias = s.diasExamen();
    const porcentaje = r.total ? Math.round((r.aprendidos / r.total) * 100) : 0;
    const relleno = el('span', 'barra-relleno');
    relleno.style.width = `${porcentaje}%`;
    const barra = el('span', 'barra-progreso', relleno);
    barra.setAttribute('role', 'img');
    barra.setAttribute('aria-label', `${r.aprendidos} de ${r.total} verbos aprendidos`);
    return el(
      'section',
      'portada-progreso',
      el('h3', 'dialogo-subtitulo', 'Tu progreso'),
      el('p', 'cifra-portada', el('strong', '', String(r.aprendidos)), ` de ${r.total} verbos aprendidos`),
      barra,
      r.aprendidosSemana > 0 ? el('p', 'ayuda', `Esta semana: ${r.aprendidosSemana} ${r.aprendidosSemana === 1 ? 'verbo aprendido' : 'verbos aprendidos'}.`) : null,
      r.examen
        ? el('p', 'ayuda', `Examen${dias !== null ? ` (${textoDiasExamen(dias)})` : ''}: ${r.examen.aprendidos} de ${r.examen.total} verbos aprendidos.`)
        : null,
    );
  }

  function pintarInicio(): void {
    enPortada = true;
    const items = s.sesion();
    teclado.usar(null);
    if (!items.length) {
      pintarNadaQueHacer();
      return;
    }
    const cuenta = new Map<ItemHoy['tipo'], Set<string>>();
    for (const i of items) {
      const c = cuenta.get(i.tipo) ?? new Set();
      c.add(i.verboId);
      cuenta.set(i.tipo, c);
    }
    const partes = (['repaso', 'aprendiendo', 'nuevo'] as const)
      .filter((t) => cuenta.get(t)?.size)
      .map((t) => el('li', '', el('strong', '', String(cuenta.get(t)!.size)), ` ${TIPOS[t]}`));
    const empezar = boton('Empezar', 'boton-principal', () => empezarSesion(items, false));
    const minutos = Math.max(1, Math.round((items.length * SEGUNDOS_PREGUNTA) / 60));
    rellenar(
      contenedor,
      el('div', 'cabecera-hoy', el('h2', 'titulo-panel', 'Hoy'), chipAlumno()),
      avisoVersion(),
      el('p', 'resumen', `Hoy toca: ${items.length} preguntas, unos ${minutos} minutos.`),
      el('ul', 'hoy-cuentas', ...partes),
      el('div', 'acciones', empezar),
      // Secundario: debajo del botón, para que Empezar quepa en la pantalla del móvil.
      cuenta.get('nuevo')?.size ? el('p', 'ayuda', 'Los verbos nuevos salen dos veces, para fijarlos.') : null,
      avisoInstalar(),
      bloqueProgreso(),
    );
    empezar.focus({ preventScroll: true });
  }

  function pintarNadaQueHacer(): void {
    enPortada = true;
    const hayAdelantado = s.adelantado().length > 0;
    const principal = hayAdelantado
      ? boton('Adelantar repasos', 'boton-principal', () => empezarSesion(s.adelantado(), true))
      : boton('Ir a Aprender', 'boton-principal', s.irAAprender);
    rellenar(
      contenedor,
      el('div', 'cabecera-hoy', el('h2', 'titulo-panel', 'Hoy'), chipAlumno()),
      avisoVersion(),
      el('p', 'resumen', 'Lo de hoy ya está hecho.'),
      el(
        'p',
        'ayuda',
        hayAdelantado
          ? 'Mañana habrá más. Si te apetece seguir, puedes adelantar los repasos de los próximos días o avanzar en Aprender.'
          : 'Mañana habrá más. Si te apetece seguir, avanza en la pestaña Aprender.',
      ),
      el('div', 'acciones', principal, hayAdelantado ? boton('Ir a Aprender', 'boton-secundario', s.irAAprender) : null),
      avisoInstalar(),
      bloqueProgreso(),
    );
    principal.focus({ preventScroll: true });
  }

  function empezarSesion(items: ItemHoy[], adelantado: boolean): void {
    enPortada = false;
    adelantando = adelantado;
    nuevosVistos = new Set(items.filter((i) => i.tipo === 'nuevo').map((i) => i.verboId));
    tiposPorVerbo = new Map(items.map((i) => [i.verboId, i.tipo]));
    // La sesión ya viene ordenada (por grupos, con los nuevos intercalados): no se baraja.
    cola = new ColaHoy(items.map((i) => ({ id: i.verboId, grupo: s.candidatos.find((v) => v.id === i.verboId)?.grupo ?? '' })));
    siguiente();
  }

  function siguiente(): void {
    window.clearTimeout(temporizador);
    limpiarTablero();
    control = {};
    const id = cola?.actual();
    if (!cola || !id) {
      pintarFinal();
      return;
    }
    const verbo = s.candidatos.find((v) => v.id === id)!;
    const { tablero, transicionMs } = s.tableroPara(verbo);
    const modo = s.modoPara(id);
    const renderizar = RENDERIZADORES[modo] ?? preguntaElegir;
    const { total } = cola.resumen();
    const etiqueta = tiposPorVerbo.get(id) === 'nuevo' ? ' · nuevo' : '';
    contenedor.replaceChildren(progreso(`${total - cola.pendientes() + 1} de ${total}${etiqueta}`));
    // El tiempo cuenta desde que la cuadrícula está quieta (tras el rótulo del grupo nuevo).
    const inicio = performance.now() + transicionMs;
    let respondida = false;
    const actual = cola;
    control = renderizar({
      zona: contenedor,
      tablero,
      verbo,
      candidatos: s.candidatos,
      rng: s.rng,
      teclado,
      truco: s.motor.truco(id),
      responder(resultado: Resultado) {
        if (respondida) return { recuperado: false };
        respondida = true;
        const r = actual.responder(resultado);
        s.motor.registrar(id, modo, resultado, Math.max(0, performance.now() - inicio));
        if (resultado === 'acierto') temporizador = window.setTimeout(siguiente, PAUSA_TRAS_ACIERTO_MS + (r.recuperado ? 500 : 0));
        return { recuperado: r.recuperado };
      },
      siguiente,
    });
  }

  function pintarFinal(): void {
    enPortada = true;
    teclado.usar(null);
    s.tableroActual()?.setInteractivo(false);
    const resumen = cola?.resumen() ?? { total: 0, aLaPrimera: 0, fallos: 0 };
    cola = null;
    // Al terminar, vuelta a todos los verbos: se ve lo que se ha coloreado.
    s.verTodos();
    const hayAdelantado = s.adelantado().length > 0;
    const seguir = hayAdelantado
      ? boton('Adelantar repasos', 'boton-principal', () => empezarSesion(s.adelantado(), true))
      : boton('Ir a Aprender', 'boton-principal', s.irAAprender);
    rellenar(
      contenedor,
      el('p', 'resumen-titulo', adelantando ? 'Repaso terminado' : 'Hoy, hecho'),
      avisoVersion(),
      el('p', 'resumen', mensajeResumen(resumen.aLaPrimera, resumen.total)),
      nuevosVistos.size
        ? el('p', 'resumen-escalones', el('strong', '', 'Nuevos de hoy: '), [...nuevosVistos].map(nombre).join(', '), '.')
        : null,
      el('div', 'acciones', seguir, hayAdelantado ? boton('Ir a Aprender', 'boton-secundario', s.irAAprender) : boton('Ver la tabla', 'boton-secundario', s.alExplorar)),
      bloqueProgreso(),
    );
    seguir.focus({ preventScroll: true });
  }

  pintarInicio();

  return {
    alTocarVerbo: (id) => control.alTocarVerbo?.(id),
    salir() {
      dejarDeEscuchar?.();
      dejarDeEscucharVersion();
      window.clearTimeout(temporizador);
      teclado.quitar();
      limpiarTablero();
    },
  };
}
