<?php
declare(strict_types=1);

namespace PuertoCore\Tests;

use PHPUnit\Framework\TestCase;
use PuertoCore\Config\Constants;
use PuertoCore\Database\Seeders\ConsultoriosSeeder;
use PuertoCore\Rest\DisponibilidadController;
use WP_REST_Request;

/**
 * Pruebas unitarias para el controlador REST de disponibilidad (F3).
 */
final class DisponibilidadControllerTest extends TestCase
{
    private DisponibilidadController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        global $wpdb;
        $wpdb->reset();

        ConsultoriosSeeder::seed();
        $this->controller = new DisponibilidadController();

        $GLOBALS['puerto_current_user_id'] = 10;
        $GLOBALS['puerto_current_user_caps'] = ['puerto_reservar' => true];
    }

    public function testGetDisponibilidadRetornaSlotsExitosamente(): void
    {
        $request = new WP_REST_Request('GET', '/puerto/v1/disponibilidad');
        $request->set_param('consultorio_id', 1);
        $request->set_param('fecha_desde', '2026-11-16');
        $request->set_param('fecha_hasta', '2026-11-21');

        $response = $this->controller->getDisponibilidad($request);

        $this->assertEquals(200, $response->get_status());
        $data = $response->get_data();

        $this->assertTrue($data['success']);
        $this->assertIsArray($data['data']);
        $this->assertNotEmpty($data['data']);

        $primerSlot = $data['data'][0];
        $this->assertArrayHasKey('fecha', $primerSlot);
        $this->assertArrayHasKey('hora_inicio', $primerSlot);
        $this->assertArrayHasKey('hora_fin', $primerSlot);
        $this->assertArrayHasKey('disponible', $primerSlot);
        $this->assertArrayHasKey('motivo_no_disponible', $primerSlot);
    }

    public function testGetDisponibilidadValidaParametros(): void
    {
        // Sin consultorio_id
        $request = new WP_REST_Request('GET', '/puerto/v1/disponibilidad');
        $request->set_param('consultorio_id', 0);
        $request->set_param('fecha_desde', '2026-11-16');
        $request->set_param('fecha_hasta', '2026-11-21');

        $error = $this->controller->getDisponibilidad($request);
        $this->assertInstanceOf(\WP_Error::class, $error);
        $this->assertEquals(400, $error->get_error_data()['status']);
        $this->assertEquals('puerto_rest_invalid_consultorio', $error->get_error_code());

        // Rango invertido
        $request = new WP_REST_Request('GET', '/puerto/v1/disponibilidad');
        $request->set_param('consultorio_id', 1);
        $request->set_param('fecha_desde', '2026-11-21');
        $request->set_param('fecha_hasta', '2026-11-16');

        $error = $this->controller->getDisponibilidad($request);
        $this->assertInstanceOf(\WP_Error::class, $error);
        $this->assertEquals('puerto_rest_invalid_range', $error->get_error_code());
    }

    public function testGetDisponibilidadReflejaReservasOcupadas(): void
    {
        global $wpdb;

        // Insertar una reserva activa el 2026-11-16 de 10:00 a 11:00
        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $wpdb->insert($tablaReservas, [
            'user_id'        => 10,
            'consultorio_id' => 1,
            'fecha_inicio'   => '2026-11-16 10:00:00',
            'fecha_fin'      => '2026-11-16 11:00:00',
            'tipo'           => 'hora_suelta',
            'estado'         => 'confirmada',
            'creado_en'      => '2026-11-10 12:00:00',
        ]);

        $request = new WP_REST_Request('GET', '/puerto/v1/disponibilidad');
        $request->set_param('consultorio_id', 1);
        $request->set_param('fecha_desde', '2026-11-16');
        $request->set_param('fecha_hasta', '2026-11-16');

        $response = $this->controller->getDisponibilidad($request);
        $data = $response->get_data();

        $slots = $data['data'];
        $slot10a11 = null;
        foreach ($slots as $s) {
            if ($s['hora_inicio'] === '10:00' && $s['hora_fin'] === '11:00') {
                $slot10a11 = $s;
                break;
            }
        }

        $this->assertNotNull($slot10a11);
        $this->assertFalse($slot10a11['disponible'], 'El slot reservado debe marcarse como no disponible.');
        $this->assertEquals('reserva_existente', $slot10a11['motivo_no_disponible']);
    }
}
