# Puerto Analítico - Frontend de Usuario (`apps/usuario/`)
**Fase F3: App React + TypeScript + Tailwind + Zustand + PWA para Terapeutas**

Aplicación desacoplada diseñada para integrarse con WordPress + Elementor Pro mediante el shortcode `[puerto_app_usuario]` en el contenedor `#puerto-usuario-root`.

---

## 1. Arquitectura y Tecnologías

- **Framework & Bundler:** React 18, Vite 5, TypeScript 5.
- **Estilos:** Tailwind CSS con paleta oficial de consultorios (Verde `#2E7D32`, Rosa `#E91E63`, Azul `#1976D2`, Negro `#212121`, Café `#6D4C41`).
- **Estado Global:** Zustand (`useAuthStore`, `useConsultoriosStore`, `useDisponibilidadStore`, `useReservasStore`, `useUiStore`).
- **PWA (Progressive Web App):**
  - Web App Manifest (`manifest.json`)
  - Service Worker para cacheo y soporte offline (`service-worker.js`)
  - Íconos de alta resolución (192x192 y 512x512)
- **Suite de Pruebas:** Vitest + Testing Library (21 pruebas unitarias y de integración pasando al 100%).

---

## 2. Reglas de Negocio Implementadas

- **R1 (Horarios de Operación):** L-V 08:00 a 21:00 (13 slots, último inicio 20:00). Sábados 08:00 a 17:00 (9 slots, último inicio 16:00). Domingos cerrado (0 slots).
- **R3 (Cero Doble Booking):** Control y captura de errores HTTP 409 (`slot_ocupado`).
- **R4 (Consumo a T-24h):** Recordatorios interactivos de que el saldo se debita automáticamente 24 horas antes del slot.
- **R5 (Cancelación Anticipada):** Devolución íntegra de saldo calculada si la anticipación es $\ge 24\text{ h}$; advertencia de penalización sin devolución si es $< 24\text{ h}$.
- **R6 (Reagendamiento):** Bloqueo interactivo si faltan $< 24\text{ h}$; habilitado si $\ge 24\text{ h}$ conservando la duración de horas y saldos.
- **R7 (Modalidad Bloque):** Validación estricta de mínimo 3 horas consecutivas en el mismo día y consultorio.
- **R9 (Vigencia 6 meses y Renovación en Cadena):** Visualización de días restantes por paquete y notificación de extensión de vigencia por compras.
- **R13 (Protección por Congelamiento):** Interfaz adaptada con bloqueo de reservas y mensaje de protección de saldos.
- **R17 (Capacidades):** Visualización de 72h vendibles y 2h de mantenimiento semanal por consultorio.

---

## 3. Comandos de Desarrollo y Compilación

Dentro de `apps/usuario/`:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Ejecutar suite de pruebas Vitest
npm test

# Compilar para producción
npm run build
```

---

## 4. Archivos de Salida en Producción (`dist/`)

El build genera bundles unificados configurados para coincidir con la inyección de `AppShortcodes.php` en WordPress:
- `app-usuario.js`
- `app-usuario.css`
- `manifest.json`
- `service-worker.js`
- `icons/icon-192.png` y `icons/icon-512.png`

Empaquetado listo para Hostinger en la raíz:
`puerto-app-usuario.zip`
