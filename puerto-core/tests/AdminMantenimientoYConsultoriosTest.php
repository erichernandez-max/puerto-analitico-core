<?php
declare(strict_types=1);

namespace PuertoCore\Tests;

use PHPUnit\Framework\TestCase;
use PuertoCore\Config\Constants;
use PuertoCore\Database\Seeders\ConsultoriosSeeder;
use PuertoCore\Rest\AdminController;
use PuertoCore\Rest\ConsultoriosController;
use WP_REST_Request;

/**
 * Pruebas unitarias para el endpoint de configuración de mantenimiento y capacities de consultorios.
 */
final class AdminMantenimientoYConsultoriosTest extends TestCase
{
    private AdminController $adminController;
    private ConsultoriosController $consultoriosController;

    protected function setUp(): void
    {
        parent::setUp();
        global $wpdb;
        $wpdb->reset();

        ConsultoriosSeeder::seed();

        $this->adminController = new AdminController();
        $this->consultoriosController = new ConsultoriosController();

        $GLOBALS['puerto_current_user_id'] = 1;
        $GLOBALS['puerto_current_user_caps'] = ['manage_options' => true, 'puerto_reservar' => true];
    }

    /**
     * Verifica que POST /admin/mantenimiento guarda el registro recurrente con formato exacto:
     * dia_semana:X;hora_inicio:HH:mm;hora_fin:HH:mm
     */
    public function testConfigurarMantenimientoGuardaFormatoExacto(): void
    {
        global $wpdb;

        $req = new WP_REST_Request('POST', '/admin/mantenimiento');
        $req->set_param('consultorio_id', 1);
        $req->set_param('dia_semana', 1); // Lunes
        $req->set_param('hora_inicio', '14:00');
        $req->set_param('hora_fin', '16:00');

        $res = $this->adminController->configurarMantenimiento($req);
        $this->assertEquals(201, $res->get_status());
        $data = $res->get_data();

        $this->assertEquals('dia_semana:1;hora_inicio:14:00;hora_fin:16:00', $data['data']['patron_recurrencia']);

        // Verificar persistencia en base de datos
        $tablaBloqueos = $wpdb->prefix . Constants::TABLE_BLOQUEOS;
        $bloqueo = $wpdb->get_row("SELECT * FROM {$tablaBloqueos} WHERE consultorio_id = 1 AND motivo = 'mantenimiento'", ARRAY_A);

        $this->assertNotNull($bloqueo);
        $this->assertEquals(1, (int) $bloqueo['recurrente']);
        $this->assertEquals('dia_semana:1;hora_inicio:14:00;hora_fin:16:00', $bloqueo['patron_recurrencia']);
    }

    /**
     * Verifica que GET /consultorios devuelve las nuevas capacidades F2:
     * capacidad_fisica_semanal_horas: 74, capacidad_max_semanal_horas: 72, horas_mantenimiento_semanal: 2
     * y los indicadores de ocupación física y vendible.
     */
    public function testGetConsultoriosDevuelveCapacidadesF2(): void
    {
        $req = new WP_REST_Request('GET', '/consultorios');
        $res = $this->consultoriosController->getConsultorios($req);

        $this->assertEquals(200, $res->get_status());
        $consultorios = $res->get_data()['data'];

        $this->assertCount(5, $consultorios, 'Deben existir los 5 consultorios base.');

        foreach ($consultorios as $c) {
            $this->assertEquals(74, $c['capacidad_fisica_semanal_horas'], 'La capacidad física semanal debe ser 74.');
            $this->assertEquals(72, $c['capacidad_max_semanal_horas'], 'La capacidad vendible semanal debe ser 72.');
            $this->assertEquals(2, $c['horas_mantenimiento_semanal'], 'Las horas semanales de mantenimiento deben ser 2.');

            $disp = $c['disponibilidad_semanal'];
            $this->assertArrayHasKey('porcentaje_ocupacion_fisica', $disp);
            $this->assertArrayHasKey('porcentaje_ocupacion_vendible', $disp);
            $this->assertArrayHasKey('horas_disponibles_fisicas', $disp);
            $this->assertArrayHasKey('horas_disponibles', $disp);
        }
    }
}
