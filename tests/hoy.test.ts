import { describe, expect, it } from 'vitest';
import { ColaHoy, crearSesionHoy, modoHoy, nuevosDeHoy, repasoAdelantado, repasosPendientes } from '../src/logic/hoy';
import { estadoVacio, registrarRespuesta, type EstadoProgreso } from '../src/logic/progreso';
import { rngConSemilla } from '../src/logic/rng';
import type { Verbo } from '../src/logic/types';
import { verbo } from './ayuda';

const v = (id: string, grupo = 'r1') => verbo(id, grupo);
const AHORA = new Date('2026-11-10T10:00:00Z');
const DIA = 864e5;

/** Marca un verbo como aprendido con una tarjeta que vence `venceEnDias` días después de AHORA. */
function aprendidoCon(e: EstadoProgreso, id: string, venceEnDias: number, estabilidad = 3) {
  e.aprendizaje[id] = { escalon: 3, aciertos: 0, aprendido: true };
  e.tarjetas[id] = {
    due: new Date(AHORA.getTime() + venceEnDias * DIA).toISOString(), stability: estabilidad, difficulty: 5,
    elapsed_days: 1, scheduled_days: 3, reps: 5, lapses: 0, learning_steps: 0, state: 2,
    last_review: new Date(AHORA.getTime() - 3 * DIA).toISOString(),
  };
}

const sesion = (e: EstadoProgreso, disponibles: Verbo[], extra: Partial<Parameters<typeof crearSesionHoy>[0]> = {}) =>
  crearSesionHoy({ estado: e, disponibles, ordenGrupos: ['r1', 'r2'], prioridad: new Set(), nuevos: 5, ahora: AHORA, rng: rngConSemilla(1), ...extra });

describe('sesión de Hoy', () => {
  it('primer día: solo nuevos, cada uno dos veces y nunca seguidas', () => {
    const ps = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((x) => v(x));
    const s = sesion(estadoVacio(), ps, { nuevos: 5 });
    expect(s.every((i) => i.tipo === 'nuevo')).toBe(true);
    const ids = s.map((i) => i.verboId);
    expect(new Set(ids).size).toBe(5);
    expect(ids).toHaveLength(10);
    for (let i = 1; i < ids.length; i++) expect(ids[i]).not.toBe(ids[i - 1]);
  });

  it('repasos vencidos primero (el más atrasado antes) y nuevos intercalados después del calentamiento', () => {
    const e = estadoVacio();
    const ps = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'N1', 'N2'].map((x) => v(x));
    aprendidoCon(e, 'R1', -1);
    aprendidoCon(e, 'R2', -5);
    aprendidoCon(e, 'R3', -2);
    aprendidoCon(e, 'R4', -3);
    aprendidoCon(e, 'R5', -4);
    aprendidoCon(e, 'R6', 4); // no vence hoy
    const s = sesion(e, ps, { nuevos: 2 });
    const ids = s.map((i) => i.verboId);
    expect(ids.slice(0, 3)).toEqual(['R2', 'R5', 'R4']);
    expect(ids).not.toContain('R6');
    expect(ids.filter((x) => x === 'N1')).toHaveLength(2);
    expect(ids.indexOf('N1')).toBeGreaterThanOrEqual(3);
  });

  it('los verbos del examen tienen prioridad, también entre los nuevos', () => {
    const ps = [v('A', 'r1'), v('B', 'r1'), v('Z', 'r2')];
    const s = sesion(estadoVacio(), ps, { nuevos: 1, prioridad: new Set(['Z']) });
    expect(s[0].verboId).toBe('Z');
  });

  it('los nuevos salen primero del grupo anterior en el curso', () => {
    const ps = [v('A', 'r2'), v('B', 'r2'), v('C', 'r1')];
    const s = sesion(estadoVacio(), ps, { nuevos: 1 });
    expect(s[0].verboId).toBe('C');
  });

  it('agrupa por grupo (la cuadrícula cambia poco) y deja el grupo de los nuevos para el final', () => {
    const e = estadoVacio();
    const ps = [v('A1', 'r1'), v('A2', 'r1'), v('B1', 'r2'), v('B2', 'r2'), v('C1', 'r3'), v('N1', 'r1'), v('N2', 'r1')];
    aprendidoCon(e, 'A1', -5);
    aprendidoCon(e, 'B1', -4);
    aprendidoCon(e, 'A2', -3);
    aprendidoCon(e, 'C1', -2);
    aprendidoCon(e, 'B2', -1);
    const s = sesion(e, ps, { nuevos: 2 });
    const grupos = s.map((i) => ps.find((x) => x.id === i.verboId)!.grupo);
    const saltos = grupos.filter((g, i) => i > 0 && g !== grupos[i - 1]).length;
    expect(saltos).toBe(2);
    expect(grupos.at(-1)).toBe('r1');
    expect(s.map((i) => i.verboId).slice(0, 3)).toEqual(['B1', 'B2', 'C1']);
  });

  it('los verbos en aprendizaje salen una vez al día', () => {
    const e = estadoVacio();
    const ps = [v('A'), v('B')];
    e.aprendizaje.A = { escalon: 1, aciertos: 0, aprendido: false };
    e.aprendizaje.B = { escalon: 1, aciertos: 0, aprendido: false };
    registrarRespuesta(e, 'A', 'alreves', 'acierto', 3000, new Date(AHORA.getTime() - 3600e3));
    registrarRespuesta(e, 'B', 'alreves', 'acierto', 3000, new Date(AHORA.getTime() - 2 * DIA));
    expect(sesion(e, ps, { nuevos: 0 }).map((i) => i.verboId)).toEqual(['B']);
  });

  it('no supera el tamaño de la sesión', () => {
    const e = estadoVacio();
    const ps = Array.from({ length: 40 }, (_, i) => v(`P${i}`));
    for (const p of ps.slice(0, 30)) aprendidoCon(e, p.id, -1);
    expect(sesion(e, ps, { nuevos: 5, tam: 20 })).toHaveLength(20);
  });

  it('nada que hacer: sesión vacía, pero hay repaso adelantado', () => {
    const e = estadoVacio();
    const ps = [v('A'), v('B')];
    aprendidoCon(e, 'A', 3);
    aprendidoCon(e, 'B', 1);
    expect(sesion(e, ps, { nuevos: 0 })).toEqual([]);
    expect(repasoAdelantado(e, ps).map((i) => i.verboId)).toEqual(['B', 'A']);
    expect(repasosPendientes(e, ps, AHORA)).toHaveLength(0);
  });
});

