# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Convenciones del proyecto Cashy

## Reglas obligatorias de codigo

- Prohibido el uso de emojis en codigo, UI, comentarios ni JSDoc.
- Prohibido `any` y `unknown` (forzado por ESLint con `no-restricted-syntax` sobre `TSAnyKeyword` y `TSUnknownKeyword`). Para valores capturados en `catch`, usa funciones genericas como `getErrorMessage<T>` en `src/lib/errors.ts`.
- Sin punto y coma: forzado por Prettier (`"semi": false`). Ejecutar `npm run format` antes de entregar.
- Iconos: solo outlined via el atomo `Icon` (`lucide-react-native`). Nunca importar Lucide directo en pantallas; registrar el icono nuevo en el catalogo de `src/components/atoms/Icon`.
- Nombres tecnicos en ingles: componentes, hooks, funciones, parametros, tipos, columnas SQL y claves de storage. Textos de UI, notificaciones y comentarios/JSDoc en espanol.
- Cero rutas relativas de tipo `../`; usar siempre el alias `@src/*`. Los imports hermanos `./X.d` dentro de la carpeta del componente si se permiten.

## Orden de imports (forzado por ESLint import/order)

1. Paquetes externos (`react`, `expo-router`, `react-native`, etc.)
2. Internos con alias `@src/*`
3. Hermanos del mismo folder (`./useButton`, `./Button.d`)
   Dentro de cada grupo: alfabeticamente; los imports con llaves van antes que los default.

## Arquitectura

- React Native + Expo SDK 57 + Expo Router (typed routes) + NativeWind v4.
- Atomic Design: `src/components/{atoms,molecules,organisms}`.
- Cada componente ocupa maximo 3 archivos: `X.tsx` (vista), `useX.ts` (logica, opcional) e `X.d.ts` (tipos publicos). Las vistas importan sus tipos con `import type { XProps } from './X.d'` y cada carpeta expone un `index.ts`.
- JSDoc en espanol en todos los componentes, hooks, servicios y tipos exportados.
- Datos: `src/services` (APIs externas con validacion por type guards genericos), `src/db` (SQLite, repositorios snake_case -> camelCase, migraciones por `PRAGMA user_version` en `base.ts`), `src/hooks` (estado reactivo).
- Tasas: BCV USD/EUR desde `ve.dolarapi.com`, USDT venta P2P (minimo bid entre mercados principales) desde `criptoya.com`. Cache en AsyncStorage (`cashy.rates`) con validez de 6 h.
- Recordatorios: identificadores deterministicos `reminder-{id}`; sincronizacion al abrir la app en `app/_layout.tsx`. Avisos diarios de tasa BCV a las 9 a.m. y 1 p.m. (identificadores `bcv-9am`/`bcv-1pm`, triggers de calendario repetitivos).
- Gastos admiten EUR ademas de VES/USD/USDT; la moneda base de resumenes excluye EUR (`BASE_CURRENCIES`). Horas de UI en formato 12H via `formatHour12`.
- Alertas de feedback (exito/error de acciones) usan la molecula `AlertDialog` centrada con boton Aceptar; prohibido `Alert.alert` y avisos flotantes tipo toast.
- UI propia sobre componentes nativos del sistema: fechas con `CalendarPicker` (organismo) y confirmaciones con `ConfirmDialog` + `ModalBackdrop` (moleculas). Prohibido `Alert.alert` y `@react-native-community/datetimepicker`.
- Menu principal: barra personalizada via `tabBar={() => <AppTabBar activeRoute={usePathname()} />}` con accion central elevada (+) que abre `/new-expense`; prohibido volver a usar FabButton flotantes sobre el contenido ni botones normales para esta accion fuera del estado vacio.
- Montos: se capturan en centavos con el patron cents-first (`src/lib/money.ts`: 1 -> 0.01 -> 10.00); el dominio guarda decimales.
- Sincronizacion entre pantallas: mutaciones de gastos emiten `expenses-changed` via `src/lib/events.ts`; cada instancia de `useExpenses` escucha y recarga sola.
- Notificaciones y Expo Go: `expo-notifications` NO debe importarse estaticamente; resolver via `obtenerModulo()` (require diferido) tras `Constants.executionEnvironment`. En Expo Go todo degrada a no-op y Ajustes muestra aviso.
- Feedback de acciones con la molecula `Toast` (autooculta); prohibido `Alert.alert`.
- Auditoria periodica con `npx react-doctor@latest .`; los 2 avisos aceptados (awaits dependientes en insertExpense, encadenado de listas pequenas) estan documentados como intencionales.

## Verificacion

- `npm run typecheck` (tsc --noEmit), `npm run lint` (expo lint), `npm test` (Jest + cobertura con umbrales) y `npx expo export --platform android` para validar el bundling completo sin dispositivo.
- `.npmrc` tiene `legacy-peer-deps=true`: no eliminarlo, npm falla sin el por conflictos de peer deps de expo-router/radix.

## Suite de pruebas

- Comandos: `npm test` (Jest + cobertura con umbrales estrictos), `npm run test:watch`, `npm run test:e2e` (requiere Maestro CLI y emulador Android).
- Stack: jest-expo (preset SDK 57, Jest 29), @testing-library/react-native v14, @types/jest 29. NOTA: RNTL v14 hace `render` y `renderHook` ASYNC; siempre `await`.
- Estructura central en `tests/`: `setup/` (mocks globales), `helpers/` (networkMock propio de fetch, sqliteFake para repos, factories, contrast WCAG, espera), `fixtures/`, y una carpeta por categoria (`unit/`, `network/`, `integration/`, `snapshot/`, `a11y/`). Flujos E2E en `.maestro/*.yaml` (Maestro, corren solo con emulador local).
- Umbrales de cobertura obligatorios por directorio: lib/services 80% branches / 85% resto; hooks 70/75; db 70/80. `npm test` falla si no se cumplen.
- Mocking de red: utilitario propio `installFetchMock(routes)` que intercepta `global.fetch` (rutas regex -> respuesta/latencia/error); nada de MSW ni nock.
- SQLite en pruebas: mock global de `expo-sqlite` registrado en `jest.setup.ts` apuntando a `FakeDatabase` (cola de resultados + registro de sentencias). Llamar `iniciarBaseFalsa()` en cada beforeEach.
- Snapshots: congelar el reloj con `jest.useFakeTimers({ now })`; tras cambios de formato o props de a11y regenerar con `npx jest tests/snapshot -u`.
- Accesibilidad: todo control presionable lleva `accessibilityRole="button"` + `accessibilityLabel`; Typography display/title expone `role="header"`; contraste verificado contra AA (4.5) en `tests/a11y/contrast.test.ts`.
