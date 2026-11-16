import type { Verbo } from './types';

const SEPARADOR = ' · ';

/** Pasado y participio juntos, como se enseñan en las opciones y en la cuadrícula. */
export function formasDe(v: Pick<Verbo, 'pasado' | 'participio'>): string {
  return `${v.pasado}${SEPARADOR}${v.participio}`;
}

/** Las tres formas: "buy · bought · bought". */
export function tresFormas(v: Pick<Verbo, 'infinitivo' | 'pasado' | 'participio'>): string {
  return `${v.infinitivo}${SEPARADOR}${formasDe(v)}`;
}

