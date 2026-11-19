<?php
declare(strict_types=1);

namespace PuertoCore\Shortcodes;

use PuertoCore\Auth\RolesAndCapabilities;
use PuertoCore\Config\Constants;
use PuertoCore\Config\Reglas;

if (!defined('ABSPATH')) {
    exit;
}

class AppShortcodes
{
    public static function register(): void
    {
        add_shortcode('puerto_app_usuario', [self::class, 'renderUsuarioApp']);
        add_shortcode('puerto_app_admin', [self::class, 'renderAdminApp']);

        add_action('wp_enqueue_scripts', [self::class, 'registerAssets']);
        add_action('admin_enqueue_scripts', [self::class, 'registerAssets']);
    }

    public static function registerAssets(): void
    {
        $uploadDir = wp_upload_dir();
        $puertoAppDir = $uploadDir['basedir'] . '/puerto-app';
        $puertoAppUrl = $uploadDir['baseurl'] . '/puerto-app';

        // Registrar App Usuario
        if (file_exists($puertoAppDir . '/app-usuario.js')) {
            wp_register_script('puerto-app-usuario', $puertoAppUrl . '/app-usuario.js', [], (string) filemtime($puertoAppDir . '/app-usuario.js'), true);
            wp_register_style('puerto-app-usuario-css', $puertoAppUrl . '/app-usuario.css', [], (string) filemtime($puertoAppDir . '/app-usuario.css'));
        }

        // Registrar App Admin (NUEVO)
        if (file_exists($puertoAppDir . '/app-admin.js')) {
            wp_register_script('puerto-app-admin', $puertoAppUrl . '/app-admin.js', [], (string) filemtime($puertoAppDir . '/app-admin.js'), true);
            wp_register_style('puerto-app-admin-css', $puertoAppUrl . '/app-admin.css', [], (string) filemtime($puertoAppDir . '/app-admin.css'));
        }

        // Fallbacks (Placeholders)
        wp_register_script('puerto-app-placeholder', PUERTO_CORE_URL . 'public/js/puerto-app-placeholder.js', [], PUERTO_CORE_VERSION, true);
        wp_register_style('puerto-public-css', PUERTO_CORE_URL . 'public/css/puerto-public.css', [], PUERTO_CORE_VERSION);
        wp_register_script('puerto-admin-placeholder', PUERTO_CORE_URL . 'admin/js/puerto-admin-placeholder.js', [], PUERTO_CORE_VERSION, true);
        wp_register_style('puerto-admin-css', PUERTO_CORE_URL . 'admin/css/puerto-admin.css', [], PUERTO_CORE_VERSION);
    }

    public static function enqueueUsuarioAssets(): void
    {
        $uploadDir = wp_upload_dir();
        $puertoAppDir = $uploadDir['basedir'] . '/puerto-app';

        if (file_exists($puertoAppDir . '/app-usuario.js')) {
            wp_enqueue_style('puerto-app-usuario-css');
            wp_enqueue_script('puerto-app-usuario');
            self::injectConfig('puerto-app-usuario');
        } else {
            wp_enqueue_style('puerto-public-css');
            wp_enqueue_script('puerto-app-placeholder');
            self::injectConfig('puerto-app-placeholder');
        }
    }

    // NUEVA FUNCIÓN PARA LA APP ADMIN
    public static function enqueueAdminAssets(): void
    {
        $uploadDir = wp_upload_dir();
        $puertoAppDir = $uploadDir['basedir'] . '/puerto-app';

        if (file_exists($puertoAppDir . '/app-admin.js')) {
            wp_enqueue_style('puerto-app-admin-css');
            wp_enqueue_script('puerto-app-admin');
            self::injectConfig('puerto-app-admin');
        } else {
            wp_enqueue_style('puerto-admin-css');
            wp_enqueue_script('puerto-admin-placeholder');
            self::injectConfig('puerto-admin-placeholder');
        }
    }

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

    public static function renderUsuarioApp(): string
    {
        self::enqueueUsuarioAssets();
        $uploadDir = wp_upload_dir();
        $manifestPath = $uploadDir['basedir'] . '/puerto-app/manifest.json';
        $manifestUrl  = $uploadDir['baseurl'] . '/puerto-app/manifest.json';

        if (file_exists($manifestPath)) {
            $manifestTag = sprintf('<link rel="manifest" href="%s">', esc_url($manifestUrl));
            add_action('wp_head', static function () use ($manifestTag) {
                echo $manifestTag . "\n";
            });
        }
        return '<div id="puerto-usuario-root" class="puerto-app-container" data-app="usuario"><div class="puerto-loader-placeholder">' . esc_html__('Cargando Puerto Analítico...', 'puerto-core') . '</div></div>';
    }

    public static function renderAdminApp(): string
    {
        if (!current_user_can('manage_options')) {
            return '<div class="puerto-alert-error">' . esc_html__('Acceso denegado: Se requieren permisos de administrador para visualizar este panel.', 'puerto-core') . '</div>';
        }

        // AHORA SÍ CARGA LOS ASSETS REALES O EL PLACEHOLDER
        self::enqueueAdminAssets();

        return '<div id="puerto-admin-root" class="puerto-admin-container" data-app="admin"><div class="puerto-loader-placeholder">' . esc_html__('Cargando Panel Administrativo...', 'puerto-core') . '</div></div>';
    }
}