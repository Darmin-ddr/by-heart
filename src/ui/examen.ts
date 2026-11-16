import { corregirFila, notaExamen, prepararExamen, verbosDeAmbito, type AmbitoExamen, type CorreccionFila, type FilaExamen } from '../logic/examen';
import type { CorreccionForma } from '../logic/formas';
import type { Rng } from '../logic/rng';
import type { Verbo } from '../logic/types';
import { boton, el, rellenar } from './dom';
import type { Motor } from './comun';
import type { Modo } from './explorar';
import { campoRespuesta, formaCorregida } from './preguntas';

/** Lo que el examen necesita de la app. */
export interface ServiciosExamen {
  motor: Motor;
  verbos: readonly Verbo[];
  /** Ids de los verbos que el alumno ya ha empezado. */
  empezados: () => ReadonlySet<string>;
  rng: Rng;
  /** Lista de examen del panel (null si no hay). */
  listaExamen: () => readonly string[] | null;
  /** Añade verbos a los priorizados de Hoy. */
  priorizar: (ids: readonly string[]) => void;
}

type Cantidad = 10 | 20 | null;
type Clave = 'infinitivo' | 'pasado' | 'participio';
const ETIQUETA: Record<Clave, string> = { infinitivo: 'Infinitivo', pasado: 'Pasado', participio: 'Participio' };

/** Recuerda la última elección en esta visita (solo en memoria). */
let ultimoAmbito: AmbitoExamen = 'empezados';
let ultimaCantidad: Cantidad = 20;

/**
 * Pestaña "Examen" (SPEC 4.4): una tabla de verbos con huecos, como la de
 * clase. Se rellena entera y se corrige al final, sin trucos ni repeticiones:
 * nota sobre 10, la corrección en la propia tabla y la opción de mandar los
 * fallos a Hoy. Los resultados cuentan para los repasos.
 */
