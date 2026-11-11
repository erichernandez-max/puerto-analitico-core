<?php
declare(strict_types=1);

namespace PuertoCore\Tests;

use PHPUnit\Framework\TestCase;
use PuertoCore\Config\Constants;
use PuertoCore\Database\Seeders\ConsultoriosSeeder;
use PuertoCore\Disponibilidad;

/**
 * Pruebas unitarias para el motor de disponibilidad (R1, R17: 74h físicas, 72h vendibles).
 */
final class DisponibilidadTest extends TestCase
{
    private Disponibilidad $disponibilidad;

    protected function setUp(): void
    {
        parent::setUp();
        global $wpdb;
        $wpdb->reset();

        // Sembrar consultorios
        ConsultoriosSeeder::seed();

        $this->disponibilidad = new Disponibilidad();
    }

    /**
     * Verifica que una semana completa (Lunes a Domingo) genera exactamente 74 slots físicos:
     * Lunes a Viernes: 13 slots diarios (08:00 a 21:00; último inicio 20:00) * 5 = 65 slots.
     * Sábado: 9 slots (08:00 a 17:00; último inicio 16:00) = 9 slots.
     * Domingo: 0 slots (cerrado).
     * Total = 74 slots físicos.
     */
    public function testSlotsLibresGenera74HorasFisicasPorSemana(): void
    {
        // Semana del Lunes 2026-11-16 al Domingo 2026-11-22
        $slots = $this->disponibilidad->slotsLibres(1, '2026-11-16', '2026-11-22');

        $this->assertCount(74, $slots, 'El total de slots físicos semanales debe ser exactamente 74.');

        $disponibles = array_filter($slots, static fn($s) => $s['disponible'] === true);
        $this->assertCount(74, $disponibles, 'Sin bloqueos ni reservas, los 74 slots físicos deben estar disponibles.');

        // Verificar que ningún slot cae en domingo
        foreach ($slots as $slot) {
            $diaSemana = (int) date('w', strtotime($slot['fecha']));
            $this->assertNotEquals(0, $diaSemana, 'No debe haber slots agendables en Domingo.');
        }
    }

    /**
     * Verifica que al registrar el bloqueo recurrente de mantenimiento de 2 horas semanales,
     * la disponibilidad vendible resultante es de exactamente 72 horas (74 - 2 h de mantenimiento).
     */
    public function testSlotsDevueltosConMantenimientoSon72HorasVendibles(): void
    {
        global $wpdb;

        // Registrar bloqueo recurrente de mantenimiento de 2 horas (Lunes 14:00 a 16:00)
        $tablaBloqueos = $wpdb->prefix . Constants::TABLE_BLOQUEOS;
        $wpdb->insert($tablaBloqueos, [
            'consultorio_id'     => 1,
            'fecha_inicio'       => '2026-01-01 00:00:00',
            'fecha_fin'          => '2099-12-31 23:59:59',
            'motivo'             => 'mantenimiento',
            'recurrente'         => 1,
            'patron_recurrencia' => 'dia_semana:1;hora_inicio:14:00;hora_fin:16:00', // 1=Lunes, 2h de 14:00 a 16:00
            'created_by'         => 1,
            'created_at'         => '2026-11-10 12:00:00',
        ]);

        // Semana del Lunes 2026-11-16 al Domingo 2026-11-22
        $slots = $this->disponibilidad->slotsLibres(1, '2026-11-16', '2026-11-22');

        $this->assertCount(74, $slots, 'El total de slots físicos debe seguir siendo 74.');

        $disponibles = array_filter($slots, static fn($s) => $s['disponible'] === true);
        $bloqueadosMantenimiento = array_filter($slots, static fn($s) => $s['disponible'] === false && $s['motivo_no_disponible'] === 'mantenimiento');

        $this->assertCount(2, $bloqueadosMantenimiento, 'Deben bloquearse exactamente 2 slots por mantenimiento.');
        $this->assertCount(72, $disponibles, 'Deben quedar exactamente 72 slots vendibles (74 físicos - 2h mantenimiento).');
    }

    /**
     * Verifica que consultar únicamente un día Domingo devuelve 0 slots (R1).
     */
    public function testDomingoCerradoDevuelveCeroSlots(): void
    {
        // Domingo 2026-11-22
        $slots = $this->disponibilidad->slotsLibres(1, '2026-11-22', '2026-11-22');
        $this->assertEmpty($slots, 'El domingo debe devolver una lista vacía de slots agendables.');
    }
}
