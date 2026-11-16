import { barajar, type Rng } from './rng';

/**
 * Cómo ha ido una respuesta:
 * - acierto: el verbo sale de la ronda.
 * - fallo: vuelve a salir unas preguntas después.
 * - repasar: medio punto en el examen. No es fallo, pero cuenta como
 *   "repasar" para la planificación.
 */
export type Resultado = 'acierto' | 'fallo' | 'repasar';

export interface ResultadoRespuesta {
  /** Acierto en un verbo que se había fallado antes en esta ronda (momento de celebrar). */
  recuperado: boolean;
  /** La ronda ha terminado: todos los verbos se han acertado una vez. */
  terminada: boolean;
}

export interface ResumenRonda {
  total: number;
  aLaPrimera: number;
  fallos: number;
}

/**
 * Cola de una ronda. Cada verbo sale hasta que se acierta una vez.
 * Lo fallado vuelve a salir unas preguntas después (no inmediatamente, si
 * quedan otros verbos), para que el alumno tenga otra oportunidad pronto.

 */
export class ColaRonda {
  private cola: string[];
  private fallados = new Set<string>();
  private readonly total: number;
  private fallos = 0;

  constructor(
    ids: readonly string[],
    rng: Rng,
    /** Cuántas preguntas después vuelve a salir un fallo. */
    private readonly huecoTrasFallo = 3,
  ) {
    this.cola = barajar(ids, rng);
    this.total = this.cola.length;
  }

  /** Verbo de la pregunta actual, o null si la ronda ha terminado. */
  actual(): string | null {
    return this.cola[0] ?? null;
  }

  /** Verbos que faltan por acertar (incluido el actual). */
  pendientes(): number {
    return this.cola.length;
  }

  responder(resultado: Resultado): ResultadoRespuesta {
    const id = this.cola.shift();
    if (id === undefined) throw new Error('La ronda ya ha terminado');

    if (resultado === 'acierto') {
      return { recuperado: this.fallados.has(id), terminada: this.cola.length === 0 };
    }

    if (resultado === 'fallo') {
      this.fallos++;
      this.fallados.add(id);
    }
    const posicion = Math.min(this.huecoTrasFallo, this.cola.length);
    this.cola.splice(posicion, 0, id);
    return { recuperado: false, terminada: false };
  }

  resumen(): ResumenRonda {
    return { total: this.total, aLaPrimera: this.total - this.fallados.size, fallos: this.fallos };
  }
}
