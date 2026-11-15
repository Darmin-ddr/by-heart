import datos from './paises.json';
import regionesJson from './regiones.json';
import type { Pais, Region } from '../../src/logic/types';

/**
 * Datos de prueba: los países y regiones de Capitalia, de donde viene la lógica.
 * Sirven para que sus tests sigan comprobándola mientras se adapta a los verbos.
 */
export const paises = datos.paises as unknown as Pais[];
export const regiones = regionesJson as unknown as Region[];
