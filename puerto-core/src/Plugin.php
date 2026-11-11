<?php
declare(strict_types=1);

namespace PuertoCore;

use PuertoCore\Auth\RolesAndCapabilities;
use PuertoCore\Cli\PuertoCliCommand;
use PuertoCore\Cron\CronManager;
use PuertoCore\Database\Migrator;
use PuertoCore\Database\Seeders\ConsultoriosSeeder;
use PuertoCore\Database\Seeders\ProductosSeeder;
use PuertoCore\Database\Seeders\ReglasSeeder;
use PuertoCore\Rest\AdminController;
use PuertoCore\Rest\ConsultoriosController;
use PuertoCore\Rest\DisponibilidadController;
use PuertoCore\Rest\MeController;
use PuertoCore\Rest\ProductosController;
use PuertoCore\Rest\ReservasController;
use PuertoCore\Rest\SoporteController;
use PuertoCore\Shortcodes\AppShortcodes;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Orquestador principal del plugin Puerto Analítico Core.
 */
final class Plugin
{
    private static ?self $instance = null;

    /**
     * Instancia única (Singleton).
     */
    public static function instance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct()
    {
    }

    /**
     * Inicializa los hooks principales del ciclo de vida de WordPress.
     */
    public function boot(): void
    {
        add_action('init', [$this, 'onInit']);
        add_action('rest_api_init', [$this, 'registerRestRoutes']);

        // Registrar shortcodes
        AppShortcodes::register();

        // Registrar comandos WP-CLI
        PuertoCliCommand::register();

        // Registrar crons (F2: consumo horario T-24h y expiración diaria a las 03:00)
        CronManager::register();
    }

    /**
     * Hook 'init' de WordPress: carga traducciones y asegura roles.
     */
    public function onInit(): void
    {
        load_plugin_textdomain(
            'puerto-core',
            false,
            dirname(plugin_basename(PUERTO_CORE_FILE)) . '/languages'
        );

        // Asegurar que las capabilities y roles estén disponibles
        RolesAndCapabilities::register();
    }

    /**
     * Hook 'rest_api_init' de WordPress: inicializa y monta los controladores REST.
     */
    public function registerRestRoutes(): void
    {
        $controllers = [
            new ConsultoriosController(),
            new DisponibilidadController(),
            new ProductosController(),
            new MeController(),
            new ReservasController(),
            new SoporteController(),
            new AdminController(),
        ];

        foreach ($controllers as $controller) {
            $controller->registerRoutes();
        }
    }

    /**
     * Ejecutado al activar el plugin en WordPress.
     */
    public static function activate(): void
    {
        // 1. Ejecutar migraciones dbDelta e incrementales (F2: 74h/2h/72h, bloqueos, consumida_en)
        Migrator::migrate();

        // 2. Sembrar consultorios y productos base si no existen
        ConsultoriosSeeder::seed();
        ProductosSeeder::seed();

        // 3. Registrar roles y capabilities
        RolesAndCapabilities::register();

        // 4. Programar eventos WP-Cron
        CronManager::scheduleEvents();

        // 5. Refrescar reglas de reescritura
        flush_rewrite_rules();
    }

    /**
     * Ejecutado al desactivar el plugin en WordPress.
     */
    public static function deactivate(): void
    {
        CronManager::clearEvents();
        RolesAndCapabilities::unregister();
        flush_rewrite_rules();
    }
}
