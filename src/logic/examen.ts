import { barajar, type Rng } from './rng';
import type { Resultado } from './sesion';
import { corregirVerbo, type CorreccionVerbo, type RespuestaVerbo } from './formas';
import type { Verbo } from './types';

/**
 * Examen de prueba (SPEC 4.4): una tabla de verbos con huecos, como la de
 * clase. En cada fila se da el infinitivo (y hay que escribir el pasado y el
 * participio) o el significado (y hay que escribir las tres formas). Nunca se
 * da el pasado ni el participio: varios verbos podrían compartirlos. Lógica pura.
 */

/** Qué entra: todos los verbos, la lista del examen del panel o un grupo (por su id). */
export type AmbitoExamen = 'todo' | 'lista' | { grupo: string };

export function verbosDeAmbito(ambito: AmbitoExamen, verbos: readonly Verbo[], lista: readonly string[] | null): Verbo[] {
  if (ambito === 'lista') return verbos.filter((v) => lista?.includes(v.id));
  if (ambito === 'todo') return [...verbos];
  return verbos.filter((v) => v.grupo === ambito.grupo);
}

export type Dato = 'infinitivo' | 'significado';

export interface FilaExamen {
  verboId: string;
  /** Lo que da la tabla; el resto de las formas se escriben. */
  dato: Dato;
}

/** Filas del examen: `n` verbos al azar (todos si n es null), con el dato repartido más o menos a medias. */
export function prepararExamen(verbos: readonly Verbo[], n: number | null, rng: Rng): FilaExamen[] {
  const ids = barajar(
    verbos.map((v) => v.id),
    rng,
  );
  const elegidos = n === null ? ids : ids.slice(0, n);
  const datos = barajar(
    elegidos.map((_, i): Dato => (i % 2 ? 'significado' : 'infinitivo')),
    rng,
  );
  return elegidos.map((verboId, i) => ({ verboId, dato: datos[i] }));
}

export interface CorreccionFila {
  correccion: CorreccionVerbo;
  /** Casillas que había que escribir y cuántas están mal (un "casi" cuenta como mal: la ortografía es exacta). */
  casillas: number;
  mal: number;
  /** 1 todo bien; 0,5 si falla una sola casilla; 0 si fallan más (SPEC 4.4, por confirmar). */
  puntos: number;
  /** Para la planificación (SPEC 4.4): 1 punto → acierto; medio → repasar (Hard); 0 → fallo. */
  resultado: Resultado;
}

export function corregirFila(verbo: Verbo, fila: FilaExamen, respuesta: RespuestaVerbo): CorreccionFila {
  const correccion = corregirVerbo(verbo, fila.dato === 'significado' ? respuesta : { pasado: respuesta.pasado, participio: respuesta.participio });
  const pedidas = [correccion.infinitivo, correccion.pasado, correccion.participio].filter((c) => c !== undefined);
  const mal = pedidas.filter((c) => c.estado !== 'bien').length;
  const puntos = mal === 0 ? 1 : mal === 1 ? 0.5 : 0;
  return { correccion, casillas: pedidas.length, mal, puntos, resultado: puntos === 1 ? 'acierto' : puntos === 0.5 ? 'repasar' : 'fallo' };
}

/** Nota sobre 10, con un decimal. */
export function notaExamen(puntos: readonly number[]): number {
  if (!puntos.length) return 0;
  const suma = puntos.reduce((s, x) => s + x, 0);
  return Math.round((suma / puntos.length) * 100) / 10;
}
