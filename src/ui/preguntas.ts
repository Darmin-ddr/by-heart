import type { Verbo } from '../logic/types';
import type { Rng } from '../logic/rng';
import type { Resultado } from '../logic/sesion';
import { crearPreguntaOpciones } from '../logic/opciones';
import { corregirVerbo, type CorreccionForma } from '../logic/formas';
import { formasDe, tresFormas } from '../logic/verbos';
import type { Tablero } from './tablero';
import { boton, el } from './dom';
import { nombreResaltado, pintarAcierto, pintarFallo, type Teclado } from './comun';

/** Lo que recibe una pregunta suelta (Elegir, Al revés, Completar y Tabla muda). */
export interface ArgsPregunta {
  zona: HTMLElement;
  tablero: Tablero;
  verbo: Verbo;
  /** Todos los verbos (distractores de Elegir; nombre del verbo tocado por error). */
  candidatos: readonly Verbo[];
  rng: Rng;
  teclado: Teclado;
  /** Truco a mostrar en el fallo (el propio del alumno si lo tiene). */
  truco: string | null;
  /** Comunica el resultado; devuelve si es un fallo recuperado (para celebrarlo). */
  responder(resultado: Resultado): { recuperado: boolean };
  siguiente(): void;
}

export interface ControlPregunta {
  alTocarVerbo?(id: string): void;
}

export type Renderizador = (a: ArgsPregunta) => ControlPregunta;

function significado(verbo: Pick<Verbo, 'significado'>): HTMLElement {
  return el('span', 'significado', ` (${verbo.significado})`);
}

/**
 * Elegir: se da el significado y hay que reconocer el verbo entre cuatro.
 * La cuadrícula esconde los infinitivos para no chivar la respuesta.
 */
export const preguntaElegir: Renderizador = (a) => {
  const { zona, tablero, verbo, rng, teclado } = a;
  tablero.setInteractivo(false);
  tablero.setMudo(true);
  const pregunta = crearPreguntaOpciones(verbo, a.candidatos, rng);
  const opciones = el('div', 'opciones');
  const feedback = el('div', 'feedback');
  const botones = pregunta.opciones.map((texto, i) => {
    const b = boton('', 'opcion', () => responder(i));
    b.append(el('span', 'opcion-num', String(i + 1)), el('span', 'opcion-texto', texto));
    opciones.append(b);
    return b;
  });
  zona.append(el('p', 'enunciado', '¿Qué verbo es ', el('span', 'sin-corte', nombreResaltado(verbo.significado, 'objetivo'), '?')), opciones, feedback);
  botones[0].focus({ preventScroll: true });
  teclado.usar((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= botones.length) responder(n - 1);
  });

  function responder(i: number): void {
    teclado.usar(null);
    for (const b of botones) b.disabled = true;
    const acierto = i === pregunta.correcta;
    const { recuperado } = a.responder(acierto ? 'acierto' : 'fallo');
    // Ya respondida: se enseña el verbo con sus formas (primer contacto con ellas).
    tablero.mostrarFormas(verbo.id);
    botones[pregunta.correcta].classList.add('correcta');
    const formas = el('p', 'feedback-texto', el('strong', '', tresFormas(verbo)));
    if (acierto) {
      tablero.setEstado(verbo.id, 'acierto');
      pintarAcierto(feedback, recuperado, rng, a.siguiente);
      feedback.querySelector('.feedback-titulo')?.after(formas);
      teclado.enterPara(a.siguiente);
      return;
    }
    botones[i].classList.add('elegida-mal');
    tablero.setEstado(verbo.id, 'fallo');
    pintarFallo(feedback, ['No es ', pregunta.opciones[i], '. «', verbo.significado, '» es ', el('strong', '', verbo.infinitivo), ': ', tresFormas(verbo), '.'], a.truco, a.siguiente)?.focus({
      preventScroll: true,
    });
    teclado.enterPara(a.siguiente);
  }
  return {};
};
/** Una forma correcta, con las letras de un "casi" señaladas. */
export function formaCorregida(c: CorreccionForma): HTMLElement {
  if (c.estado === 'bien') return el('span', 'forma', c.correcta);
  const marca = c.casi?.marca;
  if (!marca) return el('strong', 'forma', c.correcta);
  return el('strong', 'forma', c.correcta.slice(0, marca[0]), el('mark', 'letra', c.correcta.slice(marca[0], marca[1])), c.correcta.slice(marca[1]));
}

