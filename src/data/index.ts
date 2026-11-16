import datos from './verbs.json';
import gruposJson from './groups.json';
import type { Grupo, Verbo } from '../logic/types';

/** Los verbos del listado de clase (docs/listas/) y sus grupos por patrón. */
export const verbos = datos.verbos as unknown as Verbo[];
export const grupos = gruposJson as Grupo[];
