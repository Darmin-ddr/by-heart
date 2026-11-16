import type { Verbo } from '../logic/types';
import type { Tablero } from './tablero';
import { boton, el, formaResaltada, rellenar } from './dom';

export interface Modo {
  /** Se llama al tocar un verbo de la cuadrícula. */
  alTocarVerbo(id: string): void;
  /** Se llama al salir del modo. */
  salir(): void;
}

/** Trucos de un verbo: el predefinido (si lo hay y está activo) y el propio del alumno. */
export interface ServicioTrucos {
  predefinido(verboId: string): string | null;
  propio(verboId: string): string | null;
  /** Guarda el truco propio (null lo borra y vuelve al predefinido). */
  guardarPropio(verboId: string, texto: string | null): void;
}

const MAX_TRUCO = 160;

/**
 * Explorar: tocar un verbo muestra sus formas, su significado y su truco. Sin evaluación.
 * Permite inventar un truco propio, que sustituye al predefinido (SPEC 5.3).
 */
export function iniciarExplorar(panel: HTMLElement, tablero: Tablero, verbos: readonly Verbo[], trucos: ServicioTrucos): Modo {
  let seleccionado: string | null = null;
  let editando = false;
  tablero.setInteractivo(true);

  const ficha = el('div', 'ficha');
  panel.replaceChildren(el('h2', 'titulo-panel', 'Explorar'), ficha);
  pintarFicha();

  function seleccionar(id: string): void {
    if (seleccionado) tablero.setEstado(seleccionado, null);
    seleccionado = id;
    editando = false;
    tablero.setEstado(id, 'seleccion');
    tablero.mostrarFormas(id);
    pintarFicha();
  }

  function pintarFicha(): void {
    const verbo = verbos.find((v) => v.id === seleccionado);
    if (!verbo) {
      ficha.replaceChildren(el('p', 'ayuda', 'Toca un verbo en la cuadrícula para ver sus formas, su significado y su truco.'));
      return;
    }
    const propio = trucos.propio(verbo.id);
    const predefinido = trucos.predefinido(verbo.id);
    const cabecera = [
      el('p', 'ficha-verbo', el('span', 'resaltado seleccion', verbo.infinitivo)),
      el('p', 'ficha-formas', formaResaltada(verbo.infinitivo, verbo.pasado), ' · ', formaResaltada(verbo.infinitivo, verbo.participio)),
      el('p', 'ficha-significado', verbo.significado),
    ];

    if (editando) {
      const area = el('textarea', 'campo-truco');
      area.maxLength = MAX_TRUCO;
      area.rows = 3;
      area.value = propio ?? '';
      area.placeholder = 'Una frase corta que te ayude a recordarlo';
      area.setAttribute('aria-label', `Tu truco para ${verbo.infinitivo}`);
      const guardar = boton('Guardar', 'boton-principal', () => {
        const texto = area.value.trim();
        trucos.guardarPropio(verbo.id, texto || null);
        editando = false;
        pintarFicha();
      });
      const cancelar = boton('Cancelar', 'boton-secundario', () => {
        editando = false;
        pintarFicha();
      });
      rellenar(ficha, ...cabecera, area, el('div', 'acciones', guardar, cancelar));
      area.focus();
      return;
    }

    const truco = propio ?? predefinido;
    const inventar = boton(propio ? 'Cambiar mi truco' : 'Inventa tu truco', 'boton-enlace', () => {
      editando = true;
      pintarFicha();
    });
    const volver =
      propio &&
      boton(predefinido ? 'Volver al truco original' : 'Borrar mi truco', 'boton-enlace', () => {
        trucos.guardarPropio(verbo.id, null);
        pintarFicha();
      });
    rellenar(
      ficha,
      ...cabecera,
      truco && el('p', 'truco', el('span', 'truco-etiqueta', propio ? 'Tu truco' : 'Truco'), truco),
      verbo.nota && el('p', 'nota', verbo.nota),
      el('div', 'acciones-truco', inventar, volver),
    );
  }

  return {
    alTocarVerbo: seleccionar,
    salir() {
      if (seleccionado) tablero.setEstado(seleccionado, null);
      tablero.mostrarFormas(null);
    },
  };
}
