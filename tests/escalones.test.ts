import { describe, expect, it } from 'vitest';
import { aprendido, escalonDe, estadoVacio, registrarEscalon, verbosEnCurso } from '../src/logic/progreso';
import { validarEstado } from '../src/logic/almacen';
import { verbo } from './ayuda';

describe('escalones de aprendizaje', () => {
  it('sin empezar: Elegir', () => {
    expect(escalonDe(estadoVacio(), 'A')).toBe('elegir');
  });

  it('dos aciertos suben de escalón; cuatro escalones y queda aprendido', () => {
    const e = estadoVacio();
    const pasos = ['elegir', 'emparejar', 'completar', 'tablamuda'] as const;
    for (const [i, modo] of pasos.entries()) {
      expect(escalonDe(e, 'A')).toBe(modo);
      expect(registrarEscalon(e, 'A', modo, 'acierto')).toEqual({ subio: false, aprendido: false });
      const r = registrarEscalon(e, 'A', modo, 'acierto');
      expect(r.subio).toBe(true);
      expect(r.aprendido).toBe(i === 3);
    }
    expect(aprendido(e, 'A')).toBe(true);
    expect(escalonDe(e, 'A')).toBeNull();
  });

  it('un fallo reinicia el contador pero no baja de escalón', () => {
    const e = estadoVacio();
    registrarEscalon(e, 'A', 'elegir', 'acierto');
    registrarEscalon(e, 'A', 'elegir', 'acierto'); // sube a Emparejar
    registrarEscalon(e, 'A', 'emparejar', 'acierto');
    registrarEscalon(e, 'A', 'emparejar', 'fallo');
    expect(escalonDe(e, 'A')).toBe('emparejar');
    expect(registrarEscalon(e, 'A', 'emparejar', 'acierto').subio).toBe(false); // empieza de cero
    expect(registrarEscalon(e, 'A', 'emparejar', 'acierto').subio).toBe(true);
  });

  it('solo cuentan las respuestas en el modo del escalón (Emparejar admite Al revés); "repasar" no cuenta', () => {
    const e = estadoVacio();
    registrarEscalon(e, 'A', 'completar', 'acierto');
    registrarEscalon(e, 'A', 'completar', 'acierto');
    expect(escalonDe(e, 'A')).toBe('elegir');
    registrarEscalon(e, 'A', 'elegir', 'acierto');
    registrarEscalon(e, 'A', 'elegir', 'acierto');
    registrarEscalon(e, 'A', 'alreves', 'acierto');
    registrarEscalon(e, 'A', 'alreves', 'repasar');
    expect(escalonDe(e, 'A')).toBe('emparejar');
    registrarEscalon(e, 'A', 'alreves', 'acierto');
    expect(escalonDe(e, 'A')).toBe('completar');
  });

  it('verbos en curso: los empezados sin aprender y, hasta el mínimo, los siguientes del listado', () => {
    const vs = ['A', 'B', 'C', 'D', 'E', 'F'].map((id) => verbo(id));
    const e = estadoVacio();
    expect(verbosEnCurso(e, vs, new Set(), 3).map((v) => v.id)).toEqual(['A', 'B', 'C']);
    // B aprendido y E empezado (por Hoy): sale B, entra E, y se completa con el siguiente (C).
    e.aprendizaje.B = { escalon: 3, aciertos: 0, aprendido: true };
    e.aprendizaje.E = { escalon: 1, aciertos: 0, aprendido: false };
    expect(verbosEnCurso(e, vs, new Set(), 3).map((v) => v.id)).toEqual(['A', 'C', 'E']);
    // Los de la lista de examen entran antes que los siguientes del listado.
    expect(verbosEnCurso(e, vs, new Set(['F']), 3).map((v) => v.id)).toEqual(['A', 'E', 'F']);
    // Si hay más empezados que el mínimo, salen todos.
    for (const id of ['A', 'C', 'D', 'F']) e.aprendizaje[id] = { escalon: 0, aciertos: 1, aprendido: false };
    expect(verbosEnCurso(e, vs, new Set(), 3)).toHaveLength(5);
  });
});

describe('cargar un progreso guardado', () => {
  it('se queda con los escalones y descarta los ajustes que ya no existen', () => {
    const e = validarEstado({
      version: 1,
      tarjetas: {},
      aprendizaje: { A: { escalon: 2, aciertos: 1, aprendido: false } },
      ajustes: { maxNuevos: 7, focoHoy: 'europa' },
      historial: [{ t: '2026-11-01T10:00:00Z', verbo: 'A', modo: 'elegir', res: 'acierto', ms: 1, nota: 3 }, { pais: 'X' }],
    })!;
    expect(e.aprendizaje.A.escalon).toBe(2);
    expect(e.ajustes.maxNuevos).toBe(7);
    expect('focoHoy' in e.ajustes).toBe(false);
    // Las respuestas sin verbo (de otro formato) se descartan.
    expect(e.historial).toHaveLength(1);
  });
});