describe('nuevos por día autorregulados', () => {
  const conRespuestas = (aciertos: number, fallos: number) => {
    const e = estadoVacio();
    const ayer = new Date(AHORA.getTime() - DIA);
    for (let i = 0; i < aciertos + fallos; i++) {
      registrarRespuesta(e, 'X', 'elegir', i < aciertos ? 'acierto' : 'fallo', 3000, new Date(ayer.getTime() + i * 1000));
    }
    return e;
  };

  it('entre 5 y 10 según los aciertos recientes', () => {
    expect(nuevosDeHoy(conRespuestas(38, 2), 0, AHORA)).toBe(10);
    expect(nuevosDeHoy(conRespuestas(20, 20), 0, AHORA)).toBe(5);
    const medio = nuevosDeHoy(conRespuestas(33, 7), 0, AHORA);
    expect(medio).toBeGreaterThan(5);
    expect(medio).toBeLessThan(10);
  });

  it('con muchos repasos pendientes, el mínimo', () => {
    expect(nuevosDeHoy(conRespuestas(40, 0), 100, AHORA)).toBe(5);
  });

  it('respeta el máximo del panel y descuenta los ya empezados hoy', () => {
    const e = conRespuestas(40, 0);
    e.ajustes.maxNuevos = 7;
    expect(nuevosDeHoy(e, 0, AHORA)).toBe(7);
    registrarRespuesta(e, 'NUEVO1', 'elegir', 'acierto', 3000, AHORA);
    registrarRespuesta(e, 'NUEVO2', 'elegir', 'acierto', 3000, AHORA);
    expect(nuevosDeHoy(e, 0, AHORA)).toBe(5);
  });
});

describe('tipo de pregunta en Hoy', () => {
  it('en aprendizaje, el de su escalón (Emparejar como Al revés)', () => {
    const e = estadoVacio();
    expect(modoHoy(e, 'A', rngConSemilla(1))).toBe('elegir');
    e.aprendizaje.A = { escalon: 1, aciertos: 0, aprendido: false };
    expect(modoHoy(e, 'A', rngConSemilla(1))).toBe('alreves');
    e.aprendizaje.A = { escalon: 3, aciertos: 0, aprendido: false };
    expect(modoHoy(e, 'A', rngConSemilla(1))).toBe('tablamuda');
  });

  it('aprendidos: variedad entre Tabla muda, Completar y Al revés', () => {
    const e = estadoVacio();
    aprendidoCon(e, 'A', 0, 10);
    const modos = new Set(Array.from({ length: 50 }, (_, i) => modoHoy(e, 'A', rngConSemilla(i))));
    expect([...modos].sort()).toEqual(['alreves', 'completar', 'tablamuda']);
  });
});

describe('cola de Hoy', () => {
  const items = (s: string) => s.split(' ').map((x) => ({ id: x, grupo: x[0] }));
  const recorrer = (c: ColaHoy, fallar: Set<string>) => {
    const visto: string[] = [];
    while (c.actual()) {
      const id = c.actual()!;
      visto.push(id);
      c.responder(fallar.has(id) && visto.filter((x) => x === id).length === 1 ? 'fallo' : 'acierto');
    }
    return visto.join(' ');
  };

  it('el fallo vuelve dentro del bloque de su grupo', () => {
    expect(recorrer(new ColaHoy(items('a1 a2 a3 a4 a5 b1')), new Set(['a1']))).toBe('a1 a2 a3 a4 a1 a5 b1');
    expect(recorrer(new ColaHoy(items('a1 a2 b1 b2')), new Set(['a1']))).toBe('a1 a2 a1 b1 b2');
  });

  it('si su bloque se acaba, tras la última de su grupo o al final', () => {
    expect(recorrer(new ColaHoy(items('a1 b1 b2 a2 c1')), new Set(['a1']))).toBe('a1 b1 b2 a2 a1 c1');
    expect(recorrer(new ColaHoy(items('a1 b1 b2')), new Set(['a1']))).toBe('a1 b1 b2 a1');
  });

  it('resumen como en las rondas', () => {
    const c = new ColaHoy(items('a1 a2'));
    recorrer(c, new Set(['a2']));
    expect(c.resumen()).toEqual({ total: 2, aLaPrimera: 1, fallos: 1 });
  });
});
