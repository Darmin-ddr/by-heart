import { CONFIG, type ModoId } from './config';
import { barajar, type Rng } from './rng';
import { aprendido, empezado, escalonDe, type EstadoProgreso } from './progreso';
import type { Resultado, ResumenRonda } from './sesion';
import type { Verbo } from './types';

/**
 * Sesión de Hoy (SPEC 4.1 y 7): repasos de lo aprendido, verbos en
 * aprendizaje y verbos nuevos intercalados, como Anki. Lógica pura.
 */

export type TipoItem = 'repaso' | 'aprendiendo' | 'nuevo';

export interface ItemHoy {
  verboId: string;
  tipo: TipoItem;
}

function diaLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
}

/** Repasos pendientes: verbos aprendidos cuya tarjeta FSRS ya ha vencido. */
export function repasosPendientes(estado: EstadoProgreso, verbos: readonly Verbo[], ahora: Date): Verbo[] {
  return verbos.filter((v) => aprendido(estado, v.id) && estado.tarjetas[v.id] && new Date(estado.tarjetas[v.id].due) <= ahora);
}

/**
 * Nuevos que tocan hoy (SPEC 7): entre el mínimo y el máximo según el
 * porcentaje de aciertos de las últimas respuestas; el mínimo si hay muchos
 * repasos pendientes. Se descuentan los verbos ya empezados hoy.
 */
export function nuevosDeHoy(estado: EstadoProgreso, pendientes: number, ahora: Date, config = CONFIG): number {
  const maximo = Math.max(config.nuevosMinimo, Math.min(estado.ajustes.maxNuevos ?? config.nuevosMaximo, 20));
  let objetivo: number;
  if (pendientes > config.pendientesMuchos) objetivo = config.nuevosMinimo;
  else {
    const recientes = estado.historial.filter((r) => !r.examen).slice(-40);
    if (recientes.length < 10) objetivo = Math.round((config.nuevosMinimo + maximo) / 2);
    else {
      const tasa = recientes.filter((r) => r.res !== 'fallo').length / recientes.length;
      objetivo =
        tasa >= 0.9
          ? maximo
          : tasa >= 0.8
            ? Math.round(config.nuevosMinimo + (maximo - config.nuevosMinimo) * 0.6)
            : tasa >= 0.7
              ? config.nuevosMinimo + 1
              : config.nuevosMinimo;
    }
  }
  objetivo = Math.min(maximo, Math.max(config.nuevosMinimo, objetivo));
  // Verbos cuya primera respuesta fue hoy: ya cuentan como nuevos del día.
  const hoy = diaLocal(ahora);
  const primera = new Map<string, string>();
  for (const r of estado.historial) if (!primera.has(r.verbo)) primera.set(r.verbo, diaLocal(new Date(r.t)));
  const yaHoy = [...primera.values()].filter((d) => d === hoy).length;
  return Math.max(0, objetivo - yaHoy);
}

export interface ParametrosHoy {
  estado: EstadoProgreso;
  /** Verbos con los que trabaja Hoy: todos, también los de grupos aún cerrados. */
  disponibles: readonly Verbo[];
  /** Orden de los grupos para sacar nuevos (el del curso). */
  ordenGrupos: readonly string[];
  /** Verbos a priorizar (lista de examen, fallados en un examen). */
  prioridad: ReadonlySet<string>;
  nuevos: number;
  ahora: Date;
  rng: Rng;
  tam?: number;
}

/**
 * Compone la sesión: unos repasos para entrar en calor y, después, los
 * nuevos repartidos entre el resto; cada nuevo sale dos veces, separado.
 * Devuelve [] si hoy no queda nada que hacer.
 */
export function crearSesionHoy(p: ParametrosHoy): ItemHoy[] {
  const tam = p.tam ?? CONFIG.preguntasSesion;
  const t = p.estado.tarjetas;
  const prio = (v: Verbo) => (p.prioridad.has(v.id) ? 0 : 1);

  const repasos = repasosPendientes(p.estado, p.disponibles, p.ahora)
    .sort((a, b) => prio(a) - prio(b) || new Date(t[a.id].due).getTime() - new Date(t[b.id].due).getTime())
    .map((v): ItemHoy => ({ verboId: v.id, tipo: 'repaso' }));
  // Los verbos en aprendizaje salen una vez al día: si ya se han respondido hoy, esperan a mañana.
  const hoy = diaLocal(p.ahora);
  const respondidosHoy = new Set(p.estado.historial.filter((r) => diaLocal(new Date(r.t)) === hoy).map((r) => r.verbo));
  const aprendiendo = barajar(
    p.disponibles.filter((v) => empezado(p.estado, v.id) && !aprendido(p.estado, v.id) && !respondidosHoy.has(v.id)),
    p.rng,
  )
    .sort((a, b) => prio(a) - prio(b))
    .map((v): ItemHoy => ({ verboId: v.id, tipo: 'aprendiendo' }));

  const ordenGrupo = (v: Verbo) => {
    const i = p.ordenGrupos.indexOf(v.grupo);
    return i === -1 ? p.ordenGrupos.length : i;
  };
  const nuevos = barajar(
    p.disponibles.filter((v) => !empezado(p.estado, v.id)),
    p.rng,
  )
    .sort((a, b) => prio(a) - prio(b) || ordenGrupo(a) - ordenGrupo(b))
    .slice(0, Math.max(0, Math.min(p.nuevos, Math.floor(tam / 2))))
    .map((v): ItemHoy => ({ verboId: v.id, tipo: 'nuevo' }));

  const base = [...repasos, ...aprendiendo].slice(0, Math.max(0, tam - nuevos.length * 2));
  if (!base.length && !nuevos.length) return [];

  // Por bloques de grupo, para que la cuadrícula cambie lo menos posible: primero
  // los grupos sin nuevos (por urgencia), después los que tienen nuevos (en el
  // orden del curso), cada uno con sus nuevos intercalados.
  const grupoDe = new Map(p.disponibles.map((v) => [v.id, v.grupo]));
  const bloques = new Map<string, { base: ItemHoy[]; nuevos: ItemHoy[] }>();
  const bloque = (id: string) => {
    const g = grupoDe.get(id) ?? '';
    if (!bloques.has(g)) bloques.set(g, { base: [], nuevos: [] });
    return bloques.get(g)!;
  };
  for (const item of base) bloque(item.verboId).base.push(item);
  for (const item of nuevos) bloque(item.verboId).nuevos.push(item);
  const ordenBloque = ([g, b]: [string, { nuevos: ItemHoy[] }]) => {
    if (!b.nuevos.length) return -1;
    const i = p.ordenGrupos.indexOf(g);
    return i === -1 ? p.ordenGrupos.length : i;
  };
  const ordenados = [...bloques.entries()].sort((a, b) => ordenBloque(a) - ordenBloque(b));
  return ordenados.flatMap(([, b]) => intercalar(b.base, b.nuevos));
}

