import { RondaEmparejar } from '../logic/emparejar';
import { formasDe } from '../logic/verbos';
import type { ResumenRonda } from '../logic/sesion';
import { boton, el } from './dom';
import { pintarAcierto, pintarFallo, pintarResumen, progreso, type Contexto, type ModoPractica } from './comun';

export interface OpcionesEmparejar {
  /** Verbos cuyas formas hay que emparejar (por defecto, todos los del grupo). Se puede tocar cualquier verbo del grupo. */
  ids?: readonly string[];
  /** Qué hacer al terminar (por defecto, el resumen con "Otra ronda"). */
  alTerminar?: (resumen: ResumenRonda) => void;
}

/**
 * Emparejar (SPEC 4.2): tandas de formas para unir con su verbo. "Toca unas
 * formas, luego toca su verbo." Todos los verbos del grupo se pueden tocar siempre.
 */
export function iniciarEmparejar(ctx: Contexto, op: OpcionesEmparejar = {}): ModoPractica {
  const { contenedor, tablero, verbos, rng, motor } = ctx;
  /** Momento de la última acción, para medir el tiempo de cada emparejamiento. */
  let desde = performance.now();
  tablero.setInteractivo(true);

  const ids = () => op.ids ?? verbos.map((v) => v.id);
  let ronda = new RondaEmparejar(ids(), rng);
  let seleccionadas: string | null = null;
  /** Verbos emparejados en la tanda actual (en verde). */
  const emparejados = new Set<string>();
  /** Marcas temporales del último intento (fallo y verbo correcto). */
  let marcasTemporales: string[] = [];
  let emparejadosEnRonda = 0;

  const cabecera = el('div', 'cabecera-modo');
  const pool = el('div', 'pool');
  pool.setAttribute('aria-label', 'Formas por emparejar');
  const feedback = el('div', 'feedback');

  const verbo = (id: string) => verbos.find((v) => v.id === id)!;
  const infinitivo = (id: string) => verbo(id).infinitivo;
  const formas = (id: string) => formasDe(verbo(id));

  function limpiarMarcas(): void {
    for (const id of marcasTemporales) tablero.setEstado(id, emparejados.has(id) ? 'acierto' : null);
    marcasTemporales = [];
    tablero.mostrarFormas(null);
  }

  function pintarTanda(): void {
    const { total } = ronda.resumen();
    cabecera.replaceChildren(
      progreso(`Tanda ${ronda.numeroTanda()} · ${emparejadosEnRonda} de ${total} emparejados`),
      el('p', 'enunciado', 'Toca unas formas y después su verbo en la cuadrícula.'),
    );
    pool.replaceChildren(
      ...ronda.tanda().map((id) => {
        const b = boton(formas(id), 'chip chip-formas', () => elegir(id));
        b.dataset.id = id;
        b.setAttribute('aria-pressed', String(id === seleccionadas));
        return b;
      }),
    );
  }

  function elegir(id: string): void {
    limpiarMarcas();
    seleccionadas = id;
    for (const b of pool.querySelectorAll<HTMLButtonElement>('.chip-formas')) {
      b.setAttribute('aria-pressed', String(b.dataset.id === id));
    }
    feedback.className = 'feedback';
    feedback.replaceChildren(el('p', 'feedback-texto pista', `Ahora toca el verbo de ${formas(id)}.`));
  }

  function alTocarVerbo(tocado: string): void {
    if (ronda.terminada()) return;
    if (!seleccionadas) {
      limpiarMarcas();
      feedback.className = 'feedback';
      feedback.replaceChildren(el('p', 'feedback-texto pista', 'Primero elige unas formas de la lista.'));
      return;
    }
    const de = seleccionadas;
    seleccionadas = null;
    const r = ronda.emparejar(de, tocado);
    motor.registrar(de, 'emparejar', r.acierto ? 'acierto' : 'fallo', performance.now() - desde);
    desde = performance.now();

    if (r.acierto) {
      emparejadosEnRonda++;
      emparejados.add(tocado);
      tablero.setEstado(tocado, 'acierto');
      tablero.mostrarFormas(tocado);
      marcasTemporales = [];
      pintarAcierto(feedback, r.recuperado, rng, null);
    } else {
      tablero.setEstado(tocado, 'fallo');
      tablero.setEstado(de, 'objetivo');
      tablero.mostrarFormas(de);
      marcasTemporales = [tocado, de];
      pintarFallo(
        feedback,
        ['Has tocado ', el('strong', '', infinitivo(tocado)), '. ', formas(de), ' son las formas de ', el('strong', '', infinitivo(de)), '.'],
        motor.truco(de),
        null,
      );
    }

    if (r.rondaTerminada) {
      // Un momento para ver el último resultado antes del resumen.
      window.setTimeout(() => {
        if (!contenedor.contains(feedback)) return;
        limpiarTodo();
        if (op.alTerminar) op.alTerminar(ronda.resumen());
        else pintarResumen(contenedor, ronda.resumen(), otraRonda, ctx.alExplorar);
      }, r.acierto ? 1200 : 2600);
      pool.replaceChildren();
      return;
    }
    if (r.tandaTerminada) {
      // Nueva tanda: se borran los verdes para que la cuadrícula no delate los que quedan.
      // El último emparejado sigue en verde hasta la siguiente acción.
      for (const id of emparejados) if (!(r.acierto && id === tocado)) tablero.setEstado(id, null);
      emparejados.clear();
      if (r.acierto) marcasTemporales = [tocado];
    }
    pintarTanda();
  }

  function limpiarTodo(): void {
    tablero.limpiarEstados();
    tablero.mostrarFormas(null);
    emparejados.clear();
    marcasTemporales = [];
  }

  function otraRonda(): void {
    ronda = new RondaEmparejar(ids(), rng);
    emparejadosEnRonda = 0;
    seleccionadas = null;
    limpiarTodo();
    feedback.className = 'feedback';
    feedback.replaceChildren();
    contenedor.replaceChildren(cabecera, pool, feedback);
    pintarTanda();
  }

  otraRonda();

  return {
    alTocarVerbo,
    salir() {
      limpiarTodo();
    },
  };
}
