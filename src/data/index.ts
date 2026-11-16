import datos from './verbs.json';
import type { Verbo } from '../logic/types';

/** Los verbos del listado (docs/listas/), en su orden. */
export const verbos = datos.verbos as unknown as Verbo[];
