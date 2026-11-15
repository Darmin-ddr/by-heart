import { describe, expect, it } from 'vitest';
import { grupos, paises, regiones, verbos } from '../src/data';
import { formasDe, verboComoPais } from '../src/logic/verbos';
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

describe('verbos para la lógica heredada', () => {
  it('el infinitivo es el nombre y las formas, la capital', () => {
    const buy = verboComoPais(verbos.find((v) => v.id === 'buy')!);
    expect(buy.nombre).toBe('buy');
    expect(buy.capital).toBe('bought · bought');
    expect(buy.significado).toBe('comprar, mercar');
    expect(buy.region).toBe('ght');
    expect(formasDe({ pasado: 'sang', participio: 'sung' })).toBe('sang · sung');
  });

  it('hay un país por verbo y una región por grupo', () => {
    expect(paises.map((p) => p.id)).toEqual(verbos.map((v) => v.id));
    expect(regiones.map((r) => r.id)).toEqual(grupos.map((g) => g.id));
  });

  it('Elegir: las opciones son formas reales de otros verbos, nunca inventadas (SPEC 4.2)', () => {
    const reales = new Set(verbos.map(formasDe));
    for (const p of paises) {
      const q = crearPreguntaOpciones(p, paises, Math.random);
      expect(q.opciones).toHaveLength(4);
      expect(q.opciones[q.correcta]).toBe(p.capital);
      for (const o of q.opciones) expect(reales.has(o), o).toBe(true);
    }
  });
});
