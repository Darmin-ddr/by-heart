import type { Pais } from '../logic/types';
import type { Nivel } from '../logic/progreso';

/**
 * El tablero es lo que ocupa el sitio del mapa de Capitalia: donde se ve el
 * progreso y donde se señala aquello por lo que se pregunta. En By Heart será la
 * cuadrícula de verbos (SPEC 10), que llega en el hito 1.
 *
 * De momento solo existe el contrato: las pantallas heredadas de Capitalia
 * (Hoy, Aprender, Examen, Explorar) lo usan, pero no hay nada que lo cumpla, así
 * que `crearTablero` devuelve null y la app enseña el aviso de "sin contenido".
 * Los nombres (país, capital) son los de Capitalia y se cambiarán con los datos.
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

/** Hito 1: aquí se creará la cuadrícula de verbos. */
export function crearTablero(_opciones: OpcionesTablero): Tablero | null {
  return null;
}
