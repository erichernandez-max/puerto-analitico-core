<?php
declare(strict_types=1);

/**
 * Plugin Name:       Puerto Analítico Core
 * Plugin URI:        https://puertoanalitico.mx
 * Description:       Núcleo del sistema de gestión y reservas de consultorios para Puerto Analítico. Expone API REST bajo namespace puerto/v1 consumida por aplicaciones React incrustadas mediante shortcodes.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:            Puerto Analítico
 * Author URI:        https://puertoanalitico.mx
 * License:           Proprietary
 * Text Domain:       puerto-core
 * Domain Path:       /languages
 */

namespace PuertoCore;

if (!defined('ABSPATH')) {
    exit;
}

// Constantes de versión y rutas
define('PUERTO_CORE_VERSION', '1.0.0');
define('PUERTO_CORE_FILE', __FILE__);
define('PUERTO_CORE_PATH', plugin_dir_path(__FILE__));
define('PUERTO_CORE_URL', plugin_dir_url(__FILE__));

// Carga de autoloader (Composer o nativo PSR-4 para Hostinger)
if (file_exists(PUERTO_CORE_PATH . 'vendor/autoload.php')) {
    require_once PUERTO_CORE_PATH . 'vendor/autoload.php';
} else {
    require_once PUERTO_CORE_PATH . 'includes/autoloader.php';
}

// Carga de funciones auxiliares globales
require_once PUERTO_CORE_PATH . 'includes/helpers.php';

// Hooks de activación y desactivación
register_activation_hook(PUERTO_CORE_FILE, [Plugin::class, 'activate']);
register_deactivation_hook(PUERTO_CORE_FILE, [Plugin::class, 'deactivate']);

// Arrancar el plugin
add_action('plugins_loaded', static function (): void {
    Plugin::instance()->boot();
});
