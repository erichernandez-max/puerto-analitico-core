<?php
declare(strict_types=1);

namespace PuertoCore\Config;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Constantes globales del dominio y base de datos para Puerto Analítico Core.
 */
final class Constants
{
    // Prefijo de tablas del plugin
    public const TABLE_PREFIX = 'puerto_';

    // Nombres de tablas (sin prefijo de WP)
    public const TABLE_CONSULTORIOS     = 'puerto_consultorios';
    public const TABLE_PRODUCTOS        = 'puerto_productos';
    public const TABLE_USUARIOS_NEGOCIO = 'puerto_usuarios_negocio';
    public const TABLE_SALDOS           = 'puerto_saldos';
    public const TABLE_RESERVAS         = 'puerto_reservas';
    public const TABLE_MOVIMIENTOS      = 'puerto_movimientos';
    public const TABLE_REGLAS           = 'puerto_reglas';
    public const TABLE_BLOQUEOS         = 'puerto_bloqueos';

    // Roles y capacidades
    public const ROLE_PACIENTE          = 'puerto_paciente';
    public const CAP_RESERVAR           = 'puerto_reservar';

    // Versión de base de datos para migraciones
    public const DB_VERSION_OPTION      = 'puerto_core_db_version';
    public const DB_VERSION             = '1.1.0';

    // Crons de WordPress
    public const CRON_HOOK_CONSUMO_SALDO    = 'puerto_consumo_saldo';
    public const CRON_HOOK_EXPIRACION_SALDOS = 'puerto_expiracion_saldos';

    // REST API
    public const REST_NAMESPACE         = 'puerto/v1';

    // Grupo de caché
    public const CACHE_GROUP_REGLAS     = 'puerto_reglas';

    private function __construct()
    {
    }
}
