import { describe, expect, it } from 'vitest';
import { crearPreguntaOpciones } from '../src/logic/opciones';
import { formasDe } from '../src/logic/verbos';
import { rngConSemilla } from '../src/logic/rng';
import { verbo } from './ayuda';

const ght = ['buy', 'think', 'teach', 'catch', 'bring'].map((id) => verbo(id, 'ght'));
const otros = ['cut', 'let'].map((id) => verbo(id, 'iguales'));

describe('Elegir: opciones', () => {
  it('cuatro opciones distintas, una correcta, distractores del mismo grupo primero', () => {
    for (let s = 1; s < 20; s++) {
      const q = crearPreguntaOpciones(ght[0], [...ght, ...otros], rngConSemilla(s));
      expect(q.opciones).toHaveLength(4);
      expect(new Set(q.opciones).size).toBe(4);
      expect(q.opciones[q.correcta]).toBe(formasDe(ght[0]));
      const delGrupo = new Set(ght.map(formasDe));
      expect(q.opciones.every((o) => delGrupo.has(o))).toBe(true);
    }
  });

  it('si el grupo no da para tanto, completa con otros verbos', () => {
    const q = crearPreguntaOpciones(ght[0], [ght[0], ght[1], ...otros], rngConSemilla(1));
    expect(q.opciones).toHaveLength(4);
    expect(q.opciones).toContain(formasDe(otros[0]));
  });

  it('nunca repite unas formas (dos verbos con las mismas formas cuentan una vez)', () => {
    const gemelo = verbo('gemelo', 'ght', { pasado: 'buy-pasado', participio: 'buy-participio' });
    const q = crearPreguntaOpciones(ght[0], [ght[0], gemelo, ...otros], rngConSemilla(2));
    expect(q.opciones.filter((o) => o === formasDe(ght[0]))).toHaveLength(1);
  });
});
