import type { Verbo } from '../logic/types';
import type { Nivel } from '../logic/progreso';
import { Cuadricula } from './cuadricula';

/**
 * El tablero es donde se ve el progreso y donde se señala el verbo por el que
 * se pregunta: la cuadrícula de verbos (SPEC 10, `cuadricula.ts`). Las
 * pantallas solo conocen este contrato.
 */

export type EstadoCasilla = 'objetivo' | 'acierto' | 'fallo' | 'seleccion';

export interface OpcionesTablero {
  contenedor: HTMLElement;
  /** Verbos que se enseñan (y que se pueden tocar cuando el tablero es interactivo). */
  verbos: readonly Verbo[];
  /** Color pastel de cada verbo (el de su grupo). */
  colorDe?: (id: string) => string;
  alTocar?: (id: string) => void;
}

export interface Tablero {
  destruir(): void;
  /** Activa o desactiva los toques. */
  setInteractivo(valor: boolean): void;
  setEstado(id: string, estado: EstadoCasilla | null): void;
  limpiarEstados(): void;
  /** Colorea cada verbo según su progreso. */
  setNiveles(niveles: ReadonlyMap<string, Nivel>): void;
  /** Enseña el pasado y el participio de un verbo (o los oculta con null). */
  mostrarFormas(id: string | null): void;
  /** Esconde los infinitivos (Tabla muda), salvo el del verbo cuyas formas se enseñen. */
  setMudo(valor: boolean): void;
}

/** El tablero de la app: la cuadrícula de verbos. Sin verbos que enseñar, no hay tablero. */
export function crearTablero(opciones: OpcionesTablero): Tablero | null {
  return opciones.verbos.length ? new Cuadricula(opciones) : null;
}
