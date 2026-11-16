<?php
declare(strict_types=1);

namespace PuertoCore\Rest;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Endpoint REST para recepción de solicitudes de soporte/ayuda de terapeutas.
 * POST /puerto/v1/soporte
 */
class SoporteController extends RestController
{
    public function registerRoutes(): void
    {
        register_rest_route(
            $this->getNamespace(),
            '/soporte',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'enviarSoporte'],
                    'permission_callback' => [$this, 'checkLoggedIn'],
                    'args'                => [
                        'mensaje' => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_textarea_field',
                        ],
                        'reserva_id' => [
                            'required'          => false,
                            'type'              => 'integer',
                            'sanitize_callback' => 'absint',
                        ],
                    ],
                ],
            ]
        );
    }

    public function enviarSoporte(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $mensaje = trim((string) $request->get_param('mensaje'));
        $reservaId = $request->get_param('reserva_id') ? (int) $request->get_param('reserva_id') : null;

        if (empty($mensaje)) {
            return $this->error(
                'puerto_rest_invalid_soporte',
                __('El mensaje es obligatorio.', 'puerto-core'),
                400
            );
        }

        $userId = get_current_user_id();
        $user = get_userdata($userId);
        $userEmail = $user ? $user->user_email : 'desconocido@puertoanalitico.mx';
        $userName = $user ? $user->display_name : 'Terapeuta #' . $userId;

        $adminEmail = get_option('admin_email', 'contacto@puertoanalitico.mx');
        $asunto = sprintf(
            '[Puerto Analítico Soporte] Mensaje de %s (ID: %d)%s',
            $userName,
            $userId,
            $reservaId ? " - Reserva #{$reservaId}" : ''
        );

        $body = sprintf(
            "Solicitud de Soporte en Puerto Analítico\n\n" .
            "Terapeuta: %s (ID: %d)\n" .
            "Email: %s\n" .
            "Reserva ID: %s\n" .
            "Fecha: %s\n\n" .
            "Mensaje:\n%s\n",
            $userName,
            $userId,
            $userEmail,
            $reservaId ? (string) $reservaId : 'N/A',
            current_time('mysql'),
            $mensaje
        );

        $headers = [
            'Content-Type: text/plain; charset=UTF-8',
            sprintf('Reply-To: %s <%s>', $userName, $userEmail),
        ];

        $enviado = @wp_mail($adminEmail, $asunto, $body, $headers);

        return $this->success([
            'enviado' => (bool) $enviado,
            'mensaje' => __('Tu solicitud de soporte ha sido recibida. El equipo de Puerto Analítico te responderá a la brevedad.', 'puerto-core'),
        ]);
    }
}
