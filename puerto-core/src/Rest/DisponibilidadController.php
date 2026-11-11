<?php
declare(strict_types=1);

namespace PuertoCore\Rest;

use DateTimeImmutable;
use PuertoCore\Config\Reglas;
use PuertoCore\Disponibilidad;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Endpoint REST para consultar la disponibilidad detallada de slots por consultorio y rango de fechas.
 * GET /puerto/v1/disponibilidad?consultorio_id=1&fecha_desde=2026-11-16&fecha_hasta=2026-11-21
 */
class DisponibilidadController extends RestController
{
    /**
     * Registra las rutas REST del controlador.
     */
    public function registerRoutes(): void
    {
        register_rest_route(
            $this->getNamespace(),
            '/disponibilidad',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getDisponibilidad'],
                    'permission_callback' => [$this, 'checkLoggedIn'],
                    'args'                => [
                        'consultorio_id' => [
                            'required'          => true,
                            'type'              => 'integer',
                            'sanitize_callback' => 'absint',
                            'validate_callback' => static function ($param) {
                                return is_numeric($param) && (int) $param > 0;
                            },
                        ],
                        'fecha_desde'    => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                            'validate_callback' => static function ($param) {
                                return (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $param);
                            },
                        ],
                        'fecha_hasta'    => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                            'validate_callback' => static function ($param) {
                                return (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $param);
                            },
                        ],
                    ],
                ],
            ]
        );
    }

    /**
     * Devuelve la lista de slots físicos (libres y ocupados/bloqueados) para un consultorio.
     */
    public function getDisponibilidad(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $consultorioId = (int) $request->get_param('consultorio_id');
        $fechaDesde    = (string) $request->get_param('fecha_desde');
        $fechaHasta    = (string) $request->get_param('fecha_hasta');

        if ($consultorioId <= 0) {
            return $this->error(
                'puerto_rest_invalid_consultorio',
                __('El ID del consultorio debe ser un entero positivo.', 'puerto-core'),
                400
            );
        }

        if (empty($fechaDesde) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaDesde)) {
            return $this->error(
                'puerto_rest_invalid_fecha_desde',
                __('La fecha de inicio debe tener el formato YYYY-MM-DD.', 'puerto-core'),
                400
            );
        }

        if (empty($fechaHasta) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaHasta)) {
            return $this->error(
                'puerto_rest_invalid_fecha_hasta',
                __('La fecha final debe tener el formato YYYY-MM-DD.', 'puerto-core'),
                400
            );
        }

        if ($fechaHasta < $fechaDesde) {
            return $this->error(
                'puerto_rest_invalid_range',
                __('La fecha final no puede ser anterior a la fecha inicial.', 'puerto-core'),
                400
            );
        }

        // Limitar rango máximo a 60 días para proteger rendimiento
        $tz = Reglas::timezone();
        $dtDesde = new DateTimeImmutable($fechaDesde, $tz);
        $dtHasta = new DateTimeImmutable($fechaHasta, $tz);
        $diferenciaDias = (int) $dtDesde->diff($dtHasta)->format('%a');

        if ($diferenciaDias > 60) {
            return $this->error(
                'puerto_rest_range_too_long',
                __('El rango de fechas consultado no puede superar los 60 días.', 'puerto-core'),
                400
            );
        }

        $servicioDisponibilidad = new Disponibilidad();
        $slots = $servicioDisponibilidad->slotsLibres($consultorioId, $fechaDesde, $fechaHasta);

        return $this->success($slots);
    }
}
