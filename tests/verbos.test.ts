import { describe, expect, it } from 'vitest';
import { grupos, verbos } from '../src/data';
import { formasDe, tresFormas, verbosDeGrupo } from '../src/logic/verbos';
import { crearPreguntaOpciones } from '../src/logic/opciones';

describe('verbs.json', () => {
  it('cada verbo tiene sus tres formas, significado y un grupo que existe', () => {
    const idsGrupo = new Set(grupos.map((g) => g.id));
    for (const v of verbos) {
      for (const forma of [v.infinitivo, v.pasado, v.participio]) {
        // Minúsculas, sin "to" y sin espacios sobrantes ("was / were" lleva barra).
        expect(forma, v.id).toMatch(/^[a-z]+( \/ [a-z]+)?$/);
      }
      expect(v.id, v.id).toBe(v.infinitivo);
      expect(v.significado.trim(), v.id).not.toBe('');
      expect(idsGrupo.has(v.grupo), v.id).toBe(true);
    }
  });

  it('no repite verbos', () => {
    expect(new Set(verbos.map((v) => v.id)).size).toBe(verbos.length);
  });

  it('los grupos tienen entre 6 y 10 verbos (SPEC 3.1)', () => {
    for (const g of grupos) {
      const n = verbos.filter((v) => v.grupo === g.id).length;
      expect(n, g.id).toBeGreaterThanOrEqual(6);
      expect(n, g.id).toBeLessThanOrEqual(10);
    }
  });
});

describe('ayudas de los verbos', () => {
  it('formas para enseñar', () => {
    const buy = verbos.find((v) => v.id === 'buy')!;
    expect(formasDe(buy)).toBe('bought · bought');
    expect(tresFormas(buy)).toBe('buy · bought · bought');
    expect(verbosDeGrupo(verbos, 'ght').map((v) => v.id)).toContain('buy');
  });

  it('Elegir: las opciones son formas reales de otros verbos, nunca inventadas (SPEC 4.2)', () => {
    const reales = new Set(verbos.map(formasDe));
    for (const v of verbos) {
      const q = crearPreguntaOpciones(v, verbos, Math.random);
      expect(q.opciones).toHaveLength(4);
      expect(q.opciones[q.correcta]).toBe(formasDe(v));
      for (const o of q.opciones) expect(reales.has(o), o).toBe(true);
    }
  });
});