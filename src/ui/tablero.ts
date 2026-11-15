import type { Pais } from '../logic/types';
import type { Nivel } from '../logic/progreso';
import { Cuadricula } from './cuadricula';

/**
 * El tablero es lo que ocupa el sitio del mapa de Capitalia: donde se ve el
 * progreso y donde se señala aquello por lo que se pregunta. En By Heart es la
 * cuadrícula de verbos (SPEC 10, `cuadricula.ts`).
 *
 * Las pantallas heredadas de Capitalia solo conocen este contrato. Los nombres
 * (país, capital) son los suyos: aquí "país" es un verbo y "capital", sus formas.
 */

export type EstadoPais = 'objetivo' | 'acierto' | 'fallo' | 'seleccion';

export interface OpcionesTablero {
  contenedor: HTMLElement;
  /** Elementos en juego: los que se pueden tocar. */
  region: readonly Pais[];
  /** Otros elementos con progreso visible, no tocables. */
  contexto?: readonly Pais[];
  /** Color pastel de cada elemento (el de su grupo). */
  colorDe?: (id: string) => string;
  onSeleccion?: (id: string) => void;
}

export interface Tablero {
  destruir(): void;
  /** Activa o desactiva los toques. */
  setInteractivo(valor: boolean): void;
  setEstado(id: string, estado: EstadoPais | null): void;
  limpiarEstados(): void;
  /** Colorea cada elemento según su progreso. */
  setNiveles(niveles: ReadonlyMap<string, Nivel>): void;
  /** Enseña la respuesta de un elemento (o la oculta con null). */
  mostrarCapital(id: string | null, conNombre?: boolean): void;
  /** Lleva la vista a un elemento (o la deja como estaba con null). */
  enfocar(id: string | null): void;
  /** Marca los elementos por los que se va a preguntar en un examen. */
  mostrarEstrellas(ids: readonly string[]): void;
}

/** El tablero de la app: la cuadrícula de verbos. Sin verbos que enseñar, no hay tablero. */
export function crearTablero(opciones: OpcionesTablero): Tablero | null {
  return opciones.region.length ? new Cuadricula(opciones) : null;
}
