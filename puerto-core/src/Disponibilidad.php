<?php
declare(strict_types=1);

namespace PuertoCore;

use DateInterval;
use DateTimeImmutable;
use DateTimeZone;
use PuertoCore\Config\Constants;
use PuertoCore\Config\Reglas;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Motor de cálculo de disponibilidad de consultorios para Puerto Analítico.
 * Genera hasta 74 horas físicas por semana (L-V 13h*5 + Sáb 9h, Dom cerrado)
 * y descuenta reservas activas y bloqueos de mantenimiento (72h vendibles).
 */
class Disponibilidad
{
    /**
     * Devuelve la lista detallada de slots físicos en el rango de fechas para el consultorio.
     *
     * @param int $consultorio_id ID del consultorio físico
     * @param string $fecha_desde Fecha inicial (YYYY-MM-DD)
     * @param string $fecha_hasta Fecha final (YYYY-MM-DD)
     * @return array<int, array{fecha: string, hora_inicio: string, hora_fin: string, disponible: bool, motivo_no_disponible: ?string}>
     */
    public function slotsLibres(int $consultorio_id, string $fecha_desde, string $fecha_hasta): array
    {
        global $wpdb;

        $tz = Reglas::timezone();
        $desde = new DateTimeImmutable($fecha_desde . ' 00:00:00', $tz);
        $hasta = new DateTimeImmutable($fecha_hasta . ' 23:59:59', $tz);

        if ($hasta < $desde) {
            return [];
        }

        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $tablaBloqueos = $wpdb->prefix . Constants::TABLE_BLOQUEOS;

        // 1. Obtener todas las reservas que solapan en el rango
        $reservasExistentes = $wpdb->get_results($wpdb->prepare(
            "SELECT fecha_inicio, fecha_fin, estado
             FROM {$tablaReservas}
             WHERE consultorio_id = %d
               AND estado IN ('confirmada', 'consumida', 'pendiente_pago', 'bloqueada')
               AND fecha_inicio < %s
               AND fecha_fin > %s",
            $consultorio_id,
            $hasta->format('Y-m-d H:i:s'),
            $desde->format('Y-m-d H:i:s')
        ), ARRAY_A);

        // 2. Obtener bloqueos puntuales en el rango
        $bloqueosPuntuales = $wpdb->get_results($wpdb->prepare(
            "SELECT consultorio_id, fecha_inicio, fecha_fin, motivo
             FROM {$tablaBloqueos}
             WHERE (consultorio_id IS NULL OR consultorio_id = %d)
               AND recurrente = 0
               AND fecha_inicio < %s
               AND fecha_fin > %s",
            $consultorio_id,
            $hasta->format('Y-m-d H:i:s'),
            $desde->format('Y-m-d H:i:s')
        ), ARRAY_A);

        // 3. Obtener bloqueos recurrentes (mantenimiento y feriados)
        $bloqueosRecurrentes = $wpdb->get_results($wpdb->prepare(
            "SELECT consultorio_id, motivo, patron_recurrencia, fecha_inicio, fecha_fin
             FROM {$tablaBloqueos}
             WHERE (consultorio_id IS NULL OR consultorio_id = %d)
               AND recurrente = 1",
            $consultorio_id
        ), ARRAY_A);

        $slots = [];
        $diaActual = $desde;
        $unDia = new DateInterval('P1D');

        while ($diaActual <= $hasta) {
            $diaSemana = (int) $diaActual->format('w'); // 0=Domingo, 1=Lunes ... 6=Sábado
            $fechaStr = $diaActual->format('Y-m-d');

            // Regla R1: Domingos cerrado (0 slots agendables)
            if ($diaSemana === 0) {
                $diaActual = $diaActual->add($unDia);
                continue;
            }

            // Horarios según R1
            // L-V: 08:00 a 21:00 (13 slots de 1h: inicios de 08:00 a 20:00)
            // Sáb: 08:00 a 17:00 (9 slots de 1h: inicios de 08:00 a 16:00)
            $horaInicioDia = 8;
            $horaFinDia = ($diaSemana === 6) ? 17 : 21;

            for ($hora = $horaInicioDia; $hora < $horaFinDia; $hora++) {
                $horaInicioStr = sprintf('%02d:00', $hora);
                $horaFinStr = sprintf('%02d:00', $hora + 1);

                $slotInicioStr = "{$fechaStr} {$horaInicioStr}:00";
                $slotFinStr = "{$fechaStr} {$horaFinStr}:00";

                $disponible = true;
                $motivoNoDisponible = null;

                // A. Verificar colisión con reservas existentes
                if (!empty($reservasExistentes)) {
                    foreach ($reservasExistentes as $res) {
                        if ($res['fecha_inicio'] < $slotFinStr && $res['fecha_fin'] > $slotInicioStr) {
                            $disponible = false;
                            $motivoNoDisponible = 'reserva_existente';
                            break;
                        }
                    }
                }

                // B. Verificar colisión con bloqueos puntuales
                if ($disponible && !empty($bloqueosPuntuales)) {
                    foreach ($bloqueosPuntuales as $blq) {
                        if ($blq['fecha_inicio'] < $slotFinStr && $blq['fecha_fin'] > $slotInicioStr) {
                            $disponible = false;
                            $motivoNoDisponible = (string) $blq['motivo'];
                            break;
                        }
                    }
                }

                // C. Verificar colisión con bloqueos recurrentes
                if ($disponible && !empty($bloqueosRecurrentes)) {
                    foreach ($bloqueosRecurrentes as $rec) {
                        $patron = (string) $rec['patron_recurrencia'];
                        // Formato: dia_semana:X;hora_inicio:HH:mm;hora_fin:HH:mm
                        if (preg_match('/^dia_semana:(\d);hora_inicio:(\d{2}:\d{2});hora_fin:(\d{2}:\d{2})$/', $patron, $coincidencias)) {
                            $recDia = (int) $coincidencias[1];
                            $recHoraInicio = $coincidencias[2];
                            $recHoraFin = $coincidencias[3];

                            if ($diaSemana === $recDia) {
                                // Solapamiento de ventanas horarias
                                if ($horaInicioStr < $recHoraFin && $horaFinStr > $recHoraInicio) {
                                    $disponible = false;
                                    $motivoNoDisponible = (string) $rec['motivo'];
                                    break;
                                }
                            }
                        }
                    }
                }

                $slots[] = [
                    'fecha'                => $fechaStr,
                    'hora_inicio'          => $horaInicioStr,
                    'hora_fin'             => $horaFinStr,
                    'disponible'           => $disponible,
                    'motivo_no_disponible' => $motivoNoDisponible,
                ];
            }

            $diaActual = $diaActual->add($unDia);
        }

        return $slots;
    }
}

// Crear alias en namespace raíz \Puerto\Disponibilidad para interoperabilidad
if (!class_exists('Puerto\Disponibilidad', false)) {
    class_alias(Disponibilidad::class, 'Puerto\Disponibilidad');
}
