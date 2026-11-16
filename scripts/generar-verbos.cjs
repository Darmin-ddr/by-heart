// Uso: pdftotext -raw -enc UTF-8 "IRREGULAR VERBS LIST 3ESO.pdf" lista.txt
//      node scripts/generar-verbos.cjs lista.txt .
// Escribe src/data/verbs.json, src/data/groups.json y docs/listas/3eso.md, y comprueba
// cada fila contra el texto extraído del PDF.
const fs = require('fs');
const path = require('path');
const [rawPath, repo] = process.argv.slice(2);
const raw = fs.readFileSync(rawPath, 'utf8').replace(/\r/g, '');
const plano = raw.replace(/\n/g, ' ').replace(/\s+/g, ' ');

// infinitivo | pasado | participio | significado original (en gallego, como en el PDF: sirve para comprobar la transcripción)
const FILAS = `
be|was / were|been|ser / estar
become|became|become|chegar a ser, converterse en
begin|began|begun|comezar
bet|bet|bet|apostar
break|broke|broken|romper, rachar, escachar
bring|brought|brought|traer
build|built|built|edificar, construir
buy|bought|bought|comprar, mercar
catch|caught|caught|coller, atrapar
choose|chose|chosen|escoller, elixir
come|came|come|vir
cost|cost|cost|custar, valer
cut|cut|cut|cortar
do|did|done|facer (mentalmente)
draw|drew|drawn|debuxar, atraer, empatar
dream|dreamt|dreamt|soñar
drink|drank|drunk|beber
drive|drove|driven|conducir
eat|ate|eaten|comer
fall|fell|fallen|caer
feed|fed|fed|alimentar, dar de comer
feel|felt|felt|sentir
fight|fought|fought|loitar, pelexar, combater
find|found|found|atopar, encontrar
fly|flew|flown|voar
forget|forgot|forgotten|olvidar, esquecer
get|got|got|conseguir, obter
give|gave|given|dar
go|went|gone / been|ir
grow|grew|grown|medrar, crecer, cultivar
hang|hung|hung|colgar, pendurar
have|had|had|ter, tomar, haber
hear|heard|heard|oír, ouvir, sentir
hide|hid|hidden|esconder, agochar
hit|hit|hit|golpear, bater, pegar, chocar
hold|held|held|soster, termar, agarrar
keep|kept|kept|gardar, conservar
know|knew|known|saber, coñecer (algo)
lay|laid|laid|estender, cubrir
learn|learnt|learnt|aprender
leave|left|left|saír, abandonar, marchar
let|let|let|permitir, deixar
lose|lost|lost|perder
make|made|made|facer manipulando, fabricar
mean|meant|meant|querer dicir, significar, ter a intención de
meet|met|met|quedar con alguén, coñecer (alguén)
pay|paid|paid|pagar
put|put|put|pór, poñer
read|read|read|ler
ride|rode|ridden|montar, conducir, subir nun medio de transporte
ring|rang|rung|facer soar, chamar por teléfono, timbrar
run|ran|run|correr
say|said|said|dicir
see|saw|seen|ver
sell|sold|sold|vender
send|sent|sent|enviar
set|set|set|poñerse o sol, callar, colocar
shine|shone|shone|brillar, relucir, resplandecer
show|showed|shown|amosar, mostrar, ensinar
sing|sang|sung|cantar
sit|sat|sat|sentar
sleep|slept|slept|durmir
speak|spoke|spoken|falar
spend|spent|spent|gastar diñeiro, pasar tempo
stand|stood|stood|estar ou poñerse de pé
steal|stole|stolen|roubar
stick|stuck|stuck|colar, pegar, cravar, espetar
sweep|swept|swept|varrer
swim|swam|swum|nadar
take|took|taken|coller, tomar, agarrar
teach|taught|taught|ensinar, aprender (*)
tell|told|told|dicir, contar (narracción)
think|thought|thought|pensar, crer
throw|threw|thrown|lanzar, tirar, botar
understand|understood|understood|entender, comprender
wake|woke|woken|espertar, acordar
wear|wore|worn|levar posto, vestir
win|won|won|gañar (azar, competición)
write|wrote|written|escribir
`.trim().split('\n').map((l) => l.split('|'));

