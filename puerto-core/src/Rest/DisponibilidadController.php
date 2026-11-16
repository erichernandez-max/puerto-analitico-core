<?php
namespace PuertoCore\Rest;

use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
use PuertoCore\Disponibilidad;

class DisponibilidadController extends RestController
{
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
                        ],
                        'fecha_desde'    => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                        'fecha_hasta'    => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                    ],
                ],
            ]
        );
    }

    public function getDisponibilidad(WP_REST_Request $request): WP_REST_Response
    {
        $consultorio_id = (int) $request->get_param('consultorio_id');
        $fecha_desde    = $request->get_param('fecha_desde');
        $fecha_hasta    = $request->get_param('fecha_hasta');

        // Instanciamos el motor que ya existe en src/Disponibilidad.php
        $motor = new Disponibilidad();
        $slots = $motor->slotsLibres($consultorio_id, $fecha_desde, $fecha_hasta);

        return new WP_REST_Response([
            'success' => true,
            'data'    => $slots,
        ], 200);
    }
}