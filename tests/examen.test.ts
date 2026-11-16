import { describe, expect, it } from 'vitest';
import { corregirFila, notaExamen, prepararExamen, verbosDeAmbito } from '../src/logic/examen';
import { rngConSemilla } from '../src/logic/rng';
import { verbo } from './ayuda';

const teach = verbo('teach', 'g1', { pasado: 'taught', participio: 'taught', significado: 'enseñar' });
const verbos = [teach, verbo('B', 'g1'), verbo('C', 'g2'), verbo('D', 'g2'), verbo('E', 'g2')];

describe('examen', () => {
  it('qué entra: todos, la lista del examen o un grupo', () => {
    expect(verbosDeAmbito('todo', verbos, null)).toHaveLength(5);
    expect(verbosDeAmbito('lista', verbos, ['B', 'D']).map((v) => v.id)).toEqual(['B', 'D']);
    expect(verbosDeAmbito('lista', verbos, null)).toHaveLength(0);
    expect(verbosDeAmbito({ grupo: 'g2' }, verbos, null).map((v) => v.id)).toEqual(['C', 'D', 'E']);
  });

  it('filas: n verbos distintos, con el dato repartido entre infinitivo y significado', () => {
    const filas = prepararExamen(verbos, 4, rngConSemilla(3));
    expect(filas).toHaveLength(4);
    expect(new Set(filas.map((f) => f.verboId)).size).toBe(4);
    expect(filas.filter((f) => f.dato === 'infinitivo')).toHaveLength(2);
    expect(prepararExamen(verbos, null, rngConSemilla(3))).toHaveLength(5);
  });

  it('dado el infinitivo: pasado y participio; un punto, medio punto o nada', () => {
    const fila = { verboId: 'teach', dato: 'infinitivo' as const };
    expect(corregirFila(teach, fila, { pasado: 'taught', participio: 'taught' })).toMatchObject({ casillas: 2, mal: 0, puntos: 1, resultado: 'acierto' });
    // Un "casi" cuenta como mal: la ortografía es exacta.
    expect(corregirFila(teach, fila, { pasado: 'taught', participio: 'tought' })).toMatchObject({ mal: 1, puntos: 0.5, resultado: 'repasar' });
    expect(corregirFila(teach, fila, { pasado: '', participio: 'teached' })).toMatchObject({ mal: 2, puntos: 0, resultado: 'fallo' });
    // Lo que se escriba en el infinitivo, si se da hecho, no cuenta.
    expect(corregirFila(teach, fila, { infinitivo: 'xxx', pasado: 'taught', participio: 'taught' }).puntos).toBe(1);
  });

  it('dado el significado: las tres formas', () => {
    const fila = { verboId: 'teach', dato: 'significado' as const };
    expect(corregirFila(teach, fila, { infinitivo: 'to teach', pasado: 'taught', participio: 'taught' })).toMatchObject({ casillas: 3, puntos: 1 });
    expect(corregirFila(teach, fila, { infinitivo: '', pasado: 'taught', participio: 'taught' })).toMatchObject({ mal: 1, puntos: 0.5 });
    expect(corregirFila(teach, fila, { infinitivo: '', pasado: '', participio: 'taught' }).puntos).toBe(0);
  });

  it('nota sobre 10, con un decimal', () => {
    expect(notaExamen([1, 1, 0.5, 0])).toBe(6.3);
    expect(notaExamen([1, 1, 1])).toBe(10);
    expect(notaExamen([])).toBe(0);
  });
});
