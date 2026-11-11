# Software Puerto Analítico

Repositorio principal del sistema digital para **Puerto Analítico** (México).

## Componentes del Proyecto

1. **`puerto-core/`**: Plugin oficial de WordPress/PHP (Backend & API REST).
   - Base de datos relacional y migraciones con `dbDelta` (`puerto_*`).
   - Endpoints REST bajo namespace `puerto/v1`.
   - Contenedores Shortcode `[puerto_app_usuario]` y `[puerto_app_admin]`.
   - Lógica de reglas de negocio (`Reglas`), roles y capabilities (`puerto_paciente`, `puerto_reservar`).
   - Comandos WP-CLI (`wp puerto ...`).
   - Ver [puerto-core/README.md](puerto-core/README.md) para documentación detallada, instrucciones de activación y pruebas cURL/Postman.

2. **Frontend React (Fases F3 y F4)**:
   - Se compilará e inyectará dentro de los contenedores `#puerto-usuario-root` y `#puerto-admin-root`.
