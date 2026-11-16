import type { ModoId } from '../logic/config';
import { ColaRonda, type Resultado, type ResumenRonda } from '../logic/sesion';
import { el } from './dom';
import { PAUSA_TRAS_ACIERTO_MS, Teclado, pintarResumen, progreso, type Contexto, type ModoPractica } from './comun';
import { preguntaElegir, RENDERIZADORES, type ControlPregunta } from './preguntas';

export interface OpcionesRonda {
  /** Verbos de la ronda (en el orden propuesto; la cola los baraja). */
  ids: () => string[];
  /** Tipo de pregunta de cada verbo. */
  modoPara: (verboId: string) => ModoId;
  textosResumen?: { titulo: string; otra: string };
  /** Qué hacer al terminar (por defecto, el resumen con "Otra ronda"). */
  alTerminar?: (resumen: ResumenRonda) => void;
}

/**
 * Controlador de una ronda de preguntas sueltas (Aprender): cola con
 * repetición de fallos, registro del progreso, avance automático tras
 * acertar y resumen final.
 */
export function iniciarRonda(ctx: Contexto, op: OpcionesRonda): ModoPractica {
  const { contenedor, tablero, rng, motor } = ctx;
  const teclado = new Teclado();
  let cola = new ColaRonda(op.ids(), rng);
  let temporizador: number | undefined;
  let control: ControlPregunta = {};

  function limpiarTablero(): void {
    tablero.limpiarEstados();
    tablero.mostrarFormas(null);
    tablero.setMudo(false);
  }

  function siguiente(): void {
    window.clearTimeout(temporizador);
    limpiarTablero();
    control = {};
    const id = cola.actual();
    if (!id) {
      teclado.usar(null);
      tablero.setInteractivo(false);
      if (op.alTerminar) op.alTerminar(cola.resumen());
      else pintarResumen(contenedor, cola.resumen(), otraRonda, ctx.alExplorar, op.textosResumen);
      return;
    }
    const verbo = ctx.candidatos.find((v) => v.id === id) ?? ctx.verbos.find((v) => v.id === id)!;
    const modo = op.modoPara(id);
    const renderizar = RENDERIZADORES[modo] ?? preguntaElegir;
    const { total } = cola.resumen();
    contenedor.replaceChildren(progreso(`${total - cola.pendientes()} de ${total}`));
    const inicio = performance.now();
    let respondida = false;

    control = renderizar({
      zona: contenedor,
      tablero,
      verbo,
      candidatos: ctx.candidatos,
      rng,
      teclado,
      truco: motor.truco(id),
      responder(resultado: Resultado) {
        if (respondida) return { recuperado: false };
        respondida = true;
        const r = cola.responder(resultado);
        motor.registrar(id, modo, resultado, performance.now() - inicio);
        if (resultado === 'acierto') {
          temporizador = window.setTimeout(siguiente, PAUSA_TRAS_ACIERTO_MS + (r.recuperado ? 500 : 0));
        }
        return { recuperado: r.recuperado };
      },
      siguiente,
    });
  }

  function otraRonda(): void {
    cola = new ColaRonda(op.ids(), rng);
    if (!cola.actual()) {
      contenedor.replaceChildren(el('p', 'ayuda', 'No hay nada que practicar ahora mismo.'));
      return;
    }
    siguiente();
  }

  otraRonda();

  return {
    alTocarVerbo: (id) => control.alTocarVerbo?.(id),
    salir() {
      window.clearTimeout(temporizador);
      teclado.quitar();
      limpiarTablero();
    },
  };
}
