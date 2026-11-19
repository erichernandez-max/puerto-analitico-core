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
        // GET /admin/usuarios - Lista de usuarios con saldo y estado
        register_rest_route(
            $this->getNamespace(),
            '/admin/usuarios',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getUsuarios'],
                    'permission_callback' => [$this, 'checkAdmin'],
                ],
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'crearUsuario'],
                    'permission_callback' => [$this, 'checkAdmin'],
                    'args'                => [
                        'nombre' => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                        'email' => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_email',
                        ],
                        'password' => [
                            'required'          => true,
                            'type'              => 'string',
                        ],
                        'tipo_membresia' => [
                            'required'          => false,
                            'type'              => 'string',
                            'enum'              => ['prepago', 'turno', 'completo'],
                            'default'           => 'prepago',
                        ],
                        'saldo_inicial' => [
                            'required'          => false,
                            'type'              => 'number',
                            'default'           => 0,
                        ],
                        'notas' => [
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_textarea_field',
                        ],
                    ],
                ],
            ]
        );

        // GET /admin/bloqueos - Lista de bloqueos activos y futuros
        register_rest_route(
            $this->getNamespace(),
            '/admin/bloqueos',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getBloqueos'],
                    'permission_callback' => [$this, 'checkAdmin'],
                ],
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

        // DELETE /admin/bloqueos/{id} - Eliminar un bloqueo
        register_rest_route(
            $this->getNamespace(),
            '/admin/bloqueos/(?P<id>\d+)',
            [
                [
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => [$this, 'eliminarBloqueo'],
                    'permission_callback' => [$this, 'checkAdmin'],
                    'args'                => [
                        'id' => [
                            'required'          => true,
                            'type'              => 'integer',
                            'validate_callback' => static fn($v) => is_numeric($v) && (int) $v > 0,
                        ],
                    ],
                ],
            ]
        );

        // GET /admin/reservas - Listado completo de reservas para administración
        register_rest_route(
            $this->getNamespace(),
            '/admin/reservas',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getReservasAdmin'],
                    'permission_callback' => [$this, 'checkAdmin'],
                    'args'                => [
                        'consultorio_id' => [
                            'required'          => false,
                            'type'              => 'integer',
                        ],
                        'fecha' => [
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                        'estado' => [
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                    ],
                ],
            ]
        );

        // POST /admin/reservas/{id}/cancelar - Cancelación forzosa administrativa
        register_rest_route(
            $this->getNamespace(),
            '/admin/reservas/(?P<id>\d+)/cancelar',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'cancelarReservaAdmin'],
                    'permission_callback' => [$this, 'checkAdmin'],
                    'args'                => [
                        'id' => [
                            'required'          => true,
                            'type'              => 'integer',
                            'validate_callback' => static fn($v) => is_numeric($v) && (int) $v > 0,
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

        // GET & POST /admin/configuracion - Gestión de reglas de negocio
        register_rest_route(
            $this->getNamespace(),
            '/admin/configuracion',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getConfiguracion'],
                    'permission_callback' => [$this, 'checkAdmin'],
                ],
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'updateConfiguracion'],
                    'permission_callback' => [$this, 'checkAdmin'],
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
        $tablaSaldos          = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaConsultorios    = $wpdb->prefix . Constants::TABLE_CONSULTORIOS;

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

        // 1. KPI: Horas reservadas hoy
        $hoyStr = $ahora->format('Y-m-d');
        $horasHoy = (float) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, fecha_inicio, fecha_fin) / 60.0), 0)
             FROM {$tablaReservas}
             WHERE DATE(fecha_inicio) = %s AND estado IN ('confirmada', 'consumida')",
            $hoyStr
        ));

        // 2. KPI: Sesiones de esta semana (Lunes a Domingo)
        $inicioSemana = $ahora->modify('monday this week')->format('Y-m-d 00:00:00');
        $finSemana    = $ahora->modify('sunday this week')->format('Y-m-d 23:59:59');
        $sesionesSemana = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*)
             FROM {$tablaReservas}
             WHERE fecha_inicio >= %s AND fecha_fin <= %s AND estado IN ('confirmada', 'consumida')",
            $inicioSemana,
            $finSemana
        ));

        // 3. KPI: Total de créditos (horas) disponibles en toda la plataforma
        $creditosTotales = (float) $wpdb->get_var(
            "SELECT COALESCE(SUM(horas_compradas - horas_consumidas), 0)
             FROM {$tablaSaldos}
             WHERE estado = 'vigente'"
        );

        // 4. KPI: Cancelaciones del mes en curso
        $inicioMes = $ahora->modify('first day of this month')->format('Y-m-d 00:00:00');
        $finMes    = $ahora->modify('last day of this month')->format('Y-m-d 23:59:59');
        $cancelacionesMes = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*)
             FROM {$tablaReservas}
             WHERE fecha_inicio >= %s AND fecha_fin <= %s AND estado = 'cancelada'",
            $inicioMes,
            $finMes
        ));

        // 5. Reservas por cada consultorio (Verde, Rosa, Azul, Negro, Café)
        $consultorios = $wpdb->get_results(
            "SELECT id, nombre, color FROM {$tablaConsultorios} WHERE activo = 1 ORDER BY id ASC",
            ARRAY_A
        );

        $reservasPorConsultorio = [];
        if (!empty($consultorios)) {
            foreach ($consultorios as $c) {
                $cId = (int) $c['id'];
                $count = (int) $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM {$tablaReservas}
                     WHERE consultorio_id = %d AND fecha_inicio >= %s AND fecha_fin <= %s AND estado IN ('confirmada', 'consumida')",
                    $cId,
                    $fechaDesde,
                    $fechaHasta
                ));
                // Quitar prefijo "Consultorio " si existe para la etiqueta corta
                $nombreCorto = str_replace('Consultorio ', '', $c['nombre']);
                $reservasPorConsultorio[] = [
                    'consultorio_id' => $cId,
                    'nombre'         => $nombreCorto,
                    'nombre_completo'=> $c['nombre'],
                    'color'          => $c['color'] ?: '#2E7D32',
                    'reservas'       => $count,
                ];
            }
        } else {
            // Default de respaldo si no hay tabla poblada aún
            $reservasPorConsultorio = [
                ['consultorio_id' => 1, 'nombre' => 'Verde', 'nombre_completo' => 'Consultorio Verde', 'color' => '#2E7D32', 'reservas' => 0],
                ['consultorio_id' => 2, 'nombre' => 'Rosa',  'nombre_completo' => 'Consultorio Rosa',  'color' => '#E91E63', 'reservas' => 0],
                ['consultorio_id' => 3, 'nombre' => 'Azul',  'nombre_completo' => 'Consultorio Azul',  'color' => '#1976D2', 'reservas' => 0],
                ['consultorio_id' => 4, 'nombre' => 'Negro', 'nombre_completo' => 'Consultorio Negro', 'color' => '#212121', 'reservas' => 0],
                ['consultorio_id' => 5, 'nombre' => 'Café',  'nombre_completo' => 'Consultorio Café',  'color' => '#6D4C41', 'reservas' => 0],
            ];
        }

        // 6. Reservas de las últimas 4 semanas
        $reservas4Semanas = [];
        for ($i = 3; $i >= 0; $i--) {
            $semInicio = $ahora->modify("-{$i} weeks monday this week")->format('Y-m-d 00:00:00');
            $semFin    = $ahora->modify("-{$i} weeks sunday this week")->format('Y-m-d 23:59:59');
            $labelSem  = 'Sem ' . date('d/m', strtotime($semInicio));

            $countSem = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$tablaReservas}
                 WHERE fecha_inicio >= %s AND fecha_fin <= %s AND estado IN ('confirmada', 'consumida')",
                $semInicio,
                $semFin
            ));

            $reservas4Semanas[] = [
                'semana'       => $labelSem,
                'fecha_inicio' => $semInicio,
                'fecha_fin'    => $semFin,
                'reservas'     => $countSem,
            ];
        }

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
            'kpis' => [
                'horas_hoy'         => round($horasHoy, 2),
                'sesiones_semana'   => $sesionesSemana,
                'creditos_totales'  => round($creditosTotales, 2),
                'cancelaciones_mes' => $cancelacionesMes,
            ],
            'reservas_por_consultorio'   => $reservasPorConsultorio,
            'reservas_ultimas_4_semanas' => $reservas4Semanas,
        ]);
    }

    /**
     * GET /admin/usuarios - Lista todos los usuarios del negocio con saldo disponible y estado.
     */
    public function getUsuarios(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $tablaUsuariosNegocio = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;
        $tablaSaldos          = $wpdb->prefix . Constants::TABLE_SALDOS;

        // Obtener todos los registros de usuarios_negocio
        $registros = $wpdb->get_results(
            "SELECT un.user_id, un.tipo_membresia, un.estado, un.fecha_alta, un.notas
             FROM {$tablaUsuariosNegocio} un
             ORDER BY un.fecha_alta DESC",
            ARRAY_A
        );

        $usuarios = [];
        foreach ($registros as $row) {
            $userId = (int) $row['user_id'];
            $user = get_user_by('id', $userId);
            if (!$user) {
                continue;
            }

            // Calcular saldo disponible (horas vigentes - consumidas)
            $saldoDisponible = (float) $wpdb->get_var($wpdb->prepare(
                "SELECT COALESCE(SUM(horas_compradas - horas_consumidas), 0)
                 FROM {$tablaSaldos}
                 WHERE user_id = %d AND estado = 'vigente'",
                $userId
            ));

            $usuarios[] = [
                'id'              => $userId,
                'nombre'          => $user->display_name,
                'email'           => $user->user_email,
                'tipo_membresia'  => $row['tipo_membresia'],
                'estado'          => $row['estado'],
                'fecha_alta'      => $row['fecha_alta'],
                'notas'           => $row['notas'],
                'saldo_disponible'=> round($saldoDisponible, 2),
            ];
        }

        return $this->success($usuarios);
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

    /**
     * POST /admin/usuarios - Crea un nuevo usuario en WordPress con membresía y saldo inicial opcional.
     */
    public function crearUsuario(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $nombre        = trim((string) $request->get_param('nombre'));
        $email         = sanitize_email((string) $request->get_param('email'));
        $password      = (string) $request->get_param('password');
        $tipoMembresia = (string) $request->get_param('tipo_membresia') ?: 'prepago';
        $saldoInicial  = (float) $request->get_param('saldo_inicial');
        $notas         = sanitize_textarea_field((string) $request->get_param('notas'));

        if (empty($nombre) || empty($email) || empty($password)) {
            return $this->error('puerto_campos_requeridos', __('Nombre, email y contraseña son obligatorios.', 'puerto-core'), 400);
        }

        if (!is_email($email)) {
            return $this->error('puerto_email_invalido', __('El formato de correo electrónico no es válido.', 'puerto-core'), 400);
        }

        if (email_exists($email) || username_exists($email)) {
            return $this->error('puerto_email_duplicado', __('Ya existe un usuario registrado con este correo electrónico.', 'puerto-core'), 400);
        }

        // Crear o verificar rol balsas_paciente
        $rolBalsas = 'balsas_paciente';
        if (!get_role($rolBalsas)) {
            add_role($rolBalsas, __('Terapeuta Balsas', 'puerto-core'), [
                'read'                  => true,
                Constants::CAP_RESERVAR => true,
            ]);
        }

        $userId = wp_insert_user([
            'user_login'   => $email,
            'user_email'   => $email,
            'user_pass'    => $password,
            'display_name' => $nombre,
            'first_name'   => $nombre,
            'role'         => $rolBalsas,
        ]);

        if (is_wp_error($userId)) {
            return $this->error('puerto_error_crear_usuario', $userId->get_error_message(), 500);
        }

        // Asignar también el rol institucional puerto_paciente y capability
        $userObj = get_user_by('id', $userId);
        if ($userObj) {
            $userObj->add_role(Constants::ROLE_PACIENTE);
            $userObj->add_cap(Constants::CAP_RESERVAR);
        }

        $tablaUsuariosNegocio = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;
        $tablaSaldos          = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaMovimientos     = $wpdb->prefix . Constants::TABLE_MOVIMIENTOS;
        $ahoraStr             = current_time('mysql');

        // Insertar en tabla de negocio
        $wpdb->insert(
            $tablaUsuariosNegocio,
            [
                'user_id'        => $userId,
                'tipo_membresia' => in_array($tipoMembresia, ['prepago', 'turno', 'completo'], true) ? $tipoMembresia : 'prepago',
                'estado'         => 'activo',
                'fecha_alta'     => $ahoraStr,
                'notas'          => !empty($notas) ? $notas : null,
            ],
            ['%d', '%s', '%s', '%s', '%s']
        );

        // Si hay saldo inicial asignado, registrar lote y movimiento
        if ($saldoInicial > 0) {
            $tz = Reglas::timezone();
            $ahora = new DateTimeImmutable('now', $tz);
            $vencimiento = $ahora->modify('+6 months')->format('Y-m-d H:i:s');

            $wpdb->insert(
                $tablaSaldos,
                [
                    'user_id'           => $userId,
                    'producto_id'       => 1,
                    'horas_compradas'   => $saldoInicial,
                    'horas_consumidas'  => 0.00,
                    'fecha_compra'      => $ahoraStr,
                    'fecha_vencimiento' => $vencimiento,
                    'estado'            => 'vigente',
                ],
                ['%d', '%d', '%f', '%f', '%s', '%s', '%s']
            );

            $saldoId = (int) $wpdb->insert_id;

            $wpdb->insert(
                $tablaMovimientos,
                [
                    'user_id'       => $userId,
                    'saldo_id'      => $saldoId,
                    'reserva_id'    => null,
                    'tipo'          => 'compra',
                    'horas'         => $saldoInicial,
                    'motivo'        => 'Saldo inicial de alta de usuario',
                    'admin_user_id' => get_current_user_id(),
                    'created_at'    => $ahoraStr,
                ],
                ['%d', '%d', '%s', '%s', '%f', '%s', '%d', '%s']
            );
        }

        return $this->success([
            'id'               => $userId,
            'nombre'           => $nombre,
            'email'            => $email,
            'tipo_membresia'   => $tipoMembresia,
            'estado'           => 'activo',
            'saldo_disponible' => $saldoInicial,
            'fecha_alta'       => $ahoraStr,
            'mensaje'          => __('Usuario creado exitosamente con rol balsas_paciente.', 'puerto-core'),
        ], 201);
    }

    /**
     * GET /admin/bloqueos - Lista los bloqueos registrados (activos y futuros).
     */
    public function getBloqueos(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $tablaBloqueos     = $wpdb->prefix . Constants::TABLE_BLOQUEOS;
        $tablaConsultorios = $wpdb->prefix . Constants::TABLE_CONSULTORIOS;

        $sql = "SELECT b.id, b.consultorio_id, b.fecha_inicio, b.fecha_fin, b.motivo, 
                       b.recurrente, b.patron_recurrencia, b.created_at,
                       c.nombre as consultorio_nombre, c.color as consultorio_color
                FROM {$tablaBloqueos} b
                LEFT JOIN {$tablaConsultorios} c ON b.consultorio_id = c.id
                ORDER BY b.fecha_inicio DESC
                LIMIT 150";

        $filas = $wpdb->get_results($sql, ARRAY_A);
        $bloqueos = [];

        foreach ($filas as $f) {
            $cId = !empty($f['consultorio_id']) ? (int) $f['consultorio_id'] : 0;
            $bloqueos[] = [
                'id'                 => (int) $f['id'],
                'consultorio_id'     => $cId,
                'consultorio_nombre' => $cId > 0 && !empty($f['consultorio_nombre']) 
                    ? str_replace('Consultorio ', '', $f['consultorio_nombre']) 
                    : 'Todos los consultorios',
                'consultorio_color'  => $cId > 0 && !empty($f['consultorio_color']) 
                    ? $f['consultorio_color'] 
                    : '#64748b',
                'fecha_inicio'       => $f['fecha_inicio'],
                'fecha_fin'          => $f['fecha_fin'],
                'motivo'             => $f['motivo'],
                'recurrente'         => (bool) $f['recurrente'],
                'patron_recurrencia' => $f['patron_recurrencia'],
                'created_at'         => $f['created_at'],
            ];
        }

        return $this->success($bloqueos);
    }

    /**
     * DELETE /admin/bloqueos/{id} - Elimina un bloqueo administrativo.
     */
    public function eliminarBloqueo(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int) $request->get_param('id');
        $tablaBloqueos = $wpdb->prefix . Constants::TABLE_BLOQUEOS;

        $existe = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$tablaBloqueos} WHERE id = %d", $id));
        if (!$existe) {
            return $this->error('puerto_bloqueo_no_encontrado', __('El bloqueo especificado no existe.', 'puerto-core'), 404);
        }

        $eliminado = $wpdb->delete($tablaBloqueos, ['id' => $id], ['%d']);
        if ($eliminado === false) {
            return $this->error('puerto_error_eliminar', __('No se pudo eliminar el bloqueo.', 'puerto-core'), 500);
        }

        return $this->success([
            'id'      => $id,
            'mensaje' => __('Bloqueo eliminado correctamente.', 'puerto-core'),
        ]);
    }

    /**
     * GET /admin/reservas - Obtiene el listado de reservas con filtros por consultorio, fecha y estado.
     */
    public function getReservasAdmin(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $tablaReservas     = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $tablaConsultorios = $wpdb->prefix . Constants::TABLE_CONSULTORIOS;

        $consultorioId = $request->get_param('consultorio_id');
        $fecha         = $request->get_param('fecha');
        $estado        = $request->get_param('estado');

        $where = ["1=1"];
        $params = [];

        if (!empty($consultorioId) && is_numeric($consultorioId) && (int) $consultorioId > 0) {
            $where[] = "r.consultorio_id = %d";
            $params[] = (int) $consultorioId;
        }

        if (!empty($fecha)) {
            $where[] = "DATE(r.fecha_inicio) = %s";
            $params[] = sanitize_text_field((string) $fecha);
        }

        if (!empty($estado) && in_array($estado, ['pendiente_pago', 'confirmada', 'consumida', 'cancelada', 'no_show', 'liberada'], true)) {
            $where[] = "r.estado = %s";
            $params[] = $estado;
        }

        $whereClause = implode(" AND ", $where);
        $sql = "SELECT r.id, r.user_id, r.consultorio_id, r.fecha_inicio, r.fecha_fin, 
                       r.tipo, r.estado, r.saldo_id, r.consumida_en, r.es_recurrente, r.serie_id, r.created_at,
                       c.nombre as consultorio_nombre, c.color as consultorio_color
                FROM {$tablaReservas} r
                LEFT JOIN {$tablaConsultorios} c ON r.consultorio_id = c.id
                WHERE {$whereClause}
                ORDER BY r.fecha_inicio DESC
                LIMIT 200";

        if (!empty($params)) {
            $filas = $wpdb->get_results($wpdb->prepare($sql, ...$params), ARRAY_A);
        } else {
            $filas = $wpdb->get_results($sql, ARRAY_A);
        }

        $reservas = [];
        foreach ($filas as $r) {
            $userId = (int) $r['user_id'];
            $user = get_user_by('id', $userId);
            $duracionHoras = round((strtotime($r['fecha_fin']) - strtotime($r['fecha_inicio'])) / 3600.0, 2);

            $reservas[] = [
                'id'                 => (int) $r['id'],
                'user_id'            => $userId,
                'usuario_nombre'     => $user ? $user->display_name : 'Terapeuta #' . $userId,
                'usuario_email'      => $user ? $user->user_email : '',
                'consultorio_id'     => (int) $r['consultorio_id'],
                'consultorio_nombre' => !empty($r['consultorio_nombre']) ? str_replace('Consultorio ', '', $r['consultorio_nombre']) : 'N/A',
                'consultorio_color'  => !empty($r['consultorio_color']) ? $r['consultorio_color'] : '#2E7D32',
                'fecha_inicio'       => $r['fecha_inicio'],
                'fecha_fin'          => $r['fecha_fin'],
                'duracion_horas'     => $duracionHoras,
                'tipo'               => $r['tipo'],
                'estado'             => $r['estado'],
                'es_recurrente'      => (bool) $r['es_recurrente'],
                'serie_id'           => $r['serie_id'],
                'created_at'         => $r['created_at'],
            ];
        }

        return $this->success($reservas);
    }

    /**
     * POST /admin/reservas/{id}/cancelar - Cancelación forzosa por parte del administrador.
     */
    public function cancelarReservaAdmin(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int) $request->get_param('id');
        $motivo = sanitize_textarea_field((string) $request->get_param('motivo')) ?: 'Cancelación forzosa por administración';

        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $reserva = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$tablaReservas} WHERE id = %d", $id), ARRAY_A);

        if (!$reserva) {
            return $this->error('puerto_reserva_no_encontrada', __('La reserva indicada no existe.', 'puerto-core'), 404);
        }

        if ($reserva['estado'] === 'cancelada') {
            return $this->error('puerto_ya_cancelada', __('La reserva ya se encuentra cancelada.', 'puerto-core'), 400);
        }

        // Si fue consumida de saldo, reembolsar al usuario
        $reembolsado = false;
        if ($reserva['consumida_en'] !== null) {
            SaldoManager::devolverSaldo($id, $motivo);
            $reembolsado = true;
        }

        $wpdb->update(
            $tablaReservas,
            [
                'estado'        => 'cancelada',
                'consumida_en'  => null,
                'updated_at'    => current_time('mysql'),
            ],
            ['id' => $id],
            ['%s', '%s', '%s'],
            ['%d']
        );

        return $this->success([
            'status'      => 'cancelada_admin',
            'id'          => $id,
            'reembolsado' => $reembolsado,
            'motivo'      => $motivo,
            'mensaje'     => __('Reserva cancelada administrativamente con éxito.', 'puerto-core'),
        ]);
    }

    /**
     * GET /puerto/v1/admin/configuracion - Devuelve los valores actuales de la tabla puerto_reglas.
     */
    public function getConfiguracion(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $reglas = Reglas::all();
        return $this->success($reglas);
    }

    /**
     * POST /puerto/v1/admin/configuracion - Actualiza las reglas en la tabla puerto_reglas.
     */
    public function updateConfiguracion(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $params = $request->get_json_params();
        if (empty($params) || !is_array($params)) {
            $params = $request->get_params();
        }

        if (empty($params) || !is_array($params)) {
            return $this->error('puerto_params_invalidos', __('No se recibieron datos de configuración válidos.', 'puerto-core'), 400);
        }

        // Claves estándar reconocidas para la tabla puerto_reglas
        $clavesPermitidas = [
            'cancelacion_horas_minimas',
            'bloque_min_horas',
            'vigencia_meses',
            'consumo_offset_horas',
            'tz',
            'horario_lv_inicio',
            'horario_lv_fin',
            'horario_sab_inicio',
            'horario_sab_fin',
            'domingo_cerrado',
        ];

        $actualizadas = [];
        foreach ($params as $clave => $valor) {
            $claveSanitizada = sanitize_key($clave);
            // Permitir claves estándar o con prefijo
            if (in_array($claveSanitizada, $clavesPermitidas, true) || str_starts_with($claveSanitizada, 'puerto_')) {
                $valorSanitizado = is_bool($valor) ? ($valor ? '1' : '0') : sanitize_text_field((string) $valor);
                Reglas::set($claveSanitizada, $valorSanitizado);
                $actualizadas[$claveSanitizada] = $valorSanitizado;
            }
        }

        // Invalida caché global para sincronización inmediata
        Reglas::flush();

        return $this->success([
            'mensaje'      => __('Configuración actualizada exitosamente en puerto_reglas.', 'puerto-core'),
            'reglas'       => Reglas::all(),
            'actualizadas' => $actualizadas,
        ]);
    }
}
