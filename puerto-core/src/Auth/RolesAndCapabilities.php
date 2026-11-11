<?php
declare(strict_types=1);

namespace PuertoCore\Auth;

use PuertoCore\Config\Constants;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Gestión de roles, capacidades personalizadas y permisos de Puerto Analítico.
 */
class RolesAndCapabilities
{
    /**
     * Registra el rol custom puerto_paciente y añade la capacidad puerto_reservar.
     */
    public static function register(): void
    {
        // Añadir capability al administrador
        $adminRole = get_role('administrator');
        if ($adminRole && !$adminRole->has_cap(Constants::CAP_RESERVAR)) {
            $adminRole->add_cap(Constants::CAP_RESERVAR);
        }

        // Crear o actualizar el rol puerto_paciente
        $pacienteRole = get_role(Constants::ROLE_PACIENTE);
        if (!$pacienteRole) {
            add_role(
                Constants::ROLE_PACIENTE,
                __('Terapeuta Puerto Analítico', 'puerto-core'),
                [
                    'read'                 => true,
                    Constants::CAP_RESERVAR => true,
                ]
            );
        } else {
            if (!$pacienteRole->has_cap(Constants::CAP_RESERVAR)) {
                $pacienteRole->add_cap(Constants::CAP_RESERVAR);
            }
        }
    }

    /**
     * Desregistra el rol custom y retira la capability al desactivar si es requerido.
     */
    public static function unregister(): void
    {
        $adminRole = get_role('administrator');
        if ($adminRole && $adminRole->has_cap(Constants::CAP_RESERVAR)) {
            $adminRole->remove_cap(Constants::CAP_RESERVAR);
        }

        // Nota: Por seguridad de datos no se elimina el rol puerto_paciente en deactivation
        // para no dejar a los usuarios huérfanos de rol. Se conserva para reactivación.
    }

    /**
     * Comprueba si un usuario dado (o el actual) puede reservar en Puerto Analítico.
     */
    public static function canReserve(?int $userId = null): bool
    {
        if ($userId === null) {
            return current_user_can(Constants::CAP_RESERVAR);
        }

        return user_can($userId, Constants::CAP_RESERVAR);
    }
}
