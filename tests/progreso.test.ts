import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { deducirNota } from '../src/logic/nota';
import {
  estadoVacio, grupoDominado, gruposDesbloqueados, grupoSuperado, nivelCasilla, nivelDominio, registrarRespuesta, type EstadoProgreso,
} from '../src/logic/progreso';
import { Almacen, validarEstado, type AlmacenTexto } from '../src/logic/almacen';
import type { Grupo } from '../src/logic/types';
import { verbo } from './ayuda';
const D = (s: string) => new Date(s);

describe('deducirNota', () => {
  it('fallo, medio punto, lento, normal y rápido', () => {
    expect(deducirNota({ modo: 'elegir', resultado: 'fallo', tiempoMs: 1000 })).toBe(Rating.Again);
    expect(deducirNota({ modo: 'completar', resultado: 'repasar', tiempoMs: 1000 })).toBe(Rating.Hard);
    expect(deducirNota({ modo: 'elegir', resultado: 'acierto', tiempoMs: 60000 })).toBe(Rating.Hard);
    expect(deducirNota({ modo: 'elegir', resultado: 'acierto', tiempoMs: 4000 })).toBe(Rating.Good);
    expect(deducirNota({ modo: 'completar', resultado: 'acierto', tiempoMs: 3000 })).toBe(Rating.Easy);
    expect(deducirNota({ modo: 'tablamuda', resultado: 'acierto', tiempoMs: 6000 })).toBe(Rating.Easy);
  });
  it('en Elegir, Emparejar y Al revés, como máximo Good aunque sea rapidísimo', () => {
    expect(deducirNota({ modo: 'elegir', resultado: 'acierto', tiempoMs: 300 })).toBe(Rating.Good);
    expect(deducirNota({ modo: 'emparejar', resultado: 'acierto', tiempoMs: 300 })).toBe(Rating.Good);
    expect(deducirNota({ modo: 'alreves', resultado: 'acierto', tiempoMs: 300 })).toBe(Rating.Good);
  });
});

describe('registrarRespuesta y dominio', () => {
  it('crea la tarjeta, avanza niveles y guarda historial', () => {
    const e = estadoVacio();
    expect(nivelDominio(e.tarjetas.A)).toBe(0);
    registrarRespuesta(e, 'A', 'elegir', 'acierto', 3000, D('2026-11-01T10:00:00Z'));
    expect(nivelDominio(e.tarjetas.A)).toBe(1); // aprendiendo
    registrarRespuesta(e, 'A', 'elegir', 'acierto', 3000, D('2026-11-01T10:15:00Z'));
    expect(nivelDominio(e.tarjetas.A)).toBe(2); // en repaso
    // Varios repasos buenos espaciados: llega a dominado.
    let t = new Date(e.tarjetas.A.due).getTime();
    for (let i = 0; i < 6 && nivelDominio(e.tarjetas.A) < 3; i++) {
      registrarRespuesta(e, 'A', 'completar', 'acierto', 12000, new Date(t));
      t = new Date(e.tarjetas.A.due).getTime();
    }
    expect(nivelDominio(e.tarjetas.A)).toBe(3);
    expect(e.historial.length).toBeGreaterThanOrEqual(3);
    expect(e.historial[0]).toMatchObject({ verbo: 'A', modo: 'elegir', res: 'acierto', nota: Rating.Good });
  });

  it('un fallo en un verbo dominado lo devuelve a aprendiendo', () => {
    const e = estadoVacio();
    let t = D('2026-11-01T10:00:00Z').getTime();
    for (let i = 0; i < 10 && nivelDominio(e.tarjetas.A) < 3; i++) {
      registrarRespuesta(e, 'A', 'completar', 'acierto', 12000, new Date(t));
      t = new Date(e.tarjetas.A.due).getTime();
    }
    registrarRespuesta(e, 'A', 'completar', 'fallo', 12000, new Date(t));
    expect(nivelDominio(e.tarjetas.A)).toBe(1);
  });

  it('examen: cuenta para FSRS (también los fallos, SPEC 4.4) y queda marcado en el historial', () => {
    const e = estadoVacio();
    registrarRespuesta(e, 'A', 'tablamuda', 'fallo', 1000, D('2026-11-01T10:00:00Z'), { examen: true });
    expect(e.tarjetas.A.reps).toBe(1);
    expect(e.historial[0].examen).toBe(true);
    registrarRespuesta(e, 'A', 'tablamuda', 'acierto', 1000, D('2026-11-01T10:01:00Z'), { examen: true });
    expect(e.tarjetas.A.reps).toBe(2);
  });

  it('el historial no crece sin límite', () => {
    const e = estadoVacio();
    for (let i = 0; i < 3100; i++) registrarRespuesta(e, 'A', 'elegir', 'acierto', 1000, new Date(Date.UTC(2026, 10, 1) + i * 60000));
    expect(e.historial.length).toBe(3000);
  });
});

