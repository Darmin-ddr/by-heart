import { describe, expect, it } from 'vitest';
import { crearPreguntaOpciones, distancia } from '../src/logic/opciones';
import { rngConSemilla } from '../src/logic/rng';
import { verbo } from './ayuda';

const verbos = ['read', 'ride', 'lead', 'write', 'run', 'swim', 'teach', 'think', 'bring', 'buy', 'catch', 'fight'].map((id) => verbo(id));
const read = verbos[0];

describe('Elegir: el verbo a partir del significado', () => {
  it('distancia de edición', () => {
    expect(distancia('read', 'read')).toBe(0);
    expect(distancia('read', 'lead')).toBe(1);
    expect(distancia('read', 'ride')).toBe(3);
    expect(distancia('', 'go')).toBe(2);
  });

  it('cuatro infinitivos distintos, uno correcto', () => {
    for (let s = 1; s < 20; s++) {
      const q = crearPreguntaOpciones(read, verbos, rngConSemilla(s));
      expect(q.opciones).toHaveLength(4);
      expect(new Set(q.opciones).size).toBe(4);
      expect(q.opciones[q.correcta]).toBe('read');
    }
  });

  it('los distractores salen de los ocho más parecidos al correcto', () => {
    const distancias = verbos.slice(1).map((v) => distancia(v.infinitivo, 'read')).sort((a, b) => a - b);
    const limite = distancias[7];
    for (let s = 1; s < 20; s++) {
      const q = crearPreguntaOpciones(read, verbos, rngConSemilla(s));
      for (const o of q.opciones) expect(distancia(o, 'read'), o).toBeLessThanOrEqual(limite);
    }
  });
});
