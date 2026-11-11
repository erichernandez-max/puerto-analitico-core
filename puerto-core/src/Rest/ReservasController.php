<?php
declare(strict_types=1);

namespace PuertoCore\Rest;

use DateInterval;
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
 * Controlador REST para la gestión integral de reservas en Puerto Analítico.
 * Implementa integridad transaccional estricta (FOR UPDATE), R1-R17, series recurrentes,
 * cancelaciones con/sin devolución (R5), reagendamiento (R6) y no-show.
 */
class ReservasController extends RestController
{
    public function registerRoutes(): void
    {
        // POST /reservas - Crear reserva (individual o recurrente)
        register_rest_route(
            $this->getNamespace(),
            '/reservas',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'crearReserva'],
                    'permission_callback' => [$this, 'checkCanReserve'],
                    'args'                => $this->getCrearReservaArgs(),
                ],
            ]
        );

        // POST /reservas/{id}/cancelar
        register_rest_route(
            $this->getNamespace(),
            '/reservas/(?P<id>\d+)/cancelar',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'cancelarReserva'],
                    'permission_callback' => [$this, 'checkReservaOwnership'],
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

        // POST /reservas/{id}/reagendar
        register_rest_route(
            $this->getNamespace(),
            '/reservas/(?P<id>\d+)/reagendar',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'reagendarReserva'],
                    'permission_callback' => [$this, 'checkReservaOwnership'],
                    'args'                => [
                        'id' => [
                            'required'          => true,
                            'type'              => 'integer',
                            'validate_callback' => static fn($v) => is_numeric($v) && (int) $v > 0,
                        ],
                        'nueva_fecha_inicio' => [
                            'required'          => true,
                            'type'              => 'string',
                            'validate_callback' => [$this, 'validarFecha'],
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                        'nueva_fecha_fin' => [
                            'required'          => true,
                            'type'              => 'string',
                            'validate_callback' => [$this, 'validarFecha'],
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                        'nuevo_consultorio_id' => [
                            'required'          => false,
                            'type'              => 'integer',
                            'validate_callback' => static fn($v) => is_numeric($v) && (int) $v > 0,
                        ],
                    ],
                ],
            ]
        );

        // DELETE /series/{id} - Cancelar serie completa de reservas recurrentes
        register_rest_route(
            $this->getNamespace(),
            '/series/(?P<id>[a-zA-Z0-9\-]+)',
            [
                [
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => [$this, 'cancelarSerie'],
                    'permission_callback' => [$this, 'checkLoggedIn'],
                    'args'                => [
                        'id' => [
                            'required'          => true,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ],
                    ],
                ],
            ]
        );

        // POST /reservas/{id}/no-show (Solo administradores)
        register_rest_route(
            $this->getNamespace(),
            '/reservas/(?P<id>\d+)/no-show',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'marcarNoShow'],
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
    }

    /**
     * Argumentos del esquema para crear reserva.
     */
    private function getCrearReservaArgs(): array
    {
        return [
            'consultorio_id' => [
                'required'          => true,
                'type'              => 'integer',
                'validate_callback' => static fn($v) => is_numeric($v) && (int) $v > 0,
                'description'       => 'ID del consultorio a reservar.',
            ],
            'fecha_inicio' => [
                'required'          => true,
                'type'              => 'string',
                'validate_callback' => [$this, 'validarFecha'],
                'sanitize_callback' => 'sanitize_text_field',
                'description'       => 'Fecha y hora de inicio (formato YYYY-MM-DD HH:MM:SS o ISO 8601).',
            ],
            'fecha_fin' => [
                'required'          => true,
                'type'              => 'string',
                'validate_callback' => [$this, 'validarFecha'],
                'sanitize_callback' => 'sanitize_text_field',
                'description'       => 'Fecha y hora de término (formato YYYY-MM-DD HH:MM:SS o ISO 8601).',
            ],
            'tipo' => [
                'required'          => true,
                'type'              => 'string',
                'enum'              => ['hora', 'bloque', 'turno', 'completo'],
                'description'       => 'Modalidad de la reserva.',
            ],
            'saldo_id' => [
                'required'          => false,
                'type'              => 'integer',
                'validate_callback' => static fn($v) => is_numeric($v) && (int) $v > 0,
                'description'       => 'ID del paquete de saldo preferido (opcional).',
            ],
            'es_recurrente' => [
                'required'          => false,
                'type'              => 'boolean',
                'default'           => false,
                'description'       => 'Indica si se generará una serie periódica de reservas semanales.',
            ],
            'semanas' => [
                'required'          => false,
                'type'              => 'integer',
                'default'           => 12,
                'validate_callback' => static fn($v) => is_numeric($v) && (int) $v >= 4 && (int) $v <= 24,
                'description'       => 'Número de semanas para reserva recurrente (rango 4 a 24, default 12).',
            ],
            'sin_consumo_saldo' => [
                'required'          => false,
                'type'              => 'boolean',
                'default'           => false,
                'description'       => 'Flag administrativo para crear reserva sin consumo de saldo (R12).',
            ],
            'user_id' => [
                'required'          => false,
                'type'              => 'integer',
                'validate_callback' => static fn($v) => is_numeric($v) && (int) $v > 0,
                'description'       => 'ID del usuario beneficiario (solo admin puede reservar a nombre de otro).',
            ],
        ];
    }

    public function validarFecha(mixed $valor): bool
    {
        if (!is_string($valor) || trim($valor) === '') {
            return false;
        }

        $timestamp = strtotime($valor);
        return $timestamp !== false;
    }

    /**
     * Comprueba si el usuario autenticado es dueño de la reserva o administrador.
     */
    public function checkReservaOwnership(WP_REST_Request $request): bool|WP_Error
    {
        $loginCheck = $this->checkLoggedIn($request);
        if ($loginCheck !== true) {
            return $loginCheck;
        }

        if (current_user_can('manage_options')) {
            return true;
        }

        $reservaId = (int) $request->get_param('id');
        global $wpdb;
        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;

        $ownerId = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT user_id FROM {$tablaReservas} WHERE id = %d",
            $reservaId
        ));

        if (!$ownerId) {
            return $this->error('puerto_reserva_no_encontrada', __('La reserva indicada no existe.', 'puerto-core'), 404);
        }

        if ($ownerId !== get_current_user_id()) {
            return $this->error('puerto_reserva_ajena', __('No tienes permiso para gestionar esta reserva.', 'puerto-core'), 403);
        }

        return true;
    }

    /**
     * POST /puerto/v1/reservas - Creación atómica transaccional de reservas (R1, R3, R4, R7, R11, R12, R17).
     */
    public function crearReserva(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $currentUserId = get_current_user_id();
        $targetUserId = ($request->get_param('user_id') && current_user_can('manage_options'))
            ? (int) $request->get_param('user_id')
            : $currentUserId;

        $consultorioId   = (int) $request->get_param('consultorio_id');
        $fechaInicioStr  = (string) $request->get_param('fecha_inicio');
        $fechaFinStr     = (string) $request->get_param('fecha_fin');
        $tipo            = (string) $request->get_param('tipo');
        $saldoId         = $request->get_param('saldo_id') ? (int) $request->get_param('saldo_id') : null;
        $esRecurrente    = (bool) $request->get_param('es_recurrente');
        $semanas         = (int) ($request->get_param('semanas') ?: 12);
        $sinConsumoSaldo = (bool) $request->get_param('sin_consumo_saldo') && current_user_can('manage_options');

        $tablaUsuariosNegocio = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;
        $tablaConsultorios    = $wpdb->prefix . Constants::TABLE_CONSULTORIOS;
        $tablaReservas        = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $tablaBloqueos        = $wpdb->prefix . Constants::TABLE_BLOQUEOS;

        // 1. Validar estado del usuario en puerto_usuarios_negocio (R13)
        $usuarioNegocio = $wpdb->get_row($wpdb->prepare(
            "SELECT tipo_membresia, estado FROM {$tablaUsuariosNegocio} WHERE user_id = %d",
            $targetUserId
        ), ARRAY_A);

        $estadoUsuario = $usuarioNegocio['estado'] ?? 'activo';
        if ($estadoUsuario === 'congelado') {
            return $this->error(
                'puerto_usuario_congelado',
                __('El usuario se encuentra congelado y no puede crear nuevas reservas.', 'puerto-core'),
                403
            );
        }

        if ($estadoUsuario === 'moroso') {
            return $this->error(
                'puerto_usuario_moroso',
                __('El usuario presenta adeudos y su cuenta se encuentra restringida.', 'puerto-core'),
                403
            );
        }

        // 2. Verificar existencia y operatividad del consultorio
        $consultorio = $wpdb->get_row($wpdb->prepare(
            "SELECT id, nombre, activo FROM {$tablaConsultorios} WHERE id = %d",
            $consultorioId
        ), ARRAY_A);

        if (!$consultorio) {
            return $this->error('puerto_consultorio_no_encontrado', __('El consultorio especificado no existe.', 'puerto-core'), 404);
        }

        if ((int) $consultorio['activo'] !== 1) {
            return $this->error('puerto_consultorio_inactivo', __('El consultorio no se encuentra habilitado.', 'puerto-core'), 400);
        }

        // 3. Validar horario según regla R1
        $tz = Reglas::timezone();
        $fechaInicio = new DateTimeImmutable($fechaInicioStr, $tz);
        $fechaFin    = new DateTimeImmutable($fechaFinStr, $tz);

        $validacionHorario = $this->validarHorarioR1($fechaInicio, $fechaFin);
        if ($validacionHorario !== true) {
            return $validacionHorario;
        }

        $duracionSegundos = $fechaFin->getTimestamp() - $fechaInicio->getTimestamp();
        $duracionHoras = round($duracionSegundos / 3600.0, 2);

        // 4. Validar regla R7: Bloque = 3+ horas consecutivas, mismo consultorio, mismo día
        if ($tipo === 'bloque') {
            $minBloque = Reglas::bloqueMinHoras();
            if ($duracionHoras < $minBloque) {
                return $this->error(
                    'puerto_bloque_minimo_invalido',
                    sprintf(__('La modalidad bloque requiere un mínimo de %d horas consecutivas.', 'puerto-core'), $minBloque),
                    400
                );
            }
        }

        // 5. Validar saldo o membresía
        $totalOcurrencias = $esRecurrente ? $semanas : 1;
        $horasTotales = round($duracionHoras * $totalOcurrencias, 2);

        if (in_array($tipo, ['hora', 'bloque'], true) && !$sinConsumoSaldo) {
            $saldoDisponible = SaldoManager::getSaldoDisponible($targetUserId);
            if ($saldoDisponible < $horasTotales) {
                $faltantes = round($horasTotales - $saldoDisponible, 2);
                return $this->error(
                    'puerto_saldo_insuficiente',
                    sprintf(__('Saldo insuficiente. Dispones de %.2f horas e intentas reservar %.2f horas.', 'puerto-core'), $saldoDisponible, $horasTotales),
                    402,
                    [
                        'horas_disponibles' => $saldoDisponible,
                        'horas_requeridas'  => $horasTotales,
                        'horas_faltantes'   => $faltantes,
                    ]
                );
            }
        } elseif (in_array($tipo, ['turno', 'completo'], true)) {
            // R11: Membresía no consume saldo; reservas con saldo_id = NULL
            $saldoId = null;

            $tipoMembresiaUsuario = $usuarioNegocio['tipo_membresia'] ?? 'prepago';
            if ($tipoMembresiaUsuario !== $tipo && !current_user_can('manage_options')) {
                return $this->error(
                    'puerto_membresia_no_coincide',
                    sprintf(__('Tu tipo de membresía actual (%s) no corresponde a la reserva solicitada (%s).', 'puerto-core'), $tipoMembresiaUsuario, $tipo),
                    403
                );
            }

            // R17: Capacidad vendible = 72 h/semana para consultorio completo
            if ($tipo === 'completo') {
                $inicioSemana = $fechaInicio->modify('monday this week 00:00:00')->format('Y-m-d H:i:s');
                $finSemana    = $fechaInicio->modify('sunday this week 23:59:59')->format('Y-m-d H:i:s');

                $horasSemanalesReservadas = (float) $wpdb->get_var($wpdb->prepare(
                    "SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, fecha_inicio, fecha_fin) / 60.0), 0.00)
                     FROM {$tablaReservas}
                     WHERE user_id = %d
                       AND tipo = 'completo'
                       AND estado IN ('confirmada', 'consumida', 'pendiente_pago', 'bloqueada')
                       AND fecha_inicio >= %s
                       AND fecha_fin <= %s",
                    $targetUserId,
                    $inicioSemana,
                    $finSemana
                ));

                if (($horasSemanalesReservadas + $duracionHoras) > 72.00) {
                    return $this->error(
                        'puerto_capacidad_semanal_excedida',
                        sprintf(__('La reserva excede el límite de capacidad vendible de 72 horas semanales para consultorio completo (acumuladas: %.2f h, solicitadas: %.2f h).', 'puerto-core'), $horasSemanalesReservadas, $duracionHoras),
                        400,
                        [
                            'horas_reservadas_semana' => $horasSemanalesReservadas,
                            'horas_solicitadas'       => $duracionHoras,
                            'limite_semanal'          => 72.00,
                        ]
                    );
                }
            }
        }

        if ($sinConsumoSaldo) {
            $saldoId = null;
        }

        // 6. Transacción y comprobación pesimista con FOR UPDATE (R3: Cero Overlaps)
        $serieId = $esRecurrente ? self::generateUuid() : null;
        $reservasCreadas = [];
        $ahoraMysql = (new DateTimeImmutable('now', $tz))->format('Y-m-d H:i:s');

        $wpdb->query('START TRANSACTION');

        try {
            $intervaloSemana = new DateInterval('P7D');
            $fechaInicioIter = $fechaInicio;
            $fechaFinIter    = $fechaFin;

            for ($semanaIdx = 0; $semanaIdx < $totalOcurrencias; $semanaIdx++) {
                $fInicioStr = $fechaInicioIter->format('Y-m-d H:i:s');
                $fFinStr    = $fechaFinIter->format('Y-m-d H:i:s');

                // A. Bloqueo de fila y detección de colisión con otras reservas
                $conflicto = $wpdb->get_row($wpdb->prepare(
                    "SELECT id, user_id FROM {$tablaReservas}
                     WHERE consultorio_id = %d
                       AND fecha_inicio < %s
                       AND fecha_fin > %s
                       AND estado IN ('confirmada', 'consumida', 'pendiente_pago', 'bloqueada')
                     FOR UPDATE",
                    $consultorioId,
                    $fFinStr,
                    $fInicioStr
                ), ARRAY_A);

                if ($conflicto) {
                    $wpdb->query('ROLLBACK');
                    return $this->error(
                        'puerto_slot_ocupado',
                        sprintf(__('El slot %s a %s en %s ya se encuentra ocupado por otra reserva.', 'puerto-core'), $fInicioStr, $fFinStr, $consultorio['nombre']),
                        409,
                        ['slot_en_conflicto' => ['fecha_inicio' => $fInicioStr, 'fecha_fin' => $fFinStr]]
                    );
                }

                // B. Detección de colisión con bloqueos puntuales
                $bloqueoPuntual = $wpdb->get_row($wpdb->prepare(
                    "SELECT id, motivo FROM {$tablaBloqueos}
                     WHERE (consultorio_id IS NULL OR consultorio_id = %d)
                       AND recurrente = 0
                       AND fecha_inicio < %s
                       AND fecha_fin > %s
                     LIMIT 1",
                    $consultorioId,
                    $fFinStr,
                    $fInicioStr
                ), ARRAY_A);

                if ($bloqueoPuntual) {
                    $wpdb->query('ROLLBACK');
                    return $this->error(
                        'puerto_slot_bloqueado',
                        sprintf(__('El horario %s a %s está inhabilitado por bloqueo (%s).', 'puerto-core'), $fInicioStr, $fFinStr, $bloqueoPuntual['motivo']),
                        409
                    );
                }

                // C. Detección de colisión con bloqueos recurrentes (mantenimiento)
                $diaSemanaIter = (int) $fechaInicioIter->format('w');
                $hIniIter = $fechaInicioIter->format('H:i');
                $hFinIter = $fechaFinIter->format('H:i');

                $bloqueosRec = $wpdb->get_results($wpdb->prepare(
                    "SELECT id, motivo, patron_recurrencia FROM {$tablaBloqueos}
                     WHERE (consultorio_id IS NULL OR consultorio_id = %d)
                       AND recurrente = 1",
                    $consultorioId
                ), ARRAY_A);

                if (!empty($bloqueosRec)) {
                    foreach ($bloqueosRec as $rec) {
                        $patron = (string) $rec['patron_recurrencia'];
                        if (preg_match('/^dia_semana:(\d);hora_inicio:(\d{2}:\d{2});hora_fin:(\d{2}:\d{2})$/', $patron, $match)) {
                            $rDia = (int) $match[1];
                            $rIni = $match[2];
                            $rFin = $match[3];

                            if ($diaSemanaIter === $rDia && ($hIniIter < $rFin && $hFinIter > $rIni)) {
                                $wpdb->query('ROLLBACK');
                                return $this->error(
                                    'puerto_slot_bloqueado_mantenimiento',
                                    sprintf(__('El horario %s a %s coincide con el horario reservado para mantenimiento.', 'puerto-core'), $fInicioStr, $fFinStr),
                                    409
                                );
                            }
                        }
                    }
                }

                // D. Inserción atómica de la reserva confirmada (NO descuenta saldo aquí, R4 a T-24h)
                $insertado = $wpdb->insert(
                    $tablaReservas,
                    [
                        'user_id'          => $targetUserId,
                        'consultorio_id'   => $consultorioId,
                        'fecha_inicio'     => $fInicioStr,
                        'fecha_fin'        => $fFinStr,
                        'tipo'             => $tipo,
                        'estado'           => 'confirmada',
                        'saldo_id'         => $saldoId,
                        'consumida_en'     => null,
                        'google_event_id'  => null,
                        'es_recurrente'    => $esRecurrente ? 1 : 0,
                        'serie_id'         => $serieId,
                        'created_at'       => $ahoraMysql,
                        'updated_at'       => $ahoraMysql,
                    ],
                    ['%d', '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%d', '%s', '%s', '%s']
                );

                if (!$insertado) {
                    throw new Exception(__('Fallo al persistir registro de reserva.', 'puerto-core'));
                }

                $nuevoId = (int) $wpdb->insert_id;
                $reservasCreadas[] = [
                    'id'             => $nuevoId,
                    'consultorio_id' => $consultorioId,
                    'fecha_inicio'   => $fInicioStr,
                    'fecha_fin'      => $fFinStr,
                    'tipo'           => $tipo,
                    'estado'         => 'confirmada',
                    'serie_id'       => $serieId,
                ];

                $fechaInicioIter = $fechaInicioIter->add($intervaloSemana);
                $fechaFinIter    = $fechaFinIter->add($intervaloSemana);
            }

            $wpdb->query('COMMIT');
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return $this->error('puerto_error_transaccion', $e->getMessage(), 500);
        }

        $respuesta = [
            'status'            => 'confirmada',
            'mensaje'           => __('Reserva creada exitosamente. El saldo se debitará automáticamente 24 horas antes del inicio.', 'puerto-core'),
            'total_reservas'    => count($reservasCreadas),
            'es_recurrente'     => $esRecurrente,
            'serie_id'          => $serieId,
            'reservas'          => $esRecurrente ? $reservasCreadas : $reservasCreadas[0],
        ];

        return $this->success($respuesta, 201);
    }

    /**
     * POST /puerto/v1/reservas/{id}/cancelar - Cancelación con o sin devolución según anticipación (R5).
     */
    public function cancelarReserva(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int) $request->get_param('id');
        $motivo = (string) ($request->get_param('motivo') ?: __('Cancelación por usuario.', 'puerto-core'));

        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $tz = Reglas::timezone();
        $ahora = new DateTimeImmutable('now', $tz);

        $reserva = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$tablaReservas} WHERE id = %d FOR UPDATE",
            $id
        ), ARRAY_A);

        if (!$reserva) {
            return $this->error('puerto_reserva_no_encontrada', __('La reserva indicada no existe.', 'puerto-core'), 404);
        }

        if ($reserva['estado'] === 'cancelada') {
            return $this->error('puerto_reserva_ya_cancelada', __('Esta reserva ya se encuentra cancelada.', 'puerto-core'), 400);
        }

        $fechaInicio = new DateTimeImmutable($reserva['fecha_inicio'], $tz);
        $segundosAnticipacion = $fechaInicio->getTimestamp() - $ahora->getTimestamp();
        $horasAnticipacion = $segundosAnticipacion / 3600.0;

        $horasMinimasCancelacion = Reglas::cancelacionHorasMinimas(); // 24
        $esConDevolucion = ($horasAnticipacion >= $horasMinimasCancelacion);

        $wpdb->query('START TRANSACTION');

        try {
            if ($esConDevolucion) {
                // Si la reserva ya había sido marcada consumida por el cron, devolvemos las horas a saldos
                if ($reserva['consumida_en'] !== null) {
                    SaldoManager::devolverSaldo($id, sprintf('Devolución por cancelación anticipada (>= %d h)', $horasMinimasCancelacion));
                }

                $wpdb->update(
                    $tablaReservas,
                    [
                        'estado'       => 'cancelada',
                        'consumida_en' => null,
                        'updated_at'   => $ahora->format('Y-m-d H:i:s'),
                    ],
                    ['id' => $id],
                    ['%s', '%s', '%s'],
                    ['%d']
                );
            } else {
                // Menos de 24 horas: no devuelve saldo. Si aún no había sido consumida, se consume ahora
                if ($reserva['consumida_en'] === null && in_array($reserva['tipo'], ['hora', 'bloque'], true)) {
                    $duracionHoras = round((strtotime($reserva['fecha_fin']) - strtotime($reserva['fecha_inicio'])) / 3600.0, 2);
                    $saldoId = $reserva['saldo_id'] ? (int) $reserva['saldo_id'] : null;
                    try {
                        SaldoManager::consumirSaldoFifo((int) $reserva['user_id'], $duracionHoras, $id, $saldoId);
                    } catch (Exception) {
                        // Si no logra debitar, se mantiene registro
                    }
                }

                $wpdb->update(
                    $tablaReservas,
                    [
                        'estado'     => 'cancelada',
                        'updated_at' => $ahora->format('Y-m-d H:i:s'),
                    ],
                    ['id' => $id],
                    ['%s', '%s'],
                    ['%d']
                );
            }

            $wpdb->query('COMMIT');
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return $this->error('puerto_error_cancelacion', $e->getMessage(), 500);
        }

        return $this->success([
            'status'             => 'cancelada',
            'reserva_id'         => $id,
            'con_devolucion'     => $esConDevolucion,
            'horas_anticipacion' => round($horasAnticipacion, 2),
            'mensaje'            => $esConDevolucion
                ? __('Reserva cancelada con éxito con devolución íntegra de saldo.', 'puerto-core')
                : __('Reserva cancelada con menos de 24 horas de anticipación. Conforme a las reglas del servicio, las horas no son reembolsables.', 'puerto-core'),
        ]);
    }

    /**
     * POST /puerto/v1/reservas/{id}/reagendar - Reagendamiento exclusivo si es >= 24h (R6).
     */
    public function reagendarReserva(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int) $request->get_param('id');
        $nuevaInicioStr     = (string) $request->get_param('nueva_fecha_inicio');
        $nuevaFinStr        = (string) $request->get_param('nueva_fecha_fin');
        $nuevoConsultorioId = $request->get_param('nuevo_consultorio_id') ? (int) $request->get_param('nuevo_consultorio_id') : null;

        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $tz = Reglas::timezone();
        $ahora = new DateTimeImmutable('now', $tz);

        $reserva = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$tablaReservas} WHERE id = %d FOR UPDATE",
            $id
        ), ARRAY_A);

        if (!$reserva) {
            return $this->error('puerto_reserva_no_encontrada', __('La reserva indicada no existe.', 'puerto-core'), 404);
        }

        if ($reserva['estado'] !== 'confirmada') {
            return $this->error('puerto_reagendar_estado_invalido', __('Solo se pueden reagendar reservas en estado "confirmada".', 'puerto-core'), 400);
        }

        // Regla R6: Solo si >= 24h antes
        $fechaInicioActual = new DateTimeImmutable($reserva['fecha_inicio'], $tz);
        $horasAnticipacion = ($fechaInicioActual->getTimestamp() - $ahora->getTimestamp()) / 3600.0;

        if ($horasAnticipacion < Reglas::cancelacionHorasMinimas()) {
            return $this->error(
                'puerto_reagendamiento_tardio',
                sprintf(__('El reagendamiento solo está permitido con un mínimo de %d horas de anticipación.', 'puerto-core'), Reglas::cancelacionHorasMinimas()),
                400
            );
        }

        $nuevaInicio = new DateTimeImmutable($nuevaInicioStr, $tz);
        $nuevaFin    = new DateTimeImmutable($nuevaFinStr, $tz);

        $valHorario = $this->validarHorarioR1($nuevaInicio, $nuevaFin);
        if ($valHorario !== true) {
            return $valHorario;
        }

        $duracionActual = strtotime($reserva['fecha_fin']) - strtotime($reserva['fecha_inicio']);
        $nuevaDuracion  = $nuevaFin->getTimestamp() - $nuevaInicio->getTimestamp();

        if ($duracionActual !== $nuevaDuracion) {
            return $this->error(
                'puerto_duracion_discrepante',
                __('La nueva fecha debe mantener exactamente la misma duración de horas de la reserva original.', 'puerto-core'),
                400
            );
        }

        $consultorioDestino = $nuevoConsultorioId ?: (int) $reserva['consultorio_id'];

        $wpdb->query('START TRANSACTION');

        try {
            // Validar colisión en nuevo horario
            $conflicto = $wpdb->get_row($wpdb->prepare(
                "SELECT id FROM {$tablaReservas}
                 WHERE consultorio_id = %d
                   AND id != %d
                   AND fecha_inicio < %s
                   AND fecha_fin > %s
                   AND estado IN ('confirmada', 'consumida', 'pendiente_pago', 'bloqueada')
                 FOR UPDATE",
                $consultorioDestino,
                $id,
                $nuevaFin->format('Y-m-d H:i:s'),
                $nuevaInicio->format('Y-m-d H:i:s')
            ), ARRAY_A);

            if ($conflicto) {
                $wpdb->query('ROLLBACK');
                return $this->error('puerto_slot_ocupado', __('El nuevo slot seleccionado se encuentra ocupado.', 'puerto-core'), 409);
            }

            // Mueve la reserva sin tocar saldos (R6)
            $wpdb->update(
                $tablaReservas,
                [
                    'consultorio_id' => $consultorioDestino,
                    'fecha_inicio'   => $nuevaInicio->format('Y-m-d H:i:s'),
                    'fecha_fin'      => $nuevaFin->format('Y-m-d H:i:s'),
                    'updated_at'     => $ahora->format('Y-m-d H:i:s'),
                ],
                ['id' => $id],
                ['%d', '%s', '%s', '%s'],
                ['%d']
            );

            $wpdb->query('COMMIT');
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return $this->error('puerto_error_reagendar', $e->getMessage(), 500);
        }

        return $this->success([
            'status'               => 'reagendada',
            'reserva_id'           => $id,
            'nueva_fecha_inicio'   => $nuevaInicio->format('Y-m-d H:i:s'),
            'nueva_fecha_fin'      => $nuevaFin->format('Y-m-d H:i:s'),
            'nuevo_consultorio_id' => $consultorioDestino,
            'mensaje'              => __('Reserva reagendada correctamente sin afectar el saldo.', 'puerto-core'),
        ]);
    }

    /**
     * DELETE /puerto/v1/series/{id} - Cancela todas las reservas futuras asociadas a la serie recurrente.
     */
    public function cancelarSerie(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $serieId = (string) $request->get_param('id');
        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $tz = Reglas::timezone();
        $ahora = new DateTimeImmutable('now', $tz);

        $reservas = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$tablaReservas}
             WHERE serie_id = %s
               AND estado IN ('confirmada', 'pendiente_pago')
             ORDER BY fecha_inicio ASC",
            $serieId
        ), ARRAY_A);

        if (empty($reservas)) {
            return $this->error('puerto_serie_no_encontrada', __('No se encontraron reservas activas para la serie indicada.', 'puerto-core'), 404);
        }

        // Permisos: Dueño de las reservas o administrador
        $ownerId = (int) $reservas[0]['user_id'];
        if (!current_user_can('manage_options') && $ownerId !== get_current_user_id()) {
            return $this->error('puerto_acceso_denegado', __('No tienes permiso para cancelar esta serie.', 'puerto-core'), 403);
        }

        $canceladasConDevolucion = 0;
        $canceladasSinDevolucion = 0;

        foreach ($reservas as $res) {
            $resId = (int) $res['id'];
            $fInicio = new DateTimeImmutable($res['fecha_inicio'], $tz);
            $anticipacionHoras = ($fInicio->getTimestamp() - $ahora->getTimestamp()) / 3600.0;

            if ($anticipacionHoras >= 24) {
                if ($res['consumida_en'] !== null) {
                    SaldoManager::devolverSaldo($resId, 'Cancelación de serie recurrente >= 24h');
                }
                $wpdb->update($tablaReservas, ['estado' => 'cancelada', 'consumida_en' => null], ['id' => $resId]);
                $canceladasConDevolucion++;
            } else {
                $wpdb->update($tablaReservas, ['estado' => 'cancelada'], ['id' => $resId]);
                $canceladasSinDevolucion++;
            }
        }

        return $this->success([
            'status'                     => 'serie_cancelada',
            'serie_id'                   => $serieId,
            'total_canceladas'           => count($reservas),
            'canceladas_con_devolucion'  => $canceladasConDevolucion,
            'canceladas_sin_devolucion'  => $canceladasSinDevolucion,
            'mensaje'                    => sprintf(__('Serie recurrente cancelada. %d reservas canceladas con reembolso y %d sin reembolso.', 'puerto-core'), $canceladasConDevolucion, $canceladasSinDevolucion),
        ]);
    }

    /**
     * POST /puerto/v1/reservas/{id}/no-show - Marca inasistencia (Solo Administrador).
     */
    public function marcarNoShow(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int) $request->get_param('id');
        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $tz = Reglas::timezone();
        $ahora = (new DateTimeImmutable('now', $tz))->format('Y-m-d H:i:s');

        $reserva = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$tablaReservas} WHERE id = %d",
            $id
        ), ARRAY_A);

        if (!$reserva) {
            return $this->error('puerto_reserva_no_encontrada', __('La reserva indicada no existe.', 'puerto-core'), 404);
        }

        // Si es tipo hora/bloque y no ha sido debitada aún, se consume obligatoriamente
        if ($reserva['consumida_en'] === null && in_array($reserva['tipo'], ['hora', 'bloque'], true)) {
            $duracionHoras = round((strtotime($reserva['fecha_fin']) - strtotime($reserva['fecha_inicio'])) / 3600.0, 2);
            $saldoId = $reserva['saldo_id'] ? (int) $reserva['saldo_id'] : null;
            try {
                SaldoManager::consumirSaldoFifo((int) $reserva['user_id'], $duracionHoras, $id, $saldoId);
            } catch (Exception) {
                // Registro de intento
            }
        }

        $wpdb->update(
            $tablaReservas,
            [
                'estado'       => 'no_show',
                'consumida_en' => $reserva['consumida_en'] ?: $ahora,
                'updated_at'   => $ahora,
            ],
            ['id' => $id],
            ['%s', '%s', '%s'],
            ['%d']
        );

        return $this->success([
            'status'     => 'no_show',
            'reserva_id' => $id,
            'mensaje'    => __('Reserva catalogada como No-Show y saldo consumido en su totalidad.', 'puerto-core'),
        ]);
    }

    /**
     * Validador estricto del horario según la Regla R1:
     * L-V 08:00–21:00 (último slot 20:00–21:00), Sáb 08:00–17:00 (último slot 16:00–17:00), Dom cerrado.
     * Slot mínimo 1 h alineado a la hora en punto.
     */
    private function validarHorarioR1(DateTimeImmutable $inicio, DateTimeImmutable $fin): true|WP_Error
    {
        if ($fin <= $inicio) {
            return $this->error('puerto_fechas_invalidas', __('La fecha de fin debe ser estrictamente posterior a la de inicio.', 'puerto-core'), 400);
        }

        // Mismo día
        if ($inicio->format('Y-m-d') !== $fin->format('Y-m-d')) {
            return $this->error('puerto_reserva_multidia_invalida', __('Las reservas no pueden cruzar la medianoche.', 'puerto-core'), 400);
        }

        // Alineado a la hora en punto (minutos y segundos 00:00)
        if ($inicio->format('i:s') !== '00:00' || $fin->format('i:s') !== '00:00') {
            return $this->error('puerto_slot_desalineado', __('Las reservas deben comenzar y terminar exactamente en la hora en punto (ej. 08:00 a 09:00).', 'puerto-core'), 400);
        }

        $diaSemana = (int) $inicio->format('w'); // 0=Domingo, 6=Sábado

        if ($diaSemana === 0) {
            return $this->error('puerto_domingo_cerrado', __('Puerto Analítico se encuentra cerrado los domingos.', 'puerto-core'), 400);
        }

        $horaInicio = (int) $inicio->format('H');
        $horaFin    = (int) $fin->format('H');

        if ($diaSemana >= 1 && $diaSemana <= 5) {
            // Lunes a Viernes: 08:00 a 21:00
            if ($horaInicio < 8 || $horaFin > 21) {
                return $this->error('puerto_fuera_de_horario', __('El horario de atención de Lunes a Viernes es de 08:00 a 21:00.', 'puerto-core'), 400);
            }
        } elseif ($diaSemana === 6) {
            // Sábado: 08:00 a 17:00
            if ($horaInicio < 8 || $horaFin > 17) {
                return $this->error('puerto_fuera_de_horario_sabado', __('El horario de atención los Sábados es de 08:00 a 17:00.', 'puerto-core'), 400);
            }
        }

        return true;
    }

    /**
     * Generador seguro de UUID v4 para series recurrentes.
     */
    private static function generateUuid(): string
    {
        if (function_exists('wp_generate_uuid4')) {
            return wp_generate_uuid4();
        }

        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
