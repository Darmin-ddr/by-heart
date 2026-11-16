import { boton, el } from './dom';

declare const __VERSION__: string;
declare const __FECHA_COMPILACION__: string;

/** Quién figura como autor en "Acerca de". */
export const AUTORIA = 'Creada por Darmin-ddr, con la ayuda de Claude (Anthropic).';

/** Diálogo "Acerca de": versión, autoría y créditos de datos y librerías (licencias que piden atribución). */
export function crearAcercaDe(): () => void {
  const dialogo = el('dialog', 'dialogo dialogo-acerca');
  dialogo.setAttribute('aria-label', 'Acerca de By Heart');
  document.body.append(dialogo);
  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo) dialogo.close();
  });

  const enlace = (texto: string, url: string) => {
    const a = el('a', '', texto);
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  };

  return () => {
    const contenido = el(
      'div',
      'dialogo-contenido',
      el('h2', 'dialogo-titulo', 'By Heart'),
      el('p', 'ayuda', `Versión ${__VERSION__} · ${__FECHA_COMPILACION__}`),
      el('p', '', 'Verbos irregulares en inglés, de memoria. En construcción: todavía no hay verbos.'),
      el('p', '', AUTORIA),
      el('p', 'ayuda', 'Sin anuncios ni cuentas: tu progreso se guarda solo en este dispositivo y no se envía a ningún sitio.'),
      el('h3', 'dialogo-subtitulo', 'Créditos'),
      el(
        'ul',
        'lista-simple lista-creditos',
        el('li', '', 'Hecha a partir de ', enlace('Capitalia', 'https://github.com/Darmin-ddr/capitalia'), ', del mismo autor.'),
        el('li', '', 'Repaso espaciado: algoritmo FSRS, librería ', enlace('ts-fsrs', 'https://github.com/open-spaced-repetition/ts-fsrs'), ' (MIT).'),
        el('li', '', 'Tipografía: Nunito (SIL Open Font License).'),
        el('li', '', 'Código libre bajo licencia MIT.'),
      ),
      el('div', 'acciones acciones-cerrar', boton('Cerrar', 'boton-secundario', () => dialogo.close())),
    );
    dialogo.replaceChildren(contenido);
    dialogo.showModal();
  };
}
