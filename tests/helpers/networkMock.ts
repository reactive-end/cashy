/**
 * Interceptor ligero de global.fetch para pruebas.
 * Enruta URLs a respuestas simuladas sin dependencias externas,
 * con soporte de latencia, aborto y registro de llamadas.
 */

/** Respuesta que entrega una ruta simulada */
export interface RespuestaSimulada {
  /** Codigo HTTP; por defecto 200 */
  status?: number
  /** Cuerpo serializable que devuelve json() */
  body: object | string
  /** Latencia artificial en ms para probar timeouts */
  delayMs?: number
}

/** Ruta que decide la respuesta segun la URL solicitada */
export interface RutaFetchMock {
  /** Patron contra el que se compara la URL completa */
  match: RegExp
  /** Devuelve la respuesta o un Error para simular fallo de red */
  respond: (url: string) => RespuestaSimulada | Error
}

/** Control devuelto por installFetchMock para inspeccionar y limpiar */
export interface ControladorFetch {
  /** URLs solicitadas en orden de llegada */
  llamadas: string[]
  /** Restaura el fetch original */
  restore: () => void
}

/**
 * Reemplaza global.fetch por el enrutador simulado.
 * Debe llamarse dentro de beforeEach/it y limpiarse con restore().
 * @param routes Rutas disponibles durante la prueba
 * @returns Controlador con llamadas registradas y limpieza
 */
export function installFetchMock(routes: RutaFetchMock[]): ControladorFetch {
  const fetchOriginal = globalThis.fetch
  const llamadas: string[] = []

  const fetchFalso: typeof fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    llamadas.push(url)

    return new Promise<Response>((resolve, reject) => {
      if (init?.signal?.aborted) {
        reject(new Error('Aborted'))
        return
      }

      const ruta = routes.find((candidata) => candidata.match.test(url))

      if (!ruta) {
        reject(new Error(`No hay mock registrado para ${url}`))
        return
      }

      const resultado = ruta.respond(url)

      if (resultado instanceof Error) {
        reject(resultado)
        return
      }

      const construirRespuesta = () => {
        const status = resultado.status ?? 200
        resolve({
          ok: status >= 200 && status < 300,
          status,
          json: async () => resultado.body
        } as Response)
      }

      if (!resultado.delayMs) {
        construirRespuesta()
        return
      }

      const temporizador = setTimeout(construirRespuesta, resultado.delayMs)

      init?.signal?.addEventListener('abort', () => {
        clearTimeout(temporizador)
        reject(new Error('Aborted'))
      })
    })
  }

  globalThis.fetch = fetchFalso

  return {
    llamadas,
    restore: () => {
      globalThis.fetch = fetchOriginal
    }
  }
}
