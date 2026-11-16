import type { Verbo } from '../logic/types';
import { tresFormas } from '../logic/verbos';
import { boton, el, enterPulsaPrincipal, rellenar } from './dom';

export interface DatosGuia {
  /** Un verbo de los que está aprendiendo, sin truco propio, para el taller de trucos. */
  verboParaTaller(): Verbo | null;
  /** Guarda un truco propio (como "Inventa tu truco" en Explorar). */
  guardarTruco(verboId: string, texto: string): void;
  /** Se llama al cerrar la guía (para no volver a abrirla sola). */
  alCerrar(): void;
  /** Botón final: empezar a repasar. */
  alEmpezar(): void;
}

interface Paso {
  titulo: string;
  pintar(zona: HTMLElement): void;
}

const p = (...hijos: (Node | string)[]) => el('p', '', ...hijos);
const fuerte = (t: string) => el('strong', '', t);

/**
 * Guía para el alumno: cómo usar la app y, sobre todo, cómo aprender con
 * ella (práctica de recuerdo, repaso espaciado, errores, dificultad deseable,
 * trucos de memoria). Con dos partes interactivas: una pregunta y un taller
 * para fabricar un truco propio.
 */
export function crearGuia(datos: DatosGuia): () => void {
  const dialogo = el('dialog', 'dialogo dialogo-guia');
  dialogo.setAttribute('aria-label', 'Cómo aprender con By Heart');
  document.body.append(dialogo);
  enterPulsaPrincipal(dialogo);
  dialogo.addEventListener('close', () => datos.alCerrar());
  let indice = 0;

  const pasos: Paso[] = [
    {
      titulo: 'Verbos sin empollar',
      pintar(z) {
        z.append(
          p('Aquí no se trata de leer la tabla de verbos mil veces. Se trata de ', fuerte('sacar las formas de tu cabeza'), ', un poco cada día, hasta que salgan solas.'),
          p('En dos minutos te cuento cómo funciona y cómo sacarle el máximo partido. Puedes volver a esta guía cuando quieras desde el botón ⋯.'),
          el(
            'ul',
            'lista-guia',
            el('li', '', fuerte('Hoy'), ': lo que toca hoy, repasos y unos pocos verbos nuevos. Es lo único imprescindible.'),
            el('li', '', fuerte('Aprender'), ': para avanzar a tu ritmo, de pocos en pocos verbos.'),
            el('li', '', fuerte('Examen'), ': una tabla con huecos como la de clase, para comprobar cómo lo llevas.'),
            el('li', '', fuerte('Explorar'), ': para mirar la tabla con calma e inventar tus trucos.'),
          ),
        );
      },
    },
    {
      titulo: 'Poco y a menudo',
      pintar(z) {
        const respuesta = el('div', 'respuesta-guia');
        const opciones = el('div', 'opciones');
        const elegir = (bien: boolean, b: HTMLButtonElement) => {
          for (const x of opciones.querySelectorAll('button')) x.disabled = true;
          b.classList.add(bien ? 'correcta' : 'elegida-mal');
          respuesta.className = `respuesta-guia feedback ${bien ? 'acierto' : 'fallo'}`;
          rellenar(
            respuesta,
            el('p', 'feedback-titulo', bien ? '¡Eso es!' : 'Parece lógico, pero no.'),
            p(
              'Repartir el estudio en varios días funciona mucho mejor que darse un atracón, aunque el tiempo total sea el mismo. ',
              'Entre un repaso y otro, tu memoria "consolida" lo aprendido, sobre todo mientras duermes.',
            ),
          );
        };
        const a = boton('Una hora seguida el domingo', 'opcion', () => elegir(false, a));
        const b = boton('Diez minutos cada día', 'opcion', () => elegir(true, b));
        opciones.append(a, b);
        z.append(p('Tienes una hora para estudiar los verbos esta semana. ¿Qué crees que funciona mejor?'), opciones, respuesta);
      },
    },
    {
      titulo: 'La app decide cuándo repasar',
      pintar(z) {
        z.append(
          p(
            'Cada vez que respondes, la app calcula cuándo estás a punto de olvidar ese verbo y te lo vuelve a preguntar justo entonces. ',
            'Lo que te sabes bien sale cada vez menos; lo que te cuesta, más a menudo.',
          ),
          p('Por eso en ', fuerte('Hoy'), ' no tienes que decidir nada: entra, responde lo que te salga y ya está. Unos diez minutos al día bastan. Cada día entran unos pocos verbos nuevos, mezclados con los repasos.'),
          p(
            'La cuadrícula es tu marcador: cada verbo se va coloreando a medida que lo dominas. Cada diez verbos dominados, lo celebramos.',
          ),
        );
      },
    },
    {
      titulo: 'Fallar también es aprender',
      pintar(z) {
        z.append(
          p(
            'Intentar recordar, aunque falles, deja más huella que releer la respuesta. Lo importante es el esfuerzo de ',
            fuerte('buscar en tu memoria'),
            '.',
          ),
          el(
            'ul',
            'lista-guia',
            el('li', '', 'Piensa tu respuesta ', fuerte('antes'), ' de mirar las opciones.'),
            el('li', '', 'Si no lo sabes, arriésgate: un fallo seguido de la respuesta correcta se recuerda muy bien.'),
            el('li', '', 'Cuando fallas, lee la forma correcta y el truco. Ese verbo volverá a salir en unos minutos.'),
            el('li', '', 'Recuperar un verbo que habías fallado es el mejor momento de todos. Por eso también lo celebramos.'),
          ),
        );
      },
    },
    {
      titulo: 'Cuanto más difícil, mejor (sin pasarse)',
      pintar(z) {
        z.append(
          p('Cada verbo sube por cuatro escalones, de más fácil a más difícil:'),
          el(
            'ol',
            'lista-guia',
            el('li', '', fuerte('Elegir'), ': reconocer el verbo por su significado.'),
            el('li', '', fuerte('Emparejar'), ': unir cada verbo con sus formas.'),
            el('li', '', fuerte('Completar'), ': escribir el pasado y el participio.'),
            el('li', '', fuerte('Tabla muda'), ': a partir del significado, escribir las tres formas, como en el examen.'),
          ),
          p(
            'Las preguntas que cuestan un poco son las que más enseñan. Un verbo sube de escalón cuando lo aciertas dos veces con otras preguntas por medio; al pasar el último, ya es tuyo y queda para repasar de vez en cuando. ',
            'Al escribir, la ortografía cuenta, como en el examen: si se te escapa una letra, te avisamos de cuál era (y el verbo volverá a salir).',
          ),
        );
      },
    },
    {
      titulo: 'Fabrica tus propios trucos',
      pintar(z) {
        z.append(
          p('Un buen truco te ayuda a recordar cómo cambia un verbo. Los que inventas tú se recuerdan mucho mejor que los que te dan hechos. Algunas técnicas:'),
          el(
            'ul',
            'lista-guia',
            el('li', '', fuerte('Familias.'), ' Fíjate en los que cambian igual: sing, sang, sung; ring, rang, rung; drink, drank, drunk. El truco de cada verbo te dice cuáles son de su familia.'),
            el('li', '', fuerte('Fíjate en la diferencia.'), ' Dentro de una familia, busca lo que cambia: bought y brought solo se diferencian en una r; taught y caught llevan au, thought y fought, ou.'),
            el('li', '', fuerte('Sonido o rima.'), ' Di las tres formas en voz alta, con ritmo, como una canción: "buy, bought, bought".'),
            el('li', '', fuerte('Una frase con las tres.'), ' Inventa una frase corta que las use: "I buy bread; yesterday I bought it; I have bought it every day".'),
            el('li', '', fuerte('Tuyo y corto.'), ' Una frase que entiendas tú. Si te hace gracia, mejor.'),
          ),
        );
      },
    },
    {
      titulo: 'Taller: tu primer truco',
      pintar(z) {
        const verbo = datos.verboParaTaller();
        if (!verbo) {
          z.append(p('Ya tienes trucos propios para todos los verbos que estás aprendiendo. ¡Bien hecho! Puedes cambiarlos cuando quieras en Explorar.'));
          return;
        }
        const formas = tresFormas(verbo);
        const parecido = el('input', 'campo-texto');
        parecido.placeholder = `${verbo.infinitivo} cambia como...`;
        parecido.setAttribute('aria-label', `¿A qué otro verbo se parece ${verbo.infinitivo}?`);
        const frase = el('textarea', 'campo-truco');
        frase.rows = 2;
        frase.maxLength = 160;
        frase.placeholder = 'Una frase o una imagen que te ayude a recordarlo';
        frase.setAttribute('aria-label', `Tu truco para ${verbo.infinitivo}`);
        const mensaje = el('p', 'mensaje-copia');
        mensaje.setAttribute('role', 'status');
        const guardar = boton('Guardar mi truco', 'boton-principal', () => {
          const texto = frase.value.trim();
          if (!texto) {
            mensaje.textContent = 'Escribe primero tu truco.';
            frase.focus();
            return;
          }
          datos.guardarTruco(verbo.id, texto);
          guardar.disabled = true;
          mensaje.textContent = `Guardado. Te saldrá cuando falles ${verbo.infinitivo}, y puedes cambiarlo en Explorar.`;
        });
        z.append(
          p('Vamos con uno de los que estás aprendiendo: ', fuerte(formas), ` (${verbo.significado}).`),
          el('label', 'etiqueta-guia', '1. ¿A qué otro verbo se parece? (uno que cambie igual, o casi)', parecido),
          el('label', 'etiqueta-guia', '2. Escribe una frase o una imagen que te ayude a recordar sus formas:', frase),
          el('div', 'acciones', guardar),
          mensaje,
          el('p', 'ayuda', 'No te preocupes si no es perfecto: un truco tuyo y raro funciona mejor que uno bonito que no te dice nada.'),
        );
      },
    },
    {
      titulo: 'Tu rutina',
      pintar(z) {
        z.append(
          el(
            'ul',
            'lista-guia',
            el('li', '', fuerte('Cada día'), ': Hoy, unos diez minutos. Mejor un poco cada día que mucho de golpe.'),
            el('li', '', fuerte('Si te apetece más'), ': avanza en Aprender.'),
            el('li', '', fuerte('Para mirar con calma'), ': en Explorar ves cualquier verbo, con su truco.'),
            el('li', '', fuerte('Si un verbo se te resiste'), ': inventa tu propio truco para él.'),
            el('li', '', fuerte('Antes de un examen'), ': haz algún Examen de prueba unos días antes, no la víspera. Lo que falles, mándalo a Hoy para repasarlo antes.'),
            el('li', '', fuerte('Para no perder tu progreso'), ': haz de vez en cuando una copia de seguridad desde el botón ⋯.'),
          ),
          p('Y lo más importante: no hace falta acertarlo todo. Lo que cuenta es volver mañana.'),
        );
      },
    },
  ];
  function pintar(): void {
    const paso = pasos[indice];
    const zona = el('div', 'cuerpo-guia');
    paso.pintar(zona);
    const puntos = el('div', 'puntos-guia');
    puntos.setAttribute('aria-hidden', 'true');
    pasos.forEach((_, i) => puntos.append(el('span', i === indice ? 'punto actual' : 'punto')));
    const anterior = boton('Anterior', 'boton-secundario', () => ir(indice - 1));
    anterior.disabled = indice === 0;
    const ultimo = indice === pasos.length - 1;
    const siguiente = ultimo
      ? boton('Empezar', 'boton-principal', () => {
          // Guardar ya que la guía se ha visto (el evento "close" llega un instante después).
          datos.alCerrar();
          dialogo.close();
          datos.alEmpezar();
        })
      : boton('Siguiente', 'boton-principal', () => ir(indice + 1));
    const contenido = el(
      'div',
      'dialogo-contenido',
      el('p', 'progreso', `${indice + 1} de ${pasos.length}`),
      el('h2', 'dialogo-titulo', paso.titulo),
      zona,
      puntos,
      el('div', 'acciones acciones-guia', anterior, siguiente, boton('Cerrar', 'boton-enlace', () => dialogo.close())),
    );
    dialogo.replaceChildren(contenido);
    dialogo.scrollTop = 0;
    siguiente.focus({ preventScroll: true });
  }

  function ir(i: number): void {
    indice = Math.max(0, Math.min(pasos.length - 1, i));
    pintar();
  }

  return () => {
    indice = 0;
    pintar();
    if (!dialogo.open) dialogo.showModal();
  };
}
