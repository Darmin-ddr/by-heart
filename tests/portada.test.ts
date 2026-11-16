import { describe, expect, it } from 'vitest';
import { resumenPortada } from '../src/logic/portada';
import { estadoVacio, registrarEscalon } from '../src/logic/progreso';
import { ordenCurso } from '../src/logic/verbos';
import { verbo } from './ayuda';

const AHORA = new Date('2026-11-10T10:00:00Z');

describe('portada de Hoy', () => {
  it('aprendidos en total, en la semana y de la lista de examen', () => {
    const e = estadoVacio();
    const vs = [verbo('A'), verbo('B'), verbo('C'), verbo('D')];
    e.aprendizaje.A = { escalon: 3, aciertos: 0, aprendido: true, aprendidoEl: '2026-11-08T10:00:00Z' };
    e.aprendizaje.C = { escalon: 3, aciertos: 0, aprendido: true, aprendidoEl: '2026-10-01T10:00:00Z' };
    e.ajustes.listaExamen = ['A', 'B'];
    const r = resumenPortada(e, vs, AHORA);
    expect(r).toEqual({ aprendidos: 2, total: 4, aprendidosSemana: 1, examen: { aprendidos: 1, total: 2 } });
  });

  it('sin lista de examen, no hay cifra de examen', () => {
    expect(resumenPortada(estadoVacio(), [verbo('A')], AHORA).examen).toBeNull();
  });

  it('al quedar aprendido se guarda la fecha', () => {
    const e = estadoVacio();
    e.aprendizaje.A = { escalon: 3, aciertos: 1, aprendido: false };
    registrarEscalon(e, 'A', 'tablamuda', 'acierto', undefined, AHORA);
    expect(e.aprendizaje.A).toMatchObject({ aprendido: true, aprendidoEl: AHORA.toISOString() });
  });

  it('orden del curso: los grupos por su número de orden', () => {
    const gs = [
      { id: 'b', nombre: 'b', orden: 2, color: '' },
      { id: 'c', nombre: 'c', orden: 3, color: '' },
      { id: 'a', nombre: 'a', orden: 1, color: '' },
    ];
    expect(ordenCurso(gs).map((g) => g.id)).toEqual(['a', 'b', 'c']);
  });
});
