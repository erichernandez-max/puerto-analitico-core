<?php
declare(strict_types=1);

namespace PuertoCore\Rest;

use DateTimeImmutable;
use Exception;
use PuertoCore\Config\Constants;
use PuertoCore\Config\Reglas;
use PuertoCore\Services\SaldoManager;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Endpoints REST administrativos de Puerto Analítico (restringidos a manage_options).
 * Gestiona métricas, mantenimiento recurrente de 2h/semana, bloqueos y ajustes de saldo (R9).
 */
class AdminController extends RestController
{
    public function registerRoutes(): void
    {
        // GET /admin/metricas?desde=&hasta=
        register_rest_route(
            $this->getNamespace(),
            '/admin/metricas',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getMetricas'],
                    'permission_callback' => [$this, 'checkAdmin'],
                    'args'                => [
                        'desde' => [
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                        'hasta' => [
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                    ],
                ],
            ]
        );

        // POST /admin/mantenimiento - Configurar bloqueo recurrente de mantenimiento (F2: 2h/semana)
        register_rest_route(
            $this->getNamespace(),
            '/admin/mantenimiento',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'configurarMantenimiento'],
                    'permission_callback' => [$this, 'checkAdmin'],
                    'args'                => [
                        'consultorio_id' => [
                            'required'          => true,
                            'type'              => 'integer',
                            'validate_callback' => static fn($v) => is_numeric($v) && (int) $v >= 0,
                            'description'       => 'ID del consultorio o 0 para aplicar a todos los consultorios.',
                        ],
                        'dia_semana' => [
                            'required'          => true,
                            'type'              => 'integer',
                            'validate_callback' => static fn($v) => is_numeric($v) && (int) $v >= 0 && (int) $v <= 6,
                            'description'       => 'Día de la semana (0=Domingo, 1=Lunes, 2=Martes ... 6=Sábado).',
                        ],
                        'hora_inicio' => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                            'description'       => 'Hora de inicio en formato HH:mm (ej. 14:00).',
                        ],
                        'hora_fin' => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                            'description'       => 'Hora de fin en formato HH:mm (ej. 16:00).',
                        ],
                        'vigente_desde' => [
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                        'vigente_hasta' => [
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                    ],
                ],
            ]
        );

        // POST /admin/bloqueos - Bloqueo puntual o administrativo
        register_rest_route(
            $this->getNamespace(),
            '/admin/bloqueos',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'crearBloqueo'],
                    'permission_callback' => [$this, 'checkAdmin'],
                    'args'                => [
                        'consultorio_id' => [
                            'required'          => true,
                            'type'              => 'integer',
                            'validate_callback' => static fn($v) => is_numeric($v) && (int) $v >= 0,
                            'description'       => 'ID de consultorio o 0 para todos los consultorios.',
                        ],
                        'fecha_inicio' => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                        'fecha_fin' => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                        'motivo' => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_textarea_field',
                        ],
                    ],
                ],
            ]
        );

        // POST /admin/usuarios/{id}/saldo - Ajuste o compra de saldo (R9)
        register_rest_route(
            $this->getNamespace(),
            '/admin/usuarios/(?P<id>\d+)/saldo',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'ajustarSaldo'],
                    'permission_callback' => [$this, 'checkAdmin'],
                    'args'                => [
                        'id' => [
                            'required'          => true,
                            'type'              => 'integer',
                            'validate_callback' => static fn($v) => is_numeric($v) && (int) $v > 0,
                        ],
                        'horas' => [
                            'required'          => true,
                            'type'              => 'number',
                        ],
                        'tipo' => [
                            'required'          => true,
                            'type'              => 'string',
                            'enum'              => ['compra', 'consumo', 'devolucion', 'ajuste_admin', 'expiracion'],
                        ],
                        'motivo' => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                    ],
                ],
            ]
        );

        // POST /admin/usuarios/{id}/congelar
        register_rest_route(
            $this->getNamespace(),
            '/admin/usuarios/(?P<id>\d+)/congelar',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'cambiarEstadoUsuario'],
                    'permission_callback' => [$this, 'checkAdmin'],
                    'args'                => [
                        'id' => [
                            'required'          => true,
                            'type'              => 'integer',
                            'validate_callback' => static fn($v) => is_numeric($v) && (int) $v > 0,
                        ],
                        'estado' => [
                            'required'          => true,
                            'type'              => 'string',
                            'enum'              => ['activo', 'congelado', 'moroso'],
                        ],
                        'motivo' => [
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_textarea_field',
                        ],
                    ],
                ],
            ]
        );
    }

    /**
     * POST /puerto/v1/admin/mantenimiento - Configura el bloqueo recurrente semanal de 2 horas.
     */
    public function configurarMantenimiento(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $consultorioId = (int) $request->get_param('consultorio_id');
        $diaSemana     = (int) $request->get_param('dia_semana');
        $horaInicio    = trim((string) $request->get_param('hora_inicio'));
        $horaFin       = trim((string) $request->get_param('hora_fin'));
        $vigenteDesde  = $request->get_param('vigente_desde') ? (string) $request->get_param('vigente_desde') : current_time('mysql');
        $vigenteHasta  = $request->get_param('vigente_hasta') ? (string) $request->get_param('vigente_hasta') : null;

        // Normalizar formato HH:mm
        $horaInicioNorm = date('H:i', strtotime($horaInicio));
        $horaFinNorm    = date('H:i', strtotime($horaFin));

        if (strtotime($horaFinNorm) <= strtotime($horaInicioNorm)) {
            return $this->error('puerto_horas_invalidas', __('La hora de fin debe ser posterior a la de inicio.', 'puerto-core'), 400);
        }

        // Formato unificado: dia_semana:X;hora_inicio:HH:mm;hora_fin:HH:mm
        $patronRecurrencia = sprintf(
            'dia_semana:%d;hora_inicio:%s;hora_fin:%s',
            $diaSemana,
            $horaInicioNorm,
            $horaFinNorm
        );

        $tablaBloqueos = $wpdb->prefix . Constants::TABLE_BLOQUEOS;
        $consultorioDbVal = ($consultorioId > 0) ? $consultorioId : null;

        $insertado = $wpdb->insert(
            $tablaBloqueos,
            [
                'consultorio_id'     => $consultorioDbVal,
                'fecha_inicio'       => $vigenteDesde,
                'fecha_fin'          => $vigenteHasta ?: '2099-12-31 23:59:59',
                'motivo'             => 'mantenimiento',
                'recurrente'         => 1,
                'patron_recurrencia' => $patronRecurrencia,
                'created_by'         => get_current_user_id(),
                'created_at'         => current_time('mysql'),
            ],
            ['%d', '%s', '%s', '%s', '%d', '%s', '%d', '%s']
        );

        if (!$insertado) {
            return $this->error('puerto_error_db', __('No se pudo registrar el bloqueo recurrente.', 'puerto-core'), 500);
        }

        $nuevoId = (int) $wpdb->insert_id;

        return $this->success([
            'status'             => 'mantenimiento_configurado',
            'id'                 => $nuevoId,
            'consultorio_id'     => $consultorioDbVal,
            'dia_semana'         => $diaSemana,
            'hora_inicio'        => $horaInicioNorm,
            'hora_fin'           => $horaFinNorm,
            'patron_recurrencia' => $patronRecurrencia,
            'mensaje'            => __('Bloqueo semanal recurrente de mantenimiento registrado con éxito.', 'puerto-core'),
        ], 201);
    }

    /**
     * GET /admin/metricas
     */
    public function getMetricas(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $desde = $request->get_param('desde');
        $hasta = $request->get_param('hasta');

        $tz = Reglas::timezone();
        $ahora = new DateTimeImmutable('now', $tz);

        $fechaDesde = !empty($desde) ? date('Y-m-d 00:00:00', strtotime((string) $desde)) : $ahora->modify('-30 days')->format('Y-m-d 00:00:00');
        $fechaHasta = !empty($hasta) ? date('Y-m-d 23:59:59', strtotime((string) $hasta)) : $ahora->format('Y-m-d 23:59:59');

        $tablaReservas        = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $tablaUsuariosNegocio = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;

        $totalUsuarios = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$tablaUsuariosNegocio}");
        $usuariosActivos = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$tablaUsuariosNegocio} WHERE estado = 'activo'");

        $queryReservas = $wpdb->prepare(
            "SELECT COUNT(*) as total_reservas,
                    SUM(CASE WHEN estado IN ('confirmada', 'consumida') THEN 1 ELSE 0 END) as confirmadas,
                    SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
                    SUM(TIMESTAMPDIFF(MINUTE, fecha_inicio, fecha_fin) / 60.0) as horas_totales
             FROM {$tablaReservas}
             WHERE fecha_inicio >= %s AND fecha_fin <= %s",
            $fechaDesde,
            $fechaHasta
        );
        $metricasReservas = $wpdb->get_row($queryReservas, ARRAY_A);

        return $this->success([
            'periodo' => [
                'desde' => $fechaDesde,
                'hasta' => $fechaHasta,
            ],
            'usuarios' => [
                'total'    => $totalUsuarios,
                'activos'  => $usuariosActivos,
            ],
            'reservas' => [
                'total'          => (int) ($metricasReservas['total_reservas'] ?? 0),
                'confirmadas'    => (int) ($metricasReservas['confirmadas'] ?? 0),
                'canceladas'     => (int) ($metricasReservas['canceladas'] ?? 0),
                'horas_totales'  => round((float) ($metricasReservas['horas_totales'] ?? 0), 2),
            ],
        ]);
    }

    /**
     * POST /admin/bloqueos - Crea un bloqueo puntual en puerto_bloqueos.
     */
    public function crearBloqueo(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $consultorioId = (int) $request->get_param('consultorio_id');
        $fechaInicio   = (string) $request->get_param('fecha_inicio');
        $fechaFin      = (string) $request->get_param('fecha_fin');
        $motivo        = (string) $request->get_param('motivo');

        if (strtotime($fechaFin) <= strtotime($fechaInicio)) {
            return $this->error('puerto_fechas_invalidas', __('La fecha de fin debe ser posterior a la de inicio.', 'puerto-core'), 400);
        }

        $tablaBloqueos = $wpdb->prefix . Constants::TABLE_BLOQUEOS;
        $consultorioDbVal = ($consultorioId > 0) ? $consultorioId : null;

        $wpdb->insert(
            $tablaBloqueos,
            [
                'consultorio_id'     => $consultorioDbVal,
                'fecha_inicio'       => date('Y-m-d H:i:s', strtotime($fechaInicio)),
                'fecha_fin'          => date('Y-m-d H:i:s', strtotime($fechaFin)),
                'motivo'             => 'admin',
                'recurrente'         => 0,
                'patron_recurrencia' => null,
                'created_by'         => get_current_user_id(),
                'created_at'         => current_time('mysql'),
            ],
            ['%d', '%s', '%s', '%s', '%d', '%s', '%d', '%s']
        );

        $nuevoId = (int) $wpdb->insert_id;

        return $this->success([
            'status'         => 'bloqueo_creado',
            'id'             => $nuevoId,
            'consultorio_id' => $consultorioDbVal,
            'fecha_inicio'   => $fechaInicio,
            'fecha_fin'      => $fechaFin,
            'motivo'         => $motivo,
            'mensaje'        => __('Bloqueo administrativo registrado con éxito en la base de datos.', 'puerto-core'),
        ], 201);
    }

    /**
     * POST /admin/usuarios/{id}/saldo - Ajuste directo de saldo con soporte R9 (renovación de vigencia al comprar).
     */
    public function ajustarSaldo(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $userId = (int) $request->get_param('id');
        $horas  = (float) $request->get_param('horas');
        $tipo   = (string) $request->get_param('tipo');
        $motivo = (string) $request->get_param('motivo');

        $user = get_user_by('id', $userId);
        if (!$user) {
            return $this->error('puerto_usuario_no_encontrado', __('El usuario no existe.', 'puerto-core'), 404);
        }

        $tablaSaldos      = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaMovimientos = $wpdb->prefix . Constants::TABLE_MOVIMIENTOS;

        $tz = Reglas::timezone();
        $ahora = new DateTimeImmutable('now', $tz);
        $fechaVencimiento = $ahora->modify('+6 months')->format('Y-m-d H:i:s');
        $ahoraStr = $ahora->format('Y-m-d H:i:s');

        $saldoId = null;
        $renovados = 0;

        $wpdb->query('START TRANSACTION');

        try {
            if ($tipo === 'compra') {
                // Insertar nuevo lote de saldo
                $wpdb->insert(
                    $tablaSaldos,
                    [
                        'user_id'           => $userId,
                        'producto_id'       => 1, // Paquete o producto base
                        'horas_compradas'   => $horas,
                        'horas_consumidas'  => 0.00,
                        'fecha_compra'      => $ahoraStr,
                        'fecha_vencimiento' => $fechaVencimiento,
                        'estado'            => 'vigente',
                    ],
                    ['%d', '%d', '%f', '%f', '%s', '%s', '%s']
                );

                $saldoId = (int) $wpdb->insert_id;

                // Regla R9: Nueva compra renueva la vigencia de todos los saldos vigentes
                $renovados = SaldoManager::renovarSaldosVigentesPorCompra($userId, $saldoId, $fechaVencimiento);

                // Registrar movimiento de compra
                $wpdb->insert(
                    $tablaMovimientos,
                    [
                        'user_id'       => $userId,
                        'saldo_id'      => $saldoId,
                        'reserva_id'    => null,
                        'tipo'          => 'compra',
                        'horas'         => $horas,
                        'motivo'        => $motivo ?: sprintf('Compra de paquete (vigencia extendida hasta %s)', $fechaVencimiento),
                        'admin_user_id' => get_current_user_id(),
                        'created_at'    => $ahoraStr,
                    ],
                    ['%d', '%d', '%s', '%s', '%f', '%s', '%d', '%s']
                );
            } else {
                // Registrar movimiento de ajuste administrativo
                $wpdb->insert(
                    $tablaMovimientos,
                    [
                        'user_id'       => $userId,
                        'saldo_id'      => null,
                        'reserva_id'    => null,
                        'tipo'          => $tipo,
                        'horas'         => $horas,
                        'motivo'        => $motivo,
                        'admin_user_id' => get_current_user_id(),
                        'created_at'    => $ahoraStr,
                    ],
                    ['%d', '%s', '%s', '%s', '%f', '%s', '%d', '%s']
                );
            }

            $wpdb->query('COMMIT');
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return $this->error('puerto_error_ajuste_saldo', $e->getMessage(), 500);
        }

        return $this->success([
            'status'            => 'saldo_actualizado',
            'user_id'           => $userId,
            'horas'             => $horas,
            'tipo'              => $tipo,
            'saldo_id'          => $saldoId,
            'saldos_renovados'  => $renovados,
            'saldo_disponible'  => SaldoManager::getSaldoDisponible($userId),
            'mensaje'           => __('Operación de saldo realizada correctamente.', 'puerto-core'),
        ]);
    }

    /**
     * POST /admin/usuarios/{id}/congelar - Congela o activa la cuenta de un usuario (R13).
     */
    public function cambiarEstadoUsuario(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $userId = (int) $request->get_param('id');
        $estado = (string) $request->get_param('estado');
        $motivo = (string) $request->get_param('motivo');

        $user = get_user_by('id', $userId);
        if (!$user) {
            return $this->error('puerto_usuario_no_encontrado', __('El usuario no existe.', 'puerto-core'), 404);
        }

        $tablaUsuariosNegocio = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;

        $existe = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$tablaUsuariosNegocio} WHERE user_id = %d",
            $userId
        ));

        if ($existe) {
            $wpdb->update(
                $tablaUsuariosNegocio,
                [
                    'estado' => $estado,
                    'notas'  => !empty($motivo) ? $motivo : null,
                ],
                ['user_id' => $userId],
                ['%s', '%s'],
                ['%d']
            );
        } else {
            $wpdb->insert(
                $tablaUsuariosNegocio,
                [
                    'user_id'        => $userId,
                    'tipo_membresia' => 'prepago',
                    'estado'         => $estado,
                    'fecha_alta'     => current_time('mysql'),
                    'notas'          => !empty($motivo) ? $motivo : null,
                ],
                ['%d', '%s', '%s', '%s', '%s']
            );
        }

        return $this->success([
            'status'   => 'estado_actualizado',
            'user_id'  => $userId,
            'usuario'  => $user->display_name,
            'estado'   => $estado,
            'motivo'   => $motivo,
            'mensaje'  => sprintf(__('El estado del usuario %s fue actualizado a "%s".', 'puerto-core'), $user->display_name, $estado),
        ]);
    }
}