export function iniciarExamen(panel: HTMLElement, s: ServiciosExamen): Modo {
  const contenedor = el('div', 'contenido-modo');
  panel.replaceChildren(contenedor);
  let ambito: AmbitoExamen =
    (ultimoAmbito === 'lista' && !s.listaExamen()?.length) || (ultimoAmbito === 'empezados' && !s.empezados().size) ? 'todo' : ultimoAmbito;
  let cantidad: Cantidad = ultimaCantidad;

  function selector<T>(etiqueta: string, opciones: { valor: T; texto: string; desactivado?: boolean }[], esActual: (v: T) => boolean, elegir: (v: T) => void): HTMLElement {
    const caja = el('div', 'selector-practica');
    caja.setAttribute('role', 'group');
    caja.setAttribute('aria-label', etiqueta);
    for (const o of opciones) {
      const b = boton(o.texto, 'selector-opcion', () => elegir(o.valor));
      b.setAttribute('aria-pressed', String(esActual(o.valor)));
      b.disabled = Boolean(o.desactivado);
      caja.append(b);
    }
    return el('div', 'campo-etiquetado', el('span', 'etiqueta-campo', etiqueta), caja);
  }

  const verbosAmbito = () => verbosDeAmbito(ambito, s.verbos, s.listaExamen(), s.empezados());

  function pintarInicio(): void {
    const lista = s.listaExamen();
    const total = verbosAmbito().length;
    const empezar = boton('Empezar examen', 'boton-principal', empezarExamen);
    empezar.disabled = total === 0;
    rellenar(
      contenedor,
      el('h2', 'titulo-panel', 'Examen'),
      el('p', 'ayuda', 'Como el de clase: una tabla de verbos con huecos. Rellénala entera y, al final, corrígela para ver tu nota.'),
      selector<AmbitoExamen>(
        'Qué entra',
        [
          { valor: 'empezados', texto: 'Los que has visto', desactivado: s.empezados().size === 0 },
          { valor: 'todo', texto: 'Todos los verbos' },
          ...(lista?.length ? [{ valor: 'lista' as const, texto: 'Lista del examen' }] : []),
        ],
        (v) => ambito === v,
        (v) => {
          ambito = ultimoAmbito = v;
          pintarInicio();
        },
      ),
      selector<Cantidad>(
        'Cuántos verbos',
        [
          { valor: 10, texto: '10', desactivado: total < 10 },
          { valor: 20, texto: '20', desactivado: total < 20 },
          { valor: null, texto: `Todos (${total})` },
        ],
        (v) => v === cantidad,
        (v) => {
          cantidad = ultimaCantidad = v;
          pintarInicio();
        },
      ),
      el(
        'p',
        'ayuda',
        'Un punto por verbo con todo bien; medio punto si fallas una sola casilla. La ortografía cuenta, como en clase. El examen también cuenta para tus repasos.',
      ),
      el('div', 'acciones', empezar),
    );
    empezar.focus({ preventScroll: true });
  }

  function empezarExamen(): void {
    const verbos = verbosAmbito();
    const n = cantidad !== null && cantidad < verbos.length ? cantidad : null;
    const filas = prepararExamen(verbos, n, s.rng);
    const verboDe = (id: string) => s.verbos.find((v) => v.id === id)!;
    const inicio = performance.now();

    type Celdas = Partial<Record<Clave, HTMLInputElement>>;
    const celdas: Celdas[] = [];
    const tabla = el('div', 'tabla-examen');
    tabla.setAttribute('role', 'table');
    tabla.setAttribute('aria-label', 'Tabla de verbos');
    const cabecera = el('div', 'fila-examen fila-cabecera', ...['', 'Infinitivo', 'Pasado', 'Participio', 'Significado'].map((t) => el('span', 'celda-cabecera', t)));
    cabecera.setAttribute('role', 'row');
    cabecera.setAttribute('aria-hidden', 'true');
    tabla.append(cabecera);

    filas.forEach((fila, i) => {
      const v = verboDe(fila.verboId);
      const mias: Celdas = {};
      const celda = (clave: Clave): HTMLElement => {
        if (clave === 'infinitivo' && fila.dato === 'infinitivo') return el('span', 'celda celda-dada', el('span', 'celda-etiqueta', ETIQUETA[clave]), v.infinitivo);
        const campo = campoRespuesta(`${ETIQUETA[clave]} del verbo ${i + 1} (${v.significado})`, '');
        campo.classList.add('campo-examen');
        campo.enterKeyHint = 'next';
        mias[clave] = campo;
        return el('label', 'celda', el('span', 'celda-etiqueta', ETIQUETA[clave]), campo);
      };
      const filaEl = el(
        'div',
        'fila-examen',
        el('span', 'celda-numero', String(i + 1)),
        celda('infinitivo'),
        celda('pasado'),
        celda('participio'),
        el('span', 'celda celda-dada celda-significado', v.significado),
      );
      filaEl.setAttribute('role', 'row');
      celdas.push(mias);
      tabla.append(filaEl);
    });

    const campos = celdas.flatMap((c) => (['infinitivo', 'pasado', 'participio'] as const).map((k) => c[k]).filter((x): x is HTMLInputElement => !!x));
    const aviso = el('p', 'ayuda aviso-blancos');
    aviso.hidden = true;
    let avisado = false;
    const corregir = el('button', 'boton-principal', 'Corregir');
    corregir.type = 'submit';
    const form = el('form', 'respuesta-form form-examen', tabla, aviso, el('div', 'acciones', corregir));
    // Enter pasa a la casilla siguiente; solo el botón corrige.
    form.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || !(e.target instanceof HTMLInputElement)) return;
      e.preventDefault();
      const i = campos.indexOf(e.target);
      (campos[i + 1] ?? corregir).focus();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const blancos = campos.filter((c) => !c.value.trim()).length;
      if (blancos && !avisado) {
        avisado = true;
        aviso.hidden = false;
        aviso.textContent = `Te ${blancos === 1 ? 'queda 1 casilla' : `quedan ${blancos} casillas`} en blanco. Si no sabes más, pulsa otra vez «Corregir».`;
        campos.find((c) => !c.value.trim())?.focus();
        return;
      }
      const tiempo = (performance.now() - inicio) / Math.max(1, filas.length);
      const correcciones = filas.map((fila, i) => {
        const valor = (k: Clave) => celdas[i][k]?.value ?? '';
        const c = corregirFila(verboDe(fila.verboId), fila, { infinitivo: valor('infinitivo'), pasado: valor('pasado'), participio: valor('participio') });
        s.motor.registrar(fila.verboId, fila.dato === 'infinitivo' ? 'completar' : 'tablamuda', c.resultado, tiempo, { examen: true });
        return c;
      });
      pintarResultado(filas, celdas, correcciones, tabla);
    });

    rellenar(
      contenedor,
      el('h2', 'titulo-panel', 'Examen'),
      el('p', 'ayuda', `${filas.length} verbos. Escribe lo que falta en cada fila; si no lo sabes, déjalo en blanco.`),
      form,
    );
    campos[0]?.focus({ preventScroll: true });
  }

  function pintarResultado(filas: FilaExamen[], celdas: Partial<Record<Clave, HTMLInputElement>>[], correcciones: CorreccionFila[], tabla: HTMLElement): void {
    const nota = notaExamen(correcciones.map((c) => c.puntos));
    const completas = correcciones.filter((c) => c.puntos === 1).length;
    const medias = correcciones.filter((c) => c.puntos === 0.5).length;
    const nada = correcciones.length - completas - medias;
    const fallos = filas.filter((_, i) => correcciones[i].puntos < 1).map((f) => f.verboId);

    // La corrección, en la propia tabla: cada casilla bien o mal, y la forma correcta debajo de las que no.
    const filasEl = [...tabla.querySelectorAll<HTMLElement>('.fila-examen:not(.fila-cabecera)')];
    filas.forEach((_, i) => {
      const c = correcciones[i];
      for (const k of ['infinitivo', 'pasado', 'participio'] as const) {
        const campo = celdas[i][k];
        const correccion: CorreccionForma | undefined = c.correccion[k];
        if (!campo || !correccion) continue;
        campo.disabled = true;
        campo.classList.add(correccion.estado === 'bien' ? 'correcta' : 'elegida-mal');
        if (correccion.estado !== 'bien') campo.after(el('span', 'celda-correcta', formaCorregida(correccion)));
      }
      const puntos = el('span', `celda-puntos puntos-${String(c.puntos).replace('.', '-')}`, c.puntos === 0.5 ? '½' : String(c.puntos));
      puntos.setAttribute('aria-label', `${c.puntos === 0.5 ? 'Medio punto' : c.puntos === 1 ? 'Un punto' : 'Cero puntos'}`);
      filasEl[i]?.querySelector('.celda-numero')?.replaceChildren(puntos);
    });

    const priorizar = fallos.length
      ? boton('Repasar los fallos antes en Hoy', 'boton-principal', () => {
          s.priorizar(fallos);
          priorizar!.disabled = true;
          priorizar!.textContent = 'Saldrán antes en Hoy';
        })
      : null;
    const otro = boton('Otro examen', priorizar ? 'boton-secundario' : 'boton-principal', pintarInicio);
    rellenar(
      contenedor,
      el('p', 'resumen-titulo', 'Examen corregido'),
      el('p', 'nota-examen', 'Nota: ', el('strong', '', nota.toLocaleString('es-ES'))),
      el('p', 'resumen', `${completas} bien, ${medias} con medio punto y ${nada} sin punto, de ${correcciones.length}.`),
      el('div', 'acciones', priorizar, otro),
      el('p', 'ayuda', fallos.length ? 'Debajo de cada casilla mal está la forma correcta; la letra subrayada es en la que te has equivocado por poco.' : '¡Todo bien!'),
      tabla,
    );
    (priorizar ?? otro).focus({ preventScroll: true });
  }

  pintarInicio();

  return {
    alTocarVerbo: () => undefined,
    salir: () => undefined,
  };
}
