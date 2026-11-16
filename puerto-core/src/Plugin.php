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

final class Plugin
{
    private static ?self $instance = null;

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

    public function boot(): void
    {
        add_action('init', [$this, 'onInit']);
        add_action('rest_api_init', [$this, 'registerRestRoutes']);

        AppShortcodes::register();
        PuertoCliCommand::register();
        CronManager::register();
    }

    public function onInit(): void
    {
        load_plugin_textdomain(
            'puerto-core',
            false,
            dirname(plugin_basename(PUERTO_CORE_FILE)) . '/languages'
        );
        RolesAndCapabilities::register();
    }

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

    public static function activate(): void
    {
        Migrator::migrate();
        ConsultoriosSeeder::seed();
        ProductosSeeder::seed();
        RolesAndCapabilities::register();
        CronManager::scheduleEvents();
        flush_rewrite_rules();
    }

    public static function deactivate(): void
    {
        CronManager::clearEvents();
        RolesAndCapabilities::unregister();
        flush_rewrite_rules();
    }
}