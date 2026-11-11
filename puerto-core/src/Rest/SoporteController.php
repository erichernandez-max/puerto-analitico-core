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
                        'asunto'  => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                        'mensaje' => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_textarea_field',
                        ],
                    ],
                ],
            ]
        );
    }

    public function enviarSoporte(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $asunto = trim((string) $request->get_param('asunto'));
        $mensaje = trim((string) $request->get_param('mensaje'));

        if (empty($asunto) || empty($mensaje)) {
            return $this->error(
                'puerto_rest_invalid_soporte',
                __('El asunto y el mensaje son obligatorios.', 'puerto-core'),
                400
            );
        }

        $userId = get_current_user_id();
        $user = get_userdata($userId);
        $userEmail = $user ? $user->user_email : 'desconocido@puertoanalitico.mx';
        $userName = $user ? $user->display_name : 'Terapeuta';

        $adminEmail = get_option('admin_email', 'contacto@balsasanaliticas.com');
        $subject = sprintf('[Puerto Analítico Soporte] %s (De: %s)', $asunto, $userName);
        $body = sprintf(
            "Solicitud de Soporte en Puerto Analítico\n\n" .
            "Terapeuta: %s (ID: %d)\n" .
            "Email: %s\n" .
            "Fecha: %s\n\n" .
            "Mensaje:\n%s\n",
            $userName,
            $userId,
            $userEmail,
            current_time('mysql'),
            $mensaje
        );

        $headers = [
            'Content-Type: text/plain; charset=UTF-8',
            sprintf('Reply-To: %s <%s>', $userName, $userEmail),
        ];

        // Intentar envío de correo
        @wp_mail($adminEmail, $subject, $body, $headers);

        return $this->success([
            'enviado' => true,
            'mensaje' => __('Tu solicitud de soporte ha sido recibida. El equipo de Puerto Analítico te responderá a la brevedad.', 'puerto-core'),
        ]);
    }
}
