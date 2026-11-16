import { createEmptyCard, fsrs, generatorParameters, State, type Card } from 'ts-fsrs';
import { CONFIG, type ModoId } from './config';
import { deducirNota } from './nota';
import type { Resultado } from './sesion';
import type { Verbo } from './types';

/** Tarjeta FSRS en formato guardable (fechas como texto ISO). */
export interface TarjetaGuardada {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  state: number;
  last_review?: string;
}

export interface RespuestaGuardada {
  /** Fecha ISO */
  t: string;
  verbo: string;
  modo: ModoId;
  res: Resultado;
  ms: number;
  nota: number;
  examen?: boolean;
}

export interface Ajustes {
  /** Verbos del próximo examen (los marca el adulto): null = sin lista. */
  listaExamen: string[] | null;
  /** Fecha del examen (ISO, solo día) si hay uno configurado. */
  fechaExamen: string | null;
  trucosDesactivados: string[];
  /** Trucos predefinidos editados por el adulto (por verbo). */
  trucosEditados: Record<string, string>;
  /** Hash del PIN del panel de adultos. */
  pinHash: string | null;
  /** Máximo de verbos nuevos por día en Hoy (se autorregula hasta este valor). */
  maxNuevos: number;
}

/**
 * Escalones de aprendizaje (SPEC 4.3): Elegir → Emparejar → Completar → Tabla muda.
 * Superado el último, el verbo queda "aprendido" y pasa al repaso de Hoy.
 */
export const ESCALONES = ['elegir', 'emparejar', 'completar', 'tablamuda'] as const;
export type Escalon = (typeof ESCALONES)[number];

export interface EstadoAprendizaje {
  /** Índice del escalón actual en ESCALONES. */
  escalon: number;
  /** Aciertos en el escalón actual (se reinicia con un fallo). */
  aciertos: number;
  aprendido: boolean;
  /** Cuándo quedó aprendido (ISO). */
  aprendidoEl?: string;
}

export interface EstadoProgreso {
  version: 1;
  /** Una tarjeta FSRS por verbo. */
  tarjetas: Record<string, TarjetaGuardada>;
  historial: RespuestaGuardada[];
  /** Trucos inventados por el alumno (sustituyen al predefinido). */
  trucosPropios: Record<string, string>;
  /** Decenas de verbos dominados ya celebradas (para no repetir el confeti). */
  decenasCelebradas: number;
  /** La guía se ha visto (para no abrirla sola cada vez). */
  guiaVista: boolean;
  /** Se ha pasado la bienvenida del primer arranque ("¿quién eres?"). */
  bienvenidaVista: boolean;
  /** Escalón de aprendizaje de cada verbo empezado (los que no aparecen, sin empezar). */
  aprendizaje: Record<string, EstadoAprendizaje>;
  /** Verbos a priorizar en Hoy (p. ej. los fallados en un examen). */
  prioridad: string[];
  ajustes: Ajustes;
}

export function estadoVacio(): EstadoProgreso {
  return {
    version: 1,
    tarjetas: {},
    historial: [],
    trucosPropios: {},
    decenasCelebradas: 0,
    guiaVista: false,
    bienvenidaVista: false,
    aprendizaje: {},
    prioridad: [],
    ajustes: {
      listaExamen: null,
      fechaExamen: null,
      trucosDesactivados: [],
      trucosEditados: {},
      pinHash: null,
      maxNuevos: CONFIG.nuevosMaximo,
    },
  };
}

const planificador = fsrs(generatorParameters());

export function aTarjeta(t: TarjetaGuardada): Card {
  return {
    ...t,
    due: new Date(t.due),
    last_review: t.last_review ? new Date(t.last_review) : undefined,
    state: t.state as State,
  };
}

export function aGuardada(c: Card): TarjetaGuardada {
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    learning_steps: c.learning_steps,
    state: c.state,
    last_review: c.last_review?.toISOString(),
  };
}

export interface OpcionesRegistro {
  /** Respuesta del examen: cuenta para FSRS como cualquier otra (SPEC 4.4), pero se marca en el historial. */
  examen?: boolean;
}

/**
 * Registra una respuesta: actualiza la tarjeta FSRS del verbo (una por verbo,
 * compartida por todos los tipos de pregunta) y el historial. Modifica `estado`.
 */
export function registrarRespuesta(
  estado: EstadoProgreso,
  verboId: string,
  modo: ModoId,
  resultado: Resultado,
  tiempoMs: number,
  ahora: Date,
  opciones: OpcionesRegistro = {},
): void {
  const nota = deducirNota({ modo, resultado, tiempoMs });
  const previa = estado.tarjetas[verboId];
  const tarjeta = previa ? aTarjeta(previa) : createEmptyCard(ahora);
  estado.tarjetas[verboId] = aGuardada(planificador.next(tarjeta, ahora, nota).card);
  estado.historial.push({
    t: ahora.toISOString(),
    verbo: verboId,
    modo,
    res: resultado,
    ms: Math.round(tiempoMs),
    nota,
    ...(opciones.examen ? { examen: true } : {}),
  });
  if (estado.historial.length > CONFIG.maxHistorial) {
    estado.historial.splice(0, estado.historial.length - CONFIG.maxHistorial);
  }
}

