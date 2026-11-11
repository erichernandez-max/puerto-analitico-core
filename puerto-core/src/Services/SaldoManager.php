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
     * Devuelve el saldo total disponible (en horas) sumando todos los paquetes vigentes no vencidos.
     */
    public static function getSaldoDisponible(int $userId): float
    {
        global $wpdb;

        $tablaSaldos = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tz = Reglas::timezone();
        $ahora = (new DateTimeImmutable('now', $tz))->format('Y-m-d H:i:s');

        $query = $wpdb->prepare(
            "SELECT COALESCE(SUM(horas_compradas - horas_consumidas), 0.00)
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
     * Debita horas de saldo utilizando estrategia FIFO estricta (por fecha_vencimiento ascendente).
     * Ejecuta dentro de una transacción pesimista con bloqueo de fila (FOR UPDATE).
     *
     * @param int $userId ID del usuario
     * @param float $horasADebitar Total de horas a debitar
     * @param int $reservaId ID de la reserva asociada
     * @param int|null $saldoIdEspecifico Si se especifica un paquete de saldo en particular
     * @return array<int, array{saldo_id: int, horas: float}> Desglose de débitos realizados
     * @throws RuntimeException Si el saldo es insuficiente o no se puede completar la deducción
     */
    public static function consumirSaldoFifo(int $userId, float $horasADebitar, int $reservaId, ?int $saldoIdEspecifico = null): array
    {
        global $wpdb;

        $tablaSaldos      = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaMovimientos = $wpdb->prefix . Constants::TABLE_MOVIMIENTOS;
        $tz = Reglas::timezone();
        $ahora = (new DateTimeImmutable('now', $tz))->format('Y-m-d H:i:s');

        if ($saldoIdEspecifico !== null && $saldoIdEspecifico > 0) {
            $saldos = $wpdb->get_results($wpdb->prepare(
                "SELECT id, horas_compradas, horas_consumidas, fecha_vencimiento
                 FROM {$tablaSaldos}
                 WHERE id = %d AND user_id = %d AND estado = 'vigente' AND fecha_vencimiento >= %s
                 FOR UPDATE",
                $saldoIdEspecifico,
                $userId,
                $ahora
            ), ARRAY_A);
        } else {
            $saldos = $wpdb->get_results($wpdb->prepare(
                "SELECT id, horas_compradas, horas_consumidas, fecha_vencimiento
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
            $compradas = (float) $saldo['horas_compradas'];
            $consumidas = (float) $saldo['horas_consumidas'];
            $disponible = round($compradas - $consumidas, 2);

            if ($disponible <= 0.00) {
                continue;
            }

            $aDescontar = min($horasRestantes, $disponible);
            $nuevasConsumidas = round($consumidas + $aDescontar, 2);
            $nuevoEstado = ($nuevasConsumidas >= $compradas) ? 'agotado' : 'vigente';

            $actualizado = $wpdb->update(
                $tablaSaldos,
                [
                    'horas_consumidas' => $nuevasConsumidas,
                    'estado'           => $nuevoEstado,
                ],
                ['id' => $saldoId],
                ['%f', '%s'],
                ['%d']
            );

            if ($actualizado === false) {
                throw new RuntimeException("Error al actualizar saldo #{$saldoId}.");
            }

            // Registrar movimiento en el libro mayor de auditoría
            $wpdb->insert(
                $tablaMovimientos,
                [
                    'user_id'       => $userId,
                    'saldo_id'      => $saldoId,
                    'reserva_id'    => $reservaId,
                    'tipo'          => 'consumo',
                    'horas'         => $aDescontar,
                    'motivo'        => sprintf('Consumo automático FIFO para reserva #%d', $reservaId),
                    'admin_user_id' => null,
                    'created_at'    => $ahora,
                ],
                ['%d', '%d', '%d', '%s', '%f', '%s', '%s', '%s']
            );

            $debitos[] = [
                'saldo_id' => $saldoId,
                'horas'    => $aDescontar,
            ];

            $horasRestantes = round($horasRestantes - $aDescontar, 2);
        }

        if ($horasRestantes > 0.0001) {
            throw new RuntimeException(sprintf(
                'Saldo insuficiente: quedaron %.2f horas sin cubrir de las %.2f solicitadas.',
                $horasRestantes,
                $horasADebitar
            ));
        }

        return $debitos;
    }

    /**
     * Reversa las horas consumidas de una reserva cancelada devolviéndolas a los saldos de origen.
     */
    public static function devolverSaldo(int $reservaId, string $motivo = 'Cancelación de reserva'): bool
    {
        global $wpdb;

        $tablaSaldos      = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaMovimientos = $wpdb->prefix . Constants::TABLE_MOVIMIENTOS;
        $tz = Reglas::timezone();
        $ahora = (new DateTimeImmutable('now', $tz))->format('Y-m-d H:i:s');

        // Buscar todos los movimientos de consumo asociados a esta reserva
        $movimientos = $wpdb->get_results($wpdb->prepare(
            "SELECT id, user_id, saldo_id, horas
             FROM {$tablaMovimientos}
             WHERE reserva_id = %d AND tipo = 'consumo'",
            $reservaId
        ), ARRAY_A);

        if (empty($movimientos)) {
            return false;
        }

        foreach ($movimientos as $mov) {
            $saldoId = (int) $mov['saldo_id'];
            $horasDevolver = (float) $mov['horas'];
            $userId = (int) $mov['user_id'];

            if ($saldoId > 0 && $horasDevolver > 0.00) {
                // Restaurar horas_consumidas y reactivar estado si estaba agotado
                $wpdb->query($wpdb->prepare(
                    "UPDATE {$tablaSaldos}
                     SET horas_consumidas = GREATEST(0.00, horas_consumidas - %f),
                         estado = CASE WHEN fecha_vencimiento >= %s THEN 'vigente' ELSE estado END
                     WHERE id = %d",
                    $horasDevolver,
                    $ahora,
                    $saldoId
                ));

                // Registrar movimiento de devolución
                $wpdb->insert(
                    $tablaMovimientos,
                    [
                        'user_id'       => $userId,
                        'saldo_id'      => $saldoId,
                        'reserva_id'    => $reservaId,
                        'tipo'          => 'devolucion',
                        'horas'         => $horasDevolver,
                        'motivo'        => $motivo,
                        'admin_user_id' => null,
                        'created_at'    => $ahora,
                    ],
                    ['%d', '%d', '%d', '%s', '%f', '%s', '%s', '%s']
                );
            }
        }

        return true;
    }

    /**
     * Aplica la regla R9: Renueva la vigencia de todos los saldos vigentes del usuario
     * extendiendo su fecha de vencimiento al realizar una nueva compra.
     *
     * @return int Número de saldos vigentes renovados
     */
    public static function renovarSaldosVigentesPorCompra(int $userId, int $nuevaCompraSaldoId, string $nuevaFechaVencimiento): int
    {
        global $wpdb;

        $tablaSaldos = $wpdb->prefix . Constants::TABLE_SALDOS;

        $actualizados = $wpdb->query($wpdb->prepare(
            "UPDATE {$tablaSaldos}
             SET fecha_vencimiento = %s,
                 renovado_por_compra_id = %d
             WHERE user_id = %d
               AND estado = 'vigente'
               AND id != %d",
            $nuevaFechaVencimiento,
            $nuevaCompraSaldoId,
            $userId,
            $nuevaCompraSaldoId
        ));

        return (int) $actualizados;
    }

    /**
     * Ejecuta el proceso de expiración de saldos caducos (cron diario 03:00).
     * Aplica la regla R13: Omite saldos de usuarios en estado 'congelado'.
     *
     * @return array{expirados: int, horas_totales: float}
     */
    public static function expirarSaldosVencidos(): array
    {
        global $wpdb;

        $tablaSaldos          = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaUsuariosNegocio = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;
        $tablaMovimientos     = $wpdb->prefix . Constants::TABLE_MOVIMIENTOS;

        $tz = Reglas::timezone();
        $ahora = (new DateTimeImmutable('now', $tz))->format('Y-m-d H:i:s');

        // Buscar saldos vigentes vencidos EXCLUYENDO usuarios congelados (R13)
        $query = $wpdb->prepare(
            "SELECT s.id, s.user_id, s.horas_compradas, s.horas_consumidas
             FROM {$tablaSaldos} s
             LEFT JOIN {$tablaUsuariosNegocio} u ON u.user_id = s.user_id
             WHERE s.estado = 'vigente'
               AND s.fecha_vencimiento < %s
               AND (u.estado IS NULL OR u.estado != 'congelado')",
            $ahora
        );

        $caducos = $wpdb->get_results($query, ARRAY_A);

        $expirados = 0;
        $horasTotales = 0.00;

        if (!empty($caducos)) {
            foreach ($caducos as $caduco) {
                $saldoId = (int) $caduco['id'];
                $userId = (int) $caduco['user_id'];
                $restantes = max(0.00, round((float) $caduco['horas_compradas'] - (float) $caduco['horas_consumidas'], 2));

                $wpdb->update(
                    $tablaSaldos,
                    ['estado' => 'vencido'],
                    ['id' => $saldoId],
                    ['%s'],
                    ['%d']
                );

                if ($restantes > 0.00) {
                    $wpdb->insert(
                        $tablaMovimientos,
                        [
                            'user_id'       => $userId,
                            'saldo_id'      => $saldoId,
                            'reserva_id'    => null,
                            'tipo'          => 'expiracion',
                            'horas'         => -$restantes,
                            'motivo'        => 'Expiración automática por vigencia de 6 meses (R9)',
                            'admin_user_id' => null,
                            'created_at'    => $ahora,
                        ],
                        ['%d', '%d', '%s', '%s', '%f', '%s', '%s', '%s']
                    );
                    $horasTotales += $restantes;
                }

                $expirados++;
            }
        }

        return [
            'expirados'     => $expirados,
            'horas_totales' => round($horasTotales, 2),
        ];
    }
}
