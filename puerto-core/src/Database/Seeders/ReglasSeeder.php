<?php
declare(strict_types=1);

namespace PuertoCore\Database\Seeders;

use PuertoCore\Config\Constants;
use PuertoCore\Config\Reglas;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Seeder para las reglas por defecto del negocio.
 */
class ReglasSeeder
{
    public const DEFAULTS = [
        'cancelacion_horas_minimas' => '24',
        'bloque_min_horas'          => '3',
        'vigencia_meses'            => '6',
        'consumo_offset_horas'      => '24',
        'tz'                        => 'America/Mexico_City',
        'horario_lv_inicio'         => '08:00',
        'horario_lv_fin'            => '21:00',
        'horario_sab_inicio'        => '08:00',
        'horario_sab_fin'           => '17:00',
        'domingo_cerrado'           => '1',
    ];

    /**
     * Inserta las reglas por defecto si no existen previamente.
     */
    public static function seed(bool $forceOverwrite = false): int
    {
        global $wpdb;

        $tabla = $wpdb->prefix . Constants::TABLE_REGLAS;
        $insertadas = 0;

        foreach (self::DEFAULTS as $clave => $valor) {
            $existe = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$tabla} WHERE clave = %s",
                $clave
            ));

            if (!$existe || $forceOverwrite) {
                $wpdb->replace(
                    $tabla,
                    [
                        'clave' => $clave,
                        'valor' => $valor,
                    ],
                    ['%s', '%s']
                );
                $insertadas++;
            }
        }

        Reglas::flush();

        return $insertadas;
    }
}
