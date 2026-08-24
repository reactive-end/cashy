/**
 * HTTP client minimalista con validacion de formato.
 * Todas las respuestas externas pasan por un guard de tipos antes de usarse,
 * evitando any y unknown en el resto de la aplicacion.
 */

/** Tiempo maximo de espera para cada peticion, en milisegundos */
const REQUEST_TIMEOUT_MS = 10000

/**
 * Realiza una peticion GET y devuelve el cuerpo validado como JSON.
 * @param url URL absoluta del recurso
 * @param validate Guard que comprueba que la respuesta tiene la forma esperada
 * @returns Datos validados con su tipo correspondiente
 * @throws Error si la red falla, el codigo HTTP no es 2xx o el formato es invalido
 */
export async function fetchJson<T extends object>(
  url: string,
  validate: (value: object) => value is T
): Promise<T> {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), REQUEST_TIMEOUT_MS)

  try {
    const respuesta = await fetch(url, {
      signal: controlador.signal,
      headers: { Accept: 'application/json' }
    })

    if (!respuesta.ok) {
      throw new Error(`El servidor respondió con el código ${respuesta.status}`)
    }

    const data = await respuesta.json()

    if (!validate(data)) {
      throw new Error('La respuesta del servidor no tiene el formato esperado')
    }

    return data
  } finally {
    clearTimeout(temporizador)
  }
}
