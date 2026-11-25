<?php
declare(strict_types=1);

/**
 * DEV BYPASS / SANDBOX — Puerto Analítico
 * 
 * Permite probar la interfaz y las reservas simulando un inicio de sesión
 * sin pasar por Nextend o Google OAuth.
 *
 * Modo de uso:
 *  - Activar Admin (ID 1):  visita cualquier página con ?sandbox_admin=true
 *  - Activar Usuario libre: visita con ?sandbox_user=<ID> (ej. ?sandbox_user=2)
 *  - Desactivar / Salir:    visita con ?sandbox_admin=false (o ?sandbox_user=off)
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('init', function (): void {
    // 1. Desactivar Sandbox / Cerrar sesión simulada
    if (
        (isset($_GET['sandbox_admin']) && $_GET['sandbox_admin'] === 'false') ||
        (isset($_GET['sandbox_user']) && $_GET['sandbox_user'] === 'off')
    ) {
        wp_logout();
        return;
    }

    $targetUserId = 0;

    // 2. Comprobar parámetro sandbox_admin=true (ID 1)
    if (isset($_GET['sandbox_admin']) && $_GET['sandbox_admin'] === 'true') {
        $targetUserId = 1;
    }

    // 3. Opcional: especificar ID de usuario dinámico (?sandbox_user=X)
    if (isset($_GET['sandbox_user'])) {
        $parsedId = absint($_GET['sandbox_user']);
        if ($parsedId > 0) {
            $targetUserId = $parsedId;
        }
    }

    // Si se activó el bypass para un usuario:
    if ($targetUserId > 0) {
        // Establecer usuario en el runtime actual de WordPress
        wp_set_current_user($targetUserId);

        // Crear las cookies de sesión oficiales de WordPress en el navegador
        // para que las peticiones REST subsiguientes desde React funcionen con éxito.
        if (!is_user_logged_in() || get_current_user_id() !== $targetUserId) {
            wp_set_auth_cookie($targetUserId, true);
        }
    }
}, 1);
