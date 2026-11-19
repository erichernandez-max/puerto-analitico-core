# Contexto del Proyecto: Puerto Analítico

## Entorno de Producción
- **Dominio:** https://balsasanaliticas.com
- **API Endpoint:** https://balsasanaliticas.com/wp-json/puerto/v1
- **WordPress:** Alojado en Hostinger (Acceso SSH: u359755993@212.1.208.197 -p 65002)

## Shortcodes de WordPress
- **App Usuario:** `[puerto_app_usuario]` (Página: /puerto-analitico/agendar/)
- **App Admin:** `[puerto_app_admin]` (Página: /puerto-analitico/admin-consul/)

## Rutas de Archivos en Hostinger
- **Plugin PHP:** `/home/u359755993/public_html/wp-content/plugins/puerto-core/`
- **Assets React (JS/CSS):** `/home/u359755993/public_html/wp-content/uploads/puerto-app/`

## Flujo de Trabajo (¡IMPORTANTE!)
- **Despliegue Manual:** NO USAMOS GitHub Actions porque fallaba. 
- **Para actualizar el Backend:** Compilar/cambiar el PHP y subirlo manualmente a la carpeta del plugin.
- **Para actualizar el Frontend:** Ejecutar `npm run build` en `apps/admin` o `apps/usuario`. Subir el archivo `app-admin.js`/`app-usuario.js` resultante a `uploads/puerto-app/` usando el Administrador de Archivos de Hostinger (Drag & Drop).
- **Siempre** guardar los Enlaces Permanentes en WordPress después de cambiar PHP.

## Estado Actual
- **F3 (App Usuario):** Completada y funcionando (lógica de horas apartadas implementada).
- **F4.1 (Dashboard Admin):** Completada y funcionando (métricas, gráficos).
- **Próximos pasos:** F4.2 (Gestión de Usuarios), F4.3 (Bloqueos masivos), F4.4 (Auditoría).