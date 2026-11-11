# Puerto Analítico Core (`puerto-core`)
**Fase F2: Integridad Transaccional, Disponibilidad, Saldos FIFO, Crons y Reservas Recurrentes**

Plugin oficial para la gestión, renta y reserva de consultorios para psicoterapeutas en **Puerto Analítico** (México). Desarrollado para WordPress + Elementor Pro (entornos Hostinger y servidores LAMP/LEMP), con arquitectura desacoplada basada en API REST y preparado para hospedar aplicaciones React vía shortcodes.

---

## 1. Reglas de Negocio e Integridad de Capacidad

* **R1 (Horarios de Operación):** Lunes a Viernes de 08:00 a 21:00 (13 slots, último inicio 20:00). Sábados de 08:00 a 17:00 (9 slots, último inicio 16:00). Domingos cerrado (0 slots). Slots alineados a la hora en punto con duración entera en horas.
* **R3 (Cero Doble Booking):** Bloqueo pesimista `SELECT ... FOR UPDATE` dentro de `START TRANSACTION`. La concurrencia se resuelve devolviendo `HTTP 409 slot_ocupado`.
* **R4 (Consumo a T-24h):** El saldo no se debita al crear la reserva; se consume automáticamente mediante cron horario 24 horas antes del inicio del slot.
* **R5 (Cancelación Anticipada):** Cancelación $\ge 24\text{ h}$ de anticipación devuelve íntegramente las horas consumidas al saldo de origen; cancelación $< 24\text{ h}$ no devuelve saldo (penalización).
* **R6 (Reagendamiento):** Permitido únicamente si la anticipación es $\ge 24\text{ h}$; reubica las fechas manteniendo la duración y sin tocar los saldos.
* **R7 (Modalidad Bloque):** Mínimo 3 horas consecutivas indivisibles, en el mismo consultorio y en el mismo día calendario.
* **R9 (Vigencia y Renovación):** Saldos vigentes por 6 meses; una nueva compra renueva automáticamente la vigencia de todos los saldos vigentes del usuario.
* **R11 (Membresías Turno / Completo):** Las membresías no consumen saldo por horas (`saldo_id = NULL`).
* **R12 (Exención Administrativa):** Administradores pueden crear reservas con `sin_consumo_saldo = true` sin debitar saldo.
* **R13 (Protección por Congelamiento):** Un usuario en estado `congelado` no puede realizar nuevas reservas (403), pero conserva su saldo y sus saldos **no caducan** en el cron de expiración.
* **R17 (Capacidades Físicas vs Vendibles):**
  - **Capacidad física semanal:** $74\text{ horas}$ ($13\times 5 + 9$).
  - **Mantenimiento semanal obligatorio:** $2\text{ horas}$ recurrentes por consultorio.
  - **Capacidad vendible semanal:** $72\text{ horas}$ ($74 - 2$). La membresía de consultorio completo valida no exceder 72 horas por semana.

---

## 2. Modelo de Base de Datos y Tablas (`{$wpdb->prefix}puerto_*`)