function aprender(e: EstadoProgreso, id: string, hasta: 2 | 3, desde = D('2026-11-01T10:00:00Z')) {
  let t = desde.getTime();
  for (let i = 0; i < 12 && nivelDominio(e.tarjetas[id]) < hasta; i++) {
    registrarRespuesta(e, id, 'completar', 'acierto', 12000, new Date(t));
    t = Math.max(t + 60000, new Date(e.tarjetas[id].due).getTime());
  }
}

describe('grupos', () => {
  const g1 = [verbo('A'), verbo('B')];
  const g2 = [verbo('C', 'g2')];
  const g3 = [verbo('D', 'g3')];
  const grupos: Grupo[] = [
    { id: 'g2', nombre: '2', orden: 2, color: '' },
    { id: 'g1', nombre: '1', orden: 1, color: '' },
    { id: 'g3', nombre: '3', orden: 3, color: '' },
  ];
  const verbosDe = (id: string) => ({ g1, g2, g3 })[id as 'g1'];

  it('solo el primero abierto al principio; el siguiente al superar el anterior', () => {
    const e = estadoVacio();
    expect([...gruposDesbloqueados(e, grupos, verbosDe)]).toEqual(['g1']);
    aprender(e, 'A', 2);
    expect(grupoSuperado(e, g1)).toBe(false);
    aprender(e, 'B', 2);
    expect(grupoSuperado(e, g1)).toBe(true);
    expect([...gruposDesbloqueados(e, grupos, verbosDe)]).toEqual(['g1', 'g2']);
  });

  it('un grupo con algún verbo empezado (por Hoy) también se abre', () => {
    const e = estadoVacio();
    e.aprendizaje.D = { escalon: 0, aciertos: 1, aprendido: false };
    expect([...gruposDesbloqueados(e, grupos, verbosDe)].sort()).toEqual(['g1', 'g3']);
  });

  it('grupo dominado cuando todos sus verbos lo están', () => {
    const e = estadoVacio();
    aprender(e, 'A', 3);
    expect(grupoDominado(e, g1)).toBe(false);
    aprender(e, 'B', 3);
    expect(grupoDominado(e, g1)).toBe(true);
    expect(grupoDominado(e, [])).toBe(false);
  });

  it('color de la casilla según el escalón', () => {
    const e = estadoVacio();
    expect(nivelCasilla(e, 'A')).toBe(0);
    e.aprendizaje.A = { escalon: 1, aciertos: 0, aprendido: false };
    expect(nivelCasilla(e, 'A')).toBe(1);
    e.aprendizaje.A = { escalon: 2, aciertos: 0, aprendido: false };
    expect(nivelCasilla(e, 'A')).toBe(2);
    e.aprendizaje.A.aprendido = true;
    expect(nivelCasilla(e, 'A')).toBe(3);
  });
});

class Memoria implements AlmacenTexto {
  datos = new Map<string, string>();
  fallarAlGuardar = false;
  getItem(k: string) { return this.datos.get(k) ?? null; }
  setItem(k: string, v: string) { if (this.fallarAlGuardar) throw new Error('lleno'); this.datos.set(k, v); }
  removeItem(k: string) { this.datos.delete(k); }
}

describe('Almacen', () => {
  it('guarda y carga', () => {
    const m = new Memoria();
    const a = new Almacen(m);
    const e = estadoVacio();
    registrarRespuesta(e, 'A', 'elegir', 'acierto', 3000, D('2026-11-01T10:00:00Z'));
    expect(a.guardar(e)).toBe(true);
    expect(new Almacen(m).cargar()).toEqual(e);
  });

  it('sin almacenamiento: funciona en memoria', () => {
    const a = new Almacen(null);
    expect(a.disponible).toBe(false);
    expect(a.cargar()).toEqual(estadoVacio());
    expect(a.guardar(estadoVacio())).toBe(false);
  });

  it('si falla al guardar, lo indica y no rompe', () => {
    const m = new Memoria();
    m.fallarAlGuardar = true;
    const a = new Almacen(m);
    expect(a.guardar(estadoVacio())).toBe(false);
    expect(a.disponible).toBe(false);
  });

  it('datos ilegibles: empieza de cero y aparta una copia', () => {
    const m = new Memoria();
    m.datos.set('byheart-progreso', '{roto');
    expect(new Almacen(m).cargar()).toEqual(estadoVacio());
    expect(m.datos.get('byheart-progreso-ilegible')).toBe('{roto');
  });

  it('validarEstado completa campos que falten', () => {
    const e = validarEstado({ version: 1, tarjetas: {} });
    expect(e).toEqual(estadoVacio());
    expect(validarEstado({ version: 2, tarjetas: {} })).toBeNull();
    expect(validarEstado(null)).toBeNull();
  });
});
