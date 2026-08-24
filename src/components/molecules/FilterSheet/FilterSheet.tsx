/**
 * Molecula FilterSheet: panel modal de filtros para el listado de
 * gastos. Ofrece chips multi-seleccion de categorias y monedas,
 * ordenacion por recientes, monto o nombre, y acciones limpiar y
 * aplicar. Sobre ModalBackdrop para mantener la estetica propia.
 */

import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'

import { Button } from '@src/components/atoms/Button'
import { Typography } from '@src/components/atoms/Typography'
import { ModalBackdrop } from '@src/components/molecules/ModalBackdrop'
import type { Currency } from '@src/types/domain'

import type { FilterSheetProps, OrdenGastos } from './FilterSheet.d'

/** Etiquetas visibles de cada criterio de ordenacion */
const ETIQUETAS_ORDEN: Record<OrdenGastos, string> = {
  recientes: 'Mas recientes',
  montoDesc: 'Mayor monto',
  montoAsc: 'Menor monto',
  nombre: 'Nombre A-Z'
}

/** Ordenes disponibles en el panel */
const ORDENES = Object.keys(ETIQUETAS_ORDEN) as OrdenGastos[]

interface ChipProps {
  etiqueta: string
  seleccionado: boolean
  onPress: () => void
}

/**
 * Chip redondo de seleccion con tono acento al activarse.
 * @param props Etiqueta, estado y callback de pulsado
 * @returns Pastilla de filtro
 */
function Chip({ etiqueta, seleccionado, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: seleccionado }}
      className={`rounded-full border px-3.5 py-2 active:opacity-60 ${
        seleccionado ? 'border-accent bg-accent' : 'border-line bg-card'
      }`}
      onPress={onPress}
    >
      <Typography variant="caption" className={seleccionado ? 'text-white' : ''}>
        {etiqueta}
      </Typography>
    </Pressable>
  )
}

/**
 * Contenido del panel; se monta al abrir para que la seleccion
 * parta siempre de los filtros ya aplicados, sin efectos.
 * @param props Catalogos, valores actuales y callbacks de aplicar/cerrar
 * @returns Secciones de chips y acciones del panel
 */
function FilterSheetContenido({
  categorias,
  monedas,
  filtros,
  orden,
  onAplicar,
  onClose
}: FilterSheetProps) {
  const [pendienteCategorias, setPendienteCategorias] = useState<string[]>(filtros.categorias)
  const [pendienteMonedas, setPendienteMonedas] = useState<Currency[]>(filtros.monedas)
  const [pendienteOrden, setPendienteOrden] = useState<OrdenGastos>(orden)

  const alternarCategoria = (categoria: string) => {
    setPendienteCategorias((actuales) =>
      actuales.includes(categoria)
        ? actuales.filter((valor) => valor !== categoria)
        : [...actuales, categoria]
    )
  }

  const alternarMoneda = (moneda: Currency) => {
    setPendienteMonedas((actuales) =>
      actuales.includes(moneda)
        ? actuales.filter((valor) => valor !== moneda)
        : [...actuales, moneda]
    )
  }

  const limpiarTodo = () => {
    setPendienteCategorias([])
    setPendienteMonedas([])
    setPendienteOrden('recientes')
  }

  const confirmar = () => {
    onAplicar({ categorias: pendienteCategorias, monedas: pendienteMonedas }, pendienteOrden)
    onClose()
  }

  // Sets de busqueda: evitan .includes dentro del render de cada chip.
  const categoriasSeleccionadas = new Set(pendienteCategorias)
  const monedasSeleccionadas = new Set(pendienteMonedas)

  return (
    <>
      <Typography variant="title">Filtros</Typography>

      <ScrollView className="mt-4 max-h-[420px]" showsVerticalScrollIndicator={false}>
        <View className="gap-5 pb-1">
          <View className="gap-2">
            <Typography variant="caption" className="text-faint">
              Categoria
            </Typography>
            <View className="flex-row flex-wrap gap-2">
              {categorias.length === 0 ? (
                <Typography variant="caption">Sin categorias registradas</Typography>
              ) : (
                categorias.map((categoria) => (
                  <Chip
                    key={categoria}
                    etiqueta={categoria}
                    seleccionado={categoriasSeleccionadas.has(categoria)}
                    onPress={() => alternarCategoria(categoria)}
                  />
                ))
              )}
            </View>
          </View>

          <View className="gap-2">
            <Typography variant="caption" className="text-faint">
              Moneda
            </Typography>
            <View className="flex-row flex-wrap gap-2">
              {monedas.map((moneda) => (
                <Chip
                  key={moneda}
                  etiqueta={moneda}
                  seleccionado={monedasSeleccionadas.has(moneda)}
                  onPress={() => alternarMoneda(moneda)}
                />
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Typography variant="caption" className="text-faint">
              Ordenar por
            </Typography>
            <View className="flex-row flex-wrap gap-2">
              {ORDENES.map((criterio) => (
                <Chip
                  key={criterio}
                  etiqueta={ETIQUETAS_ORDEN[criterio]}
                  seleccionado={pendienteOrden === criterio}
                  onPress={() => setPendienteOrden(criterio)}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="mt-5 flex-row items-center gap-3">
        <Button label="Limpiar" variant="secondary" onPress={limpiarTodo} />
        <View className="flex-1">
          <Button label="Aplicar" fullWidth onPress={confirmar} />
        </View>
      </View>
    </>
  )
}

/**
 * Renderiza el panel modal de filtros; el contenido se remonta en
 * cada apertura para reiniciar la seleccion desde los aplicados.
 * @param props Visibilidad, catalogos, valores actuales y callbacks
 * @returns Panel de filtros listo para usar en pantallas de listado
 */
export function FilterSheet(props: FilterSheetProps) {
  return (
    <ModalBackdrop visible={props.visible} onRequestClose={props.onClose}>
      {props.visible ? <FilterSheetContenido {...props} /> : null}
    </ModalBackdrop>
  )
}
