<?php
declare(strict_types=1);

namespace PuertoCore\Cli;

use PuertoCore\Config\Constants;
use PuertoCore\Config\Reglas;
use PuertoCore\Database\Seeders\ConsultoriosSeeder;
use PuertoCore\Database\Seeders\ProductosSeeder;
use PuertoCore\Database\Seeders\ReglasSeeder;
use WP_CLI;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Comandos WP-CLI para la gestión, mantenimiento y seeders de Puerto Analítico.
 */
class PuertoCliCommand
{
    /**
     * Registra el comando en WP-CLI si este entorno está activo.
     */
    public static function register(): void
    {
        if (defined('WP_CLI') && WP_CLI) {
            WP_CLI::add_command('puerto', self::class);
        }
    }

    /**
     * Siembra los 5 consultorios físicos base de Puerto Analítico.
     *
     * ## EJEMPLO
     *
     *     wp puerto seed-consultorios
     *
     * @param array<string> $args
     * @param array<string, mixed> $assocArgs
     */
    public function seed_consultorios(array $args, array $assocArgs): void
    {
        WP_CLI::log('Sembrando consultorios de Puerto Analítico...');

        $res = ConsultoriosSeeder::seed();

        WP_CLI::success(sprintf(
            'Consultorios procesados: %d insertados, %d ya existían.',
            $res['insertados'],
            $res['omitidos']
        ));
    }

    /**
     * Siembra el catálogo oficial de productos y tarifas de Puerto Analítico.
     *
     * ## EJEMPLO
     *
     *     wp puerto seed-productos
     *
     * @param array<string> $args
     * @param array<string, mixed> $assocArgs
     */
    public function seed_productos(array $args, array $assocArgs): void
    {
        WP_CLI::log('Sembrando catálogo de productos y paquetes de Puerto Analítico...');

        $res = ProductosSeeder::seed();

        WP_CLI::success(sprintf(
            'Catálogo procesado: %d productos insertados, %d ya existían.',
            $res['insertados'],
            $res['omitidos']
        ));
    }

    /**
     * Siembra o reinicia las reglas de negocio en la base de datos.
     *
     * ## OPCIONES
     *
     * [--force]
     * : Sobrescribe las reglas existentes con los valores predeterminados.
     *
     * ## EJEMPLO
     *
     *     wp puerto seed-reglas --force
     *
     * @param array<string> $args
     * @param array<string, mixed> $assocArgs
     */
    public function seed_reglas(array $args, array $assocArgs): void
    {
        $force = isset($assocArgs['force']) && (bool) $assocArgs['force'];
        $insertadas = ReglasSeeder::seed($force);

        WP_CLI::success(sprintf('Reglas sincronizadas: %d registradas.', $insertadas));
    }

    /**
     * Muestra el estado del sistema, tablas y reglas de configuración.
     *
     * ## EJEMPLO
     *
     *     wp puerto status
     *
     * @param array<string> $args
     * @param array<string, mixed> $assocArgs
     */
    public function status(array $args, array $assocArgs): void
    {
        global $wpdb;

        WP_CLI::line('=============================================');
        WP_CLI::line('   ESTADO DE PUERTO ANALÍTICO (puerto-core)  ');
        WP_CLI::line('=============================================');
        WP_CLI::line('Versión Plugin: ' . PUERTO_CORE_VERSION);
        WP_CLI::line('Versión DB:     ' . get_option(Constants::DB_VERSION_OPTION, 'No instalada'));
        WP_CLI::line('Zona Horaria:   ' . Reglas::timezoneString());
        WP_CLI::line('Cancelación:    ' . Reglas::cancelacionHorasMinimas() . ' horas mínimas');
        WP_CLI::line('Bloque Mínimo:  ' . Reglas::bloqueMinHoras() . ' horas');
        WP_CLI::line('---------------------------------------------');

        $tablaConsultorios = $wpdb->prefix . Constants::TABLE_CONSULTORIOS;
        $tablaProductos    = $wpdb->prefix . Constants::TABLE_PRODUCTOS;
        $tablaReservas     = $wpdb->prefix . Constants::TABLE_RESERVAS;

        $cCount = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$tablaConsultorios}");
        $pCount = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$tablaProductos}");
        $rCount = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$tablaReservas}");

        WP_CLI::line(sprintf('Consultorios registrados: %d', $cCount));
        WP_CLI::line(sprintf('Productos activos:        %d', $pCount));
        WP_CLI::line(sprintf('Reservas totales en BD:   %d', $rCount));
        WP_CLI::line('=============================================');
    }
}
