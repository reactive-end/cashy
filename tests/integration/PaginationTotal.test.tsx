/**
 * Caso de normalizacion del total de paginas.
 * Vive en archivo propio para aislar el entorno act entre pruebas.
 */

// Componente sin efectos secundarios: se ejecuta fuera del entorno act.
import { render } from '@testing-library/react-native'

import { Pagination } from '@src/components/molecules/Pagination'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false

test('normaliza el total a al menos una pagina', async () => {
  const pantalla = await render(<Pagination page={5} totalPages={0} onPageChange={jest.fn()} />)

  expect(pantalla.getByText('Página 5 de 1')).toBeTruthy()
})
