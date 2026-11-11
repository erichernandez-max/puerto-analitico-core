<?php
declare(strict_types=1);

namespace PuertoCore\Endpoints;

use PuertoCore\Rest\DisponibilidadController as RestDisponibilidadController;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Alias de compatibilidad para el controlador de disponibilidad.
 */
class DisponibilidadController extends RestDisponibilidadController
{
}
