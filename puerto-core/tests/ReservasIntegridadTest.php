<?php
declare(strict_types=1);

namespace PuertoCore\Tests;

use DateTimeImmutable;
use PHPUnit\Framework\TestCase;
use PuertoCore\Config\Constants;
use PuertoCore\Config\Reglas;
use PuertoCore\Cron\CronManager;
use PuertoCore\Database\Seeders\ConsultoriosSeeder;
use PuertoCore\Rest\ReservasController;
use PuertoCore\Services\SaldoManager;
use WP_REST_Request;

/**
 * Suite de pruebas de integridad transaccional para Puerto Analítico Core (F2).
 * Cubre: Overlap (409), Saldo insuficiente (402), Cancelación con/sin devolución (R5),
 * Consumo idempotente por cron, Expiración de saldo y protección de usuarios congelados (R13),
 * Recurrencia, Congelamiento, Membresías sin consumo y límite vendible de 72h/semana (R17).
 */
final class ReservasIntegridadTest extends TestCase
{
    private ReservasController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        global $wpdb;
        $wpdb->reset();

        // Sembrar consultorios y reglas iniciales
        ConsultoriosSeeder::seed();

        $this->controller = new ReservasController();

        // Configurar usuario activo por defecto
        $GLOBALS['puerto_current_user_id'] = 10;
        $GLOBALS['puerto_current_user_caps'] = ['puerto_reservar' => true, 'manage_options' => true];

