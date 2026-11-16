import type { Verbo } from './types';
import { barajar, type Rng } from './rng';

export interface PreguntaOpciones {
  verboId: string;
  /** Infinitivos. */
  opciones: string[];
  /** Índice de la opción correcta dentro de `opciones`. */
  correcta: number;
}

/** Distancia de edición entre dos palabras (cuántas letras hay que cambiar, quitar o poner). */
export function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const arriba = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = arriba;
    }
  }
  return fila[b.length];
}

/**
 * Pregunta de Elegir (SPEC 4.2): se da el significado y hay que reconocer el
 * verbo entre cuatro infinitivos. Los distractores son otros verbos del
 * listado, preferentemente de los que más se parecen al correcto (read: ride,
 * lead...), para que no se acierte por descarte.
 */
export function crearPreguntaOpciones(objetivo: Verbo, candidatos: readonly Verbo[], rng: Rng, numOpciones = 4): PreguntaOpciones {
  const otros = candidatos.filter((v) => v.id !== objetivo.id && v.infinitivo !== objetivo.infinitivo);
  // Los más parecidos (al azar entre los empatados) y, de entre los ocho primeros, tres al azar.
  const parecidos = barajar(otros, rng)
    .map((v) => ({ v, d: distancia(v.infinitivo, objetivo.infinitivo) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 8)
    .map((x) => x.v);
  const distractores = barajar(parecidos, rng)
    .slice(0, numOpciones - 1)
    .map((v) => v.infinitivo);
  const opciones = barajar([objetivo.infinitivo, ...distractores], rng);
  return { verboId: objetivo.id, opciones, correcta: opciones.indexOf(objetivo.infinitivo) };
}