1. **`puerto_consultorios`**:
   - `id`: `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`
   - `nombre`: Verde (#2E7D32), Rosa (#E91E63), Azul (#1976D2), Negro (#212121), Café (#6D4C41).
   - `capacidad_fisica_semanal_horas`: `INT NOT NULL DEFAULT 74`
   - `horas_mantenimiento_semanal`: `INT NOT NULL DEFAULT 2`
   - `capacidad_max_semanal_horas`: `INT NOT NULL DEFAULT 72` (capacidad vendible)
2. **`puerto_reservas`**:
   - `id`: `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`
   - `user_id`, `consultorio_id`, `fecha_inicio`, `fecha_fin`, `tipo` (`hora`, `bloque`, `turno`, `completo`)
   - `estado`: `pendiente_pago`, `confirmada`, `consumida`, `cancelada`, `no_show`, `liberada`
   - `saldo_id`: `BIGINT UNSIGNED NULL`
   - `consumida_en`: `DATETIME NULL` (clave para idempotencia del cron a T-24h)
   - `es_recurrente`: `TINYINT(1) NOT NULL DEFAULT 0`
   - `serie_id`: `VARCHAR(36) NULL` (UUID v4 para cancelaciones de series)
3. **`puerto_bloqueos`**:
   - `id`: `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`
   - `consultorio_id`: `BIGINT UNSIGNED NULL` (NULL aplica a todos los consultorios)
   - `fecha_inicio`, `fecha_fin`: `DATETIME NOT NULL`
   - `motivo`: `ENUM('mantenimiento','feriado','admin','otro') NOT NULL`
   - `recurrente`: `TINYINT(1) NOT NULL DEFAULT 0`
   - `patron_recurrencia`: `VARCHAR(64) NULL` (`dia_semana:X;hora_inicio:HH:mm;hora_fin:HH:mm`)
4. **`puerto_saldos`**:
   - `id`, `user_id`, `producto_id`, `horas_compradas`, `horas_consumidas`, `fecha_compra`, `fecha_vencimiento`, `estado` (`vigente`, `agotado`, `vencido`), `renovado_por_compra_id`.
5. **`puerto_movimientos`**:
   - Libro mayor de auditoría: `id`, `user_id`, `saldo_id`, `reserva_id`, `tipo` (`compra`, `consumo`, `devolucion`, `ajuste_admin`, `expiracion`), `horas`, `motivo`, `created_at`.
6. **`puerto_usuarios_negocio`**:
   - `user_id`, `tipo_membresia` (`prepago`, `turno`, `completo`), `estado` (`activo`, `congelado`, `moroso`), `fecha_alta`.
7. **`puerto_reglas`**:
   - Configuración de negocio (`cancelacion_horas_minimas: 24`, `bloque_min_horas: 3`, `vigencia_meses: 6`, etc.).

---

## 3. Endpoints REST y Guía cURL (`/wp-json/puerto/v1`)

> **Autenticación en cURL:** Para interactuar desde scripts externos o Postman, envía la cookie de sesión de WordPress y la cabecera `X-WP-Nonce`, o utiliza Application Passwords de WordPress:
> `-u "admin_usuario:APPLICATION_PASSWORD"` o `-H "X-WP-Nonce: NONCE_ACTUAL"`

### 3.1. Consultar Consultorios y Capacidades (74h Físicas / 72h Vendibles)
```bash
curl -X GET "https://tu-sitio.com/wp-json/puerto/v1/consultorios" \
  -H "X-WP-Nonce: tu_nonce" \
  -H "Content-Type: application/json"
```

### 3.2. Crear Reserva Individual (Hora suelta o Bloque)
```bash
curl -X POST "https://tu-sitio.com/wp-json/puerto/v1/reservas" \
  -H "X-WP-Nonce: tu_nonce" \
  -H "Content-Type: application/json" \
  -d '{
    "consultorio_id": 1,
    "fecha_inicio": "2026-11-23 10:00:00",
    "fecha_fin": "2026-11-23 11:00:00",
    "tipo": "hora"
  }'
```

### 3.3. Crear Reserva en Bloque ($\ge 3$ Horas Consecutivas)
```bash
curl -X POST "https://tu-sitio.com/wp-json/puerto/v1/reservas" \
  -H "X-WP-Nonce: tu_nonce" \
  -H "Content-Type: application/json" \
  -d '{
    "consultorio_id": 2,
    "fecha_inicio": "2026-11-24 14:00:00",
    "fecha_fin": "2026-11-24 17:00:00",
    "tipo": "bloque"
  }'
```

### 3.4. Crear Reserva Recurrente (Serie Semanal con UUID `serie_id`)
```bash
curl -X POST "https://tu-sitio.com/wp-json/puerto/v1/reservas" \
  -H "X-WP-Nonce: tu_nonce" \
  -H "Content-Type: application/json" \
  -d '{
    "consultorio_id": 3,
    "fecha_inicio": "2026-11-25 09:00:00",
    "fecha_fin": "2026-11-25 10:00:00",
    "tipo": "hora",
    "es_recurrente": true,
    "semanas": 12
  }'
```

### 3.5. Cancelar Reserva Individual
```bash
curl -X POST "https://tu-sitio.com/wp-json/puerto/v1/reservas/42/cancelar" \
  -H "X-WP-Nonce: tu_nonce" \
  -H "Content-Type: application/json" \
  -d '{
    "motivo": "Cancelación solicitada por paciente con antelación"
  }'
```

### 3.6. Reagendar Reserva ($\ge 24\text{ h}$ de Anticipación)
```bash
curl -X POST "https://tu-sitio.com/wp-json/puerto/v1/reservas/42/reagendar" \
  -H "X-WP-Nonce: tu_nonce" \
  -H "Content-Type: application/json" \
  -d '{
    "nueva_fecha_inicio": "2026-11-26 15:00:00",
    "nueva_fecha_fin": "2026-11-26 16:00:00",
    "nuevo_consultorio_id": 1
  }'
```

### 3.7. Cancelar Serie Recurrente Completa
```bash
curl -X DELETE "https://tu-sitio.com/wp-json/puerto/v1/series/c9b1f234-8c45-4df3-a123-abcdef012345" \
  -H "X-WP-Nonce: tu_nonce" \
  -H "Content-Type: application/json"
```

### 3.8. Registrar Inasistencia No-Show (Solo Administrador)
```bash
curl -X POST "https://tu-sitio.com/wp-json/puerto/v1/reservas/42/no-show" \
  -H "X-WP-Nonce: tu_nonce_admin" \
  -H "Content-Type: application/json"
```

### 3.9. Configurar Mantenimiento Recurrente (2h Semanales)
```bash
curl -X POST "https://tu-sitio.com/wp-json/puerto/v1/admin/mantenimiento" \
  -H "X-WP-Nonce: tu_nonce_admin" \
  -H "Content-Type: application/json" \
  -d '{
    "consultorio_id": 1,
    "dia_semana": 1,
    "hora_inicio": "14:00",
    "hora_fin": "16:00",
    "vigente_desde": "2026-11-01 00:00:00"
  }'
```

### 3.10. Registrar Bloqueo Administrativo Puntual
```bash
curl -X POST "https://tu-sitio.com/wp-json/puerto/v1/admin/bloqueos" \
  -H "X-WP-Nonce: tu_nonce_admin" \
  -H "Content-Type: application/json" \
  -d '{
    "consultorio_id": 0,
    "fecha_inicio": "2026-12-25 08:00:00",
    "fecha_fin": "2026-12-25 21:00:00",
    "motivo": "Feriado oficial Navidad"
  }'
```

### 3.11. Ajuste o Compra de Saldo con Renovación R9
```bash
curl -X POST "https://tu-sitio.com/wp-json/puerto/v1/admin/usuarios/10/saldo" \
  -H "X-WP-Nonce: tu_nonce_admin" \
  -H "Content-Type: application/json" \
  -d '{
    "horas": 20.00,
    "tipo": "compra",
    "motivo": "Compra de paquete 20 horas (renovación automática R9)"
  }'
```

### 3.12. Congelar o Reactivar Usuario (R13)
```bash
curl -X POST "https://tu-sitio.com/wp-json/puerto/v1/admin/usuarios/10/congelar" \
  -H "X-WP-Nonce: tu_nonce_admin" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "congelado",
    "motivo": "Suspensión temporal por viaje del terapeuta"
  }'
```

---

## 4. Ejecución de la Suite de Pruebas Unitarias (PHPUnit)

Para ejecutar las 14 pruebas de integridad transaccional:
```bash
php phpunit.phar --configuration phpunit.xml
```

Resultado verificado:
```text
PHPUnit 10.5.66 by Sebastian Bergmann and contributors.
Runtime:       PHP 8.2.35
Configuration: .../puerto-core/phpunit.xml

..............                                                    14 / 14 (100%)

Time: 00:00.075, Memory: 26.00 MB
OK (14 tests, 162 assertions)
```

---

## 5. Empaquetado para Despliegue en Hostinger

Para empaquetar el plugin limpio (excluyendo tests, git y caché de phpunit) en un archivo `.zip` listo para cargar en **WordPress > Plugins > Añadir nuevo > Subir plugin** en Hostinger:

### En PowerShell (Windows):
```powershell
Compress-Archive -Path "puerto-core" -DestinationPath "puerto-core.zip" -Force
```

### O excluyendo archivos de desarrollo / tests mediante PowerShell:
```powershell
$tempDir = Join-Path $env:TEMP "puerto-core"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
Copy-Item -Recurse "puerto-core" $tempDir
Remove-Item -Recurse -Force "$tempDir\tests", "$tempDir\.phpunit.cache", "$tempDir\phpunit.phar", "$tempDir\phpunit.xml"
Compress-Archive -Path $tempDir -DestinationPath "puerto-core.zip" -Force
Remove-Item -Recurse -Force $tempDir
```