/**
 * Nivel de dominio de un verbo según FSRS:
 * 0 sin empezar · 1 aprendiendo (o reaprendiendo tras un fallo) ·
 * 2 en repaso · 3 dominado (estabilidad de varios días).
 */
export type Nivel = 0 | 1 | 2 | 3;

export function nivelDominio(t: TarjetaGuardada | undefined, config = CONFIG): Nivel {
  if (!t || t.state === State.New || t.reps === 0) return 0;
  if (t.state === State.Learning || t.state === State.Relearning) return 1;
  return t.stability >= config.estabilidadDominado ? 3 : 2;
}

/**
 * Nivel con el que se colorea un verbo en la cuadrícula (es el marcador, SPEC 10),
 * según los escalones: 0 sin empezar, 1 en Elegir o Emparejar, 2 en Completar o
 * Tabla muda, 3 aprendido.
 */
export function nivelCasilla(estado: EstadoProgreso, verboId: string): Nivel {
  const a = estado.aprendizaje[verboId];
  if (!a) return 0;
  if (a.aprendido) return 3;
  return a.escalon >= 2 ? 2 : 1;
}

export function nivelesDe(estado: EstadoProgreso, verbos: readonly Verbo[]): Map<string, Nivel> {
  return new Map(verbos.map((v) => [v.id, nivelCasilla(estado, v.id)]));
}

/* ---------------- Escalones de aprendizaje (SPEC 4.3) ---------------- */

/** Escalón actual de un verbo, o null si está aprendido. Sin empezar = Elegir. */
export function escalonDe(estado: EstadoProgreso, verboId: string): Escalon | null {
  const a = estado.aprendizaje[verboId];
  if (!a) return 'elegir';
  return a.aprendido ? null : ESCALONES[a.escalon];
}

export function aprendido(estado: EstadoProgreso, verboId: string): boolean {
  return estado.aprendizaje[verboId]?.aprendido ?? false;
}

export function empezado(estado: EstadoProgreso, verboId: string): boolean {
  return verboId in estado.aprendizaje;
}

/** ¿Esta respuesta, en este modo, cuenta para el escalón actual? (Emparejar admite también Al revés.) */
export function cuentaParaEscalon(escalon: Escalon, modo: ModoId): boolean {
  return modo === escalon || (escalon === 'emparejar' && modo === 'alreves');
}

export interface CambioEscalon {
  subio: boolean;
  aprendido: boolean;
}

/**
 * Registra una respuesta en el escalón del verbo: un acierto suma (con los
 * aciertos necesarios, sube de escalón o queda aprendido); un fallo reinicia
 * el contador sin bajar de escalón; "repasar" ni suma ni resta.
 * Solo cuentan las respuestas en el modo del escalón. Modifica `estado`.
 */
export function registrarEscalon(
  estado: EstadoProgreso,
  verboId: string,
  modo: ModoId,
  resultado: Resultado,
  config = CONFIG,
  ahora = new Date(),
): CambioEscalon {
  const sin = { subio: false, aprendido: false };
  const a = estado.aprendizaje[verboId] ?? { escalon: 0, aciertos: 0, aprendido: false };
  if (a.aprendido || !cuentaParaEscalon(ESCALONES[a.escalon], modo)) return sin;
  estado.aprendizaje[verboId] = a;
  if (resultado === 'fallo') {
    a.aciertos = 0;
    return sin;
  }
  if (resultado !== 'acierto') return sin;
  a.aciertos++;
  if (a.aciertos < config.aciertosPorEscalon) return sin;
  a.aciertos = 0;
  if (a.escalon >= ESCALONES.length - 1) {
    a.aprendido = true;
    a.aprendidoEl = ahora.toISOString();
    return { subio: true, aprendido: true };
  }
  a.escalon++;
  return { subio: true, aprendido: false };
}

/** Verbos dominados según FSRS (estabilidad de varios días). */
export function dominados(estado: EstadoProgreso, verbos: readonly Verbo[]): number {
  return verbos.filter((v) => nivelDominio(estado.tarjetas[v.id]) === 3).length;
}

/**
 * Verbos en curso (Aprender): los empezados que aún no están aprendidos y,
 * si son menos de `minimo`, los siguientes sin empezar hasta llegar a él: primero
 * los de `prioridad` (lista de examen), después en el orden del listado.
 */
export function verbosEnCurso(estado: EstadoProgreso, verbos: readonly Verbo[], prioridad: ReadonlySet<string> = new Set(), minimo = 8): Verbo[] {
  const enCurso = verbos.filter((v) => empezado(estado, v.id) && !aprendido(estado, v.id));
  const nuevos = verbos.filter((v) => !empezado(estado, v.id)).sort((a, b) => Number(!prioridad.has(a.id)) - Number(!prioridad.has(b.id)));
  const elegidos = new Set([...enCurso, ...nuevos.slice(0, Math.max(0, minimo - enCurso.length))].map((v) => v.id));
  // En el orden del listado, para que la cuadrícula no baile.
  return verbos.filter((v) => elegidos.has(v.id));
}