        $tablaUsuarios = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;
        $wpdb->insert($tablaUsuarios, [
            'user_id'        => 10,
            'tipo_membresia' => 'prepago',
            'estado'         => 'activo',
            'fecha_alta'     => '2026-01-01 00:00:00',
        ]);
    }

    /**
     * 1. Overlap (Doble booking bloqueado con HTTP 409 slot_ocupado).
     */
    public function testOverlapPrevieneDobleBookingCon409(): void
    {
        global $wpdb;

        // Añadir 10 horas de saldo vigentes al usuario
        $tablaSaldos = $wpdb->prefix . Constants::TABLE_SALDOS;
        $wpdb->insert($tablaSaldos, [
            'user_id'           => 10,
            'producto_id'       => 1,
            'horas_compradas'   => 10.00,
            'horas_consumidas'  => 0.00,
            'fecha_compra'      => '2026-11-01 00:00:00',
            'fecha_vencimiento' => '2027-05-01 00:00:00',
            'estado'            => 'vigente',
        ]);

        // Primera reserva: Lunes 16 de Noviembre de 10:00 a 11:00
        $req1 = new WP_REST_Request('POST', '/reservas');
        $req1->set_param('consultorio_id', 1);
        $req1->set_param('fecha_inicio', '2026-11-16 10:00:00');
        $req1->set_param('fecha_fin', '2026-11-16 11:00:00');
        $req1->set_param('tipo', 'hora');

        $res1 = $this->controller->crearReserva($req1);
        $this->assertEquals(201, $res1->get_status(), 'La primera reserva debe crearse exitosamente.');

        // Segunda reserva en exactamente el mismo slot
        $req2 = new WP_REST_Request('POST', '/reservas');
        $req2->set_param('consultorio_id', 1);
        $req2->set_param('fecha_inicio', '2026-11-16 10:00:00');
        $req2->set_param('fecha_fin', '2026-11-16 11:00:00');
        $req2->set_param('tipo', 'hora');

        $res2 = $this->controller->crearReserva($req2);
        $this->assertInstanceOf(\WP_Error::class, $res2);
        $this->assertEquals('puerto_slot_ocupado', $res2->get_error_code());
        $this->assertEquals(409, $res2->get_error_data()['status'] ?? 0);
    }

    /**
     * 2. Saldo Insuficiente (Rechazo con HTTP 402 y detalle de horas faltantes).
     */
    public function testSaldoInsuficienteDevuelve402ConDetalle(): void
    {
        // Usuario 10 tiene 0 horas de saldo vigentes
        $req = new WP_REST_Request('POST', '/reservas');
        $req->set_param('consultorio_id', 1);
        $req->set_param('fecha_inicio', '2026-11-16 09:00:00');
        $req->set_param('fecha_fin', '2026-11-16 11:00:00'); // 2 horas solicitadas
        $req->set_param('tipo', 'hora');

        $res = $this->controller->crearReserva($req);
        $this->assertInstanceOf(\WP_Error::class, $res);
        $this->assertEquals('puerto_saldo_insuficiente', $res->get_error_code());

        $errorData = $res->get_error_data();
        $this->assertEquals(402, $errorData['status'] ?? 0);
        $this->assertEquals(0.00, $errorData['horas_disponibles'] ?? -1);
        $this->assertEquals(2.00, $errorData['horas_requeridas'] ?? -1);
        $this->assertEquals(2.00, $errorData['horas_faltantes'] ?? -1);
    }

    /**
     * 3. Cancelación con y sin devolución (Regla R5: >= 24h devuelve, < 24h no devuelve).
     */
    public function testCancelacionConYSinDevolucionSegunAnticipacion(): void
    {
        global $wpdb;

        $tablaSaldos = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;

        // Saldo inicial: 5 horas compradas, 2 consumidas
        $wpdb->insert($tablaSaldos, [
            'id'                => 101,
            'user_id'           => 10,
            'producto_id'       => 1,
            'horas_compradas'   => 5.00,
            'horas_consumidas'  => 2.00,
            'fecha_compra'      => '2026-11-01 00:00:00',
            'fecha_vencimiento' => '2027-05-01 00:00:00',
            'estado'            => 'vigente',
        ]);

        // A. Reserva con >= 24h de anticipación (ej. dentro de 5 días)
        $tz = Reglas::timezone();
        $fechaFuturaLejana = (new DateTimeImmutable('now', $tz))->modify('+5 days 10:00:00')->format('Y-m-d H:i:s');
        $fechaFuturaLejanaFin = (new DateTimeImmutable('now', $tz))->modify('+5 days 12:00:00')->format('Y-m-d H:i:s');

        $wpdb->insert($tablaReservas, [
            'id'             => 201,
            'user_id'        => 10,
            'consultorio_id' => 1,
            'fecha_inicio'   => $fechaFuturaLejana,
            'fecha_fin'      => $fechaFuturaLejanaFin,
            'tipo'           => 'hora',
            'estado'         => 'confirmada',
            'saldo_id'       => 101,
            'consumida_en'   => '2026-11-10 10:00:00', // Marcada consumida
            'created_at'     => '2026-11-10 10:00:00',
            'updated_at'     => '2026-11-10 10:00:00',
        ]);

        // Registrar movimiento de consumo previo
        $tablaMovimientos = $wpdb->prefix . Constants::TABLE_MOVIMIENTOS;
        $wpdb->insert($tablaMovimientos, [
            'user_id'    => 10,
            'saldo_id'   => 101,
            'reserva_id' => 201,
            'tipo'       => 'consumo',
            'horas'      => 2.00,
            'motivo'     => 'Consumo previo',
            'created_at' => '2026-11-10 10:00:00',
        ]);

        $cancelReq1 = new WP_REST_Request('POST', '/reservas/201/cancelar');
        $cancelReq1->set_param('id', 201);
        $resCancel1 = $this->controller->cancelarReserva($cancelReq1);

        $this->assertEquals(200, $resCancel1->get_status());
        $data1 = $resCancel1->get_data();
        $this->assertTrue($data1['data']['con_devolucion'], 'Con >= 24h debe efectuarse devolución.');

        // Verificar que las 2 horas consumidas fueron reintegradas a horas_consumidas = 0
        $saldoActualizado = $wpdb->get_row("SELECT horas_consumidas FROM {$tablaSaldos} WHERE id = 101", ARRAY_A);
        $this->assertEquals(0.00, (float) $saldoActualizado['horas_consumidas'], 'El saldo consumido debe ser 0.00 tras devolución.');

        // B. Reserva con < 24h de anticipación (ej. dentro de 2 horas)
        $fechaFuturaCercana = (new DateTimeImmutable('now', $tz))->modify('+2 hours')->format('Y-m-d H:i:s');
        $fechaFuturaCercanaFin = (new DateTimeImmutable('now', $tz))->modify('+3 hours')->format('Y-m-d H:i:s');

        $wpdb->insert($tablaReservas, [
            'id'             => 202,
            'user_id'        => 10,
            'consultorio_id' => 1,
            'fecha_inicio'   => $fechaFuturaCercana,
            'fecha_fin'      => $fechaFuturaCercanaFin,
            'tipo'           => 'hora',
            'estado'         => 'confirmada',
            'saldo_id'       => 101,
            'consumida_en'   => null,
            'created_at'     => '2026-11-10 10:00:00',
            'updated_at'     => '2026-11-10 10:00:00',
        ]);

        $cancelReq2 = new WP_REST_Request('POST', '/reservas/202/cancelar');
        $cancelReq2->set_param('id', 202);
        $resCancel2 = $this->controller->cancelarReserva($cancelReq2);

        $this->assertEquals(200, $resCancel2->get_status());
        $data2 = $resCancel2->get_data();
        $this->assertFalse($data2['data']['con_devolucion'], 'Con < 24h NO debe haber devolución.');
    }

    /**
     * 4. Consumo idempotente por Cron horario (R4 a T-24h y consumida_en IS NULL).
     */
    public function testConsumoSaldoIdempotentePorCron(): void
    {
        global $wpdb;

        $tablaSaldos = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;

        // Saldo de 10 horas
        $wpdb->insert($tablaSaldos, [
            'id'                => 301,
            'user_id'           => 10,
            'producto_id'       => 1,
            'horas_compradas'   => 10.00,
            'horas_consumidas'  => 0.00,
            'fecha_compra'      => '2026-11-01 00:00:00',
            'fecha_vencimiento' => '2027-05-01 00:00:00',
            'estado'            => 'vigente',
        ]);

        // Reserva ubicada a exactamente T+24 horas (dentro de la ventana [NOW+23h, NOW+25h])
        $tz = Reglas::timezone();
        $inicioT24 = (new DateTimeImmutable('now', $tz))->modify('+24 hours 00 minutes')->format('Y-m-d H:i:s');
        $finT24    = (new DateTimeImmutable('now', $tz))->modify('+25 hours 00 minutes')->format('Y-m-d H:i:s');

        $wpdb->insert($tablaReservas, [
            'id'             => 401,
            'user_id'        => 10,
            'consultorio_id' => 1,
            'fecha_inicio'   => $inicioT24,
            'fecha_fin'      => $finT24,
            'tipo'           => 'hora',
            'estado'         => 'confirmada',
            'saldo_id'       => 301,
            'consumida_en'   => null, // Pendiente de consumo
            'created_at'     => '2026-11-10 10:00:00',
            'updated_at'     => '2026-11-10 10:00:00',
        ]);

        // Primera ejecución del cron: debe consumir 1 hora
        $resultado1 = CronManager::ejecutarConsumoSaldo();
        $this->assertEquals(1, $resultado1['procesadas'], 'Debe procesar exactamente 1 reserva.');

        $saldoPost1 = $wpdb->get_row("SELECT horas_consumidas FROM {$tablaSaldos} WHERE id = 301", ARRAY_A);
        $this->assertEquals(1.00, (float) $saldoPost1['horas_consumidas'], 'Debe haber consumido 1 hora de saldo.');

        $reservaPost1 = $wpdb->get_row("SELECT estado, consumida_en FROM {$tablaReservas} WHERE id = 401", ARRAY_A);
        $this->assertEquals('consumida', $reservaPost1['estado']);
        $this->assertNotNull($reservaPost1['consumida_en'], 'consumida_en debe tener timestamp.');

        // Segunda ejecución inmediata del cron: IDEMPOTENCIA (no debe volver a debitar)
        $resultado2 = CronManager::ejecutarConsumoSaldo();
        $this->assertEquals(0, $resultado2['procesadas'], 'La segunda ejecución no debe reprocesar la misma reserva.');

        $saldoPost2 = $wpdb->get_row("SELECT horas_consumidas FROM {$tablaSaldos} WHERE id = 301", ARRAY_A);
        $this->assertEquals(1.00, (float) $saldoPost2['horas_consumidas'], 'El saldo consumido no debe duplicarse.');
    }

    /**
     * 5. Expiración de Saldo (R9) y Protección de Usuarios Congelados (R13).
     */
    public function testExpiracionSaldosYProteccionUsuarioCongelado(): void
    {
        global $wpdb;

        $tablaSaldos = $wpdb->prefix . Constants::TABLE_SALDOS;
        $tablaUsuarios = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;

        // Usuario 20: Activo con saldo vencido hace 2 días
        $wpdb->insert($tablaUsuarios, [
            'user_id' => 20,
            'estado'  => 'activo',
        ]);
        $wpdb->insert($tablaSaldos, [
            'id'                => 501,
            'user_id'           => 20,
            'producto_id'       => 1,
            'horas_compradas'   => 5.00,
            'horas_consumidas'  => 1.00,
            'fecha_compra'      => '2026-04-01 00:00:00',
            'fecha_vencimiento' => '2026-10-01 00:00:00', // Ya vencido
            'estado'            => 'vigente',
        ]);

        // Usuario 30: Congelado (R13) con saldo con fecha vencida
        $wpdb->insert($tablaUsuarios, [
            'user_id' => 30,
            'estado'  => 'congelado',
        ]);
        $wpdb->insert($tablaSaldos, [
            'id'                => 502,
            'user_id'           => 30,
            'producto_id'       => 1,
            'horas_compradas'   => 10.00,
            'horas_consumidas'  => 0.00,
            'fecha_compra'      => '2026-04-01 00:00:00',
            'fecha_vencimiento' => '2026-10-01 00:00:00', // Vencido pero protegido por congelamiento
            'estado'            => 'vigente',
        ]);

        // Ejecutar cron de expiración de saldos
        $resExpiracion = CronManager::ejecutarExpiracionSaldos();

        $this->assertEquals(1, $resExpiracion['expirados'], 'Solo debe expirar el saldo del usuario activo.');
        $this->assertEquals(4.00, $resExpiracion['horas_totales'], 'Deben haber expirado 4 horas restantes.');

        // Saldo de usuario 20 pasa a 'vencido'
        $saldo20 = $wpdb->get_row("SELECT estado FROM {$tablaSaldos} WHERE id = 501", ARRAY_A);
        $this->assertEquals('vencido', $saldo20['estado']);

        // Saldo de usuario congelado (30) se mantiene 'vigente' (Regla R13)
        $saldo30 = $wpdb->get_row("SELECT estado FROM {$tablaSaldos} WHERE id = 502", ARRAY_A);
        $this->assertEquals('vigente', $saldo30['estado'], 'El saldo de un usuario congelado no debe expirar.');
    }

    /**
     * 6. Recurrencia (Generación de N reservas con serie_id UUID y cancelación en lote).
     */
    public function testReservaRecurrenteYCancelacionDeSerie(): void
    {
        global $wpdb;

        // Asignar saldo de 20 horas al usuario
        $tablaSaldos = $wpdb->prefix . Constants::TABLE_SALDOS;
        $wpdb->insert($tablaSaldos, [
            'user_id'           => 10,
            'producto_id'       => 1,
            'horas_compradas'   => 20.00,
            'horas_consumidas'  => 0.00,
            'fecha_compra'      => '2026-11-01 00:00:00',
            'fecha_vencimiento' => '2027-05-01 00:00:00',
            'estado'            => 'vigente',
        ]);

        // Crear serie de 4 semanas
        $req = new WP_REST_Request('POST', '/reservas');
        $req->set_param('consultorio_id', 2);
        $req->set_param('fecha_inicio', '2026-11-17 11:00:00'); // Martes 11:00 a 12:00
        $req->set_param('fecha_fin', '2026-11-17 12:00:00');
        $req->set_param('tipo', 'hora');
        $req->set_param('es_recurrente', true);
        $req->set_param('semanas', 4);

        $res = $this->controller->crearReserva($req);
        $this->assertEquals(201, $res->get_status());
        $data = $res->get_data();

        $this->assertEquals(4, $data['data']['total_reservas']);
        $serieId = $data['data']['serie_id'];
        $this->assertNotEmpty($serieId);

        // Cancelar serie completa con DELETE /series/{id}
        $delReq = new WP_REST_Request('DELETE', "/series/{$serieId}");
        $delReq->set_param('id', $serieId);
        $delRes = $this->controller->cancelarSerie($delReq);

        $this->assertEquals(200, $delRes->get_status());
        $delData = $delRes->get_data();
        $this->assertEquals(4, $delData['data']['total_canceladas']);
    }

    /**
     * 7. Congelamiento (Usuario congelado no puede crear reservas - HTTP 403).
     */
    public function testUsuarioCongeladoRechazadoCon403(): void
    {
        global $wpdb;

        $tablaUsuarios = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;
        $wpdb->update($tablaUsuarios, ['estado' => 'congelado'], ['user_id' => 10]);

        $req = new WP_REST_Request('POST', '/reservas');
        $req->set_param('consultorio_id', 1);
        $req->set_param('fecha_inicio', '2026-11-18 09:00:00');
        $req->set_param('fecha_fin', '2026-11-18 10:00:00');
        $req->set_param('tipo', 'hora');

        $res = $this->controller->crearReserva($req);
        $this->assertInstanceOf(\WP_Error::class, $res);
        $this->assertEquals('puerto_usuario_congelado', $res->get_error_code());
        $this->assertEquals(403, $res->get_error_data()['status'] ?? 0);
    }

    /**
     * 8. Membresía sin consumo de saldo (R11: saldo_id = NULL).
     */
    public function testMembresiaNoConsumeSaldoYRegistraSaldoIdNull(): void
    {
        global $wpdb;

        $tablaUsuarios = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;
        $wpdb->update($tablaUsuarios, ['tipo_membresia' => 'turno', 'estado' => 'activo'], ['user_id' => 10]);

        $req = new WP_REST_Request('POST', '/reservas');
        $req->set_param('consultorio_id', 3);
        $req->set_param('fecha_inicio', '2026-11-19 08:00:00');
        $req->set_param('fecha_fin', '2026-11-19 12:00:00');
        $req->set_param('tipo', 'turno');

        $res = $this->controller->crearReserva($req);
        $this->assertEquals(201, $res->get_status());

        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;
        $creada = $wpdb->get_row("SELECT tipo, saldo_id FROM {$tablaReservas} WHERE consultorio_id = 3", ARRAY_A);

        $this->assertEquals('turno', $creada['tipo']);
        $this->assertNull($creada['saldo_id'], 'La reserva de membresía debe tener saldo_id = NULL.');
    }

    /**
     * 9. Límite semanal de Membresía Completa (Rechaza reservas > 72 h/semana - R17).
     */
    public function testMembresiaCompletaRechazaExcesoDe72HorasSemanales(): void
    {
        global $wpdb;

        $tablaUsuarios = $wpdb->prefix . Constants::TABLE_USUARIOS_NEGOCIO;
        $wpdb->update($tablaUsuarios, ['tipo_membresia' => 'completo', 'estado' => 'activo'], ['user_id' => 10]);

        $tablaReservas = $wpdb->prefix . Constants::TABLE_RESERVAS;

        // Simular que el usuario ya tiene 70 horas reservadas en la semana del 16 al 22 de Noviembre
        $wpdb->insert($tablaReservas, [
            'user_id'        => 10,
            'consultorio_id' => 4,
            'fecha_inicio'   => '2026-11-16 08:00:00',
            'fecha_fin'      => '2026-11-16 21:00:00', // 13h
            'tipo'           => 'completo',
            'estado'         => 'confirmada',
        ]);
        $wpdb->insert($tablaReservas, [
            'user_id'        => 10,
            'consultorio_id' => 4,
            'fecha_inicio'   => '2026-11-17 08:00:00',
            'fecha_fin'      => '2026-11-17 21:00:00', // 13h (acum: 26h)
            'tipo'           => 'completo',
            'estado'         => 'confirmada',
        ]);
        $wpdb->insert($tablaReservas, [
            'user_id'        => 10,
            'consultorio_id' => 4,
            'fecha_inicio'   => '2026-11-18 08:00:00',
            'fecha_fin'      => '2026-11-18 21:00:00', // 13h (acum: 39h)
            'tipo'           => 'completo',
            'estado'         => 'confirmada',
        ]);
        $wpdb->insert($tablaReservas, [
            'user_id'        => 10,
            'consultorio_id' => 4,
            'fecha_inicio'   => '2026-11-19 08:00:00',
            'fecha_fin'      => '2026-11-19 21:00:00', // 13h (acum: 52h)
            'tipo'           => 'completo',
            'estado'         => 'confirmada',
        ]);
        $wpdb->insert($tablaReservas, [
            'user_id'        => 10,
            'consultorio_id' => 4,
            'fecha_inicio'   => '2026-11-20 08:00:00',
            'fecha_fin'      => '2026-11-20 21:00:00', // 13h (acum: 65h)
            'tipo'           => 'completo',
            'estado'         => 'confirmada',
        ]);
        $wpdb->insert($tablaReservas, [
            'user_id'        => 10,
            'consultorio_id' => 4,
            'fecha_inicio'   => '2026-11-21 08:00:00',
            'fecha_fin'      => '2026-11-21 14:00:00', // 6h (acum: 71h)
            'tipo'           => 'completo',
            'estado'         => 'confirmada',
        ]);

        // Intentar reservar 2 horas más en el mismo sábado (71 + 2 = 73 h > 72 h límite)
        $req = new WP_REST_Request('POST', '/reservas');
        $req->set_param('consultorio_id', 4);
        $req->set_param('fecha_inicio', '2026-11-21 14:00:00');
        $req->set_param('fecha_fin', '2026-11-21 16:00:00'); // 2h solicitadas
        $req->set_param('tipo', 'completo');

        $res = $this->controller->crearReserva($req);
        $this->assertInstanceOf(\WP_Error::class, $res);
        $this->assertEquals('puerto_capacidad_semanal_excedida', $res->get_error_code());

        $errData = $res->get_error_data();
        $this->assertEquals(72.00, $errData['limite_semanal']);
        $this->assertEquals(71.00, $errData['horas_reservadas_semana']);
    }
}
