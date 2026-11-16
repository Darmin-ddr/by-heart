import { describe, expect, it } from 'vitest';
import { corregirForma, corregirVerbo, diferenciaDeUna } from '../src/logic/formas';
import type { Verbo } from '../src/logic/types';

const verbo = (v: Partial<Verbo> & Pick<Verbo, 'infinitivo' | 'pasado' | 'participio'>): Verbo => ({
  id: v.infinitivo,
  variantesPasado: [],
  variantesParticipio: [],
  significado: '',
  variantesSignificado: [],
  trucos: [],
  ...v,
});

const teach = verbo({ infinitivo: 'teach', pasado: 'taught', participio: 'taught' });
const learn = verbo({ infinitivo: 'learn', pasado: 'learnt', participio: 'learnt', variantesPasado: ['learned'], variantesParticipio: ['learned'] });
const be = verbo({ infinitivo: 'be', pasado: 'was / were', participio: 'been' });

describe('corregirForma', () => {
  it('exacta: solo perdona mayúsculas y espacios', () => {
    expect(corregirForma('taught', ['taught']).estado).toBe('bien');
    expect(corregirForma('  Taught ', ['taught']).estado).toBe('bien');
    expect(corregirForma('TAUGHT', ['taught']).estado).toBe('bien');
  });

  it('una letra de diferencia es un casi, no un acierto (SPEC 3.3)', () => {
    const r = corregirForma('tought', ['taught']);
    expect(r.estado).toBe('casi');
    expect(r.correcta).toBe('taught');
    // Señala la "a" de taught.
    expect(r.casi).toEqual({ tipo: 'cambia', marca: [1, 2] });
  });

  it('casi: letra de menos, de más y dos cruzadas', () => {
    expect(corregirForma('taugt', ['taught']).casi).toEqual({ tipo: 'falta', marca: [4, 5] });
    expect(corregirForma('taughht', ['taught']).casi).toEqual({ tipo: 'sobra', marca: null });
    expect(corregirForma('tauhgt', ['taught']).casi).toEqual({ tipo: 'orden', marca: [3, 5] });
    expect(corregirForma('taugh', ['taught']).casi).toEqual({ tipo: 'falta', marca: [5, 6] });
  });

  it('más de una letra es fallo, y lo vacío, vacío', () => {
    expect(corregirForma('teached', ['taught']).estado).toBe('mal');
    expect(corregirForma('thought', ['taught']).estado).toBe('mal');
    expect(corregirForma('   ', ['taught']).estado).toBe('vacia');
  });

  it('acepta las variantes, pero enseña la forma del listado', () => {
    expect(corregirForma('learned', ['learnt', 'learned'])).toEqual({ estado: 'bien', correcta: 'learnt' });
    // Un casi se compara con la forma a la que se parece; si se parece a las dos, con la del listado.
    expect(corregirForma('lerned', ['learnt', 'learned'])).toMatchObject({ estado: 'casi', correcta: 'learned' });
    expect(corregirForma('learnd', ['learnt', 'learned'])).toMatchObject({ estado: 'casi', correcta: 'learnt' });
  });

  it('el "to" delante solo se perdona en el infinitivo', () => {
    expect(corregirForma('to teach', ['teach'], true).estado).toBe('bien');
    expect(corregirForma('To  Teach', ['teach'], true).estado).toBe('bien');
    expect(corregirForma('to taught', ['taught']).estado).toBe('mal');
  });

  it('formas dobles: las dos, en cualquier orden y con cualquier separador', () => {
    for (const texto of ['was / were', 'was/were', 'were / was', 'was were', 'was, were', 'was y were', 'Was and Were']) {
      expect(corregirForma(texto, ['was / were']).estado, texto).toBe('bien');
    }
    expect(corregirForma('was', ['was / were']).estado).toBe('mal');
    expect(corregirForma('was / was', ['was / were']).estado).toBe('mal');
  });
});

describe('diferenciaDeUna', () => {
  it('nada si son iguales o difieren en más de una letra', () => {
    expect(diferenciaDeUna('sang', 'sang')).toBeNull();
    expect(diferenciaDeUna('bought', 'brought')).toEqual({ tipo: 'falta', marca: [1, 2] });
    expect(diferenciaDeUna('buyed', 'bought')).toBeNull();
    expect(diferenciaDeUna('sang', 'sung')).toEqual({ tipo: 'cambia', marca: [1, 2] });
  });
});

describe('corregirVerbo', () => {
  it('Completar: pasado y participio', () => {
    const r = corregirVerbo(teach, { pasado: 'taught', participio: 'taught' });
    expect(r.acierto).toBe(true);
    expect(r.casi).toBe(false);
    expect(r.infinitivo).toBeUndefined();
  });

  it('un casi no es acierto, pero se distingue de un fallo', () => {
    const casi = corregirVerbo(teach, { pasado: 'taught', participio: 'tought' });
    expect(casi).toMatchObject({ acierto: false, casi: true });
    const mal = corregirVerbo(teach, { pasado: 'tought', participio: 'teached' });
    expect(mal).toMatchObject({ acierto: false, casi: false });
    expect(mal.pasado.estado).toBe('casi');
    expect(mal.participio.estado).toBe('mal');
  });

  it('Tabla muda: también el infinitivo', () => {
    expect(corregirVerbo(teach, { infinitivo: 'to teach', pasado: 'taught', participio: 'taught' }).acierto).toBe(true);
    const r = corregirVerbo(teach, { infinitivo: '', pasado: 'taught', participio: 'taught' });
    expect(r.acierto).toBe(false);
    expect(r.casi).toBe(false);
    expect(r.infinitivo?.estado).toBe('vacia');
  });

  it('variantes y formas dobles', () => {
    expect(corregirVerbo(learn, { pasado: 'learned', participio: 'learnt' }).acierto).toBe(true);
    expect(corregirVerbo(be, { pasado: 'were, was', participio: 'been' }).acierto).toBe(true);
  });
});
