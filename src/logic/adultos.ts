import { nivelCasilla, type EstadoProgreso } from './progreso';
import type { Verbo } from './types';

/* ---------------- PIN ---------------- */

/** El PIN es una cerradura para niños, no seguridad real (SPEC 8): todo es local. */
export function pinValido(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

/** Hash del PIN (SHA-256 si el navegador lo permite; si no, un hash sencillo). */
export async function hashPin(pin: string): Promise<string> {
  const texto = `byheart-progreso:${pin}`;
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const datos = await subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return 'sha256:' + [...new Uint8Array(datos)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Sin crypto.subtle (página sin HTTPS): FNV-1a, suficiente para una cerradura de niños.
  let h = 0x811c9dc5;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0;
  return 'fnv:' + h.toString(16);
}

export async function comprobarPin(pin: string, hash: string | null): Promise<boolean> {
  return hash !== null && (await hashPin(pin)) === hash;
}

/* ---------------- Estadísticas ---------------- */

/** Verbos por nivel de la cuadrícula: [sin empezar, Elegir o Emparejar, Completar o Tabla muda, aprendidos]. */
export function verbosPorNivel(estado: EstadoProgreso, verbos: readonly Verbo[]): [number, number, number, number] {
  const porNivel: [number, number, number, number] = [0, 0, 0, 0];
  for (const v of verbos) porNivel[nivelCasilla(estado, v.id)]++;
  return porNivel;
}

export interface VerboAtascado {
  verbo: Verbo;
  fallos: number;
  intentos: number;
}

/** Verbos que más se atascan: más fallos (en los últimos `dias`), y luego más olvidos FSRS. */
export function verbosAtascados(estado: EstadoProgreso, verbos: readonly Verbo[], ahora: Date, dias = 30, max = 8): VerboAtascado[] {
  const desde = ahora.getTime() - dias * 86400000;
  const cuenta = new Map<string, { fallos: number; intentos: number }>();
  for (const r of estado.historial) {
    if (new Date(r.t).getTime() < desde) continue;
    const c = cuenta.get(r.verbo) ?? { fallos: 0, intentos: 0 };
    c.intentos++;
    if (r.res === 'fallo') c.fallos++;
    cuenta.set(r.verbo, c);
  }
  return verbos
    .map((verbo) => ({ verbo, ...(cuenta.get(verbo.id) ?? { fallos: 0, intentos: 0 }), olvidos: estado.tarjetas[verbo.id]?.lapses ?? 0 }))
    .filter((x) => x.fallos > 0)
    .sort((a, b) => b.fallos - a.fallos || b.olvidos - a.olvidos || a.verbo.infinitivo.localeCompare(b.verbo.infinitivo, 'en'))
    .slice(0, max)
    .map(({ verbo, fallos, intentos }) => ({ verbo, fallos, intentos }));
}

export interface ActividadDia {
  /** AAAA-MM-DD (hora local) */
  dia: string;
  respuestas: number;
  aciertos: number;
}

function diaLocal(fecha: Date): string {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${z(fecha.getMonth() + 1)}-${z(fecha.getDate())}`;
}

/** Respuestas por día en los últimos `dias` días (incluido hoy), del más antiguo al más reciente. */
export function actividadReciente(estado: EstadoProgreso, ahora: Date, dias = 14): ActividadDia[] {
  const resultado: ActividadDia[] = [];
  const indice = new Map<string, ActividadDia>();
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - i);
    const dia = { dia: diaLocal(d), respuestas: 0, aciertos: 0 };
    resultado.push(dia);
    indice.set(dia.dia, dia);
  }
  for (const r of estado.historial) {
    const d = indice.get(diaLocal(new Date(r.t)));
    if (!d) continue;
    d.respuestas++;
    if (r.res !== 'fallo') d.aciertos++;
  }
  return resultado;
}

/* ---------------- Examen ---------------- */

/** Días que faltan para el examen (0 = hoy; negativo = ya pasó). null si no hay fecha. */
export function diasHastaExamen(fechaExamen: string | null, ahora: Date): number | null {
  if (!fechaExamen) return null;
  const [a, m, d] = fechaExamen.split('-').map(Number);
  const examen = new Date(a, m - 1, d).getTime();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  return Math.round((examen - hoy) / 86400000);
}


/* ---------------- Casillas de la lista de examen ---------------- */

/** Estado de una casilla que marca varios verbos a la vez (todos), según los verbos marcados. */
export type EstadoMarcado = 'todos' | 'ninguno' | 'parcial';

export function estadoMarcado(ids: readonly string[], seleccion: ReadonlySet<string>): EstadoMarcado {
  const marcados = ids.filter((id) => seleccion.has(id)).length;
  if (ids.length > 0 && marcados === ids.length) return 'todos';
  return marcados === 0 ? 'ninguno' : 'parcial';
}

/** Marca o desmarca de golpe varios verbos. Devuelve la selección nueva. */
export function marcarVarios(ids: readonly string[], seleccion: ReadonlySet<string>, marcar: boolean): Set<string> {
  const nueva = new Set(seleccion);
  for (const id of ids) {
    if (marcar) nueva.add(id);
    else nueva.delete(id);
  }
  return nueva;
}