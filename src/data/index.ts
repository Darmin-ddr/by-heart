import datos from './verbs.json';
import gruposJson from './groups.json';
import type { Grupo, Pais, Region, Verbo } from '../logic/types';
import { grupoComoRegion, verboComoPais } from '../logic/verbos';

/**
 * Contenido de la app. De momento, un grupo de muestra (docs/listas/README.md);
 * el listado de clase lo sustituirá.
 */
export const verbos = datos.verbos as unknown as Verbo[];
export const grupos = gruposJson as Grupo[];

const porId = new Map(verbos.map((v) => [v.id, v]));
/** El verbo con ese id, con sus formas por separado. */
export const verboDe = (id: string): Verbo | undefined => porId.get(id);

/** Los verbos y los grupos, con la forma que espera la lógica heredada de Capitalia. */
export const paises: Pais[] = verbos.map(verboComoPais);
export const regiones: Region[] = grupos.map(grupoComoRegion);
