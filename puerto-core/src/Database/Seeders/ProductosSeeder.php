<?php
declare(strict_types=1);

namespace PuertoCore\Database\Seeders;

use PuertoCore\Config\Constants;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Seeder para el catálogo oficial de productos de Puerto Analítico.
 */
class ProductosSeeder
{
    /**
     * Catálogo base de tarifas y productos.
     */
    public const PRODUCTOS = [
        [
            'nombre'                             => 'Hora Suelta',
            'tipo'                               => 'hora_suelta',
            'horas_incluidas'                    => 1.00,
            'precio'                             => 220.00,
            'descuento_pct'                      => 0.00,
            'vigencia_meses'                     => 6,
            'requiere_disponibilidad_consecutiva'=> 0,
            'activo'                             => 1,
        ],
        [
            'nombre'                             => 'Bloque 3 Horas',
            'tipo'                               => 'bloque',
            'horas_incluidas'                    => 3.00,
            'precio'                             => 600.00,
            'descuento_pct'                      => 9.09,
            'vigencia_meses'                     => 6,
            'requiere_disponibilidad_consecutiva'=> 1,
            'activo'                             => 1,
        ],
        [
            'nombre'                             => 'Bloque 4 Horas',
            'tipo'                               => 'bloque',
            'horas_incluidas'                    => 4.00,
            'precio'                             => 780.00,
            'descuento_pct'                      => 11.36,
            'vigencia_meses'                     => 6,
            'requiere_disponibilidad_consecutiva'=> 1,
            'activo'                             => 1,
        ],
        [
            'nombre'                             => 'Bloque 5 Horas',
            'tipo'                               => 'bloque',
            'horas_incluidas'                    => 5.00,
            'precio'                             => 900.00,
            'descuento_pct'                      => 18.18,
            'vigencia_meses'                     => 6,
            'requiere_disponibilidad_consecutiva'=> 1,
            'activo'                             => 1,
        ],
        [
            'nombre'                             => 'Bloque 6 Horas',
            'tipo'                               => 'bloque',
            'horas_incluidas'                    => 6.00,
            'precio'                             => 1070.00,
            'descuento_pct'                      => 18.94,
            'vigencia_meses'                     => 6,
            'requiere_disponibilidad_consecutiva'=> 1,
            'activo'                             => 1,
        ],
        [
            'nombre'                             => 'Hora Extra en Bloque',
            'tipo'                               => 'bloque',
            'horas_incluidas'                    => 1.00,
            'precio'                             => 170.00,
            'descuento_pct'                      => 22.73,
            'vigencia_meses'                     => 6,
            'requiere_disponibilidad_consecutiva'=> 1,
            'activo'                             => 1,
        ],
        [
            'nombre'                             => 'Membresía Turno',
            'tipo'                               => 'turno',
            'horas_incluidas'                    => 36.00,
            'precio'                             => 6500.00,
            'descuento_pct'                      => 0.00,
            'vigencia_meses'                     => 1,
            'requiere_disponibilidad_consecutiva'=> 1,
            'activo'                             => 1,
        ],
        [
            'nombre'                             => 'Consultorio Completo',
            'tipo'                               => 'consultorio_completo',
            'horas_incluidas'                    => 72.00,
            'precio'                             => 10500.00,
            'descuento_pct'                      => 0.00,
            'vigencia_meses'                     => 1,
            'requiere_disponibilidad_consecutiva'=> 1,
            'activo'                             => 1,
        ],
    ];

    /**
     * Inserta los productos si no existen por nombre.
     *
     * @return array{insertados: int, omitidos: int}
     */
    public static function seed(): array
    {
        global $wpdb;

        $tabla = $wpdb->prefix . Constants::TABLE_PRODUCTOS;
        $insertados = 0;
        $omitidos = 0;

        foreach (self::PRODUCTOS as $producto) {
            $existe = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$tabla} WHERE nombre = %s",
                $producto['nombre']
            ));

            if (!$existe) {
                $wpdb->insert(
                    $tabla,
                    [
                        'nombre'                             => $producto['nombre'],
                        'tipo'                               => $producto['tipo'],
                        'horas_incluidas'                    => $producto['horas_incluidas'],
                        'precio'                             => $producto['precio'],
                        'descuento_pct'                      => $producto['descuento_pct'],
                        'vigencia_meses'                     => $producto['vigencia_meses'],
                        'requiere_disponibilidad_consecutiva'=> $producto['requiere_disponibilidad_consecutiva'],
                        'activo'                             => $producto['activo'],
                        'created_at'                         => current_time('mysql'),
                    ],
                    ['%s', '%s', '%f', '%f', '%f', '%d', '%d', '%d', '%s']
                );
                $insertados++;
            } else {
                $omitidos++;
            }
        }

        return [
            'insertados' => $insertados,
            'omitidos'   => $omitidos,
        ];
    }
}
