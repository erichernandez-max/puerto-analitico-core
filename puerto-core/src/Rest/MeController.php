<?php
declare(strict_types=1);

namespace PuertoCore\Rest;

use DateTimeImmutable;
use PuertoCore\Auth\RolesAndCapabilities;
use PuertoCore\Config\Constants;
use PuertoCore\Config\Reglas;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Endpoints REST asociados a la sesión del usuario actual (/me, /me/saldos, /me/reservas).
 */
class MeController extends RestController
{
    public function registerRoutes(): void
    {
        // GET /me
        register_rest_route(
            $this->getNamespace(),
            '/me',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getPerfil'],
                    'permission_callback' => [$this, 'checkLoggedIn'],
                ],
            ]
        );

        // GET /me/saldos
        register_rest_route(
            $this->getNamespace(),
            '/me/saldos',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getSaldos'],
                    'permission_callback' => [$this, 'checkLoggedIn'],
                ],
            ]
        );

        // GET /me/reservas?desde=&hasta=
        register_rest_route(
            $this->getNamespace(),
            '/me/reservas',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getReservas'],
                    'permission_callback' => [$this, 'checkLoggedIn'],
                    'args'                => [
                        'desde' => [
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                            'description'       => 'Fecha inicial en formato YYYY-MM-DD o ISO8601',
                        ],
                        'hasta' => [
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                            'description'       => 'Fecha final en formato YYYY-MM-DD o ISO8601',
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
    }

    /**
     * Obtiene el perfil completo del usuario autenticado y su estado en el negocio.
     */
    public function getPerfil(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $userId = get_current_user_id();
        $wpUser = wp_get_current_user();

        $tablaUsuariosNegocio = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;

        $usuarioNegocio = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT tipo_membresia, estado, fecha_alta, notas 
                 FROM {$tablaUsuariosNegocio} 
                 WHERE user_id = %d",
                $userId
            ),
            ARRAY_A
        );

        // Si el usuario aún no tiene registro en usuarios_negocio, inicializarlo con valores por defecto
        if (!$usuarioNegocio) {
            $fechaAlta = current_time('mysql');
            $tipoMembresia = 'prepago';
            $estado = 'activo';

            $wpdb->insert(
                $tablaUsuariosNegocio,
                [
                    'user_id'        => $userId,
                    'tipo_membresia' => $tipoMembresia,
                    'estado'         => $estado,
                    'fecha_alta'     => $fechaAlta,
                    'notas'          => null,
                ],
                ['%d', '%s', '%s', '%s', '%s']
            );

            $usuarioNegocio = [
                'tipo_membresia' => $tipoMembresia,
                'estado'         => $estado,
                'fecha_alta'     => $fechaAlta,
                'notas'          => null,
            ];
        }

        $datos = [
            'id'             => $userId,
            'username'       => $wpUser->user_login,
            'nombre'         => $wpUser->display_name,
            'email'          => $wpUser->user_email,
            'roles'          => (array) $wpUser->roles,
            'tipo_membresia' => (string) $usuarioNegocio['tipo_membresia'],
            'estado'         => (string) $usuarioNegocio['estado'],
            'fecha_alta'     => (string) $usuarioNegocio['fecha_alta'],
            'notas'          => $usuarioNegocio['notas'] ? (string) $usuarioNegocio['notas'] : null,
            'puede_reservar' => RolesAndCapabilities::canReserve($userId) && $usuarioNegocio['estado'] === 'activo',
        ];

        return $this->success($datos);
    }

    /**
     * Obtiene los saldos vigentes del usuario actual con horas disponibles.
     */
    public function getSaldos(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $userId = get_current_user_id();
        $tablaSaldos    = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaProductos = $wpdb->prefix . Constants::TABLE_PRODUCTOS;

        $query = $wpdb->prepare(
            "SELECT s.id, s.producto_id, s.horas_compradas, s.horas_consumidas, 
                    s.fecha_compra, s.fecha_vencimiento, s.estado, s.renovado_por_compra_id,
                    p.nombre as producto_nombre, p.tipo as producto_tipo
             FROM {$tablaSaldos} s
             LEFT JOIN {$tablaProductos} p ON p.id = s.producto_id
             WHERE s.user_id = %d 
               AND s.estado = 'vigente'
               AND (s.horas_compradas - s.horas_consumidas) > 0
               AND s.fecha_vencimiento >= NOW()
             ORDER BY s.fecha_vencimiento ASC",
            $userId
        );

        $saldos = $wpdb->get_results($query, ARRAY_A);

        $totalDisponibles = 0.00;
        $items = [];

        if (!empty($saldos)) {
            $tz = Reglas::timezone();
            $ahora = new DateTimeImmutable('now', $tz);

            foreach ($saldos as $fila) {
                $compradas   = (float) $fila['horas_compradas'];
                $consumidas  = (float) $fila['horas_consumidas'];
                $disponibles = max(0.00, round($compradas - $consumidas, 2));
                $totalDisponibles += $disponibles;

                $fechaVenc = new DateTimeImmutable((string) $fila['fecha_vencimiento'], $tz);
                $diasRestantes = (int) $ahora->diff($fechaVenc)->format('%r%a');

                $items[] = [
                    'id'                     => (int) $fila['id'],
                    'producto_id'            => (int) $fila['producto_id'],
                    'producto_nombre'        => $fila['producto_nombre'] ? (string) $fila['producto_nombre'] : null,
                    'producto_tipo'          => $fila['producto_tipo'] ? (string) $fila['producto_tipo'] : null,
                    'horas_compradas'        => $compradas,
                    'horas_consumidas'       => $consumidas,
                    'horas_disponibles'      => $disponibles,
                    'fecha_compra'           => (string) $fila['fecha_compra'],
                    'fecha_vencimiento'      => (string) $fila['fecha_vencimiento'],
                    'dias_para_vencer'       => max(0, $diasRestantes),
                    'estado'                 => (string) $fila['estado'],
                    'renovado_por_compra_id' => $fila['renovado_por_compra_id'] ? (int) $fila['renovado_por_compra_id'] : null,
                ];
            }
        }

        return $this->success([
            'saldos'  => $items,
            'resumen' => [
                'total_horas_disponibles'    => round($totalDisponibles, 2),
                'paquetes_vigentes_cantidad' => count($items),
            ],
        ]);
    }

    /**
     * Obtiene el listado de reservas del usuario actual, con filtros opcionales de fecha y estado.
     */
    public function getReservas(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $userId = get_current_user_id();
        $tablaReservas     = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $tablaConsultorios = $wpdb->prefix . Constants::TABLE_CONSULTORIOS;

        $desde  = $request->get_param('desde');
        $hasta  = $request->get_param('hasta');
        $estado = $request->get_param('estado');

        $whereClauses = ["r.user_id = %d"];
        $params = [$userId];

        if (!empty($desde)) {
            $whereClauses[] = "r.fecha_inicio >= %s";
            $params[] = date('Y-m-d 00:00:00', strtotime((string) $desde));
        }

        if (!empty($hasta)) {
            $whereClauses[] = "r.fecha_fin <= %s";
            $params[] = date('Y-m-d 23:59:59', strtotime((string) $hasta));
        }

        if (!empty($estado)) {
            $whereClauses[] = "r.estado = %s";
            $params[] = sanitize_text_field((string) $estado);
        }

        $whereSql = implode(' AND ', $whereClauses);

        $sql = "SELECT r.id, r.user_id, r.consultorio_id, r.fecha_inicio, r.fecha_fin, 
                       r.tipo, r.estado, r.saldo_id, r.google_event_id, r.es_recurrente, 
                       r.serie_id, r.created_at, r.updated_at,
                       c.nombre as consultorio_nombre, c.color as consultorio_color
                FROM {$tablaReservas} r
                LEFT JOIN {$tablaConsultorios} c ON c.id = r.consultorio_id
                WHERE {$whereSql}
                ORDER BY r.fecha_inicio DESC";

        $preparedQuery = $wpdb->prepare($sql, ...$params);
        $reservas = $wpdb->get_results($preparedQuery, ARRAY_A);

        if (empty($reservas)) {
            return $this->success([]);
        }

        $formateadas = array_map(static function (array $r): array {
            return [
                'id'                 => (int) $r['id'],
                'user_id'            => (int) $r['user_id'],
                'consultorio'        => [
                    'id'     => (int) $r['consultorio_id'],
                    'nombre' => (string) ($r['consultorio_nombre'] ?? ''),
                    'color'  => (string) ($r['consultorio_color'] ?? '#2E7D32'),
                ],
                'fecha_inicio'       => (string) $r['fecha_inicio'],
                'fecha_fin'          => (string) $r['fecha_fin'],
                'tipo'               => (string) $r['tipo'],
                'estado'             => (string) $r['estado'],
                'saldo_id'           => $r['saldo_id'] ? (int) $r['saldo_id'] : null,
                'google_event_id'    => $r['google_event_id'] ? (string) $r['google_event_id'] : null,
                'es_recurrente'      => (bool) $r['es_recurrente'],
                'serie_id'           => $r['serie_id'] ? (int) $r['serie_id'] : null,
                'created_at'         => (string) $r['created_at'],
                'updated_at'         => (string) $r['updated_at'],
            ];
        }, $reservas);

        return $this->success($formateadas);
    }
}