/**
 * Completar y Tabla muda (SPEC 4.2): escribir las formas del verbo, con
 * ortografía exacta (SPEC 3.3). En Completar se dan el infinitivo y el
 * significado; en Tabla muda, solo el significado, y la cuadrícula esconde los
 * verbos para no chivar el infinitivo.
 */
function preguntaFormas(a: ArgsPregunta, conInfinitivo: boolean): ControlPregunta {
  const { zona, tablero, verbo, rng, teclado } = a;
  tablero.setInteractivo(false);
  if (conInfinitivo) tablero.setMudo(true);
  else tablero.setEstado(verbo.id, 'objetivo');

  const campos: { clave: 'infinitivo' | 'pasado' | 'participio'; etiqueta: string; campo: HTMLInputElement }[] = [
    ...(conInfinitivo ? [{ clave: 'infinitivo' as const, etiqueta: 'Infinitivo', campo: campoRespuesta('Infinitivo', '') }] : []),
    { clave: 'pasado', etiqueta: 'Pasado', campo: campoRespuesta('Pasado', '') },
    { clave: 'participio', etiqueta: 'Participio', campo: campoRespuesta('Participio', '') },
  ];
  campos.forEach((c, i) => (c.campo.enterKeyHint = i === campos.length - 1 ? 'done' : 'next'));
  const comprobar = el('button', 'boton-principal', 'Comprobar');
  comprobar.type = 'submit';
  const noLoSe = boton('No lo sé', 'boton-secundario', () => responder(true));
  const botonesForm = el('div', 'acciones', comprobar, noLoSe);
  const formulario = el(
    'form',
    'respuesta-form',
    el('div', 'tabla-formas', ...campos.map((c) => el('label', 'campo-etiquetado', el('span', 'etiqueta-campo', c.etiqueta), c.campo))),
    botonesForm,
  );
  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    // Enter en una casilla, con alguna de las siguientes vacía: pasar a esa.
    const i = campos.findIndex((c) => c.campo === document.activeElement);
    const siguienteVacia = campos.slice(i + 1).find((c) => !c.campo.value.trim());
    if (i >= 0 && siguienteVacia) {
      siguienteVacia.campo.focus();
      return;
    }
    responder(false);
  });
  const feedback = el('div', 'feedback');
  zona.append(
    conInfinitivo
      ? el('p', 'enunciado', '¿Cómo se dice ', el('span', 'sin-corte', nombreResaltado(verbo.significado, 'objetivo'), '?'))
      : el('p', 'enunciado', 'Escribe el pasado y el participio de ', el('span', 'sin-corte', nombreResaltado(verbo.infinitivo, 'objetivo')), significado(verbo)),
    ...(conInfinitivo ? [el('p', 'ayuda', 'Escribe las tres formas.')] : []),
    formulario,
    feedback,
  );
  campos[0].campo.focus({ preventScroll: true });
  teclado.usar(null);

  function responder(noLoSabe: boolean): void {
    const valor = (clave: string) => (noLoSabe ? '' : (campos.find((c) => c.clave === clave)?.campo.value ?? ''));
    if (!noLoSabe && campos.every((c) => !c.campo.value.trim())) {
      campos[0].campo.focus();
      return;
    }
    const c = corregirVerbo(verbo, {
      ...(conInfinitivo ? { infinitivo: valor('infinitivo') } : {}),
      pasado: valor('pasado'),
      participio: valor('participio'),
    });
    for (const x of [...campos.map((k) => k.campo), comprobar, noLoSe]) x.disabled = true;
    botonesForm.hidden = true;
    const correcciones = campos.map((k) => c[k.clave]!);
    campos.forEach((k, i) => k.campo.classList.add(correcciones[i].estado === 'bien' ? 'correcta' : 'elegida-mal'));
    tablero.mostrarFormas(verbo.id);

    if (c.acierto) {
      const { recuperado } = a.responder('acierto');
      tablero.setEstado(verbo.id, 'acierto');
      pintarAcierto(feedback, recuperado, rng, a.siguiente);
      teclado.enterPara(a.siguiente);
      return;
    }
    // Un "casi" (una letra) cuenta como fallo, pero se dice con más suavidad y señalando la letra.
    a.responder('fallo');
    tablero.setEstado(verbo.id, 'fallo');
    const formas: (Node | string)[] = [];
    correcciones.forEach((k, i) => formas.push(i ? ' · ' : '', formaCorregida(k)));
    const sobra = correcciones.some((k) => k.casi?.tipo === 'sobra');
    const entrada = noLoSabe ? 'Es ' : c.casi ? 'Casi. Es ' : correcciones.some((k) => k.estado === 'bien') ? 'No del todo. Es ' : 'No es eso. Es ';
    pintarFallo(feedback, [entrada, el('span', 'formas-correctas', ...formas), '.', sobra ? ' Te sobraba una letra.' : ''], a.truco, a.siguiente)?.focus({
      preventScroll: true,
    });
    teclado.enterPara(a.siguiente);
  }
  return {};
}

