import { describe, expect, it } from 'vitest';
import { mensajeAcierto, mensajeResumen } from '../src/logic/mensajes';

describe('mensajes', () => {
  it('resumen de ronda', () => {
    expect(mensajeResumen(9, 9)).toBe('Todos a la primera: 9 de 9.');
    expect(mensajeResumen(6, 9)).toBe('6 de 9 a la primera. Los demás, recuperados.');
  });
  it('mensaje de acierto, variado', () => {
    expect(mensajeAcierto(() => 0)).toBe('¡Correcto!');
    expect(mensajeAcierto(() => 0.99)).toBe('Exacto.');
  });
});
