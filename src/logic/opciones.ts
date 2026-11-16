import type { Verbo } from './types';
import { barajar, type Rng } from './rng';
import { formasDe } from './verbos';

export interface PreguntaOpciones {
  verboId: string;
  opciones: string[];
  /** Índice de la opción correcta dentro de `opciones`. */
  correcta: number;
}

/**
 * Pregunta de Elegir (SPEC 4.2): el pasado y el participio correctos y tres
 * distractores, que son siempre formas reales de otros verbos (nunca
 * inventadas), preferentemente del mismo grupo. Nunca repite una opción.
 */
export function crearPreguntaOpciones(objetivo: Verbo, candidatos: readonly Verbo[], rng: Rng, numOpciones = 4): PreguntaOpciones {
  const correcta = formasDe(objetivo);
  const usadas = new Set([correcta]);
  const distractores: string[] = [];

  const otros = candidatos.filter((v) => v.id !== objetivo.id);
  const mismoGrupo = barajar(otros.filter((v) => v.grupo === objetivo.grupo), rng);
  const resto = barajar(otros.filter((v) => v.grupo !== objetivo.grupo), rng);

  for (const v of [...mismoGrupo, ...resto]) {
    if (distractores.length >= numOpciones - 1) break;
    const formas = formasDe(v);
    if (usadas.has(formas)) continue;
    usadas.add(formas);
    distractores.push(formas);
  }

  const opciones = barajar([correcta, ...distractores], rng);
  return { verboId: objetivo.id, opciones, correcta: opciones.indexOf(correcta) };
}
