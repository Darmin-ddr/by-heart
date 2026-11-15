import type { Verbo } from './types';

/**
 * Corrección de las formas escritas de un verbo (SPEC 3.3): en inglés la
 * ortografía es justo lo que se examina, así que tiene que ser exacta. Solo se
 * perdonan mayúsculas y espacios de más, y el "to" delante del infinitivo.
 *
 * Una sola letra de diferencia es un "casi": cuenta como fallo, pero se dice
 * con más suavidad y señalando la letra.
 */

export type EstadoForma = 'bien' | 'casi' | 'mal' | 'vacia';

/** En qué se diferencia un "casi" de la forma correcta. */
export type TipoCasi = 'cambia' | 'falta' | 'sobra' | 'orden';

export interface CorreccionForma {
  estado: EstadoForma;
  /** La forma que se enseña como correcta. */
  correcta: string;
  /** En un "casi": qué ha pasado y qué letras de `correcta` señalar ([inicio, fin), o null si sobraba una). */
  casi?: { tipo: TipoCasi; marca: [number, number] | null };
}

function normalizar(texto: string): string {
  return texto.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Si `escrito` está a una sola letra de `correcta` (cambiada, de más, de menos o dos seguidas cruzadas), dice cómo. */
export function diferenciaDeUna(escrito: string, correcta: string): CorreccionForma['casi'] | null {
  const a = escrito;
  const b = correcta;
  if (a === b || Math.abs(a.length - b.length) > 1) return null;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return { tipo: 'cambia', marca: [i, i + 1] };
    if (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)) return { tipo: 'orden', marca: [i, i + 2] };
    return null;
  }
  if (a.length < b.length) return a.slice(i) === b.slice(i + 1) ? { tipo: 'falta', marca: [i, i + 1] } : null;
  return a.slice(i + 1) === b.slice(i) ? { tipo: 'sobra', marca: null } : null;
}

/** Formas dobles del listado ("was / were"): hay que escribir las dos, en cualquier orden. */
const esDoble = (forma: string) => forma.includes('/');
const partesDe = (forma: string) =>
  forma
    .split(/[/,;]|\s+(?:y|o|and|or)\s+|\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .sort();

/**
 * Corrige una forma escrita. `aceptadas` son la forma del listado (la primera,
 * que es la que se enseña) y sus variantes válidas (learnt / learned).
 */
export function corregirForma(escrito: string, aceptadas: readonly string[], esInfinitivo = false): CorreccionForma {
  const principal = aceptadas[0];
  let texto = normalizar(escrito);
  if (esInfinitivo) texto = texto.replace(/^to /, '');
  if (!texto) return { estado: 'vacia', correcta: principal };
  for (const forma of aceptadas) {
    const f = normalizar(forma);
    if (texto === f) return { estado: 'bien', correcta: principal };
    if (esDoble(f) && partesDe(texto).join(' ') === partesDe(f).join(' ')) return { estado: 'bien', correcta: principal };
  }
  for (const forma of aceptadas) {
    const f = normalizar(forma);
    if (esDoble(f)) continue;
    const casi = diferenciaDeUna(texto, f);
    if (casi) return { estado: 'casi', correcta: forma, casi };
  }
  return { estado: 'mal', correcta: principal };
}

export interface RespuestaVerbo {
  /** Solo en Tabla muda (en Completar el infinitivo se da). */
  infinitivo?: string;
  pasado: string;
  participio: string;
}

export interface CorreccionVerbo {
  infinitivo?: CorreccionForma;
  pasado: CorreccionForma;
  participio: CorreccionForma;
  /** Todas las formas pedidas, bien. */
  acierto: boolean;
  /** No hay acierto, pero lo único que falla son "casi" (una letra). */
  casi: boolean;
}

export function corregirVerbo(verbo: Verbo, r: RespuestaVerbo): CorreccionVerbo {
  const infinitivo = r.infinitivo === undefined ? undefined : corregirForma(r.infinitivo, [verbo.infinitivo], true);
  const pasado = corregirForma(r.pasado, [verbo.pasado, ...verbo.variantesPasado]);
  const participio = corregirForma(r.participio, [verbo.participio, ...verbo.variantesParticipio]);
  const todas = [infinitivo, pasado, participio].filter((c): c is CorreccionForma => c !== undefined);
  const acierto = todas.every((c) => c.estado === 'bien');
  const casi = !acierto && todas.every((c) => c.estado === 'bien' || c.estado === 'casi');
  return { ...(infinitivo ? { infinitivo } : {}), pasado, participio, acierto, casi };
}
