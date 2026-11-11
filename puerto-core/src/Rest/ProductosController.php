<?php
declare(strict_types=1);

namespace PuertoCore\Rest;

use PuertoCore\Config\Constants;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Endpoint REST para la consulta pública del catálogo de productos y tarifas.
 */
class ProductosController extends RestController
{
    public function registerRoutes(): void
    {
        register_rest_route(
            $this->getNamespace(),
            '/productos',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getProductos'],
                    'permission_callback' => [$this, 'checkPublic'],
                ],
            ]
        );
    }

    /**
     * Devuelve todos los productos y paquetes activos para reserva.
     */
    public function getProductos(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $tablaProductos = $wpdb->prefix . Constants::TABLE_PRODUCTOS;

        $productos = $wpdb->get_results(
            "SELECT id, nombre, tipo, horas_incluidas, precio, descuento_pct, 
                    vigencia_meses, requiere_disponibilidad_consecutiva, activo 
             FROM {$tablaProductos} 
             WHERE activo = 1 
             ORDER BY precio ASC, id ASC",
            ARRAY_A
        );

        if (empty($productos)) {
            return $this->success([]);
        }

        $formateados = array_map(static function (array $item): array {
            return [
                'id'                                 => (int) $item['id'],
                'nombre'                             => (string) $item['nombre'],
                'tipo'                               => (string) $item['tipo'],
                'horas_incluidas'                    => (float) $item['horas_incluidas'],
                'precio'                             => (float) $item['precio'],
                'descuento_pct'                      => (float) $item['descuento_pct'],
                'vigencia_meses'                     => (int) $item['vigencia_meses'],
                'requiere_disponibilidad_consecutiva'=> (bool) $item['requiere_disponibilidad_consecutiva'],
                'activo'                             => (bool) $item['activo'],
            ];
        }, $productos);

        return $this->success($formateados);
    }
}
