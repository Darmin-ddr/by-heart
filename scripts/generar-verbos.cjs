// Uso: pdftotext -raw -enc UTF-8 "IRREGULAR VERBS LIST 3ESO.pdf" lista.txt
//      node scripts/generar-verbos.cjs lista.txt .
// Escribe src/data/verbs.json y docs/listas/3eso.md, y comprueba
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

// Familias de verbos que cambian igual. No se enseñan como grupos: sirven para el truco de cada
// verbo, que nombra a otros de su familia ({otros}).
const FAMILIAS = [
  { truco: 'Las tres formas son iguales, como en {otros}.', verbos: 'bet cost cut hit let put read set' },
  { truco: 'Pasado y participio iguales, acabados en -ght, como {otros}.', verbos: 'bring buy catch fight teach think' },
  { truco: 'Pasado y participio iguales, acabados en -d, como {otros}.', verbos: 'have hear lay make pay say sell tell' },
  { truco: 'La vocal doble se queda en una e corta, como en {otros}.', verbos: 'feed feel keep leave meet sleep sweep' },
  { truco: 'Pasado y participio iguales, acabados en -t, como {otros}.', verbos: 'build dream learn lose mean send spend' },
  { truco: 'Cambia la vocal, y pasado y participio son iguales, como en {otros}.', verbos: 'find get hang hold shine sit stand stick understand win' },
  { truco: 'Pasado con a y participio con u, como {otros}.', verbos: 'begin drink ring run sing swim' },
  { truco: 'Pasado con o, y el participio es el pasado más -n o -en, como {otros}.', verbos: 'break choose forget speak steal wake' },
  { truco: 'El participio acaba en -n o -en, como {otros}.', verbos: 'drive eat fall give hide ride see take write' },
  { truco: 'Pasado en -ew y participio en -wn, como {otros}.', verbos: 'draw fly grow know show throw' },
  { truco: null, verbos: 'be become come do go wear' },
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

const familiaDe = new Map();
for (const f of FAMILIAS) for (const v of f.verbos.split(' ')) {
  if (familiaDe.has(v)) throw new Error(`repetido en familias: ${v}`);
  familiaDe.set(v, f);
}
/** "a, b y c": hasta tres verbos de la familia, sin el propio. */
function otrosDe(infinitivo) {
  const otros = familiaDe.get(infinitivo).verbos.split(' ').filter((v) => v !== infinitivo).slice(0, 3);
  return otros.length > 1 ? `${otros.slice(0, -1).join(', ')} y ${otros.at(-1)}` : otros.join('');
}

const errores = [];
for (const [i] of FILAS) if (!CASTELLANO[i]) errores.push(`sin traducción: ${i}`);
const repetidos = Object.values(CASTELLANO).filter((s, i, a) => a.indexOf(s) !== i);
if (repetidos.length) errores.push(`significados repetidos: ${repetidos.join(', ')}`);
// Orden de la app: el del listado (alfabético).
const verbos = FILAS.map(([infinitivo, pasado, participio, significado]) => {
  const f = familiaDe.get(infinitivo);
  if (!f) errores.push(`sin familia: ${infinitivo}`);
  // Comprobación contra el PDF: la fila tal cual y el significado original (salvo los retoques anotados en docs/listas).
  const fila = `To ${infinitivo} ${pasado} ${participio}`;
  if (!plano.includes(fila)) errores.push(`fila no encontrada en el PDF: ${fila}`);
  const sig = significado.replace('significar, ter', 'significar ter').replace(/^facer soar/, 'Facer soar');
  if (!plano.includes(sig) && infinitivo !== 'get') errores.push(`significado no encontrado en el PDF: ${infinitivo}: ${significado}`);
  const texto = TRUCO_PROPIO[infinitivo] ?? (f?.truco ? f.truco.replace('{otros}', otrosDe(infinitivo)) : null);
  return {
    id: infinitivo,
    infinitivo,
    pasado,
    participio,
    variantesPasado: [],
    variantesParticipio: VARIANTES_PARTICIPIO[infinitivo] ?? [],
    significado: CASTELLANO[infinitivo],
    variantesSignificado: [],
    ...(NOTA[infinitivo] ? { nota: NOTA[infinitivo] } : {}),
    trucos: texto ? [{ tipo: 'familia', texto, revisado: false }] : [],
  };
});
for (const v of familiaDe.keys()) if (!verbos.some((x) => x.id === v)) errores.push(`en una familia pero no en el listado: ${v}`);
if (!plano.includes('To get got got / (gotten [Am. Eng]) conseguir, obter')) errores.push('get: fila distinta de la esperada');
if (errores.length) {
  console.error(errores.join('\n'));
  process.exit(1);
}

const fuente =
  "Listado de referencia (no es el de clase): '3ºESO – BASIC 80 IRREGULAR VERBS LIST – INFLUENCE TODAY 3', del IES Alexandre Bóveda (IRREGULAR VERBS LIST 3ESO.pdf). Formas y orden como en el listado; significados traducidos al castellano del original gallego. Ver docs/listas/README.md. Los trucos son propios y están sin revisar por un adulto.";
const lineas = verbos.map((v) => '    ' + JSON.stringify(v)).join(',\n');
fs.writeFileSync(path.join(repo, 'src/data/verbs.json'), `{\n  "fuente": ${JSON.stringify(fuente)},\n  "verbos": [\n${lineas}\n  ]\n}\n`);

const tabla = FILAS.map(([i, p, pp, s], n) => `| ${n + 1} | ${i} | ${p} | ${infinitivoParticipio(i, pp)} | ${CASTELLANO[i]} | ${s} | ${verbos[n].trucos[0]?.texto ?? ''} |`).join('\n');
function infinitivoParticipio(i, pp) {
  return i === 'get' ? 'got / (gotten [Am. Eng])' : pp;
}
fs.writeFileSync(
  path.join(repo, 'docs/listas/3eso.md'),
  `# Listado de referencia: 3º de ESO\n\nTranscripción de \`IRREGULAR VERBS LIST 3ESO.pdf\` (en la raíz del repositorio), con el significado que enseña la app (traducido al castellano), el original gallego del PDF y el truco de cada verbo. Generado y comprobado fila a fila contra el texto del PDF.\n\n| N.º | Infinitivo | Pasado | Participio | Significado en la app | Original (gallego) | Truco |\n| --- | --- | --- | --- | --- | --- | --- |\n${tabla}\n`,
);
console.log(`${verbos.length} verbos; ${verbos.filter((v) => v.trucos.length).length} con truco`);