/**
 * Tres de calentamiento, luego un nuevo cada `cada` elementos; la segunda
 * aparición de cada nuevo, tres elementos después (o al final del bloque).
 */
function intercalar(base: readonly ItemHoy[], nuevos: readonly ItemHoy[]): ItemHoy[] {
  const salida: ItemHoy[] = base.slice(0, 3);
  const resto = base.slice(3);
  const cada = nuevos.length ? Math.max(1, Math.floor(resto.length / nuevos.length)) : 0;
  const segundas: { item: ItemHoy; faltan: number }[] = [];
  const meter = (item: ItemHoy) => {
    salida.push(item);
    for (const s of segundas) s.faltan--;
    while (segundas.length && segundas[0].faltan <= 0) salida.push(segundas.shift()!.item);
  };
  for (const n of nuevos) {
    for (let i = 0; i < cada && resto.length; i++) meter(resto.shift()!);
    meter(n);
    segundas.push({ item: { ...n }, faltan: 3 });
  }
  while (resto.length) meter(resto.shift()!);
  for (const s of segundas) salida.push(s.item);
  return salida;
}

/** Repaso adelantado (cuando Hoy ya está hecho): aprendidos que vencen antes. */
export function repasoAdelantado(estado: EstadoProgreso, disponibles: readonly Verbo[], n = 10): ItemHoy[] {
  return disponibles
    .filter((v) => aprendido(estado, v.id) && estado.tarjetas[v.id])
    .sort((a, b) => new Date(estado.tarjetas[a.id].due).getTime() - new Date(estado.tarjetas[b.id].due).getTime())
    .slice(0, n)
    .map((v) => ({ verboId: v.id, tipo: 'repaso' }));
}

/**
 * Tipo de pregunta en Hoy: los verbos en aprendizaje, el de su escalón
 * (Emparejar se pregunta como Al revés, que es su versión suelta); los
 * aprendidos, variado: Tabla muda, Completar o Al revés (más Tabla muda
 * cuanto más estable).
 */
export function modoHoy(estado: EstadoProgreso, verboId: string, rng: Rng): ModoId {
  const escalon = escalonDe(estado, verboId);
  if (escalon) return escalon === 'emparejar' ? 'alreves' : escalon;
  const estable = (estado.tarjetas[verboId]?.stability ?? 0) >= CONFIG.estabilidadDominado;
  const r = rng();
  if (estable) return r < 0.5 ? 'tablamuda' : r < 0.75 ? 'completar' : 'alreves';
  return r < 0.3 ? 'tablamuda' : r < 0.7 ? 'completar' : 'alreves';
}

/**
 * Cola de la sesión de Hoy. Como ColaRonda (lo fallado vuelve a salir unas
 * preguntas después), pero sin cambiar de grupo: el reintento se queda en el
 * bloque de su grupo; si el bloque se acaba, va tras la última pregunta de ese
 * grupo o, si no hay más, al final.
 */
export class ColaHoy {
  private cola: { id: string; grupo: string }[];
  private fallados = new Set<string>();
  private readonly total: number;
  private fallos = 0;

  constructor(
    items: readonly { id: string; grupo: string }[],
    private readonly hueco = 3,
  ) {
    this.cola = [...items];
    this.total = items.length;
  }

  actual(): string | null {
    return this.cola[0]?.id ?? null;
  }

  pendientes(): number {
    return this.cola.length;
  }

  responder(resultado: Resultado): { recuperado: boolean } {
    const item = this.cola.shift();
    if (!item) throw new Error('La sesión ya ha terminado');
    if (resultado === 'acierto') return { recuperado: this.fallados.has(item.id) };
    if (resultado === 'fallo') {
      this.fallos++;
      this.fallados.add(item.id);
    }
    let bloque = 0;
    while (bloque < this.cola.length && this.cola[bloque].grupo === item.grupo) bloque++;
    let pos: number;
    if (bloque > 0) pos = Math.min(this.hueco, bloque);
    else {
      const ultima = this.cola.map((x) => x.grupo).lastIndexOf(item.grupo);
      pos = ultima === -1 ? this.cola.length : ultima + 1;
    }
    this.cola.splice(pos, 0, item);
    return { recuperado: false };
  }

  resumen(): ResumenRonda {
    return { total: this.total, aLaPrimera: this.total - this.fallados.size, fallos: this.fallos };
  }
}