const GRUPOS = [
  { id: 'iguales', nombre: 'Las tres iguales', color: '#f2cf92', truco: 'Las tres formas son iguales.', verbos: 'bet cost cut hit let put read set' },
  { id: 'ght', nombre: 'Acaban en -ght', color: '#c8b6e2', truco: 'Pasado y participio iguales, acabados en -ought (con o).', verbos: 'bring buy catch fight teach think' },
  { id: 'd', nombre: 'Pasado y participio en -d', color: '#ece28f', truco: 'Pasado y participio iguales, acabados en -d.', verbos: 'have hear lay make pay say sell tell' },
  { id: 'e-corta', nombre: 'De ee o ea a una e', color: '#f0b8cc', truco: 'La vocal doble se queda en una e. Pasado y participio iguales.', verbos: 'feed feel keep leave meet sleep sweep' },
  { id: 't', nombre: 'Pasado y participio en -t', color: '#cdd69a', truco: 'Pasado y participio iguales, acabados en -t.', verbos: 'build dream learn lose mean send spend' },
  { id: 'vocal', nombre: 'Cambian por dentro', color: '#dcc2a4', truco: 'Cambia por dentro, y pasado y participio son iguales.', verbos: 'find get hang hold shine sit stand stick understand win' },
  { id: 'a-u', nombre: 'Pasado con a, participio con u', color: '#b9d5d6', truco: 'Pasado con a, participio con u: sing, sang, sung.', verbos: 'begin drink ring run sing swim' },
  { id: 'o-en', nombre: 'Pasado con o, participio en -en', color: '#c4cfae', truco: 'Pasado con o; el participio sale del pasado y acaba en -en.', verbos: 'break choose forget speak steal wake' },
  { id: 'en', nombre: 'Participio en -en', color: '#f2cf92', truco: 'El participio acaba en -en.', verbos: 'drive eat fall give hide ride see take write' },
  { id: 'wn', nombre: 'Participio en -wn', color: '#c8b6e2', truco: 'Pasado en -ew, participio en -wn.', verbos: 'draw fly grow know show throw' },
  { id: 'suyos', nombre: 'A su manera', color: '#f0b8cc', truco: null, verbos: 'be become come do go wear' },
];

// Trucos y datos propios de algún verbo (sustituyen al del grupo).
const TRUCO_PROPIO = {
  teach: 'Teach lleva a: taught, con au. Igual que catch, caught.',
  catch: 'Catch lleva a: caught, con au. Igual que teach, taught.',
  run: 'Pasado con a (ran); el participio vuelve a ser run.',
  show: 'El pasado es regular (showed); el participio, shown.',
};
const NOTA = { read: 'Se escribe igual en las tres, pero el pasado y el participio suenan como "red".' };
// Variantes: solo las que da el propio listado. learned y dreamed quedan pendientes de comprobar en un diccionario.
const VARIANTES_PARTICIPIO = { get: ['gotten'], go: ['gone', 'been'] };

// Significado que enseña la app: traducción al castellano del original gallego (propia, revisable).
// Se queda con los sentidos principales y evita que dos verbos tengan el mismo significado.
const CASTELLANO = {
  be: 'ser, estar', become: 'llegar a ser, convertirse en', begin: 'empezar, comenzar', bet: 'apostar',
  break: 'romper', bring: 'traer', build: 'construir, edificar', buy: 'comprar', catch: 'coger, atrapar',
  choose: 'elegir, escoger', come: 'venir', cost: 'costar, valer', cut: 'cortar', do: 'hacer',
  draw: 'dibujar', dream: 'soñar', drink: 'beber', drive: 'conducir', eat: 'comer', fall: 'caer',
  feed: 'alimentar, dar de comer', feel: 'sentir', fight: 'luchar, pelear', find: 'encontrar',
  fly: 'volar', forget: 'olvidar', get: 'conseguir, obtener', give: 'dar', go: 'ir',
  grow: 'crecer, cultivar', hang: 'colgar', have: 'tener, haber, tomar', hear: 'oír',
  hide: 'esconder', hit: 'golpear, pegar', hold: 'sujetar, agarrar', keep: 'guardar, conservar',
  know: 'saber, conocer', lay: 'extender, tender (poner la mesa)', learn: 'aprender',
  leave: 'salir, dejar, marcharse', let: 'dejar, permitir', lose: 'perder', make: 'hacer, fabricar',
  mean: 'significar, querer decir', meet: 'quedar con alguien, conocer (a alguien)', pay: 'pagar',
  put: 'poner', read: 'leer', ride: 'montar (a caballo, en bici)', ring: 'sonar, llamar (por teléfono)',
  run: 'correr', say: 'decir', see: 'ver', sell: 'vender', send: 'enviar',
  set: 'colocar, fijar; ponerse (el sol)', shine: 'brillar', show: 'mostrar, enseñar (algo)',
  sing: 'cantar', sit: 'sentarse', sleep: 'dormir', speak: 'hablar', spend: 'gastar (dinero), pasar (tiempo)',
  stand: 'estar de pie, ponerse de pie', steal: 'robar', stick: 'pegar, clavar', sweep: 'barrer',
  swim: 'nadar', take: 'coger, tomar, llevar', teach: 'enseñar (a alguien)', tell: 'contar, decir (a alguien)',
  think: 'pensar, creer', throw: 'lanzar, tirar', understand: 'entender, comprender',
  wake: 'despertar(se)', wear: 'llevar puesto', win: 'ganar', write: 'escribir',
};

