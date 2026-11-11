<?php
declare(strict_types=1);

namespace PuertoCore\Shortcodes;

use PuertoCore\Auth\RolesAndCapabilities;
use PuertoCore\Config\Constants;
use PuertoCore\Config\Reglas;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Registro de shortcodes contenedores para las aplicaciones React de usuario y administración.
 */
class AppShortcodes
{
    /**
     * Inicializa los hooks de shortcodes.
     */
    public static function register(): void
    {
        add_shortcode('puerto_app_usuario', [self::class, 'renderUsuarioApp']);
        add_shortcode('puerto_app_admin', [self::class, 'renderAdminApp']);

        add_action('wp_enqueue_scripts', [self::class, 'registerAssets']);
        add_action('admin_enqueue_scripts', [self::class, 'registerAssets']);
    }

    /**
     * Registra los scripts y estilos necesarios para los shortcodes.
     */
    public static function registerAssets(): void
    {
        $uploadDir = wp_upload_dir();
        $puertoAppJsPath = $uploadDir['basedir'] . '/puerto-app/app-usuario.js';
        $puertoAppJsUrl = $uploadDir['baseurl'] . '/puerto-app/app-usuario.js';
        $puertoAppCssUrl = $uploadDir['baseurl'] . '/puerto-app/app-usuario.css';

        if (file_exists($puertoAppJsPath)) {
            wp_register_script(
                'puerto-app-usuario',
                $puertoAppJsUrl,
                [],
                PUERTO_CORE_VERSION,
                true
            );
            wp_register_style(
                'puerto-app-usuario-css',
                $puertoAppCssUrl,
                [],
                PUERTO_CORE_VERSION
            );
        }

        // Script público para el frontend del usuario (fallback)
        wp_register_script(
            'puerto-app-placeholder',
            PUERTO_CORE_URL . 'public/js/puerto-app-placeholder.js',
            [],
            PUERTO_CORE_VERSION,
            true
        );

        wp_register_style(
            'puerto-public-css',
            PUERTO_CORE_URL . 'public/css/puerto-public.css',
            [],
            PUERTO_CORE_VERSION
        );

        // Script para el panel administrativo
        wp_register_script(
            'puerto-admin-placeholder',
            PUERTO_CORE_URL . 'admin/js/puerto-admin-placeholder.js',
            [],
            PUERTO_CORE_VERSION,
            true
        );

        wp_register_style(
            'puerto-admin-css',
            PUERTO_CORE_URL . 'admin/css/puerto-admin.css',
            [],
            PUERTO_CORE_VERSION
        );
    }

    /**
     * Inyecta la configuración global de JavaScript para la API REST.
     */
    private static function injectConfig(string $handle): void
    {
        $userId = get_current_user_id();
        $uploadDir = wp_upload_dir();
        $logoUrl = $uploadDir['baseurl'] . '/puerto-app/icons/icon-192.png';

        $config = [
            'apiUrl'         => esc_url_raw(rest_url(Constants::REST_NAMESPACE)),
            'nonce'          => wp_create_nonce('wp_rest'),
            'isLoggedIn'     => is_user_logged_in(),
            'userId'         => $userId,
            'tz'             => Reglas::timezoneString(),
            'logoUrl'        => $logoUrl,
            'canReserve'     => RolesAndCapabilities::canReserve($userId),
            'isAdmin'        => current_user_can('manage_options'),
            'reglas'         => [
                'cancelacionHorasMinimas' => Reglas::cancelacionHorasMinimas(),
                'bloqueMinHoras'          => Reglas::bloqueMinHoras(),
                'horarioLvInicio'         => Reglas::horarioLvInicio(),
                'horarioLvFin'            => Reglas::horarioLvFin(),
                'horarioSabInicio'        => Reglas::horarioSabInicio(),
                'horarioSabFin'           => Reglas::horarioSabFin(),
                'domingoCerrado'          => Reglas::domingoCerrado(),
                'timezone'                => Reglas::timezoneString(),
            ],
        ];

        wp_localize_script($handle, 'PuertoConfig', $config);
        wp_add_inline_script($handle, 'window.puertoConfig = window.PuertoConfig;', 'before');
    }

    /**
     * Renderiza el contenedor para la app del usuario: [puerto_app_usuario]
     */
    public static function renderUsuarioApp(): string
    {
        $uploadDir = wp_upload_dir();
        $manifestUrl = $uploadDir['baseurl'] . '/puerto-app/manifest.json';
        $manifestTag = sprintf('<link rel="manifest" href="%s">', esc_url($manifestUrl));
        add_action('wp_head', static function () use ($manifestTag) {
            echo $manifestTag . "\n";
        });

        if (wp_script_is('puerto-app-usuario', 'registered')) {
            wp_enqueue_style('puerto-app-usuario-css');
            wp_enqueue_script('puerto-app-usuario');
            self::injectConfig('puerto-app-usuario');
        } else {
            wp_enqueue_style('puerto-public-css');
            wp_enqueue_script('puerto-app-placeholder');
            self::injectConfig('puerto-app-placeholder');
        }

        return '<div id="puerto-usuario-root" class="puerto-app-container" data-app="usuario"><div class="puerto-loader-placeholder">' . esc_html__('Cargando Puerto Analítico...', 'puerto-core') . '</div></div>';
    }

    /**
     * Renderiza el contenedor para la app administrativa: [puerto_app_admin]
     */
    public static function renderAdminApp(): string
    {
        if (!current_user_can('manage_options')) {
            return '<div class="puerto-alert-error">' . esc_html__('Acceso denegado: Se requieren permisos de administrador para visualizar este panel.', 'puerto-core') . '</div>';
        }

        wp_enqueue_style('puerto-admin-css');
        wp_enqueue_script('puerto-admin-placeholder');
        self::injectConfig('puerto-admin-placeholder');

        return '<div id="puerto-admin-root" class="puerto-admin-container" data-app="admin"><div class="puerto-loader-placeholder">' . esc_html__('Cargando Panel Administrativo...', 'puerto-core') . '</div></div>';
    }
}
