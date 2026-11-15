import type { Continente, Pais, Region } from '../logic/types';
import type { Nivel } from '../logic/progreso';
import { boton, el } from './dom';

export interface DatosSelector {
  regiones: readonly Region[];
  /** "Europa entera" o "Asia entera" y si se puede elegir (todas sus regiones abiertas). */
  entero(c: Continente): { region: Region; abierto: boolean };
  paisesDe(regionId: string): readonly Pais[];
  desbloqueadas(c: Continente): ReadonlySet<string>;
  nivel(paisId: string): Nivel;
  actual(): Region;
  /** Países del examen en cada región (0 si ninguno). */
  conExamen(regionId: string): number;
  elegir(regionId: string): void;
}

/**
 * Selector de grupo (SPEC 3.1): los grupos se desbloquean en orden y siempre se
 * puede volver a los anteriores. El primero de la lista es "Todos los verbos".
 */
export function prepararSelectorRegiones(disparador: HTMLButtonElement, datos: DatosSelector): () => void {
  const dialogo = el('dialog', 'dialogo-regiones');
  dialogo.setAttribute('aria-label', 'Elegir grupo');
  document.body.append(dialogo);
  // Tocar fuera del contenido cierra el diálogo.
  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo) dialogo.close();
  });

  function actualizarBoton(): void {
    disparador.replaceChildren(el('span', 'region-nombre', datos.actual().nombre), el('span', 'region-flecha', '▾'));
    disparador.setAttribute('aria-label', `Grupo: ${datos.actual().nombre}. Cambiar de grupo`);
  }

  function abrir(): void {
    const contenido = el('div', 'dialogo-contenido');
    const cerrar = boton('Cerrar', 'boton-secundario', () => dialogo.close());
    contenido.append(el('h2', 'dialogo-titulo', 'Grupos de verbos'));
    // La lógica heredada reparte los grupos en "continentes": los verbos están todos en uno, que no se nombra.
    for (const c of ['europa', 'asia'] as Continente[]) {
      if (!datos.regiones.some((r) => r.continente === c)) continue;
      const abiertas = datos.desbloqueadas(c);
      const lista = el('ul', 'lista-regiones');
      const ordenadas = datos.regiones.filter((r) => r.continente === c).sort((a, b) => a.orden - b.orden);
      const entero = datos.entero(c);
      // El continente entero va primero; se abre cuando están abiertas todas sus regiones.
      [entero.region, ...ordenadas].forEach((r, j) => {
        const i = j - 1;
        const esEntero = j === 0;
        const paises = datos.paisesDe(r.id);
        const aprendidos = paises.filter((p) => datos.nivel(p.id) === 3).length;
        const abierta = esEntero ? entero.abierto : abiertas.has(r.id);
        const actual = datos.actual().id === r.id;
        const b = el('button', `region-item${actual ? ' actual' : ''}${esEntero ? ' region-entera' : ''}`);
        b.type = 'button';
        b.disabled = !abierta;
        b.style.setProperty('--color-pais', r.color);
        const detalle = abierta
          ? `${aprendidos} de ${paises.length} aprendidos`
          : esEntero
            ? 'Se abre cuando estén abiertos todos los grupos'
            : `Se abre cuando todos los verbos de «${ordenadas[i - 1]?.nombre ?? 'el anterior'}» lleguen al escalón Completar`;
        const examen = esEntero ? 0 : datos.conExamen(r.id);
        b.append(
          el('span', 'region-muestra'),
          el('span', 'region-textos', el('span', 'region-titulo', r.nombre, actual ? ' (ahora)' : ''), el('span', 'region-detalle', detalle)),
          el('span', 'region-estado', !abierta ? '🔒' : examen ? `📝 ${examen}` : ''),
        );
        if (!abierta) b.setAttribute('aria-label', `${r.nombre}, bloqueado. ${detalle}`);
        b.addEventListener('click', () => {
          dialogo.close();
          if (!actual) datos.elegir(r.id);
        });
        lista.append(el('li', '', b));
      });
      contenido.append(lista);
    }
    contenido.append(el('div', 'acciones acciones-cerrar', cerrar));
    dialogo.replaceChildren(contenido);
    dialogo.showModal();
    (contenido.querySelector('.region-item.actual') as HTMLElement | null)?.focus();
  }

  disparador.addEventListener('click', abrir);
  actualizarBoton();
  return actualizarBoton;
}
