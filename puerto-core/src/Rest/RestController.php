<?php
declare(strict_types=1);

namespace PuertoCore\Rest;

use PuertoCore\Auth\RolesAndCapabilities;
use PuertoCore\Config\Constants;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Controlador base abstracto para la API REST de Puerto Analítico.
 */
abstract class RestController
{
    /**
     * Registra las rutas REST del controlador.
     */
    abstract public function registerRoutes(): void;

    /**
     * Namespace común para los endpoints.
     */
    protected function getNamespace(): string
    {
        return Constants::REST_NAMESPACE;
    }

    /**
     * Callback de permiso: público (cualquiera puede acceder).
     */
    public function checkPublic(WP_REST_Request $request): bool
    {
        return true;
    }

    /**
     * Callback de permiso: usuario autenticado en WordPress.
     */
    public function checkLoggedIn(WP_REST_Request $request): bool|WP_Error
    {
        if (!is_user_logged_in()) {
            return new WP_Error(
                'puerto_rest_unauthorized',
                __('Debes iniciar sesión para acceder a este recurso.', 'puerto-core'),
                ['status' => 401]
            );
        }

        return true;
    }

    /**
     * Callback de permiso: usuario con permiso para reservar (puerto_reservar).
     */
    public function checkCanReserve(WP_REST_Request $request): bool|WP_Error
    {
        $loggedInCheck = $this->checkLoggedIn($request);
        if ($loggedInCheck !== true) {
            return $loggedInCheck;
        }

        if (!RolesAndCapabilities::canReserve()) {
            return new WP_Error(
                'puerto_rest_forbidden',
                __('No tienes permisos suficientes para realizar reservas.', 'puerto-core'),
                ['status' => 403]
            );
        }

        return true;
    }

    /**
     * Callback de permiso: solo administradores de WordPress (manage_options).
     */
    public function checkAdmin(WP_REST_Request $request): bool|WP_Error
    {
        $loggedInCheck = $this->checkLoggedIn($request);
        if ($loggedInCheck !== true) {
            return $loggedInCheck;
        }

        if (!current_user_can('manage_options')) {
            return new WP_Error(
                'puerto_rest_forbidden_admin',
                __('Acceso restringido únicamente a administradores.', 'puerto-core'),
                ['status' => 403]
            );
        }

        return true;
    }

    /**
     * Genera una respuesta REST exitosa estandarizada.
     *
     * @param mixed $data Datos de respuesta
     * @param int $status Código HTTP
     */
    protected function success(mixed $data, int $status = 200): WP_REST_Response
    {
        return new WP_REST_Response([
            'success' => true,
            'data'    => $data,
        ], $status);
    }

    /**
     * Genera un WP_Error formateado con código HTTP.
     */
    protected function error(string $code, string $message, int $status = 400, mixed $data = null): WP_Error
    {
        $errorData = ['status' => $status];
        if (is_array($data)) {
            $errorData = array_merge($errorData, $data);
            $errorData['details'] = $data;
        } elseif ($data !== null) {
            $errorData['details'] = $data;
        }

        return new WP_Error($code, $message, $errorData);
    }
}
