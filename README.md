<div align="center">

<img src="assets/logo.jpg" alt="Cashy" width="180" />

# Cashy

**Controla tus gastos en Venezuela con las tasas del dia**

Aplicacion movil de finanzas personales pensada para la realidad economica venezolana.

</div>

---

## Para que esta hecha

Cashy te permite registrar y seguir tus gastos en **bolivares, dolares, euros y USDT**, convirtiendo todo automaticamente con las **tasas oficiales del BCV** (dolar y euro) y la **tasa de venta USDT P2P** del dia. Esta disenada para responder las preguntas del dia a dia: cuanto llevo gastado este mes, cuando vence mi proximo pago fijo y cuanto equivalen mis dolares en bolivares.

### Caracteristicas

- **Tasas del dia**: Dolar BCV, Euro BCV y USDT (venta P2P entre mercados principales) con cache local de 6 horas y actualizacion manual.
- **Gastos fijos y unicos**: suscripciones y pagos recurrentes con recordatorios push antes del vencimiento; compras puntuales con categoria y nota.
- **Soporte EUR**: registra gastos en euros ademas de VES, USD y USDT.
- **Resumen contable**: totales del mes, promedio diario, desglose por categoria en barras y mayores gastos.
- **Calculadora de divisas**: equivalencias instantaneas entre las cuatro monedas gestionadas.
- **Busqueda y filtros**: encuentra gastos por nombre o categoria, filtra por categoria y moneda, y ordena por fecha, monto o nombre.
- **Recordatorios BCV**: avisos diarios de la tasa a las 9 a.m. y 1 p.m. (configurables).
- **Auto-actualizacion**: correcciones de JS via EAS Update (se aplican al reiniciar) y aviso de "Nueva version" al abrir cuando hay un release nuevo en GitHub con descarga e instalacion del APK.
- **Privacidad**: todos los datos viven en tu telefono (SQLite local); sin cuentas ni servidores.

## Stack tecnico

- React Native + Expo SDK 57 + Expo Router (rutas tipadas)
- NativeWind v4 (Tailwind) con sistema de diseño propio
- SQLite local (`expo-sqlite`) con migraciones por version
- `expo-notifications` con degradacion segura en Expo Go
- Jest + Testing Library (unitarias, integracion, snapshot y accesibilidad) + Maestro para E2E

## Ejecutar en local

```bash
npm install
npx expo start
```

Pruebas y verificacion:

```bash
npm test          # Jest con cobertura y umbrales estrictos
npm run lint      # ESLint
npm run typecheck # TypeScript
```

Compilar un APK instalable con EAS:

```bash
npx eas-cli build --platform android --profile preview
```

## Publicar versiones

1. Bump `version` en `app.json` (p. ej. `1.0.2`).
2. **Solo cambios de JS**: `npx eas-cli update --branch github -m "mensaje"`. Los usuarios la reciben al reiniciar la app.
3. **Cambios nativos** (permisos, plugins, dependencias nativas): compila con `eas build --profile preview`, crea un release en GitHub con tag `v1.0.2` y adjunta el APK. La app de los usuarios lo detectara al abrir y mostrara el dialogo "Nueva version" con los botones Actualizar y Cancelar.

## Licencia

Este proyecto se distribuye bajo la licencia **[CC BY-NC-ND 4.0](LICENSE)** (Atribucion-NoComercial-SinDerivadas):

- **Atribucion obligatoria**: cualquier uso compartido debe creditar al autor y enlazar este repositorio.
- **Sin versiones modificadas publicas**: modificar y/o redistribuir la aplicacion o su codigo requiere **permiso previo del autor**.
- **Sin uso comercial**: no puede usarse con fines comerciales sin autorizacion.

Solicita permisos abriendo un [issue](https://github.com/reactive-end/cashy/issues) o escribiendo al autor.

Autor: [reactive-end](https://github.com/reactive-end)
