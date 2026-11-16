import { describe, expect, it } from 'vitest';
import {
  actividadReciente, comprobarPin, diasHastaExamen, dominioPorGrupo, estadoMarcado, gruposConExamen, hashPin,
  marcarVarios, pinValido, verbosAtascados,
} from '../src/logic/adultos';
import { estadoVacio, registrarRespuesta } from '../src/logic/progreso';
import type { Grupo } from '../src/logic/types';
import { verbo } from './ayuda';
const D = (s: string) => new Date(s);

describe('PIN', () => {
  it('formato: 4 a 6 cifras', () => {
    expect(['1234', '123456'].every(pinValido)).toBe(true);
    expect(['123', '1234567', 'abcd', '12 34'].some(pinValido)).toBe(false);
  });
  it('hash y comprobación', async () => {
    const h = await hashPin('2468');
    expect(h).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(h).not.toContain('2468');
    expect(await comprobarPin('2468', h)).toBe(true);
    expect(await comprobarPin('2469', h)).toBe(false);
    expect(await comprobarPin('2468', null)).toBe(false);
  });
});

describe('estadísticas', () => {
  const g1: Grupo = { id: 'g1', nombre: 'Uno', orden: 1, color: '' };
  const g2: Grupo = { id: 'g2', nombre: 'Dos', orden: 2, color: '' };
  const verbos = [verbo('A'), verbo('B'), verbo('C', 'g2')];

  it('aprendidos por grupo, por escalones (como la cuadrícula)', () => {
    const e = estadoVacio();
    e.aprendizaje.A = { escalon: 1, aciertos: 0, aprendido: false };
    e.aprendizaje.B = { escalon: 3, aciertos: 0, aprendido: true };
    e.aprendizaje.C = { escalon: 2, aciertos: 0, aprendido: false };
    const d = dominioPorGrupo(e, [g2, g1], (id) => verbos.filter((v) => v.grupo === id));
    expect(d.map((x) => x.grupo.id)).toEqual(['g1', 'g2']); // en el orden del curso
    expect(d[0]).toMatchObject({ total: 2, porNivel: [0, 1, 0, 1] });
    expect(d[1]).toMatchObject({ total: 1, porNivel: [0, 0, 1, 0] });
  });

  it('verbos que más se atascan (solo fallos recientes)', () => {
    const e = estadoVacio();
    registrarRespuesta(e, 'A', 'elegir', 'fallo', 3000, D('2026-11-01T10:00:00Z'));
    registrarRespuesta(e, 'B', 'elegir', 'fallo', 3000, D('2026-11-01T10:01:00Z'));
    registrarRespuesta(e, 'B', 'elegir', 'fallo', 3000, D('2026-11-01T10:02:00Z'));
    registrarRespuesta(e, 'C', 'elegir', 'fallo', 3000, D('2026-08-01T10:00:00Z')); // antiguo
    registrarRespuesta(e, 'C', 'elegir', 'acierto', 3000, D('2026-11-01T10:03:00Z'));
    const a = verbosAtascados(e, verbos, D('2026-11-02T10:00:00Z'));
    expect(a.map((x) => [x.verbo.id, x.fallos])).toEqual([['B', 2], ['A', 1]]);
  });

  it('actividad de los últimos días', () => {
    const e = estadoVacio();
    registrarRespuesta(e, 'A', 'elegir', 'acierto', 3000, new Date(2026, 10, 1, 10));
    registrarRespuesta(e, 'A', 'elegir', 'fallo', 3000, new Date(2026, 10, 1, 11));
    registrarRespuesta(e, 'B', 'elegir', 'acierto', 3000, new Date(2026, 9, 30, 12));
    const act = actividadReciente(e, new Date(2026, 10, 1, 20), 3);
    expect(act).toEqual([
      { dia: '2026-10-30', respuestas: 1, aciertos: 1 },
      { dia: '2026-10-31', respuestas: 0, aciertos: 0 },
      { dia: '2026-11-01', respuestas: 2, aciertos: 1 },
    ]);
  });
});

describe('modo examen', () => {
  it('días hasta el examen', () => {
    expect(diasHastaExamen('2026-11-10', new Date(2026, 10, 1, 23))).toBe(9);
    expect(diasHastaExamen('2026-11-01', new Date(2026, 10, 1, 8))).toBe(0);
    expect(diasHastaExamen('2026-10-30', new Date(2026, 10, 1))).toBe(-2);
    expect(diasHastaExamen(null, new Date())).toBeNull();
  });

  it('grupos con verbos del examen', () => {
    const vs = [verbo('A', 'g1'), verbo('B', 'g1'), verbo('C', 'g2')];
    expect([...gruposConExamen(['B', 'C'], vs)].sort()).toEqual(['g1', 'g2']);
    expect(gruposConExamen(null, vs).size).toBe(0);
  });
});

describe('casillas de la lista de examen (todos, o un grupo)', () => {
  it('todos, ninguno o parcial', () => {
    expect(estadoMarcado(['A', 'B'], new Set(['A', 'B', 'X']))).toBe('todos');
    expect(estadoMarcado(['A', 'B'], new Set(['X']))).toBe('ninguno');
    expect(estadoMarcado(['A', 'B'], new Set(['A']))).toBe('parcial');
    expect(estadoMarcado([], new Set(['A']))).toBe('ninguno');
  });
  it('marcar y desmarcar varios no toca los demás verbos', () => {
    const s = marcarVarios(['A', 'B'], new Set(['X']), true);
    expect([...s].sort()).toEqual(['A', 'B', 'X']);
    expect([...marcarVarios(['A', 'X'], s, false)]).toEqual(['B']);
  });
});