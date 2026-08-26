# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Convenciones del proyecto Cashy

## Reglas obligatorias de codigo

- Prohibido el uso de emojis en codigo, UI, comentarios ni JSDoc.
- Prohibido `any` y `unknown` (forzado por ESLint con `no-restricted-syntax` sobre `TSAnyKeyword` y `TSUnknownKeyword`). Para valores capturados en `catch`, usa funciones genericas como `getErrorMessage<T>` en `src/lib/errors.ts`.
- Sin punto y coma: forzado por Prettier (`"semi": false`). Ejecutar `npm run format` antes de entregar.
- Iconos: solo outlined via el atomo `Icon` (`lucide-react-native`). Nunca importar Lucide directo en pantallas; registrar el icono nuevo en el catalogo de `src/components/atoms/Icon`.
- **Nombres tecnicos ESTRICTAMENTE en ingles**: funciones, variables, constantes, tipos/interfaces, props, parametros, nombres de archivo, testIDs y columnas SQL. Nada como `proximoDisparo`, `onEditar`, `pantalla` o `ingreso-concepto`. En espanol solo: comentarios/JSDoc, textos de UI y `accessibilityLabel`, mensajes de validacion, commits y titulos `describe/it` de tests.
- Cero rutas relativas de tipo `../`; usar siempre el alias `@src/*`. Los imports hermanos `./X.d` dentro de la carpeta del componente si se permiten. En tests, los imports de pantallas usan `../../app/...` (excepcion: Jest no resuelve el alias para `app/`).

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
- Datos: `src/services` (APIs externas con validacion por type guards genericos), `src/db` (SQLite, repositorios snake_case -> camelCase, migraciones por `PRAGMA user_version` en `base.ts`, version vigente 5 con tablas `expenses`, `settings`, `profile` e `incomes`), `src/hooks` (estado reactivo).
- Onboarding: wizard bloqueante en `app/onboarding.tsx` (paso 1 identidad, paso 2 tabla de ingresos) con validaciones zod en `src/lib/validation.ts` (`firstNameSchema`, `lastNameSchema`, `emailSchema`, `incomeSchema`, `validateField`, `isValidIncomeRow`). Nada se persiste hasta terminar; el gate vive en `app/_layout.tsx` con registro ESTATICO de todas las rutas + `initialRouteName` condicional + redireccion en efecto (`pathname` vs `/onboarding`): NUNCA hijos condicionales ni Fragment dentro de `Stack` (expo-router falla con `Cannot convert Symbol to string`), ni `key` dinamico. Los eventos `profile-changed` e `incomes-changed` sincronizan Ajustes, Finanzas y el gate.
- Edicion de datos: `app/edit-profile.tsx` (modal) reutiliza `ProfileFields`, `IncomeEditor` e `IncomesTable` via el hook `useProfileEditor`.
- Pestana Finanzas: `app/(tabs)/finances.tsx` (ruta `finances`) con segmento Gastos/Ingresos; `IncomesPanel` (resumen mensual convertido a moneda base), alta/edicion con `IncomeFormSheet` (molecula modal) y hook `useIncomes`.
- Tasas: BCV USD/EUR desde `ve.dolarapi.com`, USDT venta P2P (minimo bid entre mercados principales) desde `criptoya.com`. Cache en AsyncStorage (`cashy.rates`) con validez de 6 h.
- Recordatorios: identificadores deterministicos `reminder-{id}`; sincronizacion al abrir la app en `app/_layout.tsx` y desde la tarea en background `cashy-background-sync` (`src/lib/backgroundTask.ts`, WorkManager via `expo-background-task`, intervalo minimo 4 h). Aviso diario de tasa BCV unico con hora configurable (identificador `bcv-diario`; `bcv-9am`/`bcv-1pm` son legados que se cancelan siempre); el aviso se agenda como trigger `DATE` hacia la proxima ocurrencia (`nextTriggerDate`), NO `CALENDAR repeats` (poco fiable en Android); el cuerpo incluye la ultima tasa consultada o texto de respaldo.
- Notificaciones fiables: permiso `SCHEDULE_EXACT_ALARM` declarado en `app.json` (`android.permissions`); sin el, Android agrupa alarmas inexactas en ventanas del sistema (p. ej. llegan a las 12:00 p.m.). En Android 12+ el usuario lo concede desde Ajustes via `openExactAlarmSettings()` (`expo-intent-launcher`, accion `REQUEST_SCHEDULE_EXACT_ALARM`). Los switches y horas por tipo de aviso viven en ajustes (`bcvHour`, `bcvMinute`, `remindersEnabled`, `bcvEnabled` en `AppSettings`, merge retrocompatible en `parseAppSettings`); los mutadores de `useSettings` (`changeReminderTime`, `changeBcvTime`) aplican el cambio en las notificaciones al instante.
- Deep link de notificaciones: los recordatorios llevan `data: { expenseId }` y `useNotificationDeepLink(enabled)` (montado en `app/_layout.tsx`) navega a `/expense/[id]` con `getLastNotificationResponse` + listener de respuestas; el param `enabled` evita navegar durante el onboarding.
- UI de notificaciones: icono monocromo blanco `assets/notification-icon.png` (96x96, blanco puro + transparencia) registrado en el plugin `expo-notifications` de `app.json` junto a `color` y `defaultChannel`.
- Gastos admiten EUR ademas de VES/USD/USDT; la moneda base de resumenes excluye EUR (`BASE_CURRENCIES`). Horas de UI en formato 12H via `formatHour12`.
- Alertas de feedback (exito/error de acciones) usan la molecula `AlertDialog` centrada con boton Aceptar; prohibido `Alert.alert` y avisos flotantes tipo toast.
- UI propia sobre componentes nativos del sistema: fechas con `CalendarPicker` (organismo), horas con `HourPicker` (molecula, lista 0-23 en modal) y confirmaciones con `ConfirmDialog` + `ModalBackdrop` (moleculas). Interruptores con el atomo `Switch`. Prohibido `Alert.alert` y `@react-native-community/datetimepicker`.
- Menu principal: barra personalizada via `tabBar={() => <AppTabBar activeRoute={usePathname()} />}` con accion central elevada (+) que abre `/new-expense`; prohibido volver a usar FabButton flotantes sobre el contenido ni botones normales para esta accion fuera del estado vacio.
- Montos: se capturan en centavos con el patron cents-first (`src/lib/money.ts`: 1 -> 0.01 -> 10.00); el dominio guarda decimales.
- Sincronizacion entre pantallas: mutaciones de gastos emiten `expenses-changed` via `src/lib/events.ts`; cada instancia de `useExpenses` escucha y recarga sola.
- Notificaciones y Expo Go: `expo-notifications` NO debe importarse estaticamente; resolver via `obtenerModulo()` (require diferido) tras `Constants.executionEnvironment`. En Expo Go todo degrada a no-op y Ajustes muestra aviso.
- Auto-actualizacion hibrida: correcciones de JS via `expo-updates` + EAS Update (`updates.url` + `runtimeVersion` fingerprint en `app.json`; canales `github`/`play` por perfil en `eas.json`); binarios via `src/services/appUpdate.ts` consultando `api.github.com/repos/reactive-end/cashy/releases/latest`, descarga con `File.createDownloadTask` (`expo-file-system`) e instalacion con ACTION_VIEW + `contentUri`. El hook `useAppUpdate` solo corre cuando `Updates.channel === 'github'` y muestra el dialogo "Nueva version" (Actualizar/Cancelar) montado en `app/_layout.tsx`; versiones descartadas en AsyncStorage (`cashy.update-descartada`). Comparacion semver pura en `src/lib/versiones.ts`. Publicar JS-only con `eas update --branch github`; releases binarios como tag `vX.Y.Z` con APK adjunto.
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
