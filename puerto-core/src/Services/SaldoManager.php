<?php
declare(strict_types=1);

namespace PuertoCore\Services;

use DateTimeImmutable;
use PuertoCore\Config\Constants;
use PuertoCore\Config\Reglas;
use RuntimeException;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Gestor transaccional de saldos, consumos FIFO, devoluciones y expiraciones.
 * Garantiza integridad absoluta: cero saldos negativos y cero fugas de horas.
 */
class SaldoManager
{
    /**
     * Devuelve el saldo total disponible (en horas) sumando todos los paquetes vigentes no vencidos,
     * restando las horas que ya están apartadas en reservas futuras.
     */
    public static function getSaldoDisponible(int $userId): float
    {
        global $wpdb;

        $tablaSaldos = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tz = Reglas::timezone();
        $ahora = (new DateTimeImmutable('now', $tz))->format('Y-m-d H:i:s');

        $query = $wpdb->prepare(
            "SELECT COALESCE(SUM(horas_compradas - horas_consumidas - horas_apartadas), 0.00)
             FROM {$tablaSaldos}
             WHERE user_id = %d
               AND estado = 'vigente'
               AND fecha_vencimiento >= %s",
            $userId,
            $ahora
        );

        return round((float) $wpdb->get_var($query), 2);
    }

    /**
     * Verifica si el usuario dispone de suficientes horas vigentes.
     */
    public static function verificarSaldoSuficiente(int $userId, float $horasRequeridas): bool
    {
        return self::getSaldoDisponible($userId) >= $horasRequeridas;
    }

    /**
     * Devuelve el déficit de horas respecto a las requeridas.
     */
    public static function getHorasFaltantes(int $userId, float $horasRequeridas): float
    {
        $disponible = self::getSaldoDisponible($userId);
        return max(0.00, round($horasRequeridas - $disponible, 2));
    }

    /**
     * Debita horas de saldo de forma definitiva y las mueve del estado "apartado" al "consumido".
     * Ejecutado por el Cron a T-24h.
     */
    public static function consumirSaldoFifo(int $userId, float $horasADebitar, int $reservaId, ?int $saldoIdEspecifico = null): array
    {
        global $wpdb;

        $tablaSaldos      = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaMovimientos = $wpdb->prefix . Constants::TABLE_MOVIMIENTOS;
        $tz = Reglas::timezone();
        $ahora = (new DateTimeImmutable('now', $tz))->format('Y-m-d H:i:s');

        // Buscamos el saldo. Ya sea el específico o los del usuario.
        if ($saldoIdEspecifico !== null && $saldoIdEspecifico > 0) {
            $saldos = $wpdb->get_results($wpdb->prepare(
                "SELECT id, horas_compradas, horas_consumidas, horas_apartadas, fecha_vencimiento
                 FROM {$tablaSaldos}
                 WHERE id = %d AND user_id = %d AND estado = 'vigente' AND fecha_vencimiento >= %s
                 FOR UPDATE",
                $saldoIdEspecifico,
                $userId,
                $ahora
            ), ARRAY_A);
        } else {
            $saldos = $wpdb->get_results($wpdb->prepare(
                "SELECT id, horas_compradas, horas_consumidas, horas_apartadas, fecha_vencimiento
                 FROM {$tablaSaldos}
                 WHERE user_id = %d AND estado = 'vigente' AND fecha_vencimiento >= %s
                 ORDER BY fecha_vencimiento ASC, id ASC
                 FOR UPDATE",
                $userId,
                $ahora
            ), ARRAY_A);
        }

        if (empty($saldos)) {
            throw new RuntimeException("No existen saldos vigentes disponibles para el usuario #{$userId}.");
        }

        $horasRestantes = $horasADebitar;
        $debitos = [];

        foreach ($saldos as $saldo) {
            if ($horasRestantes <= 0.0001) {
                break;
            }

            $saldoId = (int) $saldo['id'];
            $apartadas = (float) $saldo['horas_apartadas'];

            // Solo podemos consumir de las horas que ya estaban apartadas
            if ($apartadas <= 0.00) {
                continue;
            }

            $aDescontar = min($horasRestantes, $apartadas);
            $nuevasConsumidas = round((float)$saldo['horas_consumidas'] + $aDescontar, 2);
            $nuevasApartadas = round($apartadas - $aDescontar, 2);
            
            $nuevoEstado = ($nuevasConsumidas >= (float)$saldo['horas_compradas']) ? 'agotado' : 'vigente';

            $wpdb->update(
                $tablaSaldos,
                [
                    'horas_consumidas' => $nuevasConsumidas,
                    'horas_apartadas'  => $nuevasApartadas,
                    'estado'           => $nuevoEstado,
                ],
                ['id' => $saldoId],
                ['%f', '%f', '%s'],
                ['%d']
            );

            // Registrar movimiento en el libro mayor
            $wpdb->insert(
                $tablaMovimientos,
                [
                    'user_id'       => $userId,
                    'saldo_id'      => $saldoId,
                    'reserva_id'    => $reservaId,
                    'tipo'          => 'consumo',
                    'horas'         => $aDescontar,
                    'motivo'        => sprintf('Consumo automático a T-24h (Reserva #%d)', $reservaId),
                    'admin_user_id' => null,
                    'created_at'    => $ahora,
                ],
                ['%d', '%d', '%d', '%s', '%f', '%s', '%s', '%s']
            );

            $debitos[] = ['saldo_id' => $saldoId, 'horas' => $aDescontar];
            $horasRestantes = round($horasRestantes - $aDescontar, 2);
        }

        if ($horasRestantes > 0.0001) {
            throw new RuntimeException(sprintf(
                'Fallo al consumir: quedaron %.2f horas sin cubrir (posiblemente no estaban apartadas).',
                $horasRestantes
            ));
        }

        return $debitos;
    }

