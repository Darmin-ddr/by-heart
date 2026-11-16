import type { Verbo } from '../src/logic/types';

/** Verbo de prueba: inventado (sus formas salen de su id), para probar la lógica sin depender del listado. */
export function verbo(id: string, formas: Partial<Pick<Verbo, 'infinitivo' | 'pasado' | 'participio' | 'significado'>> = {}): Verbo {
  return {
    id,
    infinitivo: id,
    pasado: `${id}-pasado`,
    participio: `${id}-participio`,
    variantesPasado: [],
    variantesParticipio: [],
    significado: `significado de ${id}`,
    variantesSignificado: [],
    trucos: [],
    ...formas,
  };
}
