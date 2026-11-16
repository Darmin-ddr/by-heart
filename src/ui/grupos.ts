import type { Grupo, Verbo } from '../logic/types';
import type { Nivel } from '../logic/progreso';
import { boton, el } from './dom';

export interface DatosSelector {
  grupos: readonly Grupo[];
  /** "Todos los verbos" y si se puede elegir (todos los grupos abiertos). */
  todos(): { grupo: Grupo; abierto: boolean };
  verbosDe(grupoId: string): readonly Verbo[];
  desbloqueados(): ReadonlySet<string>;
  nivel(verboId: string): Nivel;
  actual(): Grupo;
  /** Verbos del examen en cada grupo (0 si ninguno). */
  conExamen(grupoId: string): number;
  elegir(grupoId: string): void;
}

/**
 * Selector de grupo (SPEC 3.1): los grupos se desbloquean en orden y siempre se
 * puede volver a los anteriores. El primero de la lista es "Todos los verbos".
 */
export function prepararSelectorGrupos(disparador: HTMLButtonElement, datos: DatosSelector): () => void {
  const dialogo = el('dialog', 'dialogo dialogo-grupos');
  dialogo.setAttribute('aria-label', 'Elegir grupo');
  document.body.append(dialogo);
  // Tocar fuera del contenido cierra el diálogo.
  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo) dialogo.close();
  });

  function actualizarBoton(): void {
    disparador.replaceChildren(el('span', 'grupo-nombre', datos.actual().nombre), el('span', 'grupo-flecha', '▾'));
    disparador.setAttribute('aria-label', `Grupo: ${datos.actual().nombre}. Cambiar de grupo`);
  }

  function abrir(): void {
    const contenido = el('div', 'dialogo-contenido');
    const cerrar = boton('Cerrar', 'boton-secundario', () => dialogo.close());
    const abiertos = datos.desbloqueados();
    const ordenados = [...datos.grupos].sort((a, b) => a.orden - b.orden);
    const todos = datos.todos();
    const lista = el('ul', 'lista-grupos');
    // "Todos los verbos" va primero; se abre cuando están abiertos todos los grupos.
    [todos.grupo, ...ordenados].forEach((g, j) => {
      const esTodos = j === 0;
      const verbos = datos.verbosDe(g.id);
      const aprendidos = verbos.filter((v) => datos.nivel(v.id) === 3).length;
      const abierto = esTodos ? todos.abierto : abiertos.has(g.id);
      const actual = datos.actual().id === g.id;
      const b = el('button', `grupo-item${actual ? ' actual' : ''}${esTodos ? ' grupo-todos' : ''}`);
      b.type = 'button';
      b.disabled = !abierto;
      b.style.setProperty('--color-grupo', g.color);
      const detalle = abierto
        ? `${aprendidos} de ${verbos.length} aprendidos`
        : esTodos
          ? 'Se abre cuando estén abiertos todos los grupos'
          : `Se abre cuando todos los verbos de «${ordenados[j - 2]?.nombre ?? 'el anterior'}» lleguen al escalón Completar`;
      const examen = esTodos ? 0 : datos.conExamen(g.id);
      b.append(
        el('span', 'grupo-muestra'),
        el('span', 'grupo-textos', el('span', 'grupo-titulo', g.nombre, actual ? ' (ahora)' : ''), el('span', 'grupo-detalle', detalle)),
        el('span', 'grupo-estado', !abierto ? '🔒' : examen ? `📝 ${examen}` : ''),
      );
      if (!abierto) b.setAttribute('aria-label', `${g.nombre}, bloqueado. ${detalle}`);
      b.addEventListener('click', () => {
        dialogo.close();
        if (!actual) datos.elegir(g.id);
      });
      lista.append(el('li', '', b));
    });
    contenido.append(el('h2', 'dialogo-titulo', 'Grupos de verbos'), lista, el('div', 'acciones acciones-cerrar', cerrar));
    dialogo.replaceChildren(contenido);
    dialogo.showModal();
    (contenido.querySelector('.grupo-item.actual') as HTMLElement | null)?.focus();
  }

  disparador.addEventListener('click', abrir);
  actualizarBoton();
  return actualizarBoton;
}
