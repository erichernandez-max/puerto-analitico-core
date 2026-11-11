<?php
declare(strict_types=1);

namespace PuertoCore;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Autoloader PSR-4 para el namespace PuertoCore.
 *
 * Permite que el plugin funcione de forma plug-and-play sin depender obligatoriamente
 * de Composer en entornos de producción compartidos (como Hostinger), aunque respeta
 * vendor/autoload.php si está disponible.
 */
spl_autoload_register(static function (string $class): void {
    $prefix = 'PuertoCore\\';
    $len = strlen($prefix);

    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = PUERTO_CORE_PATH . 'src/' . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});
