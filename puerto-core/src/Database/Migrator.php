<?php
declare(strict_types=1);

namespace PuertoCore\Database;

use PuertoCore\Config\Constants;
use PuertoCore\Database\Seeders\ReglasSeeder;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Gestor de migraciones de base de datos utilizando dbDelta de WordPress y
 * migraciones incrementales defensivas e idempotentes.
 */
class Migrator
{
    /**
     * Ejecuta todas las migraciones del plugin de manera 100% idempotente.
     */
    public static function migrate(): void
    {
        global $wpdb;

        if (file_exists(ABSPATH . 'wp-admin/includes/upgrade.php')) {
            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        }

        $charsetCollate = method_exists($wpdb, 'get_charset_collate') ? $wpdb->get_charset_collate() : 'DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci';

        $tablaConsultorios     = $wpdb->prefix . Constants::TABLE_CONSULTORIOS;
        $tablaProductos        = $wpdb->prefix . Constants::TABLE_PRODUCTOS;
        $tablaUsuariosNegocio  = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;
        $tablaSaldos           = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaReservas         = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $tablaMovimientos      = $wpdb->prefix . Constants::TABLE_MOVIMIENTOS;
        $tablaReglas           = $wpdb->prefix . Constants::TABLE_REGLAS;
        $tablaBloqueos         = $wpdb->prefix . Constants::TABLE_BLOQUEOS;

        // 1. Tabla consultorios (F2: 74h físicas, 2h mantenimiento, 72h vendibles)
        $sqlConsultorios = "CREATE TABLE {$tablaConsultorios} (
id bigint(20) unsigned NOT NULL auto_increment,
nombre varchar(100) NOT NULL,
color varchar(30) NOT NULL,
activo tinyint(1) NOT NULL default 1,
google_calendar_id varchar(255) default NULL,
capacidad_fisica_semanal_horas int(11) NOT NULL default 74,
horas_mantenimiento_semanal int(11) NOT NULL default 2,
capacidad_max_semanal_horas int(11) NOT NULL default 72,
created_at datetime NOT NULL default CURRENT_TIMESTAMP,
PRIMARY KEY  (id),
KEY activo (activo)
) {$charsetCollate};";

        // 2. Tabla productos
        $sqlProductos = "CREATE TABLE {$tablaProductos} (
id bigint(20) unsigned NOT NULL auto_increment,
nombre varchar(150) NOT NULL default '',
tipo enum('hora_suelta','bloque','turno','consultorio_completo') NOT NULL,
horas_incluidas decimal(6,2) NOT NULL default 0.00,
precio decimal(10,2) NOT NULL default 0.00,
descuento_pct decimal(5,2) NOT NULL default 0.00,
vigencia_meses int(11) NOT NULL default 6,
requiere_disponibilidad_consecutiva tinyint(1) NOT NULL default 0,
activo tinyint(1) NOT NULL default 1,
created_at datetime NOT NULL default CURRENT_TIMESTAMP,
PRIMARY KEY  (id),
KEY activo_tipo (activo, tipo)
) {$charsetCollate};";

        // 3. Tabla usuarios_negocio
        $sqlUsuariosNegocio = "CREATE TABLE {$tablaUsuariosNegocio} (
user_id bigint(20) unsigned NOT NULL,
tipo_membresia enum('prepago','turno','completo') NOT NULL default 'prepago',
estado enum('activo','congelado','moroso') NOT NULL default 'activo',
fecha_alta datetime NOT NULL,
notas text default NULL,
PRIMARY KEY  (user_id),
KEY estado (estado)
) {$charsetCollate};";

        // 4. Tabla saldos
        $sqlSaldos = "CREATE TABLE {$tablaSaldos} (
id bigint(20) unsigned NOT NULL auto_increment,
user_id bigint(20) unsigned NOT NULL,
producto_id bigint(20) unsigned NOT NULL,
horas_compradas decimal(6,2) NOT NULL default 0.00,
horas_consumidas decimal(6,2) NOT NULL default 0.00,
fecha_compra datetime NOT NULL,
fecha_vencimiento datetime NOT NULL,
estado enum('vigente','agotado','vencido') NOT NULL default 'vigente',
renovado_por_compra_id bigint(20) unsigned default NULL,
PRIMARY KEY  (id),
KEY user_id (user_id),
KEY estado (estado),
KEY fecha_vencimiento (fecha_vencimiento)
) {$charsetCollate};";

        // 5. Tabla reservas (F2: consumida_en DATETIME NULL, serie_id VARCHAR(36))
        $sqlReservas = "CREATE TABLE {$tablaReservas} (
id bigint(20) unsigned NOT NULL auto_increment,
user_id bigint(20) unsigned NOT NULL,
consultorio_id bigint(20) unsigned NOT NULL,
fecha_inicio datetime NOT NULL,
fecha_fin datetime NOT NULL,
tipo enum('hora','bloque','turno','completo') NOT NULL,
estado enum('pendiente_pago','confirmada','consumida','cancelada','no_show','liberada') NOT NULL default 'pendiente_pago',
saldo_id bigint(20) unsigned default NULL,
consumida_en datetime default NULL,
google_event_id varchar(255) default NULL,
es_recurrente tinyint(1) NOT NULL default 0,
serie_id varchar(36) default NULL,
created_at datetime NOT NULL,
updated_at datetime NOT NULL,
PRIMARY KEY  (id),
KEY consultorio_fechas (consultorio_id, fecha_inicio, fecha_fin),
KEY user_fecha (user_id, fecha_inicio),
KEY estado (estado),
KEY serie_id (serie_id)
) {$charsetCollate};";

        // 6. Tabla movimientos
        $sqlMovimientos = "CREATE TABLE {$tablaMovimientos} (
