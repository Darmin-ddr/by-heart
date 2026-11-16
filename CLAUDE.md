# Instrucciones para trabajar en este repo

Lee `SPEC.md` antes de empezar cualquier tarea. Es la fuente de verdad del producto; si una tarea la contradice, pregunta antes de implementar.

By Heart nació de una copia de Capitalia, pero el código ya trabaja solo con verbos (`Verbo`): una sola lista, sin grupos. La estructura está en `docs/notas-tecnicas.md`.

## Cómo trabajamos

- El responsable dirige el proyecto (arquitectura, prioridades, revisión y pruebas) pero no es programador experto. Explica las decisiones técnicas de forma breve y concreta, sin jerga innecesaria.
- Trabaja por hitos (`SPEC.md`, sección 13). No adelantes funcionalidades de hitos futuros sin pedirlo.
- Commits pequeños y descriptivos, en español. Se trabaja directamente en `main` y se sube a GitHub a medida que se avanza (decisión del responsable, 15/11/2026).
- Antes de dar algo por terminado: compila, ejecuta los tests y comprueba el resultado en el navegador. Indica qué has probado y qué no.
- Si algo no lo sabes o no lo has verificado, dilo. No inventes datos.

## Reglas de producto que no se negocian

- **No debe parecer infantil.** Público de ESO (14 a 15 años). Sobrio, amable, sin mascotas ni decoración recargada.
- **Sin rachas y sin mecánicas que castiguen.**
- **Sin voz mientras el responsable no lo decida** (`SPEC.md`, 5.5).
- En el fallo: claro pero sin castigo, nunca rojo intenso. Mostrar la respuesta correcta y el truco.
- Celebraciones grandes solo cada diez verbos dominados o al recuperar un fallo.
- Textos de la interfaz en español de España, tono cercano y breve.
- **El estilo visual es el de Capitalia.** No se cambia paleta, tipografía ni componentes sin pedirlo.

## Datos

- **El listado de verbos está en `docs/listas/`.** Ahora es un listado de referencia sacado de internet, no el de clase; cuando llegue el de clase, ese será la fuente de verdad. Si un dato del listado parece erróneo, avisa al responsable; no lo cambies por tu cuenta.
- **Nada que no esté en el listado.** No se añaden verbos por iniciativa propia.
- **Significados en castellano**, aunque el listado los traiga en otro idioma (decisión del responsable, 16/11/2026).
- Formas alternativas válidas (*learnt/learned*): se muestra la del listado y la otra se acepta como variante, solo si es inglés estándar. **Verifícala en un diccionario** (Cambridge u Oxford) y anota la fuente en el commit o en el fichero de datos.
- **Nunca enseñar formas incorrectas**: los distractores son formas reales de otros verbos, no inventadas (*buyed*).
- En inglés, ortografía exacta; en español, tolerante (`SPEC.md`, 3.3).
- Los trucos de memoria deben ser breves, apropiados para la edad y revisables. Si un truco es flojo, mejor no ponerlo.

## Técnica

- PWA estática para GitHub Pages. Nada de servidor ni dependencias de red en tiempo de ejecución.
- Debe funcionar en Safari de iPad/iPhone, Chrome de Android y Chrome de escritorio. Prioriza táctil.
- Persistencia local con manejo de errores (el almacenamiento puede fallar o vaciarse). Claves de guardado siempre con el prefijo `byheart-`: Capitalia vive en el mismo sitio de GitHub Pages y comparte almacén.
- Lógica pura (FSRS, validación de respuestas, selección de preguntas) separada de la interfaz y con tests unitarios.
- Accesibilidad básica: contraste suficiente, objetivos táctiles de 44 px como mínimo, funcionamiento con teclado en PC.
