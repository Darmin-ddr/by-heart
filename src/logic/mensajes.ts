import type { Rng } from './rng';

const ACIERTOS = ['¡Correcto!', '¡Eso es!', 'Bien visto.', 'Exacto.'];

export function mensajeAcierto(rng: Rng): string {
  return ACIERTOS[Math.floor(rng() * ACIERTOS.length)];
}

export const MENSAJE_RECUPERADO = '¡Ahora sí! Este ya es tuyo.';

export const OTRA_OPORTUNIDAD = 'En seguida tendrás otra oportunidad 😉';

export function mensajeResumen(aLaPrimera: number, total: number): string {
  if (aLaPrimera === total) return `Todos a la primera: ${total} de ${total}.`;
  return `${aLaPrimera} de ${total} a la primera. Los demás, recuperados.`;
}
