<?php
declare(strict_types=1);

namespace PuertoCore\Config;

use DateTimeZone;
use Exception;
use wpdb;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Servicio de configuración y reglas de negocio con persistencia en BD y caché en memoria.
 */
class Reglas
{
    private const CACHE_KEY_ALL = 'puerto_reglas_all';

    /**
     * Valores por defecto en caso de ausencia en base de datos.
     */
    private const DEFAULTS = [
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
     * Obtiene el valor de una regla específica.
     */
    public static function get(string $clave, mixed $default = null): mixed
    {
        $reglas = self::all();

        if (array_key_exists($clave, $reglas)) {
            return $reglas[$clave];
        }

        if ($default !== null) {
            return $default;
        }

        return self::DEFAULTS[$clave] ?? null;
    }

    /**
     * Actualiza o crea una regla en la base de datos e invalida el caché.
     */
    public static function set(string $clave, mixed $valor): bool
    {
        global $wpdb;

        $tabla = $wpdb->prefix . Constants::TABLE_REGLAS;
        $valorString = is_bool($valor) ? ($valor ? '1' : '0') : (string) $valor;

        $resultado = $wpdb->replace(
            $tabla,
            [
                'clave' => $clave,
                'valor' => $valorString,
            ],
            ['%s', '%s']
        );

        if ($resultado !== false) {
            self::flush();
            return true;
        }

        return false;
    }

    /**
     * Devuelve todas las reglas mapeadas [clave => valor], utilizando wp_cache.
     *
     * @return array<string, string>
     */
    public static function all(): array
    {
        $cached = wp_cache_get(self::CACHE_KEY_ALL, Constants::CACHE_GROUP_REGLAS);
        if (is_array($cached)) {
            return $cached;
        }

        global $wpdb;
        $tabla = $wpdb->prefix . Constants::TABLE_REGLAS;

        // Comprobar si la tabla existe antes de consultar
        $filas = $wpdb->get_results("SELECT clave, valor FROM {$tabla}", ARRAY_A);

        $reglas = self::DEFAULTS;
        if (!empty($filas) && is_array($filas)) {
            foreach ($filas as $fila) {
                if (isset($fila['clave'], $fila['valor'])) {
                    $reglas[(string) $fila['clave']] = (string) $fila['valor'];
                }
            }
        }

        wp_cache_set(self::CACHE_KEY_ALL, $reglas, Constants::CACHE_GROUP_REGLAS, 3600);

        return $reglas;
    }

    /**
     * Limpia el caché de reglas en wp_cache.
     */
    public static function flush(): void
    {
        wp_cache_delete(self::CACHE_KEY_ALL, Constants::CACHE_GROUP_REGLAS);
    }

    // ==========================================
    // Métodos tipados para reglas de negocio
    // ==========================================

    public static function cancelacionHorasMinimas(): int
    {
        return (int) self::get('cancelacion_horas_minimas', 24);
    }

    public static function bloqueMinHoras(): int
    {
        return (int) self::get('bloque_min_horas', 3);
    }

    public static function vigenciaMeses(): int
    {
        return (int) self::get('vigencia_meses', 6);
    }

    public static function consumoOffsetHoras(): int
    {
        return (int) self::get('consumo_offset_horas', 24);
    }

    public static function timezoneString(): string
    {
        return (string) self::get('tz', 'America/Mexico_City');
    }

    public static function timezone(): DateTimeZone
    {
        $tzString = self::timezoneString();
        try {
            return new DateTimeZone($tzString);
        } catch (Exception) {
            return new DateTimeZone('America/Mexico_City');
        }
    }

    public static function horarioLvInicio(): string
    {
        return (string) self::get('horario_lv_inicio', '08:00');
    }

    public static function horarioLvFin(): string
    {
        return (string) self::get('horario_lv_fin', '21:00');
    }

    public static function horarioSabInicio(): string
    {
        return (string) self::get('horario_sab_inicio', '08:00');
    }

    public static function horarioSabFin(): string
    {
        return (string) self::get('horario_sab_fin', '17:00');
    }

    public static function domingoCerrado(): bool
    {
        $valor = self::get('domingo_cerrado', '1');
        return $valor === '1' || $valor === 'true' || $valor === true || $valor === 1;
    }
}
