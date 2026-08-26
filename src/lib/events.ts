/**
 * Minimal typed event bus for cross-instance synchronization.
 * Cada instancia de useExpenses se suscribe a 'expenses-changed'
 * y recarga al ocurrir mutaciones desde otras pantallas. El mismo
 * patron sincroniza ingresos e identidad del usuario.
 */

/** Eventos disponibles en la aplicacion */
export type AppEvent = 'expenses-changed' | 'incomes-changed' | 'profile-changed'

/** Registro de oyentes por evento */
const listeners: Record<AppEvent, Set<() => void>> = {
  'expenses-changed': new Set(),
  'incomes-changed': new Set(),
  'profile-changed': new Set()
}

/**
 * Suscribe un callback a un evento de la aplicacion.
 * @param event Evento a escuchar
 * @param callback Accion a ejecutar cuando se emita
 * @returns Funcion de desuscripcion
 */
export function subscribe(event: AppEvent, callback: () => void): () => void {
  listeners[event].add(callback)
  return () => {
    listeners[event].delete(callback)
  }
}

/**
 * Emite un evento a todos los oyentes registrados.
 * Los errores de un oyente no interrumpen a los demas.
 * @param event Evento a emitir
 */
export function emit(event: AppEvent): void {
  for (const callback of [...listeners[event]]) {
    try {
      callback()
    } catch {
      // Un oyente fallido no debe romper el resto ni al emisor.
    }
  }
}
