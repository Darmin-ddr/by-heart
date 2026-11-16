import { describe, expect, it } from 'vitest';
import { verbos } from '../src/data';
import { formasDe, tresFormas } from '../src/logic/verbos';
import { crearPreguntaOpciones } from '../src/logic/opciones';

describe('verbs.json', () => {
  it('cada verbo tiene sus tres formas y su significado', () => {
    for (const v of verbos) {
      for (const forma of [v.infinitivo, v.pasado, v.participio]) {
        // Minúsculas, sin "to" y sin espacios sobrantes ("was / were" lleva barra).
        expect(forma, v.id).toMatch(/^[a-z]+( \/ [a-z]+)?$/);
      }
      expect(v.id, v.id).toBe(v.infinitivo);
      expect(v.significado.trim(), v.id).not.toBe('');
    }
  });

  it('no repite verbos ni significados', () => {
    expect(new Set(verbos.map((v) => v.significado)).size).toBe(verbos.length);
    expect(new Set(verbos.map((v) => v.id)).size).toBe(verbos.length);
  });

  it('en el orden del listado (alfabético)', () => {
    const ids = verbos.map((v) => v.id);
    expect(ids).toEqual([...ids].sort());
  });
});

describe('ayudas de los verbos', () => {
  it('formas para enseñar', () => {
    const buy = verbos.find((v) => v.id === 'buy')!;
    expect(formasDe(buy)).toBe('bought · bought');
    expect(tresFormas(buy)).toBe('buy · bought · bought');
  });

  it('Elegir: las opciones son infinitivos reales del listado, sin repetir (SPEC 4.2)', () => {
    const reales = new Set(verbos.map((v) => v.infinitivo));
    for (const v of verbos) {
      const q = crearPreguntaOpciones(v, verbos, Math.random);
      expect(q.opciones).toHaveLength(4);
      expect(new Set(q.opciones).size).toBe(4);
      expect(q.opciones[q.correcta]).toBe(v.infinitivo);
      for (const o of q.opciones) expect(reales.has(o), o).toBe(true);
    }
  });
});
