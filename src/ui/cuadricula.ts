import type { Nivel } from '../logic/progreso';
import { formasDe } from '../logic/verbos';
import { el, formaResaltada } from './dom';
import type { EstadoCasilla, OpcionesTablero, Tablero } from './tablero';

const ESTADOS: EstadoCasilla[] = ['objetivo', 'acierto', 'fallo', 'seleccion'];

/**
 * La cuadrícula de verbos (SPEC 10): una casilla por verbo, que se colorea a
 * medida que el verbo sube de escalón. Es el marcador de progreso y el sitio
 * donde se señala el verbo por el que se pregunta.
 */
export class Cuadricula implements Tablero {
  private readonly raiz: HTMLElement;
  private readonly casillas = new Map<string, HTMLButtonElement>();
  private interactivo = false;
  private revelada: string | null = null;

  constructor(private readonly op: OpcionesTablero) {
    this.raiz = el('div', 'cuadricula');
    this.raiz.setAttribute('role', 'group');
    this.raiz.setAttribute('aria-label', 'Verbos');
    this.raiz.classList.toggle('con-formas', Boolean(op.conFormas));
    for (const v of op.verbos) {
      const formas = op.conFormas
        ? el('span', 'cuadro-formas', formaResaltada(v.infinitivo, v.pasado), el('br'), formaResaltada(v.infinitivo, v.participio))
        : el('span', 'cuadro-formas', formasDe(v));
      const casilla = el('button', 'cuadro', el('span', 'cuadro-infinitivo', v.infinitivo), formas);
      casilla.type = 'button';
      casilla.dataset.id = v.id;
      const color = op.colorDe?.(v.id);
      if (color) casilla.style.setProperty('--color-verbo', color);
      casilla.addEventListener('click', () => {
        if (this.interactivo) this.op.alTocar?.(v.id);
      });
      this.casillas.set(v.id, casilla);
      this.raiz.append(casilla);
    }
    op.contenedor.append(this.raiz);
    this.setInteractivo(false);
  }

  destruir(): void {
    this.raiz.remove();
  }

  /** Con los toques apagados las casillas siguen viéndose igual: solo dejan de responder. */
  setInteractivo(valor: boolean): void {
    this.interactivo = valor;
    this.raiz.classList.toggle('tocable', valor);
    for (const c of this.casillas.values()) {
      c.tabIndex = valor ? 0 : -1;
      c.setAttribute('aria-disabled', String(!valor));
    }
  }

  setEstado(id: string, estado: EstadoCasilla | null): void {
    const c = this.casillas.get(id);
    if (!c) return;
    c.classList.remove(...ESTADOS);
    if (estado) c.classList.add(estado);
  }

  limpiarEstados(): void {
    for (const c of this.casillas.values()) c.classList.remove(...ESTADOS);
  }

  setNiveles(niveles: ReadonlyMap<string, Nivel>): void {
    for (const [id, c] of this.casillas) {
      c.classList.remove('nivel-1', 'nivel-2', 'nivel-3');
      const n = niveles.get(id) ?? 0;
      if (n > 0) c.classList.add(`nivel-${n}`);
    }
  }

  /** Enseña el pasado y el participio en la casilla de un verbo (de uno cada vez). */
  mostrarFormas(id: string | null): void {
    if (this.revelada) this.casillas.get(this.revelada)?.classList.remove('revelada');
    this.revelada = id;
    if (id) this.casillas.get(id)?.classList.add('revelada');
  }

  /** Tabla muda: las casillas no dicen qué verbo son, salvo la que enseñe sus formas. */
  setMudo(valor: boolean): void {
    this.raiz.classList.toggle('muda', valor);
  }
}