/** Completar: se dan el infinitivo y el significado; hay que escribir el pasado y el participio. */
export const preguntaCompletar: Renderizador = (a) => preguntaFormas(a, false);

/** Tabla muda: se da solo el significado; hay que escribir las tres formas. */
export const preguntaTablaMuda: Renderizador = (a) => preguntaFormas(a, true);

/** Al revés (solo en Hoy): se muestran el pasado y el participio y hay que tocar su verbo. */
export const preguntaAlReves: Renderizador = (a) => {
  const { zona, tablero, verbo, rng, teclado } = a;
  tablero.setInteractivo(true);
  let esperando = true;
  const feedback = el('div', 'feedback');
  zona.append(
    el('p', 'enunciado', '¿De qué verbo son estas formas? ', el('span', 'sin-corte', el('strong', 'formas-destacadas', formasDe(verbo)))),
    el('p', 'ayuda', 'Tócalo en la cuadrícula.'),
    feedback,
  );
  teclado.usar(null);

  return {
    alTocarVerbo(tocado: string) {
      if (!esperando) return;
      esperando = false;
      tablero.mostrarFormas(verbo.id);
      if (tocado === verbo.id) {
        const { recuperado } = a.responder('acierto');
        tablero.setEstado(verbo.id, 'acierto');
        pintarAcierto(feedback, recuperado, rng, a.siguiente);
        teclado.enterPara(a.siguiente);
        return;
      }
      a.responder('fallo');
      const nombreTocado = a.candidatos.find((v) => v.id === tocado)?.infinitivo ?? 'otro verbo';
      tablero.setEstado(tocado, 'fallo');
      tablero.setEstado(verbo.id, 'objetivo');
      pintarFallo(
        feedback,
        ['Has tocado ', el('strong', '', nombreTocado), '. ', formasDe(verbo), ' son las formas de ', el('strong', '', verbo.infinitivo), '.'],
        a.truco,
        a.siguiente,
      )?.focus({ preventScroll: true });
      teclado.enterPara(a.siguiente);
    },
  };
};

/** Campo de texto para respuestas escritas (sin autocorrector ni mayúsculas automáticas). */
export function campoRespuesta(etiqueta: string, placeholder: string): HTMLInputElement {
  const campo = el('input', 'campo-texto');
  campo.type = 'text';
  campo.autocomplete = 'off';
  campo.spellcheck = false;
  campo.setAttribute('autocorrect', 'off');
  campo.setAttribute('autocapitalize', 'off');
  campo.setAttribute('aria-label', etiqueta);
  campo.placeholder = placeholder;
  return campo;
}

/** Renderizador de cada tipo de pregunta suelta (Emparejar va aparte, por tandas). */
export const RENDERIZADORES: Partial<Record<string, Renderizador>> = {
  elegir: preguntaElegir,
  completar: preguntaCompletar,
  tablamuda: preguntaTablaMuda,
  alreves: preguntaAlReves,
};
