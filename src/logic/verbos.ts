import type { Grupo, Pais, Region, Verbo } from './types';

/**
 * Puente entre los verbos y la lógica heredada de Capitalia, que trabaja con
 * "países" y "regiones". Es provisional: desaparece cuando esa lógica se pase a
 * verbos. Mientras, un verbo es un país cuyo nombre es el infinitivo y cuya
 * capital son sus formas, y un grupo es una región.
 */

const SEPARADOR = ' · ';

/** Pasado y participio juntos, como se enseñan en las opciones y en la cuadrícula. */
export function formasDe(v: Pick<Verbo, 'pasado' | 'participio'>): string {
  return `${v.pasado}${SEPARADOR}${v.participio}`;
}

export function verboComoPais(v: Verbo): Pais {
  return {
    id: v.id,
    isoNumerico: null,
    nombre: v.infinitivo,
    capital: formasDe(v),
    significado: v.significado,
    variantes: [],
    antiguos: [],
    // La lógica heredada reparte las regiones en continentes; aquí hay uno solo y no se enseña.
    continentes: ['europa'],
    region: v.grupo,
    capitalCoords: [0, 0],
    opcional: false,
    ...(v.nota ? { nota: v.nota } : {}),
    trucos: v.trucos,
  };
}

export function grupoComoRegion(g: Grupo): Region {
  return { id: g.id, nombre: g.nombre, continente: 'europa', orden: g.orden, color: g.color };
}
