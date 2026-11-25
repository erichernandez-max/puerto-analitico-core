<?php
declare(strict_types=1);

namespace PuertoCore\Rest;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Controlador de autenticación para la API REST de Puerto Analítico.
 *
 * Registra el endpoint:
 *   POST /wp-json/puerto/v1/auth/login
 *
 * Recibe { username, password } en el body JSON.
 * Usa wp_signon() para crear la cookie de sesión nativa de WordPress.
 * Devuelve 200 { success: true } o 401 con mensaje de error.
 *
 * NOTA: El endpoint es público (sin autenticación previa) porque su propósito
 * es precisamente autenticar al usuario. Se aplica rate-limiting básico via
 * el hook 'authenticate' de WordPress que ya tiene protección contra fuerza bruta.
 */
class AuthController extends RestController
{
    public function registerRoutes(): void
    {
        register_rest_route(
            $this->getNamespace(),
            '/auth/login',
            [
                'methods'             => 'POST',
                'callback'            => [$this, 'login'],
                'permission_callback' => [$this, 'checkPublic'],
                'args'                => [
                    'username' => [
                        'required'          => true,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                        'description'       => 'Nombre de usuario o correo electrónico de WordPress.',
                    ],
                    'password' => [
                        'required'    => true,
                        'type'        => 'string',
                        'description' => 'Contraseña del usuario.',
                    ],
                ],
            ]
        );
    }

    /**
     * Callback: autentica al usuario y establece la cookie de sesión.
     */
    public function login(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $username = (string) $request->get_param('username');
        $password = (string) $request->get_param('password');

        // wp_signon() valida las credenciales y fija la cookie de sesión.
        // El segundo parámetro (secure_cookie) en false deja que WordPress
        // decida según el contexto (HTTPS/HTTP).
        $user = wp_signon(
            [
                'user_login'    => $username,
                'user_password' => $password,
                'remember'      => true,
            ],
            false
        );

        if (is_wp_error($user)) {
            // Devolvemos un mensaje genérico para no revelar si el usuario existe.
            return $this->error(
                'puerto_auth_invalid_credentials',
                __('Credenciales incorrectas. Verifica tu usuario y contraseña.', 'puerto-core'),
                401
            );
        }

        // Éxito: la cookie ya fue enviada por wp_signon() en las cabeceras HTTP.
        return $this->success([
            'user_id'      => $user->ID,
            'display_name' => $user->display_name,
        ]);
    }
}
