<?php
declare(strict_types=1);

namespace PuertoCore\Database\Seeders;

use PuertoCore\Config\Constants;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Seeder para los 5 consultorios físicos de Puerto Analítico.
 * F2: 74 horas físicas agendables por semana (L-V 13h*5 + Sáb 9h),
 * 2 horas de mantenimiento semanal, y 72 horas vendibles para membresía completa.
 */
class ConsultoriosSeeder
{
    /**
     * Lista de los consultorios base.
     */
    public const CONSULTORIOS = [
        [
            'nombre'                         => 'Consultorio Verde',
            'color'                          => '#2E7D32',
            'activo'                         => 1,
            'google_calendar_id'             => null,
            'capacidad_fisica_semanal_horas' => 74,
            'horas_mantenimiento_semanal'    => 2,
            'capacidad_max_semanal_horas'    => 72,
        ],
        [
            'nombre'                         => 'Consultorio Rosa',
            'color'                          => '#E91E63',
            'activo'                         => 1,
            'google_calendar_id'             => null,
            'capacidad_fisica_semanal_horas' => 74,
            'horas_mantenimiento_semanal'    => 2,
            'capacidad_max_semanal_horas'    => 72,
        ],
        [
            'nombre'                         => 'Consultorio Azul',
            'color'                          => '#1976D2',
            'activo'                         => 1,
            'google_calendar_id'             => null,
            'capacidad_fisica_semanal_horas' => 74,
            'horas_mantenimiento_semanal'    => 2,
            'capacidad_max_semanal_horas'    => 72,
        ],
        [
            'nombre'                         => 'Consultorio Negro',
            'color'                          => '#212121',
            'activo'                         => 1,
            'google_calendar_id'             => null,
            'capacidad_fisica_semanal_horas' => 74,
            'horas_mantenimiento_semanal'    => 2,
            'capacidad_max_semanal_horas'    => 72,
        ],
        [
            'nombre'                         => 'Consultorio Café',
            'color'                          => '#6D4C41',
            'activo'                         => 1,
            'google_calendar_id'             => null,
            'capacidad_fisica_semanal_horas' => 74,
            'horas_mantenimiento_semanal'    => 2,
            'capacidad_max_semanal_horas'    => 72,
        ],
    ];

    /**
     * Inserta los consultorios evitando duplicados por nombre y actualiza capacidades si ya existen.
     *
     * @return array{insertados: int, actualizados: int, omitidos: int}
     */
    public static function seed(): array
    {
        global $wpdb;

        $tabla = $wpdb->prefix . Constants::TABLE_CONSULTORIOS;
        $insertados = 0;
        $actualizados = 0;
        $omitidos = 0;

        foreach (self::CONSULTORIOS as $consultorio) {
            $existente = $wpdb->get_row($wpdb->prepare(
                "SELECT id, capacidad_fisica_semanal_horas FROM {$tabla} WHERE nombre = %s",
                $consultorio['nombre']
            ), ARRAY_A);

            if (!$existente) {
                $wpdb->insert(
                    $tabla,
                    [
                        'nombre'                         => $consultorio['nombre'],
                        'color'                          => $consultorio['color'],
                        'activo'                         => $consultorio['activo'],
                        'google_calendar_id'             => $consultorio['google_calendar_id'],
                        'capacidad_fisica_semanal_horas' => $consultorio['capacidad_fisica_semanal_horas'],
                        'horas_mantenimiento_semanal'    => $consultorio['horas_mantenimiento_semanal'],
                        'capacidad_max_semanal_horas'    => $consultorio['capacidad_max_semanal_horas'],
                        'created_at'                     => function_exists('current_time') ? current_time('mysql') : date('Y-m-d H:i:s'),
                    ],
                    ['%s', '%s', '%d', '%s', '%d', '%d', '%d', '%s']
                );
                $insertados++;
            } else {
                // Actualizar capacidades F2 si no estaban fijadas
                $wpdb->update(
                    $tabla,
                    [
                        'capacidad_fisica_semanal_horas' => $consultorio['capacidad_fisica_semanal_horas'],
                        'horas_mantenimiento_semanal'    => $consultorio['horas_mantenimiento_semanal'],
                        'capacidad_max_semanal_horas'    => $consultorio['capacidad_max_semanal_horas'],
                    ],
                    ['id' => (int) $existente['id']],
                    ['%d', '%d', '%d'],
                    ['%d']
                );
                $actualizados++;
            }
        }

        return [
            'insertados'   => $insertados,
            'actualizados' => $actualizados,
            'omitidos'     => $omitidos,
        ];
    }
}
