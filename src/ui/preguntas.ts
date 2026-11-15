import type { Pais } from '../logic/types';
import type { Rng } from '../logic/rng';
import type { Resultado } from '../logic/sesion';
import { crearPreguntaOpciones } from '../logic/opciones';
import { corregirVerbo, type CorreccionForma } from '../logic/formas';
import { verboDe } from '../data';
import type { Tablero } from './tablero';
import { boton, el } from './dom';
import { nombreResaltado, pintarAcierto, pintarFallo, type OpcionesRespuesta, type Teclado } from './comun';

/** Lo que recibe una pregunta suelta (Elegir, Al revés, Completar y Tabla muda). */
export interface ArgsPregunta {
  zona: HTMLElement;
  mapa: Tablero;
  pais: Pais;
  /** Países de la región (para nombrar el país tocado por error). */
  region: readonly Pais[];
  /** Países activos (distractores y validación de texto). */
  candidatos: readonly Pais[];
  rng: Rng;
  teclado: Teclado;
  /** Truco a mostrar en el fallo (el propio del alumno si lo tiene). */
  truco: string | null;
  /** Comunica el resultado; devuelve si es un fallo recuperado (para celebrarlo). */
  responder(resultado: Resultado, opciones?: Pick<OpcionesRespuesta, 'escalon'>): { recuperado: boolean };
  siguiente(): void;
}

export interface ControlPregunta {
  alTocarPais?(id: string): void;
}

export type Renderizador = (a: ArgsPregunta) => ControlPregunta;

function enunciadoCapitalDe(pais: Pais): HTMLElement {
  return el(
    'p',
    'enunciado',
    '¿Cuál es el pasado y el participio de ',
    el('span', 'sin-corte', nombreResaltado(pais.nombre, 'objetivo'), '?'),
    pais.significado ? el('span', 'significado', ` (${pais.significado})`) : null,
  );
}

/** Modo 2: 4 capitales posibles. */
export const preguntaElegir: Renderizador = (a) => {
  const { zona, mapa, pais, rng, teclado } = a;
  mapa.setInteractivo(false);
  mapa.setEstado(pais.id, 'objetivo');
  const pregunta = crearPreguntaOpciones(pais, a.candidatos, rng);
  const opciones = el('div', 'opciones');
  const feedback = el('div', 'feedback');
  const botones = pregunta.opciones.map((texto, i) => {
    const b = boton('', 'opcion', () => responder(i));
    b.append(el('span', 'opcion-num', String(i + 1)), el('span', 'opcion-texto', texto));
    opciones.append(b);
    return b;
  });
  zona.append(enunciadoCapitalDe(pais), opciones, feedback);
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
    mapa.mostrarCapital(pais.id);
    botones[pregunta.correcta].classList.add('correcta');
    if (acierto) {
      mapa.setEstado(pais.id, 'acierto');
      pintarAcierto(feedback, recuperado, rng, a.siguiente);
      teclado.enterPara(a.siguiente);
      return;
    }
    botones[i].classList.add('elegida-mal');
    mapa.setEstado(pais.id, 'fallo');
    pintarFallo(feedback, ['No es ', pregunta.opciones[i], '. Es ', el('strong', '', pais.capital), '.'], a.truco, a.siguiente)?.focus({
      preventScroll: true,
    });
    teclado.enterPara(a.siguiente);
  }
  return {};
};

/** Una forma correcta, con las letras de un "casi" señaladas. */
function formaCorregida(c: CorreccionForma): HTMLElement {
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
  const { zona, mapa, pais, rng, teclado } = a;
  const verbo = verboDe(pais.id);
  if (!verbo) return preguntaElegir(a);
  mapa.setInteractivo(false);
  if (conInfinitivo) mapa.setMudo(true);
  else mapa.setEstado(pais.id, 'objetivo');

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
  const significado = pais.significado ?? '';
  zona.append(
    conInfinitivo
      ? el('p', 'enunciado', '¿Cómo se dice ', el('span', 'sin-corte', nombreResaltado(significado, 'objetivo'), '?'))
      : el(
          'p',
          'enunciado',
          'Escribe el pasado y el participio de ',
          el('span', 'sin-corte', nombreResaltado(pais.nombre, 'objetivo')),
          significado ? el('span', 'significado', ` (${significado})`) : null,
        ),
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
    const c = corregirVerbo(verbo!, {
      ...(conInfinitivo ? { infinitivo: valor('infinitivo') } : {}),
      pasado: valor('pasado'),
      participio: valor('participio'),
    });
    for (const x of [...campos.map((k) => k.campo), comprobar, noLoSe]) x.disabled = true;
    botonesForm.hidden = true;
    const correcciones = campos.map((k) => c[k.clave]!);
    campos.forEach((k, i) => k.campo.classList.add(correcciones[i].estado === 'bien' ? 'correcta' : 'elegida-mal'));
    mapa.mostrarCapital(pais.id);

    if (c.acierto) {
      const { recuperado } = a.responder('acierto');
      mapa.setEstado(pais.id, 'acierto');
      pintarAcierto(feedback, recuperado, rng, a.siguiente);
      teclado.enterPara(a.siguiente);
      return;
    }
    // Un "casi" (una letra) cuenta como fallo, pero se dice con más suavidad y señalando la letra.
    a.responder('fallo');
    mapa.setEstado(pais.id, 'fallo');
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
/** Modo 5: se muestra la capital y hay que tocar el país. */
export const preguntaAlReves: Renderizador = (a) => {
  const { zona, mapa, pais, rng, teclado } = a;
  mapa.setInteractivo(true);
  let esperando = true;
  const feedback = el('div', 'feedback');
  zona.append(
    el('p', 'enunciado', '¿De qué verbo son estas formas? ', el('span', 'sin-corte', el('strong', 'nombre-capital', pais.capital))),
    el('p', 'ayuda', 'Tócalo en la cuadrícula.'),
    feedback,
  );
  teclado.usar(null);

  return {
    alTocarPais(tocado: string) {
      if (!esperando) return;
      esperando = false;
      mapa.mostrarCapital(pais.id);
      if (tocado === pais.id) {
        const { recuperado } = a.responder('acierto');
        mapa.setEstado(pais.id, 'acierto');
        pintarAcierto(feedback, recuperado, rng, a.siguiente);
        teclado.enterPara(a.siguiente);
        return;
      }
      a.responder('fallo');
      const nombreTocado = a.candidatos.find((p) => p.id === tocado)?.nombre ?? 'otro verbo';
      mapa.setEstado(tocado, 'fallo');
      mapa.setEstado(pais.id, 'objetivo');
      pintarFallo(
        feedback,
        ['Has tocado ', el('strong', '', nombreTocado), '. ', pais.capital, ' son las formas de ', el('strong', '', pais.nombre), '.'],
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
