# Listado de clase

**Fuente de verdad** de qué verbos entran, con qué formas y con qué significado (`SPEC.md`, 3.1).

- **El listado:** `IRREGULAR VERBS LIST 3ESO.pdf` (en la raíz del repositorio), "3ºESO – BASIC 80 IRREGULAR VERBS LIST – INFLUENCE TODAY 3". Recibido el 15/11/2026.
- **Transcripción:** [`3eso.md`](3eso.md), con el grupo que le toca a cada verbo en la app.
- **Datos de la app:** `src/data/verbs.json` y `groups.json`. Los genera `scripts/generar-verbos.cjs`, que comprueba cada fila contra el texto del PDF.

## Lo que hay que saber del listado

- **Son 79 verbos, no 80.** El número 63 lo ocupa una cabecera repetida al cambiar de página; no falta ningún verbo entre *sleep* (62) y *speak* (64).
- **Los significados están en gallego** (*comezar*, *atopar*, *voar*...). La app los enseña tal como están en el listado, aunque sus textos están en castellano. Pendiente de que el responsable lo confirme.

## Retoques al transcribir (solo de forma)

- *mean*: el listado parte el significado en dos líneas sin coma ("querer dicir, significar" / "ter a intención de"); se ha unido con una coma.
- *ring*: "Facer soar" pasa a minúscula, como el resto.
- *get*: el listado da el participio como "got / (gotten [Am. Eng])". En la app se enseña **got** y se acepta también *gotten*.
- *go*: el listado da "gone / been". Se enseña así y se acepta *gone*, *been* o las dos.

## Cosas del listado que parecen erratas (sin tocar: avisar al profesor)

- *tell*: "contar (narracción)", con doble c.
- *forget*: "olvidar" y *hang*: "colgar" son castellano, entre significados en gallego.
- *teach*: "ensinar, aprender (*)", con un asterisco que el listado no explica.

## Pendiente

- **Variantes sin comprobar:** *learned* (por *learnt*) y *dreamed* (por *dreamt*) son habituales, pero no se han podido comprobar en un diccionario (Cambridge y Oxford no dejaron consultar), así que la app **todavía no las acepta**.
- **Grupos:** los 11 grupos por patrón son una propuesta, no vienen del listado.
- **Trucos:** el de cada grupo es propio y está sin revisar por un adulto.

## Antes del listado

El prototipo empezó con seis verbos tomados de *Irregular verbs by groups*, del Colegio Alquería (https://cloud.alqueria.es/wp-content/uploads/sites/11/2024/04/irregular-verbs-by-groups-2.pdf). Ya no se usa.
