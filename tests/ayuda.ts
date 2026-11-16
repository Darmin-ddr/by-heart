import type { Verbo } from '../src/logic/types';

/**
 * Verbo de prueba. Por defecto, inventado (sus formas son su id) y en el grupo
 * "g1": para probar la lógica sin depender del listado de clase.
 */
export function verbo(id: string, grupo = 'g1', formas: Partial<Pick<Verbo, 'infinitivo' | 'pasado' | 'participio' | 'significado'>> = {}): Verbo {
  return {
    id,
    infinitivo: id,
    pasado: `${id}-pasado`,
    participio: `${id}-participio`,
    variantesPasado: [],
    variantesParticipio: [],
    significado: `significado de ${id}`,
    variantesSignificado: [],
    grupo,
    trucos: [],
    ...formas,
  };
}
