export type Continente = 'europa' | 'asia';

export type TipoTruco = 'historia' | 'palabras' | 'comparacion' | 'familia';

export interface Truco {
  tipo: TipoTruco;
  texto: string;
  /** false mientras un adulto no lo haya revisado. */
  revisado?: boolean;
}

/** Un verbo irregular, tal como está en `verbs.json` (SPEC 12). */
export interface Verbo {
  /** El infinitivo, sin "to". */
  id: string;
  infinitivo: string;
  pasado: string;
  participio: string;
  /** Otras formas aceptadas (learnt/learned). */
  variantesPasado: string[];
  variantesParticipio: string[];
  /** En español, como en el listado de clase. */
  significado: string;
  variantesSignificado: string[];
  grupo: string;
  nota?: string;
  trucos: Truco[];
}

/** Grupo de verbos por patrón (`groups.json`). */
export interface Grupo {
  id: string;
  nombre: string;
  orden: number;
  color: string;
}

/**
 * Tipo heredado de Capitalia. La lógica y las pantallas aún trabajan con él: los
 * verbos les llegan convertidos (`logic/verbos.ts`), con el infinitivo en `nombre`
 * y las formas en `capital`.
 */
export interface Pais {
  /** ISO 3166-1 alfa-3 (Kosovo usa XKX, código provisional habitual). */
  id: string;
  /** ISO 3166-1 numérico, para enlazar con las formas del mapa (world-atlas). */
  isoNumerico: string | null;
  nombre: string;
  capital: string;
  /** Significado en español (solo en los verbos). */
  significado?: string;
  variantes: string[];
  /** Nombres de país equivalentes, aceptados sin aviso al escribir el país (Chequia, Myanmar...). */
  variantesPais?: string[];
  /** Nombres de país aceptados con aviso (Holanda). */
  avisosPais?: string[];
  antiguos: string[];
  continentes: Continente[];
  region: string;
  /**
   * Regiones de otro continente en las que también aparece (transcontinentales:
   * Rusia y Turquía salen en un mapa de Europa y en otro de Asia, con una sola tarjeta).
   */
  regionesExtra?: string[];
  /** [longitud, latitud] */
  capitalCoords: [number, number];
  geonamesId?: number;
  opcional: boolean;
  nota?: string;
  trucos: Truco[];
}

export interface Region {
  id: string;
  nombre: string;
  continente: Continente;
  orden: number;
  color: string;
}
