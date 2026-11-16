# Listado de verbos

**No hay listado de clase todavía.** La app usa un listado de referencia encontrado en internet; cuando llegue el de clase, lo sustituye y pasa a ser la fuente de verdad (`SPEC.md`, 3.1).

- **Listado de referencia:** `IRREGULAR VERBS LIST 3ESO.pdf` (en la raíz del repositorio), "3ºESO – BASIC 80 IRREGULAR VERBS LIST – INFLUENCE TODAY 3", del aula virtual del IES Alexandre Bóveda (Galicia). Descargado el 15/11/2026.
- **Transcripción:** [`3eso.md`](3eso.md), con el significado que enseña la app, el original del PDF y el grupo de cada verbo.
- **Datos de la app:** `src/data/verbs.json` y `groups.json`. Los genera `scripts/generar-verbos.cjs`, que comprueba cada fila (formas y significado original) contra el texto del PDF.

## Lo que hay que saber del listado

- **Son 79 verbos, no 80.** El número 63 lo ocupa una cabecera repetida al cambiar de página; no falta ningún verbo entre *sleep* (62) y *speak* (64).
- **Formas:** las del listado, tal cual.
- **Significados:** el listado los da en gallego (es material de un instituto gallego). La app los enseña **traducidos al castellano** (decisión del responsable, 16/11/2026). La traducción es propia: se queda con los sentidos principales y evita que dos verbos tengan exactamente el mismo significado (*teach*: "enseñar (a alguien)"; *show*: "mostrar, enseñar (algo)"). Está en `CASTELLANO`, dentro del generador, y conviene que la revise un adulto.

## Retoques al transcribir (solo de forma)

- *get*: el listado da el participio como "got / (gotten [Am. Eng])". En la app se enseña **got** y se acepta también *gotten*.
- *go*: el listado da "gone / been". Se enseña así y se acepta *gone*, *been* o las dos.
- *mean* y *ring*: en el original gallego, una coma añadida y una mayúscula quitada (solo afecta a la comprobación contra el PDF).

## Pendiente

- **El listado de clase**, si lo hay.
- **Variantes sin comprobar:** *learned* (por *learnt*) y *dreamed* (por *dreamt*) son habituales, pero no se han podido comprobar en un diccionario (Cambridge y Oxford no dejaron consultar), así que la app **todavía no las acepta**.
- **Grupos:** los 11 grupos por patrón son una propuesta, no vienen del listado.
- **Trucos:** el de cada grupo es propio y está sin revisar por un adulto.

## Antes de este listado

El primer prototipo usó seis verbos de *Irregular verbs by groups*, del Colegio Alquería (https://cloud.alqueria.es/wp-content/uploads/sites/11/2024/04/irregular-verbs-by-groups-2.pdf). Ya no se usa.
