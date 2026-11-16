import type { Verbo } from './types';

const SEPARADOR = ' · ';

/** Pasado y participio juntos, como se enseñan en las opciones y en la cuadrícula. */
export function formasDe(v: Pick<Verbo, 'pasado' | 'participio'>): string {
  return `${v.pasado}${SEPARADOR}${v.participio}`;
}

/** Una forma partida en tres: lo que comparte con el infinitivo al principio y al final, y lo que cambia en medio. */
export interface PartesForma {
  antes: string;
  cambio: string;
  despues: string;
}

/**
 * Lo que cambia de una forma respecto al infinitivo, para resaltarlo en
 * Explorar: sing → s·a·ng; buy → b·ought; begin → beg·u·n; cut → (nada).
 * Se quedan fuera el principio y el final que coinciden con el infinitivo.
 */
export function partesQueCambian(infinitivo: string, forma: string): PartesForma {
  let i = 0;
  while (i < infinitivo.length && i < forma.length && infinitivo[i] === forma[i]) i++;
  // Si no comparten el principio, son palabras distintas (be → was): una letra final igual sería casualidad.
  let j = 0;
  while (i > 0 && j < infinitivo.length - i && j < forma.length - i && infinitivo[infinitivo.length - 1 - j] === forma[forma.length - 1 - j]) j++;
  return { antes: forma.slice(0, i), cambio: forma.slice(i, forma.length - j), despues: forma.slice(forma.length - j) };
}

/** Las tres formas: "buy · bought · bought". */
export function tresFormas(v: Pick<Verbo, 'infinitivo' | 'pasado' | 'participio'>): string {
  return `${v.infinitivo}${SEPARADOR}${formasDe(v)}`;
}