    /**
     * Reversa las horas consumidas o apartadas de una reserva cancelada.
     */
    public static function devolverSaldo(int $reservaId, string $motivo = 'Cancelación de reserva'): bool
    {
        global $wpdb;

        $tablaSaldos      = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaMovimientos = $wpdb->prefix . Constants::TABLE_MOVIMIENTOS;
        $tablaReservas    = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $tz = Reglas::timezone();
        $ahora = (new DateTimeImmutable('now', $tz))->format('Y-m-d H:i:s');

        // 1. Si ya se consumió (el cron ya pasó), devolvemos del campo consumidas
        $movimientos = $wpdb->get_results($wpdb->prepare(
            "SELECT id, user_id, saldo_id, horas FROM {$tablaMovimientos} WHERE reserva_id = %d AND tipo = 'consumo'",
            $reservaId
        ), ARRAY_A);

        if (!empty($movimientos)) {
            foreach ($movimientos as $mov) {
                $wpdb->query($wpdb->prepare(
                    "UPDATE {$tablaSaldos}
                     SET horas_consumidas = GREATEST(0.00, horas_consumidas - %f),
                         estado = CASE WHEN fecha_vencimiento >= %s THEN 'vigente' ELSE estado END
                     WHERE id = %d",
                    (float)$mov['horas'], $ahora, (int)$mov['saldo_id']
                ));
                $wpdb->insert($tablaMovimientos, [
                    'user_id' => (int)$mov['user_id'], 'saldo_id' => (int)$mov['saldo_id'], 'reserva_id' => $reservaId,
                    'tipo' => 'devolucion', 'horas' => (float)$mov['horas'], 'motivo' => $motivo, 'created_at' => $ahora,
                ]);
            }
            return true;
        }

        // 2. Si no se ha consumido (aún está apartada), liberamos las horas apartadas
        $reserva = $wpdb->get_row($wpdb->prepare("SELECT user_id, fecha_inicio, fecha_fin, tipo FROM {$tablaReservas} WHERE id = %d", $reservaId), ARRAY_A);
        if ($reserva && in_array($reserva['tipo'], ['hora', 'bloque'], true)) {
            $horas = round((strtotime($reserva['fecha_fin']) - strtotime($reserva['fecha_inicio'])) / 3600.0, 2);
            // Liberamos buscando en los saldos del usuario (priorizando los que tengan horas apartadas)
            $wpdb->query($wpdb->prepare(
                "UPDATE {$tablaSaldos} SET horas_apartadas = GREATEST(0.00, horas_apartadas - %f) 
                 WHERE user_id = %d AND horas_apartadas > 0 ORDER BY id ASC LIMIT 1",
                $horas, (int)$reserva['user_id']
            ));
        }

        return true;
    }

    /**
     * Aplica la regla R9: Renueva la vigencia de todos los saldos vigentes del usuario.
     */
    public static function renovarSaldosVigentesPorCompra(int $userId, int $nuevaCompraSaldoId, string $nuevaFechaVencimiento): int
    {
        global $wpdb;
        $tablaSaldos = $wpdb->prefix . Constants::TABLE_SALDOS;
        return (int) $wpdb->query($wpdb->prepare(
            "UPDATE {$tablaSaldos} SET fecha_vencimiento = %s, renovado_por_compra_id = %d
             WHERE user_id = %d AND estado = 'vigente' AND id != %d",
            $nuevaFechaVencimiento, $nuevaCompraSaldoId, $userId, $nuevaCompraSaldoId
        ));
    }

    /**
     * Cron diario (03:00): Expiración de saldos caducos (R9, R13).
     */
    public static function expirarSaldosVencidos(): array
    {
        global $wpdb;
        $tablaSaldos = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaUsuariosNegocio = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;
        $tablaMovimientos = $wpdb->prefix . Constants::TABLE_MOVIMIENTOS;
        $tz = Reglas::timezone();
        $ahora = (new DateTimeImmutable('now', $tz))->format('Y-m-d H:i:s');

        $caducos = $wpdb->get_results($wpdb->prepare(
            "SELECT s.id, s.user_id, s.horas_compradas, s.horas_consumidas, s.horas_apartadas
             FROM {$tablaSaldos} s LEFT JOIN {$tablaUsuariosNegocio} u ON u.user_id = s.user_id
             WHERE s.estado = 'vigente' AND s.fecha_vencimiento < %s AND (u.estado IS NULL OR u.estado != 'congelado')",
            $ahora
        ), ARRAY_A);

        $expirados = 0;
        $horasTotales = 0.00;

        if (!empty($caducos)) {
            foreach ($caducos as $caduco) {
                $restantes = max(0.00, round((float) $caduco['horas_compradas'] - (float) $caduco['horas_consumidas'], 2));
                $wpdb->update($tablaSaldos, ['estado' => 'vencido'], ['id' => (int) $caduco['id']]);

                if ($restantes > 0.00) {
                    $wpdb->insert($tablaMovimientos, [
                        'user_id' => (int) $caduco['user_id'], 'saldo_id' => (int) $caduco['id'], 'reserva_id' => null,
                        'tipo' => 'expiracion', 'horas' => -$restantes, 'motivo' => 'Expiración por vigencia (R9)', 'created_at' => $ahora,
                    ]);
                    $horasTotales += $restantes;
                }
                $expirados++;
            }
        }
        return ['expirados' => $expirados, 'horas_totales' => round($horasTotales, 2)];
    }
}