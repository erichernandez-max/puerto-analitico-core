<?php
declare(strict_types=1);

namespace PuertoCore\Cron;

use DateTimeImmutable;
use Exception;
use PuertoCore\Config\Constants;
use PuertoCore\Config\Reglas;
use PuertoCore\Services\SaldoManager;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Gestor de eventos cron de WordPress para Puerto Analítico.
 * Automatiza el consumo horario a T-24h y la expiración diaria a las 03:00 con garantía de idempotencia.
 */
class CronManager
{
    /**
     * Registra los hooks de acción para los cron jobs en WordPress.
     */
    public static function register(): void
    {
        add_action(Constants::CRON_HOOK_CONSUMO_SALDO, [self::class, 'ejecutarConsumoSaldo']);
        add_action(Constants::CRON_HOOK_EXPIRACION_SALDOS, [self::class, 'ejecutarExpiracionSaldos']);
    }

    /**
     * Programa los eventos en el programador WP-Cron al activar el plugin.
     */
    public static function scheduleEvents(): void
    {
        if (function_exists('wp_next_scheduled') && function_exists('wp_schedule_event')) {
            // 1. Cron de consumo de saldo: ejecución cada hora
            if (!wp_next_scheduled(Constants::CRON_HOOK_CONSUMO_SALDO)) {
                wp_schedule_event(time(), 'hourly', Constants::CRON_HOOK_CONSUMO_SALDO);
            }

            // 2. Cron de expiración de saldos: ejecución diaria a las 03:00 AM (America/Mexico_City)
            if (!wp_next_scheduled(Constants::CRON_HOOK_EXPIRACION_SALDOS)) {
                $tz = Reglas::timezone();
                $proximo3am = new DateTimeImmutable('tomorrow 03:00:00', $tz);
                wp_schedule_event($proximo3am->getTimestamp(), 'daily', Constants::CRON_HOOK_EXPIRACION_SALDOS);
            }
        }
    }

    /**
     * Elimina los eventos programados al desactivar el plugin.
     */
    public static function clearEvents(): void
    {
        if (function_exists('wp_clear_scheduled_hook')) {
            wp_clear_scheduled_hook(Constants::CRON_HOOK_CONSUMO_SALDO);
            wp_clear_scheduled_hook(Constants::CRON_HOOK_EXPIRACION_SALDOS);
        }
    }

    /**
     * Cron horario: Consumo de saldo a T-24h (R4).
     *
     * Busca reservas 'confirmada' cuyo inicio esté entre NOW()+23h y NOW()+25h
     * y con consumida_en IS NULL (garantía de idempotencia estricta).
     *
     * @return array{procesadas: int, errores: array<int, string>}
     */
    public static function ejecutarConsumoSaldo(): array
    {
        global $wpdb;

        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $tz = Reglas::timezone();
        $ahora = new DateTimeImmutable('now', $tz);

        $ventanaInicio = $ahora->modify('+23 hours')->format('Y-m-d H:i:s');
        $ventanaFin    = $ahora->modify('+25 hours')->format('Y-m-d H:i:s');
        $fechaConsumo  = $ahora->format('Y-m-d H:i:s');

        // Buscar reservas elegibles para consumo
        $reservas = $wpdb->get_results($wpdb->prepare(
            "SELECT id, user_id, consultorio_id, fecha_inicio, fecha_fin, tipo, saldo_id
             FROM {$tablaReservas}
             WHERE estado = 'confirmada'
               AND consumida_en IS NULL
               AND fecha_inicio BETWEEN %s AND %s
             ORDER BY fecha_inicio ASC",
            $ventanaInicio,
            $ventanaFin
        ), ARRAY_A);

        $procesadas = 0;
        $errores = [];

        if (empty($reservas)) {
            return ['procesadas' => 0, 'errores' => []];
        }

        foreach ($reservas as $reserva) {
            $reservaId = (int) $reserva['id'];
            $userId = (int) $reserva['user_id'];
            $tipo = (string) $reserva['tipo'];
            $saldoId = $reserva['saldo_id'] ? (int) $reserva['saldo_id'] : null;

            $duracionSegundos = strtotime($reserva['fecha_fin']) - strtotime($reserva['fecha_inicio']);
            $horasRequeridas = round($duracionSegundos / 3600.0, 2);

            $wpdb->query('START TRANSACTION');

            try {
                // Doble chequeo pesimista con bloqueo de fila
                $estadoActual = $wpdb->get_row($wpdb->prepare(
                    "SELECT estado, consumida_en FROM {$tablaReservas} WHERE id = %d FOR UPDATE",
                    $reservaId
                ), ARRAY_A);

                if (!$estadoActual || $estadoActual['estado'] !== 'confirmada' || $estadoActual['consumida_en'] !== null) {
                    $wpdb->query('COMMIT');
                    continue; // Ya fue procesada concurrentemente
                }

                // Si la reserva requiere deducción de saldo (hora o bloque)
                if (in_array($tipo, ['hora', 'bloque'], true)) {
                    SaldoManager::consumirSaldoFifo($userId, $horasRequeridas, $reservaId, $saldoId);
                }

                // Marcar como consumida con timestamp (idempotencia)
                $wpdb->update(
                    $tablaReservas,
                    [
                        'estado'       => 'consumida',
                        'consumida_en' => $fechaConsumo,
                        'updated_at'   => $fechaConsumo,
                    ],
                    ['id' => $reservaId],
                    ['%s', '%s', '%s'],
                    ['%d']
                );

                $wpdb->query('COMMIT');
                $procesadas++;
            } catch (Exception $e) {
                $wpdb->query('ROLLBACK');
                $errores[$reservaId] = $e->getMessage();
            }
        }

        return [
            'procesadas' => $procesadas,
            'errores'    => $errores,
        ];
    }

    /**
     * Cron diario (03:00): Expiración de saldos caducos (R9, R13).
     *
     * @return array{expirados: int, horas_totales: float}
     */
    public static function ejecutarExpiracionSaldos(): array
    {
        return SaldoManager::expirarSaldosVencidos();
    }
}
