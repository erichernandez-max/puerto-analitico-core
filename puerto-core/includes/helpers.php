<?php
declare(strict_types=1);

use PuertoCore\Auth\RolesAndCapabilities;
use PuertoCore\Config\Constants;
use PuertoCore\Config\Reglas;

if (!defined('ABSPATH')) {
    exit;
}

if (!function_exists('puerto_current_user_can_reservar')) {
    /**
     * Comprueba si el usuario autenticado actual tiene permiso para crear reservas.
     */
    function puerto_current_user_can_reservar(): bool
    {
        return RolesAndCapabilities::canReserve();
    }
}

if (!function_exists('puerto_user_can_reservar')) {
    /**
     * Comprueba si un usuario específico tiene permiso para crear reservas.
     */
    function puerto_user_can_reservar(int $userId): bool
    {
        return RolesAndCapabilities::canReserve($userId);
    }
}

if (!function_exists('puerto_get_regla')) {
    /**
     * Obtiene el valor de una regla del negocio.
     */
    function puerto_get_regla(string $clave, mixed $default = null): mixed
    {
        return Reglas::get($clave, $default);
    }
}
