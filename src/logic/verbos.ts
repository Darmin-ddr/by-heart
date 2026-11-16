import type { Grupo, Verbo } from './types';

const SEPARADOR = ' · ';

/** Pasado y participio juntos, como se enseñan en las opciones y en la cuadrícula. */
export function formasDe(v: Pick<Verbo, 'pasado' | 'participio'>): string {
  return `${v.pasado}${SEPARADOR}${v.participio}`;
}

/** Las tres formas: "buy · bought · bought". */
export function tresFormas(v: Pick<Verbo, 'infinitivo' | 'pasado' | 'participio'>): string {
  return `${v.infinitivo}${SEPARADOR}${formasDe(v)}`;
}

export function verbosDeGrupo(verbos: readonly Verbo[], grupoId: string): Verbo[] {
  return verbos.filter((v) => v.grupo === grupoId);
}

/** Grupos en el orden del curso (SPEC 7). */
export function ordenCurso(grupos: readonly Grupo[]): Grupo[] {
  return [...grupos].sort((a, b) => a.orden - b.orden);
}
