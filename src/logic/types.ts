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
  /** Como en el listado de clase. */
  significado: string;
  variantesSignificado: string[];
  nota?: string;
  trucos: Truco[];
}

