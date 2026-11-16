import type { EstadoProgreso } from './progreso';
import type { Verbo } from './types';

/**
 * Cifras de la portada de Hoy: lo aprendido en total, lo aprendido en los
 * últimos 7 días y cómo va la lista de examen. Sin rachas: se cuentan logros,
 * no días seguidos (CLAUDE.md). Lógica pura.
 */
export interface ResumenPortada {
  aprendidos: number;
  total: number;
  /** Verbos que han quedado aprendidos en los últimos 7 días. */
  aprendidosSemana: number;
  /** Lista de examen del panel: cuántos de sus verbos están aprendidos (null si no hay lista). */
  examen: { aprendidos: number; total: number } | null;
}

const SEMANA_MS = 7 * 864e5;

export function resumenPortada(estado: EstadoProgreso, verbos: readonly Verbo[], ahora: Date): ResumenPortada {
  const aprendido = (v: Verbo) => estado.aprendizaje[v.id]?.aprendido ?? false;
  const aprendidosSemana = verbos.filter((v) => {
    const f = estado.aprendizaje[v.id]?.aprendidoEl;
    return f !== undefined && ahora.getTime() - new Date(f).getTime() <= SEMANA_MS;
  }).length;
  const lista = estado.ajustes.listaExamen;
  const enLista = lista?.length ? verbos.filter((v) => lista.includes(v.id)) : null;
  return {
    aprendidos: verbos.filter(aprendido).length,
    total: verbos.length,
    aprendidosSemana,
    examen: enLista ? { aprendidos: enLista.filter(aprendido).length, total: enLista.length } : null,
  };
}
