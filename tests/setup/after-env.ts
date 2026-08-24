/**
 * Configuracion posterior al framework de pruebas.
 * Se ejecuta con los globales (expect, beforeEach) ya disponibles.
 */

import { configure } from '@testing-library/react-native'

/** Timeout global para waitFor y findBy en toda la suite */
configure({ asyncUtilTimeout: 4000 })