const grupoDe = new Map();
for (const g of GRUPOS) for (const v of g.verbos.split(' ')) {
  if (grupoDe.has(v)) throw new Error(`repetido en grupos: ${v}`);
  grupoDe.set(v, g);
}

const errores = [];
for (const [i] of FILAS) if (!CASTELLANO[i]) errores.push(`sin traducción: ${i}`);
const repetidos = Object.values(CASTELLANO).filter((s, i, a) => a.indexOf(s) !== i);
if (repetidos.length) errores.push(`significados repetidos: ${repetidos.join(', ')}`);
const verbos = FILAS.map(([infinitivo, pasado, participio, significado]) => {
  const g = grupoDe.get(infinitivo);
  if (!g) errores.push(`sin grupo: ${infinitivo}`);
  // Comprobación contra el PDF: la fila tal cual y el significado original (salvo los retoques anotados en docs/listas).
  const fila = `To ${infinitivo} ${pasado} ${participio}`;
  if (!plano.includes(fila)) errores.push(`fila no encontrada en el PDF: ${fila}`);
  const sig = significado.replace('significar, ter', 'significar ter').replace(/^facer soar/, 'Facer soar');
  if (!plano.includes(sig) && infinitivo !== 'get') errores.push(`significado no encontrado en el PDF: ${infinitivo}: ${significado}`);
  const texto = TRUCO_PROPIO[infinitivo] ?? g?.truco ?? null;
  return {
    id: infinitivo,
    infinitivo,
    pasado,
    participio,
    variantesPasado: [],
    variantesParticipio: VARIANTES_PARTICIPIO[infinitivo] ?? [],
    significado: CASTELLANO[infinitivo],
    variantesSignificado: [],
    grupo: g?.id,
    ...(NOTA[infinitivo] ? { nota: NOTA[infinitivo] } : {}),
    trucos: texto ? [{ tipo: 'familia', texto, revisado: false }] : [],
  };
});
for (const v of grupoDe.keys()) if (!verbos.some((x) => x.id === v)) errores.push(`en un grupo pero no en el listado: ${v}`);
if (!plano.includes('To get got got / (gotten [Am. Eng]) conseguir, obter')) errores.push('get: fila distinta de la esperada');
if (errores.length) {
  console.error(errores.join('\n'));
  process.exit(1);
}

// Dentro de cada grupo, orden alfabético; los grupos, en el orden del curso.
const orden = new Map(GRUPOS.map((g, i) => [g.id, i]));
verbos.sort((a, b) => orden.get(a.grupo) - orden.get(b.grupo) || a.id.localeCompare(b.id));

const fuente =
  "Listado de referencia (no es el de clase): '3ºESO – BASIC 80 IRREGULAR VERBS LIST – INFLUENCE TODAY 3', del IES Alexandre Bóveda (IRREGULAR VERBS LIST 3ESO.pdf). Formas como en el listado; significados traducidos al castellano del original gallego. Ver docs/listas/README.md. Los grupos y los trucos son propios; los trucos están sin revisar por un adulto.";
const lineas = verbos.map((v) => '    ' + JSON.stringify(v)).join(',\n');
fs.writeFileSync(path.join(repo, 'src/data/verbs.json'), `{\n  "fuente": ${JSON.stringify(fuente)},\n  "verbos": [\n${lineas}\n  ]\n}\n`);
fs.writeFileSync(
  path.join(repo, 'src/data/groups.json'),
  '[\n' + GRUPOS.map((g, i) => '  ' + JSON.stringify({ id: g.id, nombre: g.nombre, orden: i + 1, color: g.color })).join(',\n') + '\n]\n',
);

const tabla = FILAS.map(([i, p, pp, s], n) => `| ${n + 1} | ${i} | ${p} | ${infinitivoParticipio(i, pp)} | ${CASTELLANO[i]} | ${s} | ${grupoDe.get(i).nombre} |`).join('\n');
function infinitivoParticipio(i, pp) {
  return i === 'get' ? 'got / (gotten [Am. Eng])' : pp;
}
fs.writeFileSync(
  path.join(repo, 'docs/listas/3eso.md'),
  `# Listado de referencia: 3º de ESO\n\nTranscripción de \`IRREGULAR VERBS LIST 3ESO.pdf\` (en la raíz del repositorio), con el significado que enseña la app (traducido al castellano), el original gallego del PDF y el grupo de cada verbo en la app. Generado y comprobado fila a fila contra el texto del PDF.\n\n| N.º | Infinitivo | Pasado | Participio | Significado en la app | Original (gallego) | Grupo en la app |\n| --- | --- | --- | --- | --- | --- | --- |\n${tabla}\n`,
);
console.log(`${verbos.length} verbos en ${GRUPOS.length} grupos: ` + GRUPOS.map((g) => `${g.id} ${g.verbos.split(' ').length}`).join(', '));
