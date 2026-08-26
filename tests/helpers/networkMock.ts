/**
 * Interceptor ligero de global.fetch para pruebas.
 * Enruta URLs a respuestas simuladas sin dependencias externas,
 * con soporte de latencia, aborto y registro de llamadas.
 */

/** Respuesta que entrega una ruta simulada */
export interface MockedResponse {
  /** Codigo HTTP; por defecto 200 */
  status?: number
  /** Cuerpo serializable que devuelve json() */
  body: object | string
  /** Latencia artificial en ms para probar timeouts */
  delayMs?: number
}

/** Ruta que decide la respuesta segun la URL solicitada */
export interface FetchMockRoute {
  /** Patron contra el que se compara la URL completa */
  match: RegExp
  /** Devuelve la respuesta o un Error para simular fallo de red */
  respond: (url: string) => MockedResponse | Error
}

/** Control devuelto por installFetchMock para inspeccionar y limpiar */
export interface FetchMockController {
  /** URLs solicitadas en orden de llegada */
  calls: string[]
  /** Restaura el fetch original */
  restore: () => void
}

/**
 * Reemplaza global.fetch por el enrutador simulado.
 * Debe llamarse dentro de beforeEach/it y limpiarse con restore().
 * @param routes Rutas disponibles durante la prueba
 * @returns Controlador con llamadas registradas y limpieza
 */
export function installFetchMock(routes: FetchMockRoute[]): FetchMockController {
  const originalFetch = globalThis.fetch
  const calls: string[] = []

  const fakeFetch: typeof fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    calls.push(url)

    return new Promise<Response>((resolve, reject) => {
      if (init?.signal?.aborted) {
        reject(new Error('Aborted'))
        return
      }

      const route = routes.find((candidate) => candidate.match.test(url))

      if (!route) {
        reject(new Error(`No hay mock registrado para ${url}`))
        return
      }

      const result = route.respond(url)

      if (result instanceof Error) {
        reject(result)
        return
      }

      const buildResponse = () => {
        const status = result.status ?? 200
        resolve({
          ok: status >= 200 && status < 300,
          status,
          json: async () => result.body
        } as Response)
      }

      if (!result.delayMs) {
        buildResponse()
        return
      }

      const timer = setTimeout(buildResponse, result.delayMs)

      init?.signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new Error('Aborted'))
      })
    })
  }

  globalThis.fetch = fakeFetch

  return {
    calls,
    restore: () => {
      globalThis.fetch = originalFetch
    }
  }
}
