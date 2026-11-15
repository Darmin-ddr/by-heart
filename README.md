# By Heart

**Aprende de memoria los verbos irregulares en inglés, unos minutos al día.**

> **En construcción.** La app ya abre con su nombre y su aspecto, pero todavía no tiene verbos. El plan está en [`SPEC.md`](SPEC.md), sección 13.

## Qué será

Una app para aprender los verbos irregulares en inglés (infinitivo, pasado, participio y significado), pensada para estudiantes de secundaria. Sirve para practicar un poco cada día y para preparar un examen. Más adelante, también phrasal verbs.

En lugar de leer la tabla una y otra vez, la app te hace **recordar** los verbos, y decide qué preguntarte cada día para que no se te olviden.

- **Hoy:** diez minutos al día, con repaso espaciado y unos pocos verbos nuevos.
- **Aprender:** cada verbo sube cuatro escalones, de elegir entre opciones a escribir las tres formas de memoria.
- **Examen de prueba:** una tabla con huecos, como la de clase, con nota.
- **Fallar no castiga:** ves la respuesta y el truco, y el verbo vuelve a salir al rato. No hay rachas ni puntos que perder.
- **Varios alumnos en el mismo dispositivo** y un **panel para adultos** con PIN.

## Privacidad

Todo se guarda **solo en tu dispositivo**. No hay cuentas, no se envían datos a ningún servidor y no hay publicidad ni seguimiento.

## Créditos

Creada por Darmin-ddr, con la ayuda de Claude (Anthropic).

- Hecha a partir de [Capitalia](https://github.com/Darmin-ddr/capitalia), del mismo autor: de ella vienen la forma de enseñar, el aspecto y buena parte del código.
- Repaso espaciado: algoritmo FSRS, librería [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT).
- Tipografía: Nunito (SIL Open Font License).

## Licencia

El código es libre bajo la [licencia MIT](LICENSE).

---

## Para desarrolladores

App web estática (PWA) hecha con Vite y TypeScript, sin framework.

```bash
npm install
npm run dev      # servidor de desarrollo
npm test         # tests de la lógica
npm run build    # compilación para publicar (carpeta dist/)
```

La publicación en GitHub Pages (`.github/workflows/pages.yml`) está de momento **solo a mano**, hasta que la app tenga contenido.

Documentación del proyecto:

- [`SPEC.md`](SPEC.md): especificación del producto (fuente de verdad).
- [`CLAUDE.md`](CLAUDE.md): normas de trabajo.
- [`docs/notas-tecnicas.md`](docs/notas-tecnicas.md): estructura del código y cómo probar.
- [`docs/capitalia/`](docs/capitalia/): documentos heredados de Capitalia (historial y decisiones del diseño de Hoy, Aprender y Examen), como referencia.
- `docs/listas/`: aquí irá el listado de clase con los verbos.
