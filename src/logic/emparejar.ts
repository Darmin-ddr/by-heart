import { barajar, type Rng } from './rng';
import type { ResumenRonda } from './sesion';

export interface ResultadoEmparejar {
  acierto: boolean;
  /** Acierto de unas formas que se habían emparejado mal antes en esta ronda. */
  recuperado: boolean;
  /** Se ha vaciado la tanda (y, si quedan, ya hay otra preparada). */
  tandaTerminada: boolean;
  rondaTerminada: boolean;
}

/**
 * Ronda de Emparejar (SPEC 4.2): tandas de formas (pasado y participio) que hay
 * que unir con su verbo. Unas formas mal emparejadas salen de la tanda y vuelven
 * en una tanda posterior. Los ids son los de los verbos: las formas del verbo X
 * están bien emparejadas si se toca el verbo X.
 */
export class RondaEmparejar {
  private pendientes: string[];
  private tandaActual: string[] = [];
  private fallados = new Set<string>();
  private readonly total: number;
  private fallos = 0;
  private numTanda = 0;

  constructor(
    ids: readonly string[],
    rng: Rng,
    private readonly tamTanda = 5,
  ) {
    this.pendientes = barajar(ids, rng);
    this.total = ids.length;
    this.nuevaTanda();
  }

  /** Formas (ids de verbo) de la tanda en curso, en orden de presentación. */
  tanda(): readonly string[] {
    return this.tandaActual;
  }

  /** Número de la tanda en curso (empieza en 1). */
  numeroTanda(): number {
    return this.numTanda;
  }

  terminada(): boolean {
    return this.tandaActual.length === 0 && this.pendientes.length === 0;
  }

  /** Unir las formas del verbo `formasDe` con el verbo `verboTocado`. */
  emparejar(formasDe: string, verboTocado: string): ResultadoEmparejar {
    const i = this.tandaActual.indexOf(formasDe);
    if (i === -1) throw new Error(`Las formas de ${formasDe} no están en la tanda`);
    this.tandaActual.splice(i, 1);

    const acierto = formasDe === verboTocado;
    const recuperado = acierto && this.fallados.has(formasDe);
    if (!acierto) {
      this.fallos++;
      this.fallados.add(formasDe);
      this.pendientes.push(formasDe);
    }

    const tandaTerminada = this.tandaActual.length === 0;
    if (tandaTerminada) this.nuevaTanda();
    return { acierto, recuperado, tandaTerminada, rondaTerminada: this.terminada() };
  }

  resumen(): ResumenRonda {
    return { total: this.total, aLaPrimera: this.total - this.fallados.size, fallos: this.fallos };
  }

  private nuevaTanda(): void {
    if (this.pendientes.length === 0) return;
    this.tandaActual = this.pendientes.splice(0, this.tamTanda);
    this.numTanda++;
  }
}
