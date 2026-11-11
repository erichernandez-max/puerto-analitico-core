<?php
declare(strict_types=1);

namespace PuertoCore\Rest;

use DateTimeImmutable;
use PuertoCore\Config\Constants;
use PuertoCore\Config\Reglas;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Endpoint REST para la consulta de consultorios y sus capacidades semanales agregadas.
 * F2: Expone capacidad física (74h), capacidad vendible (72h) y horas de mantenimiento (2h).
 */
class ConsultoriosController extends RestController
{
    public function registerRoutes(): void
    {
        register_rest_route(
            $this->getNamespace(),
            '/consultorios',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getConsultorios'],
                    'permission_callback' => [$this, 'checkLoggedIn'],
                ],
            ]
        );
    }

    /**
     * Devuelve la lista de consultorios activos con su disponibilidad y porcentajes de ocupación física y vendible.
     */
    public function getConsultorios(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $tablaConsultorios = $wpdb->prefix . Constants::TABLE_CONSULTORIOS;
        $tablaReservas     = $wpdb->prefix . Constants::TABLE_RESERVAS;

        // Calcular rango de la semana actual según la zona horaria del negocio
        $tz = Reglas::timezone();
        $ahora = new DateTimeImmutable('now', $tz);
        $inicioSemana = $ahora->modify('monday this week 00:00:00')->format('Y-m-d H:i:s');
        $finSemana    = $ahora->modify('sunday this week 23:59:59')->format('Y-m-d H:i:s');

        // Consultorios activos con capacidades F2
        $consultorios = $wpdb->get_results(
            "SELECT id, nombre, color, activo, google_calendar_id, 
                    COALESCE(capacidad_fisica_semanal_horas, 74) as capacidad_fisica_semanal_horas,
                    COALESCE(horas_mantenimiento_semanal, 2) as horas_mantenimiento_semanal,
                    COALESCE(capacidad_max_semanal_horas, 72) as capacidad_max_semanal_horas
             FROM {$tablaConsultorios} 
             WHERE activo = 1 
             ORDER BY id ASC",
            ARRAY_A
        );

        if (empty($consultorios)) {
            return $this->success([]);
        }

        // Obtener horas reservadas en la semana actual por consultorio
        $horasOcupadasMap = [];
        $queryReservas = $wpdb->prepare(
            "SELECT consultorio_id, 
                    SUM(TIMESTAMPDIFF(MINUTE, GREATEST(fecha_inicio, %s), LEAST(fecha_fin, %s)) / 60.0) as horas_ocupadas
             FROM {$tablaReservas}
             WHERE estado IN ('confirmada', 'consumida', 'pendiente_pago', 'bloqueada')
               AND fecha_inicio < %s
               AND fecha_fin > %s
             GROUP BY consultorio_id",
            $inicioSemana,
            $finSemana,
            $finSemana,
            $inicioSemana
        );

        $reservasSemana = $wpdb->get_results($queryReservas, ARRAY_A);
        if (!empty($reservasSemana)) {
            foreach ($reservasSemana as $fila) {
                $horasOcupadasMap[(int) $fila['consultorio_id']] = (float) $fila['horas_ocupadas'];
            }
        }

        $resultado = [];
        foreach ($consultorios as $c) {
            $id = (int) $c['id'];
            $capacidadFisica     = (int) $c['capacidad_fisica_semanal_horas'];
            $horasMantenimiento  = (int) $c['horas_mantenimiento_semanal'];
            $capacidadVendible   = (int) $c['capacidad_max_semanal_horas']; // 72h

            $ocupadas = isset($horasOcupadasMap[$id]) ? round($horasOcupadasMap[$id], 2) : 0.00;
            $disponiblesVendibles = max(0.00, round($capacidadVendible - $ocupadas, 2));
            $disponiblesFisicas   = max(0.00, round($capacidadFisica - $ocupadas - $horasMantenimiento, 2));

            $resultado[] = [
                'id'                             => $id,
                'nombre'                         => (string) $c['nombre'],
                'color'                          => (string) $c['color'],
                'activo'                         => (bool) $c['activo'],
                'google_calendar_id'             => $c['google_calendar_id'] ? (string) $c['google_calendar_id'] : null,
                'capacidad_fisica_semanal_horas' => $capacidadFisica,
                'capacidad_max_semanal_horas'    => $capacidadVendible,
                'horas_mantenimiento_semanal'    => $horasMantenimiento,
                'disponibilidad_semanal'         => [
                    'semana_inicio'                => $inicioSemana,
                    'semana_fin'                   => $finSemana,
                    'horas_ocupadas'               => $ocupadas,
                    'horas_disponibles'            => $disponiblesVendibles,
                    'horas_disponibles_fisicas'    => $disponiblesFisicas,
                    'porcentaje_ocupacion_fisica'  => $capacidadFisica > 0 ? round(($ocupadas / $capacidadFisica) * 100, 1) : 0.0,
                    'porcentaje_ocupacion_vendible'=> $capacidadVendible > 0 ? round(($ocupadas / $capacidadVendible) * 100, 1) : 0.0,
                    'porcentaje_ocupacion'         => $capacidadVendible > 0 ? round(($ocupadas / $capacidadVendible) * 100, 1) : 0.0,
                ],
            ];
        }

        return $this->success($resultado);
    }
}
