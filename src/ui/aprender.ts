import type { ModoId } from '../logic/config';
import { mensajeResumen } from '../logic/mensajes';
import { ESCALONES, escalonDe, type EstadoProgreso, type Escalon } from '../logic/progreso';
import type { ResumenRonda } from '../logic/sesion';
import { barajar } from '../logic/rng';
import { boton, el, rellenar } from './dom';
import type { Contexto, ModoPractica, Motor } from './comun';
import type { Modo } from './explorar';
import { iniciarEmparejar } from './emparejar';
import { iniciarRonda } from './ronda';

export const NOMBRE_ESCALON: Record<Escalon, string> = {
  elegir: 'Elegir',
  emparejar: 'Emparejar',
  completar: 'Completar',
  tablamuda: 'Tabla muda',
};

const QUE_SE_HACE: Record<Escalon, string> = {
  elegir: 'reconocer el pasado y el participio entre cuatro',
  emparejar: 'unir cada verbo con sus formas',
  completar: 'escribir el pasado y el participio',
  tablamuda: 'escribir las tres formas a partir del significado',
};

/** Verbos por tanda como mucho. */
const TAM_TANDA = 16;
/** En la escalera, cuántos nombres se listan por escalón antes de resumir "y N más". */
const NOMBRES_MAX = 12;

/** Modo de la pregunta suelta de cada escalón (Emparejar, cuando va suelto, es Al revés). */
function modoDeEscalon(e: Escalon): ModoId {
  return e === 'emparejar' ? 'alreves' : e;
}

/**
 * Pestaña "Aprender" (SPEC 4.3): los verbos del grupo, cada uno en su
 * escalón (Elegir → Emparejar → Completar → Tabla muda). Cada tanda pregunta una
 * vez por cada verbo pendiente, en el modo de su escalón; los de Emparejar van
 * juntos. Dos aciertos separados suben de escalón.
 */
