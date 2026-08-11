const logger = require("../utils/logger");
const env = require("../config/env");

/**
 * Cola de ejecuciones concurrentes.
 *
 * Sin esto cada submission lanza procesos de inmediato: con ~60 estudiantes
 * enviando a la vez, el contenedor se queda sin memoria. Compilar es lo caro
 * (javac ronda los 200MB), asi que el limite se aplica a la submission completa
 * — compilacion mas todos sus casos — y no a cada caso por separado.
 *
 * Cuando no hay campo libre la peticion espera su turno. Si la espera se pasa
 * de QUEUE_TIMEOUT, se rechaza con un mensaje claro en vez de dejar al
 * estudiante mirando un spinner eterno.
 */
class RunQueue {
  constructor(maxConcurrent, queueTimeout) {
    this.maxConcurrent = maxConcurrent;
    this.queueTimeout = queueTimeout;
    this.active = 0;
    this.waiting = [];
  }

  /**
   * Ejecuta `task` cuando haya un campo libre.
   * @throws {QueueTimeoutError} si la espera supera el timeout de cola
   */
  async run(task) {
    await this._acquire();
    try {
      return await task();
    } finally {
      this._release();
    }
  }

  /**
   * @returns {{active: number, waiting: number, maxConcurrent: number}}
   */
  stats() {
    return { active: this.active, waiting: this.waiting.length, maxConcurrent: this.maxConcurrent };
  }

  /** @private */
  _acquire() {
    if (this.active < this.maxConcurrent) {
      this.active += 1;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const entry = { resolve, reject, timer: null };

      entry.timer = setTimeout(() => {
        const i = this.waiting.indexOf(entry);
        if (i !== -1) this.waiting.splice(i, 1);
        logger.warn("Espera en cola agotada", this.stats());
        reject(new QueueTimeoutError());
      }, this.queueTimeout);

      this.waiting.push(entry);
      logger.info("Submission encolada", this.stats());
    });
  }

  /** @private */
  _release() {
    const next = this.waiting.shift();
    if (next) {
      clearTimeout(next.timer);
      next.resolve();
      return;
    }
    this.active -= 1;
  }
}

class QueueTimeoutError extends Error {
  constructor() {
    super("El servidor está ocupado. Espera unos segundos y vuelve a intentar.");
    this.name = "QueueTimeoutError";
  }
}

module.exports = {
  queue: new RunQueue(env.MAX_CONCURRENT_RUNS, env.QUEUE_TIMEOUT),
  RunQueue,
  QueueTimeoutError,
};