id bigint(20) unsigned NOT NULL auto_increment,
user_id bigint(20) unsigned NOT NULL,
saldo_id bigint(20) unsigned default NULL,
reserva_id bigint(20) unsigned default NULL,
tipo enum('compra','consumo','devolucion','ajuste_admin','expiracion') NOT NULL,
horas decimal(6,2) NOT NULL default 0.00,
motivo varchar(255) NOT NULL,
admin_user_id bigint(20) unsigned default NULL,
created_at datetime NOT NULL,
PRIMARY KEY  (id),
KEY user_created (user_id, created_at)
) {$charsetCollate};";

        // 7. Tabla reglas
        $sqlReglas = "CREATE TABLE {$tablaReglas} (
clave varchar(64) NOT NULL,
valor text NOT NULL,
PRIMARY KEY  (clave)
) {$charsetCollate};";

        // 8. Tabla bloqueos (F2: Mantenimiento, feriados y bloqueos admin)
        $sqlBloqueos = "CREATE TABLE {$tablaBloqueos} (
id bigint(20) unsigned NOT NULL auto_increment,
consultorio_id bigint(20) unsigned default NULL,
fecha_inicio datetime NOT NULL,
fecha_fin datetime NOT NULL,
motivo enum('mantenimiento','feriado','admin','otro') NOT NULL default 'mantenimiento',
recurrente tinyint(1) NOT NULL default 0,
patron_recurrencia varchar(64) default NULL,
created_by bigint(20) unsigned NOT NULL,
created_at datetime NOT NULL default CURRENT_TIMESTAMP,
PRIMARY KEY  (id),
KEY consultorio_fechas (consultorio_id, fecha_inicio, fecha_fin),
KEY recurrente_motivo (recurrente, motivo)
) {$charsetCollate};";

        if (function_exists('dbDelta')) {
            dbDelta($sqlConsultorios);
            dbDelta($sqlProductos);
            dbDelta($sqlUsuariosNegocio);
            dbDelta($sqlSaldos);
            dbDelta($sqlReservas);
            dbDelta($sqlMovimientos);
            dbDelta($sqlReglas);
            dbDelta($sqlBloqueos);
        }

        // Migración incremental para tablas existentes en F1
        self::applyIncrementalMigrations();

        // Sembrar reglas iniciales obligatorias
        ReglasSeeder::seed();

        if (function_exists('update_option')) {
            update_option(Constants::DB_VERSION_OPTION, Constants::DB_VERSION);
        }
    }

    /**
     * Aplica alteraciones incrementales de manera segura e idempotente.
     * Verifica la existencia previa de columnas antes de ejecutar ALTER TABLE.
     */
    public static function applyIncrementalMigrations(): void
    {
        global $wpdb;

        $tablaConsultorios = $wpdb->prefix . Constants::TABLE_CONSULTORIOS;
        $tablaReservas     = $wpdb->prefix . Constants::TABLE_RESERVAS;

        // 1. Columnas en puerto_consultorios
        $colFisica = $wpdb->get_results("SHOW COLUMNS FROM {$tablaConsultorios} LIKE 'capacidad_fisica_semanal_horas'");
        if (empty($colFisica)) {
            $wpdb->query("ALTER TABLE {$tablaConsultorios} ADD COLUMN capacidad_fisica_semanal_horas int(11) NOT NULL default 74 AFTER google_calendar_id");
        }

        $colMantenimiento = $wpdb->get_results("SHOW COLUMNS FROM {$tablaConsultorios} LIKE 'horas_mantenimiento_semanal'");
        if (empty($colMantenimiento)) {
            $wpdb->query("ALTER TABLE {$tablaConsultorios} ADD COLUMN horas_mantenimiento_semanal int(11) NOT NULL default 2 AFTER capacidad_fisica_semanal_horas");
        }

        // 2. Columnas en puerto_reservas
        $colConsumida = $wpdb->get_results("SHOW COLUMNS FROM {$tablaReservas} LIKE 'consumida_en'");
        if (empty($colConsumida)) {
            $wpdb->query("ALTER TABLE {$tablaReservas} ADD COLUMN consumida_en datetime default NULL AFTER saldo_id");
        }

        // 3. Modificar serie_id a VARCHAR(36) para UUID si aún fuera BIGINT
        $colSerie = $wpdb->get_results("SHOW COLUMNS FROM {$tablaReservas} LIKE 'serie_id'");
        if (!empty($colSerie)) {
            $tipoSerie = strtolower((string) ($colSerie[0]->Type ?? $colSerie[0]->type ?? ''));
            if (str_starts_with($tipoSerie, 'bigint')) {
                $wpdb->query("ALTER TABLE {$tablaReservas} MODIFY COLUMN serie_id varchar(36) default NULL");
            }
        }
    }
}
