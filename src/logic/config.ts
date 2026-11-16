/**
 * Umbrales ajustables. Empiezan conservadores (SPEC 6): es mejor tardar más
 * en dar algo por dominado que darlo por sabido antes de tiempo.
 */

/**
 * Tipos de pregunta (SPEC 4.2). Los cuatro primeros son los escalones de
 * aprendizaje; Al revés solo sale en Hoy (y cuenta para Emparejar).
 */
export type ModoId = 'elegir' | 'emparejar' | 'completar' | 'tablamuda' | 'alreves';

export const CONFIG = {
  /** Por encima de este tiempo (ms), un acierto cuenta como Hard. */
  lento: { elegir: 12000, emparejar: 15000, completar: 25000, tablamuda: 35000, alreves: 12000 } as Record<ModoId, number>,
  /** Por debajo de este tiempo (ms), un acierto escribiendo cuenta como Easy. */
  rapido: { completar: 8000, tablamuda: 12000 } as Partial<Record<ModoId, number>>,
  /** Estabilidad FSRS (días) a partir de la cual un verbo está "dominado". */
  estabilidadDominado: 5,
  /** Preguntas orientativas por sesión de Hoy (contando las repeticiones de los nuevos). */
  preguntasSesion: 20,
  /** Verbos nuevos por día en Hoy: se autorregulan entre estos dos valores (SPEC 7). */
  nuevosMinimo: 5,
  nuevosMaximo: 10,
  /** Con más repasos pendientes que esto, Hoy solo mete el mínimo de nuevos. */
  pendientesMuchos: 40,
  /** Aciertos (separados) para subir de escalón en Aprender (SPEC 4.3). */
  aciertosPorEscalon: 2,
  /** Respuestas guardadas en el historial como máximo (las más antiguas se descartan). */
  maxHistorial: 3000,
};
