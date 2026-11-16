import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Accesibilidad básica (CLAUDE.md): contraste suficiente entre texto y fondo
 * en modo claro y oscuro. Se leen los colores de las variables de estilos.css.
 * Criterio WCAG AA: 4,5:1 para texto normal; 3:1 para texto grande o en negrita
 * grande y para elementos gráficos (bordes de botones).
 */
const css = readFileSync(new URL('../src/ui/estilos.css', import.meta.url), 'utf8');

function variables(bloque: string): Record<string, string> {
  return Object.fromEntries([...bloque.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]));
}
const claro = variables(css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: dark)')));
const oscuro = { ...claro, ...variables(css.slice(css.indexOf('@media (prefers-color-scheme: dark)'), css.indexOf('* {'))) };

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// [texto, fondo, mínimo, descripción]
const PARES: [string, string, number, string][] = [
  ['texto', 'fondo', 4.5, 'texto general'],
  ['texto', 'superficie', 4.5, 'texto en el panel'],
  ['texto-suave', 'superficie', 4.5, 'texto secundario en el panel'],
  ['texto-suave', 'fondo', 4.5, 'texto secundario sobre el fondo'],
  ['acento-texto', 'acento', 4.5, 'botón principal y pestaña activa'],
  ['acento', 'superficie', 4.5, 'enlaces (Inventa tu truco)'],
  ['acierto', 'superficie', 4.5, 'mensaje de acierto'],
  ['fallo', 'superficie', 4.5, 'mensaje de fallo'],
  ['texto', 'acierto-fondo', 4.5, 'opción correcta'],
  ['texto', 'fallo-fondo', 4.5, 'opción fallada y avisos'],
  ['texto', 'objetivo', 4.5, 'verbo resaltado y casilla de la pregunta'],
  ['texto', 'casilla', 4.5, 'verbo en una casilla sin progreso'],
  ['texto', 'acierto-casilla', 4.5, 'verbo en una casilla acertada'],
  ['texto', 'fallo-casilla', 4.5, 'verbo en una casilla fallada'],
  ['acierto', 'superficie', 3, 'borde de la opción correcta'],
  ['fallo', 'superficie', 3, 'borde de la opción fallada'],
];

describe('contraste (WCAG AA)', () => {
  for (const [nombre, tema] of [['claro', claro], ['oscuro', oscuro]] as const) {
    for (const [t, f, minimo, desc] of PARES) {
      it(`${nombre}: ${desc} (${t} sobre ${f}) >= ${minimo}`, () => {
        expect(tema[t], `falta --${t}`).toBeDefined();
        expect(tema[f], `falta --${f}`).toBeDefined();
        expect(contraste(tema[t], tema[f])).toBeGreaterThanOrEqual(minimo);
      });
    }
  }

  it('texto oscuro sobre el color de cada grupo (casillas aprendidas y chips)', () => {
    const grupos: { color: string; nombre: string }[] = JSON.parse(readFileSync(new URL('../src/data/groups.json', import.meta.url), 'utf8'));
    for (const g of grupos) expect(contraste('#1f2a37', g.color), g.nombre).toBeGreaterThanOrEqual(4.5);
  });
});