export function iniciarAprender(panel: HTMLElement, ctx: Omit<Contexto, 'contenedor'>, estado: () => EstadoProgreso): Modo {
  const contenedor = el('div', 'contenido-modo');
  panel.replaceChildren(contenedor);
  let actual: ModoPractica | null = null;
  const subieron = new Map<string, Escalon>();
  const aprendidos = new Set<string>();
  let resumen: ResumenRonda = { total: 0, aLaPrimera: 0, fallos: 0 };

  const nombre = (id: string) => ctx.verbos.find((v) => v.id === id)?.infinitivo ?? id;

  /** El motor de la app, apuntando quién sube de escalón en esta tanda. */
  const motor: Motor = {
    ...ctx.motor,
    registrar(verboId, modo, resultado, tiempoMs, opciones) {
      const cambio = ctx.motor.registrar(verboId, modo, resultado, tiempoMs, opciones);
      if (cambio.aprendido) {
        aprendidos.add(verboId);
        subieron.delete(verboId);
      } else if (cambio.subio) {
        const e = escalonDe(estado(), verboId);
        if (e) subieron.set(verboId, e);
      }
      return cambio;
    },
  };
  const contexto = { ...ctx, contenedor, motor };

  /** Los verbos del grupo, por escalón, más los aprendidos. */
  function escalera(): HTMLElement {
    const e = estado();
    const lista = el('ol', 'escalera');
    lista.setAttribute('aria-label', 'Escalones de este grupo');
    const filas: { titulo: string; detalle: string; ids: string[]; clase: string }[] = ESCALONES.map((esc, i) => ({
      titulo: `${i + 1}. ${NOMBRE_ESCALON[esc]}`,
      detalle: QUE_SE_HACE[esc],
      ids: ctx.verbos.filter((v) => escalonDe(e, v.id) === esc).map((v) => v.id),
      clase: `escalon-${esc}`,
    }));
    filas.push({
      titulo: 'Aprendidos',
      detalle: 'ya te los sabes de memoria',
      ids: ctx.verbos.filter((v) => escalonDe(e, v.id) === null).map((v) => v.id),
      clase: 'escalon-aprendido',
    });
    for (const f of filas) {
      const li = el(
        'li',
        `escalon ${f.clase}${f.ids.length ? '' : ' vacio'}`,
        el('span', 'escalon-titulo', f.titulo, el('span', 'escalon-cuenta', String(f.ids.length))),
        el('span', 'escalon-detalle', f.detalle),
        f.ids.length ? el('span', 'escalon-verbos', listaNombres(f.ids)) : null,
      );
      lista.append(li);
    }
    return lista;
  }

  function listaNombres(ids: string[]): string {
    const nombres = ids.map(nombre).sort((a, b) => a.localeCompare(b, 'en'));
    if (nombres.length <= NOMBRES_MAX) return nombres.join(', ');
    return `${nombres.slice(0, NOMBRES_MAX).join(', ')} y ${nombres.length - NOMBRES_MAX} más`;
  }

  function pendientes(): string[] {
    const e = estado();
    return ctx.verbos.filter((v) => escalonDe(e, v.id) !== null).map((v) => v.id);
  }

  function pintarInicio(): void {
    actual?.salir();
    actual = null;
    const hay = pendientes().length > 0;
    const empezar = hay
      ? boton('Empezar', 'boton-principal', empezarTanda)
      : boton('Repasar con tabla muda', 'boton-principal', repasoLibre);
    contenedor.replaceChildren(
      el('h2', 'titulo-panel', 'Aprender'),
      el(
        'p',
        'ayuda',
        hay
          ? `Cada verbo sube de escalón con dos aciertos en tandas distintas. Al superar el último, queda aprendido.${pendientes().length > TAM_TANDA ? ` Cada tanda lleva ${TAM_TANDA} verbos.` : ''}`
          : 'Ya has aprendido todos los verbos de este grupo. Si quieres, puedes practicarlos ahora con la tabla muda.',
      ),
      escalera(),
      el('div', 'acciones', empezar),
    );
    empezar.focus({ preventScroll: true });
  }

  function acumular(r: ResumenRonda): void {
    resumen = { total: resumen.total + r.total, aLaPrimera: resumen.aLaPrimera + r.aLaPrimera, fallos: resumen.fallos + r.fallos };
  }

  function empezarTanda(): void {
    actual?.salir();
    subieron.clear();
    aprendidos.clear();
    resumen = { total: 0, aLaPrimera: 0, fallos: 0 };
    const e = estado();
    // Como mucho TAM_TANDA, empezando por los de escalón más bajo.
    const nivel = (id: string) => ESCALONES.indexOf(escalonDe(e, id)!);
    const ids = pendientes()
      .sort((a, b) => nivel(a) - nivel(b))
      .slice(0, TAM_TANDA);
    const modos = new Map(ids.map((id) => [id, escalonDe(e, id)!]));
    const aEmparejar = ids.filter((id) => modos.get(id) === 'emparejar');
    // Emparejar necesita al menos dos verbos para tener sentido; con uno solo, va suelto (Al revés).
    if (aEmparejar.length >= 2) {
      actual = iniciarEmparejar(contexto, {
        ids: aEmparejar,
        alTerminar(r) {
          acumular(r);
          const resto = ids.filter((id) => modos.get(id) !== 'emparejar');
          if (resto.length) rondaSuelta(resto, modos);
          else pintarFinal();
        },
      });
    } else {
      rondaSuelta(ids, modos);
    }
  }

  function rondaSuelta(ids: string[], modos: Map<string, Escalon>): void {
    actual?.salir();
    actual = iniciarRonda(contexto, {
      ids: () => ids,
      modoPara: (id) => modoDeEscalon(modos.get(id) ?? 'elegir'),
      alTerminar(r) {
        acumular(r);
        pintarFinal();
      },
    });
  }

  /** Repaso sin escalones pendientes: una vuelta de Tabla muda a todo el grupo. */
  function repasoLibre(): void {
    actual?.salir();
    subieron.clear();
    aprendidos.clear();
    resumen = { total: 0, aLaPrimera: 0, fallos: 0 };
    actual = iniciarRonda(contexto, {
      ids: () => barajar(ctx.verbos.map((v) => v.id), ctx.rng).slice(0, TAM_TANDA),
      modoPara: () => 'tablamuda',
      alTerminar(r) {
        acumular(r);
        pintarFinal();
      },
    });
  }

  function pintarFinal(): void {
    actual?.salir();
    actual = null;
    ctx.tablero.limpiarEstados();
    ctx.tablero.mostrarFormas(null);
    const listaNombres = (ids: string[]) => ids.map(nombre).join(', ');
    const sube = [...subieron.entries()];
    const seguir = boton(pendientes().length ? 'Seguir aprendiendo' : 'Ver el grupo', 'boton-principal', () =>
      pendientes().length ? empezarTanda() : pintarInicio(),
    );
    rellenar(
      contenedor,
      el('p', 'resumen-titulo', 'Tanda terminada'),
      el('p', 'resumen', mensajeResumen(resumen.aLaPrimera, resumen.total)),
      aprendidos.size ? el('p', 'resumen-escalones', el('strong', '', 'Aprendidos: '), listaNombres([...aprendidos]), '.') : null,
      sube.length
        ? el(
            'p',
            'resumen-escalones',
            el('strong', '', 'Suben de escalón: '),
            sube.map(([id, esc]) => `${nombre(id)} (a ${NOMBRE_ESCALON[esc]})`).join(', '),
            '.',
          )
        : null,
      escalera(),
      el('div', 'acciones', seguir, boton('Ver la tabla', 'boton-secundario', ctx.alExplorar)),
    );
    seguir.focus({ preventScroll: true });
  }

  pintarInicio();

  return {
    alTocarVerbo: (id) => actual?.alTocarVerbo(id),
    salir: () => actual?.salir(),
  };
}
